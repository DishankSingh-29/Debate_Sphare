const mongoose = require('mongoose');

/**
 * Debate Topic Schema
 * Manages debate topics with categories, difficulty levels, and metadata
 */
const debateTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a topic title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a topic description'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'politics',
      'economics',
      'social-issues',
      'technology',
      'environment',
      'education',
      'health',
      'ethics',
      'international-relations',
      'science',
      'culture',
      'sports',
      'entertainment',
      'business',
      'law',
      'philosophy'
    ]
  },
  difficultyLevel: {
    type: String,
    required: [true, 'Please provide a difficulty level'],
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  proArguments: [{
    type: String,
    trim: true,
    maxlength: [500, 'Argument cannot be more than 500 characters']
  }],
  conArguments: [{
    type: String,
    trim: true,
    maxlength: [500, 'Argument cannot be more than 500 characters']
  }],
  evidence: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    source: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      trim: true
    },
    side: {
      type: String,
      enum: ['pro', 'con', 'neutral'],
      default: 'neutral'
    }
  }],
  statistics: {
    totalDebates: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageDuration: { type: Number, default: 0 }, // in minutes
    proWins: { type: Number, default: 0 },
    conWins: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 } // calculated based on usage
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot be more than 500 characters']
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'hi']
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 15,
    min: [5, 'Minimum duration is 5 minutes'],
    max: [60, 'Maximum duration is 60 minutes']
  },
  complexity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  controversy: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for win rate
debateTopicSchema.virtual('proWinRate').get(function() {
  const total = this.statistics.proWins + this.statistics.conWins;
  if (total === 0) return 0;
  return Math.round((this.statistics.proWins / total) * 100);
});

debateTopicSchema.virtual('conWinRate').get(function() {
  const total = this.statistics.proWins + this.statistics.conWins;
  if (total === 0) return 0;
  return Math.round((this.statistics.conWins / total) * 100);
});

// Virtual for total wins
debateTopicSchema.virtual('totalWins').get(function() {
  return this.statistics.proWins + this.statistics.conWins;
});

// Indexes for better query performance
debateTopicSchema.index({ title: 'text', description: 'text' });
debateTopicSchema.index({ category: 1 });
debateTopicSchema.index({ difficultyLevel: 1 });
debateTopicSchema.index({ isActive: 1 });
debateTopicSchema.index({ isFeatured: 1 });
debateTopicSchema.index({ approvalStatus: 1 });
debateTopicSchema.index({ 'statistics.popularity': -1 });
debateTopicSchema.index({ language: 1 });

/**
 * Update topic statistics after debate
 */
debateTopicSchema.methods.updateDebateStats = function(score, duration, winner) {
  this.statistics.totalDebates += 1;
  this.statistics.totalTimeSpent += duration || 0;
  
  if (winner === 'pro') {
    this.statistics.proWins += 1;
  } else if (winner === 'con') {
    this.statistics.conWins += 1;
  }

  // Update average score
  const totalScore = (this.statistics.averageScore * (this.statistics.totalDebates - 1)) + score;
  this.statistics.averageScore = totalScore / this.statistics.totalDebates;

  // Update average duration
  const totalDuration = (this.statistics.averageDuration * (this.statistics.totalDebates - 1)) + duration;
  this.statistics.averageDuration = totalDuration / this.statistics.totalDebates;

  // Update popularity (simple algorithm based on usage)
  this.statistics.popularity += 1;

  return this.save();
};

/**
 * Get related topics based on category and tags
 */
debateTopicSchema.methods.getRelatedTopics = function(limit = 5) {
  return this.model('DebateTopic').find({
    _id: { $ne: this._id },
    isActive: true,
    approvalStatus: 'approved',
    $or: [
      { category: this.category },
      { tags: { $in: this.tags } }
    ]
  })
  .sort({ 'statistics.popularity': -1 })
  .limit(limit);
};

/**
 * Calculate topic complexity based on various factors
 */
debateTopicSchema.methods.calculateComplexity = function() {
  let complexity = 5; // base complexity

  // Adjust based on description length
  if (this.description.length > 500) complexity += 1;
  if (this.description.length > 800) complexity += 1;

  // Adjust based on number of arguments
  const totalArguments = (this.proArguments?.length || 0) + (this.conArguments?.length || 0);
  if (totalArguments > 4) complexity += 1;
  if (totalArguments > 8) complexity += 1;

  // Adjust based on evidence count
  if (this.evidence?.length > 3) complexity += 1;
  if (this.evidence?.length > 6) complexity += 1;

  // Adjust based on tags
  if (this.tags?.length > 3) complexity += 1;

  // Ensure complexity stays within bounds
  this.complexity = Math.max(1, Math.min(10, complexity));
  return this.complexity;
};

/**
 * Pre-save middleware to calculate complexity
 */
debateTopicSchema.pre('save', function(next) {
  if (this.isModified('description') || this.isModified('proArguments') || 
      this.isModified('conArguments') || this.isModified('evidence') || 
      this.isModified('tags')) {
    this.calculateComplexity();
  }
  next();
});

/**
 * Static method to get topics by difficulty and category
 */
debateTopicSchema.statics.getTopicsByFilters = function(filters = {}) {
  const {
    category,
    difficultyLevel,
    language = 'en',
    limit = 20,
    skip = 0,
    sortBy = 'popularity'
  } = filters;

  const query = {
    isActive: true,
    approvalStatus: 'approved',
    language
  };

  if (category) query.category = category;
  if (difficultyLevel) query.difficultyLevel = difficultyLevel;

  let sortOptions = {};
  switch (sortBy) {
    case 'popularity':
      sortOptions = { 'statistics.popularity': -1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    case 'oldest':
      sortOptions = { createdAt: 1 };
      break;
    case 'difficulty':
      sortOptions = { difficultyLevel: 1 };
      break;
    default:
      sortOptions = { 'statistics.popularity': -1 };
  }

  return this.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
};

/**
 * Static method to search topics
 */
debateTopicSchema.statics.searchTopics = function(searchTerm, options = {}) {
  const {
    category,
    difficultyLevel,
    language = 'en',
    limit = 20,
    skip = 0
  } = options;

  const query = {
    $text: { $search: searchTerm },
    isActive: true,
    approvalStatus: 'approved',
    language
  };

  if (category) query.category = category;
  if (difficultyLevel) query.difficultyLevel = difficultyLevel;

  return this.find(query)
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('DebateTopic', debateTopicSchema); 