// models/User.js
const mongoose = require('mongoose');

// Define user schema with comprehensive fields and validation
const userSchema = new mongoose.Schema({
  // Basic required fields
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
  // Profile information
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    profilePicture: {
      type: String,
      default: null
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters']
    },
    website: {
      type: String,
      trim: true,
      maxlength: [200, 'Website URL cannot exceed 200 characters']
    }
  },
  
  // User preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    privateProfile: {
      type: Boolean,
      default: false
    }
  },
  
  // User statistics
  stats: {
    postsCount: {
      type: Number,
      default: 0
    },
    followersCount: {
      type: Number,
      default: 0
    },
    followingCount: {
      type: Number,
      default: 0
    }
  },
  
  // Account status fields
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      // Remove password field when converting to JSON
      delete ret.password;
      return ret;
    }
  }
});

// Index optimization for faster queries
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

// Virtual field: full name
userSchema.virtual('profile.fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.profile.lastName || this.username;
});

// Instance method: update last login time
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Instance method: check if user can edit profile
userSchema.methods.canEdit = function(userId) {
  return this._id.toString() === userId.toString();
};

// Static method: find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

// Static method: search users
userSchema.statics.searchUsers = function(query, limit = 10) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { username: searchRegex },
      { 'profile.firstName': searchRegex },
      { 'profile.lastName': searchRegex }
    ],
    isActive: true
  })
  .select('username email profile.firstName profile.lastName profile.profilePicture isVerified')
  .limit(limit);
};

// Pre-save middleware: validation and formatting
userSchema.pre('save', function(next) {
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  
  // Ensure username has no spaces
  if (this.username) {
    this.username = this.username.trim();
  }
  
  next();
});

// Pre-delete middleware: cleanup when user is deleted
userSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  // Add logic to delete user-related data such as posts, comments, etc.
  console.log(`Cleaning up data for user: ${this.username}`);
  next();
});

module.exports = mongoose.model('User', userSchema);
