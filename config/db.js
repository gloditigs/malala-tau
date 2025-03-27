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
      serverSelectionTimeoutMS: 9500, // 9.5 seconds
      connectTimeoutMS: 9500,        // Max connection time
      socketTimeoutMS: 9500          // Max socket wait
    });
    console.timeEnd('MongoDB Connection');
    console.log('MongoDB connected');
    cachedConnection = connection;
    return connection;
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
};

// Pre-connect on startup
connectDB().catch(err => console.error('Pre-connection failed:', err.message));

module.exports = connectDB;