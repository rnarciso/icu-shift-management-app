'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Enable UUID extension
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // Create users table
    await queryInterface.createTable('users', {
      user_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      crm_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      crm_state: {
        type: Sequelize.CHAR(2),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING(50)
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Add unique constraint for CRM
    await queryInterface.addConstraint('users', {
      fields: ['crm_number', 'crm_state'],
      type: 'unique',
      name: 'unique_crm'
    });
    
    // Create authentication table
    await queryInterface.createTable('authentication', {
      auth_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onDelete: 'CASCADE'
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.STRING(50),
        defaultValue: 'doctor',
        validate: {
          isIn: [['doctor', 'admin']]
        }
      },
      last_login: {
        type: Sequelize.DATE
      },
      reset_token: {
        type: Sequelize.STRING(255)
      },
      token_expiry: {
        type: Sequelize.DATE
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Create qualifications table
    await queryInterface.createTable('qualifications', {
      qualification_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Create user_qualifications table
    await queryInterface.createTable('user_qualifications', {
      user_qualification_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onDelete: 'CASCADE'
      },
      qualification_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'qualifications',
          key: 'qualification_id'
        },
        onDelete: 'CASCADE'
      },
      certification_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      expiration_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      certification_document: {
        type: Sequelize.STRING(255)
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Add unique constraint for user_qualifications
    await queryInterface.addConstraint('user_qualifications', {
      fields: ['user_id', 'qualification_id'],
      type: 'unique',
      name: 'unique_user_qualification'
    });
    
    // Add check constraint for certification dates
    await queryInterface.addConstraint('user_qualifications', {
      fields: ['expiration_date'],
      type: 'check',
      where: {
        expiration_date: {
          [Sequelize.Op.gt]: Sequelize.col('certification_date')
        }
      },
      name: 'valid_certification_dates'
    });
    
    // Create groups table
    await queryInterface.createTable('groups', {
      group_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Create user_groups table
    await queryInterface.createTable('user_groups', {
      user_group_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onDelete: 'CASCADE'
      },
      group_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'group_id'
        },
        onDelete: 'CASCADE'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Add unique constraint for user_groups
    await queryInterface.addConstraint('user_groups', {
      fields: ['user_id', 'group_id', 'start_date'],
      type: 'unique',
      name: 'unique_active_user_group'
    });
    
    // Add check constraint for group dates
    await queryInterface.addConstraint('user_groups', {
      fields: ['end_date'],
      type: 'check',
      where: {
        [Sequelize.Op.or]: [
          { end_date: null },
          { end_date: { [Sequelize.Op.gt]: Sequelize.col('start_date') } }
        ]
      },
      name: 'valid_group_dates'
    });
    
    // Create shifts table
    await queryInterface.createTable('shifts', {
      shift_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      duration_hours: {
        type: Sequelize.DECIMAL(4,2),
        allowNull: false
      },
      required_qualifications: {
        type: Sequelize.JSONB
      },
      min_doctors: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Add check constraint for shift times
    await queryInterface.addConstraint('shifts', {
      fields: ['start_time'],
      type: 'check',
      where: {
        start_time: {
          [Sequelize.Op.ne]: Sequelize.col('end_time')
        }
      },
      name: 'valid_shift_times'
    });
    
    // Create schedules table
    await queryInterface.createTable('schedules', {
      schedule_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      shift_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'shifts',
          key: 'shift_id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'planned',
        validate: {
          isIn: [['planned', 'completed', 'missed', 'swapped']]
        }
      },
      notes: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Add unique constraint for schedules
    await queryInterface.addConstraint('schedules', {
      fields: ['user_id', 'shift_id', 'date'],
      type: 'unique',
      name: 'unique_user_shift_date'
    });
    
    // Create indexes for performance
    await queryInterface.addIndex('user_qualifications', ['user_id'], {
      name: 'idx_user_qualifications_user_id'
    });
    
    await queryInterface.addIndex('user_qualifications', ['expiration_date'], {
      name: 'idx_user_qualifications_expiration_date'
    });
    
    await queryInterface.addIndex('user_groups', ['user_id'], {
      name: 'idx_user_groups_user_id'
    });
    
    await queryInterface.addIndex('schedules', ['user_id'], {
      name: 'idx_schedules_user_id'
    });
    
    await queryInterface.addIndex('schedules', ['date'], {
      name: 'idx_schedules_date'
    });
    
    await queryInterface.addIndex('schedules', ['status'], {
      name: 'idx_schedules_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop indexes
    await queryInterface.removeIndex('schedules', 'idx_schedules_status');
    await queryInterface.removeIndex('schedules', 'idx_schedules_date');
    await queryInterface.removeIndex('schedules', 'idx_schedules_user_id');
    await queryInterface.removeIndex('user_groups', 'idx_user_groups_user_id');
    await queryInterface.removeIndex('user_qualifications', 'idx_user_qualifications_expiration_date');
    await queryInterface.removeIndex('user_qualifications', 'idx_user_qualifications_user_id');
    
    // Drop tables in reverse order
    await queryInterface.dropTable('schedules');
    await queryInterface.dropTable('shifts');
    await queryInterface.dropTable('user_groups');
    await queryInterface.dropTable('groups');
    await queryInterface.dropTable('user_qualifications');
    await queryInterface.dropTable('qualifications');
    await queryInterface.dropTable('authentication');
    await queryInterface.dropTable('users');
  }
};