// backend/scripts/seedPosts.js
// Script to populate the database with sample posts for testing

const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
require('dotenv').config({ path: './backend/.env' });
console.log('DEBUG: MONGO_URI =', process.env.MONGO_URI);

// Expanded sample post data with more variety and content
const samplePosts = [
    // Original posts (keeping the existing ones)
    {
        title: "Summer Fashion Trends 2025",
        content: "Discover the hottest fashion trends for this summer. From vibrant colors to sustainable fabrics, this season is all about making a statement while being environmentally conscious. Bold patterns, flowing silhouettes, and eco-friendly materials are taking center stage. Learn how to incorporate these trends into your wardrobe without breaking the bank.",
        category: "Fashion",
        tags: ["summer", "trends", "sustainable", "style"],
        excerpt: "Discover the hottest fashion trends for this summer season...",
        location: { address: { city: "Los Angeles" } }
    },
    {
        title: "Hidden Gems of Tokyo: A Food Lover's Guide",
        content: "Tokyo is a culinary paradise waiting to be explored. Beyond the famous sushi restaurants and ramen shops, the city hides incredible food experiences in small alleys and local neighborhoods. Join me as I explore hole-in-the-wall establishments serving the most authentic Japanese cuisine you've never heard of.",
        category: "Travel",
        tags: ["tokyo", "food", "japan", "authentic", "local"],
        excerpt: "Tokyo is a culinary paradise waiting to be explored beyond the famous spots...",
        location: { address: { city: "Los Angeles" } }
    },
    {
        title: "10-Minute Skincare Routine for Busy Mornings",
        content: "Looking amazing doesn't have to take hours. This quick and effective skincare routine will have you glowing in just 10 minutes. Perfect for busy professionals, students, or anyone who wants to look their best without spending too much time in front of the mirror. Each step is carefully chosen for maximum impact.",
        category: "Beauty",
        tags: ["skincare", "morning", "routine", "quick", "glow"],
        excerpt: "Looking amazing doesn't have to take hours with this quick routine...",
        location: { address: { city: "Irvine" } }
    },
    {
        title: "Plant-Based Protein Bowl Recipe",
        content: "Fuel your body with this nutritious and delicious plant-based protein bowl. Packed with quinoa, chickpeas, fresh vegetables, and a tangy tahini dressing, this meal will keep you satisfied for hours. It's perfect for meal prep and customizable to your taste preferences. A complete guide to creating the perfect balanced meal.",
        category: "Food",
        tags: ["plant-based", "protein", "healthy", "meal-prep", "vegan"],
        excerpt: "Fuel your body with this nutritious and delicious plant-based protein bowl...",
        location: { address: { city: "Irvine" } }
    },
    {
        title: "Creating a Minimalist Home Office",
        content: "Transform your workspace into a productivity haven with minimalist design principles. Less clutter means more focus. Learn how to design a home office that promotes creativity and efficiency while maintaining a clean, peaceful aesthetic. From furniture selection to organization tips, everything you need to know.",
        category: "Lifestyle",
        tags: ["minimalist", "home-office", "productivity", "design", "workspace"],
        excerpt: "Transform your workspace into a productivity haven with minimalist design...",
        location: { address: { city: "Irvine" } }
    },
    {
        title: "Street Style Photography Tips",
        content: "Capture the essence of urban fashion with these professional street style photography techniques. Learn about composition, lighting, and how to work with candid subjects. Whether you're using a smartphone or a professional camera, these tips will elevate your street photography game and help you document the fashion around you.",
        category: "Photography",
        tags: ["photography", "street-style", "fashion", "tips", "urban"],
        excerpt: "Capture the essence of urban fashion with these professional techniques...",
        location: { address: { city: "Irvine" } }
    },
    {
        title: "Sustainable Living: Small Changes, Big Impact",
        content: "Making eco-friendly choices doesn't mean overhauling your entire lifestyle overnight. Start with these simple swaps that make a real difference for the environment. From reducing plastic waste to choosing sustainable brands, every small action contributes to a healthier planet. A beginner's guide to conscious living.",
        category: "Lifestyle",
        tags: ["sustainable", "eco-friendly", "environment", "green-living", "conscious"],
        excerpt: "Making eco-friendly choices doesn't mean overhauling your entire lifestyle...",
        location: { address: { city: "Irvine" } }
    },
    {
        title: "Weekend Beach Getaway Essentials",
        content: "Planning the perfect beach weekend? Don't forget these essential items that will make your trip comfortable and memorable. From sun protection to beach activities, I've compiled the ultimate packing list based on years of coastal adventures. Plus, tips for finding the best hidden beaches and local experiences.",
        category: "Travel",
        tags: ["beach", "weekend", "travel", "packing", "vacation"],
        excerpt: "Planning the perfect beach weekend? Don't forget these essential items...",
        location: { address: { city: "Las Vegas" } }
    },
    {
        title: "DIY Natural Beauty Masks",
        content: "Treat your skin to these homemade beauty masks using ingredients from your kitchen. Natural skincare doesn't have to be expensive or complicated. These recipes use common ingredients like honey, oatmeal, and avocado to create spa-quality treatments at home. Perfect for self-care Sundays or anytime your skin needs extra love.",
        category: "Beauty",
        tags: ["DIY", "natural", "skincare", "homemade", "masks"],
        excerpt: "Treat your skin to these homemade beauty masks using kitchen ingredients...",
        location: { address: { city: "San Francisco" } }
    },
    {
        title: "Vintage Fashion: Styling Thrifted Finds",
        content: "Give new life to vintage pieces with modern styling techniques. Thrift shopping is not only budget-friendly but also sustainable. Learn how to spot quality vintage items, mix them with contemporary pieces, and create unique outfits that express your personal style. A complete guide to building a vintage-inspired wardrobe.",
        category: "Fashion",
        tags: ["vintage", "thrift", "sustainable-fashion", "styling", "unique"],
        excerpt: "Give new life to vintage pieces with modern styling techniques...",
        location: { address: { city: "New York" } }
    },
    {
        title: "Homemade Pasta: From Scratch to Plate",
        content: "There's nothing quite like fresh, homemade pasta. This detailed guide walks you through the entire process, from making the dough to creating the perfect sauce. Whether you're a beginner or looking to refine your technique, these tips will help you create restaurant-quality pasta in your own kitchen. Includes three classic sauce recipes.",
        category: "Food",
        tags: ["pasta", "homemade", "cooking", "italian", "recipe"],
        excerpt: "There's nothing quite like fresh, homemade pasta. This detailed guide...",
        location: { address: { city: "San Diego" } }
    },
    {
        title: "Mountain Hiking Adventures in Colorado",
        content: "Explore the breathtaking mountain trails of Colorado with this comprehensive hiking guide. From beginner-friendly paths to challenging summit climbs, Colorado offers adventures for every skill level. Discover hidden waterfalls, alpine lakes, and panoramic views that will leave you speechless. Includes safety tips and gear recommendations.",
        category: "Travel",
        tags: ["hiking", "colorado", "mountains", "adventure", "nature"],
        excerpt: "Explore the breathtaking mountain trails of Colorado with this guide...",
        location: { address: { city: "Los Angeles" } }
    },
    {
        title: "Budget Travel: Europe on $50 a Day",
        content: "Think Europe is too expensive to explore? Think again. From affordable hostels to local street eats and free walking tours, discover how to travel across Europe without breaking the bank. Includes sample itineraries and apps to help you plan smart.",
        category: "Travel",
        tags: ["budget", "europe", "travel-hacks", "cheap", "adventure"],
        excerpt: "Think Europe is too expensive? Here's how to travel across Europe on a tight budget...",
        location: { address: { city: "Costa Mesa" } }
    },
    {
        title: "How to Photograph the Night Sky",
        content: "Capture stunning photos of stars, constellations, and even the Milky Way with this night photography guide. Learn about camera settings, gear recommendations, and planning your shoot for the best celestial moments.",
        category: "Photography",
        tags: ["astrophotography", "night", "stars", "milky-way", "camera-settings"],
        excerpt: "Capture stunning photos of the night sky with this beginner-friendly photography guide...",
        location: { address: { city: "Costa Mesa" } }
    },
    {
        title: "Mastering Meal Prep for Busy Weeks",
        content: "Save time, eat healthy, and reduce food waste with strategic meal prep. This guide walks you through planning, shopping, and preparing meals for the week in under two hours. Includes printable grocery list and sample recipes.",
        category: "Food",
        tags: ["meal-prep", "planning", "healthy", "time-saving", "recipes"],
        excerpt: "Save time and eat better with this complete guide to weekly meal prep...",
        location: { address: { city: "San Diego" } }
    },
    {
        title: "Eco-Friendly Home Hacks",
        content: "Transform your home into a greener space with these easy, budget-friendly sustainability tips. From composting to energy-saving habits, discover how small changes in your daily routine can make a big difference for the planet.",
        category: "Lifestyle",
        tags: ["eco", "green-home", "sustainability", "hacks", "environment"],
        excerpt: "Make your home more sustainable with these simple and affordable eco-friendly hacks...",
        location: { address: { city: "San Diego" } }
    },

    // NEW ADDITIONAL POSTS - Technology Category
    {
        title: "The Future of AI in Creative Industries",
        content: "Artificial Intelligence is revolutionizing creative fields from graphic design to music composition. Explore how AI tools are becoming collaborative partners rather than replacements for human creativity. This deep dive examines current AI applications in art, design, writing, and music, while addressing concerns about authenticity and the future of creative work. Discover which AI tools are worth trying and how to integrate them into your creative workflow.",
        category: "Technology",
        tags: ["AI", "creativity", "design", "innovation", "future"],
        excerpt: "Artificial Intelligence is revolutionizing creative fields from design to music composition...",
        location: { address: { city: "San Francisco" } }
    },
    {
        title: "Building Your First Mobile App: A Complete Guide",
        content: "Ever wanted to create your own mobile app? This comprehensive guide takes you through the entire process, from initial concept to app store submission. Learn about choosing the right development platform, UI/UX design principles, and essential features every app needs. Includes resources for both iOS and Android development, plus tips for marketing your app effectively.",
        category: "Technology",
        tags: ["mobile-app", "development", "coding", "startup", "iOS", "android"],
        excerpt: "Ever wanted to create your own mobile app? This complete guide covers everything...",
        location: { address: { city: "Austin" } }
    },
    {
        title: "Cybersecurity Basics for Digital Nomads",
        content: "Working remotely while traveling the world? Protect your digital life with these essential cybersecurity practices. From VPN selection to secure Wi-Fi practices, learn how to keep your data safe while working from cafes, co-working spaces, and hotels around the globe. Includes recommendations for password managers, secure communication tools, and backup strategies.",
        category: "Technology",
        tags: ["cybersecurity", "digital-nomad", "VPN", "privacy", "remote-work"],
        excerpt: "Working remotely while traveling? Protect your digital life with these security practices...",
        location: { address: { city: "Portland" } }
    },

    // NEW ADDITIONAL POSTS - Sports Category
    {
        title: "Training for Your First Marathon: Week-by-Week Plan",
        content: "Ready to tackle 26.2 miles? This detailed 16-week marathon training plan is designed for beginners who want to cross the finish line strong. Learn about proper pacing, nutrition strategies, injury prevention, and mental preparation. Includes weekly mileage schedules, cross-training suggestions, and tips for race day success. Transform from a casual runner to a marathon finisher!",
        category: "Sports",
        tags: ["marathon", "running", "training", "fitness", "endurance"],
        excerpt: "Ready to tackle 26.2 miles? This 16-week marathon plan is perfect for beginners...",
        location: { address: { city: "Boston" } }
    },
    {
        title: "Beginner's Guide to Rock Climbing",
        content: "Discover the thrilling world of rock climbing with this comprehensive beginner's guide. From indoor gym basics to outdoor adventures, learn about essential gear, safety protocols, and fundamental techniques. Explore different climbing styles including bouldering, sport climbing, and traditional climbing. Includes tips for building strength, overcoming fear, and finding climbing communities near you.",
        category: "Sports",
        tags: ["rock-climbing", "adventure", "fitness", "outdoor", "beginner"],
        excerpt: "Discover the thrilling world of rock climbing with this comprehensive beginner's guide...",
        location: { address: { city: "Denver" } }
    },
    {
        title: "Home Yoga Practice: Creating Your Sacred Space",
        content: "Build a sustainable home yoga practice with this guide to creating your personal sanctuary. Learn how to design a peaceful yoga space, choose the right equipment, and establish a routine that fits your lifestyle. Includes beginner-friendly sequences for morning energizing, evening relaxation, and stress relief. Plus tips for staying motivated and tracking your progress.",
        category: "Sports",
        tags: ["yoga", "home-practice", "wellness", "meditation", "flexibility"],
        excerpt: "Build a sustainable home yoga practice with this guide to creating your sanctuary...",
        location: { address: { city: "Los Angeles" } }
    },

    // NEW ADDITIONAL POSTS - Music Category
    {
        title: "Learning Guitar as an Adult: It's Never Too Late",
        content: "Think you're too old to learn guitar? Think again! This encouraging guide shows how adults can successfully learn guitar, often faster than children. Discover effective practice techniques, choose the right instrument, and find learning resources that work for busy schedules. From acoustic fingerpicking to electric rock riffs, explore different guitar styles and find your musical voice.",
        category: "Music",
        tags: ["guitar", "music-learning", "adult-education", "practice", "hobby"],
        excerpt: "Think you're too old to learn guitar? This guide shows how adults can succeed...",
        location: { address: { city: "Nashville" } }
    },
    {
        title: "The Rise of Lo-Fi Hip Hop: Why Simple Beats Captivate Us",
        content: "Explore the cultural phenomenon of lo-fi hip hop and its impact on studying, working, and relaxation. This deep dive examines the genre's origins, key characteristics, and psychological effects. Learn about prominent lo-fi artists, production techniques, and how this seemingly simple music creates such powerful emotional responses. Perfect for music lovers and aspiring producers alike.",
        category: "Music",
        tags: ["lo-fi", "hip-hop", "music-production", "culture", "relaxation"],
        excerpt: "Explore the cultural phenomenon of lo-fi hip hop and its calming effects...",
        location: { address: { city: "Portland" } }
    },
    {
        title: "Building a Home Recording Studio on a Budget",
        content: "Create professional-quality recordings from your bedroom with this budget-friendly home studio guide. Learn about essential equipment, acoustic treatment, and software options that won't break the bank. From microphone selection to mixing basics, discover how to capture great sound in any space. Includes setup examples for different budgets and musical styles.",
        category: "Music",
        tags: ["recording", "home-studio", "budget", "equipment", "audio"],
        excerpt: "Create professional recordings from your bedroom with this budget studio guide...",
        location: { address: { city: "Austin" } }
    },

    // NEW ADDITIONAL POSTS - Art Category
    {
        title: "Watercolor Painting for Absolute Beginners",
        content: "Dive into the beautiful world of watercolor painting with this comprehensive beginner's guide. Learn about essential supplies, basic techniques, and common mistakes to avoid. From wet-on-wet washes to detailed brushwork, master the fundamentals that will set you up for success. Includes step-by-step tutorials for your first paintings and tips for developing your unique style.",
        category: "Art",
        tags: ["watercolor", "painting", "beginner", "art-tutorial", "creativity"],
        excerpt: "Dive into watercolor painting with this comprehensive guide for absolute beginners...",
        location: { address: { city: "Santa Fe" } }
    },
    {
        title: "Digital Art vs Traditional Art: Finding Your Medium",
        content: "Struggling to choose between digital and traditional art? This thoughtful comparison explores the benefits and challenges of each medium. Learn about the learning curves, cost considerations, and creative possibilities of both approaches. Whether you're drawn to the tactile nature of traditional media or the flexibility of digital tools, find the path that resonates with your artistic vision.",
        category: "Art",
        tags: ["digital-art", "traditional-art", "comparison", "medium", "creativity"],
        excerpt: "Struggling to choose between digital and traditional art? This comparison helps you decide...",
        location: { address: { city: "San Francisco" } }
    },
    {
        title: "Street Art History: From Graffiti to Gallery Walls",
        content: "Trace the evolution of street art from underground movement to mainstream recognition. This fascinating journey explores how graffiti transformed into a respected art form, examining key artists, techniques, and cultural impacts. From Banksy's political statements to community murals that revitalize neighborhoods, discover how street art continues to challenge and inspire.",
        category: "Art",
        tags: ["street-art", "graffiti", "art-history", "culture", "urban"],
        excerpt: "Trace the evolution of street art from underground movement to gallery recognition...",
        location: { address: { city: "New York" } }
    },

    // NEW ADDITIONAL POSTS - More Lifestyle Content
    {
        title: "The Art of Slow Living in a Fast-Paced World",
        content: "Discover how to embrace slow living principles without sacrificing productivity. This mindful approach to life emphasizes quality over quantity, intentionality over impulse. Learn practical strategies for slowing down your morning routine, savoring meals, and creating moments of peace throughout your day. Transform your relationship with time and rediscover life's simple pleasures.",
        category: "Lifestyle",
        tags: ["slow-living", "mindfulness", "wellness", "intentional", "peace"],
        excerpt: "Discover how to embrace slow living without sacrificing productivity in today's world...",
        location: { address: { city: "Portland" } }
    },
    {
        title: "Apartment Plants That Actually Survive in Low Light",
        content: "Transform your dark apartment into a green oasis with these practically indestructible plants. Perfect for renters and beginners, these low-light champions thrive in challenging conditions. Learn about proper watering, placement tips, and troubleshooting common problems. From snake plants to pothos, discover which plants will flourish in your space and improve your indoor air quality.",
        category: "Lifestyle",
        tags: ["plants", "apartment", "low-light", "indoor-gardening", "air-quality"],
        excerpt: "Transform your dark apartment into a green oasis with these low-light plants...",
        location: { address: { city: "Seattle" } }
    },
    {
        title: "Digital Detox: Reclaiming Your Mental Space",
        content: "Feeling overwhelmed by constant notifications and screen time? This practical digital detox guide helps you create healthy boundaries with technology. Learn about the psychological effects of digital overload, practical strategies for reducing screen time, and alternatives to mindless scrolling. Reclaim your attention, improve your sleep, and reconnect with the physical world around you.",
        category: "Lifestyle",
        tags: ["digital-detox", "mental-health", "technology", "mindfulness", "wellness"],
        excerpt: "Feeling overwhelmed by screens? This digital detox guide helps you reclaim mental space...",
        location: { address: { city: "Boulder" } }
    },

    // NEW ADDITIONAL POSTS - More Travel Content
    {
        title: "Solo Female Travel: Safety Tips and Confidence Building",
        content: "Explore the world confidently as a solo female traveler with these essential safety strategies and empowerment tips. From researching destinations to trusting your instincts, learn how to navigate new cultures while staying safe. Includes packing recommendations, accommodation advice, and ways to connect with other travelers. Your independence is your superpower - learn to use it wisely.",
        category: "Travel",
        tags: ["solo-travel", "female-travel", "safety", "empowerment", "independence"],
        excerpt: "Explore the world confidently as a solo female traveler with these safety strategies...",
        location: { address: { city: "Miami" } }
    },
    {
        title: "Backpacking Through Southeast Asia: A First-Timer's Guide",
        content: "Embark on the adventure of a lifetime with this comprehensive Southeast Asia backpacking guide. From visa requirements to cultural etiquette, learn everything you need for an amazing journey through Thailand, Vietnam, Cambodia, and beyond. Includes budget breakdowns, packing lists, and must-see destinations that will create memories to last a lifetime.",
        category: "Travel",
        tags: ["backpacking", "southeast-asia", "adventure", "budget-travel", "culture"],
        excerpt: "Embark on the adventure of a lifetime with this comprehensive Southeast Asia guide...",
        location: { address: { city: "Los Angeles" } }
    },
    {
        title: "City Breaks: 48 Hours in Barcelona",
        content: "Make the most of a short Barcelona getaway with this perfectly planned 48-hour itinerary. From Gaudí's architectural masterpieces to hidden tapas bars, experience the best of Catalonian culture in just two days. Includes transportation tips, restaurant recommendations, and insider secrets for avoiding tourist traps while maximizing your time in this vibrant city.",
        category: "Travel",
        tags: ["barcelona", "city-break", "48-hours", "architecture", "tapas"],
        excerpt: "Make the most of a short Barcelona getaway with this perfect 48-hour itinerary...",
        location: { address: { city: "San Diego" } }
    },

    // NEW ADDITIONAL POSTS - More Food Content
    {
        title: "Fermentation at Home: Kimchi, Kombucha, and Beyond",
        content: "Discover the ancient art of fermentation and its modern health benefits. This beginner-friendly guide covers everything from making your first batch of sauerkraut to brewing kombucha. Learn about the science behind fermentation, essential equipment, and troubleshooting common issues. Transform ordinary vegetables into probiotic powerhouses that support gut health and add complex flavors to your meals.",
        category: "Food",
        tags: ["fermentation", "probiotics", "kimchi", "kombucha", "gut-health"],
        excerpt: "Discover the ancient art of fermentation and its modern health benefits...",
        location: { address: { city: "Portland" } }
    },
    {
        title: "The Perfect Pizza Dough: Science Meets Simplicity",
        content: "Master the art of pizza making with this scientifically-backed approach to perfect dough. Understand how gluten development, hydration, and fermentation time affect your final product. From New York thin crust to Neapolitan classics, learn techniques that will make your homemade pizza rival your favorite pizzeria. Includes troubleshooting tips and topping combinations that actually work.",
        category: "Food",
        tags: ["pizza", "dough", "baking", "science", "homemade"],
        excerpt: "Master the art of pizza making with this scientific approach to perfect dough...",
        location: { address: { city: "Chicago" } }
    },
    {
        title: "Seasonal Eating: Spring's Freshest Flavors",
        content: "Celebrate spring's arrival with this guide to seasonal eating and fresh, local ingredients. Learn about spring vegetables like asparagus, artichokes, and peas, plus how to select and prepare them for maximum flavor. Includes farmers market shopping tips, storage advice, and recipes that showcase the season's best offerings. Eating seasonally supports local agriculture and ensures peak nutrition and taste.",
        category: "Food",
        tags: ["seasonal", "spring", "local", "farmers-market", "fresh"],
        excerpt: "Celebrate spring with this guide to seasonal eating and fresh, local ingredients...",
        location: { address: { city: "Sacramento" } }
    },

    // NEW ADDITIONAL POSTS - More Beauty Content
    {
        title: "Makeup Minimalism: The 5-Product Face",
        content: "Simplify your makeup routine without sacrificing style with this minimalist approach to beauty. Learn how to create polished, versatile looks using just five strategic products. Perfect for busy mornings, travel, or anyone wanting to streamline their beauty routine. Discover multi-purpose products, application techniques, and how to choose shades that work for any occasion.",
        category: "Beauty",
        tags: ["minimalist", "makeup", "simple", "multi-purpose", "routine"],
        excerpt: "Simplify your makeup routine with this minimalist approach to beauty...",
        location: { address: { city: "San Francisco" } }
    },
    {
        title: "Hair Care for Every Texture: Finding Your Perfect Routine",
        content: "Discover the science behind hair care and learn how to create a routine tailored to your specific hair texture and needs. From type 1 straight hair to type 4 coils, understand porosity, density, and curl patterns. This comprehensive guide covers product selection, styling techniques, and common mistakes to avoid for healthier, more manageable hair regardless of your texture.",
        category: "Beauty",
        tags: ["hair-care", "texture", "routine", "science", "natural"],
        excerpt: "Discover the science behind hair care and create a routine for your texture...",
        location: { address: { city: "Atlanta" } }
    },
    {
        title: "Aging Gracefully: Skincare Through the Decades",
        content: "Navigate the changing needs of your skin through different life stages with this comprehensive aging guide. Learn about prevention in your 20s, maintenance in your 30s, and restoration strategies for later decades. Understand how hormones, lifestyle, and genetics affect skin aging, plus evidence-based treatments that actually work. Beauty isn't about stopping time - it's about looking and feeling your best at every age.",
        category: "Beauty",
        tags: ["aging", "skincare", "prevention", "decades", "graceful"],
        excerpt: "Navigate your skin's changing needs through different life stages gracefully...",
        location: { address: { city: "Beverly Hills" } }
    },

    // NEW ADDITIONAL POSTS - More Fashion Content
    {
        title: "Capsule Wardrobe: 30 Pieces, Endless Possibilities",
        content: "Create a versatile, stylish wardrobe with just 30 carefully chosen pieces. This capsule wardrobe guide teaches you to identify your personal style, choose quality basics, and create countless outfit combinations. Learn about color coordination, fabric selection, and how to transition pieces from work to weekend. Minimize decision fatigue while maximizing style impact.",
        category: "Fashion",
        tags: ["capsule-wardrobe", "minimalist", "versatile", "quality", "style"],
        excerpt: "Create a versatile, stylish wardrobe with just 30 carefully chosen pieces...",
        location: { address: { city: "New York" } }
    },
    {
        title: "Sustainable Fashion: Building an Ethical Closet",
        content: "Transform your relationship with fashion through sustainable practices that benefit both you and the planet. Learn about ethical brands, fabric choices, and the true cost of fast fashion. Discover how to shop secondhand effectively, care for clothes to extend their life, and make mindful purchasing decisions. Fashion can be a force for good when we choose consciously.",
        category: "Fashion",
        tags: ["sustainable", "ethical", "conscious", "environment", "slow-fashion"],
        excerpt: "Transform your relationship with fashion through sustainable, ethical practices...",
        location: { address: { city: "Portland" } }
    },
    {
        title: "Dressing for Your Body Type: Confidence Through Fit",
        content: "Discover how proper fit and strategic styling can enhance your natural silhouette and boost your confidence. This inclusive guide celebrates all body types while teaching you to identify flattering cuts, proportions, and styling tricks. Learn about tailoring basics, shopping strategies, and how to adapt trends to work for your unique shape. When clothes fit well, you feel unstoppable.",
        category: "Fashion",
        tags: ["body-type", "fit", "confidence", "styling", "inclusive"],
        excerpt: "Discover how proper fit and styling can enhance your silhouette and confidence...",
        location: { address: { city: "Los Angeles" } }
    },

    // NEW ADDITIONAL POSTS - More Photography Content
    {
        title: "Portrait Photography: Capturing Authentic Emotions",
        content: "Master the art of portrait photography by learning to capture genuine emotion and connection. This comprehensive guide covers technical aspects like lighting and composition, but focuses on the human element that makes portraits truly compelling. Learn how to direct subjects naturally, create comfortable environments, and develop your unique photographic voice. Great portraits tell stories that resonate long after viewing.",
        category: "Photography",
        tags: ["portrait", "emotion", "lighting", "composition", "storytelling"],
        excerpt: "Master portrait photography by learning to capture genuine emotion and connection...",
        location: { address: { city: "San Francisco" } }
    },
    {
        title: "Mobile Photography: Pro Results with Your Phone",
        content: "Transform your smartphone into a powerful photography tool with these professional techniques and tips. Learn about composition rules, lighting principles, and editing apps that can create stunning results. From landscape photography to food styling, discover how to maximize your phone's camera capabilities and develop an eye for compelling images. Great photography is about vision, not just equipment.",
        category: "Photography",
        tags: ["mobile", "smartphone", "editing", "composition", "apps"],
        excerpt: "Transform your smartphone into a powerful photography tool with pro techniques...",
        location: { address: { city: "Austin" } }
    },
    {
        title: "Film Photography Renaissance: Why Analog is Back",
        content: "Explore the resurgence of film photography in our digital age and discover why photographers are returning to analog processes. Learn about different film types, developing basics, and the unique aesthetic qualities that digital can't replicate. This guide covers everything from camera selection to darkroom alternatives, helping you decide if film photography aligns with your creative vision.",
        category: "Photography",
        tags: ["film", "analog", "darkroom", "aesthetic", "renaissance"],
        excerpt: "Explore why film photography is experiencing a renaissance in our digital age...",
        location: { address: { city: "Brooklyn" } }
    }
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
        },
        {
            username: 'tech_tommy',
            email: 'tommy@momento.app',
            displayName: 'Tommy Chen',
            bio: 'Software developer and tech enthusiast',
            firstName: 'Tommy',
            lastName: 'Chen'
        },
        {
            username: 'fitness_anna',
            email: 'anna@momento.app',
            displayName: 'Anna Martinez',
            bio: 'Personal trainer and wellness coach',
            firstName: 'Anna',
            lastName: 'Martinez'
        },
        {
            username: 'music_maya',
            email: 'maya@momento.app',
            displayName: 'Maya Patel',
            bio: 'Musician and audio production specialist',
            firstName: 'Maya',
            lastName: 'Patel'
        },
        {
            username: 'artist_jade',
            email: 'jade@momento.app',
            displayName: 'Jade Thompson',
            bio: 'Visual artist and creative director',
            firstName: 'Jade',
            lastName: 'Thompson'
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
        console.log('Username: tech_tommy, Password: demo123');
        console.log('Username: fitness_anna, Password: demo123');
        console.log('Username: music_maya, Password: demo123');
        console.log('Username: artist_jade, Password: demo123');
        
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
