const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const dataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

/**
 * @route POST /api/data/upload
 * @desc Upload CSV file (doctors list or performance data)
 * @access Private (Admin only)
 */
router.post(
  '/upload',
  authMiddleware.authenticateToken,
  authMiddleware.isAdmin,
  upload.single('file'),
  [
    body('dataType').isIn(['doctors', 'performance']).withMessage('Invalid data type')
  ],
  dataController.uploadCSV
);

/**
 * @route GET /api/data/doctors
 * @desc Get list of doctors
 * @access Private
 */
router.get(
  '/doctors',
  authMiddleware.authenticateToken,
  dataController.getDoctorsList
);

/**
 * @route GET /api/data/performance
 * @desc Get performance data, optionally filtered by doctor ID
 * @access Private
 */
router.get(
  '/performance',
  authMiddleware.authenticateToken,
  dataController.getPerformanceData
);

/**
 * @route GET /api/data/export/:dataType
 * @desc Export data as CSV
 * @access Private (Admin only)
 */
router.get(
  '/export/:dataType',
  authMiddleware.authenticateToken,
  authMiddleware.isAdmin,
  dataController.exportData
);

module.exports = router;