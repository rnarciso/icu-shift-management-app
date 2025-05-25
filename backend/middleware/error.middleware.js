const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle 404 errors for routes that don't exist
 */
const notFound = (req, res, next) => {
  const error = new ApiError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error
  logger.error(`${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = new ApiError(message, 400);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = new ApiError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError('Your token has expired. Please log in again.', 401);
  }

  // Send response
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stack: config.server.env === 'development' ? err.stack : undefined
  });
};

module.exports = {
  ApiError,
  notFound,
  errorHandler
};