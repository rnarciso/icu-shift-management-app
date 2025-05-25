const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');
const { initializeDatabase, syncModels } = require('./config/database-init');

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database schema
    await initializeDatabase();
    
    // Sync Sequelize models
    await syncModels();
    
    // Start the server
    const server = app.listen(config.server.port, () => {
      logger.info(`Server running in ${config.server.env} mode on port ${config.server.port}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();