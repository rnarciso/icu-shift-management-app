const { User, Doctor, Qualification, DoctorQualification } = require('../models');
const { ApiError } = require('../middleware/error.middleware');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Get user profile information
 * @route GET /api/users/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find user by id
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'role', 'created_at', 'updated_at', 'last_login_at']
    });

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    // Get additional user data based on role
    let additionalData = {};
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ 
        where: { user_id: userId },
        attributes: ['id', 'name', 'crm_number', 'crm_state', 'specialty_id', 'experience_years', 'bio']
      });
      
      if (doctor) {
        // Get doctor qualifications
        const qualifications = await DoctorQualification.findAll({
          where: { doctor_id: doctor.id },
          include: [{ model: Qualification, attributes: ['id', 'name', 'description'] }]
        });
        
        additionalData = { 
          doctor,
          qualifications: qualifications.map(q => q.Qualification)
        };
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        ...additionalData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile information
 * @route PUT /api/users/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { email, currentPassword, newPassword, ...doctorData } = req.body;

    // Find user by id
    const user = await User.findByPk(userId);

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    // Update user data
    const updateData = {};
    
    // Update email if provided
    if (email && email !== user.email) {
      // Check if email is already in use
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return next(new ApiError('Email already in use', 400));
      }
      updateData.email = email;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return next(new ApiError('Current password is incorrect', 401));
      }
      updateData.password = newPassword;
    }

    // Update user if there are changes
    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
    }

    // Update doctor data if user is a doctor
    if (user.role === 'doctor' && Object.keys(doctorData).length > 0) {
      const doctor = await Doctor.findOne({ where: { user_id: userId } });
      
      if (doctor) {
        // Filter out undefined values
        const filteredDoctorData = Object.fromEntries(
          Object.entries(doctorData).filter(([_, v]) => v !== undefined)
        );
        
        if (Object.keys(filteredDoctorData).length > 0) {
          await doctor.update(filteredDoctorData);
        }
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update doctor qualifications
 * @route PUT /api/users/qualifications
 */
exports.updateQualifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { qualifications } = req.body;

    // Check if user is a doctor
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'doctor') {
      return next(new ApiError('User is not a doctor', 403));
    }

    // Find doctor by user id
    const doctor = await Doctor.findOne({ where: { user_id: userId } });
    if (!doctor) {
      return next(new ApiError('Doctor profile not found', 404));
    }

    // Validate qualifications
    if (!Array.isArray(qualifications)) {
      return next(new ApiError('Qualifications must be an array', 400));
    }

    // Get existing qualifications
    const existingQualifications = await DoctorQualification.findAll({
      where: { doctor_id: doctor.id }
    });

    // Create a set of existing qualification IDs
    const existingQualificationIds = new Set(
      existingQualifications.map(q => q.qualification_id)
    );

    // Create a set of new qualification IDs
    const newQualificationIds = new Set(qualifications);

    // Qualifications to add
    const qualificationsToAdd = [...newQualificationIds].filter(
      id => !existingQualificationIds.has(id)
    );

    // Qualifications to remove
    const qualificationsToRemove = [...existingQualificationIds].filter(
      id => !newQualificationIds.has(id)
    );

    // Start a transaction
    const transaction = await require('../models').sequelize.transaction();

    try {
      // Add new qualifications
      for (const qualificationId of qualificationsToAdd) {
        // Check if qualification exists
        const qualification = await Qualification.findByPk(qualificationId);
        if (!qualification) {
          throw new ApiError(`Qualification with ID ${qualificationId} not found`, 400);
        }

        await DoctorQualification.create({
          doctor_id: doctor.id,
          qualification_id: qualificationId
        }, { transaction });
      }

      // Remove qualifications
      if (qualificationsToRemove.length > 0) {
        await DoctorQualification.destroy({
          where: {
            doctor_id: doctor.id,
            qualification_id: {
              [Op.in]: qualificationsToRemove
            }
          },
          transaction
        });
      }

      // Commit transaction
      await transaction.commit();

      res.status(200).json({
        status: 'success',
        message: 'Qualifications updated successfully',
        data: {
          added: qualificationsToAdd.length,
          removed: qualificationsToRemove.length
        }
      });
    } catch (error) {
      // Rollback transaction
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin only)
 * @route GET /api/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Filter parameters
    const { role, search, active } = req.query;
    const where = {};

    // Apply filters
    if (role) {
      where.role = role;
    }

    if (active !== undefined) {
      where.is_active = active === 'true';
    }

    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Get users with pagination
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'email', 'role', 'is_active', 'created_at', 'last_login_at'],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    // Get doctor information for doctor users
    const doctorUserIds = users
      .filter(user => user.role === 'doctor')
      .map(user => user.id);

    let doctors = [];
    if (doctorUserIds.length > 0) {
      doctors = await Doctor.findAll({
        where: {
          user_id: {
            [Op.in]: doctorUserIds
          }
        },
        attributes: ['id', 'user_id', 'name', 'crm_number', 'crm_state']
      });
    }

    // Map doctors to users
    const doctorsByUserId = doctors.reduce((acc, doctor) => {
      acc[doctor.user_id] = doctor;
      return acc;
    }, {});

    // Enhance user data with doctor information
    const enhancedUsers = users.map(user => {
      const userData = user.toJSON();
      if (user.role === 'doctor' && doctorsByUserId[user.id]) {
        userData.doctor = doctorsByUserId[user.id];
      }
      return userData;
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      status: 'success',
      data: {
        users: enhancedUsers,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (admin only)
 * @route GET /api/users/:id
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find user by id
    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'role', 'is_active', 'created_at', 'updated_at', 'last_login_at']
    });

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    // Get additional user data based on role
    let additionalData = {};
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ 
        where: { user_id: id },
        attributes: ['id', 'name', 'crm_number', 'crm_state', 'specialty_id', 'experience_years', 'bio']
      });
      
      if (doctor) {
        // Get doctor qualifications
        const qualifications = await DoctorQualification.findAll({
          where: { doctor_id: doctor.id },
          include: [{ model: Qualification, attributes: ['id', 'name', 'description'] }]
        });
        
        additionalData = { 
          doctor,
          qualifications: qualifications.map(q => q.Qualification)
        };
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        ...additionalData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user (admin only)
 * @route POST /api/users
 */
exports.createUser = async (req, res, next) => {
  try {
    const { email, password, role, name, crm_number, crm_state, specialty_id, experience_years, bio } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new ApiError('Email already in use', 400));
    }

    // Start a transaction
    const transaction = await require('../models').sequelize.transaction();

    try {
      // Create user
      const user = await User.create({
        email,
        password,
        role,
        is_active: true
      }, { transaction });

      // If role is doctor, create doctor profile
      if (role === 'doctor') {
        // Check if doctor with CRM already exists
        const existingDoctor = await Doctor.findOne({ 
          where: { 
            crm_number,
            crm_state
          } 
        });
        
        if (existingDoctor) {
          throw new ApiError('Doctor with this CRM already exists', 400);
        }

        // Create doctor profile
        await Doctor.create({
          user_id: user.id,
          name,
          crm_number,
          crm_state,
          specialty_id,
          experience_years,
          bio,
          is_active: true
        }, { transaction });
      }

      // Commit transaction
      await transaction.commit();

      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      // Rollback transaction
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (admin only)
 * @route PUT /api/users/:id
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, password, role, is_active, name, crm_number, crm_state, specialty_id, experience_years, bio } = req.body;

    // Find user by id
    const user = await User.findByPk(id);

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    // Start a transaction
    const transaction = await require('../models').sequelize.transaction();

    try {
      // Update user data
      const updateData = {};
      
      // Update email if provided and different
      if (email && email !== user.email) {
        // Check if email is already in use by another user
        const existingUser = await User.findOne({ 
          where: { 
            email,
            id: { [Op.ne]: id }
          } 
        });
        
        if (existingUser) {
          throw new ApiError('Email already in use', 400);
        }
        
        updateData.email = email;
      }

      // Update password if provided
      if (password) {
        updateData.password = password;
      }

      // Update role if provided
      if (role) {
        updateData.role = role;
      }

      // Update active status if provided
      if (is_active !== undefined) {
        updateData.is_active = is_active;
      }

      // Update user if there are changes
      if (Object.keys(updateData).length > 0) {
        await user.update(updateData, { transaction });
      }

      // Handle doctor data
      if (role === 'doctor' || user.role === 'doctor') {
        let doctor = await Doctor.findOne({ where: { user_id: id } });
        
        // If changing to doctor role and no doctor profile exists
        if (role === 'doctor' && !doctor) {
          // Check if doctor with CRM already exists
          if (crm_number && crm_state) {
            const existingDoctor = await Doctor.findOne({ 
              where: { 
                crm_number,
                crm_state
              } 
            });
            
            if (existingDoctor) {
              throw new ApiError('Doctor with this CRM already exists', 400);
            }
          }

          // Create doctor profile
          await Doctor.create({
            user_id: id,
            name: name || 'Doctor',
            crm_number: crm_number || '',
            crm_state: crm_state || '',
            specialty_id: specialty_id || null,
            experience_years: experience_years || 0,
            bio: bio || '',
            is_active: true
          }, { transaction });
        } 
        // If doctor profile exists, update it
        else if (doctor) {
          const doctorUpdateData = {};
          
          if (name) doctorUpdateData.name = name;
          if (crm_number) {
            // Check if CRM is already in use by another doctor
            if (crm_number !== doctor.crm_number || crm_state !== doctor.crm_state) {
              const existingDoctor = await Doctor.findOne({ 
                where: { 
                  crm_number,
                  crm_state,
                  id: { [Op.ne]: doctor.id }
                } 
              });
              
              if (existingDoctor) {
                throw new ApiError('Doctor with this CRM already exists', 400);
              }
            }
            
            doctorUpdateData.crm_number = crm_number;
          }
          if (crm_state) doctorUpdateData.crm_state = crm_state;
          if (specialty_id) doctorUpdateData.specialty_id = specialty_id;
          if (experience_years !== undefined) doctorUpdateData.experience_years = experience_years;
          if (bio !== undefined) doctorUpdateData.bio = bio;
          
          // Update doctor if there are changes
          if (Object.keys(doctorUpdateData).length > 0) {
            await doctor.update(doctorUpdateData, { transaction });
          }
        }
      }

      // Commit transaction
      await transaction.commit();

      res.status(200).json({
        status: 'success',
        message: 'User updated successfully'
      });
    } catch (error) {
      // Rollback transaction
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (admin only)
 * @route DELETE /api/users/:id
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find user by id
    const user = await User.findByPk(id);

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    // Check if trying to delete self
    if (req.user.id === id) {
      return next(new ApiError('Cannot delete your own account', 400));
    }

    // Start a transaction
    const transaction = await require('../models').sequelize.transaction();

    try {
      // Soft delete by setting is_active to false
      await user.update({ is_active: false }, { transaction });

      // If user is a doctor, also deactivate doctor profile
      if (user.role === 'doctor') {
        const doctor = await Doctor.findOne({ where: { user_id: id } });
        if (doctor) {
          await doctor.update({ is_active: false }, { transaction });
        }
      }

      // Commit transaction
      await transaction.commit();

      res.status(200).json({
        status: 'success',
        message: 'User deactivated successfully'
      });
    } catch (error) {
      // Rollback transaction
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};