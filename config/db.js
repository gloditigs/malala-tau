require('dotenv').config();
const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }
  try {
    console.time('MongoDB Connection');
    console.log('Connecting to:', process.env.MONGODB_URI);
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5s to fail fast
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    console.timeEnd('MongoDB Connection');
    console.log('MongoDB connected');
    cachedConnection = connection;
    return connection;
  } catch (err) {
    console.error('DB Connection failed:', err.message);
    return null; // Non-fatal
  }
};

// Initialize at startup
connectDB();

module.exports = connectDB;