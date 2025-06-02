// models/User.js
const mongoose = require('mongoose');

// Complete user schema for social media platform
const userSchema = new mongoose.Schema({
    // BASIC AUTHENTICATION FIELDS
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
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // This hides password in queries by default, but we can override with +password
    },

    // PROFILE INFORMATION
    profile: {
        // Basic profile info
        firstName: {
            type: String,
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters'],
            default: ''
        },
        lastName: {
            type: String,
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters'],
            default: ''
        },
        displayName: {
            type: String,
            trim: true,
            maxlength: [100, 'Display name cannot exceed 100 characters'],
            default: ''
        },
        bio: {
            type: String,
            trim: true,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
            default: ''
        },
        
        // Avatar and media
        profilePicture: {
            url: { type: String, default: null },
            publicId: { type: String }, // For cloud storage (Cloudinary, etc.)
            uploadedAt: { type: Date }
        },
        coverPhoto: {
            url: { type: String, default: null },
            publicId: { type: String },
            uploadedAt: { type: Date }
        },
        
        // Contact and location info
        location: {
            type: String,
            trim: true,
            maxlength: [100, 'Location cannot exceed 100 characters'],
            default: ''
        },
        website: {
            type: String,
            trim: true,
            maxlength: [200, 'Website URL cannot exceed 200 characters'],
            default: ''
        },
        phoneNumber: {
            type: String,
            trim: true,
            maxlength: [20, 'Phone number cannot exceed 20 characters'],
            default: ''
        },
        
        // Birth date and age
        dateOfBirth: {
            type: Date
        },
        
        // Social media links
        socialLinks: {
            twitter: { type: String, default: '' },
            instagram: { type: String, default: '' },
            linkedin: { type: String, default: '' },
            facebook: { type: String, default: '' },
            youtube: { type: String, default: '' },
            tiktok: { type: String, default: '' }
        }
    },

    // SOCIAL STATISTICS
    stats: {
        postsCount: { type: Number, default: 0 },
        followersCount: { type: Number, default: 0 },
        followingCount: { type: Number, default: 0 },
        likesReceived: { type: Number, default: 0 },
        commentsReceived: { type: Number, default: 0 },
        sharesReceived: { type: Number, default: 0 },
        profileViews: { type: Number, default: 0 },
        totalPostViews: { type: Number, default: 0 }
    },

    // SOCIAL RELATIONSHIPS
    relationships: {
        following: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            followedAt: { type: Date, default: Date.now }
        }],
        followers: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            followedAt: { type: Date, default: Date.now }
        }],
        blockedUsers: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            blockedAt: { type: Date, default: Date.now },
            reason: String
        }],
        mutedUsers: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            mutedAt: { type: Date, default: Date.now }
        }],
        closeFirendsUsersList: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            addedAt: { type: Date, default: Date.now }
        }]
    },

    // USER PREFERENCES
    preferences: {
        // Privacy settings
        privacy: {
            profileVisibility: {
                type: String,
                enum: ['public', 'private', 'friends'],
                default: 'public'
            },
            postVisibility: {
                type: String,
                enum: ['public', 'private', 'friends'],
                default: 'public'
            },
            showOnlineStatus: { type: Boolean, default: true },
            showLastSeen: { type: Boolean, default: true },
            allowMessagesFrom: {
                type: String,
                enum: ['everyone', 'following', 'friends', 'none'],
                default: 'everyone'
            },
            showEmailToFollowers: { type: Boolean, default: false },
            showPhoneToFollowers: { type: Boolean, default: false },
            discoverableByEmail: { type: Boolean, default: true },
            discoverableByPhone: { type: Boolean, default: true }
        },
        
        // Notification settings
        notifications: {
            email: {
                newFollower: { type: Boolean, default: true },
                newMessage: { type: Boolean, default: true },
                postLike: { type: Boolean, default: true },
                postComment: { type: Boolean, default: true },
                mention: { type: Boolean, default: true },
                newsletter: { type: Boolean, default: false }
            },
            push: {
                newFollower: { type: Boolean, default: true },
                newMessage: { type: Boolean, default: true },
                postLike: { type: Boolean, default: true },
                postComment: { type: Boolean, default: true },
                mention: { type: Boolean, default: true },
                liveNotifications: { type: Boolean, default: true }
            },
            inApp: {
                newFollower: { type: Boolean, default: true },
                newMessage: { type: Boolean, default: true },
                postLike: { type: Boolean, default: true },
                postComment: { type: Boolean, default: true },
                mention: { type: Boolean, default: true },
                suggestions: { type: Boolean, default: true }
            }
        },
        
        // Display settings
        display: {
            theme: {
                type: String,
                enum: ['light', 'dark', 'auto'],
                default: 'light'
            },
            language: {
                type: String,
                default: 'en',
                enum: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko']
            },
            timezone: {
                type: String,
                default: 'UTC'
            },
            dateFormat: {
                type: String,
                enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
                default: 'MM/DD/YYYY'
            },
            autoplayVideos: { type: Boolean, default: true },
            showSensitiveContent: { type: Boolean, default: false }
        },
        
        // Content preferences
        content: {
            interests: [{
                type: String,
                enum: ['fashion', 'travel', 'food', 'beauty', 'lifestyle', 'technology', 'sports', 'music', 'art', 'photography']
            }],
            preferredCategories: [String],
            blockedKeywords: [String],
            contentFilter: {
                type: String,
                enum: ['strict', 'moderate', 'off'],
                default: 'moderate'
            }
        }
    },

    // ACTIVITY TRACKING
    activity: {
        lastLoginAt: { type: Date },
        lastActiveAt: { type: Date },
        loginCount: { type: Number, default: 0 },
        isOnline: { type: Boolean, default: false },
        currentSessions: [{
            sessionId: String,
            device: String,
            browser: String,
            ip: String,
            loginAt: { type: Date, default: Date.now }
        }],
        
        // Search history
        searchHistory: [{
            query: String,
            searchType: {
                type: String,
                enum: ['users', 'posts', 'tags', 'places']
            },
            searchedAt: { type: Date, default: Date.now }
        }],
        
        // Recently viewed
        recentlyViewed: {
            posts: [{
                post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
                viewedAt: { type: Date, default: Date.now }
            }],
            users: [{
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                viewedAt: { type: Date, default: Date.now }
            }]
        }
    },

    // ACCOUNT STATUS
    account: {
        status: {
            type: String,
            enum: ['active', 'suspended', 'deactivated', 'deleted'],
            default: 'active'
        },
        isVerified: { type: Boolean, default: false },
        verificationBadge: {
            type: String,
            enum: ['none', 'verified', 'business', 'creator'],
            default: 'none'
        },
        accountType: {
            type: String,
            enum: ['personal', 'business', 'creator'],
            default: 'personal'
        },
        subscriptionTier: {
            type: String,
            enum: ['free', 'premium', 'pro'],
            default: 'free'
        },
        subscriptionExpiry: Date,
        
        // Verification status
        emailVerified: { type: Boolean, default: false },
        phoneVerified: { type: Boolean, default: false },
        emailVerificationToken: String,
        phoneVerificationCode: String,
        
        // Password reset
        passwordResetToken: String,
        passwordResetExpires: Date,
        
        // Account recovery
        recoveryEmail: String,
        recoveryPhone: String,
        backupCodes: [String]
    },

    // SAVED CONTENT
    saved: {
        posts: [{
            post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
            savedAt: { type: Date, default: Date.now },
            collection: String // for organizing saved posts
        }],
        collections: [{
            name: String,
            description: String,
            isPrivate: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }]
    },

    // MESSAGING
    messaging: {
        unreadMessagesCount: { type: Number, default: 0 },
        lastMessageAt: Date,
        messageSettings: {
            readReceipts: { type: Boolean, default: true },
            onlineStatus: { type: Boolean, default: true },
            allowMessagesFrom: {
                type: String,
                enum: ['everyone', 'following', 'mutual', 'none'],
                default: 'everyone'
            }
        }
    },

    // SECURITY
    security: {
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorSecret: String,
        loginAlerts: { type: Boolean, default: true },
        deviceTrust: [{
            deviceId: String,
            deviceName: String,
            trustedAt: { type: Date, default: Date.now },
            lastUsed: Date
        }],
        suspiciousActivityDetected: { type: Boolean, default: false },
        failedLoginAttempts: { type: Number, default: 0 },
        accountLockedUntil: Date
    },

    // ANALYTICS AND INSIGHTS
    analytics: {
        monthlyStats: [{
            month: { type: Date },
            postsCreated: { type: Number, default: 0 },
            likesReceived: { type: Number, default: 0 },
            commentsReceived: { type: Number, default: 0 },
            profileViews: { type: Number, default: 0 },
            followersGained: { type: Number, default: 0 },
            followersLost: { type: Number, default: 0 }
        }],
        topPosts: [{
            post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
            views: Number,
            engagementRate: Number
        }]
    },

    // MODERATION
    moderation: {
        reportCount: { type: Number, default: 0 },
        warningCount: { type: Number, default: 0 },
        strikes: [{
            reason: String,
            action: String,
            date: { type: Date, default: Date.now },
            moderator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }],
        isModerator: { type: Boolean, default: false },
        isAdmin: { type: Boolean, default: false },
        permissions: [String]
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
        transform: function(doc, ret) {
            // Remove sensitive fields when converting to JSON
            delete ret.password;
            delete ret.security.twoFactorSecret;
            delete ret.account.emailVerificationToken;
            delete ret.account.phoneVerificationCode;
            delete ret.account.passwordResetToken;
            delete ret.account.backupCodes;
            return ret;
        }
    }
});

// INDEXES FOR PERFORMANCE
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'activity.lastActiveAt': -1 });
userSchema.index({ 'stats.followersCount': -1 });
userSchema.index({ 'account.status': 1 });
userSchema.index({ 'profile.location': 1 });
userSchema.index({ 'preferences.content.interests': 1 });

// Text search index for user discovery
userSchema.index({
    username: 'text',
    'profile.displayName': 'text',
    'profile.bio': 'text',
    'profile.location': 'text'
});

// VIRTUAL FIELDS
// Full name virtual field
userSchema.virtual('profile.fullName').get(function() {
    if (this.profile.firstName && this.profile.lastName) {
        return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.profile.displayName || this.username;
});

// Age calculation
userSchema.virtual('profile.age').get(function() {
    if (!this.profile.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.profile.dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
    }
    return age;
});

// Online status (active in last 5 minutes)
userSchema.virtual('isCurrentlyOnline').get(function() {
    if (!this.activity.lastActiveAt) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.activity.lastActiveAt > fiveMinutesAgo;
});

// INSTANCE METHODS
// Update last activity
userSchema.methods.updateLastActivity = function() {
    this.activity.lastActiveAt = new Date();
    this.activity.isOnline = true;
    return this.save();
};

// Update login statistics
userSchema.methods.updateLoginStats = function() {
    this.activity.lastLoginAt = new Date();
    this.activity.lastActiveAt = new Date();
    this.activity.loginCount += 1;
    this.activity.isOnline = true;
    return this.save();
};

// Check if user can edit profile
userSchema.methods.canEdit = function(userId) {
    return this._id.toString() === userId.toString();
};

// Check if user can message another user
userSchema.methods.canMessage = function(targetUser) {
    const messageSettings = this.messaging.messageSettings.allowMessagesFrom;
    
    switch (messageSettings) {
        case 'none':
            return false;
        case 'following':
            return this.relationships.following.some(f => f.user.toString() === targetUser._id.toString());
        case 'mutual':
            const isFollowing = this.relationships.following.some(f => f.user.toString() === targetUser._id.toString());
            const isFollower = this.relationships.followers.some(f => f.user.toString() === targetUser._id.toString());
            return isFollowing && isFollower;
        default:
            return true;
    }
};

// Follow/unfollow methods
userSchema.methods.follow = function(userId) {
    if (!this.relationships.following.some(f => f.user.toString() === userId.toString())) {
        this.relationships.following.push({ user: userId });
        this.stats.followingCount += 1;
    }
    return this.save();
};

userSchema.methods.unfollow = function(userId) {
    this.relationships.following = this.relationships.following.filter(
        f => f.user.toString() !== userId.toString()
    );
    this.stats.followingCount = Math.max(0, this.stats.followingCount - 1);
    return this.save();
};

// STATIC METHODS
// Find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
        ]
    });
};

// Search users with various filters
userSchema.statics.searchUsers = function(query, filters = {}, limit = 10) {
    const searchQuery = {
        $and: [
            { 'account.status': 'active' },
            {
                $or: [
                    { username: new RegExp(query, 'i') },
                    { 'profile.displayName': new RegExp(query, 'i') },
                    { 'profile.bio': new RegExp(query, 'i') }
                ]
            }
        ]
    };

    // Add location filter if provided
    if (filters.location) {
        searchQuery.$and.push({ 'profile.location': new RegExp(filters.location, 'i') });
    }

    // Add interests filter if provided
    if (filters.interests && filters.interests.length > 0) {
        searchQuery.$and.push({ 'preferences.content.interests': { $in: filters.interests } });
    }

    return this.find(searchQuery)
        .select('username profile.displayName profile.profilePicture profile.bio profile.location account.isVerified stats.followersCount')
        .limit(limit)
        .sort({ 'stats.followersCount': -1 });
};

// Get trending users (most followers gained recently)
userSchema.statics.getTrendingUsers = function(days = 7, limit = 10) {
    const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return this.find({
        'account.status': 'active',
        'activity.lastActiveAt': { $gte: dateThreshold }
    })
        .select('username profile.displayName profile.profilePicture stats.followersCount account.isVerified')
        .sort({ 'stats.followersCount': -1 })
        .limit(limit);
};

// MIDDLEWARE
// Pre-save middleware for validation and formatting
userSchema.pre('save', function(next) {
    // Ensure email is lowercase
    if (this.email) {
        this.email = this.email.toLowerCase();
    }
    
    // Ensure username has no spaces
    if (this.username) {
        this.username = this.username.trim();
    }
    
    // Validate URL fields
    if (this.profile.website && !this.profile.website.startsWith('http')) {
        this.profile.website = 'https://' + this.profile.website;
    }
    
    // Update display name if not set
    if (!this.profile.displayName && (this.profile.firstName || this.profile.lastName)) {
        this.profile.displayName = `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
    }
    
    next();
});

// Pre-delete middleware for cleanup
userSchema.pre('deleteOne', { document: true, query: false }, function(next) {
    // Here you can add logic to clean up related data
    // such as posts, comments, messages, etc.
    console.log(`Cleaning up data for user: ${this.username}`);
    next();
});

// Export the model
module.exports = mongoose.model('User', userSchema);
