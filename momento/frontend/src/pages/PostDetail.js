// frontend/src/pages/PostDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navbar from '../components/NavBar/navBar';
import './PostDetail.css';

/**
 * API Configuration
 */
const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_URL || 
              (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:4000' 
                : 'https://api.momento.lifestyle'),
};

/**
 * API Services
 */
const apiService = {
    // Get details of a single post
    async fetchPost(postId) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${postId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching post:', error);
            throw error;
        }
    },

    // Toggle like status
    async toggleLike(postId, authToken) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    },

    // Add Comment
    async addComment(postId, content, authToken) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    },

    // Share Post
    async sharePost(postId, authToken, shareType = 'repost') {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${postId}/share`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ shareType }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error sharing post:', error);
            throw error;
        }
    },

    // Follow/Unfollow Users
    async toggleFollow(userId, authToken) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/${userId}/follow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
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
 * Post details page component
 */
const PostDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    
    // Use AuthContext for consistent user state management
    const { currentUser, authToken, logout } = useContext(AuthContext);
    
    // State management
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Loading post details
    useEffect(() => {
        const loadPost = async () => {
            try {
                setLoading(true);
                const postData = await apiService.fetchPost(postId);
                setPost(postData);
            } catch (err) {
                setError('Failed to load post');
                console.error('Error loading post:', err);
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            loadPost();
        }
    }, [postId]);

    // Processing Likes
    const handleLike = async () => {
        if (!currentUser || !authToken) {
            navigate('/login');
            return;
        }

        try {
            const result = await apiService.toggleLike(post._id, authToken);
            setPost(prevPost => ({
                ...prevPost,
                likesCount: result.likesCount,
                isLikedByUser: result.liked
            }));
        } catch (error) {
            console.error('Error liking post:', error);
            // If authentication error, logout and redirect
            if (error.message.includes('401') || error.message.includes('403')) {
                logout();
                navigate('/login');
            }
        }
    };

    // Handling Comment Submissions
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        
        if (!currentUser || !authToken) {
            navigate('/login');
            return;
        }

        if (!newComment.trim()) {
            return;
        }

        try {
            setIsSubmittingComment(true);
            const result = await apiService.addComment(post._id, newComment.trim(), authToken);
            
            // Update post status
            setPost(prevPost => ({
                ...prevPost,
                engagement: {
                    ...prevPost.engagement,
                    comments: [...(prevPost.engagement.comments || []), result.comment]
                },
                commentsCount: result.commentsCount
            }));
            
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            // If authentication error, logout and redirect
            if (error.message.includes('401') || error.message.includes('403')) {
                logout();
                navigate('/login');
            }
        } finally {
            setIsSubmittingComment(false);
        }
    };

    // Processing Sharing
    const handleShare = async () => {
        if (!currentUser || !authToken) {
            navigate('/login');
            return;
        }

        try {
            const result = await apiService.sharePost(post._id, authToken);
            setPost(prevPost => ({
                ...prevPost,
                sharesCount: result.sharesCount
            }));
            
            // Can add tips for sharing success
            alert('Post shared successfully!');
        } catch (error) {
            console.error('Error sharing post:', error);
            // If authentication error, logout and redirect
            if (error.message.includes('401') || error.message.includes('403')) {
                logout();
                navigate('/login');
            }
        }
    };

    // Handling follow/unfollow
    const handleFollow = async () => {
        if (!currentUser || !authToken) {
            navigate('/login');
            return;
        }

        try {
            const result = await apiService.toggleFollow(post.author._id, authToken);
            setPost(prevPost => ({
                ...prevPost,
                author: {
                    ...prevPost.author,
                    isFollowedByUser: result.following
                }
            }));
        } catch (error) {
            console.error('Error following user:', error);
            // If authentication error, logout and redirect
            if (error.message.includes('401') || error.message.includes('403')) {
                logout();
                navigate('/login');
            }
        }
    };

    // Formatting Dates
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Formatting comment dates
    const formatCommentDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    if (loading) {
        return (
            <div className="post-detail-container">
                <Navbar />
                <div className="post-detail-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading post...</p>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="post-detail-container">
                <Navbar />
                <div className="post-detail-error">
                    <h2>Post not found</h2>
                    <p>{error || 'The post you are looking for does not exist.'}</p>
                    <button onClick={() => navigate('/')} className="back-home-btn">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="post-detail-container">
            <Navbar />
            
            <div className="post-detail-content">
                <div className="post-detail-main">
                    {/* Back button */}
                    <button className="back-btn" onClick={() => navigate('/')}>
                        ← Back to Home
                    </button>

                    {/* Post content */}
                    <article className="post-detail-article">
                        {/* Post header information */}
                        <header className="post-header">
                            <div className="post-meta">
                                <span className="post-category">{post.category}</span>
                                <span className="post-date">{formatDate(post.createdAt)}</span>
                            </div>
                            <h1 className="post-title">{post.title}</h1>
                        </header>

                        {/* Author Information */}
                        <div className="post-author">
                            <div className="author-info">
                                <div className="author-avatar">
                                    {post.author?.profile?.profilePicture?.url ? (
                                        <img 
                                            src={post.author.profile.profilePicture.url}
                                            alt={post.author.username}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {post.author?.username?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="author-details">
                                    <h3 className="author-name">
                                        {post.author?.profile?.displayName || post.author?.username}
                                    </h3>
                                    <p className="author-username">@{post.author?.username}</p>
                                </div>
                            </div>
                            
                            {/* Follow button */}
                            {currentUser && currentUser.id !== post.author._id && (
                                <button 
                                    className={`follow-btn ${post.author.isFollowedByUser ? 'following' : ''}`}
                                    onClick={handleFollow}
                                >
                                    {post.author.isFollowedByUser ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>

                        {/* Post Media Content */}
                        {post.media?.images?.length > 0 && (
                            <div className="post-media">
                                {post.media.images.map((image, index) => (
                                    <div key={index} className="post-image">
                                        <img 
                                            src={image.url} 
                                            alt={image.altText || `Image ${index + 1}`}
                                        />
                                        {image.caption && (
                                            <p className="image-caption">{image.caption}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Post body */}
                        <div className="post-content">
                            <p>{post.content}</p>
                        </div>

                        {/* Post Statistics */}
                        <div className="post-stats">
                            <span>{post.analytics?.views || 0} views</span>
                            <span>{post.likesCount || 0} likes</span>
                            <span>{post.commentsCount || 0} comments</span>
                            <span>{post.sharesCount || 0} shares</span>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="post-actions">
                            <button 
                                className={`action-btn like-btn ${post.isLikedByUser ? 'liked' : ''}`}
                                onClick={handleLike}
                            >
                                <span className="action-icon">
                                    {post.isLikedByUser ? '❤️' : '🤍'}
                                </span>
                                <span>Like ({post.likesCount || 0})</span>
                            </button>
                            
                            <button className="action-btn comment-btn">
                                <span className="action-icon">💬</span>
                                <span>Comment ({post.commentsCount || 0})</span>
                            </button>
                            
                            <button className="action-btn share-btn" onClick={handleShare}>
                                <span className="action-icon">📤</span>
                                <span>Share ({post.sharesCount || 0})</span>
                            </button>
                        </div>
                    </article>

                    {/* Comment Area */}
                    <section className="comments-section">
                        <h3 className="comments-title">
                            Comments ({post.commentsCount || 0})
                        </h3>

                        {/* Add a comment form */}
                        {currentUser && authToken ? (
                            <form className="comment-form" onSubmit={handleCommentSubmit}>
                                <div className="comment-input-container">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="comment-input"
                                        rows="3"
                                    />
                                    <button 
                                        type="submit" 
                                        className="comment-submit-btn"
                                        disabled={!newComment.trim() || isSubmittingComment}
                                    >
                                        {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="login-prompt">
                                <p>Please <button onClick={() => navigate('/login')} className="login-link">login</button> to comment</p>
                            </div>
                        )}

                        {/* Comments list */}
                        <div className="comments-list">
                            {post.engagement?.comments?.map((comment) => (
                                <div key={comment._id} className="comment-item">
                                    <div className="comment-header">
                                        <div className="comment-author">
                                            <div className="comment-avatar">
                                                {comment.user?.profile?.profilePicture?.url ? (
                                                    <img 
                                                        src={comment.user.profile.profilePicture.url}
                                                        alt={comment.user.username}
                                                    />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {comment.user?.username?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="comment-meta">
                                                <span className="comment-username">
                                                    {comment.user?.profile?.displayName || comment.user?.username}
                                                </span>
                                                <span className="comment-date">
                                                    {formatCommentDate(comment.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="comment-content">
                                        <p>{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                            
                            {(!post.engagement?.comments || post.engagement.comments.length === 0) && (
                                <div className="no-comments">
                                    <p>No comments yet. Be the first to comment!</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
