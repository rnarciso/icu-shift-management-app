const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorGroup = sequelize.define('DoctorGroup', {
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
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: {
        tableName: 'groups',
        schema: 'app'
      },
      key: 'id'
    }
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'doctor_groups',
  schema: 'app',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['doctor_id', 'group_id']
    }
  ]
});

module.exports = DoctorGroup;