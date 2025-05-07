import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import SearchBar from '../components/SearchBar/searchBar';
import Navbar from '../components/NavBar/navBar';
import PostCard from '../components/PostCard/PostCard';

const Home = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('For You');
    const [activeCategory, setActiveCategory] = useState(null);

    // Sample post data
    const posts = [
    {
        id: 1,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null, // This place can add image paths
    },
    {
        id: 2,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null,
    },
    {
        id: 3,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null,
    },
    {
        id: 4,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null,
    },
    {
        id: 5,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null,
    },
    {
        id: 6,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null,
    }
    ];

    // Handler for tab clicks
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    // Handler for category clicks
    const handleCategoryClick = (category) => {
        setActiveCategory(category);
    };

    // Handler for post interactions
    const handleLike = (postId) => {
        console.log(`Liked post ${postId}`);
    };

    const handleComment = (postId) => {
        console.log(`Comment on post ${postId}`);
    };

    const handleShare = (postId) => {
        console.log(`Share post ${postId}`);
    };

    const handleCreatePost = () => {
        navigate('/create-post');
    };

    return (
        <div className="main-container">
        {/* Use the NavBar component instead of custom header */}
        <Navbar />

        {/* Main Content */}
        <div className="main-content">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="section">
                    <h3 className="section-title">Discover</h3>
                    <div 
                        className={`tab ${activeTab === 'For You' ? 'active' : ''}`}
                        onClick={() => handleTabClick('For You')}
                    >
                    For You
                    </div>
                    <div 
                        className={`tab ${activeTab === 'Following' ? 'active' : ''}`}
                        onClick={() => handleTabClick('Following')}
                    >
                    Following
                    </div>
                    <div 
                        className={`tab ${activeTab === 'Trending' ? 'active' : ''}`}
                        onClick={() => handleTabClick('Trending')}
                    >
                    Trending
                    </div>
                </div>

            <div className="section">
                <h3 className="section-title">Categories</h3>
                <div 
                    className={`category ${activeCategory === 'Fashion' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('Fashion')}
                >
                Fashion
                </div>
                <div 
                    className={`category ${activeCategory === 'Travel' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('Travel')}
                >
                Travel
                </div>
                <div 
                    className={`category ${activeCategory === 'Food' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('Food')}
                >
                Food
                </div>
                <div 
                    className={`category ${activeCategory === 'Beauty' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('Beauty')}
                >
                Beauty
                </div>
                <div 
                    className={`category ${activeCategory === 'Lifestyle' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('Lifestyle')}
                >
                Lifestyle
                </div>
            </div>
            </div>

        {/* Feed */}
        <div className="feed">
            <h2 className="feed-title">{activeTab}</h2>
            <div className="post-grid">
                {posts.map((post) => (
                <div key={post.id} className="post-item">
                    <div className="post-thumbnail"></div>
                    <div className="post-content">
                        <h3 className="post-title">{post.title}</h3>
                        <p className="post-details">{post.details}</p>
                        <div className="post-user">
                        <div className="user-avatar"></div>
                        <span className="username">{post.username}</span>
                        </div>
                        <div className="post-actions">
                            <button className="action-button" onClick={() => handleLike(post.id)}>Like</button>
                            <button className="action-button" onClick={() => handleComment(post.id)}>Comment</button>
                            <button className="action-button" onClick={() => handleShare(post.id)}>Share</button>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        </div>
    </div>

    {/* Floating Action Button */}
    <button className="fab" onClick={handleCreatePost}>+</button>
    </div>
  );
};

export default Home;
