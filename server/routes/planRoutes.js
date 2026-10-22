const express = require('express');
const router = express.Router();
const {
  getTodayPlan,
  generateOrCustomizePlan,
  updatePlanItemStatus,
  replacePlanQuestion,
  reorderPlanQuestions,
  getMissedQuestions
} = require('../controllers/planController');
const { protect } = require('../middleware/auth');

router.get('/today', protect, getTodayPlan);
router.post('/customize', protect, generateOrCustomizePlan);
router.put('/item-status', protect, updatePlanItemStatus);
router.put('/replace', protect, replacePlanQuestion);
router.put('/reorder', protect, reorderPlanQuestions);
router.get('/missed', protect, getMissedQuestions);

module.exports = router;
