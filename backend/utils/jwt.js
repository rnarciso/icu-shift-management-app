const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('./logger');

/**
 * Generate JWT token for a user
 * @param {Object} user - User object with id, email, and role
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn
    }
  );
};

/**
 * Generate refresh token for a user
 * @param {Object} user - User object with id
 * @returns {String} Refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      type: 'refresh'
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.refreshExpiresIn
    }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    logger.error('Token verification failed:', error);
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {String} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or not a refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    logger.error('Refresh token verification failed:', error);
    throw error;
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken
};