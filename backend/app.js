const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors(config.cors)); // CORS configuration
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('combined', { stream: logger.stream })); // HTTP request logging

// Test database connection (in-memory for testing)
const testConnection = () => {
  logger.info('Using in-memory database for testing');
};

testConnection();

// API routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/schedules', require('./routes/schedule.routes'));
app.use('/api/preferences', require('./routes/preference.routes'));
app.use('/api/reports', require('./routes/report.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.message,
    stack: config.server.env === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: 'Resource not found'
  });
});

module.exports = app;