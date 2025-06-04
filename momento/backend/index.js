// backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const User = require('./models/User');
const Message = require('./models/Message');
const Chat = require('./models/Chats');
const Post = require('./models/Post');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://momento-frontend-deploy.s3-website-us-west-1.amazonaws.com',
    'https://www.momento.lifestyle',
    'https://d1pduukmezyk59.cloudfront.net'
];

// Configure Socket.IO with CORS
const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('CORS allowed for origin:', origin);
            callback(null, origin);
        } else {
            console.log('CORS blocked for origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'momento-default-secret-change-in-production';

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Ensure upload directories exist
const uploadDir = './uploads/avatars';
const postMediaDir = './uploads/posts';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(postMediaDir)){
    fs.mkdirSync(postMediaDir, { recursive: true });
}

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: userID + timestamp + original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, `avatar-${req.user.userId}-${uniqueSuffix}${fileExtension}`);
    }
});

// Configure multer for post media uploads
const postMediaStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, postMediaDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, `post-${req.user.userId}-${uniqueSuffix}${fileExtension}`);
    }
});

// File filter for avatar uploads
const avatarFileFilter = (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: avatarFileFilter
});

const postMediaUpload = multer({
    storage: postMediaStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for post images
    fileFilter: avatarFileFilter // Reuse same image filter
});

// Static file serving for uploaded avatars and post media
app.use('/uploads', express.static('uploads'));

// Store active users and their socket connections
const activeUsers = new Map();

// Store recent messages to prevent duplicates (in production, use Redis)
const recentMessages = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [key, timestamp] of recentMessages.entries()) {
        if (timestamp < fiveMinutesAgo) {
            recentMessages.delete(key);
        }
    }
}, 5 * 60 * 1000);

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
    return id && id !== 'undefined' && id !== 'null' && mongoose.Types.ObjectId.isValid(id);
};

// Helper function to standardize chat object with consistent ID fields
const standardizeChatObject = (chat) => {
    if (!chat) return null;
    const chatObj = chat.toObject ? chat.toObject() : chat;
    return {
        ...chatObj,
        id: chatObj._id.toString(), // Ensure frontend gets consistent 'id' field
        _id: chatObj._id.toString()
    };
};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user authentication and joining
    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            
            if (user) {
                socket.userId = user._id.toString();
                socket.username = user.username;
                
                // Add user to active users map
                activeUsers.set(user._id.toString(), {
                    socketId: socket.id,
                    username: user.username,
                    lastSeen: new Date()
                });

                // Update user online status
                await User.findByIdAndUpdate(user._id, {
                    'activity.isOnline': true,
                    'activity.lastActiveAt': new Date()
                });

                // Join user's personal room
                socket.join(`user_${user._id}`);
                
                // Get user's chats and join chat rooms
                const userChats = await Chat.find({ participants: user._id });
                userChats.forEach(chat => {
                    socket.join(`chat_${chat._id}`);
                });

                // Notify other users that this user is online
                socket.broadcast.emit('user_online', {
                    userId: user._id,
                    username: user.username
                });

                socket.emit('authenticated', { 
                    success: true, 
                    user: {
                        id: user._id,
                        username: user.username,
                        profile: user.profile
                    }
                });

                console.log(`User ${user.username} authenticated and joined`);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            socket.emit('authentication_error', { message: 'Invalid token' });
        }
    });

    // Handle joining specific chat rooms
    socket.on('join_chat', async (chatId) => {
        try {
            console.log(`=== JOIN CHAT DEBUG ===`);
            console.log(`User: ${socket.username}, ChatId: ${chatId}`);
            console.log(`ChatId type: ${typeof chatId}`);
            console.log(`Is valid ObjectId: ${isValidObjectId(chatId)}`);
            
            // Validate chatId
            if (!isValidObjectId(chatId)) {
                console.error(`Invalid chatId for join_chat: ${chatId}`);
                socket.emit('error', { message: 'Invalid chat ID' });
                return;
            }

            // Verify user is participant of this chat
            const chat = await Chat.findById(chatId);
            if (chat && chat.participants.includes(socket.userId)) {
                socket.join(`chat_${chatId}`);
                console.log(`User ${socket.username} joined chat ${chatId}`);
            } else {
                console.error(`User ${socket.username} not authorized for chat ${chatId}`);
                socket.emit('error', { message: 'Access denied to chat' });
            }
        } catch (error) {
            console.error('Join chat error:', error);
            socket.emit('error', { message: 'Failed to join chat' });
        }
    });

    // Handle leaving chat rooms
    socket.on('leave_chat', (chatId) => {
        try {
            if (isValidObjectId(chatId)) {
                socket.leave(`chat_${chatId}`);
                console.log(`User ${socket.username} left chat ${chatId}`);
            }
        } catch (error) {
            console.error('Leave chat error:', error);
        }
    });

    // Enhanced send message handler with duplication prevention
    socket.on('send_message', async (data) => {
        try {
            console.log(`=== SEND MESSAGE DEBUG ===`);
            console.log(`User: ${socket.username}`);
            console.log(`Raw data:`, data);
            console.log(`ChatId: ${data.chatId}, Type: ${typeof data.chatId}`);
            console.log(`Content: ${data.content}`);
            
            const { chatId, content, messageType = 'text' } = data;
            
            if (!socket.userId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            // Validate chatId
            if (!isValidObjectId(chatId)) {
                console.error(`Invalid chatId for send_message: ${chatId}`);
                socket.emit('error', { message: 'Invalid chat ID' });
                return;
            }

            // Validate content
            if (!content || !content.trim()) {
                socket.emit('error', { message: 'Message content is required' });
                return;
            }

            // Create message fingerprint to prevent duplicates
            const recentFingerprint = `${socket.userId}-${chatId}-${content.trim()}`;
            
            // Check for recent duplicate (within last 2 seconds)
            const now = Date.now();
            const lastMessageTime = recentMessages.get(recentFingerprint);
            if (lastMessageTime && (now - lastMessageTime) < 2000) {
                console.log('Duplicate message detected, ignoring');
                return;
            }
            
            // Store this message timestamp
            recentMessages.set(recentFingerprint, now);

            // Verify chat exists and user is participant
            const chat = await Chat.findById(chatId);
            if (!chat) {
                socket.emit('error', { message: 'Chat not found' });
                return;
            }

            if (!chat.participants.includes(socket.userId)) {
                socket.emit('error', { message: 'Access denied to chat' });
                return;
            }

            // Create new message
            const message = new Message({
                chat: chatId,
                sender: socket.userId,
                content: content.trim(),
                messageType,
                timestamp: new Date(),
                readBy: [{ user: socket.userId, readAt: new Date() }]
            });

            await message.save();
            
            // Populate sender information
            await message.populate('sender', 'username profile.profilePicture');
            
            // Update chat's last message
            await Chat.findByIdAndUpdate(chatId, {
                lastMessage: message._id,
                lastActivity: new Date()
            });

            // Emit message to all users in the chat room
            const messageData = {
                _id: message._id,
                content: message.content,
                messageType: message.messageType,
                timestamp: message.timestamp,
                sender: {
                    _id: message.sender._id,
                    username: message.sender.username,
                    profilePicture: message.sender.profile?.profilePicture
                },
                readBy: message.readBy,
                chatId: chatId
            };

            // Emit to the chat room
            io.to(`chat_${chatId}`).emit('new_message', messageData);

            console.log(`Message sent in chat ${chatId} by ${socket.username}`);
            console.log(`Message fingerprint: ${recentFingerprint}`);
            console.log(`=========================`);
        } catch (error) {
            console.error('Send message error:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Handle message read status
    socket.on('mark_message_read', async (data) => {
        try {
            const { messageId, chatId } = data;
            
            if (!socket.userId || !isValidObjectId(messageId) || !isValidObjectId(chatId)) {
                return;
            }

            await Message.findByIdAndUpdate(messageId, {
                $addToSet: {
                    readBy: {
                        user: socket.userId,
                        readAt: new Date()
                    }
                }
            });

            // Notify other users in the chat that message was read
            socket.to(`chat_${chatId}`).emit('message_read', {
                messageId,
                userId: socket.userId,
                username: socket.username
            });
        } catch (error) {
            console.error('Mark message read error:', error);
        }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
        try {
            const { chatId } = data;
            if (isValidObjectId(chatId)) {
                socket.to(`chat_${chatId}`).emit('user_typing', {
                    userId: socket.userId,
                    username: socket.username,
                    chatId
                });
            }
        } catch (error) {
            console.error('Typing start error:', error);
        }
    });

    socket.on('typing_stop', (data) => {
        try {
            const { chatId } = data;
            if (isValidObjectId(chatId)) {
                socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
                    userId: socket.userId,
                    username: socket.username,
                    chatId
                });
            }
        } catch (error) {
            console.error('Typing stop error:', error);
        }
    });

    // Handle user disconnection
    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        
        if (socket.userId) {
            // Remove from active users
            activeUsers.delete(socket.userId);
            
            // Update user offline status
            await User.findByIdAndUpdate(socket.userId, {
                'activity.isOnline': false,
                'activity.lastActiveAt': new Date()
            });

            // Notify other users that this user went offline
            socket.broadcast.emit('user_offline', {
                userId: socket.userId,
                username: socket.username
            });
        }
    });
});

// Token authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            }
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// Test API endpoint
app.get('/api/TestDB', (req, res) => {
    res.json({ 
        message: 'Testing Mongo DB',
        connection: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// User registration endpoint
app.post('/api/users', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Required server-side authentication
        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: 'Username, email, and password are required' 
            });
        }

        // Check if the user already exists (cannot be fully verified on the front end)
        const existingUser = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { username }] 
        });
        
        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({ 
                    message: 'Email already exists' 
                });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ 
                    message: 'Username already taken' 
                });
            }
        }

        // Encrypt password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create User
        const user = new User({
            username,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        const savedUser = await user.save();

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: savedUser._id, 
                email: savedUser.email,
                username: savedUser.username 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data
        const userResponse = {
            id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            profile: savedUser.profile,
            stats: savedUser.stats,
            account: savedUser.account,
            createdAt: savedUser.createdAt
        };

        res.status(201).json({
            message: 'User created successfully',
            user: userResponse,
            token: token
        });

    } catch (err) {
        console.error('Registration error:', err);
        
        // Handle duplicate errors at the database level
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ 
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
            });
        }
        
        res.status(400).json({ 
            message: 'Registration failed. Please try again.',
            error: err.message 
        });
    }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required' 
            });
        }

        // Find user (email or username)
        const user = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { username: email }
            ]
        }).select('+password');

        if (!user) {
            return res.status(404).json({ 
                message: 'Account not found. Please check your email or register.' 
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Update login statistics
        await user.updateLoginStats();

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                username: user.username 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data
        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            profile: user.profile,
            stats: user.stats,
            account: user.account,
            createdAt: user.createdAt
        };

        res.status(200).json({
            message: 'Login successful',
            user: userResponse,
            token: token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            message: 'Login failed. Please try again.',
            error: err.message 
        });
    }
});

/**
 * GET /api/posts
 * Fetch posts with pagination, filtering, and sorting
 */
app.get('/api/posts', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            sort = 'newest',
            author,
            search
        } = req.query;

        // Build base query
        let query = {
            'status.published': true,
            'status.isDeleted': false
        };

        // Add category filter
        if (category && category !== 'all') {
            query.category = category;
        }

        // Add author filter
        if (author && isValidObjectId(author)) {
            query.author = author;
        }

        // Add search functionality
        if (search && search.trim()) {
            query.$text = { $search: search.trim() };
        }

        // Build sort object
        let sortObject = {};
        switch (sort) {
            case 'oldest':
                sortObject = { createdAt: 1 };
                break;
            case 'popular':
                sortObject = { 'analytics.views': -1, createdAt: -1 };
                break;
            case 'trending':
                sortObject = { createdAt: -1 }; // Fallback to newest
                break;
            default: // newest
                sortObject = { createdAt: -1 };
        }

        let posts;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        if (sort === 'trending') {
            // Use aggregation for trending posts
            posts = await Post.aggregate([
                { $match: query },
                {
                    $addFields: {
                        trendingScore: {
                            $add: [
                                { $size: { $ifNull: ['$engagement.likes', []] } },
                                { $multiply: [{ $size: { $ifNull: ['$engagement.comments', []] } }, 2] },
                                { $multiply: [{ $size: { $ifNull: ['$engagement.shares', []] } }, 3] },
                                { $divide: [{ $ifNull: ['$analytics.views', 0] }, 10] }
                            ]
                        }
                    }
                },
                { $sort: { trendingScore: -1, createdAt: -1 } },
                { $skip: skip },
                { $limit: limitNum },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'author',
                        pipeline: [
                            {
                                $project: {
                                    username: 1,
                                    'profile.profilePicture': 1,
                                    'profile.displayName': 1
                                }
                            }
                        ]
                    }
                },
                { $unwind: '$author' }
            ]);
        } else {
            // Regular query with population
            posts = await Post.find(query)
                .populate('author', 'username profile.profilePicture profile.displayName')
                .sort(sortObject)
                .skip(skip)
                .limit(limitNum)
                .lean();
        }

        // Get total count for pagination
        const totalPosts = await Post.countDocuments(query);
        const totalPages = Math.ceil(totalPosts / limitNum);

        console.log(`Fetched ${posts.length} posts for page ${page}, category: ${category || 'all'}, sort: ${sort}`);

        res.json({
            posts,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalPosts,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch posts',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * POST /api/posts
 * Create a new post
 */
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        const { title, content, category, tags, visibility = 'public' } = req.body;

        // Validate required fields
        if (!title || !content || !category) {
            return res.status(400).json({ 
                message: 'Title, content, and category are required' 
            });
        }

        // Create new post
        const post = new Post({
            title: title.trim(),
            content: content.trim(),
            category,
            tags: tags ? tags.filter(tag => tag.trim()) : [],
            author: req.user.userId,
            settings: {
                visibility,
                allowComments: true,
                allowShares: true,
                showLikesCount: true,
                showCommentsCount: true
            },
            status: {
                published: true,
                publishedAt: new Date()
            }
        });

        await post.save();
        
        // Populate author information
        await post.populate('author', 'username profile.profilePicture profile.displayName');

        // Update user's post count
        await User.findByIdAndUpdate(req.user.userId, {
            $inc: { 'stats.postsCount': 1 }
        });

        console.log(`New post created: ${post.title} by ${post.author.username}`);

        res.status(201).json({
            message: 'Post created successfully',
            post: post
        });

    } catch (error) {
        console.error('Create post error:', error);
        res.status(400).json({ 
            message: 'Failed to create post',
            error: error.message 
        });
    }
});

/**
 * GET /api/posts/:id
 * Get a specific post by ID
 */
app.get('/api/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        const post = await Post.findById(id)
            .populate('author', 'username profile.profilePicture profile.displayName')
            .populate('engagement.comments.user', 'username profile.profilePicture');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if post is published
        if (!post.status.published) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Increment view count
        post.incrementViews();

        res.json(post);

    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch post',
            error: error.message 
        });
    }
});

/**
 * POST /api/posts/:id/like
 * Like or unlike a post
 */
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userId = req.user.userId;
        const isLiked = post.isLikedBy(userId);

        if (isLiked) {
            // Unlike the post
            await post.removeLike(userId);
            res.json({ 
                message: 'Post unliked successfully', 
                liked: false,
                likesCount: post.likesCount
            });
        } else {
            // Like the post
            await post.addLike(userId);
            res.json({ 
                message: 'Post liked successfully', 
                liked: true,
                likesCount: post.likesCount
            });
        }

    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ 
            message: 'Failed to like/unlike post',
            error: error.message 
        });
    }
});

/**
 * POST /api/posts/:id/comment
 * Add a comment to a post
 */
app.post('/api/posts/:id/comment', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (!post.settings.allowComments) {
            return res.status(403).json({ message: 'Comments are disabled for this post' });
        }

        // Add comment
        await post.addComment(req.user.userId, content.trim());
        
        // Populate the post with updated comments
        await post.populate('engagement.comments.user', 'username profile.profilePicture');

        const newComment = post.engagement.comments[post.engagement.comments.length - 1];

        res.json({
            message: 'Comment added successfully',
            comment: newComment,
            commentsCount: post.commentsCount
        });

    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ 
            message: 'Failed to add comment',
            error: error.message 
        });
    }
});

/**
 * POST /api/posts/:id/share
 * Share a post
 */
app.post('/api/posts/:id/share', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { shareType = 'repost' } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (!post.settings.allowShares) {
            return res.status(403).json({ message: 'Sharing is disabled for this post' });
        }

        // Add share
        await post.addShare(req.user.userId, shareType);

        res.json({
            message: 'Post shared successfully',
            sharesCount: post.sharesCount
        });

    } catch (error) {
        console.error('Share post error:', error);
        res.status(500).json({ 
            message: 'Failed to share post',
            error: error.message 
        });
    }
});

/**
 * POST /api/posts/upload-media
 * Upload media for posts
 */
app.post('/api/posts/upload-media', authenticateToken, postMediaUpload.array('media', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No media files provided' });
        }

        const mediaUrls = req.files.map(file => ({
            url: `${req.protocol}://${req.get('host')}/uploads/posts/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        }));

        res.json({
            message: 'Media uploaded successfully',
            media: mediaUrls
        });

    } catch (error) {
        console.error('Upload media error:', error);
        
        // Clean up uploaded files on error
        if (req.files) {
            req.files.forEach(file => {
                const filePath = path.join(postMediaDir, file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to upload media',
            error: error.message 
        });
    }
});

// Get user's chats
app.get('/api/chats', authenticateToken, async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.user.userId })
            .populate('participants', 'username profile.profilePicture activity.isOnline activity.lastActiveAt')
            .populate('lastMessage')
            .sort({ lastActivity: -1 });

        const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
            const unreadCount = await Message.countDocuments({
                chat: chat._id,
                'readBy.user': { $ne: req.user.userId },
                isDeleted: false
            });

            // Standardize chat object with consistent ID fields
            return {
                ...standardizeChatObject(chat),
                unreadCount
            };
        }));

        console.log(`Fetched ${chatsWithUnread.length} chats for user ${req.user.userId}`);
        res.json(chatsWithUnread);
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({ message: 'Failed to fetch chats' });
    }
});

// Create or get existing chat
app.post('/api/chats', authenticateToken, async (req, res) => {
    try {
        const { participantId } = req.body;
        const currentUserId = req.user.userId;

        console.log(`Creating chat: ${currentUserId} -> ${participantId}`);

        // Validate participant ID
        if (!participantId || participantId === currentUserId) {
            return res.status(400).json({ message: 'Invalid participant ID' });
        }

        if (!isValidObjectId(participantId)) {
            return res.status(400).json({ message: 'Invalid participant ID format' });
        }

        // Check if participant user exists
        const participantUser = await User.findById(participantId);
        if (!participantUser) {
            return res.status(404).json({ message: 'Participant user not found' });
        }

        // Check if chat already exists between these users
        let chat = await Chat.findOne({
            type: 'direct',
            participants: { $all: [currentUserId, participantId], $size: 2 }
        }).populate('participants', 'username profile.profilePicture activity.isOnline');

        if (!chat) {
            // Create new chat
            chat = new Chat({
                type: 'direct',
                participants: [currentUserId, participantId],
                createdBy: currentUserId,
                participantSettings: [
                    { user: currentUserId, joinedAt: new Date(), lastSeenAt: new Date() },
                    { user: participantId, joinedAt: new Date(), lastSeenAt: new Date() }
                ]
            });
            await chat.save();
            await chat.populate('participants', 'username profile.profilePicture activity.isOnline');
            console.log(`Created new chat: ${chat._id}`);
        } else {
            console.log(`Found existing chat: ${chat._id}`);
        }

        // Return standardized chat object
        res.json(standardizeChatObject(chat));
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({ message: 'Failed to create chat' });
    }
});

// Get messages for a specific chat
app.get('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        
        console.log(`Fetching messages for chat: ${chatId}, user: ${req.user.userId}`);
        
        // Validate chatId
        if (!isValidObjectId(chatId)) {
            return res.status(400).json({ message: 'Invalid chat ID format' });
        }
        
        // Verify user is participant of this chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (!chat.participants.includes(req.user.userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const messages = await Message.find({ 
            chat: chatId, 
            isDeleted: false 
        })
            .populate('sender', 'username profile.profilePicture')
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        console.log(`Found ${messages.length} messages for chat ${chatId}`);
        res.json(messages.reverse());
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

// =======================
// USER ENDPOINTS
// =======================

// Get current user information
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update last activity
        await user.updateLastActivity();

        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            profile: user.profile,
            stats: user.stats,
            account: user.account,
            createdAt: user.createdAt
        });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users (for creating new chats)
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const { search, limit = 20 } = req.query;
        
        console.log('Fetching users for user ID:', req.user.userId);
        console.log('Search query:', search);
        
        // Build query - exclude current user and only active accounts
        let query = { 
            _id: { $ne: req.user.userId },
            'account.status': 'active'
        };
        
        // Add search functionality
        if (search && search.trim()) {
            query.$or = [
                { username: new RegExp(search.trim(), 'i') },
                { 'profile.displayName': new RegExp(search.trim(), 'i') }
            ];
        }

        // Fetch users with essential fields
        const users = await User.find(query)
            .select('username profile.profilePicture profile.displayName activity.isOnline activity.lastActiveAt')
            .limit(parseInt(limit))
            .sort({ 'activity.lastActiveAt': -1 }); // Recently active first
        
        console.log(`Found ${users.length} users`);
        
        // Transform response to include computed fields
        const transformedUsers = users.map(user => ({
            _id: user._id,
            username: user.username,
            profile: {
                profilePicture: user.profile?.profilePicture || { url: null },
                displayName: user.profile?.displayName || user.username
            },
            activity: {
                isOnline: user.activity?.isOnline || false,
                lastActiveAt: user.activity?.lastActiveAt
            }
        }));
        
        res.json(transformedUsers);
        
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ 
            message: 'Failed to fetch users',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
});

// Get user profile by username
app.get('/api/users/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username }).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            profile: user.profile,
            stats: user.stats,
            account: user.account,
            createdAt: user.createdAt
        };

        res.json(userResponse);

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch user profile',
            error: error.message 
        });
    }
});

// Update user profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { username, profile } = req.body;
        const userId = req.user.userId;

        // Check if username is being changed and if it's already taken
        if (username) {
            const existingUser = await User.findOne({ 
                username, 
                _id: { $ne: userId } 
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    message: 'Username already taken. Please choose a different username.' 
                });
            }
        }

        // Prepare update data using $set to preserve existing fields
        const updateData = {};
        
        // Update username if provided
        if (username) {
            updateData.username = username;
        }

        // Update profile fields selectively to preserve existing data like profilePicture
        if (profile) {
            // Only update the specific profile fields that are provided
            if (profile.firstName !== undefined) updateData['profile.firstName'] = profile.firstName;
            if (profile.lastName !== undefined) updateData['profile.lastName'] = profile.lastName;
            if (profile.displayName !== undefined) updateData['profile.displayName'] = profile.displayName;
            if (profile.bio !== undefined) updateData['profile.bio'] = profile.bio;
            if (profile.location !== undefined) updateData['profile.location'] = profile.location;
            if (profile.website !== undefined) updateData['profile.website'] = profile.website;
            if (profile.phoneNumber !== undefined) updateData['profile.phoneNumber'] = profile.phoneNumber;
            
            // Only update profilePicture if it's explicitly provided (for avatar uploads)
            if (profile.profilePicture !== undefined) {
                updateData['profile.profilePicture'] = profile.profilePicture;
            }
        }

        // Update user data using $set to preserve existing fields
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                profile: updatedUser.profile,
                stats: updatedUser.stats,
                account: updatedUser.account,
                createdAt: updatedUser.createdAt
            }
        });

    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ 
            message: 'Failed to update profile',
            error: err.message 
        });
    }
});

// Avatar upload endpoint
app.post('/api/users/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                message: 'No image file provided' 
            });
        }

        const userId = req.user.userId;
        const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

        // Get current user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove old avatar file if exists
        if (user.profile && user.profile.profilePicture && user.profile.profilePicture.filename) {
            const oldAvatarPath = path.join(uploadDir, user.profile.profilePicture.filename);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // Update user avatar information
        const updateData = {
            'profile.profilePicture': {
                url: avatarUrl,
                filename: req.file.filename,
                uploadedAt: new Date()
            }
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Avatar uploaded successfully',
            avatarUrl: avatarUrl,
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                profile: updatedUser.profile,
                stats: updatedUser.stats,
                account: updatedUser.account,
                createdAt: updatedUser.createdAt
            }
        });

    } catch (error) {
        console.error('Avatar upload error:', error);
        
        // Clean up uploaded file on error
        if (req.file) {
            const filePath = path.join(uploadDir, req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'File size too large. Maximum size is 5MB.' 
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to upload avatar',
            error: error.message 
        });
    }
});

// Password change endpoint - Added to handle password updates properly
app.put('/api/users/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: 'New password must be at least 6 characters long' 
            });
        }

        // Find user with password field
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                message: 'Current password is incorrect' 
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await User.findByIdAndUpdate(userId, {
            password: hashedNewPassword
        });

        res.json({
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ 
            message: 'Failed to change password',
            error: error.message 
        });
    }
});

// Debug endpoint to test user fetching
app.get('/api/debug/users', authenticateToken, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ 'account.status': 'active' });
        const usersExcludingCurrent = await User.countDocuments({ 
            _id: { $ne: req.user.userId },
            'account.status': 'active'
        });
        
        const sampleUsers = await User.find({ 
            _id: { $ne: req.user.userId },
            'account.status': 'active'
        })
        .select('username profile.displayName')
        .limit(5);
        
        res.json({
            debug: {
                currentUserId: req.user.userId,
                totalUsers,
                activeUsers,
                usersExcludingCurrent,
                sampleUsers: sampleUsers.map(u => ({
                    id: u._id,
                    username: u.username,
                    displayName: u.profile?.displayName
                }))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Socket.IO server initialized');
    console.log('Available endpoints:');
    console.log('- POST /api/users (register)');
    console.log('- POST /api/auth/login (login)');
    console.log('- GET /api/auth/me (get current user)');
    console.log('- GET /api/users (get all users)');
    console.log('- PUT /api/users/profile (update profile)');
    console.log('- POST /api/users/avatar (upload avatar)');
    console.log('- PUT /api/users/password (change password)');
    console.log('- GET /api/chats (get user chats)');
    console.log('- POST /api/chats (create chat)');
    console.log('- GET /api/chats/:chatId/messages (get messages)');
    console.log('- GET /api/posts (get posts with pagination)');
    console.log('- POST /api/posts (create post)');
    console.log('- GET /api/posts/:id (get specific post)');
    console.log('- POST /api/posts/:id/like (like/unlike post)');
    console.log('- POST /api/posts/:id/comment (add comment)');
    console.log('- POST /api/posts/:id/share (share post)');
    console.log('- POST /api/posts/upload-media (upload post media)');
});
