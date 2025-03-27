require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.time('MongoDB Connection');
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 9000 // 9 seconds
    });
    console.timeEnd('MongoDB Connection');
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;