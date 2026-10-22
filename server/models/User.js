const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String,
    default: ''
  },
  preferences: {
    dailyTarget: {
      type: Number,
      default: 5,
      min: 1,
      max: 20
    },
    preferredLanguage: {
      type: String,
      default: 'Java'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    },
    revisionIntervals: {
      type: [Number],
      default: [1, 3, 7, 14, 30]
    },
    fontSize: {
      type: Number,
      default: 14,
      min: 10,
      max: 24
    },
    tabSize: {
      type: Number,
      default: 4,
      min: 2,
      max: 8
    },
    autosave: {
      type: Boolean,
      default: true
    },
    defaultOrdering: {
      type: String,
      enum: ['number', 'difficulty', 'topic', 'status'],
      default: 'number'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
