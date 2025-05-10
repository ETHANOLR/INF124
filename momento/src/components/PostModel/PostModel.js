// components/PostModal/PostModal.js
import React, {useState} from 'react';
import {Button} from '../buttons/buttons'
import './PostModel.css';

const PostModal = ({ post, onClose }) => {
  const [commentInput, setCommentInput] = useState('');
  if (!post) return null;


  const exampleComments = [
    {
      username: 'User1',
      avatar: null, // or a URL like 'https://example.com/avatar1.png'
      text: 'This is amazing! I love the composition and colors.',
      time: '2h ago'
    },
    {
      username: 'User2',
      avatar: null,
      text: 'Great post! Where was this taken?',
      time: '1h ago'
    },
    {
      username: 'TravelerJoe',
      avatar: null,
      text: 'I’ve been there too, unforgettable views.',
      time: '30m ago'
    },
    {
      username: 'FoodieQueen',
      avatar: null,
      text: 'This looks delicious 😍 What’s the recipe?',
      time: '15m ago'
    },
    {
      username: 'NatureLover',
      avatar: null,
      text: 'Such a peaceful spot. Thanks for sharing!',
      time: '5m ago'
    }
  ];

  const exampleTags = [
    'travel',
    'foodie',
    'fashion',
    'photography',
    'nature',
    'technology',
    'lifestyle',
    'fitness',
    'style',
    'trending'
  ];

  const getRandomTags = (count = 3) => {
    const shuffled = [...exampleTags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
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
          <div className="modal-thumbnail" />
          <button className="modal-nav left">◀</button>
          <button className="modal-nav right">▶</button>
        </div>
        <div className="modal-content-section">
            <div className="modal-scrollable">
                <div className="modal-header">
                    <div className = "user">
                        <div className="avatar"/>
                        <span className="username">{post.username}</span>
                    </div>
                    <Button className="follow-button" text = "follow" onClick = {() => handleFollowClicked()}/>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>
                <h2 className="post-title">{post.title}</h2>
                <p className="post-detail">{post.details}</p>
                <p className="post-time">2 hours age</p>
                <div className="tags">
                    {(post.tags && post.tags.length ? post.tags : getRandomTags()).map(tag => (
                        <span className="tag" key={tag}>#{tag}</span>
                    ))}
                </div>
                <div className="stats">
                    {post.likes? post.likes:0} likes • {post.comments?post.comments.length:0} comments
                </div>
                <div className="actions">
                    <Button text = 'Like' onClick={() => handleLikeClicked()} type = 'secondary'/>
                    <Button text = 'Share' onClick={() => handleShare()} type = 'secondary'/>
                    <Button text = 'Save' onClick={() => handleSave()} type = 'secondary'/>
                </div>

                <div className="comments">
                    <h4>Comments</h4>
                    <div className="comment-container">
                        {(post.comments?.length ? post.comments : exampleComments).map((c, i) => (//Here is using example comment when comment data is not here
                            <div className="comment" key={i}>
                                <div className="comment-header">
                                    <div className="comment-avatar"></div>
                                    <div className="comment-content">
                                        <div className="comment-username">{c.username}</div>
                                        <div className="comment-text">{c.text}</div>
                                        <div className="comment-subtext">{c.time} • Like • Reply</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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
