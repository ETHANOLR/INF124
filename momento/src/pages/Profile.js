import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import Navbar from '../components/NavBar/navBar';
import SearchBar from '../components/SearchBar/searchBar';
import CollectionCard from '../components/CollectionCard/CollectionCard';

/**
 * Profile Page
 * 
 * Displays a user profile with their information, statistics, and posts.
 * Includes tabs for different types of content.
 */
const Profile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Posts');
    
    // Mock user data
    // TODO: We will add the real data in the future, and now it is just a example with defult data.
    const userData = {
        username: 'Username',
        bio: 'Bio description goes here. This is a short description about the user and what they\'re interested in sharing on this platform.',
        location: 'Location',
        joinDate: 'April 2025',
        stats: {
            posts: 254,
            followers: 1432,
            following: 385
        },
    isFollowing: false
    };

    // Mock posts data
    // TODO: Real data will add in the future
    const posts = [
    {
        id: 1,
        image: null, // Would be an image URL in the future
        caption: 'Post Caption',
        likes: 2500,
        comments: 120
    },
    {
        id: 2,
        image: null,
        caption: 'Post Caption',
        likes: 1800,
        comments: 85
    },
    {
        id: 3,
        image: null,
        caption: 'Post Caption',
        likes: 3200,
        comments: 145
    }
    ];

    // Mock collection data
    const collections = [
      { id: 1, title: "Fashion Inspiration", posts: 32 },
      { id: 2, title: "Travel Bucket List", posts: 24 },
      { id: 3, title: "Healthy Recipes", posts: 45 },
      { id: 4, title: "Home Decor Ideas", posts: 18 },
      { id: 5, title: "Workout Routines", posts: 15 },
      { id: 6, title: "Photography Tips", posts: 28 },
      { id: 7, title: "Favorite Books", posts: 12 },
    ];
    
    // Format numbers over 1000 to K format (e.g., 1.2K)
    const formatNumber = (num) => {
        return num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num;
    };
    
    // Handle tab switching
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };
    
    // Handle follow/unfollow button click
    const [isFollowing, setIsFollowing] = useState(userData.isFollowing);
    const handleFollowClick = () => {
        setIsFollowing(!isFollowing);
        // TODO: Maybe make an API call to follow/unfollow the user
    };
  
    // Handle message button click
    const handleMessageClick = () => {
        navigate('/chat'); // Navigate to chat page
        // TODO: Maybe will open a chat with this specific user
    };
  
    return (
        <div className="profile-container">
            {/* Navigation bar */}
            <Navbar />
            
            {/* Profile content */}
            <div className="profile-content">
                {/* User info section */}
                <div className="profile-header">
                    <div className="profile-avatar">
                        {/* Profile image would go here */}
                    </div>

                    <div className="profile-info">
                        <h1 className="profile-username">{userData.username}</h1>
                        <p className="profile-bio">{userData.bio}</p>
                    
                        <div className="profile-meta">
                            <span>{userData.location} • Joined {userData.joinDate}</span>
                        </div>
                        
                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">{userData.stats.posts}</span>
                                <span className="stat-label">Posts</span>
                            </div>

                            <div className="stat-item">
                                <span className="stat-value">{userData.stats.followers}</span>
                                <span className="stat-label">Followers</span>
                            </div>

                            <div className="stat-item">
                                <span className="stat-value">{userData.stats.following}</span>
                                <span className="stat-label">Following</span>
                            </div>
                        </div>

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
                    </div>
                </div>
                
                {/* Content tabs */}
                <div className="profile-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'Posts' ? 'active' : ''}`}
                        onClick={() => handleTabClick('Posts')}
                    >
                        Posts
                    </button>

                    <button 
                        className={`tab-button ${activeTab === 'Collections' ? 'active' : ''}`}
                        onClick={() => handleTabClick('Collections')}
                    >
                        Collections
                    </button>

                    <button 
                        className={`tab-button ${activeTab === 'Liked' ? 'active' : ''}`}
                        onClick={() => handleTabClick('Liked')}
                    >
                        Liked
                    </button>

                    <button 
                        className={`tab-button ${activeTab === 'Tagged' ? 'active' : ''}`}
                        onClick={() => handleTabClick('Tagged')}
                    >
                        Tagged
                    </button>
                </div>
                
                {/* Posts grid */}
                <div className="posts-grid">
                  {activeTab === 'Posts' && posts.map(post => (
                    <div className="post-item" key={post.id}>
                        <div className="post-image">
                            {/* Post image would go here */}
                        </div>
                        
                        <div className="post-details">
                            <p className="post-caption">{post.caption}</p>
                            <div className="post-stats">
                                <span>{formatNumber(post.likes)} likes • {post.comments} comments</span>
                            </div>
                        </div>
                    </div>
                  ))}

                  {activeTab === 'Collections' && collections.map(collection => (
                    <div className="post-item" key={collection.id}>
                      <CollectionCard title={collection.title} posts={collection.posts} />
                      
                    </div>
                  ))}

                  {/* Currently just using posts data for mock up */}
                  {activeTab === 'Liked' && posts.map(post => (
                    <div className="post-item" key={"LikedPost"+post.id}>
                      <div className="post-image">
                          {/* Post image would go here */}
                      </div>
                      
                      <div className="post-details">
                          <p className="post-caption">{post.caption}</p>
                          <div className="post-stats">
                              {/* Generate Random number for likes between 1 to 10 */}
                              {/* Generate Random number for comments between 20 to 200 */}
                              {/* To be subsitude by real data */}
                              <span>{formatNumber(Math.random() * 9 + 1).toFixed(1)} likes • {(Math.random() * 180 + 20).toFixed(0)} comments</span>
                          </div>
                      </div>
                  </div>
                  ))}

                  {/* Currently just using posts data for mock up */}
                  {activeTab === 'Tagged' && posts.map(post => (
                    <div className="post-item" key={"TaggedPost"+post.id}>
                      <div className="post-image">
                          {/* Post image would go here */}
                      </div>
                      
                      <div className="post-details">
                          <p className="post-caption">{post.caption}</p>
                          <div className="post-stats">
                            {/* Same as liked post */}
                            <span>{formatNumber(Math.random() * 9 + 1).toFixed(1)} likes • {(Math.random() * 180 + 20).toFixed(0)} comments</span>
                          </div>
                      </div>
                  </div>
                  ))}
                </div>
            </div>
        </div>
    );
};

export default Profile;
