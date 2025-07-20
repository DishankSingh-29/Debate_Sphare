const logger = require('../config/logger');

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle MongoDB duplicate key errors
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${value}. Please use another value.`;
  
  return new AppError(message, 400);
};

/**
 * Handle MongoDB validation errors
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(error => error.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  
  return new AppError(message, 400);
};

/**
 * Handle MongoDB cast errors
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  
  return new AppError(message, 400);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

/**
 * Handle Multer errors
 */
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large. Maximum size is 5MB.', 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files. Maximum is 1 file.', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field.', 400);
  }
  
  return new AppError('File upload error.', 400);
};

/**
 * Handle OpenAI API errors
 */
const handleOpenAIError = (err) => {
  if (err.code === 'insufficient_quota') {
    return new AppError('AI service quota exceeded. Please try again later.', 503);
  }
  if (err.code === 'rate_limit_exceeded') {
    return new AppError('AI service rate limit exceeded. Please try again later.', 429);
  }
  if (err.code === 'invalid_api_key') {
    return new AppError('AI service configuration error.', 500);
  }
  
  return new AppError('AI service temporarily unavailable. Please try again later.', 503);
};

/**
 * Handle WebSocket errors
 */
const handleWebSocketError = (err) => {
  logger.error('WebSocket error:', err);
  
  if (err.code === 'ECONNRESET') {
    return new AppError('Connection reset. Please reconnect.', 1001);
  }
  if (err.code === 'ECONNREFUSED') {
    return new AppError('Connection refused.', 1002);
  }
  
  return new AppError('WebSocket connection error.', 1000);
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      status: err.status,
      statusCode: err.statusCode,
      stack: err.stack,
      ...(process.env.NODE_ENV === 'development' && { details: err })
    });
  }

  // Rendered error page
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message
      });
    }
    
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);
    
    return res.status(500).json({
      success: false,
      error: 'Something went wrong!'
    });
  }

  // Rendered error page
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  
  // Programming or other unknown error: don't leak error details
  logger.error('ERROR 💥', err);
  
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  });

  // Handle specific error types
  let error = { ...err };
  error.message = err.message;

  if (error.code === 11000) error = handleDuplicateKeyError(error);
  if (error.name === 'ValidationError') error = handleValidationError(error);
  if (error.name === 'CastError') error = handleCastError(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (error.name === 'MulterError') error = handleMulterError(error);
  if (error.name === 'OpenAIError') error = handleOpenAIError(error);
  if (error.name === 'WebSocketError') error = handleWebSocketError(error);

  // Send error response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Handle async errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  
  process.exit(1);
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  
  process.exit(1);
};

/**
 * Handle graceful shutdown
 */
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close server
  if (global.server) {
    global.server.close(() => {
      logger.info('HTTP server closed.');
      
      // Close database connection
      if (global.mongoose) {
        global.mongoose.connection.close(false, () => {
          logger.info('MongoDB connection closed.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  } else {
    process.exit(0);
  }
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  catchAsync,
  handleUnhandledRejection,
  handleUncaughtException,
  gracefulShutdown
}; 