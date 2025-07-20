const mongoose = require('mongoose');

/**
 * Debate Session Schema
 * Tracks individual debate sessions between users and AI
 */
const debateSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DebateTopic',
    required: [true, 'Topic ID is required']
  },
  chosenSide: {
    type: String,
    enum: ['pro', 'con'],
    required: [true, 'Chosen side is required']
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned', 'paused'],
    default: 'active'
  },
  finalScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  messageCount: {
    user: { type: Number, default: 0 },
    ai: { type: Number, default: 0 }
  },
  turnCount: {
    type: Number,
    default: 0
  },
  winner: {
    type: String,
    enum: ['user', 'ai', 'draw', null],
    default: null
  },
  aiDifficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  aiPersonality: {
    type: String,
    enum: ['analytical', 'passionate', 'skeptical', 'diplomatic', 'challenging'],
    default: 'analytical'
  },
  sessionSettings: {
    maxTurns: {
      type: Number,
      default: 10,
      min: 5,
      max: 20
    },
    timeLimit: {
      type: Number, // in minutes
      default: 30,
      min: 10,
      max: 60
    },
    allowEvidence: {
      type: Boolean,
      default: true
    },
    allowRebuttals: {
      type: Boolean,
      default: true
    }
  },
  performance: {
    argumentStrength: { type: Number, min: 0, max: 100, default: null },
    rebuttalQuality: { type: Number, min: 0, max: 100, default: null },
    clarity: { type: Number, min: 0, max: 100, default: null },
    evidenceUse: { type: Number, min: 0, max: 100, default: null },
    logicalConsistency: { type: Number, min: 0, max: 100, default: null },
    emotionalAppeal: { type: Number, min: 0, max: 100, default: null }
  },
  feedback: {
    strengths: [{
      type: String,
      trim: true,
      maxlength: [200, 'Strength description cannot exceed 200 characters']
    }],
    weaknesses: [{
      type: String,
      trim: true,
      maxlength: [200, 'Weakness description cannot exceed 200 characters']
    }],
    suggestions: [{
      type: String,
      trim: true,
      maxlength: [200, 'Suggestion cannot exceed 200 characters']
    }],
    overallFeedback: {
      type: String,
      trim: true,
      maxlength: [1000, 'Overall feedback cannot exceed 1000 characters']
    }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      default: 'desktop'
    },
    browser: String,
    os: String
  },
  flags: {
    isRated: { type: Boolean, default: false },
    isShared: { type: Boolean, default: false },
    hasTechnicalIssues: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  pauseTime: {
    type: Date,
    default: null
  },
  totalPauseDuration: {
    type: Number, // in minutes
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total message count
debateSessionSchema.virtual('totalMessages').get(function() {
  return this.messageCount.user + this.messageCount.ai;
});

// Virtual for session duration in minutes
debateSessionSchema.virtual('sessionDuration').get(function() {
  if (!this.endTime) return null;
  const duration = (this.endTime - this.startTime) / (1000 * 60); // Convert to minutes
  return Math.round(duration * 100) / 100; // Round to 2 decimal places
});

// Virtual for active duration (excluding pauses)
debateSessionSchema.virtual('activeDuration').get(function() {
  if (!this.endTime) return null;
  const totalDuration = (this.endTime - this.startTime) / (1000 * 60);
  return Math.round((totalDuration - this.totalPauseDuration) * 100) / 100;
});

// Virtual for user win status
debateSessionSchema.virtual('userWon').get(function() {
  return this.winner === 'user';
});

// Virtual for AI win status
debateSessionSchema.virtual('aiWon').get(function() {
  return this.winner === 'ai';
});

// Virtual for draw status
debateSessionSchema.virtual('isDraw').get(function() {
  return this.winner === 'draw';
});

// Indexes for better query performance
debateSessionSchema.index({ userId: 1 });
debateSessionSchema.index({ topicId: 1 });
debateSessionSchema.index({ status: 1 });
debateSessionSchema.index({ startTime: -1 });
debateSessionSchema.index({ endTime: -1 });
debateSessionSchema.index({ chosenSide: 1 });
debateSessionSchema.index({ winner: 1 });
debateSessionSchema.index({ 'flags.isRated': 1 });
debateSessionSchema.index({ lastActivity: -1 });

/**
 * Calculate session duration and update statistics
 */
debateSessionSchema.methods.calculateDuration = function() {
  if (!this.endTime) {
    this.duration = 0;
    return this.duration;
  }

  const totalDuration = (this.endTime - this.startTime) / (1000 * 60); // Convert to minutes
  this.duration = Math.round((totalDuration - this.totalPauseDuration) * 100) / 100;
  return this.duration;
};

/**
 * End the debate session
 */
debateSessionSchema.methods.endSession = function(winner = null, finalScore = null) {
  this.endTime = new Date();
  this.status = 'completed';
  this.winner = winner;
  this.finalScore = finalScore;
  this.calculateDuration();
  this.lastActivity = new Date();
  
  return this.save();
};

/**
 * Pause the debate session
 */
debateSessionSchema.methods.pauseSession = function() {
  if (this.status === 'active') {
    this.status = 'paused';
    this.pauseTime = new Date();
    this.lastActivity = new Date();
  }
  return this.save();
};

/**
 * Resume the debate session
 */
debateSessionSchema.methods.resumeSession = function() {
  if (this.status === 'paused' && this.pauseTime) {
    this.status = 'active';
    const pauseDuration = (new Date() - this.pauseTime) / (1000 * 60); // Convert to minutes
    this.totalPauseDuration += pauseDuration;
    this.pauseTime = null;
    this.lastActivity = new Date();
  }
  return this.save();
};

/**
 * Abandon the debate session
 */
debateSessionSchema.methods.abandonSession = function() {
  this.status = 'abandoned';
  this.endTime = new Date();
  this.calculateDuration();
  this.lastActivity = new Date();
  
  return this.save();
};

/**
 * Update session activity
 */
debateSessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

/**
 * Increment message count
 */
debateSessionSchema.methods.incrementMessageCount = function(senderType) {
  if (senderType === 'user') {
    this.messageCount.user += 1;
  } else if (senderType === 'ai') {
    this.messageCount.ai += 1;
  }
  this.turnCount += 1;
  this.updateActivity();
  return this.save();
};

/**
 * Set performance metrics
 */
debateSessionSchema.methods.setPerformanceMetrics = function(metrics) {
  this.performance = { ...this.performance, ...metrics };
  
  // Calculate overall score if all metrics are provided
  const metricsValues = Object.values(this.performance).filter(val => val !== null);
  if (metricsValues.length > 0) {
    this.finalScore = Math.round(metricsValues.reduce((sum, val) => sum + val, 0) / metricsValues.length);
  }
  
  return this.save();
};

/**
 * Set feedback
 */
debateSessionSchema.methods.setFeedback = function(feedback) {
  this.feedback = { ...this.feedback, ...feedback };
  this.flags.isRated = true;
  return this.save();
};

/**
 * Static method to get user's debate history
 */
debateSessionSchema.statics.getUserHistory = function(userId, options = {}) {
  const {
    status,
    limit = 20,
    skip = 0,
    sortBy = 'startTime'
  } = options;

  const query = { userId };
  if (status) query.status = status;

  let sortOptions = {};
  switch (sortBy) {
    case 'startTime':
      sortOptions = { startTime: -1 };
      break;
    case 'endTime':
      sortOptions = { endTime: -1 };
      break;
    case 'score':
      sortOptions = { finalScore: -1 };
      break;
    case 'duration':
      sortOptions = { duration: -1 };
      break;
    default:
      sortOptions = { startTime: -1 };
  }

  return this.find(query)
    .populate('topicId', 'title category difficultyLevel')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
};

/**
 * Static method to get session statistics
 */
debateSessionSchema.statics.getSessionStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        abandonedSessions: { $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] } },
        totalWins: { $sum: { $cond: [{ $eq: ['$winner', 'user'] }, 1, 0] } },
        totalDraws: { $sum: { $cond: [{ $eq: ['$winner', 'draw'] }, 1, 0] } },
        averageScore: { $avg: '$finalScore' },
        averageDuration: { $avg: '$duration' },
        totalTimeSpent: { $sum: '$duration' }
      }
    }
  ]);
};

module.exports = mongoose.model('DebateSession', debateSessionSchema); 