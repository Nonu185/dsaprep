const express = require('express');
const router = express.Router();
const { getRevisionQueue, completeRevision, rescheduleRevision } = require('../controllers/revisionController');
const { protect } = require('../middleware/auth');

router.get('/queue', protect, getRevisionQueue);
router.post('/complete', protect, completeRevision);
router.post('/reschedule', protect, rescheduleRevision);

module.exports = router;
