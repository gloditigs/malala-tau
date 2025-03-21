const express = require('express');
const router = express.Router();
const querystring = require('querystring');

router.post('/', async (req, res) => {
  try {
    console.log('POST /api/bookings - Request Received');
    console.log('POST /api/bookings - Request Body:', req.body);
    console.log('POST /api/bookings - Headers:', req.headers);

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

    const requiredFields = {
      tourName,
      tourPrice,
      booking_obj_id,
      booking_date_from,
      adults,
      name,
      email,
      contact
    };

    const optionalFields = {
      children: children || '0',
      country: country || 'Not specified',
      subject: subject || `Booking for ${tourName || 'Unknown Tour'}`,
      message: message || 'No additional message provided'
    };

    const missingFields = Object.keys(requiredFields).filter(
      key => requiredFields[key] === undefined || requiredFields[key] === null || requiredFields[key].toString().trim() === ''
    );

    if (missingFields.length > 0) {
      console.log('Missing fields detected:', missingFields);
      throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
    }

    const totalAdults = parseInt(adults, 10);
    const totalChildren = parseInt(optionalFields.children, 10);
    const pricePerAdult = parseFloat(tourPrice);

    if (isNaN(pricePerAdult) || pricePerAdult <= 0) {
      throw new Error('Invalid tour price');
    }
    if (isNaN(totalAdults) || totalAdults <= 0) {
      throw new Error('Number of adults must be greater than 0');
    }
    if (isNaN(totalChildren) || totalChildren < 0) {
      throw new Error('Number of children cannot be negative');
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
      country: optionalFields.country,
      subject: optionalFields.subject,
      message: optionalFields.message
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

    const payfastData = {
      merchant_id: '24154510',
      merchant_key: 'hulrvjrdyo3rm',
      return_url: 'https://malala-tau.vercel.app/success',
      cancel_url: 'https://malala-tau.vercel.app/cancel',
      notify_url: 'https://malala-tau.vercel.app/api/bookings/notify',
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