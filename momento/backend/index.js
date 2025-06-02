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

// Serve static files for uploaded avatars
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/avatars';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: userId-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, req.user.userId + '-' + uniqueSuffix + extension);
    }
});

// File filter for avatar uploads
const fileFilter = (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'momento-default-secret-change-in-production';

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

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

        // Required server-side validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: 'Username, email, and password are required' 
            });
        }

        // Check if the user already exists
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

        // Hash password
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

        // Return user data without password
        const userResponse = {
            id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            profile: savedUser.profile,
            createdAt: savedUser.createdAt
        };

        res.status(201).json({
            message: 'User created successfully',
            user: userResponse,
            token: token
        });

    } catch (err) {
        console.error('Registration error:', err);
        
        // Handle duplicate key errors
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

        // Find user by email or username
        const user = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { username: email }
            ]
        });

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

        // Return user data without password
        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            profile: user.profile,
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

// Token Authentication Middleware
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

// Get current user information with complete profile data
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

// Update user profile with complete profile support
app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { username, profile } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!username) {
            return res.status(400).json({
                message: 'Username is required'
            });
        }

        // Check if the username is taken by another user
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
        
        // Handle profile updates
        if (profile) {
            // Validate profile fields
            const allowedProfileFields = [
                'firstName', 'lastName', 'displayName', 'bio', 
                'location', 'website', 'phoneNumber'
            ];
            
            const profileUpdates = {};
            allowedProfileFields.forEach(field => {
                if (profile[field] !== undefined) {
                    profileUpdates[`profile.${field}`] = profile[field];
                }
            });
            
            Object.assign(updateData, profileUpdates);
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
                createdAt: updatedUser.createdAt
            }
        });

    } catch (err) {
        console.error('Update profile error:', err);
        
        // Handle validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ 
                message: 'Validation failed: ' + errors.join(', ')
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to update profile',
            error: err.message 
        });
    }
});

// Upload avatar endpoint
app.post('/api/users/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'No image file provided'
            });
        }

        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old avatar file if exists
        if (user.profile.profilePicture && user.profile.profilePicture.url) {
            const oldFilename = path.basename(user.profile.profilePicture.url);
            const oldFilePath = path.join(uploadsDir, oldFilename);
            
            try {
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            } catch (deleteErr) {
                console.error('Error deleting old avatar:', deleteErr);
                // Don't fail the request if old file deletion fails
            }
        }

        // Generate avatar URL
        const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

        // Update user's profile picture
        user.profile.profilePicture = {
            url: avatarUrl,
            publicId: req.file.filename,
            uploadedAt: new Date()
        };

        await user.save();

        res.json({
            message: 'Avatar uploaded successfully',
            avatarUrl: avatarUrl,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profile: user.profile
            }
        });

    } catch (err) {
        console.error('Avatar upload error:', err);
        
        // Clean up uploaded file if database update fails
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (deleteErr) {
                console.error('Error deleting uploaded file:', deleteErr);
            }
        }
        
        res.status(500).json({ 
            message: 'Failed to upload avatar',
            error: err.message 
        });
    }
});

// Change password endpoint
app.put('/api/users/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        console.log('Password change request received for user:', userId);
        console.log('Request body:', { currentPassword: '***', newPassword: '***' });

        // Validate input
        if (!currentPassword || !newPassword) {
            console.log('Missing password fields');
            return res.status(400).json({
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            console.log('New password too short');
            return res.status(400).json({
                message: 'New password must be at least 6 characters long'
            });
        }

        // Find user with password field included
        const user = await User.findById(userId).select('+password');
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User found, verifying current password...');

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            console.log('Current password verification failed');
            return res.status(400).json({
                message: 'Current password is incorrect'
            });
        }

        console.log('Current password verified, updating to new password...');

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        user.password = hashedNewPassword;
        await user.save();

        console.log('Password updated successfully for user:', userId);

        res.json({
            message: 'Password changed successfully'
        });

    } catch (err) {
        console.error('Password change error:', err);
        res.status(500).json({ 
            message: 'Failed to change password',
            error: err.message 
        });
    }
});

// Get user profile by username
app.get('/api/users/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        const user = await User.findOne({ username })
            .select('-password')
            .populate('relationships.followers.user', 'username profile.profilePicture')
            .populate('relationships.following.user', 'username profile.profilePicture');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return public profile data
        const profileData = {
            id: user._id,
            username: user.username,
            email: user.email, // You might want to hide this for non-own profiles
            profile: user.profile,
            stats: user.stats,
            account: {
                isVerified: user.account.isVerified,
                accountType: user.account.accountType
            },
            createdAt: user.createdAt
        };

        res.json(profileData);

    } catch (err) {
        console.error('Get user profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Follow a user
app.post('/api/users/:userId/follow', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        if (userId === currentUserId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        const [currentUser, targetUser] = await Promise.all([
            User.findById(currentUserId),
            User.findById(userId)
        ]);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already following
        const isAlreadyFollowing = currentUser.relationships.following.some(
            f => f.user.toString() === userId
        );

        if (isAlreadyFollowing) {
            return res.status(400).json({ message: 'Already following this user' });
        }

        // Add to following list
        currentUser.relationships.following.push({ user: userId });
        currentUser.stats.followingCount += 1;

        // Add to followers list
        targetUser.relationships.followers.push({ user: currentUserId });
        targetUser.stats.followersCount += 1;

        await Promise.all([currentUser.save(), targetUser.save()]);

        res.json({
            message: 'Successfully followed user',
            isFollowing: true,
            followersCount: targetUser.stats.followersCount
        });

    } catch (err) {
        console.error('Follow user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unfollow a user
app.post('/api/users/:userId/unfollow', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        const [currentUser, targetUser] = await Promise.all([
            User.findById(currentUserId),
            User.findById(userId)
        ]);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove from following list
        currentUser.relationships.following = currentUser.relationships.following.filter(
            f => f.user.toString() !== userId
        );
        currentUser.stats.followingCount = Math.max(0, currentUser.stats.followingCount - 1);

        // Remove from followers list
        targetUser.relationships.followers = targetUser.relationships.followers.filter(
            f => f.user.toString() !== currentUserId
        );
        targetUser.stats.followersCount = Math.max(0, targetUser.stats.followersCount - 1);

        await Promise.all([currentUser.save(), targetUser.save()]);

        res.json({
            message: 'Successfully unfollowed user',
            isFollowing: false,
            followersCount: targetUser.stats.followersCount
        });

    } catch (err) {
        console.error('Unfollow user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Check follow status
app.get('/api/users/:userId/follow-status', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        if (userId === currentUserId) {
            return res.json({ isFollowing: false }); // Can't follow yourself
        }

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ message: 'Current user not found' });
        }

        const isFollowing = currentUser.relationships.following.some(
            f => f.user.toString() === userId
        );

        res.json({ isFollowing });

    } catch (err) {
        console.error('Check follow status error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File size too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            message: 'File upload error: ' + error.message
        });
    }
    
    if (error.message === 'Only image files are allowed') {
        return res.status(400).json({
            message: 'Only image files are allowed'
        });
    }
    
    next(error);
});

// General error handling middleware
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
    console.log('- PUT /api/users/profile (update profile)');
    console.log('- POST /api/users/avatar (upload avatar)');
    console.log('- PUT /api/users/password (change password)');
});
