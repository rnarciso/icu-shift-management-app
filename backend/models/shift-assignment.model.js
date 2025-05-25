const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShiftAssignment = sequelize.define('ShiftAssignment', {
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
  assignment_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'scheduled',
    validate: {
      isIn: [['scheduled', 'confirmed', 'completed', 'missed', 'reassigned']]
    }
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  satisfaction_rating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 10
    }
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'shift_assignments',
  schema: 'app',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['shift_id', 'doctor_id']
    }
  ]
});

module.exports = ShiftAssignment;