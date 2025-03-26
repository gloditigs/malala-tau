const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to:', process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@')); // Mask password
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000 // 30 seconds timeout
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;