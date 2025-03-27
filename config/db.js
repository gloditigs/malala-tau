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
      serverSelectionTimeoutMS: 9000, // 9 seconds to fit under 10s
      connectTimeoutMS: 9000,
      socketTimeoutMS: 9000
    });
    console.timeEnd('MongoDB Connection');
    console.log('MongoDB connected');
    cachedConnection = connection;
    return connection;
  } catch (err) {
    console.error('Connection error (non-fatal):', err.message);
    return null; // Allow app to continue without DB
  }
};

// Connect at startup
connectDB();

module.exports = connectDB;