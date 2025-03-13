const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { author, email, url, rt_rating_quality, rt_rating_price, rt_rating_service, comment, comment_post_ID } = req.body;
  
  console.log('Received review:', {
    name: author,
    email,
    url,
    qualityRating: rt_rating_quality,
    priceRating: rt_rating_price,
    serviceRating: rt_rating_service,
    comment,
    tourId: comment_post_ID,
  });

  // Redirect to Google Business Profile
  res.redirect('https://g.co/kgs/y8Br5KJ');
});

module.exports = router;