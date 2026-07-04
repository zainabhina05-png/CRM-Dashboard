/**
 * Shared test helpers — in-memory MongoDB via mongoose directly,
 * no external mongodb-memory-server dep needed.
 * Tests hit the real routes via Supertest against a test DB.
 */
const mongoose = require('mongoose');

// Use a dedicated test database so we never touch dev/prod data
const TEST_DB = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/leadflow_test';

const connectTestDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB);
  }
};

const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

module.exports = { connectTestDB, clearTestDB, closeTestDB };
