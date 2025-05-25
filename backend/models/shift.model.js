const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
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
  required_doctors: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'shifts',
  schema: 'app',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['date', 'shift_type_id']
    }
  ]
});

module.exports = Shift;