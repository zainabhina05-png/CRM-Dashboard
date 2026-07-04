const mongoose = require('mongoose');
const logger = require('../utils/logger');

let cachedConnection = null;

const connectDB = async () => {
  // Vercel serverless: reuse existing connection if available
  if (cachedConnection && mongoose.connection.readyState === 1) {
    logger.info('Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast if can't connect
    });
    
    cachedConnection = conn;
    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      cachedConnection = null;
    });

    // Only set up process handlers in non-serverless environments
    if (!process.env.VERCEL) {
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('Mongoose connection closed — app terminated');
        process.exit(0);
      });
    }

    return conn;
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    cachedConnection = null;
    
    // In serverless, don't crash the process - let the function fail gracefully
    if (process.env.VERCEL) {
      throw error;
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
