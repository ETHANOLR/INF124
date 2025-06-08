import React from 'react';
import './PostCard.css';
import { Button } from '../buttons/buttons';
import { useNavigate } from 'react-router-dom';

function PostCard({ postData, currentUser, onFollow }) {
  const navigate = useNavigate();

  const post = postData;
  console.log("PostCard rendered with title:", post);
    //The PostCard Component, will generate a PostCard with the titile, thumbnail, detail, username, onLike, onComment, onShare, avatar
    //title(String): the title of the postcard
    //thumbnail(image src, optional): The thumbnail of the post card
    //detail(String, optional): the detail of the post card
    //username(string, optional): the username
    //onLike(function, optional): generate the like button with calling the input function when button pressed
    //onComment(function, optional); same as the onLike, for comment
    //onShare(function, optional): same as the onLike, for share
    //avatar(image src, optional): the avatar of the user(头像)

  const handlePostClick = (postId) => {
    navigate(`/posts/${postId}`);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };  

  return (
    <div 
        key={post._id || post.id} 
        className="postcard"
        onClick={() => handlePostClick(post._id || post.id)}
    >
        {/* Post thumbnail - use first image if available */}
        <div className="postcard-thumbnail">
            {post.media?.images?.[0]?.url ? (
                <img 
                    src={post.media.images[0].url} 
                    alt={post.media.images[0].altText || post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    backgroundColor: '#f0f0f0',
                    color: '#999'
                }}>
                    {post.category}
                </div>
            )}
        </div>
        
        <div className="postcard-content">
            <h3 className="postcard-title">{post.title}</h3>
            
            <div className="postcard-details">
                {post.excerpt || post.content.substring(0, 100) + '...'}
            </div>
            
            {/* Post metadata */}
            <div className="postcard-metadata">
                <span className="postcard-category">{post.category}</span>
                <span className="postcard-date">{formatDate(post.createdAt)}</span>
            </div>
            
            {/* Author information */}
            <div className="post-user">
                <div className="author-left">
                    <div className="postcard-user-avatar">
                        {post.author?.profile?.profilePicture?.url ? (
                            <img 
                                src={post.author.profile.profilePicture.url}
                                alt={post.author.username}
                                style={{ width: '100%', height: '100%', borderRadius: '50%' }}
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
                                {post.author?.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span className="postcard-username">
                        {post.author?.profile?.displayName || post.author?.username}
                    </span>
                </div>

                {/* Follow button (only show if not self and onFollow is provided) */}
                {currentUser && onFollow && currentUser.userId !== post.author._id && (
                    <button
                        className={`follow-btn-small ${post.author.isFollowedByUser ? 'following' : ''}`}
                        onClick={(e) => onFollow(e, post.author._id)}
                    >
                        {post.author.isFollowedByUser ? 'Following' : 'Follow'}
                    </button>
                )}
            </div>
            
            {/* Post statistics */}
            <div className="postcard-stats">
                <span>{post.likesCount || 0} likes</span>
                <span>{post.commentsCount || 0} comments</span>
                <span>{post.analytics?.views || 0} views</span>
            </div>
        </div>
    </div>
  );
}

export default PostCard;
