const express = require('express');
const router = express.Router();
const {
  getAuthConfig,
  googleAuth,
  logout,
  getMe,
  updatePreferences
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.get('/config', getAuthConfig);
router.post('/google', googleAuth);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
