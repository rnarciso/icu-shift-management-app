const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

// This is a placeholder for the actual controller
// Will be implemented in a separate task
const scheduleController = require('../controllers/scheduleController');

// Generate schedule
router.post(
  '/generate',
  authenticate,
  [
    body('startDate').isISO8601().withMessage('Valid start date is required (ISO 8601 format)'),
    body('endDate').isISO8601().withMessage('Valid end date is required (ISO 8601 format)'),
    body('constraints').optional().isObject().withMessage('Constraints must be an object'),
    body('constraints.maxConsecutiveShifts').optional().isInt({ min: 1 }).withMessage('Max consecutive shifts must be at least 1'),
    body('constraints.minRestHours').optional().isInt({ min: 8 }).withMessage('Min rest hours must be at least 8'),
    body('optimizationPreference').optional().isIn(['doctor_preference', 'equal_distribution', 'qualification_priority']).withMessage('Invalid optimization preference'),
    validate
  ],
  scheduleController.generateSchedule
);

// Get schedule
router.get(
  '/',
  authenticate,
  [
    query('startDate').isISO8601().withMessage('Valid start date is required (ISO 8601 format)'),
    query('endDate').isISO8601().withMessage('Valid end date is required (ISO 8601 format)'),
    query('doctorId').optional().isUUID().withMessage('Valid doctor ID is required'),
    validate
  ],
  scheduleController.getSchedule
);

// Update shift assignment
router.put(
  '/:scheduleId',
  authenticate,
  [
    param('scheduleId').isUUID().withMessage('Valid schedule ID is required'),
    body('assignments').isArray().withMessage('Assignments must be an array'),
    validate
  ],
  scheduleController.updateSchedule
);

// Get specific schedule by ID
router.get(
  '/:scheduleId',
  authenticate,
  [
    param('scheduleId').isUUID().withMessage('Valid schedule ID is required'),
    validate
  ],
  scheduleController.getSchedule
);

// Approve schedule
router.patch(
  '/:scheduleId/approve',
  authenticate,
  [
    param('scheduleId').isUUID().withMessage('Valid schedule ID is required'),
    validate
  ],
  scheduleController.approveSchedule
);

// Publish schedule
router.patch(
  '/:scheduleId/publish',
  authenticate,
  [
    param('scheduleId').isUUID().withMessage('Valid schedule ID is required'),
    validate
  ],
  scheduleController.publishSchedule
);

// Export schedule
router.get(
  '/:scheduleId/export',
  authenticate,
  [
    param('scheduleId').isUUID().withMessage('Valid schedule ID is required'),
    query('format').optional().isIn(['pdf', 'csv']).withMessage('Format must be either pdf or csv'),
    validate
  ],
  scheduleController.exportSchedule
);

module.exports = router;