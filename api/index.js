const express = require('express');
const path = require('path');
const session = require('express-session');
const connectDB = require('../config/db'); // Correct path to config/db.js
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
app.use(express.static(path.join(__dirname, '../public'))); // Serve static files first
app.use(methodOverride('_method'));

// Pre-connect to DB at startup
let dbConnected = false;
connectDB().then(() => {
  dbConnected = true;
  console.log('DB connection established at startup');
}).catch(err => {
  console.error('DB connection failed at startup:', err.message);
});

// Routes
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewsRouter);

// Root route
app.get('/', async (req, res) => {
  try {
    if (!dbConnected) throw new Error('DB not connected');
    const Tour = require('../models/Tour');

    const tourCounts = await Tour.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $project: { location: '$_id', count: 1, _id: 0 } }
    ]).maxTimeMS(7000); // 7s timeout

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
    const tours = await Tour.find().maxTimeMS(7000); // 7s timeout
    res.render('index', { tourCounts: tourCountMap, tours });
  } catch (error) {
    console.error('Error in root route:', error.message);
    res.render('index', { tourCounts: {}, tours: [], error: 'Database unavailable' });
  }
});

// All Tours route with location-only filter
app.get('/all-tours', async (req, res) => {
  try {
    if (!dbConnected) throw new Error('DB not connected');
    const Tour = require('../models/Tour');
    const { tr_locations } = req.query;

    let query = {};
    if (tr_locations) query.location = tr_locations;

    console.log('Received tr_locations:', tr_locations);
    console.log('Search filter query:', query);

    const tours = await Tour.find(query).maxTimeMS(7000); // 7s timeout

    console.log('Found tours:', tours);
    res.render('all-tours', { tours, location: tr_locations || '' });
  } catch (error) {
    console.error('Error in all-tours route:', error.message);
    res.render('all-tours', { tours: [], location: '', error: 'Database unavailable' });
  }
});

// Tour details route
app.get('/tour/:id', async (req, res) => {
  try {
    if (!dbConnected) throw new Error('DB not connected');
    const Tour = require('../models/Tour');
    const tour = await fetchTourData(req.params.id, { timeout: 7000 });
    res.render('tour-details', { tour });
  } catch (err) {
    console.error('Error fetching tour:', err.message);
    res.render('tour-details', { tour: null, error: 'Tour not found or database unavailable' });
  }
});

// Helper function to fetch tour data with timeout
async function fetchTourData(id, options) {
  const Tour = require('../models/Tour');
  const start = Date.now();
  const tour = await Tour.findById(id).maxTimeMS(options.timeout);
  const duration = Date.now() - start;
  console.log(`fetchTourData took ${duration}ms for tour ID: ${id}`);
  if (!tour) throw new Error('Tour not found');
  return tour;
}

// CMS Route
app.get('/cms', async (req, res) => {
  try {
    if (!dbConnected) throw new Error('DB not connected');
    const Tour = require('../models/Tour');
    const tours = await Tour.find().maxTimeMS(7000); // 7s timeout
    res.render('cms', { tours });
  } catch (error) {
    console.error('Error fetching tours for CMS:', error.message);
    res.render('cms', { tours: [], error: 'Database unavailable' });
  }
});

module.exports = app;