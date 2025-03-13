const express = require('express');
const path = require('path');
const session = require('express-session');
const connectDB = require('../config/db');
const tourRoutes = require('./routes/tours');
const bookingRoutes = require('./routes/bookings');
const reviewsRouter = require('./routes/reviews');
require('dotenv').config();
const methodOverride = require('method-override');
const multer = require('multer'); // Add multer

const app = express();

// Multer setup for parsing multipart/form-data
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for simplicity

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload.any()); // Parse all fields from multipart/form-data
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(methodOverride('_method'));

// Connect to DB
connectDB();

// Routes
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewsRouter);

// Root route
app.get('/', async (req, res) => {
  try {
    const response = await fetch('https://malala-tau.vercel.app/api/tours/counts-by-location');
    if (!response.ok) {
      throw new Error(`Failed to fetch tour counts: ${response.status}`);
    }
    const tourCounts = await response.json();
    const Tour = require('../models/Tour');
    const tours = await Tour.find();
    res.render('index', { tourCounts, tours });
  } catch (error) {
    console.error('Error in root route:', error);
    res.status(500).send('Server error');
  }
});

// Tour details route
app.get('/tour/:id', async (req, res) => {
  try {
    const Tour = require('../models/Tour');
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).send('Tour not found');
    res.render('tour-details', { tour });
  } catch (error) {
    console.error('Error fetching tour:', error);
    res.status(500).send('Server error');
  }
});

// CMS Route
app.get('/cms', async (req, res) => {
  try {
    const Tour = require('../models/Tour');
    const tours = await Tour.find();
    res.render('cms', { tours });
  } catch (error) {
    console.error('Error fetching tours for CMS:', error);
    res.status(500).send('Server error');
  }
});

module.exports = app;