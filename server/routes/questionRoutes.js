const express = require('express');
const router = express.Router();
const { getAllQuestions, getQuestionById, updatePracticeUrl } = require('../controllers/questionController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAllQuestions);
router.get('/:id', protect, getQuestionById);
router.put('/:id/practice-url', protect, updatePracticeUrl);

module.exports = router;
