const { sequelize } = require('./database');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Initialize the database schema
 * This function reads the SQL schema file and executes it to create the database structure
 */
const initializeDatabase = async () => {
  try {
    // Check if database connection is successful
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    
    // For SQLite, we'll skip the raw SQL schema initialization and rely on Sequelize models
    if (sequelize.getDialect() === 'sqlite') {
      logger.info('Using SQLite, skipping raw SQL schema initialization.');
      return true;
    }
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../models/database_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .replace(/--.*$/gm, '') // Remove comments
      .replace(/\r\n|\n|\r/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .split(';') // Split on semicolons
      .filter(statement => statement.trim() !== ''); // Remove empty statements
    
    // Execute each statement
    for (const statement of statements) {
      await sequelize.query(statement + ';');
    }
    
    logger.info('Database schema initialized successfully.');
    return true;
  } catch (error) {
    logger.error('Error initializing database schema:', error);
    return false;
  }
};

/**
 * Sync Sequelize models with the database
 * This function synchronizes the Sequelize models with the database structure
 */
const syncModels = async () => {
  try {
    // Sync all models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database models synchronized successfully.');
    return true;
  } catch (error) {
    logger.error('Error synchronizing database models:', error);
    return false;
  }
};

module.exports = {
  initializeDatabase,
  syncModels
};