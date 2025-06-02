import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';
import Navbar from '../components/NavBar/navBar';
import SearchBar from '../components/SearchBar/searchBar';
import CollectionCard from '../components/CollectionCard/CollectionCard';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Profile Page
 * 
 * Displays a user profile with their information, statistics, and posts.
 * Supports viewing both own profile and other users' profiles.
 * Includes real data integration with backend API.
 * Features follow/unfollow functionality and settings access.
 */
const Profile = () => {
    const navigate = useNavigate();
    const { username } = useParams(); // Get username from URL params
    const { currentUser, authToken, logout } = useContext(AuthContext);
    
    // State management
    const [activeTab, setActiveTab] = useState('Posts');
    const [profileUser, setProfileUser] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [posts, setPosts] = useState([]);
    const [collections, setCollections] = useState([]);
    
    // Check if viewing own profile
    const isOwnProfile = !username || (currentUser && username === currentUser.username);
    
    // Set up axios interceptor for authentication
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

    // Fetch user data on component mount
    useEffect(() => {
        if (isOwnProfile && currentUser) {
            // Use current user data for own profile
            setProfileUser(currentUser);
            setIsLoading(false);
        } else if (username) {
            // Fetch other user's data
            fetchUserProfile(username);
        } else {
            // No username and no current user - redirect to login
            navigate('/login');
        }
    }, [username, currentUser, isOwnProfile]);

    // Fetch posts when profile user changes
    useEffect(() => {
        if (profileUser) {
            fetchUserPosts();
            fetchUserCollections();
        }
    }, [profileUser]);

    // Fetch user profile data
    const fetchUserProfile = async (usernameParam) => {
        try {
            setIsLoading(true);
            setError('');

            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/profile/${usernameParam}`
            );

            const userData = response.data;
            setProfileUser(userData);

            // Check if current user is following this user
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

    // Check if current user follows this profile user
    const checkFollowStatus = async (userId) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/${userId}/follow-status`
            );
            setIsFollowing(response.data.isFollowing);
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    // Fetch user posts (placeholder for future implementation)
    const fetchUserPosts = async () => {
        try {
            // TODO: Implement posts API endpoint
            // For now, using mock data
            const mockPosts = [
                {
                    id: 1,
                    image: null,
                    caption: 'Beautiful sunset captured during my evening walk',
                    likes: 2500,
                    comments: 120,
                    createdAt: new Date()
                },
                {
                    id: 2,
                    image: null,
                    caption: 'Trying out a new recipe for homemade pasta',
                    likes: 1800,
                    comments: 85,
                    createdAt: new Date()
                },
                {
                    id: 3,
                    image: null,
                    caption: 'Weekend hiking adventure in the mountains',
                    likes: 3200,
                    comments: 145,
                    createdAt: new Date()
                }
            ];
            setPosts(mockPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    // Fetch user collections (placeholder for future implementation)
    const fetchUserCollections = async () => {
        try {
            // TODO: Implement collections API endpoint
            // For now, using mock data
            const mockCollections = [
                { id: 1, title: "Fashion Inspiration", posts: 32, isPrivate: false },
                { id: 2, title: "Travel Bucket List", posts: 24, isPrivate: false },
                { id: 3, title: "Healthy Recipes", posts: 45, isPrivate: false },
                { id: 4, title: "Home Decor Ideas", posts: 18, isPrivate: true },
                { id: 5, title: "Workout Routines", posts: 15, isPrivate: false },
                { id: 6, title: "Photography Tips", posts: 28, isPrivate: false },
                { id: 7, title: "Favorite Books", posts: 12, isPrivate: false },
            ];
            
            // Filter private collections if not own profile
            const filteredCollections = isOwnProfile 
                ? mockCollections 
                : mockCollections.filter(collection => !collection.isPrivate);
                
            setCollections(filteredCollections);
        } catch (error) {
            console.error('Error fetching collections:', error);
        }
    };
    
    // Format numbers over 1000 to K format (e.g., 1.2K)
    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };
    
    // Handle tab switching
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };
    
    // Handle follow/unfollow button click
    const handleFollowClick = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        try {
            const endpoint = isFollowing ? 'unfollow' : 'follow';
            await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/${profileUser.id}/${endpoint}`
            );

            setIsFollowing(!isFollowing);
            
            // Update follower count locally
            setProfileUser(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    followersCount: isFollowing 
                        ? prev.stats.followersCount - 1 
                        : prev.stats.followersCount + 1
                }
            }));

        } catch (error) {
            console.error('Error updating follow status:', error);
            
            if (error.response?.status === 401) {
                logout();
                navigate('/login');
            }
        }
    };
  
    // Handle message button click
    const handleMessageClick = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        
        // TODO: Implement messaging functionality
        // For now, navigate to chat page
        navigate('/chat', { 
            state: { 
                recipientUser: profileUser 
            } 
        });
    };
    
    // Navigate to settings (only for own profile)
    const handleSettingsClick = () => {
        navigate('/settings');
    };

    // Format join date
    const formatJoinDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
    };

    // Show loading state
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

    // Show error state
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

    // Show profile not found
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
            {/* Navigation bar */}
            <Navbar />
            
            {/* Profile content */}
            <div className="profile-content">
                {/* User info section */}
                <div className="profile-header">
                    {/* Settings button - only show for own profile */}
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

                        {/* Action buttons - only show for other users' profiles */}
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
                
                {/* Content tabs */}
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
                
                {/* Content area */}
                <div className="tab-content">
                    {/* Posts grid */}
                    {activeTab === 'Posts' && (
                        <div className="posts-grid">
                            {posts.length > 0 ? (
                                posts.map(post => (
                                    <div className="post-item" key={post.id}>
                                        <div className="post-image">
                                            {post.image ? (
                                                <img src={post.image} alt="Post" />
                                            ) : (
                                                <div className="post-placeholder">
                                                    📷
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="post-details">
                                            <p className="post-caption">{post.caption}</p>
                                            <div className="post-stats">
                                                <span>❤️ {formatNumber(post.likes)}</span>
                                                <span>💬 {formatNumber(post.comments)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
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

                    {/* Collections grid */}
                    {activeTab === 'Collections' && (
                        <div className="posts-grid">
                            {collections.length > 0 ? (
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
                                    <h3>No collections yet</h3>
                                    <p>
                                        {isOwnProfile 
                                            ? "Create your first collection!" 
                                            : "This user hasn't created any collections yet."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Liked posts - only for own profile */}
                    {activeTab === 'Liked' && isOwnProfile && (
                        <div className="posts-grid">
                            {posts.length > 0 ? (
                                posts.map(post => (
                                    <div className="post-item" key={`liked-${post.id}`}>
                                        <div className="post-image">
                                            <div className="post-placeholder">📷</div>
                                        </div>
                                        
                                        <div className="post-details">
                                            <p className="post-caption">{post.caption}</p>
                                            <div className="post-stats">
                                                <span>❤️ {formatNumber(Math.floor(Math.random() * 9000) + 1000)}</span>
                                                <span>💬 {formatNumber(Math.floor(Math.random() * 180) + 20)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <h3>No liked posts yet</h3>
                                    <p>Posts you like will appear here.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tagged posts - only for own profile */}
                    {activeTab === 'Tagged' && isOwnProfile && (
                        <div className="posts-grid">
                            {posts.length > 0 ? (
                                posts.map(post => (
                                    <div className="post-item" key={`tagged-${post.id}`}>
                                        <div className="post-image">
                                            <div className="post-placeholder">📷</div>
                                        </div>
                                        
                                        <div className="post-details">
                                            <p className="post-caption">{post.caption}</p>
                                            <div className="post-stats">
                                                <span>❤️ {formatNumber(Math.floor(Math.random() * 9000) + 1000)}</span>
                                                <span>💬 {formatNumber(Math.floor(Math.random() * 180) + 20)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <h3>No tagged posts yet</h3>
                                    <p>Posts you're tagged in will appear here.</p>
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
