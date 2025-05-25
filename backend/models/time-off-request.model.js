const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TimeOffRequest = sequelize.define('TimeOffRequest', {
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
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected']]
    }
  },
  approved_by: {
    type: DataTypes.UUID,
    references: {
      model: {
        tableName: 'users',
        schema: 'auth'
      },
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'time_off_requests',
  schema: 'app',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = TimeOffRequest;