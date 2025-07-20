const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  next();
};

/**
 * User registration validation
 */
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

/**
 * User login validation
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Password reset validation
 */
const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

/**
 * New password validation
 */
const validateNewPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * User profile update validation
 */
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('skillLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid skill level'),
  
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be a boolean'),
  
  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification preference must be a boolean'),
  
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Invalid theme preference'),
  
  body('preferences.language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'hi'])
    .withMessage('Invalid language preference'),
  
  handleValidationErrors
];

/**
 * Debate topic creation validation
 */
const validateTopicCreation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1000 characters'),
  
  body('category')
    .isIn([
      'politics', 'economics', 'social-issues', 'technology', 'environment',
      'education', 'health', 'ethics', 'international-relations', 'science',
      'culture', 'sports', 'entertainment', 'business', 'law', 'philosophy'
    ])
    .withMessage('Invalid category'),
  
  body('difficultyLevel')
    .isIn(['easy', 'medium', 'hard', 'expert'])
    .withMessage('Invalid difficulty level'),
  
  body('tags')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Tags must be an array with 1-10 items'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters'),
  
  body('proArguments')
    .optional()
    .isArray({ min: 1, max: 5 })
    .withMessage('Pro arguments must be an array with 1-5 items'),
  
  body('proArguments.*')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Each pro argument must be between 10 and 500 characters'),
  
  body('conArguments')
    .optional()
    .isArray({ min: 1, max: 5 })
    .withMessage('Con arguments must be an array with 1-5 items'),
  
  body('conArguments.*')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Each con argument must be between 10 and 500 characters'),
  
  body('estimatedDuration')
    .optional()
    .isInt({ min: 5, max: 60 })
    .withMessage('Estimated duration must be between 5 and 60 minutes'),
  
  handleValidationErrors
];

/**
 * Debate session creation validation
 */
const validateSessionCreation = [
  body('topicId')
    .isMongoId()
    .withMessage('Invalid topic ID'),
  
  body('chosenSide')
    .isIn(['pro', 'con'])
    .withMessage('Chosen side must be either "pro" or "con"'),
  
  body('aiDifficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard', 'expert'])
    .withMessage('Invalid AI difficulty level'),
  
  body('aiPersonality')
    .optional()
    .isIn(['analytical', 'passionate', 'skeptical', 'diplomatic', 'challenging'])
    .withMessage('Invalid AI personality'),
  
  body('sessionSettings.maxTurns')
    .optional()
    .isInt({ min: 5, max: 20 })
    .withMessage('Max turns must be between 5 and 20'),
  
  body('sessionSettings.timeLimit')
    .optional()
    .isInt({ min: 10, max: 60 })
    .withMessage('Time limit must be between 10 and 60 minutes'),
  
  body('sessionSettings.allowEvidence')
    .optional()
    .isBoolean()
    .withMessage('Allow evidence must be a boolean'),
  
  body('sessionSettings.allowRebuttals')
    .optional()
    .isBoolean()
    .withMessage('Allow rebuttals must be a boolean'),
  
  handleValidationErrors
];

/**
 * Debate message validation
 */
const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  
  body('messageType')
    .optional()
    .isIn(['opening', 'argument', 'rebuttal', 'evidence', 'closing', 'general'])
    .withMessage('Invalid message type'),
  
  body('parentMessage')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent message ID'),
  
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID'),
  
  handleValidationErrors
];

/**
 * AI response validation
 */
const validateAIRequest = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),
  
  body('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID'),
  
  body('userSide')
    .isIn(['pro', 'con'])
    .withMessage('User side must be either "pro" or "con"'),
  
  handleValidationErrors
];

/**
 * Performance analysis validation
 */
const validatePerformanceAnalysis = [
  body('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID'),
  
  body('metrics')
    .isObject()
    .withMessage('Metrics must be an object'),
  
  body('metrics.argumentStrength')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Argument strength must be between 0 and 100'),
  
  body('metrics.rebuttalQuality')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Rebuttal quality must be between 0 and 100'),
  
  body('metrics.clarity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Clarity must be between 0 and 100'),
  
  body('metrics.evidenceUse')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Evidence use must be between 0 and 100'),
  
  body('metrics.logicalConsistency')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Logical consistency must be between 0 and 100'),
  
  body('metrics.emotionalAppeal')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Emotional appeal must be between 0 and 100'),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort by must be a string'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
  
  handleValidationErrors
];

/**
 * Search validation
 */
const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  
  query('difficultyLevel')
    .optional()
    .isIn(['easy', 'medium', 'hard', 'expert'])
    .withMessage('Invalid difficulty level'),
  
  handleValidationErrors
];

/**
 * MongoDB ID validation
 */
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

/**
 * File upload validation
 */
const validateFileUpload = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('File is required');
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed');
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

/**
 * User feedback validation
 */
const validateUserFeedback = [
  body('accuracy')
    .isInt({ min: 1, max: 5 })
    .withMessage('Accuracy rating must be between 1 and 5'),
  
  body('helpfulness')
    .isInt({ min: 1, max: 5 })
    .withMessage('Helpfulness rating must be between 1 and 5'),
  
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments cannot exceed 500 characters'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateNewPassword,
  validateProfileUpdate,
  validateTopicCreation,
  validateSessionCreation,
  validateMessage,
  validateAIRequest,
  validatePerformanceAnalysis,
  validatePagination,
  validateSearch,
  validateMongoId,
  validateFileUpload,
  validateUserFeedback
}; 