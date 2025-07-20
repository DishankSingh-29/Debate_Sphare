const crypto = require('crypto');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');
const logger = require('../debatesphere/backend/config/logger');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      const verificationURL = `${process.env.BASE_URL}/api/auth/verify-email/${verificationToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email - DebateSphere',
        template: 'emailVerification',
        data: {
          name: user.name,
          verificationURL
        }
      });
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You could implement a blacklist for tokens if needed
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 * @access Private
 */
const refreshToken = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Generate new tokens
    const newToken = user.getSignedJwtToken();
    const newRefreshToken = user.getRefreshToken();

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Send reset email
    try {
      const resetURL = `${process.env.BASE_URL}/reset-password/${resetToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Password Reset - DebateSphere',
        template: 'passwordReset',
        data: {
          name: user.name,
          resetURL
        }
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpire = undefined;
      await user.save();

      logger.error('Failed to send password reset email:', emailError);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send password reset email'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    // Generate new token
    const newToken = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: {
        token: newToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 * @route POST /api/auth/verify-email/:token
 * @access Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Get hashed token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 * @access Private
 */
const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      const verificationURL = `${process.env.BASE_URL}/api/auth/verify-email/${verificationToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email - DebateSphere',
        template: 'emailVerification',
        data: {
          name: user.name,
          verificationURL
        }
      });

      res.status(200).json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth callback
 * @route GET /api/auth/google/callback
 * @access Public
 */
const googleCallback = async (req, res, next) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Google authentication failed'
      });
    }

    // Generate tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();

    // Redirect to frontend with tokens
    const redirectURL = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`;
    res.redirect(redirectURL);
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * @route POST /api/auth/change-password
 * @access Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete account
 * @route DELETE /api/auth/delete-account
 * @access Private
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Verify password
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleCallback,
  changePassword,
  deleteAccount
}; 