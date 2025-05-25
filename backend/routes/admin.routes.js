const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

// This is a placeholder for the actual controller
// Will be implemented in a separate task
const adminController = {
  getDashboardStats: (req, res) => {
    res.status(501).json({ message: 'Get dashboard stats functionality not implemented yet' });
  },
  getQualifications: (req, res) => {
    res.status(501).json({ message: 'Get qualifications functionality not implemented yet' });
  },
  createQualification: (req, res) => {
    res.status(501).json({ message: 'Create qualification functionality not implemented yet' });
  },
  updateQualification: (req, res) => {
    res.status(501).json({ message: 'Update qualification functionality not implemented yet' });
  },
  deleteQualification: (req, res) => {
    res.status(501).json({ message: 'Delete qualification functionality not implemented yet' });
  },
  getShiftTypes: (req, res) => {
    res.status(501).json({ message: 'Get shift types functionality not implemented yet' });
  },
  createShiftType: (req, res) => {
    res.status(501).json({ message: 'Create shift type functionality not implemented yet' });
  },
  updateShiftType: (req, res) => {
    res.status(501).json({ message: 'Update shift type functionality not implemented yet' });
  },
  deleteShiftType: (req, res) => {
    res.status(501).json({ message: 'Delete shift type functionality not implemented yet' });
  },
  getGroups: (req, res) => {
    res.status(501).json({ message: 'Get groups functionality not implemented yet' });
  },
  createGroup: (req, res) => {
    res.status(501).json({ message: 'Create group functionality not implemented yet' });
  },
  updateGroup: (req, res) => {
    res.status(501).json({ message: 'Update group functionality not implemented yet' });
  },
  deleteGroup: (req, res) => {
    res.status(501).json({ message: 'Delete group functionality not implemented yet' });
  },
  getTimeOffRequests: (req, res) => {
    res.status(501).json({ message: 'Get time off requests functionality not implemented yet' });
  },
  approveTimeOffRequest: (req, res) => {
    res.status(501).json({ message: 'Approve time off request functionality not implemented yet' });
  },
  rejectTimeOffRequest: (req, res) => {
    res.status(501).json({ message: 'Reject time off request functionality not implemented yet' });
  },
  importDoctorData: (req, res) => {
    res.status(501).json({ message: 'Import doctor data functionality not implemented yet' });
  }
};

// Get dashboard statistics
router.get('/dashboard', authenticate, adminController.getDashboardStats);

// Qualifications routes
router.get('/qualifications', authenticate, adminController.getQualifications);
router.post(
  '/qualifications',
  authenticate,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').optional(),
    validate
  ],
  adminController.createQualification
);
router.put(
  '/qualifications/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid qualification ID is required'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional(),
    validate
  ],
  adminController.updateQualification
);
router.delete(
  '/qualifications/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid qualification ID is required'),
    validate
  ],
  adminController.deleteQualification
);

// Shift types routes
router.get('/shift-types', authenticate, adminController.getShiftTypes);
router.post(
  '/shift-types',
  authenticate,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('start_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Start time must be in HH:MM format'),
    body('end_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('End time must be in HH:MM format'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),
    body('description').optional(),
    validate
  ],
  adminController.createShiftType
);
router.put(
  '/shift-types/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid shift type ID is required'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('start_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Start time must be in HH:MM format'),
    body('end_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('End time must be in HH:MM format'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),
    body('description').optional(),
    validate
  ],
  adminController.updateShiftType
);
router.delete(
  '/shift-types/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid shift type ID is required'),
    validate
  ],
  adminController.deleteShiftType
);

// Groups routes
router.get('/groups', authenticate, adminController.getGroups);
router.post(
  '/groups',
  authenticate,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').optional(),
    validate
  ],
  adminController.createGroup
);
router.put(
  '/groups/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid group ID is required'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional(),
    validate
  ],
  adminController.updateGroup
);
router.delete(
  '/groups/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid group ID is required'),
    validate
  ],
  adminController.deleteGroup
);

// Time off requests routes
router.get(
  '/time-off-requests',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Status must be pending, approved, or rejected'),
    validate
  ],
  adminController.getTimeOffRequests
);
router.put(
  '/time-off-requests/:id/approve',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid time off request ID is required'),
    validate
  ],
  adminController.approveTimeOffRequest
);
router.put(
  '/time-off-requests/:id/reject',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid time off request ID is required'),
    body('reason').notEmpty().withMessage('Rejection reason is required'),
    validate
  ],
  adminController.rejectTimeOffRequest
);

// Import doctor data
router.post('/import', authenticate, adminController.importDoctorData);

module.exports = router;