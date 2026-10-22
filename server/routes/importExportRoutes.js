const express = require('express');
const router = express.Router();
const { exportTracker, previewImport, executeImport } = require('../controllers/importExportController');
const { protect } = require('../middleware/auth');

router.get('/export', protect, exportTracker);
router.post('/preview', protect, previewImport);
router.post('/import', protect, executeImport);

module.exports = router;
