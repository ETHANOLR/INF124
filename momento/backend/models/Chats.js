// backend/models/Chats.js
const mongoose = require('mongoose');


/**
 * Chat Schema for Real-time Chat System
 * 
 * Manages chat rooms/conversations including:
 * - Direct messages between two users
 * - Group chats with multiple participants
 * - Chat metadata and settings
 * - Participant management
 */
const chatSchema = new mongoose.Schema({
    // Chat type (direct message or group)
    type: {
        type: String,
        enum: ['direct', 'group'],
        required: [true, 'Chat type is required'],
        default: 'direct'
    },

    // Chat participants
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],

    // Group chat specific fields
    groupInfo: {
        name: {
            type: String,
            trim: true,
            maxlength: [100, 'Group name cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Group description cannot exceed 500 characters']
        },
        avatar: {
            url: String,
            filename: String,
            uploadedAt: Date
        },
        // Group admins
        admins: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        // Group settings
        settings: {
            allowMembersToAddOthers: { type: Boolean, default: true },
            allowMembersToEditGroupInfo: { type: Boolean, default: false },
            onlyAdminsCanMessage: { type: Boolean, default: false },
            messageDisappearTimer: { type: Number, default: 0 }, // 0 = never
            maxParticipants: { type: Number, default: 256 }
        }
    },

    // Chat creator and creation info
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Chat creator is required']
    },

    // Last message in chat
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },

    // Last activity timestamp
    lastActivity: {
        type: Date,
        default: Date.now,
        index: true
    },

    // Chat status
    isActive: {
        type: Boolean,
        default: true
    },

    // Archived status for participants
    archivedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        archivedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Muted status for participants
    mutedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        mutedUntil: {
            type: Date,
            default: null // null = muted indefinitely
        },
        mutedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Pinned status for participants
    pinnedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        pinnedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Chat encryption settings
    encryption: {
        isEnabled: { type: Boolean, default: false },
        keyVersion: { type: Number, default: 1 }
    },

    // Message retention settings
    messageRetention: {
        enabled: { type: Boolean, default: false },
        days: { type: Number, default: 30 }
    },

    // Chat statistics
    stats: {
        totalMessages: { type: Number, default: 0 },
        totalParticipants: { type: Number, default: 0 },
        activeParticipants: { type: Number, default: 0 }
    },

    // Custom chat settings per participant
    participantSettings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        nickname: String, // Custom nickname for this chat
        customNotifications: {
            enabled: { type: Boolean, default: true },
            sound: String,
            vibrate: { type: Boolean, default: true }
        },
        theme: {
            background: String,
            bubbleColor: String
        },
        joinedAt: { type: Date, default: Date.now },
        leftAt: Date,
        lastReadMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        lastSeenAt: { type: Date, default: Date.now }
    }]
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
chatSchema.index({ participants: 1 }); // Find chats by participant
chatSchema.index({ lastActivity: -1 }); // Sort chats by recent activity
chatSchema.index({ type: 1, participants: 1 }); // Find direct/group chats
chatSchema.index({ createdBy: 1, createdAt: -1 }); // Created chats
chatSchema.index({ isActive: 1, lastActivity: -1 }); // Active chats
chatSchema.index({ 'archivedBy.user': 1 }); // Archived chats
chatSchema.index({ 'mutedBy.user': 1 }); // Muted chats
chatSchema.index({ 'pinnedBy.user': 1 }); // Pinned chats

// Text search index for group names and descriptions
chatSchema.index({
    'groupInfo.name': 'text',
    'groupInfo.description': 'text'
});

// VIRTUAL FIELDS

// Get chat display name
chatSchema.virtual('displayName').get(function() {
    if (this.type === 'group') {
        return this.groupInfo?.name || 'Unnamed Group';
    }
    // For direct chats, name would be determined by the other participant
    return 'Direct Chat';
});

// Check if chat is a group
chatSchema.virtual('isGroup').get(function() {
    return this.type === 'group';
});

// Get participant count
chatSchema.virtual('participantCount').get(function() {
    return this.participants.length;
});

// INSTANCE METHODS

// Add participant to chat
chatSchema.methods.addParticipant = function(userId, addedBy = null) {
    // Check if user is already a participant
    if (this.participants.includes(userId)) {
        throw new Error('User is already a participant');
    }

    // Check group size limits for group chats
    if (this.type === 'group') {
        const maxParticipants = this.groupInfo?.settings?.maxParticipants || 256;
        if (this.participants.length >= maxParticipants) {
            throw new Error('Group has reached maximum participant limit');
        }
    }

    // Add participant
    this.participants.push(userId);
    
    // Add participant settings
    this.participantSettings.push({
        user: userId,
        joinedAt: new Date(),
        lastSeenAt: new Date()
    });

    // Update stats
    this.stats.totalParticipants = this.participants.length;
    this.stats.activeParticipants = this.participants.length;

    return this.save();
};

// Remove participant from chat
chatSchema.methods.removeParticipant = function(userId, removedBy = null) {
    // Check if user is a participant
    if (!this.participants.includes(userId)) {
        throw new Error('User is not a participant');
    }

    // Remove participant
    this.participants = this.participants.filter(p => p.toString() !== userId.toString());
    
    // Update participant settings to mark as left
    const participantSetting = this.participantSettings.find(ps => 
        ps.user.toString() === userId.toString()
    );
    if (participantSetting) {
        participantSetting.leftAt = new Date();
    }

    // Remove from group admins if applicable
    if (this.type === 'group' && this.groupInfo.admins) {
        this.groupInfo.admins = this.groupInfo.admins.filter(a => a.toString() !== userId.toString());
    }

    // Update stats
    this.stats.totalParticipants = this.participants.length;
    this.stats.activeParticipants = this.participants.length;

    return this.save();
};

// Make user admin (group chats only)
chatSchema.methods.makeAdmin = function(userId, madeBy = null) {
    if (this.type !== 'group') {
        throw new Error('Cannot make admin in direct chat');
    }

    if (!this.participants.includes(userId)) {
        throw new Error('User is not a participant');
    }

    if (!this.groupInfo.admins.includes(userId)) {
        this.groupInfo.admins.push(userId);
    }

    return this.save();
};

// Remove admin privileges
chatSchema.methods.removeAdmin = function(userId, removedBy = null) {
    if (this.type !== 'group') {
        throw new Error('Cannot remove admin in direct chat');
    }

    this.groupInfo.admins = this.groupInfo.admins.filter(a => a.toString() !== userId.toString());
    return this.save();
};

// Archive chat for user
chatSchema.methods.archiveForUser = function(userId) {
    // Remove existing archive entry
    this.archivedBy = this.archivedBy.filter(a => a.user.toString() !== userId.toString());
    
    // Add new archive entry
    this.archivedBy.push({
        user: userId,
        archivedAt: new Date()
    });

    return this.save();
};

// Unarchive chat for user
chatSchema.methods.unarchiveForUser = function(userId) {
    this.archivedBy = this.archivedBy.filter(a => a.user.toString() !== userId.toString());
    return this.save();
};

// Mute chat for user
chatSchema.methods.muteForUser = function(userId, mutedUntil = null) {
    // Remove existing mute entry
    this.mutedBy = this.mutedBy.filter(m => m.user.toString() !== userId.toString());
    
    // Add new mute entry
    this.mutedBy.push({
        user: userId,
        mutedUntil: mutedUntil,
        mutedAt: new Date()
    });

    return this.save();
};

// Unmute chat for user
chatSchema.methods.unmuteForUser = function(userId) {
    this.mutedBy = this.mutedBy.filter(m => m.user.toString() !== userId.toString());
    return this.save();
};

// Pin chat for user
chatSchema.methods.pinForUser = function(userId) {
    // Remove existing pin entry
    this.pinnedBy = this.pinnedBy.filter(p => p.user.toString() !== userId.toString());
    
    // Add new pin entry
    this.pinnedBy.push({
        user: userId,
        pinnedAt: new Date()
    });

    return this.save();
};

// Unpin chat for user
chatSchema.methods.unpinForUser = function(userId) {
    this.pinnedBy = this.pinnedBy.filter(p => p.user.toString() !== userId.toString());
    return this.save();
};

// Update last activity
chatSchema.methods.updateActivity = function() {
    this.lastActivity = new Date();
    return this.save();
};

// Check if user is admin
chatSchema.methods.isAdmin = function(userId) {
    if (this.type !== 'group') {
        return false;
    }
    return this.groupInfo.admins && this.groupInfo.admins.includes(userId);
};

// Check if user can add participants
chatSchema.methods.canAddParticipants = function(userId) {
    if (this.type === 'direct') {
        return false;
    }

    if (this.isAdmin(userId)) {
        return true;
    }

    return this.groupInfo?.settings?.allowMembersToAddOthers || false;
};

// Check if user can edit group info
chatSchema.methods.canEditGroupInfo = function(userId) {
    if (this.type === 'direct') {
        return false;
    }

    if (this.isAdmin(userId)) {
        return true;
    }

    return this.groupInfo?.settings?.allowMembersToEditGroupInfo || false;
};

// Check if user can send messages
chatSchema.methods.canSendMessages = function(userId) {
    if (!this.participants.includes(userId)) {
        return false;
    }

    if (this.type === 'direct') {
        return true;
    }

    // For groups, check if only admins can message
    const onlyAdmins = this.groupInfo?.settings?.onlyAdminsCanMessage || false;
    if (onlyAdmins) {
        return this.isAdmin(userId);
    }

    return true;
};

// STATIC METHODS

// Find or create direct chat between two users
chatSchema.statics.findOrCreateDirectChat = async function(user1Id, user2Id) {
    // Check if direct chat already exists
    let chat = await this.findOne({
        type: 'direct',
        participants: { $all: [user1Id, user2Id], $size: 2 }
    }).populate('participants', 'username profile.profilePicture activity.isOnline');

    if (!chat) {
        // Create new direct chat
        chat = new this({
            type: 'direct',
            participants: [user1Id, user2Id],
            createdBy: user1Id,
            participantSettings: [
                { user: user1Id, joinedAt: new Date(), lastSeenAt: new Date() },
                { user: user2Id, joinedAt: new Date(), lastSeenAt: new Date() }
            ]
        });
        await chat.save();
        await chat.populate('participants', 'username profile.profilePicture activity.isOnline');
    }

    return chat;
};

// Get user's chats with filters
chatSchema.statics.getUserChats = function(userId, filters = {}) {
    const query = { participants: userId, isActive: true };
    
    // Apply filters
    if (filters.type) {
        query.type = filters.type;
    }

    if (filters.archived === true) {
        query['archivedBy.user'] = userId;
    } else if (filters.archived === false) {
        query['archivedBy.user'] = { $ne: userId };
    }

    if (filters.muted === true) {
        query['mutedBy.user'] = userId;
    } else if (filters.muted === false) {
        query['mutedBy.user'] = { $ne: userId };
    }

    if (filters.pinned === true) {
        query['pinnedBy.user'] = userId;
    }

    return this.find(query)
        .populate('participants', 'username profile.profilePicture activity.isOnline activity.lastActiveAt')
        .populate('lastMessage')
        .sort({ lastActivity: -1 });
};

// Search chats by name or participants
chatSchema.statics.searchChats = function(userId, searchQuery, limit = 10) {
    return this.find({
        participants: userId,
        isActive: true,
        $or: [
            { 'groupInfo.name': new RegExp(searchQuery, 'i') },
            { 'groupInfo.description': new RegExp(searchQuery, 'i') }
        ]
    })
    .populate('participants', 'username profile.profilePicture')
    .limit(limit)
    .sort({ lastActivity: -1 });
};

// MIDDLEWARE

// Pre-save middleware for validation
chatSchema.pre('save', function(next) {
    // Validate participant count for direct chats
    if (this.type === 'direct' && this.participants.length !== 2) {
        return next(new Error('Direct chats must have exactly 2 participants'));
    }

    // Validate group chats have at least 2 participants
    if (this.type === 'group' && this.participants.length < 2) {
        return next(new Error('Group chats must have at least 2 participants'));
    }

    // Ensure group admins are participants
    if (this.type === 'group' && this.groupInfo?.admins) {
        const invalidAdmins = this.groupInfo.admins.filter(admin => 
            !this.participants.includes(admin)
        );
        if (invalidAdmins.length > 0) {
            return next(new Error('All admins must be participants'));
        }
    }

    // Update stats
    this.stats.totalParticipants = this.participants.length;
    this.stats.activeParticipants = this.participants.length;

    next();
});

// Pre-delete middleware for cleanup
chatSchema.pre('deleteOne', { document: true, query: false }, function(next) {
    // Clean up messages, notifications, etc.
    console.log(`Cleaning up chat: ${this._id}`);
    next();
});

module.exports = mongoose.model('Chat', chatSchema);
