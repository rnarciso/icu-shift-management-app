const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShiftType = sequelize.define('ShiftType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  color_code: {
    type: DataTypes.STRING(7),
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  }
}, {
  tableName: 'shift_types',
  schema: 'app',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ShiftType;