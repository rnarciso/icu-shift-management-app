const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  crm_number: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  crm_state: {
    type: DataTypes.STRING(2),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  specialty_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'specialties',
      key: 'id'
    }
  },
  years_experience: {
    type: DataTypes.INTEGER
  },
  last_recertification_date: {
    type: DataTypes.DATEONLY
  },
  next_recertification_date: {
    type: DataTypes.DATEONLY
  },
  availability_days: {
    type: DataTypes.INTEGER
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'doctors',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['crm_number', 'crm_state']
    }
  ]
});

module.exports = Doctor;