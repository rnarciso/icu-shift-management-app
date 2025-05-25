const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

// This is a placeholder for the actual controller
// Will be implemented in a separate task
const doctorController = {
  getAllDoctors: (req, res) => {
    res.status(501).json({ message: 'Get all doctors functionality not implemented yet' });
  },
  getDoctorById: (req, res) => {
    res.status(501).json({ message: 'Get doctor by ID functionality not implemented yet' });
  },
  createDoctor: (req, res) => {
    res.status(501).json({ message: 'Create doctor functionality not implemented yet' });
  },
  updateDoctor: (req, res) => {
    res.status(501).json({ message: 'Update doctor functionality not implemented yet' });
  },
  deleteDoctor: (req, res) => {
    res.status(501).json({ message: 'Delete doctor functionality not implemented yet' });
  },
  getDoctorQualifications: (req, res) => {
    res.status(501).json({ message: 'Get doctor qualifications functionality not implemented yet' });
  },
  updateDoctorQualifications: (req, res) => {
    res.status(501).json({ message: 'Update doctor qualifications functionality not implemented yet' });
  },
  getDoctorAvailability: (req, res) => {
    res.status(501).json({ message: 'Get doctor availability functionality not implemented yet' });
  },
  updateDoctorAvailability: (req, res) => {
    res.status(501).json({ message: 'Update doctor availability functionality not implemented yet' });
  },
  requestTimeOff: (req, res) => {
    res.status(501).json({ message: 'Request time off functionality not implemented yet' });
  },
  getTimeOffRequests: (req, res) => {
    res.status(501).json({ message: 'Get time off requests functionality not implemented yet' });
  }
};

// Get all doctors
router.get('/', authenticate, doctorController.getAllDoctors);

// Get doctor by ID
router.get('/:id', authenticate, doctorController.getDoctorById);

// Create doctor
router.post(
  '/',
  authenticate,
  [
    body('user_id').isUUID().withMessage('Valid user ID is required'),
    body('specialty_id').optional().isUUID().withMessage('Valid specialty ID is required'),
    body('years_of_experience').optional().isInt({ min: 0 }).withMessage('Years of experience must be a positive integer'),
    body('certification_date').optional().isDate().withMessage('Valid certification date is required'),
    body('recertification_date').optional().isDate().withMessage('Valid recertification date is required'),
    validate
  ],
  doctorController.createDoctor
);

// Update doctor
router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid doctor ID is required'),
    body('specialty_id').optional().isUUID().withMessage('Valid specialty ID is required'),
    body('years_of_experience').optional().isInt({ min: 0 }).withMessage('Years of experience must be a positive integer'),
    body('certification_date').optional().isDate().withMessage('Valid certification date is required'),
    body('recertification_date').optional().isDate().withMessage('Valid recertification date is required'),
    validate
  ],
  doctorController.updateDoctor
);

// Delete doctor
router.delete(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid doctor ID is required'),
    validate
  ],
  doctorController.deleteDoctor
);

// Get doctor qualifications
router.get(
  '/:id/qualifications',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid doctor ID is required'),
    validate
  ],
  doctorController.getDoctorQualifications
);

// Update doctor qualifications
router.put(
  '/:id/qualifications',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid doctor ID is required'),
    body('qualification_ids').isArray().withMessage('Qualification IDs must be an array'),
    body('qualification_ids.*').isUUID().withMessage('Valid qualification IDs are required'),
    validate
  ],
  doctorController.updateDoctorQualifications
);

// Get doctor availability
router.get(
  '/:id/availability',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid doctor ID is required'),
    validate
  ],
  doctorController.getDoctorAvailability
);

// Update doctor availability
router.put(
  '/:id/availability',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid doctor ID is required'),
    body('availabilities').isArray().withMessage('Availabilities must be an array'),
    body('availabilities.*.day_of_week').isInt({ min: 0, max: 6 }).withMessage('Day of week must be between 0 and 6'),
    body('availabilities.*.start_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Start time must be in HH:MM format'),
    body('availabilities.*.end_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('End time must be in HH:MM format'),
    validate
  ],
  doctorController.updateDoctorAvailability
);

// Request time off
router.post(
  '/:id/time-off',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid doctor ID is required'),
    body('start_date').isDate().withMessage('Valid start date is required'),
    body('end_date').isDate().withMessage('Valid end date is required'),
    body('reason').notEmpty().withMessage('Reason is required'),
    validate
  ],
  doctorController.requestTimeOff
);

// Get time off requests
router.get(
  '/:id/time-off',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid doctor ID is required'),
    validate
  ],
  doctorController.getTimeOffRequests
);

module.exports = router;