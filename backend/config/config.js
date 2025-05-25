require('dotenv').config();

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'doctor_scheduling',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: process.env.NODE_ENV !== 'production',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-for-development-only',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // Scheduling algorithm configuration
  scheduler: {
    minRestHours: parseInt(process.env.MIN_REST_HOURS || '12', 10),
    maxConsecutiveShifts: parseInt(process.env.MAX_CONSECUTIVE_SHIFTS || '3', 10),
    scheduleVisibilityDays: parseInt(process.env.SCHEDULE_VISIBILITY_DAYS || '30', 10),
    notificationAdvanceDays: parseInt(process.env.NOTIFICATION_ADVANCE_DAYS || '7', 10)
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'app.log'
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};