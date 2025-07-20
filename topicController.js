const DebateTopic = require('../models/DebateTopic');
const AppError = require('../middleware/errorHandler').AppError;
const logger = require('../debatesphere/backend/config/logger');

/**
 * Topic Controller
 * Handles debate topic management, categories, and suggestions
 */

/**
 * Get all debate topics
 * @route GET /api/topics
 * @access Public
 */
const getAllTopics = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, difficulty, search, approved } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (approved !== undefined) filter.approved = approved === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const topics = await DebateTopic.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DebateTopic.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    res.status(200).json({
      success: true,
      data: {
        topics,
        pagination
      }
    });
  } catch (error) {
    logger.error('Error getting topics:', error);
    next(error);
  }
};

/**
 * Create a new debate topic
 * @route POST /api/topics
 * @access Private
 */
const createTopic = async (req, res, next) => {
  try {
    const { title, description, category, difficulty, arguments: args, evidence } = req.body;

    const topic = new DebateTopic({
      title,
      description,
      category,
      difficulty,
      arguments: args,
      evidence,
      createdBy: req.user.id,
      approved: req.user.role === 'admin' || req.user.role === 'moderator'
    });

    await topic.save();

    logger.info(`New topic created: ${topic.id} by user: ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: topic
    });
  } catch (error) {
    logger.error('Error creating topic:', error);
    next(error);
  }
};

/**
 * Get a specific debate topic
 * @route GET /api/topics/:topicId
 * @access Public
 */
const getTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const topic = await DebateTopic.findById(topicId);

    if (!topic) {
      return next(new AppError('Topic not found', 404));
    }

    // Update view count
    topic.stats.views += 1;
    await topic.save();

    res.status(200).json({
      success: true,
      data: topic
    });
  } catch (error) {
    logger.error('Error getting topic:', error);
    next(error);
  }
};

/**
 * Update a debate topic
 * @route PUT /api/topics/:topicId
 * @access Private
 */
const updateTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { title, description, category, difficulty, arguments: args, evidence } = req.body;

    const topic = await DebateTopic.findById(topicId);

    if (!topic) {
      return next(new AppError('Topic not found', 404));
    }

    // Check if user can update this topic
    if (topic.createdBy.toString() !== req.user.id && 
        !['admin', 'moderator'].includes(req.user.role)) {
      return next(new AppError('Not authorized to update this topic', 403));
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (difficulty) updateData.difficulty = difficulty;
    if (args) updateData.arguments = args;
    if (evidence) updateData.evidence = evidence;

    const updatedTopic = await DebateTopic.findByIdAndUpdate(
      topicId,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info(`Topic updated: ${topicId} by user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: updatedTopic
    });
  } catch (error) {
    logger.error('Error updating topic:', error);
    next(error);
  }
};

/**
 * Delete a debate topic
 * @route DELETE /api/topics/:topicId
 * @access Private (Admin/Moderator)
 */
const deleteTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const topic = await DebateTopic.findById(topicId);

    if (!topic) {
      return next(new AppError('Topic not found', 404));
    }

    await DebateTopic.findByIdAndDelete(topicId);

    logger.info(`Topic deleted: ${topicId} by user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting topic:', error);
    next(error);
  }
};

/**
 * Get all topic categories
 * @route GET /api/topics/categories
 * @access Public
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await DebateTopic.aggregate([
      { $match: { approved: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Add category descriptions
    const categoryDescriptions = {
      'Politics': 'Political debates and government policies',
      'Technology': 'Tech innovations and digital trends',
      'Environment': 'Climate change and environmental issues',
      'Health': 'Healthcare and medical topics',
      'Education': 'Educational policies and learning methods',
      'Economics': 'Economic theories and financial topics',
      'Social Issues': 'Society, culture, and social justice',
      'Science': 'Scientific discoveries and research',
      'Philosophy': 'Ethical and philosophical questions',
      'Sports': 'Sports-related debates and controversies'
    };

    const categoriesWithInfo = categories.map(cat => ({
      name: cat._id,
      count: cat.count,
      description: categoryDescriptions[cat._id] || 'General debate topics'
    }));

    res.status(200).json({
      success: true,
      data: categoriesWithInfo
    });
  } catch (error) {
    logger.error('Error getting categories:', error);
    next(error);
  }
};

/**
 * Get a random debate topic
 * @route GET /api/topics/random
 * @access Public
 */
const getRandomTopic = async (req, res, next) => {
  try {
    const { category, difficulty, exclude } = req.query;

    const filter = { approved: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (exclude) {
      const excludeIds = exclude.split(',').map(id => id.trim());
      filter._id = { $nin: excludeIds };
    }

    const topic = await DebateTopic.aggregate([
      { $match: filter },
      { $sample: { size: 1 } }
    ]);

    if (!topic || topic.length === 0) {
      return next(new AppError('No topics found matching criteria', 404));
    }

    // Update view count
    await DebateTopic.findByIdAndUpdate(topic[0]._id, {
      $inc: { 'stats.views': 1 }
    });

    res.status(200).json({
      success: true,
      data: topic[0]
    });
  } catch (error) {
    logger.error('Error getting random topic:', error);
    next(error);
  }
};

/**
 * Get topic suggestions
 * @route GET /api/topics/suggestions
 * @access Private
 */
const getSuggestions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const suggestions = await DebateTopic.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await DebateTopic.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    res.status(200).json({
      success: true,
      data: suggestions,
      pagination
    });
  } catch (error) {
    logger.error('Error getting suggestions:', error);
    next(error);
  }
};

/**
 * Submit a topic suggestion
 * @route POST /api/topics/suggestions
 * @access Private
 */
const suggestTopic = async (req, res, next) => {
  try {
    const { title, description, category, difficulty, reasoning } = req.body;

    const suggestion = new DebateTopic({
      title,
      description,
      category,
      difficulty,
      reasoning,
      createdBy: req.user.id,
      status: 'pending',
      approved: false
    });

    await suggestion.save();

    logger.info(`Topic suggestion submitted: ${suggestion.id} by user: ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    logger.error('Error submitting suggestion:', error);
    next(error);
  }
};

/**
 * Process topic suggestion (approve/reject)
 * @route PUT /api/topics/suggestions/:suggestionId
 * @access Private (Admin/Moderator)
 */
const processSuggestion = async (req, res, next) => {
  try {
    const { suggestionId } = req.params;
    const { action, feedback } = req.body;

    const suggestion = await DebateTopic.findById(suggestionId);

    if (!suggestion) {
      return next(new AppError('Suggestion not found', 404));
    }

    if (action === 'approve') {
      suggestion.status = 'approved';
      suggestion.approved = true;
      suggestion.approvedBy = req.user.id;
      suggestion.approvedAt = new Date();
    } else if (action === 'reject') {
      suggestion.status = 'rejected';
      suggestion.rejectedBy = req.user.id;
      suggestion.rejectedAt = new Date();
      suggestion.rejectionFeedback = feedback;
    } else {
      return next(new AppError('Invalid action', 400));
    }

    await suggestion.save();

    logger.info(`Topic suggestion ${action}ed: ${suggestionId} by user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: `Suggestion ${action}ed successfully`
    });
  } catch (error) {
    logger.error('Error processing suggestion:', error);
    next(error);
  }
};

/**
 * Get topic statistics
 * @route GET /api/topics/:topicId/stats
 * @access Public
 */
const getTopicStats = async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const topic = await DebateTopic.findById(topicId);

    if (!topic) {
      return next(new AppError('Topic not found', 404));
    }

    // Get debate sessions for this topic
    const DebateSession = require('../models/DebateSession');
    const sessions = await DebateSession.find({
      topicId,
      status: 'completed'
    });

    const totalSessions = sessions.length;
    const averageScore = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / sessions.length 
      : 0;

    // Calculate win rates for each side
    const forSessions = sessions.filter(s => s.chosenSide === 'for');
    const againstSessions = sessions.filter(s => s.chosenSide === 'against');

    const forWins = forSessions.filter(s => s.finalScore >= 7).length;
    const againstWins = againstSessions.filter(s => s.finalScore >= 7).length;

    const winRate = {
      for: forSessions.length > 0 ? (forWins / forSessions.length) * 100 : 0,
      against: againstSessions.length > 0 ? (againstWins / againstSessions.length) * 100 : 0
    };

    // Calculate average duration
    const averageDuration = sessions.length > 0 
      ? sessions.reduce((sum, session) => {
          if (session.endTime && session.startTime) {
            return sum + (session.endTime - session.startTime) / 1000 / 60; // Convert to minutes
          }
          return sum;
        }, 0) / sessions.length 
      : 0;

    // Calculate difficulty rating based on average scores
    const difficultyRating = averageScore > 0 ? Math.round((10 - averageScore) * 10) / 10 : 5;

    const stats = {
      totalSessions,
      averageScore: Math.round(averageScore * 100) / 100,
      winRate: {
        for: Math.round(winRate.for * 100) / 100,
        against: Math.round(winRate.against * 100) / 100
      },
      averageDuration: Math.round(averageDuration),
      difficultyRating
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting topic stats:', error);
    next(error);
  }
};

module.exports = {
  getAllTopics,
  createTopic,
  getTopic,
  updateTopic,
  deleteTopic,
  getCategories,
  getRandomTopic,
  getSuggestions,
  suggestTopic,
  processSuggestion,
  getTopicStats
}; 