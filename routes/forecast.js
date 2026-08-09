const express = require('express');
const router = express.Router();
const { readData } = require('../models/storage');
const { generateForecast } = require('../models/forecast');

// GET /api/forecast?months=N
router.get('/', (req, res) => {
  const months = parseInt(req.query.months, 10);

  if (!months || months <= 0) {
    return res.status(400).json({ errors: ['months query param must be a positive number'] });
  }

  const data = readData();
  const forecast = generateForecast(data.balance, data.transactions, months);

  res.json(forecast);
});

module.exports = router;