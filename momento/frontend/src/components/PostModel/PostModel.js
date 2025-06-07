// components/PostModal/PostModal.js
import React, {useState, useEffect} from 'react';
import {Button} from '../buttons/buttons'
import './PostModel.css';

const API_BASE = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://api.momento.lifestyle');

const PostModal = ({ post, onClose }) => {
  const [detailedPost, setDetailedPost] = useState(null);
  const [commentInput, setCommentInput] = useState('');

  useEffect(() => {
    const fetchPostDetail = async () => {
      if (!post?._id) return;
      try {
        console.log(`${API_BASE}/api/posts/${post._id}`);
        const response = await fetch(`${API_BASE}/api/posts/${post._id}`);
        const data = await response.json();
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

  const getAvatar = () => {
    return detailedPost.author?.profile?.profilePicture?.url || '';
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

  const handleFollowClicked = () => {
    alert('Followed');
  }

  const handleLikeClicked = () => {
    alert('Liked');
  }

  const handleComment = (input) => {
    alert(`Commented: ${input}`);
  };

  const handleShare = () => {
    alert('Shared');
  }

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
                    <div className="avatar">
                        {getAvatar() ? (
                          <img
                            src={getAvatar()}
                            alt={getDisplayName()}
                            style={{ borderRadius: '50%' }}
                          />
                        ) : (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '100%',
                            backgroundColor: '#e0e0e0',
                            borderRadius: '50%'
                          }}>
                            {detailedPost.author?.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                    </div>
                    <span className="username">{getDisplayName()}</span>
                    <Button className="follow-button" text = "follow" onClick = {() => handleFollowClicked()}/>
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
                    <Button text = 'Like' onClick={() => handleLikeClicked()} type = 'secondary'/>
                    <Button text = 'Share' onClick={() => handleShare()} type = 'secondary'/>
                    <Button text = 'Save' onClick={() => handleSave()} type = 'secondary'/>
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

            <div className="add-comment">
                <input 
                    type="text"
                    placeholder="Add a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleComment(commentInput);
                            setCommentInput(''); // Clear input
                        }
                    }}
                />
                <button 
                    className="send-button" 
                    onClick={() => {
                        handleComment(commentInput);
                        setCommentInput(''); // Clear input
                    }}
                >
                ↑
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
