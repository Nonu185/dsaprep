const express = require('express');
const router = express.Router();
const { updateProgress, getProgressMap } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.get('/map', protect, getProgressMap);
router.put('/:questionId', protect, updateProgress);

module.exports = router;
