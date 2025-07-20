const mongoose = require('mongoose');

/**
 * Debate Message Schema
 * Stores individual messages exchanged during debate sessions
 */
const debateMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DebateSession',
    required: [true, 'Session ID is required']
  },
  senderType: {
    type: String,
    enum: ['user', 'ai'],
    required: [true, 'Sender type is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message content cannot exceed 2000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  turnNumber: {
    type: Number,
    required: [true, 'Turn number is required'],
    min: 1
  },
  messageType: {
    type: String,
    enum: ['opening', 'argument', 'rebuttal', 'evidence', 'closing', 'general'],
    default: 'general'
  },
  aiResponse: {
    model: {
      type: String,
      default: 'gpt-4'
    },
    tokens: {
      prompt: { type: Number, default: 0 },
      completion: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    responseTime: {
      type: Number, // in milliseconds
      default: 0
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },
  analysis: {
    argumentStrength: { type: Number, min: 0, max: 100, default: null },
    logicalConsistency: { type: Number, min: 0, max: 100, default: null },
    evidenceQuality: { type: Number, min: 0, max: 100, default: null },
    emotionalAppeal: { type: Number, min: 0, max: 100, default: null },
    clarity: { type: Number, min: 0, max: 100, default: null },
    relevance: { type: Number, min: 0, max: 100, default: null }
  },
  metadata: {
    wordCount: { type: Number, default: 0 },
    sentenceCount: { type: Number, default: 0 },
    paragraphCount: { type: Number, default: 0 },
    readingTime: { type: Number, default: 0 }, // in seconds
    complexity: { type: Number, min: 1, max: 10, default: 5 }
  },
  flags: {
    isEdited: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    containsEvidence: { type: Boolean, default: false },
    containsRebuttal: { type: Boolean, default: false }
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link', 'citation'],
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Attachment title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Attachment description cannot exceed 500 characters']
    },
    size: {
      type: Number, // in bytes
      default: 0
    }
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['like', 'dislike', 'insightful', 'confusing', 'strong', 'weak'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DebateMessage',
    default: null
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DebateMessage',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reading time in minutes
debateMessageSchema.virtual('readingTimeMinutes').get(function() {
  return Math.ceil(this.metadata.readingTime / 60);
});

// Virtual for average analysis score
debateMessageSchema.virtual('averageAnalysisScore').get(function() {
  const scores = Object.values(this.analysis).filter(score => score !== null);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
});

// Virtual for reaction counts
debateMessageSchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
  });
  return counts;
});

// Virtual for total reactions
debateMessageSchema.virtual('totalReactions').get(function() {
  return this.reactions.length;
});

// Indexes for better query performance
debateMessageSchema.index({ sessionId: 1 });
debateMessageSchema.index({ senderType: 1 });
debateMessageSchema.index({ timestamp: -1 });
debateMessageSchema.index({ turnNumber: 1 });
debateMessageSchema.index({ messageType: 1 });
debateMessageSchema.index({ 'flags.isFlagged': 1 });
debateMessageSchema.index({ 'flags.isReported': 1 });
debateMessageSchema.index({ parentMessage: 1 });
debateMessageSchema.index({ replyTo: 1 });

// Compound indexes for common queries
debateMessageSchema.index({ sessionId: 1, turnNumber: 1 });
debateMessageSchema.index({ sessionId: 1, timestamp: -1 });
debateMessageSchema.index({ sessionId: 1, senderType: 1 });

/**
 * Calculate message metadata
 */
debateMessageSchema.methods.calculateMetadata = function() {
  // Calculate word count
  this.metadata.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
  
  // Calculate sentence count
  this.metadata.sentenceCount = this.content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
  
  // Calculate paragraph count
  this.metadata.paragraphCount = this.content.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0).length;
  
  // Calculate reading time (average reading speed: 200 words per minute)
  this.metadata.readingTime = Math.ceil((this.metadata.wordCount / 200) * 60);
  
  // Calculate complexity based on word length and sentence structure
  const words = this.content.split(/\s+/).filter(word => word.length > 0);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const longWords = words.filter(word => word.length > 6).length;
  const longWordRatio = longWords / words.length;
  
  let complexity = 5; // base complexity
  if (avgWordLength > 5) complexity += 1;
  if (avgWordLength > 6) complexity += 1;
  if (longWordRatio > 0.2) complexity += 1;
  if (longWordRatio > 0.3) complexity += 1;
  if (this.metadata.sentenceCount > 5) complexity += 1;
  
  this.metadata.complexity = Math.max(1, Math.min(10, complexity));
  
  return this.metadata;
};

/**
 * Set analysis scores
 */
debateMessageSchema.methods.setAnalysis = function(analysis) {
  this.analysis = { ...this.analysis, ...analysis };
  return this.save();
};

/**
 * Add reaction to message
 */
debateMessageSchema.methods.addReaction = function(userId, type) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(reaction => reaction.userId.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({ userId, type });
  
  return this.save();
};

/**
 * Remove reaction from message
 */
debateMessageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => reaction.userId.toString() !== userId.toString());
  return this.save();
};

/**
 * Check if user has reacted to this message
 */
debateMessageSchema.methods.hasUserReaction = function(userId) {
  return this.reactions.some(reaction => reaction.userId.toString() === userId.toString());
};

/**
 * Get user's reaction to this message
 */
debateMessageSchema.methods.getUserReaction = function(userId) {
  const reaction = this.reactions.find(reaction => reaction.userId.toString() === userId.toString());
  return reaction ? reaction.type : null;
};

/**
 * Flag message for review
 */
debateMessageSchema.methods.flagMessage = function() {
  this.flags.isFlagged = true;
  return this.save();
};

/**
 * Report message
 */
debateMessageSchema.methods.reportMessage = function() {
  this.flags.isReported = true;
  return this.save();
};

/**
 * Pre-save middleware to calculate metadata
 */
debateMessageSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.calculateMetadata();
    
    // Set flags based on content analysis
    this.flags.containsEvidence = /evidence|study|research|data|statistics/i.test(this.content);
    this.flags.containsRebuttal = /however|but|although|nevertheless|on the other hand/i.test(this.content);
  }
  next();
});

/**
 * Static method to get messages for a session
 */
debateMessageSchema.statics.getSessionMessages = function(sessionId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    sortBy = 'timestamp',
    senderType
  } = options;

  const query = { sessionId };
  if (senderType) query.senderType = senderType;

  let sortOptions = {};
  switch (sortBy) {
    case 'timestamp':
      sortOptions = { timestamp: 1 };
      break;
    case 'turnNumber':
      sortOptions = { turnNumber: 1 };
      break;
    case 'newest':
      sortOptions = { timestamp: -1 };
      break;
    default:
      sortOptions = { timestamp: 1 };
  }

  return this.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .populate('parentMessage', 'content')
    .populate('replyTo', 'content');
};

/**
 * Static method to get message statistics for a session
 */
debateMessageSchema.statics.getSessionMessageStats = function(sessionId) {
  return this.aggregate([
    { $match: { sessionId: mongoose.Types.ObjectId(sessionId) } },
    {
      $group: {
        _id: '$senderType',
        count: { $sum: 1 },
        totalWords: { $sum: '$metadata.wordCount' },
        totalReadingTime: { $sum: '$metadata.readingTime' },
        avgComplexity: { $avg: '$metadata.complexity' },
        avgAnalysisScore: { $avg: '$averageAnalysisScore' }
      }
    }
  ]);
};

/**
 * Static method to search messages
 */
debateMessageSchema.statics.searchMessages = function(sessionId, searchTerm, options = {}) {
  const {
    limit = 20,
    skip = 0,
    senderType
  } = options;

  const query = {
    sessionId: mongoose.Types.ObjectId(sessionId),
    content: { $regex: searchTerm, $options: 'i' }
  };

  if (senderType) query.senderType = senderType;

  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('parentMessage', 'content')
    .populate('replyTo', 'content');
};

module.exports = mongoose.model('DebateMessage', debateMessageSchema); 