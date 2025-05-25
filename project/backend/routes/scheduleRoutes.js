const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route POST /api/schedule/generate
 * @desc Generate a new schedule using the algorithm
 * @access Private (Admin only)
 */
router.post(
  '/generate',
  authMiddleware.authenticateToken,
  authMiddleware.isAdmin,
  [
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    body('endDate').isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    body('constraints').optional().isObject().withMessage('Constraints must be an object')
  ],
  scheduleController.generateSchedule
);

/**
 * @route GET /api/schedule
 * @desc Get list of all schedules
 * @access Private
 */
router.get(
  '/',
  authMiddleware.authenticateToken,
  scheduleController.getSchedule
);

/**
 * @route GET /api/schedule/:scheduleId
 * @desc Get a specific schedule by ID
 * @access Private
 */
router.get(
  '/:scheduleId',
  authMiddleware.authenticateToken,
  scheduleController.getSchedule
);

/**
 * @route PUT /api/schedule/:scheduleId
 * @desc Update schedule entries
 * @access Private (Admin only)
 */
router.put(
  '/:scheduleId',
  authMiddleware.authenticateToken,
  authMiddleware.isAdmin,
  [
    body('assignments').isArray().withMessage('Assignments must be an array'),
    body('assignments.*.shiftId').isString().withMessage('Shift ID must be a string'),
    body('assignments.*.doctorId').isString().withMessage('Doctor ID must be a string')
  ],
  scheduleController.updateSchedule
);

/**
 * @route POST /api/schedule/:scheduleId/approve
 * @desc Approve a generated schedule
 * @access Private (Admin only)
 */
router.post(
  '/:scheduleId/approve',
  authMiddleware.authenticateToken,
  authMiddleware.isAdmin,
  scheduleController.approveSchedule
);

/**
 * @route POST /api/schedule/:scheduleId/publish
 * @desc Publish an approved schedule to doctors
 * @access Private (Admin only)
 */
router.post(
  '/:scheduleId/publish',
  authMiddleware.authenticateToken,
  authMiddleware.isAdmin,
  scheduleController.publishSchedule
);

/**
 * @route GET /api/schedule/:scheduleId/export
 * @desc Export schedule in various formats (PDF, CSV)
 * @access Private
 */
router.get(
  '/:scheduleId/export',
  authMiddleware.authenticateToken,
  scheduleController.exportSchedule
);

module.exports = router;