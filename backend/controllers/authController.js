const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Doctor } = require('../models');
const { ApiError } = require('../middleware/error.middleware');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, crm_number, crm_state, specialty } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new ApiError('Email already in use', 400));
    }

    // Check if doctor with CRM already exists
    const existingDoctor = await Doctor.findOne({ 
      where: { 
        crm_number,
        crm_state
      } 
    });
    if (existingDoctor) {
      return next(new ApiError('Doctor with this CRM already exists', 400));
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with doctor role by default
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      role: 'doctor',
      is_active: true
    });

    // Create doctor profile
    const doctor = await Doctor.create({
      user_id: user.id,
      name,
      crm_number,
      crm_state,
      email,
      specialty_id: specialty,
      is_active: true
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Return user data and tokens
    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        doctor: {
          id: doctor.id,
          name: doctor.name,
          crm_number: doctor.crm_number,
          crm_state: doctor.crm_state
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password', 'role', 'is_active', 'failed_login_attempts', 'last_login_at']
    });

    // Check if user exists
    if (!user) {
      return next(new ApiError('Invalid credentials', 401));
    }

    // Check if user is active
    if (!user.is_active) {
      return next(new ApiError('Account is deactivated. Please contact administrator', 401));
    }

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.update({
        failed_login_attempts: (user.failed_login_attempts || 0) + 1
      });
      
      return next(new ApiError('Invalid credentials', 401));
    }

    // Reset failed login attempts and update last login
    await user.update({
      failed_login_attempts: 0,
      last_login_at: new Date()
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Get additional user data based on role
    let additionalData = {};
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ where: { user_id: user.id } });
      if (doctor) {
        additionalData = {
          doctor: {
            id: doctor.id,
            name: doctor.name,
            crm_number: doctor.crm_number,
            crm_state: doctor.crm_state
          }
        };
      }
    }

    // Return user data and tokens
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        ...additionalData,
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 * @route POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new ApiError('Refresh token is required', 400));
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = require('../utils/jwt').verifyRefreshToken(refreshToken);
    } catch (error) {
      return next(new ApiError('Invalid or expired refresh token', 401));
    }

    // Find user by id
    const user = await User.findByPk(decoded.id);

    // Check if user exists and is active
    if (!user || !user.is_active) {
      return next(new ApiError('User not found or deactivated', 401));
    }

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Return new tokens
    res.status(200).json({
      status: 'success',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    // In a stateless JWT authentication system, the client is responsible for
    // discarding the tokens. The server can't invalidate tokens directly.
    // For a more secure implementation, we could maintain a blacklist of tokens
    // or implement a token revocation mechanism.

    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // Always return success response even if user doesn't exist for security
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({
        status: 'success',
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to user
    await user.update({
      reset_password_token: resetToken,
      reset_password_expires: resetTokenExpiry
    });

    // In a real application, send an email with the reset token
    // For this implementation, we'll just return the token in the response
    logger.info(`Password reset token generated for user: ${user.id}`);

    res.status(200).json({
      status: 'success',
      message: 'If your email is registered, you will receive a password reset link',
      // In production, don't include the token in the response
      // This is just for development/testing purposes
      data: {
        resetToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Find user by reset token and check if token is still valid
    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return next(new ApiError('Invalid or expired reset token', 400));
    }

    // Update password and clear reset token
    await user.update({
      password,
      reset_password_token: null,
      reset_password_expires: null
    });

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 * @route GET /api/auth/profile
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
        additionalData = { doctor };
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
 * Update user profile
 * @route PUT /api/auth/profile
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