import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';
import Navbar from '../components/NavBar/navBar';
import SearchBar from '../components/SearchBar/searchBar';
import CollectionCard from '../components/CollectionCard/CollectionCard';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Profile Page Component with Complete Liked Posts Functionality
 * 
 * Features:
 * - View user profiles (own and others)
 * - Display user posts with pagination
 * - Complete liked posts functionality with pagination
 * - Follow/unfollow functionality
 * - Real-time avatar synchronization
 * - Responsive design
 * - Error handling and loading states
 */
const Profile = () => {
    const navigate = useNavigate();
    const { username } = useParams();
    const { currentUser, authToken, logout, updateUser } = useContext(AuthContext);
    
    // Component state management
    const [activeTab, setActiveTab] = useState('Posts');
    const [profileUser, setProfileUser] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Content state for different tabs
    const [posts, setPosts] = useState([]);
    const [likedPosts, setLikedPosts] = useState([]);
    const [taggedPosts, setTaggedPosts] = useState([]);
    const [collections, setCollections] = useState([]);
    
    // Loading states for each tab
    const [postsLoading, setPostsLoading] = useState(false);
    const [likedLoading, setLikedLoading] = useState(false);
    const [taggedLoading, setTaggedLoading] = useState(false);
    const [collectionsLoading, setCollectionsLoading] = useState(false);
    
    // Pagination state for posts
    const [postsPage, setPostsPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    
    // Pagination state for liked posts
    const [likedPage, setLikedPage] = useState(1);
    const [hasMoreLikedPosts, setHasMoreLikedPosts] = useState(true);
    
    // UI state for liked posts
    const [likedPostsError, setLikedPostsError] = useState('');
    const [unlikingPosts, setUnlikingPosts] = useState(new Set()); // Track posts being unliked
    
    // Determine if this is the user's own profile
    const isOwnProfile = !username || (currentUser && username === currentUser.username);
    
    /**
     * Set up axios interceptor for automatic authentication
     */
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(
            (config) => {
                if (authToken) {
                    config.headers.Authorization = `Bearer ${authToken}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(interceptor);
        };
    }, [authToken]);

    /**
     * Main data fetching effect - Load profile user
     */
    useEffect(() => {
        if (isOwnProfile && currentUser) {
            setProfileUser(currentUser);
            setIsLoading(false);
        } else if (username) {
            fetchUserProfile(username);
        } else {
            navigate('/login');
        }
    }, [username, currentUser, isOwnProfile, navigate]);

    /**
     * Real-time avatar synchronization
     * Updates profile avatar when currentUser avatar changes
     */
    useEffect(() => {
        if (isOwnProfile && currentUser && profileUser) {
            const currentAvatarUrl = currentUser.profile?.profilePicture?.url;
            const profileAvatarUrl = profileUser.profile?.profilePicture?.url;
            
            if (currentAvatarUrl !== profileAvatarUrl) {
                console.log('Avatar change detected, updating profile');
                setProfileUser(currentUser);
            }
        }
    }, [currentUser?.profile?.profilePicture?.url, isOwnProfile, profileUser]);

    /**
     * Fetch content when profile user changes or tab changes
     */
    useEffect(() => {
        if (profileUser) {
            switch (activeTab) {
                case 'Posts':
                    fetchUserPosts(true);
                    break;
                case 'Collections':
                    fetchUserCollections();
                    break;
                case 'Liked':
                    if (isOwnProfile) {
                        fetchLikedPosts(true);
                    }
                    break;
                case 'Tagged':
                    if (isOwnProfile) fetchTaggedPosts();
                    break;
                default:
                    break;
            }
        }
    }, [profileUser, activeTab]);

    /**
     * Refresh current user data on component mount
     */
    useEffect(() => {
        if (isOwnProfile && authToken) {
            refreshCurrentUserData();
        }
    }, []);

    /**
     * Fetch user profile data from API by username
     */
    const fetchUserProfile = async (usernameParam) => {
        try {
            setIsLoading(true);
            setError('');

            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/profile/${usernameParam}`
            );

            const userData = response.data;
            setProfileUser(userData);

            if (currentUser && userData.id !== currentUser.id) {
                checkFollowStatus(userData.id);
            }

        } catch (error) {
            console.error('Error fetching user profile:', error);
            
            if (error.response?.status === 404) {
                setError('User not found');
            } else if (error.response?.status === 401) {
                logout();
                navigate('/login');
            } else {
                setError('Failed to load profile. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Refresh current user data from API
     */
    const refreshCurrentUserData = async () => {
        if (!isOwnProfile || !authToken) return;
        
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/auth/me`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                }
            );
            
            const userData = response.data;
            setProfileUser(userData);
            updateUser(userData);
            
        } catch (error) {
            console.error('Error refreshing user data:', error);
            if (error.response?.status === 401) {
                logout();
                navigate('/login');
            }
        }
    };

    /**
     * Check follow status for other users
     */
    const checkFollowStatus = async (userId) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/${userId}/follow-status`
            );
            setIsFollowing(response.data.following);
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    /**
     * Fetch user's posts from API with pagination
     */
    const fetchUserPosts = async (reset = false) => {
        try {
            setPostsLoading(true);
            
            const page = reset ? 1 : postsPage;
            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/posts`, {
                    params: {
                        author: profileUser.id,
                        page: page,
                        limit: 12,
                        sort: 'newest'
                    }
                }
            );

            const { posts: fetchedPosts, pagination } = response.data;
            
            if (reset) {
                setPosts(fetchedPosts);
                setPostsPage(1);
            } else {
                setPosts(prev => [...prev, ...fetchedPosts]);
            }
            
            setHasMorePosts(pagination.hasNextPage);
            setPostsPage(prev => reset ? 2 : prev + 1);

        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setPostsLoading(false);
        }
    };

    /**
     * Fetch user's liked posts with complete functionality
     * Enhanced with better error handling and user feedback
     */
    const fetchLikedPosts = async (reset = false) => {
        if (!isOwnProfile) return;
        
        try {
            setLikedLoading(true);
            setLikedPostsError(''); // Clear any previous errors
            
            const page = reset ? 1 : likedPage;
            const url = `${process.env.REACT_APP_API_BASE_URL}/api/users/me/liked-posts`;
            
            console.log('Fetching liked posts from:', url);
            console.log('Auth token exists:', !!authToken);
            console.log('Page:', page);
            
            const response = await axios.get(url, {
                params: {
                    page: page,
                    limit: 12,
                    sort: 'newest' // Can be 'newest', 'oldest', or 'popular'
                },
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const { posts: fetchedPosts, pagination } = response.data;
            
            if (reset) {
                setLikedPosts(fetchedPosts);
                setLikedPage(1);
            } else {
                setLikedPosts(prev => [...prev, ...fetchedPosts]);
            }
            
            setHasMoreLikedPosts(pagination.hasNextPage);
            setLikedPage(prev => reset ? 2 : prev + 1);

            console.log(`Fetched ${fetchedPosts.length} liked posts for page ${page}`);

        } catch (error) {
            console.error('Error fetching liked posts:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            
            if (error.response?.status === 401) {
                setLikedPostsError('Authentication expired. Please log in again.');
                logout();
                navigate('/login');
            } else if (error.response?.status === 404) {
                setLikedPostsError('Liked posts endpoint not found. Please check server configuration.');
                console.error('404 Error: Endpoint /api/users/me/liked-posts not found');
            } else {
                setLikedPostsError(`Failed to load liked posts: ${error.response?.data?.message || error.message}`);
                setLikedPosts([]);
            }
        } finally {
            setLikedLoading(false);
        }
    };

    /**
     * Fetch posts where user is tagged (only for own profile)
     */
    const fetchTaggedPosts = async () => {
        if (!isOwnProfile) return;
        
        try {
            setTaggedLoading(true);
        
            // TODO: Implement backend endpoint for tagged posts
            // const response = await axios.get(
            //     `${process.env.REACT_APP_API_BASE_URL}/api/users/me/tagged-posts`
            // );
            
            // For now, show empty state
            setTaggedPosts([]);
            
        } catch (error) {
            console.error('Error fetching tagged posts:', error);
            setTaggedPosts([]);
        } finally {
            setTaggedLoading(false);
        }
    };

    /**
     * Fetch user's collections
     */
    const fetchUserCollections = async () => {
        try {
            setCollectionsLoading(true);
            
            // TODO: Implement backend endpoint for collections
            // const response = await axios.get(
            //     `${process.env.REACT_APP_API_BASE_URL}/api/users/${profileUser.id}/collections`
            // );
            
            // For now, show empty state since collections aren't implemented in backend
            setCollections([]);
            
        } catch (error) {
            console.error('Error fetching collections:', error);
            setCollections([]);
        } finally {
            setCollectionsLoading(false);
        }
    };

    /**
     * Handle post click - navigate to full post view
     */
    const handlePostClick = (postId) => {
        navigate(`/posts/${postId}`);
    };

    /**
     * Handle post like/unlike for regular posts
     */
    const handlePostLike = async (postId, isLiked) => {
        try {
            await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}/api/posts/${postId}/like`
            );

            // Update the post in the local state
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? { 
                            ...post, 
                            isLikedByUser: !isLiked,
                            likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1
                        }
                        : post
                )
            );

        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    /**
     * Handle unlike from liked posts tab with enhanced UX
     * Provides immediate visual feedback and handles errors gracefully
     */
    const handleUnlikeFromLikedTab = async (postId) => {
        try {
            // Add to unliking set for UI feedback
            setUnlikingPosts(prev => new Set([...prev, postId]));

            await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}/api/posts/${postId}/like`
            );

            // Remove the post from liked posts list immediately
            setLikedPosts(prev => prev.filter(post => post.id !== postId));

            // Also update the main posts list if it contains this post
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? { 
                            ...post, 
                            isLikedByUser: false,
                            likesCount: Math.max(0, post.likesCount - 1)
                        }
                        : post
                )
            );

            console.log(`Successfully unliked post ${postId} from liked tab`);

        } catch (error) {
            console.error('Error unliking post from liked tab:', error);
            
            // Provide user feedback on error
            setLikedPostsError('Failed to unlike post. Please try again.');
            
            // Clear error after 3 seconds
            setTimeout(() => {
                setLikedPostsError('');
            }, 3000);
        } finally {
            // Remove from unliking set
            setUnlikingPosts(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
        }
    };

    /**
     * Load more posts when scrolling
     */
    const loadMorePosts = () => {
        if (!postsLoading && hasMorePosts) {
            fetchUserPosts(false);
        }
    };

    /**
     * Load more liked posts with enhanced functionality
     */
    const loadMoreLikedPosts = () => {
        if (!likedLoading && hasMoreLikedPosts) {
            fetchLikedPosts(false);
        }
    };

    /**
     * Refresh liked posts - useful for pull-to-refresh functionality
     */
    const refreshLikedPosts = () => {
        setLikedPostsError('');
        fetchLikedPosts(true);
    };

    /**
     * Format numbers with K/M suffixes
     */
    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num?.toString() || '0';
    };
    
    /**
     * Handle tab switching with state reset
     */
    const handleTabClick = (tab) => {
        setActiveTab(tab);
        
        // Clear errors when switching tabs
        if (tab === 'Liked') {
            setLikedPostsError('');
        }
    };
    
    /**
     * Handle follow/unfollow with optimistic updates
     */
    const handleFollowClick = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // Store previous states before try block for error recovery
        const previousFollowState = isFollowing;
        const previousFollowerCount = profileUser.stats.followersCount;

        try {
            // Optimistic update
            setIsFollowing(!isFollowing);
            setProfileUser(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    followersCount: isFollowing ? prev.stats.followersCount - 1 : prev.stats.followersCount + 1
                }
            }));

            const response = await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/${profileUser.id}/follow`
            );

            // Update with actual server response
            setIsFollowing(response.data.following);
            
            // Update follower count
            setProfileUser(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    followersCount: response.data.followersCount
                }
            }));

        } catch (error) {
            console.error('Error updating follow status:', error);
            
            // Revert optimistic update on error
            setIsFollowing(previousFollowState);
            setProfileUser(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    followersCount: previousFollowerCount
                }
            }));
            
            if (error.response?.status === 401) {
                logout();
                navigate('/login');
            }
        }
    };
  
    /**
     * Handle message button click
     */
    const handleMessageClick = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        
        navigate('/chat', { 
            state: { 
                recipientUser: profileUser 
            } 
        });
    };
    
    /**
     * Navigate to settings
     */
    const handleSettingsClick = () => {
        navigate('/settings');
    };

    /**
     * Format join date
     */
    const formatJoinDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
    };

    /**
     * Render post item with enhanced functionality
     * Supports both regular posts and posts from liked tab
     */
    const renderPost = (post, isFromLikedTab = false) => {
        const postId = post.id || post._id;
        const isUnliking = unlikingPosts.has(postId);
        
        return (
            <div 
                className={`post-item ${isUnliking ? 'post-unliking' : ''}`}
                key={postId} 
                onClick={() => handlePostClick(postId)}
                style={{ cursor: 'pointer', opacity: isUnliking ? 0.7 : 1 }}
            >
                <div className="post-image">
                    {post.media?.images?.length > 0 ? (
                        <img 
                            src={post.media.images[0].url} 
                            alt={post.media.images[0].altText || post.title}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : (
                        <div className="post-placeholder">
                            📝
                        </div>
                    )}
                </div>
                
                <div className="post-details">
                    <p className="post-caption">
                        {post.title || post.content?.substring(0, 100) + '...'}
                    </p>
                    <div className="post-stats">
                        <span 
                            className={post.isLikedByUser ? 'liked' : ''}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isFromLikedTab) {
                                    // Handle unlike from liked tab
                                    handleUnlikeFromLikedTab(postId);
                                } else {
                                    // Handle normal like/unlike
                                    handlePostLike(postId, post.isLikedByUser);
                                }
                            }}
                            style={{ 
                                cursor: isUnliking ? 'not-allowed' : 'pointer',
                                opacity: isUnliking ? 0.5 : 1
                            }}
                        >
                            {isUnliking ? '⏳' : (post.isLikedByUser ? '❤️' : '🤍')} {formatNumber(post.likesCount || 0)}
                        </span>
                        <span>💬 {formatNumber(post.commentsCount || 0)}</span>
                        <span>👁️ {formatNumber(post.analytics?.views || 0)}</span>
                    </div>
                    <div className="post-meta">
                        <span className="post-category">{post.category}</span>
                        <span className="post-date">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Render liked posts tab with enhanced UI and error handling
     */
    const renderLikedPostsTab = () => {
        return (
            <div className="posts-grid">
                {/* Error message */}
                {likedPostsError && (
                    <div className="error-message" style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '20px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '8px',
                        color: '#d00',
                        marginBottom: '20px'
                    }}>
                        <p>{likedPostsError}</p>
                        <button 
                            onClick={refreshLikedPosts}
                            style={{
                                marginTop: '10px',
                                padding: '8px 16px',
                                backgroundColor: '#ff6f61',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {likedPosts.length > 0 ? (
                    <>
                        {likedPosts.map(post => renderPost(post, true))}
                        
                        {/* Loading indicator for more posts */}
                        {likedLoading && (
                            <div className="loading-more">
                                <div className="loading-spinner"></div>
                                <p>Loading more liked posts...</p>
                            </div>
                        )}
                        
                        {/* Load more button */}
                        {hasMoreLikedPosts && !likedLoading && (
                            <button 
                                className="load-more-button"
                                onClick={loadMoreLikedPosts}
                            >
                                Load More Liked Posts
                            </button>
                        )}
                        
                        {/* End of posts message */}
                        {!hasMoreLikedPosts && !likedLoading && likedPosts.length > 0 && (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: '20px',
                                color: '#666',
                                fontStyle: 'italic'
                            }}>
                                You've reached the end of your liked posts
                            </div>
                        )}
                    </>
                ) : likedLoading ? (
                    <div className="empty-state">
                        <div className="loading-spinner"></div>
                        <p>Loading your liked posts...</p>
                    </div>
                ) : (
                    <div className="empty-state">
                        <h3>No liked posts yet</h3>
                        <p>Posts you like will appear here. Start exploring and liking posts!</p>
                        <button 
                            onClick={() => navigate('/home')}
                            style={{
                                marginTop: '15px',
                                padding: '12px 24px',
                                backgroundColor: '#ff6f61',
                                color: 'white',
                                border: 'none',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Explore Posts
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="profile-container">
                <Navbar />
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="profile-container">
                <Navbar />
                <div className="profile-error">
                    <h2>Oops!</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/home')}>
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Profile not found
    if (!profileUser) {
        return (
            <div className="profile-container">
                <Navbar />
                <div className="profile-error">
                    <h2>Profile Not Found</h2>
                    <p>The user you're looking for doesn't exist.</p>
                    <button onClick={() => navigate('/home')}>
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }
  
    return (
        <div className="profile-container">
            <Navbar />
            
            <div className="profile-content">
                {/* Profile Header */}
                <div className="profile-header">
                    {isOwnProfile && (
                        <button className="settings-button" onClick={handleSettingsClick}>
                            ⚙️ Settings
                        </button>
                    )}
                    
                    <div className="profile-avatar">
                        {profileUser.profile?.profilePicture?.url ? (
                            <img 
                                src={profileUser.profile.profilePicture.url} 
                                alt={`${profileUser.username}'s profile`}
                                className="avatar-image"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                {profileUser.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="profile-info">
                        <div className="profile-name-container">
                            <h1 className="profile-username">{profileUser.username}</h1>
                            {profileUser.account?.isVerified && (
                                <span className="verified-badge">✓</span>
                            )}
                        </div>
                        
                        {profileUser.profile?.displayName && (
                            <h2 className="profile-display-name">
                                {profileUser.profile.displayName}
                            </h2>
                        )}
                        
                        {profileUser.profile?.bio && (
                            <p className="profile-bio">{profileUser.profile.bio}</p>
                        )}
                    
                        <div className="profile-meta">
                            {profileUser.profile?.location && (
                                <span>📍 {profileUser.profile.location}</span>
                            )}
                            {profileUser.profile?.location && profileUser.createdAt && (
                                <span> • </span>
                            )}
                            {profileUser.createdAt && (
                                <span>📅 Joined {formatJoinDate(profileUser.createdAt)}</span>
                            )}
                            {profileUser.profile?.website && (
                                <>
                                    <span> • </span>
                                    <a 
                                        href={profileUser.profile.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="profile-website"
                                    >
                                        🔗 Website
                                    </a>
                                </>
                            )}
                        </div>
                        
                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">
                                    {formatNumber(profileUser.stats?.postsCount || 0)}
                                </span>
                                <span className="stat-label">Posts</span>
                            </div>

                            <div className="stat-item">
                                <span className="stat-value">
                                    {formatNumber(profileUser.stats?.followersCount || 0)}
                                </span>
                                <span className="stat-label">Followers</span>
                            </div>

                            <div className="stat-item">
                                <span className="stat-value">
                                    {formatNumber(profileUser.stats?.followingCount || 0)}
                                </span>
                                <span className="stat-label">Following</span>
                            </div>
                        </div>

                        {!isOwnProfile && currentUser && (
                            <div className="profile-actions">
                                <button 
                                    className={`follow-button ${isFollowing ? 'following' : ''}`}
                                    onClick={handleFollowClick}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            
                                <button className="message-button" onClick={handleMessageClick}>
                                    Message
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Content Tabs */}
                <div className="profile-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'Posts' ? 'active' : ''}`}
                        onClick={() => handleTabClick('Posts')}
                    >
                        <span className="tab-icon">📝</span>
                        Posts
                    </button>

                    <button 
                        className={`tab-button ${activeTab === 'Collections' ? 'active' : ''}`}
                        onClick={() => handleTabClick('Collections')}
                    >
                        <span className="tab-icon">📚</span>
                        Collections
                    </button>

                    {isOwnProfile && (
                        <>
                            <button 
                                className={`tab-button ${activeTab === 'Liked' ? 'active' : ''}`}
                                onClick={() => handleTabClick('Liked')}
                            >
                                <span className="tab-icon">❤️</span>
                                Liked
                            </button>

                            <button 
                                className={`tab-button ${activeTab === 'Tagged' ? 'active' : ''}`}
                                onClick={() => handleTabClick('Tagged')}
                            >
                                <span className="tab-icon">🏷️</span>
                                Tagged
                            </button>
                        </>
                    )}
                </div>
                
                {/* Tab Content */}
                <div className="tab-content">
                    {/* Posts Tab */}
                    {activeTab === 'Posts' && (
                        <div className="posts-grid">
                            {posts.length > 0 ? (
                                <>
                                    {posts.map(post => renderPost(post, false))}
                                    {postsLoading && (
                                        <div className="loading-more">
                                            <div className="loading-spinner"></div>
                                        </div>
                                    )}
                                    {hasMorePosts && !postsLoading && (
                                        <button 
                                            className="load-more-button"
                                            onClick={loadMorePosts}
                                        >
                                            Load More Posts
                                        </button>
                                    )}
                                </>
                            ) : postsLoading ? (
                                <div className="empty-state">
                                    <div className="loading-spinner"></div>
                                    <p>Loading posts...</p>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <h3>No posts yet</h3>
                                    <p>
                                        {isOwnProfile 
                                            ? "Share your first moment!" 
                                            : "This user hasn't posted anything yet."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Collections Tab */}
                    {activeTab === 'Collections' && (
                        <div className="posts-grid">
                            {collectionsLoading ? (
                                <div className="empty-state">
                                    <div className="loading-spinner"></div>
                                    <p>Loading collections...</p>
                                </div>
                            ) : collections.length > 0 ? (
                                collections.map(collection => (
                                    <div className="post-item" key={collection.id}>
                                        <CollectionCard 
                                            title={collection.title} 
                                            posts={collection.posts}
                                            isPrivate={collection.isPrivate}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <h3>Collections feature coming soon</h3>
                                    <p>
                                        {isOwnProfile 
                                            ? "Collections will allow you to organize your favorite posts into themed groups."
                                            : "This user will be able to create collections soon."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Enhanced Liked Posts Tab */}
                    {activeTab === 'Liked' && isOwnProfile && renderLikedPostsTab()}

                    {/* Tagged Posts Tab */}
                    {activeTab === 'Tagged' && isOwnProfile && (
                        <div className="posts-grid">
                            {taggedLoading ? (
                                <div className="empty-state">
                                    <div className="loading-spinner"></div>
                                    <p>Loading tagged posts...</p>
                                </div>
                            ) : taggedPosts.length > 0 ? (
                                taggedPosts.map(post => renderPost(post, false))
                            ) : (
                                <div className="empty-state">
                                    <h3>Tagged posts feature coming soon</h3>
                                    <p>Posts you're tagged in will appear here once this feature is fully implemented.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
