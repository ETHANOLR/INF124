// components/PostModal/PostModal.js
import React, {useState, useEffect, useContext} from 'react';
import { useNavigate } from 'react-router-dom';
import {Button} from '../buttons/buttons'
import { AuthContext } from '../../contexts/AuthContext';
import './PostModel.css';
import ShareModal from '../ShareModal/ShareModal';

const API_CONFIG = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://api.momento.lifestyle');

/**
 * API Services
 */
const apiService = {
  // Get details of a single post
  async fetchPost(postId) {
      try {
          const response = await fetch(`${API_CONFIG}/api/posts/${postId}`, {
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
          const response = await fetch(`${API_CONFIG}/api/posts/${postId}/like`, {
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
          const response = await fetch(`${API_CONFIG}/api/posts/${postId}/comment`, {
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
          const response = await fetch(`${API_CONFIG}/api/posts/${postId}/share`, {
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
          const response = await fetch(`${API_CONFIG}/api/users/${userId}/follow`, {
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

const PostModal = ({ post, onClose }) => {
  console.log(`post clicked`);
  const navigate = useNavigate();
  const [detailedPost, setDetailedPost] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  
  // Use AuthContext for consistent user state management
  const { currentUser, authToken, logout } = useContext(AuthContext);

  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
      
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    const fetchPostDetail = async () => {
      console.log(`start fetching data of post: ${post}`);
      if (!post?._id && !post?.id) return;
      try {
        console.log(`${API_CONFIG}/api/posts/${post._id || post.id}`);
        const data = await apiService.fetchPost(post._id || post.id);
        setDetailedPost(data);
      } catch (err) {
        console.error('Error loading detailed post:', err);
      }
    };
    fetchPostDetail();
  }, [post]);

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

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!post || !detailedPost) return null;

  const getDisplayName = () => {
    return detailedPost.author?.profile?.displayName || detailedPost.author?.username || 'Unknown';
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

  // Handling follow/unfollow
  const handleFollowClicked = async () => {
    if (!currentUser || !authToken) {
        navigate('/login');
        return;
    }

    if (!detailedPost?.author?._id) {
        console.error('Author ID is missing');
        return;
    }

    // Prevent multiple concurrent requests
    if (isFollowLoading) return;

    try {
        setIsFollowLoading(true);
        console.log('Toggling follow for user:', detailedPost.author._id);
        
        const result = await apiService.toggleFollow(detailedPost.author._id, authToken);
        
        console.log('Follow result:', result);
        
        // Update the post state with new follow status
        setDetailedPost(prevPost => ({
            ...prevPost,
            author: {
                ...prevPost.author,
                isFollowedByUser: result.following,
                followersCount: result.followersCount || prevPost.author.followersCount
            }
        }));
        
    } catch (error) {
        console.error('Error following user:', error);
        // If authentication error, logout and redirect
        if (error.message.includes('401') || error.message.includes('403')) {
            logout();
            navigate('/login');
        }
    } finally {
        setIsFollowLoading(false);
    }
  };

  const handleLikeClicked = async() => {
    if (!currentUser || !authToken) {
      navigate('/login');
      return;
    }

    if (!detailedPost?.id) {
      console.error('Post ID is missing');
      return;
    }

    // Prevent multiple concurrent requests
    if (isLikeLoading) return;
    
    try {
        setIsLikeLoading(true);
        const result = await apiService.toggleLike(detailedPost.id, authToken);
        setDetailedPost(prevPost => ({
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
    } finally {
        setIsLikeLoading(false);
    }
  };

  const handleComment = async() => {
    if (!currentUser || !authToken) {
        navigate('/login');
        return;
    }

    if (!commentInput.trim()) {
        return;
    }

    if (!detailedPost?.id) {
        console.error('Post ID is missing for comment submission');
        return;
    }

    try {
        setIsSubmittingComment(true);
        console.log('Submitting comment for post ID:', detailedPost.id);
        const result = await apiService.addComment(detailedPost.id, commentInput.trim(), authToken);
            
        // Update post status
        setDetailedPost(prevPost => ({
            ...prevPost,
            engagement: {
                ...prevPost.engagement,
                comments: [...(prevPost.engagement.comments || []), result.comment]
            },
            commentsCount: result.commentsCount
        }));
            
        setCommentInput('');
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

    if (!detailedPost?.id) {
        console.error('Post ID is missing');
        return;
    }

    try {
        const result = await apiService.sharePost(detailedPost.id, authToken);
        setDetailedPost(prevPost => ({
            ...prevPost,
            sharesCount: result.sharesCount
        }));
        
        // If API returns share URL, use it, otherwise construct it
        const postShareUrl = result.shareUrl || `${window.location.origin}/posts/${detailedPost.id}`;
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

  const images = post.media?.images || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div className="modal-image-section">
          {/* Enhanced Post Media Content */}
          {renderImageGallery()}
        </div>
        <div className="modal-content-section">
            <div className="modal-header">
                <h2 className="model-post-title">{detailedPost.title}</h2>
                <div className="post-meta">
                    <span className="post-category">{detailedPost.category}</span>
                    <span className="post-date">{formatDate(detailedPost.createdAt)}</span>
                </div>
            </div>
            
            <div className="user">
              <div className="model-author-info">
                <div className="author-avatar">
                  {detailedPost.author?.profile?.profilePicture?.url ? (
                      <img 
                          src={detailedPost.author.profile.profilePicture.url}
                          alt={detailedPost.author.username}
                      />
                  ) : (
                      <div className="avatar-placeholder">
                          {detailedPost.author?.username?.[0]?.toUpperCase() || 'U'}
                       </div>
                  )}
                </div>
                <div className="author-details">
                    <h3 className="author-name">
                        {detailedPost.author?.profile?.displayName || detailedPost.author?.username}
                    </h3>
                    <p className="author-username">@{detailedPost.author?.username}</p>
                </div>
              </div>
              {/* Follow button - only show if user is logged in and not viewing their own post */}
              {currentUser && currentUser._id !== detailedPost.author._id && (
                  <button 
                      className={`follow-btn ${detailedPost.author.isFollowedByUser ? 'following' : ''}`}
                      onClick={handleFollowClicked}
                      disabled={isFollowLoading}
                  >
                      {isFollowLoading ? '...' : (detailedPost.author.isFollowedByUser ? 'Following' : 'Follow')}
                  </button>
              )}
            </div>
            
            <div className="modal-scrollable">
                <p className="post-content">{detailedPost.content}</p>
                {detailedPost.tags && detailedPost.tags.length > 0 && (
                    <div className="tags">
                        {detailedPost.tags.map(tag => <span className="tag" key={tag}>#{tag}</span>)}
                    </div>
                )}
                <div className="stats">
                    <span>{detailedPost.analytics?.views || 0} views</span>
                    <span>{detailedPost.likesCount || 0} likes</span>
                    <span>{detailedPost.commentsCount || 0} comments</span>
                    <span>{detailedPost.sharesCount || 0} shares</span>
                </div>
                <div className="actions">
                    <button 
                        className={`action-btn like-btn ${detailedPost.isLikedByUser ? 'liked' : ''}`}
                        onClick={handleLikeClicked}
                        disabled={isLikeLoading}
                    >
                        <span className="action-icon">
                            {detailedPost.isLikedByUser ? '❤️' : '🤍'}
                        </span>
                        <span>Like ({detailedPost.likesCount || 0})</span>
                    </button>
                    <button className="action-btn share-btn" onClick={handleShare}>
                        <span className="action-icon">📤</span>
                        <span>Share ({detailedPost.sharesCount || 0})</span>
                    </button>
                </div>

                {/* Comments list */}
                <div className="comments-list">
                    {detailedPost.engagement?.comments?.map((comment) => (
                        <div key={comment.id || comment._id} className="comment-item">
                            <div className="comment-header">
                                <div className="comment-avatar">
                                    {comment.user?.profile?.profilePicture?.url ? (
                                        <img 
                                            src={comment.user.profile.profilePicture.url}
                                            alt={comment.user.username}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {comment.user?.username?.[0]?.toUpperCase() || 'U'}
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
                            <div className="comment-content">
                                <p>{comment.content}</p>
                            </div>
                        </div>
                    ))}
                            
                    {(!detailedPost.engagement?.comments || detailedPost.engagement.comments.length === 0) && (
                        <div className="no-comments">
                            <p>No comments yet. Be the first to comment!</p>
                        </div>
                    )}
                </div>
            </div>

            {currentUser && authToken ? (
                <div className="add-comment">
                    <input 
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!commentInput.trim() || isSubmittingComment) return;
                                handleComment();
                            }
                        }}
                        disabled={isSubmittingComment}
                    />
                    <button 
                        className="send-button" 
                        disabled={!commentInput.trim() || isSubmittingComment}
                        onClick={handleComment}
                    >
                        {isSubmittingComment ? '...' : '↑'}
                    </button>
                </div>
            ) : (
                <div className="login-prompt">
                    <p>
                        Please <button onClick={() => navigate('/login')} className="login-link">login</button> to comment
                    </p>
                </div>
            )}
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
    </div>
  );
};

export default PostModal;
