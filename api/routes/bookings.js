const express = require('express');
const router = express.Router();
const querystring = require('querystring');

router.post('/', async (req, res) => {
  try {
    const {
      tourName,
      tourPrice,
      booking_obj_id,
      action,
      booking_date_from,
      adults,
      children,
      name,
      email,
      contact,
      country,
      subject,
      message
    } = req.body;

    console.log('Booking request body:', req.body);

    const missingFields = [];
    if (!tourName) missingFields.push('tourName');
    if (!tourPrice) missingFields.push('tourPrice');
    if (!booking_obj_id) missingFields.push('booking_obj_id');
    if (!booking_date_from) missingFields.push('booking_date_from');
    if (!adults) missingFields.push('adults');
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!contact) missingFields.push('contact');
    if (!country) missingFields.push('country');
    if (!subject) missingFields.push('subject');
    if (!message) missingFields.push('message');

    if (missingFields.length > 0) {
      throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
    }

    const totalAdults = parseInt(adults, 10);
    const totalChildren = parseInt(children || 0, 10);
    const pricePerAdult = parseFloat(tourPrice);
    if (isNaN(pricePerAdult) || pricePerAdult <= 0 || isNaN(totalAdults) || totalAdults <= 0) {
      throw new Error('Invalid tour price or number of adults');
    }
    const total = (totalAdults * pricePerAdult + totalChildren * (pricePerAdult * 0.5)).toFixed(2);

    const formData = {
      tourName,
      tourPrice,
      tourId: booking_obj_id,
      booking_date_from,
      adults: totalAdults,
      children: totalChildren,
      total,
      name,
      email,
      contact,
      country,
      subject,
      message
    };

    const basinEndpoint = 'https://usebasin.com/f/35927a0ab3b1';
    const basinResponse = await fetch(basinEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!basinResponse.ok) {
      const errorText = await basinResponse.text();
      throw new Error(`Failed to submit to Basin: ${basinResponse.status} - ${errorText}`);
    }

    const basinResult = await basinResponse.json();
    console.log('Basin submission successful:', basinResult);

    // Generate Payfast payment link without name_first and email_address
    const payfastData = {
      merchant_id: '24154510',
      merchant_key: 'hulrvjrdyo3rm',
      return_url: 'https://1234abcd.ngrok.io/success',
      cancel_url: 'https://1234abcd.ngrok.io/cancel',
      notify_url: 'https://1234abcd.ngrok.io/api/bookings/notify',
      amount: total,
      item_name: `Booking for ${tourName}`
    };

    const redirectUrl = `https://www.payfast.co.za/eng/process?${querystring.stringify(payfastData)}`;
    console.log('Generated Payfast URL:', redirectUrl);

    res.json({ redirect: redirectUrl });
  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/success', (req, res) => {
  res.send('Payment successful! Thank you for booking.');
});

router.get('/cancel', (req, res) => {
  res.send('Payment cancelled.');
});

router.post('/notify', (req, res) => {
  console.log('Payfast ITN:', req.body);
  res.status(200).send('OK');
});

module.exports = router;