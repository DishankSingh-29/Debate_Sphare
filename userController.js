const User = require('../models/User');
const DebateSession = require('../models/DebateSession');
const PerformanceMetrics = require('../models/PerformanceMetrics');
const AppError = require('../middleware/errorHandler').AppError;
const logger = require('../debatesphere/backend/config/logger');

/**
 * User Controller
 * Handles user profile management, statistics, and history
 */

/**
 * Get current user's profile
 * @route GET /api/users/profile
 * @access Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetToken -resetTokenExpiry');
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error getting user profile:', error);
    next(error);
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, profileImage, skillLevel, bio, preferences } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (profileImage) updateData.profileImage = profileImage;
    if (skillLevel) updateData.skillLevel = skillLevel;
    if (bio) updateData.bio = bio;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetToken -resetTokenExpiry');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    logger.info(`User profile updated: ${user.id}`);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    next(error);
  }
};

/**
 * Get user statistics
 * @route GET /api/users/stats
 * @access Private
 */
const getStats = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    const userId = req.user.id;

    // Calculate date range based on period
    let dateFilter = {};
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      dateFilter = { startTime: { $gte: startDate } };
    }

    // Get debate sessions
    const sessions = await DebateSession.find({
      userId,
      status: 'completed',
      ...dateFilter
    }).populate('topicId', 'title category');

    // Calculate statistics
    const totalDebates = sessions.length;
    const totalTime = sessions.reduce((sum, session) => {
      if (session.endTime && session.startTime) {
        return sum + (session.endTime - session.startTime) / 1000 / 60; // Convert to minutes
      }
      return sum;
    }, 0);

    const averageScore = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / sessions.length 
      : 0;

    // Calculate win rate
    const wins = sessions.filter(session => session.finalScore >= 7).length;
    const winRate = totalDebates > 0 ? (wins / totalDebates) * 100 : 0;

    // Get favorite topics
    const topicCounts = {};
    sessions.forEach(session => {
      if (session.topicId) {
        const topicId = session.topicId._id.toString();
        topicCounts[topicId] = (topicCounts[topicId] || 0) + 1;
      }
    });

    const favoriteTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topicId]) => topicId);

    // Get recent activity
    const recentActivity = await DebateSession.find({
      userId,
      ...dateFilter
    })
    .sort({ startTime: -1 })
    .limit(5)
    .populate('topicId', 'title category')
    .select('startTime endTime finalScore topicId status');

    const stats = {
      totalDebates,
      winRate: Math.round(winRate * 100) / 100,
      averageScore: Math.round(averageScore * 100) / 100,
      totalTime: Math.round(totalTime),
      favoriteTopics,
      recentActivity
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    next(error);
  }
};

/**
 * Get user debate history
 * @route GET /api/users/history
 * @access Private
 */
const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, topic } = req.query;
    const userId = req.user.id;

    const filter = { userId };
    if (status) filter.status = status;
    if (topic) filter.topicId = topic;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await DebateSession.find(filter)
      .populate('topicId', 'title category difficulty')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DebateSession.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    res.status(200).json({
      success: true,
      data: sessions,
      pagination
    });
  } catch (error) {
    logger.error('Error getting user history:', error);
    next(error);
  }
};

/**
 * Get detailed performance metrics
 * @route GET /api/users/performance
 * @access Private
 */
const getPerformance = async (req, res, next) => {
  try {
    const { sessionId, period = 'all' } = req.query;
    const userId = req.user.id;

    let metrics;

    if (sessionId) {
      // Get metrics for specific session
      metrics = await PerformanceMetrics.findOne({
        userId,
        sessionId
      }).populate('sessionId', 'topicId startTime endTime finalScore');

      if (!metrics) {
        return next(new AppError('Performance metrics not found', 404));
      }
    } else {
      // Get aggregated metrics for period
      let dateFilter = {};
      if (period !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (period) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        dateFilter = { createdAt: { $gte: startDate } };
      }

      metrics = await PerformanceMetrics.find({
        userId,
        ...dateFilter
      }).populate('sessionId', 'topicId startTime endTime finalScore');
    }

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    next(error);
  }
};

/**
 * Get leaderboard rankings
 * @route GET /api/users/leaderboard
 * @access Public
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { category, period = 'all', limit = 10 } = req.query;

    // Calculate date range based on period
    let dateFilter = {};
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      dateFilter = { startTime: { $gte: startDate } };
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: { status: 'completed', ...dateFilter } },
      {
        $lookup: {
          from: 'topics',
          localField: 'topicId',
          foreignField: '_id',
          as: 'topic'
        }
      },
      { $unwind: '$topic' }
    ];

    if (category) {
      pipeline.push({ $match: { 'topic.category': category } });
    }

    pipeline.push(
      {
        $group: {
          _id: '$userId',
          totalDebates: { $sum: 1 },
          averageScore: { $avg: '$finalScore' },
          totalTime: { $sum: { $subtract: ['$endTime', '$startTime'] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          user: {
            _id: '$user._id',
            name: '$user.name',
            profileImage: '$user.profileImage',
            skillLevel: '$user.skillLevel'
          },
          stats: {
            totalDebates: '$totalDebates',
            averageScore: { $round: ['$averageScore', 2] },
            totalTime: { $round: [{ $divide: ['$totalTime', 60000] }, 0] } // Convert to minutes
          }
        }
      },
      { $sort: { 'stats.averageScore': -1, 'stats.totalDebates': -1 } },
      { $limit: parseInt(limit) }
    );

    const leaderboard = await DebateSession.aggregate(pipeline);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

    res.status(200).json({
      success: true,
      data: rankedLeaderboard
    });
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    next(error);
  }
};

/**
 * Get public user profile
 * @route GET /api/users/:userId
 * @access Public
 */
const getPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('name profileImage skillLevel bio createdAt')
      .lean();

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Get public statistics
    const sessions = await DebateSession.find({
      userId,
      status: 'completed'
    }).populate('topicId', 'title category');

    const totalDebates = sessions.length;
    const averageScore = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / sessions.length 
      : 0;

    const wins = sessions.filter(session => session.finalScore >= 7).length;
    const winRate = totalDebates > 0 ? (wins / totalDebates) * 100 : 0;

    const publicStats = {
      totalDebates,
      winRate: Math.round(winRate * 100) / 100,
      averageScore: Math.round(averageScore * 100) / 100
    };

    res.status(200).json({
      success: true,
      data: {
        profile: user,
        publicStats
      }
    });
  } catch (error) {
    logger.error('Error getting public profile:', error);
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getStats,
  getHistory,
  getPerformance,
  getLeaderboard,
  getPublicProfile
}; 