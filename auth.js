const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Protect routes - Verify JWT token and authenticate user
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. No token provided.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found with this token.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account is deactivated.'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Token verification failed.'
    });
  }
};

/**
 * Optional authentication - Verify JWT token if provided but don't require it
 */
const optionalAuth = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token, continue without authentication
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      req.user = null;
      return next();
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    // If token is invalid, continue without authentication
    req.user = null;
    next();
  }
};

/**
 * Refresh token middleware
 */
const refreshToken = async (req, res, next) => {
  let token;

  // Check for refresh token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Refresh token not provided.'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Get user
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive.'
      });
    }

    // Generate new access token
    const newAccessToken = user.getSignedJwtToken();
    const newRefreshToken = user.getRefreshToken();

    req.user = user;
    req.newAccessToken = newAccessToken;
    req.newRefreshToken = newRefreshToken;
    next();
  } catch (error) {
    logger.error('Refresh token verification failed:', error.message);
    
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token.'
    });
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route.`
      });
    }

    next();
  };
};

/**
 * Skill level authorization middleware
 */
const requireSkillLevel = (minSkillLevel) => {
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated.'
      });
    }

    const userSkillIndex = skillLevels.indexOf(req.user.skillLevel);
    const requiredSkillIndex = skillLevels.indexOf(minSkillLevel);

    if (userSkillIndex < requiredSkillIndex) {
      return res.status(403).json({
        success: false,
        error: `This feature requires at least '${minSkillLevel}' skill level. Your current level is '${req.user.skillLevel}'.`
      });
    }

    next();
  };
};

/**
 * Rate limiting for authentication attempts
 */
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * Check if user has completed email verification
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated.'
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required. Please verify your email address.'
    });
  }

  next();
};

/**
 * Check if user has sufficient debate experience
 */
const requireDebateExperience = (minDebates = 5) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated.'
      });
    }

    if (req.user.statistics.totalDebates < minDebates) {
      return res.status(403).json({
        success: false,
        error: `This feature requires at least ${minDebates} completed debates. You have completed ${req.user.statistics.totalDebates} debates.`
      });
    }

    next();
  };
};

/**
 * Log user activity
 */
const logUserActivity = (req, res, next) => {
  if (req.user) {
    // Update last login time
    User.findByIdAndUpdate(req.user._id, { lastLogin: new Date() })
      .catch(error => logger.error('Failed to update last login:', error));
    
    logger.info(`User activity: ${req.user.email} - ${req.method} ${req.originalUrl}`);
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  refreshToken,
  authorize,
  requireSkillLevel,
  authRateLimit,
  requireEmailVerification,
  requireDebateExperience,
  logUserActivity
}; 