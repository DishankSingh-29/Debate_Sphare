const DebateSession = require('../models/DebateSession');
const DebateMessage = require('../models/DebateMessage');
const DebateTopic = require('../models/DebateTopic');
const PerformanceMetrics = require('../models/PerformanceMetrics');
const AppError = require('../middleware/errorHandler').AppError;
const logger = require('../debatesphere/backend/config/logger');
const aiService = require('../services/aiService');

/**
 * AI Controller
 * Handles AI interactions, analysis, and feedback generation
 */

/**
 * Get AI response for debate
 * @route POST /api/ai/respond
 * @access Private
 */
const getResponse = async (req, res, next) => {
  try {
    const { sessionId, userMessage, context, difficulty = 'medium' } = req.body;
    const userId = req.user.id;

    // Check if session exists and user can access it
    const session = await DebateSession.findById(sessionId)
      .populate('topicId', 'title description category difficulty arguments evidence');

    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    if (session.userId.toString() !== userId) {
      return next(new AppError('Not authorized to access this session', 403));
    }
    if (session.status !== 'active') {
      return next(new AppError('Session is not active', 400));
    }

    // Get recent messages for context if not provided
    let messageContext = context;
    if (!messageContext) {
      const recentMessages = await DebateMessage.find({ sessionId })
        .sort({ timestamp: -1 })
        .limit(10);
      messageContext = recentMessages.reverse();
    }

    // Generate AI response
    const aiResponse = await aiService.generateResponse({
      sessionId,
      userMessage,
      context: messageContext,
      topic: session.topicId,
      chosenSide: session.chosenSide,
      difficulty,
      session
    });

    // Save AI message to database
    const message = new DebateMessage({
      sessionId,
      senderType: 'ai',
      content: aiResponse.content,
      type: aiResponse.type,
      metadata: {
        confidence: aiResponse.confidence,
        reasoning: aiResponse.reasoning,
        suggestions: aiResponse.suggestions
      },
      timestamp: new Date()
    });

    await message.save();

    logger.info(`AI response generated for session: ${sessionId}`);

    res.status(200).json({
      success: true,
      data: aiResponse
    });
  } catch (error) {
    logger.error('Error generating AI response:', error);
    next(error);
  }
};

/**
 * Analyze debate performance
 * @route POST /api/ai/analyze
 * @access Private
 */
const analyzePerformance = async (req, res, next) => {
  try {
    const { sessionId, includeDetailed = true } = req.body;
    const userId = req.user.id;

    // Check if session exists and user can access it
    const session = await DebateSession.findById(sessionId)
      .populate('topicId', 'title description category difficulty');

    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    if (session.userId.toString() !== userId) {
      return next(new AppError('Not authorized to access this session', 403));
    }
    if (session.status !== 'completed') {
      return next(new AppError('Session must be completed for analysis', 400));
    }

    // Get all messages from the session
    const messages = await DebateMessage.find({ sessionId })
      .sort({ timestamp: 1 });

    // Perform AI analysis
    const analysis = await aiService.analyzePerformance(sessionId, messages, {
      topic: session.topicId,
      chosenSide: session.chosenSide,
      includeDetailed
    });

    // Save or update performance metrics
    let metrics = await PerformanceMetrics.findOne({ sessionId, userId });
    if (!metrics) {
      metrics = new PerformanceMetrics({
        sessionId,
        userId,
        topicId: session.topicId._id
      });
    }

    metrics.argumentStrength = analysis.argumentStrength;
    metrics.logicalConsistency = analysis.logicalConsistency;
    metrics.evidenceUse = analysis.evidenceUse;
    metrics.rebuttalQuality = analysis.rebuttalQuality;
    metrics.overallScore = analysis.overallScore;
    metrics.feedback = analysis.feedback;
    metrics.analysis = analysis;

    await metrics.save();

    // Update session with analysis
    session.performanceMetrics = analysis;
    session.finalScore = analysis.overallScore;
    await session.save();

    logger.info(`Performance analysis completed for session: ${sessionId}`);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Error analyzing performance:', error);
    next(error);
  }
};

/**
 * Generate personalized feedback
 * @route POST /api/ai/generate-feedback
 * @access Private
 */
const generateFeedback = async (req, res, next) => {
  try {
    const { sessionId, focusAreas, skillLevel } = req.body;
    const userId = req.user.id;

    // Check if session exists and user can access it
    const session = await DebateSession.findById(sessionId)
      .populate('topicId', 'title description category difficulty');

    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    if (session.userId.toString() !== userId) {
      return next(new AppError('Not authorized to access this session', 403));
    }

    // Get user's performance metrics
    const metrics = await PerformanceMetrics.findOne({ sessionId, userId });
    if (!metrics) {
      return next(new AppError('Performance metrics not found. Please analyze the session first.', 400));
    }

    // Get user's debate history for context
    const userHistory = await DebateSession.find({
      userId,
      status: 'completed',
      _id: { $ne: sessionId }
    })
    .sort({ endTime: -1 })
    .limit(5)
    .populate('topicId', 'title category');

    // Generate personalized feedback
    const feedback = await aiService.generateFeedback({
      session,
      metrics,
      userHistory,
      focusAreas,
      skillLevel
    });

    logger.info(`Personalized feedback generated for session: ${sessionId}`);

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Error generating feedback:', error);
    next(error);
  }
};

/**
 * Get AI-suggested debate topics
 * @route POST /api/ai/suggest-topics
 * @access Private
 */
const suggestTopics = async (req, res, next) => {
  try {
    const { interests, skillLevel, category, count = 5 } = req.body;
    const userId = req.user.id;

    // Get user's debate history for context
    const userHistory = await DebateSession.find({
      userId,
      status: 'completed'
    })
    .sort({ endTime: -1 })
    .limit(10)
    .populate('topicId', 'title category difficulty');

    // Generate topic suggestions
    const suggestions = await aiService.suggestTopics({
      interests,
      skillLevel,
      category,
      count,
      userHistory
    });

    logger.info(`Topic suggestions generated for user: ${userId}`);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    logger.error('Error suggesting topics:', error);
    next(error);
  }
};

/**
 * Get AI suggestions to improve an argument
 * @route POST /api/ai/improve-argument
 * @access Private
 */
const improveArgument = async (req, res, next) => {
  try {
    const { argument, topic, side, focusAreas } = req.body;

    if (!argument || !topic) {
      return next(new AppError('Argument and topic are required', 400));
    }

    // Generate argument improvement suggestions
    const improvements = await aiService.improveArgument({
      argument,
      topic,
      side,
      focusAreas
    });

    logger.info('Argument improvement suggestions generated');

    res.status(200).json({
      success: true,
      data: improvements
    });
  } catch (error) {
    logger.error('Error improving argument:', error);
    next(error);
  }
};

/**
 * Validate and suggest evidence for arguments
 * @route POST /api/ai/validate-evidence
 * @access Private
 */
const validateEvidence = async (req, res, next) => {
  try {
    const { argument, topic, existingEvidence } = req.body;

    if (!argument || !topic) {
      return next(new AppError('Argument and topic are required', 400));
    }

    // Validate existing evidence and suggest new evidence
    const validation = await aiService.validateEvidence({
      argument,
      topic,
      existingEvidence
    });

    logger.info('Evidence validation completed');

    res.status(200).json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error('Error validating evidence:', error);
    next(error);
  }
};

/**
 * Get personalized learning path recommendations
 * @route GET /api/ai/learning-path
 * @access Private
 */
const getLearningPath = async (req, res, next) => {
  try {
    const { skillLevel, interests, goals } = req.query;
    const userId = req.user.id;

    // Get user's current performance data
    const userStats = await DebateSession.aggregate([
      { $match: { userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalDebates: { $sum: 1 },
          averageScore: { $avg: '$finalScore' },
          totalTime: { $sum: { $subtract: ['$endTime', '$startTime'] } }
        }
      }
    ]);

    const stats = userStats[0] || { totalDebates: 0, averageScore: 0, totalTime: 0 };

    // Get user's topic preferences
    const topicPreferences = await DebateSession.aggregate([
      { $match: { userId, status: 'completed' } },
      {
        $lookup: {
          from: 'topics',
          localField: 'topicId',
          foreignField: '_id',
          as: 'topic'
        }
      },
      { $unwind: '$topic' },
      {
        $group: {
          _id: '$topic.category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Generate learning path
    const learningPath = await aiService.generateLearningPath({
      skillLevel,
      interests,
      goals,
      stats,
      topicPreferences
    });

    logger.info(`Learning path generated for user: ${userId}`);

    res.status(200).json({
      success: true,
      data: learningPath
    });
  } catch (error) {
    logger.error('Error generating learning path:', error);
    next(error);
  }
};

module.exports = {
  getResponse,
  analyzePerformance,
  generateFeedback,
  suggestTopics,
  improveArgument,
  validateEvidence,
  getLearningPath
}; 