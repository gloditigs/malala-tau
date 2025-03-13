const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coverImage: { type: String}, // Cloudinary URL, required for creation but optional for updates
  additionalImages: [{ type: String }], // Array of Cloudinary URLs, optional
  location: { 
    type: String, 
    enum: ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'], 
    required: true 
  },
  price: { type: Number, required: true },
  durationHours: { type: Number, required: true },
  durationDays: { type: Number, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Optional: Add a pre-update hook to bypass full validation if needed
// tourSchema.pre('updateOne', function(next) {
//   this.setOptions({ runValidators: false });
//   next();
// });

module.exports = mongoose.model('Tour', tourSchema);