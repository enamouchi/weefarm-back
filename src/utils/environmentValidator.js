// src/utils/environmentValidator.js
const fs = require('fs');
const path = require('path');

class EnvironmentValidator {
  static validateAll() {
    console.log('Validating environment...');
    
    this.checkRequiredEnvVariables();
    this.createUploadDirectories();
    
    console.log('Environment validation completed successfully.');
  }

  static checkRequiredEnvVariables() {
    const required = [
      'DB_NAME',
      'DB_USER',
      'DB_PASS',
      'DB_HOST',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET'
    ];

    const missing = required.filter(env => !process.env[env]);

    if (missing.length > 0) {
      console.error('Missing required environment variables:');
      missing.forEach(env => console.error(`- ${env}`));
      process.exit(1);
    }

    if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
      console.error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
      process.exit(1);
    }

    if (process.env.JWT_SECRET.length < 32) {
      console.error('JWT_SECRET must be at least 32 characters long');
      process.exit(1);
    }

    if (process.env.JWT_REFRESH_SECRET.length < 32) {
      console.error('JWT_REFRESH_SECRET must be at least 32 characters long');
      process.exit(1);
    }
  }

  static createUploadDirectories() {
    const directories = [
      'uploads',
      'uploads/products',
      'uploads/profiles'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
  }

  static validateDatabaseConnection() {
    const { sequelize } = require('../config/database');
    
    return sequelize.authenticate()
      .then(() => {
        console.log('Database connection validated successfully');
        return true;
      })
      .catch(error => {
        console.error('Database connection validation failed:', error.message);
        return false;
      });
  }
}

module.exports = EnvironmentValidator;