import React, { useState, useContext } from 'react';
import './PostCreation.css';
import Navbar from '../components/NavBar/navBar';
import { Button } from '../components/buttons/buttons';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PostCreation = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [privacy, setPrivacy] = useState('Public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);

  const handlePost = async () => {
    if (!title || !description || !category) {
      alert('Title, Description and Category are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title,
          content: description,
          tags: tags.split(',').map(t => t.trim()),
          category,
          location,
          privacy
        })
      });

      if (!response.ok) throw new Error('Failed to post');

      const postData = await response.json();
      console.log('Post created:', postData);

      // Navigate to home
      navigate('/home');

    } catch (error) {
      console.error('Error posting:', error);
      alert('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    
    <div className="post-creation-container">
      {/* Navigation bar at the top */}
      <Navbar />

      <div className="post-body">
        {/* Media Upload Area */}
        <div className="media-upload">
          <div className="upload-box">
            <p>Drag and drop photos or videos here</p>
            <p>or</p>
            <Button text="Select from device"></Button>
          </div>

          {/* Optional Configuration */}
          <div className="toggle-options">
            <label>
              Add multiple photos
              <input type="checkbox" />
            </label>
            <label>
              Add filters
              <input type="checkbox" />
            </label>
          </div>
        </div>

        {/* Post Detail Input Area */}
        <div className="post-details">
          {/* Title */}
          <h3>Post Details</h3>

          {/* Title Input */}
          <div className="post-details-section">
            <p>Title: </p>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title for your post"
            />
          </div>

          {/* Description Input */}
          <div className="post-details-section">
            <p>Description: </p>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's on your mind?"
            />
          </div>

          {/* Tags Input */}
          <div className="post-details-section">
            <p>Tags: </p>
            <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Add tags separated by commas"
            />
          </div>

          {/* Post Category Selection */}
          <div className="post-details-section">
            <p>Category: </p>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select a category</option>
              <option value="Fashion">Fashion</option>
              <option value="Travel">Travel</option>
              <option value="Food">Food</option>
              <option value="Beauty">Beauty</option>
              <option value="Lifestyle">Lifestyle</option>
              <option value="Technology">Technology</option>
              <option value="Sports">Sports</option>
            </select>
          </div>

          {/* Location Input */}
          <div className="post-details-section">
            <p>Location: </p>
            <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location (optional)"
            />
          </div>

          {/* Privacy Selection */}
          <div className="post-details-section">
            <p>Privacy: </p>
            <select value={privacy} onChange={(e) => setPrivacy(e.target.value)}>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
              <option value="Friends">Friends</option>
            </select>
          </div>

          {/* Post Button */}
          <div className='post-button'>
            <Button
                text={isSubmitting ? "Posting..." : "Post"}
                style={{ width: "100px" }}
                onClick={handlePost}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default PostCreation;