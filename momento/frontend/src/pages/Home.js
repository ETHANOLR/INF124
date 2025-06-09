// frontend/src/pages/Home.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import SearchBar from '../components/SearchBar/searchBar';
import Navbar from '../components/NavBar/navBar';
import PostCard from '../components/PostCard/PostCard';
import PostModal from '../components/PostModel/PostModel';
import InfiniteScroll from '../components/InfiniteScroll/InfiniteScroll';

/**
 * Configuration for API endpoints
 * This automatically detects if we're in development or production
 */
const API_CONFIG = {
    // Use environment variable if available, otherwise detect based on hostname
    BASE_URL: process.env.REACT_APP_API_URL || 
              (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:4000' 
                : 'https://api.momento.lifestyle'),
};

/**
 * API service for making HTTP requests to the backend
 */
const apiService = {
    async fetchPosts({ page = 1, limit = 10, category, sort = 'newest', search, following }) {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sort
            });

            // Add optional parameters if they exist
            if (category && category !== 'all') {
                queryParams.append('category', category);
            }
            if (search) {
                queryParams.append('search', search);
            }
            if (following) {
                queryParams.append('following', 'true');
            }

            const url = `${API_CONFIG.BASE_URL}/api/posts?${queryParams}`;
            console.log('Fetching posts from:', url); // Debug log
            
            const headers = {
                'Content-Type': 'application/json',
            };

            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }
    },

    /**
     * Follow or unfollow a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} API response
     */
    async toggleFollow(userId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const url = `${API_CONFIG.BASE_URL}/api/users/${userId}/follow`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error toggling follow:', error);
            throw error;
        }
    }
};

/**
 * Home Page
 * 
 * Main landing page that displays a feed of posts based on user preferences.
 * Posts are loaded in batches as the user scrolls down the page.
 * Features a sidebar with navigation tabs and category filters.
 * Uses PostCard component for consistent post display.
 * Has a floating action button for creating new posts.
 */
const Home = () => {
    const navigate = useNavigate();
    
    // UI state for tabs and filters
    const [activeTab, setActiveTab] = useState('For You');
    const [activeCategory, setActiveCategory] = useState('all');
    
    // Data state for posts and pagination
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    //For using Post Model;
    const [selectedPost, setSelectedPost] = useState(null);

    // 获取当前用户信息
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                setCurrentUser({ userId: tokenData.userId, username: tokenData.username });
            } catch (e) {
                console.error('Error parsing token:', e);
            }
        }
    }, []);

    /**
     * Map tab names to API sort parameters
     */
    const getTabSortMethod = (tab) => {
        switch (tab) {
            case 'For You':
                return 'newest';
            case 'Following':
                return 'newest'; // Could be modified to filter by followed users
            case 'Trending':
                return 'trending';
            default:
                return 'newest';
        }
    };

    /**
     * Load posts from the API
     */
    const loadPosts = useCallback(async (pageNumber = 1, reset = false) => {
        if (isLoading) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const requestParams = {
                page: pageNumber,
                limit: 10,
                category: activeCategory === 'all' ? null : activeCategory,
                sort: getTabSortMethod(activeTab)
            };

            // Add following filter for Following tab
            if (activeTab === 'Following') {
                requestParams.following = true;
            }

            const response = await apiService.fetchPosts(requestParams);

            const { posts: newPosts, pagination } = response;
            
            if (reset) {
                setPosts(newPosts);
            } else {
                setPosts(prevPosts => [...prevPosts, ...newPosts]);
            }
            
            setHasMore(pagination.hasNextPage);
            setPage(pageNumber);
            
        } catch (error) {
            console.error('Error loading posts:', error);
            setError('Failed to load posts. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, activeCategory, isLoading]);

    /**
     * Load initial posts when component mounts or filters change
     */
    useEffect(() => {
        loadPosts(1, true); // Reset posts and load first page
    }, [activeTab, activeCategory]);

    /**
     * Load more posts for infinite scrolling
     */
    const loadMorePosts = useCallback(async () => {
        if (hasMore && !isLoading) {
            await loadPosts(page + 1, false);
        }
    }, [hasMore, isLoading, page, loadPosts]);

    /**
     * Handle tab selection
     */
    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setPage(1);
        setError(null);
    };

    /**
     * Handle category selection
     */
    const handleCategoryClick = (category) => {
        setActiveCategory(category);
        setPage(1);
        setError(null);
    };

    /**
     * Handle follow button click
     */
    const handleFollow = async (e, userId) => {
        e.stopPropagation();
        
        if (!currentUser) {
            navigate('/login');
            return;
        }

        try {
            const result = await apiService.toggleFollow(userId);
            
            // Update the specific post's author in the state
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.author._id === userId 
                        ? { 
                            ...post, 
                            author: {
                                ...post.author,
                                isFollowedByUser: result.following,
                                followersCount: result.followersCount
                            }
                          }
                        : post
                )
            );
            
        } catch (error) {
            console.error('Error following user:', error);
            if (error.message.includes('Authentication required')) {
                navigate('/login');
            }
        }
    };

    /**
     * Handle create post button click
     */
    const handleCreatePost = () => {
        console.log('FAB clicked');
        const token = localStorage.getItem('token');
        if (!currentUser) {
            navigate('/login');
            return;
        }
        navigate('/create-post');
    };

    /**
     * Handle post clicked
     */
    const handlePostClick = (post) => {
        setSelectedPost(post);
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
                            className={`category ${activeCategory === 'all' ? 'active' : ''}`}
                            onClick={() => handleCategoryClick('all')}
                        >
                            All
                        </div>
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
                        <div 
                            className={`category ${activeCategory === 'Technology' ? 'active' : ''}`}
                            onClick={() => handleCategoryClick('Technology')}
                        >
                            Technology
                        </div>
                        <div 
                            className={`category ${activeCategory === 'Sports' ? 'active' : ''}`}
                            onClick={() => handleCategoryClick('Sports')}
                        >
                            Sports
                        </div>
                    </div>
                </div>
                
                {/* Feed section with posts */}
                <div className="feed">
                    <h2 className="feed-title">
                        {activeTab}
                        {activeCategory !== 'all' && ` - ${activeCategory}`}
                    </h2>
                    
                    {/* Error message */}
                    {error && (
                        <div className="error-message">
                            {error}
                            <button onClick={() => loadPosts(1, true)}>Try Again</button>
                        </div>
                    )}
                    
                    {/* Infinite scroll container */}
                    <InfiniteScroll
                        loadMore={loadMorePosts}
                        hasMore={hasMore}
                        isLoading={isLoading}
                        loader={<div className="posts-loader">Loading more posts...</div>}
                        endMessage={<p className="posts-end-message">You've seen all posts!</p>}
                    >
                        <div className="post-grid">
                            {posts.map((post) => (
                                <PostCard
                                    key={post._id || post.id}
                                    postData={post}
                                    currentUser={currentUser}
                                    onFollow={handleFollow}
                                    onClick={() => handlePostClick(post)}
                                />
                            ))}
                        </div>

                        {/* Show message when no posts are found */}
                        {!isLoading && posts.length === 0 && !error && (
                            <div className="no-posts-message">
                                <h3>No posts found</h3>
                                <p>Try adjusting your filters or search query.</p>
                            </div>
                        )}
                    </InfiniteScroll>
                </div>
            </div>
            {selectedPost && (
                <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
            )}

            {/* Floating action button for creating new posts */}
            <button className="fab" onClick={handleCreatePost}>+</button>
        </div>
    );
};

export default Home;
