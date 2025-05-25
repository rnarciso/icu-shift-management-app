const { ApiError } = require('./error.middleware');
const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * Middleware to authenticate JWT tokens
 * Verifies the token and attaches the user to the request
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError('Authentication required. No token provided.', 401));
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Find user by id
    const user = await User.findByPk(decoded.id);
    
    // Check if user exists and is active
    if (!user || !user.is_active) {
      return next(new ApiError('User not found or deactivated.', 401));
    }
    
    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError('Token expired. Please login again.', 401));
    }
    
    return next(new ApiError('Invalid token. Authentication failed.', 401));
  }
};

/**
 * Middleware to ensure user is authenticated
 */
exports.requireAuth = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError('Authentication required.', 401));
  }
  next();
};

/**
 * Middleware to ensure user has admin privileges
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError('Authentication required.', 401));
  }
  
  if (req.user.role !== 'admin') {
    return next(new ApiError('Admin privileges required.', 403));
  }
  
  next();
};

/**
 * Middleware to ensure user has doctor privileges
 */
exports.requireDoctor = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError('Authentication required.', 401));
  }
  
  if (req.user.role !== 'doctor') {
    return next(new ApiError('Doctor privileges required.', 403));
  }
  
  next();
};

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of allowed roles
 */
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('Authentication required.', 401));
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ApiError('Forbidden: Insufficient permissions.', 403));
    }
    
    next();
  };
};

/**
 * Middleware to log authentication events
 */
exports.logAuthEvent = (eventType) => {
  return (req, res, next) => {
    // Will be populated by auth controller
    res.on('finish', () => {
      if (res.statusCode < 400 && req.user) {
        logger.info(`Auth event: ${eventType}`, {
          userId: req.user.id,
          email: req.user.email,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
      }
    });
    
    next();
  };
};