import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import SearchBar from '../components/SearchBar/searchBar';
import Navbar from '../components/NavBar/navBar';
import PostCard from '../components/PostCard/PostCard';
import InfiniteScroll from '../components/InfiniteScroll/InfiniteScroll';

/**
 * Home Page
 * 
 * Main landing page that displays a feed of posts based on user preferences.
 * Posts are loaded in batches as the user scrolls down the page.
 * Features a sidebar with navigation tabs and category filters.
 * Includes a grid-based post layout with interaction buttons.
 * Has a floating action button for creating new posts.
 * TODO: Can infinity see the posts.
 */
const Home = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('For You');
    const [activeCategory, setActiveCategory] = useState(null);
    
    // State for infinite scrolling
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    /**
     * Generate sample post data for demonstration purposes
     * In a real application, this would be replaced with API calls
     * 
     * @param {number} pageNumber - Page number to fetch
     * @param {number} limit - Number of posts per page
     * @returns {Array} Array of post objects
     */
    const generatePosts = (pageNumber, limit = 6) => {
        // Simulate API response time
        return new Promise((resolve) => {
            setTimeout(() => {
                // Create an array of posts for the current page
                const newPosts = Array.from({ length: limit }, (_, i) => {
                    const postId = (pageNumber - 1) * limit + i + 1;
                    
                    // Limit total posts to 30 for demonstration
                    if (postId > 30) {
                        return null;
                    }
                    
                    return {
                        id: postId,
                        title: `Post Title ${postId}`,
                        details: `This is the description for post number ${postId}. It contains some details about the post.`,
                        username: `User${Math.floor(Math.random() * 10) + 1}`,
                        thumbnail: null, // In a real app, this would be an image URL
                    };
                }).filter(Boolean); // Remove null entries (when postId > 30)
                
                resolve({
                    posts: newPosts,
                    hasMore: newPosts.length === limit && (pageNumber * limit) < 30
                });
            }, 800); // Simulate network delay
        });
    };
    
    /**
     * Load initial posts when the component mounts
     * or when activeTab or activeCategory changes
     */
    useEffect(() => {
        const loadInitialPosts = async () => {
            setIsLoading(true);
            const result = await generatePosts(1);
            setPosts(result.posts);
            setHasMore(result.hasMore);
            setPage(1);
            setIsLoading(false);
        };
        
        loadInitialPosts();
    }, [activeTab, activeCategory]);
    
    /**
     * Load more posts when the user scrolls to the bottom
     * This function is memoized with useCallback to prevent
     * unnecessary re-renders of the InfiniteScroll component
     */
    const loadMorePosts = useCallback(async () => {
        if (isLoading) return;
        
        setIsLoading(true);
        const nextPage = page + 1;
        
        try {
            const result = await generatePosts(nextPage);
            
            setPosts(prevPosts => [...prevPosts, ...result.posts]);
            setHasMore(result.hasMore);
            setPage(nextPage);
        } catch (error) {
            console.error('Error loading more posts:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, page]);
    
    /**
     * Handlers for user interactions
     */
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };
    
    const handleCategoryClick = (category) => {
        setActiveCategory(category);
    };
    
    const handleLike = (postId) => {
        console.log(`Liked post ${postId}`);
        // In the future, we would call an API to like the post
    };
    
    const handleComment = (postId) => {
        console.log(`Comment on post ${postId}`);
        // In the future, we will make this might open a comment modal or navigate to a comments page
    };
    
    const handleShare = (postId) => {
        console.log(`Share post ${postId}`);
        // In the future, we will let this to open a share dialog
    };
    
    const handleCreatePost = () => {
        navigate('/create-post');
    };
    
    return (
        <div className="home-main-container">
            {/* Navigation bar at the top */}
            <Navbar />

            {/* Main content area */}
            <div className="home-main-content">
                {/* Sidebar with discovery options and categories */}
                <div className="sidebar">
                    <div className="home-section">
                        <h3 className="home-section-title">Discover</h3>
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

                    {/* Categories section */}
                    <div className="home-section">
                        <h3 className="home-section-title">Categories</h3>
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
                
                {/* Feed section with posts */}
                <div className="feed">
                    <h2 className="feed-title">{activeTab}</h2>
                    
                    {/* Infinite scroll container */}
                    <InfiniteScroll
                        loadMore={loadMorePosts}
                        hasMore={hasMore}
                        isLoading={isLoading}
                        loader={<div className="posts-loader">Loading more posts...</div>}
                        endMessage={<p className="posts-end-message">You've seen all posts</p>}
                    >
                        <div className="post-grid">
                            {posts.map((post) => (
                                <div key={post.id} className="post-item">
                                    <div className="home-post-thumbnail"></div>
                                    <div className="home-post-content">
                                        <h3 className="home-post-title">{post.title}</h3>
                                        <p className="home-post-details">{post.details}</p>
                                        <div className="post-user">
                                            <div className="home-user-avatar"></div>
                                            <span className="home-username">{post.username}</span>
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
                    </InfiniteScroll>
                </div>
            </div>
            
            {/* Floating action button for creating new posts */}
            <button className="fab" onClick={handleCreatePost}>+</button>
        </div>
    );
};

export default Home;
