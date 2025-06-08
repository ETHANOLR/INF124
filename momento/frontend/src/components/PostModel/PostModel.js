// components/PostModal/PostModal.js
import React, {useState, useEffect, useContext} from 'react';
import { useNavigate } from 'react-router-dom';
import {Button} from '../buttons/buttons'
import { AuthContext } from '../../contexts/AuthContext';
import './PostModel.css';

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
  const navigate = useNavigate();
  const [detailedPost, setDetailedPost] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  // Use AuthContext for consistent user state management
  const { currentUser, authToken, logout } = useContext(AuthContext);

  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchPostDetail = async () => {
      if (!post?._id) return;
      try {
        console.log(`${API_CONFIG}/api/posts/${post._id}`);
        const data = await apiService.fetchPost(post._id);
        setDetailedPost(data);
      } catch (err) {
        console.error('Error loading detailed post:', err);
      }
    };
    fetchPostDetail();
  }, [post]);

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

    try {
        const result = await apiService.toggleFollow(detailedPost.author._id, authToken);
        setDetailedPost(prevPost => ({
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

  const handleLikeClicked = async() => {
    if (!currentUser || !authToken) {
      navigate('/login');
      return;
    }

    if (!detailedPost?.id) {
      console.error('Post ID is missing');
      return;
    }
    
    try {
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
        console.log('Submitting comment for post ID:', detailedPost.id); // Debug log
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

  // Processing Sharing
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

  const handleSave = () => {
    alert('Saved');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-image-section">
          {/* Replace with real image */}
          {detailedPost.media?.images?.[0]?.url ? (
            <img
              src={detailedPost.media.images[0].url}
              alt={detailedPost.title}
              className="modal-thumbnail"
            />
          ) : (
            <div className="modal-thumbnail-placeholder">No Image Available</div>
          )}
        </div>
        <div className="modal-content-section">
            <div className="modal-scrollable">
                <h2 className="post-title">{detailedPost.title}</h2>
                <div className="modal-header">
                  <span className="post-category">{detailedPost.category}</span>
                  <span className="post-date">{formatDate(detailedPost.createdAt)}</span>
                </div>
                <div className = "user">
                  <div className="model-author-info">
                    <div className="author-avatar">
                      {detailedPost.author?.profile?.profilePicture?.url ? (
                          <img 
                              src={detailedPost.author.profile.profilePicture.url}
                              alt={detailedPost.author.username}
                          />
                      ) : (
                          <div className="avatar-placeholder">
                              {detailedPost.author?.username?.[0]?.toUpperCase()}
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
                  {/* Follow button */}
                  {currentUser && currentUser._id !== detailedPost.author._id && (
                      <button 
                          className={`follow-btn ${detailedPost.author.isFollowedByUser ? 'following' : ''}`}
                          onClick={handleFollowClicked}
                      >
                          {detailedPost.author.isFollowedByUser ? 'Following' : 'Follow'}
                      </button>
                  )}
                </div>
                <p className="post-content">{detailedPost.content}</p>
                <div className="tags">
                    {detailedPost.tags?.map(tag => <span className="tag" key={tag}>#{tag}</span>)}
                </div>
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
                                setCommentInput('');
                            }
                        }}
                    />
                    <button 
                        className="send-button" 
                        disabled={!commentInput.trim() || isSubmittingComment}
                        onClick={() => {
                            if (!commentInput.trim() || isSubmittingComment) return;
                            handleComment();
                            setCommentInput('');
                        }}
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
      </div>
    </div>
  );
};

export default PostModal;
