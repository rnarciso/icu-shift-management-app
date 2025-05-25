const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const userController = require('../controllers/userController');

// Routes that require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put(
  '/profile',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('currentPassword').optional().notEmpty().withMessage('Current password is required when updating password'),
    body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate
  ],
  userController.updateProfile
);

// Update doctor qualifications
router.put(
  '/qualifications',
  authorize(['doctor']),
  [
    body('qualifications').isArray().withMessage('Qualifications must be an array'),
    body('qualifications.*').isInt().withMessage('Qualification IDs must be integers'),
    validate
  ],
  userController.updateQualifications
);

// Admin routes
// Get all users (with pagination)
router.get(
  '/',
  authorize(['admin']),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['doctor', 'admin', 'supervisor']).withMessage('Invalid role'),
    query('active').optional().isBoolean().withMessage('Active must be a boolean'),
    validate
  ],
  userController.getUsers
);

// Get user by ID
router.get(
  '/:id',
  authorize(['admin']),
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    validate
  ],
  userController.getUserById
);

// Create new user
router.post(
  '/',
  authorize(['admin']),
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['doctor', 'admin', 'supervisor']).withMessage('Invalid role'),
    body('name').if(body('role').equals('doctor')).notEmpty().withMessage('Name is required for doctors'),
    body('crm_number').if(body('role').equals('doctor')).notEmpty().withMessage('CRM number is required for doctors'),
    body('crm_state').if(body('role').equals('doctor')).isLength({ min: 2, max: 2 }).withMessage('CRM state must be 2 characters'),
    validate
  ],
  userController.createUser
);

// Update user
router.put(
  '/:id',
  authorize(['admin']),
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['doctor', 'admin', 'supervisor']).withMessage('Invalid role'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
    validate
  ],
  userController.updateUser
);

// Delete user (soft delete)
router.delete(
  '/:id',
  authorize(['admin']),
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    validate
  ],
  userController.deleteUser
);

module.exports = router;