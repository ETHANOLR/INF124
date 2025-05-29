import React from 'react';
import './PostCreation.css';
import Navbar from '../components/NavBar/navBar';
import { Button } from '../components/buttons/buttons';

const PostCreation = () => {
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
            <input type="text" placeholder="Add a title for your post" />
          </div>

          {/* Description Input */}
          <div className="post-details-section">
            <p>Description: </p>
            <textarea placeholder="What's on your mind?" />
          </div>
          
          {/* Tags Input */}
          <div className="post-details-section">
            <p>Tags: </p>
            <input type="text" placeholder="Add tags separated by commas" />
          </div>

          {/* Post Category Selection */}
          <div className="post-details-section">
            <p>Category: </p>
            <select>
              <option>Select a category</option>
            </select>
          </div>

          {/* Location Input */}
          <div className="post-details-section">
            <p>Location: </p>
            <input type="text" placeholder="Add location (optional)" />
          </div>
          
          {/* Privacy Selection */}
          <div className="post-details-section">
            <p>Privacy: </p>
            <select>
              <option>Public</option>
              <option>Private</option>
              <option>Friends</option>
            </select>          
          </div>
          
          {/* Post Button */}
          <div className='post-button'>
            <Button text="Post" style={{width: "100px"}}/>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PostCreation;