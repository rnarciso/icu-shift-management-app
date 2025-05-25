const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorShiftPreference = sequelize.define('DoctorShiftPreference', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  doctor_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: {
        tableName: 'doctors',
        schema: 'app'
      },
      key: 'id'
    }
  },
  shift_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: {
        tableName: 'shift_types',
        schema: 'app'
      },
      key: 'id'
    }
  },
  preference_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  }
}, {
  tableName: 'doctor_shift_preferences',
  schema: 'app',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['doctor_id', 'shift_type_id']
    }
  ]
});

module.exports = DoctorShiftPreference;