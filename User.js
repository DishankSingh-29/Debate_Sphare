const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * User Schema
 * Handles user authentication, profile information, and debate statistics
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  profileImage: {
    type: String,
    default: null
  },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  statistics: {
    totalDebates: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for win rate
userSchema.virtual('winRate').get(function() {
  if (this.statistics.totalDebates === 0) return 0;
  return Math.round((this.statistics.totalWins / this.statistics.totalDebates) * 100);
});

// Virtual for win rate percentage
userSchema.virtual('winRatePercentage').get(function() {
  if (this.statistics.totalDebates === 0) return '0%';
  return `${Math.round((this.statistics.totalWins / this.statistics.totalDebates) * 100)}%`;
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ skillLevel: 1 });
userSchema.index({ 'statistics.totalDebates': -1 });

/**
 * Encrypt password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare entered password with hashed password in database
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate JWT token
 */
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      skillLevel: this.skillLevel
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/**
 * Generate refresh token
 */
userSchema.methods.getRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
    }
  );
};

/**
 * Generate and hash password reset token
 */
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

/**
 * Generate email verification token
 */
userSchema.methods.getEmailVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expire
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

/**
 * Update user statistics after debate
 */
userSchema.methods.updateDebateStats = function(score, isWin, duration) {
  this.statistics.totalDebates += 1;
  this.statistics.totalTimeSpent += duration || 0;
  
  if (isWin) {
    this.statistics.totalWins += 1;
    this.statistics.currentStreak += 1;
    if (this.statistics.currentStreak > this.statistics.longestStreak) {
      this.statistics.longestStreak = this.statistics.currentStreak;
    }
  } else {
    this.statistics.currentStreak = 0;
  }

  // Update average score
  const totalScore = (this.statistics.averageScore * (this.statistics.totalDebates - 1)) + score;
  this.statistics.averageScore = totalScore / this.statistics.totalDebates;

  return this.save();
};

/**
 * Update skill level based on performance
 */
userSchema.methods.updateSkillLevel = function() {
  const avgScore = this.statistics.averageScore;
  const totalDebates = this.statistics.totalDebates;
  const winRate = this.winRate;

  let newSkillLevel = this.skillLevel;

  if (totalDebates >= 10) {
    if (avgScore >= 85 && winRate >= 70) {
      newSkillLevel = 'expert';
    } else if (avgScore >= 75 && winRate >= 60) {
      newSkillLevel = 'advanced';
    } else if (avgScore >= 65 && winRate >= 50) {
      newSkillLevel = 'intermediate';
    } else {
      newSkillLevel = 'beginner';
    }
  }

  if (newSkillLevel !== this.skillLevel) {
    this.skillLevel = newSkillLevel;
    return this.save();
  }

  return Promise.resolve(this);
};

module.exports = mongoose.model('User', userSchema); 