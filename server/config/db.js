const mongoose = require('mongoose');

let mongoMemoryServerInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();

  if (uri) {
    try {
      console.log('Connecting to configured MongoDB URI...');
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return { isMemory: false };
    } catch (err) {
      console.error(`[Database Error] Failed to connect to configured MONGODB_URI: ${err.message}`);
      throw new Error(`Database connection failed for configured MONGODB_URI: ${err.message}`);
    }
  }

  // Fallback to MongoMemoryServer for standalone development & testing
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const memUri = mongoMemoryServerInstance.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`[Database] Connected to Embedded In-Memory MongoDB: ${conn.connection.host}`);
    console.log('[Database Notice] Add MONGODB_URI to server/.env to persist data across full server restarts to MongoDB Atlas.');
    return { isMemory: true };
  } catch (memErr) {
    console.error('[Database Fatal Error] Failed to initialize embedded MongoDB:', memErr.message);
    throw memErr;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
