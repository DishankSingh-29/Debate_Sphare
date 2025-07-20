const mongoose = require('mongoose');

/**
 * Performance Metrics Schema
 * Stores detailed performance analysis and feedback for debate sessions
 */
const performanceMetricsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DebateSession',
    required: [true, 'Session ID is required']
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DebateTopic',
    required: [true, 'Topic ID is required']
  },
  // Core performance metrics
  argumentStrength: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Argument strength score is required']
  },
  rebuttalQuality: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Rebuttal quality score is required']
  },
  clarity: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Clarity score is required']
  },
  evidenceUse: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Evidence use score is required']
  },
  logicalConsistency: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Logical consistency score is required']
  },
  emotionalAppeal: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Emotional appeal score is required']
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Overall score is required']
  },
  // Detailed feedback
  feedback: {
    strengths: [{
      category: {
        type: String,
        enum: ['argument', 'rebuttal', 'clarity', 'evidence', 'logic', 'appeal', 'general'],
        required: true
      },
      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: [300, 'Strength description cannot exceed 300 characters']
      },
      examples: [{
        type: String,
        trim: true,
        maxlength: [200, 'Example cannot exceed 200 characters']
      }]
    }],
    weaknesses: [{
      category: {
        type: String,
        enum: ['argument', 'rebuttal', 'clarity', 'evidence', 'logic', 'appeal', 'general'],
        required: true
      },
      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: [300, 'Weakness description cannot exceed 300 characters']
      },
      impact: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      suggestions: [{
        type: String,
        trim: true,
        maxlength: [200, 'Suggestion cannot exceed 200 characters']
      }]
    }],
    suggestions: [{
      category: {
        type: String,
        enum: ['argument', 'rebuttal', 'clarity', 'evidence', 'logic', 'appeal', 'general'],
        required: true
      },
      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: [300, 'Suggestion description cannot exceed 300 characters']
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      actionable: {
        type: Boolean,
        default: true
      }
    }],
    overallFeedback: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Overall feedback cannot exceed 1000 characters']
    }
  },
  // Detailed analysis
  analysis: {
    argumentStructure: {
      hasClearThesis: { type: Boolean, default: false },
      hasSupportingPoints: { type: Boolean, default: false },
      hasCounterArguments: { type: Boolean, default: false },
      hasConclusion: { type: Boolean, default: false },
      logicalFlow: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'fair'
      }
    },
    evidenceUsage: {
      hasStatistics: { type: Boolean, default: false },
      hasExamples: { type: Boolean, default: false },
      hasExpertOpinions: { type: Boolean, default: false },
      hasCaseStudies: { type: Boolean, default: false },
      evidenceQuality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'fair'
      },
      evidenceRelevance: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'fair'
      }
    },
    communication: {
      clarity: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'fair'
      },
      conciseness: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'fair'
      },
      engagement: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'fair'
      },
      tone: {
        type: String,
        enum: ['professional', 'conversational', 'formal', 'casual'],
        default: 'conversational'
      }
    },
    criticalThinking: {
      identifiesAssumptions: { type: Boolean, default: false },
      evaluatesEvidence: { type: Boolean, default: false },
      considersAlternatives: { type: Boolean, default: false },
      drawsConclusions: { type: Boolean, default: false },
      recognizesBias: { type: Boolean, default: false }
    }
  },
  // Performance trends
  trends: {
    improvementAreas: [{
      category: {
        type: String,
        enum: ['argument', 'rebuttal', 'clarity', 'evidence', 'logic', 'appeal'],
        required: true
      },
      currentScore: { type: Number, required: true },
      previousScore: { type: Number, required: true },
      improvement: { type: Number, required: true } // percentage
    }],
    consistentStrengths: [{
      category: {
        type: String,
        enum: ['argument', 'rebuttal', 'clarity', 'evidence', 'logic', 'appeal'],
        required: true
      },
      averageScore: { type: Number, required: true },
      frequency: { type: Number, required: true } // number of sessions
    }],
    areasOfConcern: [{
      category: {
        type: String,
        enum: ['argument', 'rebuttal', 'clarity', 'evidence', 'logic', 'appeal'],
        required: true
      },
      averageScore: { type: Number, required: true },
      trend: {
        type: String,
        enum: ['improving', 'declining', 'stable'],
        default: 'stable'
      }
    }]
  },
  // Session-specific metrics
  sessionMetrics: {
    totalMessages: { type: Number, default: 0 },
    averageMessageLength: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // average in seconds
    engagementLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    topicDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium'
    },
    sideChosen: {
      type: String,
      enum: ['pro', 'con'],
      required: true
    }
  },
  // AI analysis metadata
  aiAnalysis: {
    model: {
      type: String,
      default: 'gpt-4'
    },
    analysisTime: {
      type: Number, // in milliseconds
      default: 0
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    version: {
      type: String,
      default: '1.0'
    }
  },
  // User feedback on analysis
  userFeedback: {
    accuracy: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    helpfulness: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [500, 'User comments cannot exceed 500 characters']
    },
    submittedAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for performance level
performanceMetricsSchema.virtual('performanceLevel').get(function() {
  if (this.overallScore >= 90) return 'excellent';
  if (this.overallScore >= 80) return 'very good';
  if (this.overallScore >= 70) return 'good';
  if (this.overallScore >= 60) return 'fair';
  if (this.overallScore >= 50) return 'below average';
  return 'poor';
});

// Virtual for improvement potential
performanceMetricsSchema.virtual('improvementPotential').get(function() {
  return 100 - this.overallScore;
});

// Virtual for balanced score (considers all metrics equally)
performanceMetricsSchema.virtual('balancedScore').get(function() {
  const metrics = [
    this.argumentStrength,
    this.rebuttalQuality,
    this.clarity,
    this.evidenceUse,
    this.logicalConsistency,
    this.emotionalAppeal
  ];
  return Math.round(metrics.reduce((sum, score) => sum + score, 0) / metrics.length);
});

// Indexes for better query performance
performanceMetricsSchema.index({ userId: 1 });
performanceMetricsSchema.index({ sessionId: 1 });
performanceMetricsSchema.index({ topicId: 1 });
performanceMetricsSchema.index({ overallScore: -1 });
performanceMetricsSchema.index({ createdAt: -1 });
performanceMetricsSchema.index({ 'sessionMetrics.sideChosen': 1 });
performanceMetricsSchema.index({ 'sessionMetrics.topicDifficulty': 1 });

// Compound indexes for common queries
performanceMetricsSchema.index({ userId: 1, createdAt: -1 });
performanceMetricsSchema.index({ userId: 1, overallScore: -1 });
performanceMetricsSchema.index({ sessionId: 1, userId: 1 });

/**
 * Calculate overall score based on individual metrics
 */
performanceMetricsSchema.methods.calculateOverallScore = function() {
  const weights = {
    argumentStrength: 0.25,
    rebuttalQuality: 0.20,
    clarity: 0.15,
    evidenceUse: 0.15,
    logicalConsistency: 0.15,
    emotionalAppeal: 0.10
  };

  const weightedSum = Object.keys(weights).reduce((sum, metric) => {
    return sum + (this[metric] * weights[metric]);
  }, 0);

  this.overallScore = Math.round(weightedSum);
  return this.overallScore;
};

/**
 * Generate performance insights
 */
performanceMetricsSchema.methods.generateInsights = function() {
  const insights = {
    topStrengths: [],
    topWeaknesses: [],
    recommendations: []
  };

  const metrics = [
    { name: 'argumentStrength', label: 'Argument Strength' },
    { name: 'rebuttalQuality', label: 'Rebuttal Quality' },
    { name: 'clarity', label: 'Clarity' },
    { name: 'evidenceUse', label: 'Evidence Use' },
    { name: 'logicalConsistency', label: 'Logical Consistency' },
    { name: 'emotionalAppeal', label: 'Emotional Appeal' }
  ];

  // Sort metrics by score
  const sortedMetrics = metrics.map(metric => ({
    ...metric,
    score: this[metric.name]
  })).sort((a, b) => b.score - a.score);

  // Top strengths (scores above 80)
  insights.topStrengths = sortedMetrics
    .filter(metric => metric.score >= 80)
    .slice(0, 3)
    .map(metric => metric.label);

  // Top weaknesses (scores below 60)
  insights.topWeaknesses = sortedMetrics
    .filter(metric => metric.score < 60)
    .slice(0, 3)
    .map(metric => metric.label);

  // Generate recommendations
  insights.recommendations = this.generateRecommendations(sortedMetrics);

  return insights;
};

/**
 * Generate personalized recommendations
 */
performanceMetricsSchema.methods.generateRecommendations = function(sortedMetrics) {
  const recommendations = [];

  // Find lowest scoring areas
  const lowestMetrics = sortedMetrics.slice(-2);

  lowestMetrics.forEach(metric => {
    switch (metric.name) {
      case 'argumentStrength':
        recommendations.push('Focus on developing stronger, more compelling arguments with clear reasoning');
        break;
      case 'rebuttalQuality':
        recommendations.push('Practice identifying and addressing counterarguments more effectively');
        break;
      case 'clarity':
        recommendations.push('Work on expressing your ideas more clearly and concisely');
        break;
      case 'evidenceUse':
        recommendations.push('Incorporate more relevant evidence and examples to support your points');
        break;
      case 'logicalConsistency':
        recommendations.push('Ensure your arguments follow a logical structure and avoid contradictions');
        break;
      case 'emotionalAppeal':
        recommendations.push('Consider how to make your arguments more emotionally engaging');
        break;
    }
  });

  return recommendations;
};

/**
 * Pre-save middleware to calculate overall score
 */
performanceMetricsSchema.pre('save', function(next) {
  if (this.isModified('argumentStrength') || this.isModified('rebuttalQuality') ||
      this.isModified('clarity') || this.isModified('evidenceUse') ||
      this.isModified('logicalConsistency') || this.isModified('emotionalAppeal')) {
    this.calculateOverallScore();
  }
  next();
});

/**
 * Static method to get user performance history
 */
performanceMetricsSchema.statics.getUserPerformanceHistory = function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    sortBy = 'createdAt'
  } = options;

  let sortOptions = {};
  switch (sortBy) {
    case 'createdAt':
      sortOptions = { createdAt: -1 };
      break;
    case 'overallScore':
      sortOptions = { overallScore: -1 };
      break;
    case 'argumentStrength':
      sortOptions = { argumentStrength: -1 };
      break;
    default:
      sortOptions = { createdAt: -1 };
  }

  return this.find({ userId })
    .populate('sessionId', 'startTime endTime duration')
    .populate('topicId', 'title category difficultyLevel')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
};

/**
 * Static method to get performance statistics
 */
performanceMetricsSchema.statics.getPerformanceStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        averageOverallScore: { $avg: '$overallScore' },
        bestScore: { $max: '$overallScore' },
        worstScore: { $min: '$overallScore' },
        averageArgumentStrength: { $avg: '$argumentStrength' },
        averageRebuttalQuality: { $avg: '$rebuttalQuality' },
        averageClarity: { $avg: '$clarity' },
        averageEvidenceUse: { $avg: '$evidenceUse' },
        averageLogicalConsistency: { $avg: '$logicalConsistency' },
        averageEmotionalAppeal: { $avg: '$emotionalAppeal' }
      }
    }
  ]);
};

/**
 * Static method to get performance trends
 */
performanceMetricsSchema.statics.getPerformanceTrends = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        averageScore: { $avg: '$overallScore' },
        sessionCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('PerformanceMetrics', performanceMetricsSchema); 