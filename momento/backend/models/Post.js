// backend/models/Post.js
const mongoose = require('mongoose');

/**
 * Post Schema for Social Media Platform
 * 
 * Complete post model with support for:
 * - Text content and rich media
 * - User interactions (likes, comments, shares)
 * - Categories and tags
 * - Privacy settings
 * - Analytics tracking
 * - Content moderation
 */
const postSchema = new mongoose.Schema({
    // BASIC POST INFORMATION
    title: {
        type: String,
        required: [true, 'Post title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters'],
        minlength: [1, 'Title must be at least 1 character']
    },
    content: {
        type: String,
        required: [true, 'Post content is required'],
        trim: true,
        maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    excerpt: {
        type: String,
        trim: true,
        maxlength: [300, 'Excerpt cannot exceed 300 characters']
    },

    // AUTHOR INFORMATION
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Post author is required']
    },

    // CONTENT CATEGORIZATION
    category: {
        type: String,
        required: [true, 'Post category is required'],
        enum: ['Fashion', 'Travel', 'Food', 'Beauty', 'Lifestyle', 'Technology', 'Sports', 'Music', 'Art', 'Photography'],
        default: 'Lifestyle'
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    
    // MEDIA CONTENT
    media: {
        images: [{
            url: { type: String, required: true },
            caption: { type: String, maxlength: 200 },
            altText: { type: String, maxlength: 100 },
            publicId: String, // For cloud storage (Cloudinary, etc.)
            uploadedAt: { type: Date, default: Date.now }
        }],
        videos: [{
            url: { type: String, required: true },
            thumbnail: String,
            duration: Number, // in seconds
            caption: { type: String, maxlength: 200 },
            publicId: String,
            uploadedAt: { type: Date, default: Date.now }
        }],
        audio: [{
            url: { type: String, required: true },
            title: String,
            duration: Number, // in seconds
            publicId: String,
            uploadedAt: { type: Date, default: Date.now }
        }]
    },

    // ENGAGEMENT METRICS
    engagement: {
        likes: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            likedAt: { type: Date, default: Date.now }
        }],
        comments: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            content: { type: String, required: true, maxlength: 1000 },
            likes: [{
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                likedAt: { type: Date, default: Date.now }
            }],
            replies: [{
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                content: { type: String, required: true, maxlength: 500 },
                createdAt: { type: Date, default: Date.now }
            }],
            createdAt: { type: Date, default: Date.now },
            isEdited: { type: Boolean, default: false },
            editedAt: Date
        }],
        shares: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            sharedAt: { type: Date, default: Date.now },
            shareType: {
                type: String,
                enum: ['repost', 'story', 'direct_message', 'external'],
                default: 'repost'
            }
        }],
        saves: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            savedAt: { type: Date, default: Date.now },
            collection: String // for organizing saved posts
        }]
    },

    // ANALYTICS
    analytics: {
        views: { type: Number, default: 0 },
        uniqueViews: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            viewedAt: { type: Date, default: Date.now },
            viewDuration: Number // in seconds
        }],
        clickThroughRate: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 },
        reachCount: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 }
    },

    // POST SETTINGS
    settings: {
        visibility: {
            type: String,
            enum: ['public', 'private', 'friends', 'followers'],
            default: 'public'
        },
        allowComments: { type: Boolean, default: true },
        allowShares: { type: Boolean, default: true },
        allowDownloads: { type: Boolean, default: false },
        showLikesCount: { type: Boolean, default: true },
        showCommentsCount: { type: Boolean, default: true },
        
        // Advanced privacy settings
        hiddenFromUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        restrictedToUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },

    // CONTENT STATUS
    status: {
        published: { type: Boolean, default: true },
        publishedAt: { type: Date },
        scheduledFor: Date,
        isDraft: { type: Boolean, default: false },
        isArchived: { type: Boolean, default: false },
        archivedAt: Date,
        isDeleted: { type: Boolean, default: false },
        deletedAt: Date
    },

    // LOCATION AND CONTEXT
    location: {
        name: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String
        }
    },

    // MODERATION
    moderation: {
        isReported: { type: Boolean, default: false },
        reportCount: { type: Number, default: 0 },
        reports: [{
            reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            reason: {
                type: String,
                enum: ['spam', 'harassment', 'hate_speech', 'violence', 'nudity', 'copyright', 'misinformation', 'other']
            },
            description: String,
            reportedAt: { type: Date, default: Date.now },
            status: {
                type: String,
                enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
                default: 'pending'
            }
        }],
        isFlagged: { type: Boolean, default: false },
        flaggedReason: String,
        flaggedAt: Date,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: Date,
        moderationAction: {
            type: String,
            enum: ['none', 'warning', 'content_removal', 'account_suspension'],
            default: 'none'
        }
    },

    // EDITING HISTORY
    editHistory: [{
        editedAt: { type: Date, default: Date.now },
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changes: {
            title: { old: String, new: String },
            content: { old: String, new: String },
            category: { old: String, new: String },
            tags: { old: [String], new: [String] }
        }
    }],

    // SEO AND METADATA
    seo: {
        metaTitle: String,
        metaDescription: String,
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true
        },
        keywords: [String],
        canonicalUrl: String
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            // Add computed fields and clean up response
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// INDEXES FOR PERFORMANCE
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ 'status.published': 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'engagement.likes.user': 1 });
postSchema.index({ 'analytics.views': -1 });
postSchema.index({ 'seo.slug': 1 });
postSchema.index({ 'settings.visibility': 1 });

// Text search index for content discovery
postSchema.index({
    title: 'text',
    content: 'text',
    'seo.metaDescription': 'text',
    tags: 'text'
});

// Compound indexes for efficient queries
postSchema.index({ author: 1, 'status.published': 1, createdAt: -1 });
postSchema.index({ category: 1, 'status.published': 1, 'analytics.views': -1 });

// VIRTUAL FIELDS
// Total likes count
postSchema.virtual('likesCount').get(function() {
    return this.engagement.likes ? this.engagement.likes.length : 0;
});

// Total comments count
postSchema.virtual('commentsCount').get(function() {
    return this.engagement.comments ? this.engagement.comments.length : 0;
});

// Total shares count
postSchema.virtual('sharesCount').get(function() {
    return this.engagement.shares ? this.engagement.shares.length : 0;
});

// Total saves count
postSchema.virtual('savesCount').get(function() {
    return this.engagement.saves ? this.engagement.saves.length : 0;
});

// Reading time estimation (words per minute)
postSchema.virtual('readingTime').get(function() {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
});

// Is post trending (high engagement in last 24 hours)
postSchema.virtual('isTrending').get(function() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLikes = this.engagement.likes.filter(like => like.likedAt > oneDayAgo).length;
    const recentComments = this.engagement.comments.filter(comment => comment.createdAt > oneDayAgo).length;
    const recentShares = this.engagement.shares.filter(share => share.sharedAt > oneDayAgo).length;
    
    return (recentLikes + recentComments * 2 + recentShares * 3) > 10; // Adjust threshold as needed
});

// INSTANCE METHODS
// Check if user has liked the post
postSchema.methods.isLikedBy = function(userId) {
    return this.engagement.likes.some(like => like.user.toString() === userId.toString());
};

// Check if user has saved the post
postSchema.methods.isSavedBy = function(userId) {
    return this.engagement.saves.some(save => save.user.toString() === userId.toString());
};

// Add like to post
postSchema.methods.addLike = function(userId) {
    if (!this.isLikedBy(userId)) {
        this.engagement.likes.push({ user: userId });
        this.calculateEngagementRate();
    }
    return this.save();
};

// Remove like from post
postSchema.methods.removeLike = function(userId) {
    this.engagement.likes = this.engagement.likes.filter(
        like => like.user.toString() !== userId.toString()
    );
    this.calculateEngagementRate();
    return this.save();
};

// Add comment to post
postSchema.methods.addComment = function(userId, content) {
    this.engagement.comments.push({
        user: userId,
        content: content
    });
    this.calculateEngagementRate();
    return this.save();
};

// Add share to post
postSchema.methods.addShare = function(userId, shareType = 'repost') {
    this.engagement.shares.push({
        user: userId,
        shareType: shareType
    });
    this.calculateEngagementRate();
    return this.save();
};

// Calculate engagement rate
postSchema.methods.calculateEngagementRate = function() {
    const totalEngagement = this.likesCount + this.commentsCount + this.sharesCount;
    const views = this.analytics.views || 1; // Avoid division by zero
    this.analytics.engagementRate = (totalEngagement / views) * 100;
};

// Increment view count
postSchema.methods.incrementViews = function(userId = null) {
    this.analytics.views += 1;
    
    // Track unique views if user is provided
    if (userId && !this.analytics.uniqueViews.some(view => view.user.toString() === userId.toString())) {
        this.analytics.uniqueViews.push({ user: userId });
    }
    
    this.calculateEngagementRate();
    return this.save();
};

// Check if user can edit post
postSchema.methods.canEdit = function(userId) {
    return this.author.toString() === userId.toString();
};

// Check if user can view post based on privacy settings
postSchema.methods.canView = function(userId, userRelationships = null) {
    // Public posts are viewable by everyone
    if (this.settings.visibility === 'public') return true;
    
    // Private posts only viewable by author
    if (this.settings.visibility === 'private') {
        return this.author.toString() === userId.toString();
    }
    
    // Author can always view their own posts
    if (this.author.toString() === userId.toString()) return true;
    
    // Check if user is specifically hidden from viewing
    if (this.settings.hiddenFromUsers.includes(userId)) return false;
    
    // Check restricted users list
    if (this.settings.restrictedToUsers.length > 0) {
        return this.settings.restrictedToUsers.includes(userId);
    }
    
    // For friends/followers visibility, you'd need to check relationships
    // This would require additional logic based on your User relationships structure
    return true;
};

// Generate SEO slug
postSchema.methods.generateSlug = function() {
    const slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
    
    this.seo.slug = `${slug}-${this._id.toString().slice(-6)}`;
    return this.seo.slug;
};

// STATIC METHODS
// Get trending posts
postSchema.statics.getTrendingPosts = function(limit = 10, category = null) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    let matchQuery = {
        'status.published': true,
        'status.isDeleted': false,
        createdAt: { $gte: oneDayAgo }
    };
    
    if (category) {
        matchQuery.category = category;
    }
    
    return this.aggregate([
        { $match: matchQuery },
        {
            $addFields: {
                trendingScore: {
                    $add: [
                        { $size: '$engagement.likes' },
                        { $multiply: [{ $size: '$engagement.comments' }, 2] },
                        { $multiply: [{ $size: '$engagement.shares' }, 3] },
                        { $divide: ['$analytics.views', 10] }
                    ]
                }
            }
        },
        { $sort: { trendingScore: -1 } },
        { $limit: limit }
    ]);
};

// Get posts by category
postSchema.statics.getPostsByCategory = function(category, page = 1, limit = 10) {
    return this.find({
        category: category,
        'status.published': true,
        'status.isDeleted': false
    })
    .populate('author', 'username profile.profilePicture profile.displayName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Search posts
postSchema.statics.searchPosts = function(query, filters = {}, page = 1, limit = 10) {
    const searchQuery = {
        $text: { $search: query },
        'status.published': true,
        'status.isDeleted': false
    };
    
    if (filters.category) {
        searchQuery.category = filters.category;
    }
    
    if (filters.author) {
        searchQuery.author = filters.author;
    }
    
    return this.find(searchQuery)
        .populate('author', 'username profile.profilePicture profile.displayName')
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
};

// MIDDLEWARE
// Pre-save middleware
postSchema.pre('save', function(next) {
    // Set published date when post is published
    if (this.status.published && !this.status.publishedAt) {
        this.status.publishedAt = new Date();
    }
    
    // Generate slug if not exists
    if (!this.seo.slug) {
        this.generateSlug();
    }
    
    // Generate excerpt if not provided
    if (!this.excerpt) {
        this.excerpt = this.content.substring(0, 200) + (this.content.length > 200 ? '...' : '');
    }
    
    // Update engagement rate
    this.calculateEngagementRate();
    
    next();
});

// Pre-delete middleware for cleanup
postSchema.pre('deleteOne', { document: true, query: false }, function(next) {
    console.log(`Cleaning up data for post: ${this.title}`);
    // Here you can add logic to clean up related data
    // such as notifications, saved posts, etc.
    next();
});

module.exports = mongoose.model('Post', postSchema);
