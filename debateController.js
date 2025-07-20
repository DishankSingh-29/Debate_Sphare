const DebateSession = require('../models/DebateSession');
const DebateMessage = require('../models/DebateMessage');
const DebateTopic = require('../models/DebateTopic');
const PerformanceMetrics = require('../models/PerformanceMetrics');
const AppError = require('../middleware/errorHandler').AppError;
const logger = require('../debatesphere/backend/config/logger');
const { sendAIMessage } = require('../websocket/socketHandler');

/**
 * Debate Controller
 * Handles debate session management, messages, and analysis
 */

/**
 * Start a new debate session
 * @route POST /api/debates/start
 * @access Private
 */
const startSession = async (req, res, next) => {
  try {
    const { topicId, chosenSide, timeLimit = 1800 } = req.body;
    const userId = req.user.id;

    // Check if topic exists and is approved
    const topic = await DebateTopic.findById(topicId);
    if (!topic) {
      return next(new AppError('Topic not found', 404));
    }
    if (!topic.approved) {
      return next(new AppError('Topic is not approved', 400));
    }

    // Check if user has an active session
    const activeSession = await DebateSession.findOne({
      userId,
      status: { $in: ['active', 'paused'] }
    });

    if (activeSession) {
      return next(new AppError('You already have an active debate session', 400));
    }

    // Create new session
    const session = new DebateSession({
      userId,
      topicId,
      chosenSide,
      timeLimit,
      startTime: new Date(),
      status: 'active'
    });

    await session.save();

    // Send initial AI message
    const aiMessage = await sendAIMessage(session._id, 'Welcome to the debate! I\'m ready to engage with you on this topic. Please share your opening argument.', 'argument');

    logger.info(`New debate session started: ${session.id} by user: ${userId}`);

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Error starting debate session:', error);
    next(error);
  }
};

/**
 * Get debate session details
 * @route GET /api/debates/:sessionId
 * @access Private
 */
const getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await DebateSession.findById(sessionId)
      .populate('topicId', 'title description category difficulty arguments evidence');

    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    // Check if user can access this session
    if (session.userId.toString() !== userId && !['admin', 'moderator'].includes(req.user.role)) {
      return next(new AppError('Not authorized to access this session', 403));
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Error getting session:', error);
    next(error);
  }
};

/**
 * Get debate messages
 * @route GET /api/debates/:sessionId/messages
 * @access Private
 */
const getMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const userId = req.user.id;

    // Check if session exists and user can access it
    const session = await DebateSession.findById(sessionId);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    if (session.userId.toString() !== userId && !['admin', 'moderator'].includes(req.user.role)) {
      return next(new AppError('Not authorized to access this session', 403));
    }

    const filter = { sessionId };
    if (before) {
      filter.timestamp = { $lt: new Date(before) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await DebateMessage.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DebateMessage.countDocuments({ sessionId });

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination
      }
    });
  } catch (error) {
    logger.error('Error getting messages:', error);
    next(error);
  }
};

/**
 * Send a message in debate session
 * @route POST /api/debates/:sessionId/messages
 * @access Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { content, type = 'argument' } = req.body;
    const userId = req.user.id;

    // Check if session exists and is active
    const session = await DebateSession.findById(sessionId);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    if (session.userId.toString() !== userId) {
      return next(new AppError('Not authorized to send messages in this session', 403));
    }
    if (session.status !== 'active') {
      return next(new AppError('Session is not active', 400));
    }

    // Check time limit
    if (session.timeLimit) {
      const elapsed = (new Date() - session.startTime) / 1000;
      if (elapsed > session.timeLimit) {
        session.status = 'completed';
        session.endTime = new Date();
        await session.save();
        return next(new AppError('Time limit exceeded', 400));
      }
    }

    // Create user message
    const message = new DebateMessage({
      sessionId,
      senderType: 'user',
      content,
      type,
      timestamp: new Date()
    });

    await message.save();

    // Trigger AI response
    setTimeout(async () => {
      try {
        await sendAIMessage(sessionId, content, type);
      } catch (error) {
        logger.error('Error sending AI response:', error);
      }
    }, 1000);

    logger.info(`Message sent in session ${sessionId} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    next(error);
  }
};

/**
 * Pause debate session
 * @route POST /api/debates/:sessionId/pause
 * @access Private
 */
const pauseSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await DebateSession.findById(sessionId);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    if (session.userId.toString() !== userId) {
      return next(new AppError('Not authorized to pause this session', 403));
    }
    if (session.status !== 'active') {
      return next(new AppError('Session cannot be paused', 400));
    }

    session.status = 'paused';
    session.pauseTime = new Date();
    await session.save();

    logger.info(`Session paused: ${sessionId} by user: ${userId}`);

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Error pausing session:', error);
    next(error);
  }
};

/**
 * Resume debate session
 * @route POST /api/debates/:sessionId/resume
 * @access Private
 */
const resumeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await DebateSession.findById(sessionId);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    if (session.userId.toString() !== userId) {
      return next(new AppError('Not authorized to resume this session', 403));
    }
    if (session.status !== 'paused') {
      return next(new AppError('Session cannot be resumed', 400));
    }

    session.status = 'active';
    session.resumeTime = new Date();
    await session.save();

    logger.info(`Session resumed: ${sessionId} by user: ${userId}`);

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Error resuming session:', error);
    next(error);
  }
};

/**
 * End debate session
 * @route POST /api/debates/:sessionId/end
 * @access Private
 */
const endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'completed' } = req.body;
    const userId = req.user.id;

    const session = await DebateSession.findById(sessionId);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    if (session.userId.toString() !== userId) {
      return next(new AppError('Not authorized to end this session', 403));
    }
    if (session.status === 'completed' || session.status === 'abandoned') {
      return next(new AppError('Session cannot be ended', 400));
    }

    session.status = reason === 'abandoned' ? 'abandoned' : 'completed';
    session.endTime = new Date();
    session.endReason = reason;

    // Calculate final score if completed
    if (session.status === 'completed') {
      const messages = await DebateMessage.find({ sessionId, senderType: 'user' });
      const aiService = require('../services/aiService');
      const analysis = await aiService.analyzePerformance(sessionId, messages);
      session.finalScore = analysis.overallScore;
      session.performanceMetrics = analysis;
    }

    await session.save();

    logger.info(`Session ended: ${sessionId} by user: ${userId}, reason: ${reason}`);

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Error ending session:', error);
    next(error);
  }
};

/**
 * Get debate analysis and performance metrics
 * @route GET /api/debates/:sessionId/analysis
 * @access Private
 */
const getAnalysis = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await DebateSession.findById(sessionId)
      .populate('topicId', 'title description category difficulty');

    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    if (session.userId.toString() !== userId && !['admin', 'moderator'].includes(req.user.role)) {
      return next(new AppError('Not authorized to access this session', 403));
    }

    // Get performance metrics
    const metrics = await PerformanceMetrics.findOne({ sessionId, userId });

    // Get messages for analysis
    const messages = await DebateMessage.find({ sessionId }).sort({ timestamp: 1 });

    // Generate analysis if not already done
    let analysis = session.performanceMetrics;
    if (!analysis && session.status === 'completed') {
      const aiService = require('../services/aiService');
      analysis = await aiService.analyzePerformance(sessionId, messages);
    }

    res.status(200).json({
      success: true,
      data: {
        session,
        metrics,
        analysis
      }
    });
  } catch (error) {
    logger.error('Error getting analysis:', error);
    next(error);
  }
};

/**
 * Submit feedback for debate session
 * @route POST /api/debates/:sessionId/feedback
 * @access Private
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { rating, feedback, aiQuality, topicQuality } = req.body;
    const userId = req.user.id;

    const session = await DebateSession.findById(sessionId);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    if (session.userId.toString() !== userId) {
      return next(new AppError('Not authorized to submit feedback for this session', 403));
    }

    // Update session with feedback
    session.userFeedback = {
      rating,
      feedback,
      aiQuality,
      topicQuality,
      submittedAt: new Date()
    };

    await session.save();

    logger.info(`Feedback submitted for session: ${sessionId} by user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting feedback:', error);
    next(error);
  }
};

/**
 * Get user's active debate sessions
 * @route GET /api/debates/active
 * @access Private
 */
const getActiveSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sessions = await DebateSession.find({
      userId,
      status: { $in: ['active', 'paused'] }
    }).populate('topicId', 'title category difficulty');

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error('Error getting active sessions:', error);
    next(error);
  }
};

/**
 * Add reaction to a debate message
 * @route POST /api/debates/:sessionId/messages/:messageId/react
 * @access Private
 */
const addReaction = async (req, res, next) => {
  try {
    const { sessionId, messageId } = req.params;
    const { reaction } = req.body;
    const userId = req.user.id;

    // Check if session exists and user can access it
    const session = await DebateSession.findById(sessionId);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    if (session.userId.toString() !== userId) {
      return next(new AppError('Not authorized to react to messages in this session', 403));
    }

    const message = await DebateMessage.findById(messageId);
    if (!message) {
      return next(new AppError('Message not found', 404));
    }
    if (message.sessionId.toString() !== sessionId) {
      return next(new AppError('Message does not belong to this session', 400));
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find(r => r.userId.toString() === userId);
    if (existingReaction) {
      return next(new AppError('You have already reacted to this message', 400));
    }

    // Add reaction
    message.reactions.push({
      userId,
      reaction,
      timestamp: new Date()
    });

    await message.save();

    logger.info(`Reaction added to message: ${messageId} by user: ${userId}`);

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error('Error adding reaction:', error);
    next(error);
  }
};

module.exports = {
  startSession,
  getSession,
  getMessages,
  sendMessage,
  pauseSession,
  resumeSession,
  endSession,
  getAnalysis,
  submitFeedback,
  getActiveSessions,
  addReaction
}; 