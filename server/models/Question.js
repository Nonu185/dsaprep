const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  questionNumber: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
    index: true
  },
  questionType: {
    type: String,
    enum: ['DSA', 'LANGUAGE_PRACTICE'],
    default: 'DSA',
    index: true
  },
  stableId: {
    type: String,
    index: true,
    trim: true
  },
  category: {
    type: String,
    default: '',
    trim: true,
    index: true
  },
  learningObjective: {
    type: String,
    default: '',
    trim: true
  },
  prompt: {
    type: String,
    default: '',
    trim: true
  },
  examples: [{
    input: { type: String, default: '' },
    output: { type: String, default: '' },
    explanation: { type: String, default: '' }
  }],
  pattern: {
    type: String,
    default: '',
    trim: true
  },
  practiceUrl: {
    type: String,
    default: '',
    trim: true
  },
  secondaryPracticeUrl: {
    type: String,
    default: '',
    trim: true
  },
  platform: {
    type: String,
    default: '',
    trim: true
  },
  originalStatus: {
    type: String,
    default: ''
  },
  matchedSheets: {
    type: String,
    default: ''
  },
  linkSourceCheck: {
    type: String,
    default: ''
  },
  striverMatch: {
    type: String,
    default: ''
  },
  neetcodeMatch: {
    type: String,
    default: ''
  },
  leetcodeMatch: {
    type: String,
    default: ''
  },
  gfgMatch: {
    type: String,
    default: ''
  },
  matchNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Text index for fast searching across title, pattern, topic
questionSchema.index({
  title: 'text',
  pattern: 'text',
  topic: 'text'
});

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
