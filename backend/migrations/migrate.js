#!/usr/bin/env node

const { Sequelize } = require('sequelize');
const config = require('./config.json');
const fs = require('fs');
const path = require('path');

// Get environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log
  }
);

// Migration table name
const MIGRATION_TABLE = '_migrations';

async function createMigrationTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getExecutedMigrations() {
  try {
    const [rows] = await sequelize.query(
      `SELECT name FROM ${MIGRATION_TABLE} ORDER BY name`
    );
    return rows.map(row => row.name);
  } catch (error) {
    return [];
  }
}

async function markMigrationAsExecuted(migrationName) {
  await sequelize.query(
    `INSERT INTO ${MIGRATION_TABLE} (name) VALUES (?)`,
    { replacements: [migrationName] }
  );
}

async function unmarkMigration(migrationName) {
  await sequelize.query(
    `DELETE FROM ${MIGRATION_TABLE} WHERE name = ?`,
    { replacements: [migrationName] }
  );
}

async function runMigrations() {
  await createMigrationTable();
  const executedMigrations = await getExecutedMigrations();
  
  // Get all migration files
  const migrationsDir = path.join(__dirname);
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.match(/^\d{14}-.*\.js$/))
    .sort();
  
  console.log('Found migrations:', files);
  
  for (const file of files) {
    if (!executedMigrations.includes(file)) {
      console.log(`Running migration: ${file}`);
      
      try {
        const migration = require(path.join(migrationsDir, file));
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        await markMigrationAsExecuted(file);
        console.log(`Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`Error running migration ${file}:`, error);
        process.exit(1);
      }
    } else {
      console.log(`Migration ${file} already executed, skipping`);
    }
  }
  
  console.log('All migrations completed');
}

async function rollbackMigration() {
  await createMigrationTable();
  const executedMigrations = await getExecutedMigrations();
  
  if (executedMigrations.length === 0) {
    console.log('No migrations to rollback');
    return;
  }
  
  // Get the last executed migration
  const lastMigration = executedMigrations[executedMigrations.length - 1];
  console.log(`Rolling back migration: ${lastMigration}`);
  
  try {
    const migration = require(path.join(__dirname, lastMigration));
    await migration.down(sequelize.getQueryInterface(), Sequelize);
    await unmarkMigration(lastMigration);
    console.log(`Migration ${lastMigration} rolled back successfully`);
  } catch (error) {
    console.error(`Error rolling back migration ${lastMigration}:`, error);
    process.exit(1);
  }
}

// CLI interface
const action = process.argv[2] || 'up';

(async () => {
  try {
    if (action === 'up') {
      await runMigrations();
    } else if (action === 'down') {
      await rollbackMigration();
    } else {
      console.log('Usage: node migrate.js [up|down]');
      process.exit(1);
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
})();