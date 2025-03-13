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
const upload = multer({ storage });

// Create Tour
router.post('/', upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 10 }
]), async (req, res) => {
  try {
    const { name, location, price, durationHours, durationDays, description } = req.body;

    console.log('POST Request Body:', req.body);
    console.log('POST Request Files:', req.files);

    if (!req.files || !req.files.coverImage || !req.files.coverImage[0]) {
      throw new Error('Cover image is required for new tours');
    }

    const coverImageResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'tours', resource_type: 'image' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          resolve(result);
        }
      ).end(req.files.coverImage[0].buffer);
    });

    const coverImage = coverImageResult.secure_url;
    console.log('Uploaded coverImage URL:', coverImage);

    const additionalImages = [];
    if (req.files.additionalImages) {
      for (const file of req.files.additionalImages) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'tours', resource_type: 'image' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          ).end(file.buffer);
        });
        additionalImages.push(result.secure_url);
      }
      console.log('Uploaded additionalImages URLs:', additionalImages);
    }

    const tour = new Tour({
      name,
      coverImage,
      additionalImages,
      location,
      price,
      durationHours,
      durationDays,
      description
    });
    const savedTour = await tour.save();
    console.log('Saved Tour:', savedTour);

    res.redirect('/cms');
  } catch (err) {
    console.error('Error in POST /tours:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get All Tours
router.get('/', async (req, res) => {
  try {
    const tours = await Tour.find();
    console.log('Fetched Tours:', tours);
    res.json(tours);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get Tour Counts by Location
router.get('/counts-by-location', async (req, res) => {
  try {
    const tourCounts = await Tour.aggregate([ // Fixed syntax here
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
    res.json(tourCountMap);
  } catch (err) {
    console.error('Error fetching tour counts by location:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get Single Tour
router.get('/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    res.json(tour);
  } catch (err) {
    console.error(err);
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

    console.log('PUT Request Body:', req.body);
    console.log('PUT Request Files:', req.files);

    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (price) updateData.price = price;
    if (durationHours) updateData.durationHours = durationHours;
    if (durationDays) updateData.durationDays = durationDays;
    if (description) updateData.description = description;

    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      const coverImageResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'tours', resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        ).end(req.files.coverImage[0].buffer);
      });
      updateData.coverImage = coverImageResult.secure_url;
      console.log('Updated coverImage URL:', updateData.coverImage);
    }

    if (req.files && req.files.additionalImages) {
      const additionalImages = [];
      for (const file of req.files.additionalImages) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'tours', resource_type: 'image' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          ).end(file.buffer);
        });
        additionalImages.push(result.secure_url);
      }
      updateData.additionalImages = additionalImages;
      console.log('Updated additionalImages URLs:', additionalImages);
    }

    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    res.redirect('/cms');
  } catch (err) {
    console.error('Error in PUT /tours:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Tour
router.delete('/:id', async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    res.redirect('/cms');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;