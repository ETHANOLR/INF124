// frontend/src/pages/PostDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navbar from '../components/NavBar/navBar';
import ShareModal from '../components/ShareModal/ShareModal';
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
    
    // Image gallery state
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    
    // Share modal state
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    // Loading post details
    useEffect(() => {
        const loadPost = async () => {
            try {
                setLoading(true);
                const postData = await apiService.fetchPost(postId);
                console.log('Loaded post data:', postData); // Debug log
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

    // Image modal handlers
    const openImageModal = (index) => {
        setSelectedImageIndex(index);
        setShowImageModal(true);
        document.body.style.overflow = 'hidden';
    };

    const closeImageModal = () => {
        setShowImageModal(false);
        document.body.style.overflow = 'unset';
    };

    const nextImage = () => {
        const images = post.media?.images || [];
        setSelectedImageIndex((prev) => 
            prev === images.length - 1 ? 0 : prev + 1
        );
    };

    const prevImage = () => {
        const images = post.media?.images || [];
        setSelectedImageIndex((prev) => 
            prev === 0 ? images.length - 1 : prev - 1
        );
    };

    // Handle keyboard navigation in modal
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!showImageModal) return;
            
            if (e.key === 'Escape') {
                closeImageModal();
            } else if (e.key === 'ArrowLeft') {
                prevImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showImageModal, post]);

    // Render image gallery based on number of images
    const renderImageGallery = () => {
        const images = post.media?.images || [];
        
        if (images.length === 0) return null;

        if (images.length === 1) {
            return (
                <div className="post-media single-image">
                    <div className="image-container" onClick={() => openImageModal(0)}>
                        <img 
                            src={images[0].url} 
                            alt={images[0].altText || post.title}
                        />
                        <div className="image-overlay">
                            <span>Click to view full size</span>
                        </div>
                    </div>
                    {images[0].caption && (
                        <p className="image-caption">{images[0].caption}</p>
                    )}
                </div>
            );
        }

        if (images.length === 2) {
            return (
                <div className="post-media two-images">
                    <div className="images-grid grid-2">
                        {images.map((image, index) => (
                            <div 
                                key={index} 
                                className="image-container"
                                onClick={() => openImageModal(index)}
                            >
                                <img 
                                    src={image.url} 
                                    alt={image.altText || `Image ${index + 1}`}
                                />
                                <div className="image-overlay">
                                    <span>{index + 1} / {images.length}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (images.length === 3) {
            return (
                <div className="post-media three-images">
                    <div className="images-grid grid-3">
                        <div 
                            className="image-container large"
                            onClick={() => openImageModal(0)}
                        >
                            <img 
                                src={images[0].url} 
                                alt={images[0].altText || 'Image 1'}
                            />
                            <div className="image-overlay">
                                <span>1 / {images.length}</span>
                            </div>
                        </div>
                        <div className="small-images">
                            {images.slice(1, 3).map((image, index) => (
                                <div 
                                    key={index + 1} 
                                    className="image-container small"
                                    onClick={() => openImageModal(index + 1)}
                                >
                                    <img 
                                        src={image.url} 
                                        alt={image.altText || `Image ${index + 2}`}
                                    />
                                    <div className="image-overlay">
                                        <span>{index + 2} / {images.length}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // 4 or more images
        return (
            <div className="post-media multiple-images">
                <div className="images-grid grid-4">
                    {images.slice(0, 3).map((image, index) => (
                        <div 
                            key={index} 
                            className="image-container"
                            onClick={() => openImageModal(index)}
                        >
                            <img 
                                src={image.url} 
                                alt={image.altText || `Image ${index + 1}`}
                            />
                            <div className="image-overlay">
                                <span>{index + 1} / {images.length}</span>
                            </div>
                        </div>
                    ))}
                    <div 
                        className="image-container more-images"
                        onClick={() => openImageModal(3)}
                    >
                        <img 
                            src={images[3].url} 
                            alt={images[3].altText || 'Image 4'}
                        />
                        <div className="image-overlay more-overlay">
                            <span>+{images.length - 3}</span>
                            <span className="view-all">View all {images.length} photos</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Handle likes
    const handleLike = async () => {
        if (!currentUser || !authToken) {
            navigate('/login');
            return;
        }

        if (!post?.id) {
            console.error('Post ID is missing');
            return;
        }

        try {
            const result = await apiService.toggleLike(post.id, authToken);
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

    // Handle comment submissions
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        
        if (!currentUser || !authToken) {
            navigate('/login');
            return;
        }

        if (!newComment.trim()) {
            return;
        }

        if (!post?.id) {
            console.error('Post ID is missing for comment submission');
            return;
        }

        try {
            setIsSubmittingComment(true);
            console.log('Submitting comment for post ID:', post.id); // Debug log
            const result = await apiService.addComment(post.id, newComment.trim(), authToken);
            
            // Update post state
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

    // Handle sharing
    const handleShare = async () => {
        if (!currentUser || !authToken) {
            navigate('/login');
            return;
        }

        if (!post?.id) {
            console.error('Post ID is missing');
            return;
        }

        try {
            const result = await apiService.sharePost(post.id, authToken);
            setPost(prevPost => ({
                ...prevPost,
                sharesCount: result.sharesCount
            }));
            
            // If API returns share URL, use it, otherwise construct it
            const postShareUrl = result.shareUrl || `${window.location.origin}/posts/${post.id}`;
            setShareUrl(postShareUrl);
            setShowShareModal(true);
            
        } catch (error) {
            console.error('Error sharing post:', error);
            // If authentication error, logout and redirect
            if (error.message.includes('401') || error.message.includes('403')) {
                logout();
                navigate('/login');
            }
        }
    };

    // Handle follow/unfollow
    const handleFollow = async () => {
        if (!currentUser || !authToken) {
            navigate('/login');
            return;
        }

        if (!post?.author?.id) {
            console.error('Author ID is missing');
            return;
        }

        try {
            const result = await apiService.toggleFollow(post.author.id, authToken);
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

    // Format dates
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

    // Format comment dates
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

    const images = post.media?.images || [];

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
                                {images.length > 0 && (
                                    <span className="post-image-count">📷 {images.length} photo{images.length > 1 ? 's' : ''}</span>
                                )}
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
                            {currentUser && currentUser.id !== post.author.id && (
                                <button 
                                    className={`follow-btn ${post.author.isFollowedByUser ? 'following' : ''}`}
                                    onClick={handleFollow}
                                >
                                    {post.author.isFollowedByUser ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>

                        {/* Enhanced Post Media Content */}
                        {renderImageGallery()}

                        {/* Post body */}
                        <div className="post-content">
                            <p>{post.content}</p>
                        </div>

                        {/* Post Statistics */}
                        <div className="postcard-stats">
                            <span>{post.analytics?.views || 0} views</span>
                            <span>{post.engagement?.likes?.length || 0} likes</span>
                            <span>{post.engagement?.comments?.length || 0} comments</span>
                            <span>{post.analytics?.shares || 0} shares</span>
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
                                <div key={comment.id || comment._id} className="comment-item">
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

            {/* Image Modal */}
            {showImageModal && images.length > 0 && (
                <div className="image-modal" onClick={closeImageModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeImageModal}>×</button>
                        
                        <div className="modal-image-container">
                            <img 
                                src={images[selectedImageIndex].url}
                                alt={images[selectedImageIndex].altText || `Image ${selectedImageIndex + 1}`}
                            />
                        </div>
                        
                        {images.length > 1 && (
                            <>
                                <button className="modal-nav modal-prev" onClick={prevImage}>‹</button>
                                <button className="modal-nav modal-next" onClick={nextImage}>›</button>
                                
                                <div className="modal-counter">
                                    {selectedImageIndex + 1} / {images.length}
                                </div>
                                
                                <div className="modal-thumbnails">
                                    {images.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image.url}
                                            alt={`Thumbnail ${index + 1}`}
                                            className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                                            onClick={() => setSelectedImageIndex(index)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                        
                        {images[selectedImageIndex].caption && (
                            <div className="modal-caption">
                                {images[selectedImageIndex].caption}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Share Modal - Now using the reusable component */}
            <ShareModal 
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                shareUrl={shareUrl}
                title={post?.title || ''}
                description={post?.content ? post.content.substring(0, 150) + '...' : ''}
                options={{
                    showSocialButtons: true,
                    showCopyButton: true,
                    allowNativeShare: true,
                    socialPlatforms: ['twitter', 'facebook', 'whatsapp', 'email'],
                    theme: 'light',
                    size: 'medium'
                }}
            />
        </div>
    );
};

export default PostDetail;
