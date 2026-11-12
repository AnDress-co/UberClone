const express = require('express');
const { createTrip, getTrip } = require('../services/tripService');
const { requireSimulatorKey } = require('../middleware/auth');

const router = express.Router();

router.post('/simulator/trips', requireSimulatorKey, async (req, res, next) => {
  try {
    const trip = await createTrip(req.body);
    return res.status(201).json({ trip });
  } catch (error) {
    return next(error);
  }
});

router.get('/trips/:tripId', async (req, res, next) => {
  try {
    const trip = await getTrip(req.params.tripId);
    if (!trip) return res.status(404).json({ error: 'TRIP_NOT_FOUND' });
    return res.json({ trip });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
