const express = require('express');
const router = express.Router();
const { getAnalyticsSummary } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getAnalyticsSummary);

module.exports = router;
