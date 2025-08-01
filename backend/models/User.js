const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username must be no more than 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    lowercase: true,
    index: true,
    validate: {
      validator: function(v) {
        return !v.includes(' ');
      },
      message: 'Username cannot contain spaces'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please enter a valid email address'
    },
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  avatar: {
    type: String,
    default: '',
    maxlength: [500, 'Avatar URL too long'],
    validate: {
      validator: function(v) {
        if (!v) return true; // Empty string is allowed
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
          require_valid_protocol: true
        });
      },
      message: 'Avatar must be a valid URL with http/https protocol'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ lastActivity: -1 });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(12);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    
    // Reset login attempts on password change
    if (this.isModified('password') && this.loginAttempts > 0) {
      this.loginAttempts = 0;
      this.lockUntil = undefined;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // If account is locked, don't allow login
    if (this.isLocked) {
      const timeLeft = Math.ceil((this.lockUntil - Date.now()) / 1000 / 60);
      throw new Error(`Account locked. Try again in ${timeLeft} minutes`);
    }
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    // Handle login attempts
    if (!isMatch) {
      await this.handleFailedLogin();
      return false;
    }
    
    // Reset login attempts on successful login
    if (this.loginAttempts > 0 || this.lockUntil) {
      this.loginAttempts = 0;
      this.lockUntil = undefined;
      await this.save({ validateBeforeSave: false });
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Handle failed login attempts
userSchema.methods.handleFailedLogin = async function() {
  // If account is already locked, don't increment
  if (this.isLocked) return;
  
  this.loginAttempts += 1;
  
  // Lock the account after 5 failed attempts for 30 minutes
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
  }
  
  await this.save({ validateBeforeSave: false });
};

// Update last login timestamp
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  this.lastActivity = new Date();
  return this.save({ validateBeforeSave: false });
};

// Update last activity timestamp
userSchema.methods.updateLastActivity = async function() {
  this.lastActivity = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Add text index for search
userSchema.index(
  { username: 'text', email: 'text' },
  { weights: { username: 10, email: 5 } }
);

module.exports = mongoose.model('User', userSchema);