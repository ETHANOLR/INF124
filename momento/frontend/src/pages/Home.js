// frontend/src/pages/Home.js - Improved Version

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import SearchBar from '../components/SearchBar/searchBar';
import Navbar from '../components/NavBar/navBar';
import PostCard from '../components/PostCard/PostCard';
import PostModal from '../components/PostModel/PostModel';
import InfiniteScroll from '../components/InfiniteScroll/InfiniteScroll';

/**
 * Configuration for API endpoints
 */
const API_CONFIG = {
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
            console.log('Fetching posts from:', url);
            
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
 * Home Page Component - Improved with better layout handling
 */
const Home = () => {
    const navigate = useNavigate();
    
    // UI state
    const [activeTab, setActiveTab] = useState('For You');
    const [activeCategory, setActiveCategory] = useState('all');
    
    // Data state
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);

    // Categories configuration
    const categories = useMemo(() => [
        'all', 'Fashion', 'Travel', 'Food', 'Beauty', 
        'Lifestyle', 'Technology', 'Sports'
    ], []);

    // Tabs configuration
    const tabs = useMemo(() => [
        'For You', 'Following', 'Trending'
    ], []);

    // Get current user info
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                setCurrentUser({ 
                    userId: tokenData.userId, 
                    username: tokenData.username 
                });
            } catch (e) {
                console.error('Error parsing token:', e);
                // Clear invalid token
                localStorage.removeItem('token');
            }
        }
    }, []);

    /**
     * Map tab names to API sort parameters
     */
    const getTabSortMethod = useCallback((tab) => {
        switch (tab) {
            case 'For You':
                return 'newest';
            case 'Following':
                return 'newest';
            case 'Trending':
                return 'trending';
            default:
                return 'newest';
        }
    }, []);

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
                limit: 12, // Increased for better grid layout
                category: activeCategory === 'all' ? null : activeCategory,
                sort: getTabSortMethod(activeTab)
            };

            if (activeTab === 'Following') {
                requestParams.following = true;
            }

            const response = await apiService.fetchPosts(requestParams);
            const { posts: newPosts, pagination } = response;
            
            if (reset) {
                setPosts(newPosts || []);
            } else {
                setPosts(prevPosts => [...prevPosts, ...(newPosts || [])]);
            }
            
            setHasMore(pagination?.hasNextPage || false);
            setPage(pageNumber);
            
        } catch (error) {
            console.error('Error loading posts:', error);
            setError('Failed to load posts. Please try again.');
            
            // If reset failed, ensure we don't leave empty state
            if (reset) {
                setPosts([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, activeCategory, isLoading, getTabSortMethod]);

    /**
     * Load initial posts when filters change
     */
    useEffect(() => {
        loadPosts(1, true);
    }, [activeTab, activeCategory, loadPosts]);

    /**
     * Load more posts for infinite scrolling
     */
    const loadMorePosts = useCallback(async () => {
        if (hasMore && !isLoading) {
            await loadPosts(page + 1, false);
        }
    }, [hasMore, isLoading, page, loadPosts]);

    /**
     * Handle tab selection with improved state management
     */
    const handleTabClick = useCallback((tab) => {
        if (tab === activeTab) return; // Prevent unnecessary re-renders
        
        setActiveTab(tab);
        setPage(1);
        setError(null);
        setHasMore(true);
    }, [activeTab]);

    /**
     * Handle category selection with improved state management
     */
    const handleCategoryClick = useCallback((category) => {
        if (category === activeCategory) return;
        
        setActiveCategory(category);
        setPage(1);
        setError(null);
        setHasMore(true);
    }, [activeCategory]);

    /**
     * Handle follow button click with optimistic updates
     */
    const handleFollow = useCallback(async (e, userId) => {
        e.stopPropagation();
        
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // Optimistic update
        setPosts(prevPosts => 
            prevPosts.map(post => {
                if (post.author._id === userId) {
                    const isCurrentlyFollowing = post.author.isFollowedByUser;
                    return {
                        ...post,
                        author: {
                            ...post.author,
                            isFollowedByUser: !isCurrentlyFollowing,
                            followersCount: post.author.followersCount + (isCurrentlyFollowing ? -1 : 1)
                        }
                    };
                }
                return post;
            })
        );

        try {
            const result = await apiService.toggleFollow(userId);
            
            // Update with actual result
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
            
            // Revert optimistic update on error
            setPosts(prevPosts => 
                prevPosts.map(post => {
                    if (post.author._id === userId) {
                        const isCurrentlyFollowing = post.author.isFollowedByUser;
                        return {
                            ...post,
                            author: {
                                ...post.author,
                                isFollowedByUser: !isCurrentlyFollowing,
                                followersCount: post.author.followersCount + (isCurrentlyFollowing ? -1 : 1)
                            }
                        };
                    }
                    return post;
                })
            );
            
            if (error.message.includes('Authentication required')) {
                navigate('/login');
            }
        }
    }, [currentUser, navigate]);

    /**
     * Handle create post button click
     */
    const handleCreatePost = useCallback(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        navigate('/create-post');
    }, [currentUser, navigate]);

    /**
     * Handle post click
     */
    const handlePostClick = useCallback((post) => {
        setSelectedPost(post);
    }, []);

    /**
     * Close post modal
     */
    const handleCloseModal = useCallback(() => {
        setSelectedPost(null);
    }, []);

    /**
     * Retry loading posts
     */
    const handleRetry = useCallback(() => {
        loadPosts(1, true);
    }, [loadPosts]);

    return (
        <div className="home-main-container">
            <Navbar />

            <div className="home-main-content">
                {/* Sidebar */}
                <div className="sidebar">
                    {/* Discover Section */}
                    <div className="home-section">
                        <h3 className="home-section-title">Discover</h3>
                        {tabs.map(tab => (
                            <div 
                                key={tab}
                                className={`tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => handleTabClick(tab)}
                            >
                                {tab}
                            </div>
                        ))}
                    </div>

                    {/* Categories Section */}
                    <div className="home-section">
                        <h3 className="home-section-title">Categories</h3>
                        {categories.map(category => (
                            <div 
                                key={category}
                                className={`category ${activeCategory === category ? 'active' : ''}`}
                                onClick={() => handleCategoryClick(category)}
                            >
                                {category === 'all' ? 'All' : category}
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Feed Section */}
                <div className="feed">
                    <h2 className="feed-title">
                        {activeTab}
                        {activeCategory !== 'all' && ` - ${activeCategory}`}
                    </h2>
                    
                    {/* Error message */}
                    {error && (
                        <div className="error-message">
                            {error}
                            <button onClick={handleRetry}>Try Again</button>
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
                            {posts.map((post, index) => (
                                <PostCard
                                    key={`${post._id || post.id}-${index}`}
                                    postData={post}
                                    currentUser={currentUser}
                                    onFollow={handleFollow}
                                    onClick={() => handlePostClick(post)}
                                />
                            ))}
                        </div>

                        {/* No posts message */}
                        {!isLoading && posts.length === 0 && !error && (
                            <div className="no-posts-message">
                                <h3>No posts found</h3>
                                <p>
                                    {activeTab === 'Following' 
                                        ? "You're not following anyone yet. Try exploring the 'For You' tab to find interesting users to follow."
                                        : "Try adjusting your filters or check back later for new content."
                                    }
                                </p>
                            </div>
                        )}
                    </InfiniteScroll>
                </div>
            </div>

            {/* Post Modal */}
            {selectedPost && (
                <PostModal 
                    post={selectedPost} 
                    onClose={handleCloseModal}
                    currentUser={currentUser}
                    onFollow={handleFollow}
                />
            )}

            {/* Floating Action Button */}
            <button className="fab" onClick={handleCreatePost} aria-label="Create new post">
                +
            </button>
        </div>
    );
};

export default Home;
