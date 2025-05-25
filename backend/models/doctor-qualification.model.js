const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorQualification = sequelize.define('DoctorQualification', {
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
  certification_date: {
    type: DataTypes.DATEONLY
  },
  expiration_date: {
    type: DataTypes.DATEONLY
  },
  certification_document: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'doctor_qualifications',
  schema: 'app',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['doctor_id', 'qualification_id']
    }
  ]
});

module.exports = DoctorQualification;