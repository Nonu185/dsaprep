const mongoose = require('mongoose');

const revisionHistoryItemSchema = new mongoose.Schema({
  revisionIndex: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  recalledIndependently: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: ''
  }
}, { _id: false });

const userQuestionProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  questionId: {
    type: String,
    required: true,
    index: true
  },
  questionNumber: {
    type: Number,
    required: true,
    index: true
  },
  questionType: {
    type: String,
    enum: ['DSA', 'LANGUAGE_PRACTICE'],
    default: 'DSA',
    index: true
  },
  language: {
    type: String,
    enum: ['Java', 'JavaScript', 'Python'],
    default: 'Java',
    index: true
  },
  status: {
    type: String,
    enum: ['Not Started', 'Attempted', 'Completed', 'Solved', 'Needs Revision', 'Revisit Later'],
    default: 'Not Started',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  solvedAt: {
    type: Date
  },
  lastAttemptedAt: {
    type: Date
  },
  bookmarked: {
    type: Boolean,
    default: false,
    index: true
  },
  isImportant: {
    type: Boolean,
    default: false,
    index: true
  },
  notes: {
    type: String,
    default: ''
  },
  approach: {
    type: String,
    default: ''
  },
  bruteForce: {
    type: String,
    default: ''
  },
  optimizedApproach: {
    type: String,
    default: ''
  },
  timeComplexity: {
    type: String,
    default: ''
  },
  spaceComplexity: {
    type: String,
    default: ''
  },
  edgeCases: {
    type: String,
    default: ''
  },
  mistakes: {
    type: String,
    default: ''
  },
  keyLearning: {
    type: String,
    default: ''
  },
  revisionLevel: {
    type: Number,
    default: 0
  },
  nextRevisionAt: {
    type: Date,
    index: true
  },
  revisionHistory: [revisionHistoryItemSchema]
}, {
  timestamps: true
});

// Compound indexes
userQuestionProgressSchema.index({ userId: 1, questionId: 1, language: 1 }, { unique: true });
userQuestionProgressSchema.index({ userId: 1, questionType: 1, language: 1, status: 1 });
userQuestionProgressSchema.index({ userId: 1, status: 1 });
userQuestionProgressSchema.index({ status: 1, questionType: 1 });
userQuestionProgressSchema.index({ userId: 1, nextRevisionAt: 1 });

const UserQuestionProgress = mongoose.model('UserQuestionProgress', userQuestionProgressSchema);
module.exports = UserQuestionProgress;
