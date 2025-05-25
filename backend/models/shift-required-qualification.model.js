const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShiftRequiredQualification = sequelize.define('ShiftRequiredQualification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shift_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: {
        tableName: 'shifts',
        schema: 'app'
      },
      key: 'id'
    }
  },
  qualification_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: {
        tableName: 'qualifications',
        schema: 'app'
      },
      key: 'id'
    }
  },
  required_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'shift_required_qualifications',
  schema: 'app',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['shift_id', 'qualification_id']
    }
  ]
});

module.exports = ShiftRequiredQualification;