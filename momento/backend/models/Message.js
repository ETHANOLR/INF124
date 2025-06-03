// backend/models/Message.js
const mongoose = require('mongoose');

/**
 * Message Schema for Real-time Chat System
 * 
 * Handles individual messages within chats including:
 * - Text, image, file, and system messages
 * - Read receipts and delivery status
 * - Message reactions and replies
 * - Message editing and deletion
 */
const messageSchema = new mongoose.Schema({
    // Chat reference
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: [true, 'Chat reference is required'],
        index: true
    },

    // Sender information
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender is required'],
        index: true
    },

    // Message content and type
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [2000, 'Message content cannot exceed 2000 characters']
    },

    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'system', 'audio', 'video'],
        default: 'text'
    },

    // File/media attachments
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'file', 'audio', 'video']
        },
        url: String,
        filename: String,
        originalName: String,
        size: Number,
        mimeType: String,
        uploadedAt: { type: Date, default: Date.now }
    }],

    // Message status and delivery
    status: {
        type: String,
        enum: ['sent', 'delivered', 'failed'],
        default: 'sent'
    },

    // Read receipts
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Message reactions
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: {
            type: String,
            required: true
        },
        reactedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Reply to another message
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },

    // Message forwarding
    forwardedFrom: {
        message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        originalSender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },

    // Message editing
    isEdited: {
        type: Boolean,
        default: false
    },

    editHistory: [{
        content: String,
        editedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Message deletion
    isDeleted: {
        type: Boolean,
        default: false
    },

    deletedAt: Date,

    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // System message data (for join/leave notifications, etc.)
    systemData: {
        action: {
            type: String,
            enum: ['user_joined', 'user_left', 'chat_created', 'chat_updated', 'user_added', 'user_removed']
        },
        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        metadata: mongoose.Schema.Types.Mixed
    },

    // Message timestamp
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },

    // Temporary message ID for optimistic updates
    tempId: String,

    // Priority for urgent messages
    priority: {
        type: String,
        enum: ['normal', 'high', 'urgent'],
        default: 'normal'
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            // Convert MongoDB _id to id for frontend consistency
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// INDEXES FOR PERFORMANCE
messageSchema.index({ chat: 1, timestamp: -1 }); // Main chat messages query
messageSchema.index({ sender: 1, timestamp: -1 }); // User's messages
messageSchema.index({ 'readBy.user': 1 }); // Read status queries
messageSchema.index({ timestamp: -1 }); // Recent messages
messageSchema.index({ replyTo: 1 }); // Message replies
messageSchema.index({ isDeleted: 1, timestamp: -1 }); // Non-deleted messages

// Text search index for message content
messageSchema.index({ content: 'text' });

// VIRTUAL FIELDS

// Check if message is read by all participants
messageSchema.virtual('isReadByAll').get(function() {
    // This would need to be populated with chat participants count
    return false; // Placeholder - implement based on chat participants
});

// Get unread count for this message
messageSchema.virtual('unreadCount').get(function() {
    // Calculate based on chat participants vs readBy array
    return 0; // Placeholder
});

// INSTANCE METHODS

// Mark message as read by user
messageSchema.methods.markAsRead = function(userId) {
    // Check if user already marked as read
    const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
    
    if (!alreadyRead) {
        this.readBy.push({
            user: userId,
            readAt: new Date()
        });
    }
    
    return this.save();
};

// Add reaction to message
messageSchema.methods.addReaction = function(userId, emoji) {
    // Remove existing reaction from this user
    this.reactions = this.reactions.filter(reaction => 
        reaction.user.toString() !== userId.toString() || reaction.emoji !== emoji
    );
    
    // Add new reaction
    this.reactions.push({
        user: userId,
        emoji: emoji,
        reactedAt: new Date()
    });
    
    return this.save();
};

// Remove reaction from message
messageSchema.methods.removeReaction = function(userId, emoji) {
    this.reactions = this.reactions.filter(reaction => 
        !(reaction.user.toString() === userId.toString() && reaction.emoji === emoji)
    );
    
    return this.save();
};

// Edit message content
messageSchema.methods.editContent = function(newContent) {
    // Save current content to edit history
    if (this.content) {
        this.editHistory.push({
            content: this.content,
            editedAt: new Date()
        });
    }
    
    this.content = newContent;
    this.isEdited = true;
    
    return this.save();
};

// Soft delete message
messageSchema.methods.softDelete = function(deletedByUserId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    
    return this.save();
};

// Check if user can edit/delete this message
messageSchema.methods.canModify = function(userId) {
    return this.sender.toString() === userId.toString();
};

// STATIC METHODS

// Get unread messages for user in specific chat
messageSchema.statics.getUnreadInChat = function(chatId, userId) {
    return this.find({
        chat: chatId,
        'readBy.user': { $ne: userId },
        isDeleted: false
    }).sort({ timestamp: 1 });
};

// Get messages with pagination
messageSchema.statics.getPaginatedMessages = function(chatId, page = 1, limit = 50) {
    return this.find({ 
        chat: chatId, 
        isDeleted: false 
    })
    .populate('sender', 'username profile.profilePicture')
    .populate('replyTo', 'content sender')
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Search messages in chat
messageSchema.statics.searchInChat = function(chatId, searchQuery, limit = 20) {
    return this.find({
        chat: chatId,
        isDeleted: false,
        $text: { $search: searchQuery }
    })
    .populate('sender', 'username profile.profilePicture')
    .sort({ score: { $meta: 'textScore' }, timestamp: -1 })
    .limit(limit);
};

// Get latest message in chat
messageSchema.statics.getLatestInChat = function(chatId) {
    return this.findOne({ 
        chat: chatId, 
        isDeleted: false 
    })
    .populate('sender', 'username')
    .sort({ timestamp: -1 });
};

// MIDDLEWARE

// Pre-save middleware for validation
messageSchema.pre('save', function(next) {
    // Validate message content based on type
    if (this.messageType === 'text' && !this.content.trim()) {
        return next(new Error('Text messages must have content'));
    }
    
    // Ensure system messages have proper system data
    if (this.messageType === 'system' && !this.systemData.action) {
        return next(new Error('System messages must have action data'));
    }
    
    next();
});

// Pre-delete middleware for cleanup
messageSchema.pre('deleteOne', { document: true, query: false }, function(next) {
    // Clean up any references to this message
    console.log(`Cleaning up message: ${this._id}`);
    next();
});

// Post-save middleware for real-time updates
messageSchema.post('save', function(doc, next) {
    // Trigger real-time updates via socket.io if needed
    // This can be handled at the application level
    next();
});

module.exports = mongoose.model('Message', messageSchema);
