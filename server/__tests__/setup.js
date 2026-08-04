/**
 * Shared test helpers.
 *
 * Strategy:
 *  - If MONGO_URI is set in env (CI with a real mongo service container),
 *    connect directly — no binary download needed.
 *  - Otherwise fall back to mongodb-memory-server (local dev convenience).
 *
 * This keeps CI fast (no 600 MB mongod download) while still working
 * locally without any external dependencies.
 */
const mongoose = require('mongoose');

const TEST_DB_NAME = 'leadflow_test';
let mongoServer = null;

const connectTestDB = async () => {
  if (process.env.MONGO_URI) {
    // CI: connect to the real mongo service container
    const uri = process.env.MONGO_URI.replace(/\/[^/?]+(\?|$)/, `/${TEST_DB_NAME}$1`);
    await mongoose.connect(uri);
  } else {
    // Local dev: spin up in-memory mongod
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
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
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

module.exports = { connectTestDB, clearTestDB, closeTestDB };
