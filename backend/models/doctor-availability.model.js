const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorAvailability = sequelize.define('DoctorAvailability', {
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
  day_of_week: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 6
    }
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  start_time: {
    type: DataTypes.TIME
  },
  end_time: {
    type: DataTypes.TIME
  }
}, {
  tableName: 'doctor_availability',
  schema: 'app',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['doctor_id', 'day_of_week']
    }
  ]
});

module.exports = DoctorAvailability;