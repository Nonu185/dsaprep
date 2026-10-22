const mongoose = require('mongoose');

const dailyPlanQuestionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  questionNumber: {
    type: Number,
    required: true
  },
  questionType: {
    type: String,
    enum: ['DSA', 'LANGUAGE_PRACTICE'],
    default: 'DSA'
  },
  order: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Not Started', 'Attempted', 'Completed', 'Solved'],
    default: 'Not Started'
  },
  completedAt: {
    type: Date
  }
}, { _id: false });

const dailyPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  target: {
    type: Number,
    default: 5,
    min: 1
  },
  questions: [dailyPlanQuestionSchema],
  summary: {
    target: {
      type: Number,
      default: 5
    },
    completedCount: {
      type: Number,
      default: 0
    },
    isMet: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// A user can only have one daily plan per date
dailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyPlan = mongoose.model('DailyPlan', dailyPlanSchema);
module.exports = DailyPlan;
