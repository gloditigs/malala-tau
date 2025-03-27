require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.time('MongoDB Connection');
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 9500,
      connectTimeoutMS: 9500,
      socketTimeoutMS: 9500
    });
    console.timeEnd('MongoDB Connection');
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Connection error (non-fatal):', err.message);
    // Don’t exit—let the app run without DB if it fails
  }
};

module.exports = connectDB;