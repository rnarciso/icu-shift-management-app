const User = require('./user.model');
const Doctor = require('./doctor.model');
const Specialty = require('./specialty.model');
const Qualification = require('./qualification.model');
const Group = require('./group.model');
const DoctorQualification = require('./doctor-qualification.model');
const DoctorGroup = require('./doctor-group.model');
const ShiftType = require('./shift-type.model');
const DoctorShiftPreference = require('./doctor-shift-preference.model');
const DoctorAvailability = require('./doctor-availability.model');
const TimeOffRequest = require('./time-off-request.model');
const Shift = require('./shift.model');
const ShiftRequiredQualification = require('./shift-required-qualification.model');
const ShiftAssignment = require('./shift-assignment.model');
const PerformanceMetrics = require('./performance-metrics.model');

// Define associations

// User - Doctor (one-to-one)
User.hasOne(Doctor, { foreignKey: 'user_id' });
Doctor.belongsTo(User, { foreignKey: 'user_id' });

// Doctor - Specialty (many-to-one)
Specialty.hasMany(Doctor, { foreignKey: 'specialty_id' });
Doctor.belongsTo(Specialty, { foreignKey: 'specialty_id' });

// Doctor - Qualification (many-to-many)
Doctor.belongsToMany(Qualification, { 
  through: DoctorQualification,
  foreignKey: 'doctor_id',
  otherKey: 'qualification_id'
});
Qualification.belongsToMany(Doctor, { 
  through: DoctorQualification,
  foreignKey: 'qualification_id',
  otherKey: 'doctor_id'
});

// Doctor - Group (many-to-many)
Doctor.belongsToMany(Group, { 
  through: DoctorGroup,
  foreignKey: 'doctor_id',
  otherKey: 'group_id'
});
Group.belongsToMany(Doctor, { 
  through: DoctorGroup,
  foreignKey: 'group_id',
  otherKey: 'doctor_id'
});

// Doctor - ShiftType (many-to-many for preferences)
Doctor.belongsToMany(ShiftType, { 
  through: DoctorShiftPreference,
  foreignKey: 'doctor_id',
  otherKey: 'shift_type_id'
});
ShiftType.belongsToMany(Doctor, { 
  through: DoctorShiftPreference,
  foreignKey: 'shift_type_id',
  otherKey: 'doctor_id'
});

// Doctor - DoctorAvailability (one-to-many)
Doctor.hasMany(DoctorAvailability, { foreignKey: 'doctor_id' });
DoctorAvailability.belongsTo(Doctor, { foreignKey: 'doctor_id' });

// Doctor - TimeOffRequest (one-to-many)
Doctor.hasMany(TimeOffRequest, { foreignKey: 'doctor_id' });
TimeOffRequest.belongsTo(Doctor, { foreignKey: 'doctor_id' });

// User - TimeOffRequest (for approval)
User.hasMany(TimeOffRequest, { foreignKey: 'approved_by' });
TimeOffRequest.belongsTo(User, { foreignKey: 'approved_by' });

// ShiftType - Shift (one-to-many)
ShiftType.hasMany(Shift, { foreignKey: 'shift_type_id' });
Shift.belongsTo(ShiftType, { foreignKey: 'shift_type_id' });

// Shift - Qualification (many-to-many for required qualifications)
Shift.belongsToMany(Qualification, { 
  through: ShiftRequiredQualification,
  foreignKey: 'shift_id',
  otherKey: 'qualification_id'
});
Qualification.belongsToMany(Shift, { 
  through: ShiftRequiredQualification,
  foreignKey: 'qualification_id',
  otherKey: 'shift_id'
});

// Shift - Doctor (many-to-many for assignments)
Shift.belongsToMany(Doctor, { 
  through: ShiftAssignment,
  foreignKey: 'shift_id',
  otherKey: 'doctor_id'
});
Doctor.belongsToMany(Shift, { 
  through: ShiftAssignment,
  foreignKey: 'doctor_id',
  otherKey: 'shift_id'
});

// Doctor - PerformanceMetrics (one-to-many)
Doctor.hasMany(PerformanceMetrics, { foreignKey: 'doctor_id' });
PerformanceMetrics.belongsTo(Doctor, { foreignKey: 'doctor_id' });

module.exports = {
  User,
  Doctor,
  Specialty,
  Qualification,
  Group,
  DoctorQualification,
  DoctorGroup,
  ShiftType,
  DoctorShiftPreference,
  DoctorAvailability,
  TimeOffRequest,
  Shift,
  ShiftRequiredQualification,
  ShiftAssignment,
  PerformanceMetrics
};