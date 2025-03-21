const express = require('express');
const router = express.Router();
const Tour = require('../../models/Tour');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// Create Tour
router.post('/', upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 10 }
]), async (req, res) => {
  try {
    const { name, location, price, durationHours, durationDays, description } = req.body;

    // Log incoming request for debugging
    console.log('POST /api/tours - Request Body:', req.body);
    console.log('POST /api/tours - Files:', req.files);

    // Validate required fields
    if (!name || !location || !price) {
      return res.status(400).json({ error: 'Name, location, and price are required' });
    }
    if (!req.files || !req.files.coverImage || !req.files.coverImage[0]) {
      return res.status(400).json({ error: 'Cover image is required for new tours' });
    }

    // Upload cover image to Cloudinary
    const coverImageResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'tours', resource_type: 'image' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error (coverImage):', error);
            return reject(error);
          }
          resolve(result);
        }
      ).end(req.files.coverImage[0].buffer);
    });
    const coverImage = coverImageResult.secure_url;
    console.log('Uploaded coverImage URL:', coverImage);

    // Upload additional images to Cloudinary (if provided)
    const additionalImages = [];
    if (req.files.additionalImages) {
      for (const file of req.files.additionalImages) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'tours', resource_type: 'image' },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error (additionalImages):', error);
                return reject(error);
              }
              resolve(result);
            }
          ).end(file.buffer);
        });
        additionalImages.push(result.secure_url);
      }
      console.log('Uploaded additionalImages URLs:', additionalImages);
    }

    // Create and save the tour
    const tour = new Tour({
      name,
      coverImage,
      additionalImages,
      location,
      price,
      durationHours: durationHours || 0,
      durationDays: durationDays || 0,
      description: description || ''
    });
    const savedTour = await tour.save();
    console.log('Saved Tour:', savedTour);

    res.redirect('/cms');
  } catch (err) {
    console.error('Error in POST /api/tours:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get All Tours
router.get('/', async (req, res) => {
  try {
    const tours = await Tour.find();
    console.log('GET /api/tours - Fetched Tours:', tours);
    res.json(tours);
  } catch (err) {
    console.error('Error in GET /api/tours:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get Tour Counts by Location
router.get('/counts-by-location', async (req, res) => {
  try {
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

    console.log('GET /api/tours/counts-by-location - Tour counts:', tourCountMap);
    res.json(tourCountMap);
  } catch (err) {
    console.error('Error in GET /api/tours/counts-by-location:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get Single Tour
router.get('/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    console.log('GET /api/tours/:id - Fetched Tour:', tour);
    res.json(tour);
  } catch (err) {
    console.error('Error in GET /api/tours/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Tour
router.put('/:id', upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 10 }
]), async (req, res) => {
  try {
    const { name, location, price, durationHours, durationDays, description } = req.body;
    const updateData = {};

    console.log('PUT /api/tours/:id - Request Body:', req.body);
    console.log('PUT /api/tours/:id - Files:', req.files);

    // Populate updateData with provided fields
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (price) updateData.price = price;
    if (durationHours) updateData.durationHours = durationHours;
    if (durationDays) updateData.durationDays = durationDays;
    if (description) updateData.description = description;

    // Handle cover image update
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      const coverImageResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'tours', resource_type: 'image' },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error (coverImage):', error);
              return reject(error);
            }
            resolve(result);
          }
        ).end(req.files.coverImage[0].buffer);
      });
      updateData.coverImage = coverImageResult.secure_url;
      console.log('Updated coverImage URL:', updateData.coverImage);
    }

    // Handle additional images update
    if (req.files && req.files.additionalImages) {
      const additionalImages = [];
      for (const file of req.files.additionalImages) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'tours', resource_type: 'image' },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error (additionalImages):', error);
                return reject(error);
              }
              resolve(result);
            }
          ).end(file.buffer);
        });
        additionalImages.push(result.secure_url);
      }
      updateData.additionalImages = additionalImages;
      console.log('Updated additionalImages URLs:', additionalImages);
    }

    // Update the tour
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    console.log('PUT /api/tours/:id - Updated Tour:', tour);
    res.redirect('/cms');
  } catch (err) {
    console.error('Error in PUT /api/tours/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Tour
router.delete('/:id', async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    console.log('DELETE /api/tours/:id - Deleted Tour:', tour);
    res.redirect('/cms');
  } catch (err) {
    console.error('Error in DELETE /api/tours/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;