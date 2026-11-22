const mongoose = require('mongoose');

let mongodInstance = null;

/**
 * Connect to MongoDB with automated fallback to in-memory MongoDB
 * to ensure zero setup friction during development and testing.
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/accesslens';

  try {
    console.log(`Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB successfully.');
  } catch (err) {
    console.warn(`Local MongoDB connection failed (${err.message}).`);
    console.log('Starting In-Memory MongoDB for zero-friction hackathon execution...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      if (!mongodInstance) {
        mongodInstance = await MongoMemoryServer.create();
      }
      const memUri = mongodInstance.getUri();
      await mongoose.connect(memUri);
      console.log(`Connected to In-Memory MongoDB at: ${memUri}`);
    } catch (memErr) {
      console.error('Failed to initialize MongoDB fallback:', memErr);
      process.exit(1);
    }
  }

  return mongoose.connection;
}

module.exports = {
  connectDB
};
