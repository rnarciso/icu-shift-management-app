const winston = require('winston');
const config = require('../config/config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'doctor-scheduling-api' },
  transports: [
    // Write logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
    // Write logs to file
    new winston.transports.File({ 
      filename: config.logging.file,
      format: logFormat
    })
  ]
});

// Add stream for Morgan HTTP request logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;