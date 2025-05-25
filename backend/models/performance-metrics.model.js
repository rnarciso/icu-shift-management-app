const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PerformanceMetrics = sequelize.define('PerformanceMetrics', {
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
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  shifts_scheduled: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shifts_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shifts_missed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  average_satisfaction: {
    type: DataTypes.DECIMAL(3, 2)
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'performance_metrics',
  schema: 'app',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['doctor_id', 'month', 'year']
    }
  ]
});

module.exports = PerformanceMetrics;