const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const User = require('./models/User');

const app = express();
app.use(cors());
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

// Ensure upload directory exists
const uploadDir = './uploads/avatars';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
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
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: avatarFileFilter
});

// Static file serving for uploaded avatars
app.use('/uploads', express.static('uploads'));

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

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ message: 'Server error' });
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

        // Check if the username is taken (frontend cannot verify this)
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

        // Prepare update data
        const updateData = { username };
        if (profile) {
            updateData.profile = profile;
        }

        // Update user data
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
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

        // Delete old avatar file (if exists)
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
        
        // Delete uploaded file if there's an error
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

// Change password endpoint
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

        // Get user
        const user = await User.findById(userId);
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
        await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

        res.json({
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            message: 'Failed to change password',
            error: error.message 
        });
    }
});

// Check follow status endpoint
app.get('/api/users/:userId/follow-status', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        if (currentUserId === userId) {
            return res.json({ isFollowing: false }); // Cannot follow yourself
        }

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isFollowing = currentUser.relationships.following.some(
            follow => follow.user.toString() === userId
        );

        res.json({ isFollowing });

    } catch (error) {
        console.error('Check follow status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Follow user endpoint
app.post('/api/users/:userId/follow', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        if (currentUserId === userId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        const [currentUser, targetUser] = await Promise.all([
            User.findById(currentUserId),
            User.findById(userId)
        ]);

        if (!currentUser || !targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already following
        const alreadyFollowing = currentUser.relationships.following.some(
            follow => follow.user.toString() === userId
        );

        if (alreadyFollowing) {
            return res.status(400).json({ message: 'Already following this user' });
        }

        // Add follow relationship
        currentUser.relationships.following.push({ user: userId });
        currentUser.stats.followingCount += 1;

        targetUser.relationships.followers.push({ user: currentUserId });
        targetUser.stats.followersCount += 1;

        await Promise.all([currentUser.save(), targetUser.save()]);

        res.json({ message: 'Successfully followed user' });

    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unfollow user endpoint
app.post('/api/users/:userId/unfollow', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        const [currentUser, targetUser] = await Promise.all([
            User.findById(currentUserId),
            User.findById(userId)
        ]);

        if (!currentUser || !targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove follow relationship
        currentUser.relationships.following = currentUser.relationships.following.filter(
            follow => follow.user.toString() !== userId
        );
        currentUser.stats.followingCount = Math.max(0, currentUser.stats.followingCount - 1);

        targetUser.relationships.followers = targetUser.relationships.followers.filter(
            follower => follower.user.toString() !== currentUserId
        );
        targetUser.stats.followersCount = Math.max(0, targetUser.stats.followersCount - 1);

        await Promise.all([currentUser.save(), targetUser.save()]);

        res.json({ message: 'Successfully unfollowed user' });

    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- POST /api/users (register)');
    console.log('- POST /api/auth/login (login)');
    console.log('- GET /api/auth/me (get current user)');
    console.log('- GET /api/users (get all users)');
    console.log('- GET /api/users/profile/:username (get user profile)');
    console.log('- PUT /api/users/profile (update profile)');
    console.log('- POST /api/users/avatar (upload avatar)');
    console.log('- PUT /api/users/password (change password)');
    console.log('- GET /api/users/:userId/follow-status (check follow status)');
    console.log('- POST /api/users/:userId/follow (follow user)');
    console.log('- POST /api/users/:userId/unfollow (unfollow user)');
});
