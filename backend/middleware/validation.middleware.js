const { validationResult } = require('express-validator');
const { ApiError } = require('./error.middleware');

/**
 * Middleware to validate request data using express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Extract error messages
    const errorMessages = errors.array().map(error => 
      `${error.path}: ${error.msg}`
    ).join(', ');
    
    // Throw API error with validation messages
    return next(new ApiError(`Validation failed - ${errorMessages}`, 400));
  }
  
  next();
};

module.exports = {
  validate
};