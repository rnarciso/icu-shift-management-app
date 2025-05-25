const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Qualification = sequelize.define('Qualification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  level: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'qualifications',
  schema: 'app',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Qualification;