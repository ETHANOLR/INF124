// backend/scripts/seedPosts.js
// Script to populate the database with sample posts for testing

const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
require('dotenv').config();

// Sample post data
const samplePosts = [
    {
        title: "Summer Fashion Trends 2025",
        content: "Discover the hottest fashion trends for this summer. From vibrant colors to sustainable fabrics, this season is all about making a statement while being environmentally conscious. Bold patterns, flowing silhouettes, and eco-friendly materials are taking center stage. Learn how to incorporate these trends into your wardrobe without breaking the bank.",
        category: "Fashion",
        tags: ["summer", "trends", "sustainable", "style"],
        excerpt: "Discover the hottest fashion trends for this summer season..."
    },
    {
        title: "Hidden Gems of Tokyo: A Food Lover's Guide",
        content: "Tokyo is a culinary paradise waiting to be explored. Beyond the famous sushi restaurants and ramen shops, the city hides incredible food experiences in small alleys and local neighborhoods. Join me as I explore hole-in-the-wall establishments serving the most authentic Japanese cuisine you've never heard of.",
        category: "Travel",
        tags: ["tokyo", "food", "japan", "authentic", "local"],
        excerpt: "Tokyo is a culinary paradise waiting to be explored beyond the famous spots..."
    },
    {
        title: "10-Minute Skincare Routine for Busy Mornings",
        content: "Looking amazing doesn't have to take hours. This quick and effective skincare routine will have you glowing in just 10 minutes. Perfect for busy professionals, students, or anyone who wants to look their best without spending too much time in front of the mirror. Each step is carefully chosen for maximum impact.",
        category: "Beauty",
        tags: ["skincare", "morning", "routine", "quick", "glow"],
        excerpt: "Looking amazing doesn't have to take hours with this quick routine..."
    },
    {
        title: "Plant-Based Protein Bowl Recipe",
        content: "Fuel your body with this nutritious and delicious plant-based protein bowl. Packed with quinoa, chickpeas, fresh vegetables, and a tangy tahini dressing, this meal will keep you satisfied for hours. It's perfect for meal prep and customizable to your taste preferences. A complete guide to creating the perfect balanced meal.",
        category: "Food",
        tags: ["plant-based", "protein", "healthy", "meal-prep", "vegan"],
        excerpt: "Fuel your body with this nutritious and delicious plant-based protein bowl..."
    },
    {
        title: "Creating a Minimalist Home Office",
        content: "Transform your workspace into a productivity haven with minimalist design principles. Less clutter means more focus. Learn how to design a home office that promotes creativity and efficiency while maintaining a clean, peaceful aesthetic. From furniture selection to organization tips, everything you need to know.",
        category: "Lifestyle",
        tags: ["minimalist", "home-office", "productivity", "design", "workspace"],
        excerpt: "Transform your workspace into a productivity haven with minimalist design..."
    },
    {
        title: "Street Style Photography Tips",
        content: "Capture the essence of urban fashion with these professional street style photography techniques. Learn about composition, lighting, and how to work with candid subjects. Whether you're using a smartphone or a professional camera, these tips will elevate your street photography game and help you document the fashion around you.",
        category: "Photography",
        tags: ["photography", "street-style", "fashion", "tips", "urban"],
        excerpt: "Capture the essence of urban fashion with these professional techniques..."
    },
    {
        title: "Sustainable Living: Small Changes, Big Impact",
        content: "Making eco-friendly choices doesn't mean overhauling your entire lifestyle overnight. Start with these simple swaps that make a real difference for the environment. From reducing plastic waste to choosing sustainable brands, every small action contributes to a healthier planet. A beginner's guide to conscious living.",
        category: "Lifestyle",
        tags: ["sustainable", "eco-friendly", "environment", "green-living", "conscious"],
        excerpt: "Making eco-friendly choices doesn't mean overhauling your entire lifestyle..."
    },
    {
        title: "Weekend Beach Getaway Essentials",
        content: "Planning the perfect beach weekend? Don't forget these essential items that will make your trip comfortable and memorable. From sun protection to beach activities, I've compiled the ultimate packing list based on years of coastal adventures. Plus, tips for finding the best hidden beaches and local experiences.",
        category: "Travel",
        tags: ["beach", "weekend", "travel", "packing", "vacation"],
        excerpt: "Planning the perfect beach weekend? Don't forget these essential items..."
    },
    {
        title: "DIY Natural Beauty Masks",
        content: "Treat your skin to these homemade beauty masks using ingredients from your kitchen. Natural skincare doesn't have to be expensive or complicated. These recipes use common ingredients like honey, oatmeal, and avocado to create spa-quality treatments at home. Perfect for self-care Sundays or anytime your skin needs extra love.",
        category: "Beauty",
        tags: ["DIY", "natural", "skincare", "homemade", "masks"],
        excerpt: "Treat your skin to these homemade beauty masks using kitchen ingredients..."
    },
    {
        title: "Vintage Fashion: Styling Thrifted Finds",
        content: "Give new life to vintage pieces with modern styling techniques. Thrift shopping is not only budget-friendly but also sustainable. Learn how to spot quality vintage items, mix them with contemporary pieces, and create unique outfits that express your personal style. A complete guide to building a vintage-inspired wardrobe.",
        category: "Fashion",
        tags: ["vintage", "thrift", "sustainable-fashion", "styling", "unique"],
        excerpt: "Give new life to vintage pieces with modern styling techniques..."
    },
    {
        title: "Homemade Pasta: From Scratch to Plate",
        content: "There's nothing quite like fresh, homemade pasta. This detailed guide walks you through the entire process, from making the dough to creating the perfect sauce. Whether you're a beginner or looking to refine your technique, these tips will help you create restaurant-quality pasta in your own kitchen. Includes three classic sauce recipes.",
        category: "Food",
        tags: ["pasta", "homemade", "cooking", "italian", "recipe"],
        excerpt: "There's nothing quite like fresh, homemade pasta. This detailed guide..."
    },
    {
        title: "Mountain Hiking Adventures in Colorado",
        content: "Explore the breathtaking mountain trails of Colorado with this comprehensive hiking guide. From beginner-friendly paths to challenging summit climbs, Colorado offers adventures for every skill level. Discover hidden waterfalls, alpine lakes, and panoramic views that will leave you speechless. Includes safety tips and gear recommendations.",
        category: "Travel",
        tags: ["hiking", "colorado", "mountains", "adventure", "nature"],
        excerpt: "Explore the breathtaking mountain trails of Colorado with this guide..."
    },
    {
        title: "Budget Travel: Europe on $50 a Day",
        content: "Think Europe is too expensive to explore? Think again. From affordable hostels to local street eats and free walking tours, discover how to travel across Europe without breaking the bank. Includes sample itineraries and apps to help you plan smart.",
        category: "Travel",
        tags: ["budget", "europe", "travel-hacks", "cheap", "adventure"],
        excerpt: "Think Europe is too expensive? Here's how to travel across Europe on a tight budget..."
    },
    {
        title: "How to Photograph the Night Sky",
        content: "Capture stunning photos of stars, constellations, and even the Milky Way with this night photography guide. Learn about camera settings, gear recommendations, and planning your shoot for the best celestial moments.",
        category: "Photography",
        tags: ["astrophotography", "night", "stars", "milky-way", "camera-settings"],
        excerpt: "Capture stunning photos of the night sky with this beginner-friendly photography guide..."
    },
    {
        title: "Mastering Meal Prep for Busy Weeks",
        content: "Save time, eat healthy, and reduce food waste with strategic meal prep. This guide walks you through planning, shopping, and preparing meals for the week in under two hours. Includes printable grocery list and sample recipes.",
        category: "Food",
        tags: ["meal-prep", "planning", "healthy", "time-saving", "recipes"],
        excerpt: "Save time and eat better with this complete guide to weekly meal prep..."
    },
    {
        title: "Eco-Friendly Home Hacks",
        content: "Transform your home into a greener space with these easy, budget-friendly sustainability tips. From composting to energy-saving habits, discover how small changes in your daily routine can make a big difference for the planet.",
        category: "Lifestyle",
        tags: ["eco", "green-home", "sustainability", "hacks", "environment"],
        excerpt: "Make your home more sustainable with these simple and affordable eco-friendly hacks..."
    },
];

// Function to connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Function to get or create a sample user
const getOrCreateSampleUser = async () => {
    try {
        // Try to find an existing user
        let user = await User.findOne({ username: 'demo_user' });
        
        if (!user) {
            // Create a sample user if none exists
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('demo123', 12);
            
            user = new User({
                username: 'demo_user',
                email: 'demo@momento.app',
                password: hashedPassword,
                profile: {
                    displayName: 'Demo User',
                    bio: 'Sample user for testing the Momento platform',
                    firstName: 'Demo',
                    lastName: 'User'
                },
                account: {
                    isVerified: true,
                    emailVerified: true
                }
            });
            
            await user.save();
            console.log('Created sample user: demo_user');
        } else {
            console.log('Using existing user: demo_user');
        }
        
        return user;
    } catch (error) {
        console.error('Error creating sample user:', error);
        throw error;
    }
};

// Function to create additional sample users for variety
const createAdditionalUsers = async () => {
    const bcrypt = require('bcryptjs');
    const users = [];
    
    const userTemplates = [
        {
            username: 'sarah_style',
            email: 'sarah@momento.app',
            displayName: 'Sarah Chen',
            bio: 'Fashion enthusiast and sustainable living advocate',
            firstName: 'Sarah',
            lastName: 'Chen'
        },
        {
            username: 'mike_travels',
            email: 'mike@momento.app',
            displayName: 'Mike Rodriguez',
            bio: 'Adventure seeker and travel photographer',
            firstName: 'Mike',
            lastName: 'Rodriguez'
        },
        {
            username: 'emma_beauty',
            email: 'emma@momento.app',
            displayName: 'Emma Johnson',
            bio: 'Beauty blogger and skincare enthusiast',
            firstName: 'Emma',
            lastName: 'Johnson'
        },
        {
            username: 'alex_foodie',
            email: 'alex@momento.app',
            displayName: 'Alex Kim',
            bio: 'Chef and food photography lover',
            firstName: 'Alex',
            lastName: 'Kim'
        }
    ];
    
    for (const template of userTemplates) {
        try {
            let user = await User.findOne({ username: template.username });
            
            if (!user) {
                const hashedPassword = await bcrypt.hash('demo123', 12);
                
                user = new User({
                    username: template.username,
                    email: template.email,
                    password: hashedPassword,
                    profile: {
                        displayName: template.displayName,
                        bio: template.bio,
                        firstName: template.firstName,
                        lastName: template.lastName
                    },
                    account: {
                        isVerified: true,
                        emailVerified: true
                    }
                });
                
                await user.save();
                console.log(`Created user: ${template.username}`);
            }
            
            users.push(user);
        } catch (error) {
            console.error(`Error creating user ${template.username}:`, error);
        }
    }
    
    return users;
};

// Function to seed posts
const seedPosts = async () => {
    try {
        console.log('Starting to seed posts...');
        
        // Connect to database
        await connectDB();
        
        // Get or create sample users
        const mainUser = await getOrCreateSampleUser();
        const additionalUsers = await createAdditionalUsers();
        const allUsers = [mainUser, ...additionalUsers];
        
        // Clear existing posts (optional - comment out if you want to keep existing posts)
        // await Post.deleteMany({});
        // console.log('Cleared existing posts');
        
        // Check if posts already exist
        const existingPostsCount = await Post.countDocuments();
        if (existingPostsCount > 0) {
            console.log(`Found ${existingPostsCount} existing posts. Adding new sample posts...`);
        }
        
        // Create posts
        const posts = [];
        for (let i = 0; i < samplePosts.length; i++) {
            const postData = samplePosts[i];
            
            // Randomly assign authors to posts for variety
            const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
            
            // Check if post with this title already exists
            const existingPost = await Post.findOne({ title: postData.title });
            if (existingPost) {
                console.log(`Post "${postData.title}" already exists, skipping...`);
                continue;
            }
            
            const post = new Post({
                ...postData,
                author: randomUser._id,
                status: {
                    published: true,
                    publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last week
                },
                analytics: {
                    views: Math.floor(Math.random() * 1000) + 50,
                    impressions: Math.floor(Math.random() * 2000) + 100
                },
                engagement: {
                    likes: Array.from({ length: Math.floor(Math.random() * 20) }, () => ({
                        user: allUsers[Math.floor(Math.random() * allUsers.length)]._id,
                        likedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                    })),
                    comments: [],
                    shares: [],
                    saves: []
                }
            });
            
            await post.save();
            posts.push(post);
            console.log(`Created post: "${postData.title}" by ${randomUser.username}`);
        }
        
        // Update user post counts
        for (const user of allUsers) {
            const userPostCount = await Post.countDocuments({ author: user._id });
            await User.findByIdAndUpdate(user._id, {
                'stats.postsCount': userPostCount
            });
        }
        
        console.log(`\n✅ Successfully seeded ${posts.length} new posts!`);
        console.log(`📊 Total posts in database: ${await Post.countDocuments()}`);
        console.log(`👥 Total users: ${allUsers.length}`);
        
        // Display sample users for testing
        console.log('\n🔑 Sample user credentials for testing:');
        console.log('Username: demo_user, Password: demo123');
        console.log('Username: sarah_style, Password: demo123');
        console.log('Username: mike_travels, Password: demo123');
        console.log('Username: emma_beauty, Password: demo123');
        console.log('Username: alex_foodie, Password: demo123');
        
        console.log('\n🚀 You can now start your frontend and see real posts in your homepage!');
        console.log('📱 Navigate to your homepage to see the posts with categories, likes, and real user data.');
        
    } catch (error) {
        console.error('Error seeding posts:', error);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
};

// Function to clear all posts (use with caution)
const clearPosts = async () => {
    try {
        await connectDB();
        const deletedPosts = await Post.deleteMany({});
        console.log(`Deleted ${deletedPosts.deletedCount} posts`);
        
        // Reset user post counts
        await User.updateMany({}, { 'stats.postsCount': 0 });
        console.log('Reset all user post counts to 0');
        
    } catch (error) {
        console.error('Error clearing posts:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

// Check command line arguments
const command = process.argv[2];

if (command === 'clear') {
    console.log('⚠️  Clearing all posts from database...');
    clearPosts();
} else {
    console.log('🌱 Seeding database with sample posts...');
    seedPosts();
}

// Export functions for potential use in other scripts
module.exports = {
    seedPosts,
    clearPosts,
    connectDB
};
