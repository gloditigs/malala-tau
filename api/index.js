const express = require('express');
const path = require('path');
const session = require('express-session');
const connectDB = require('../config/db');
const tourRoutes = require('./routes/tours');
const bookingRoutes = require('./routes/bookings');
const reviewsRouter = require('./routes/reviews');
require('dotenv').config();
const methodOverride = require('method-override');
const multer = require('multer');


// Log environment variables to verify loading
console.log('Environment Variables Loaded:', {
  MONGODB_URI: process.env.MONGODB_URI ? '[SET]' : 'undefined',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '[REDACTED]' : 'undefined',
  BASIN_ENDPOINT: process.env.BASIN_ENDPOINT,
  PAYFAST_MERCHANT_ID: process.env.PAYFAST_MERCHANT_ID,
  PAYFAST_MERCHANT_KEY: process.env.PAYFAST_MERCHANT_KEY ? '[REDACTED]' : 'undefined',
  SESSION_SECRET: process.env.SESSION_SECRET ? '[REDACTED]' : 'undefined'
});

// Validate critical environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Missing Cloudinary environment variables. Check Vercel settings or .env file.');
}


const app = express();

// Multer setup for parsing multipart/form-data
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log('Incoming Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });
  next();
});

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
    const Tour = require('../models/Tour');

    // Directly query tour counts by location
    const tourCounts = await Tour.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $project: { location: '$_id', count: 1, _id: 0 } }
    ]);

    const tourCountMap = tourCounts.reduce((acc, { location, count }) => {
      acc[location] = count;
      return acc;
    }, {});

    const allProvinces = [
      'Western Cape', 'Eastern Cape', 'Northern Cape', 'Free State',
      'KwaZulu-Natal', 'North West', 'Gauteng', 'Mpumalanga', 'Limpopo'
    ];
    allProvinces.forEach(province => {
      if (!tourCountMap[province]) tourCountMap[province] = 0;
    });

    console.log('Tour counts by location:', tourCountMap);
    const tours = await Tour.find();
    res.render('index', { tourCounts: tourCountMap, tours });
  } catch (error) {
    console.error('Error in root route:', error);
    res.status(500).send('Server error');
  }
});

// All Tours route
app.get('/all-tours', async (req, res) => {
  try {
    const Tour = require('../models/Tour');
    const tours = await Tour.find(); // Fetch all tours
    res.render('all-tours', { tours }); // Render all-tours.ejs with tours data
  } catch (error) {
    console.error('Error in all-tours route:', error);
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