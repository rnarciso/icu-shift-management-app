const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

// This is a placeholder for the actual controller
// Will be implemented in a separate task
const preferenceController = {
  getDoctorPreferences: (req, res) => {
    res.status(501).json({ message: 'Get doctor preferences functionality not implemented yet' });
  },
  updateDoctorPreferences: (req, res) => {
    res.status(501).json({ message: 'Update doctor preferences functionality not implemented yet' });
  },
  getShiftTypePreferences: (req, res) => {
    res.status(501).json({ message: 'Get shift type preferences functionality not implemented yet' });
  },
  updateShiftTypePreferences: (req, res) => {
    res.status(501).json({ message: 'Update shift type preferences functionality not implemented yet' });
  },
  getPreferenceSettings: (req, res) => {
    res.status(501).json({ message: 'Get preference settings functionality not implemented yet' });
  },
  updatePreferenceSettings: (req, res) => {
    res.status(501).json({ message: 'Update preference settings functionality not implemented yet' });
  }
};

// Get doctor preferences
router.get(
  '/doctors/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid doctor ID is required'),
    validate
  ],
  preferenceController.getDoctorPreferences
);

// Update doctor preferences
router.put(
  '/doctors/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid doctor ID is required'),
    body('preferences').isArray().withMessage('Preferences must be an array'),
    body('preferences.*.shift_type_id').isUUID().withMessage('Valid shift type ID is required'),
    body('preferences.*.preference_level').isInt({ min: 1, max: 5 }).withMessage('Preference level must be between 1 and 5'),
    validate
  ],
  preferenceController.updateDoctorPreferences
);

// Get shift type preferences
router.get(
  '/shift-types/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid shift type ID is required'),
    validate
  ],
  preferenceController.getShiftTypePreferences
);

// Update shift type preferences
router.put(
  '/shift-types/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid shift type ID is required'),
    body('doctor_id').isUUID().withMessage('Valid doctor ID is required'),
    body('preference_level').isInt({ min: 1, max: 5 }).withMessage('Preference level must be between 1 and 5'),
    validate
  ],
  preferenceController.updateShiftTypePreferences
);

// Get preference settings
router.get('/settings', authenticate, preferenceController.getPreferenceSettings);

// Update preference settings
router.put(
  '/settings',
  authenticate,
  [
    body('preference_weight').optional().isFloat({ min: 0, max: 1 }).withMessage('Preference weight must be between 0 and 1'),
    body('consecutive_shifts_limit').optional().isInt({ min: 1 }).withMessage('Consecutive shifts limit must be at least 1'),
    body('min_rest_hours').optional().isInt({ min: 0 }).withMessage('Minimum rest hours must be non-negative'),
    validate
  ],
  preferenceController.updatePreferenceSettings
);

module.exports = router;