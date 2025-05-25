const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate, logAuthEvent } = require('../middleware/auth.middleware');
const authController = require('../controllers/authController');

// Login route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
  ],
  logAuthEvent('login'),
  authController.login
);

// Register route
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('crm_number').notEmpty().withMessage('CRM number is required'),
    body('crm_state').isLength({ min: 2, max: 2 }).withMessage('CRM state must be 2 characters'),
    validate
  ],
  logAuthEvent('register'),
  authController.register
);

// Refresh token route
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validate
  ],
  authController.refreshToken
);

// Logout route
router.post(
  '/logout',
  authenticate,
  logAuthEvent('logout'),
  authController.logout
);

// Forgot password route
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    validate
  ],
  authController.forgotPassword
);

// Reset password route
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
  ],
  authController.resetPassword
);

// Get user profile
router.get('/profile', authenticate, authController.getProfile);

// Update user profile
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('currentPassword').optional().notEmpty().withMessage('Current password is required when updating password'),
    body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('phone').optional(),
    validate
  ],
  authController.updateProfile
);

module.exports = router;