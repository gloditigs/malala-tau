const express = require('express');
const path = require('path');
const session = require('express-session');
const connectDB = require('../config/db'); // Path to config/db.js
const tourRoutes = require('./routes/tours');
const bookingRoutes = require('./routes/bookings');
const reviewsRouter = require('./routes/reviews');
require('dotenv').config();
const methodOverride = require('method-override');
const multer = require('multer');

// Log environment variables
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

// Validate Cloudinary vars
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Missing Cloudinary environment variables.');
}

const app = express();

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log('Incoming Request:', { method: req.method, url: req.url });
  next();
});
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(methodOverride('_method'));

// Routes
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewsRouter);

// Root route - Respond immediately if DB isn’t ready
app.get('/', async (req, res) => {
  const Tour = require('../models/Tour');
  let tours = [];
  let tourCounts = {};

  try {
    const db = await connectDB();
    if (db) {
      const start = Date.now();
      tourCounts = await Tour.aggregate([
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $project: { location: '$_id', count: 1, _id: 0 } }
      ]).maxTimeMS(5000); // 5s timeout
      tours = await Tour.find().maxTimeMS(5000);
      console.log(`DB queries took ${Date.now() - start}ms`);
      tourCounts = tourCounts.reduce((acc, { location, count }) => {
        acc[location] = count;
        return acc;
      }, {});
      const allProvinces = ['Western Cape', 'Eastern Cape', 'Northern Cape', 'Free State', 'KwaZulu-Natal', 'North West', 'Gauteng', 'Mpumalanga', 'Limpopo'];
      allProvinces.forEach(province => {
        if (!tourCounts[province]) tourCounts[province] = 0;
      });
    }
  } catch (error) {
    console.error('Root route DB error:', error.message);
  }

  res.render('index', { tourCounts, tours });
});

// All Tours route
app.get('/all-tours', async (req, res) => {
  const Tour = require('../models/Tour');
  const { tr_locations } = req.query;
  let tours = [];

  try {
    const db = await connectDB();
    if (db) {
      let query = tr_locations ? { location: tr_locations } : {};
      tours = await Tour.find(query).maxTimeMS(5000);
    }
  } catch (error) {
    console.error('All-tours route DB error:', error.message);
  }

  res.render('all-tours', { tours, location: tr_locations || '' });
});

// Tour details route
app.get('/tour/:id', async (req, res) => {
  const Tour = require('../models/Tour');
  let tour = null;

  try {
    const db = await connectDB();
    if (db) {
      tour = await Tour.findById(req.params.id).maxTimeMS(5000);
    }
  } catch (err) {
    console.error('Tour route DB error:', err.message);
  }

  res.render('tour-details', { tour: tour || null });
});

// CMS Route
app.get('/cms', async (req, res) => {
  const Tour = require('../models/Tour');
  let tours = [];

  try {
    const db = await connectDB();
    if (db) {
      tours = await Tour.find().maxTimeMS(5000);
    }
  } catch (error) {
    console.error('CMS route DB error:', error.message);
  }

  res.render('cms', { tours });
});

// In api/index.js or app.js
app.get('/about-us', (req, res) => {
  res.render('about-us');
});

app.get('/contact-us', (req, res) => {
  res.render('contact-us');
});

module.exports = app;