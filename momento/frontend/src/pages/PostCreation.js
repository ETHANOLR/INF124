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
  const [privacy, setPrivacy] = useState('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image upload states
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [uploadErrors, setUploadErrors] = useState('');
  
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);

  /**
   * Handle image file selection with validation
   * Supports multiple image selection
   */
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Clear previous errors
    setUploadErrors('');
    
    // Validate file count (max 5 images)
    if (files.length > 5) {
      setUploadErrors('You can upload maximum 5 images per post');
      return;
    }
    
    // Validate each file
    const validFiles = [];
    const previews = [];
    
    for (let file of files) {
      // Validate file type - only images allowed
      if (!file.type.startsWith('image/')) {
        setUploadErrors('Please select only image files');
        return;
      }
      
      // Validate file size - maximum 10MB per image
      if (file.size > 10 * 1024 * 1024) {
        setUploadErrors('Each image should be less than 10MB');
        return;
      }
      
      validFiles.push(file);
      // Create preview URL for immediate display
      previews.push({
        file: file,
        url: URL.createObjectURL(file),
        name: file.name
      });
    }
    
    setSelectedImages(validFiles);
    setImagePreviews(previews);
    
    console.log(`Selected ${validFiles.length} images for upload`);
  };

  /**
   * Trigger file input click for image upload
   */
  const triggerImageUpload = () => {
    const fileInput = document.getElementById('image-upload');
    fileInput.click();
  };

  /**
   * Remove specific image from selection
   */
  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leak
    URL.revokeObjectURL(imagePreviews[index].url);
    
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
    
    // Clear upload errors when removing images
    if (uploadErrors) {
      setUploadErrors('');
    }
  };

  /**
   * Clear all selected images
   */
  const clearAllImages = () => {
    // Revoke all object URLs to prevent memory leaks
    imagePreviews.forEach(preview => {
      URL.revokeObjectURL(preview.url);
    });
    
    setSelectedImages([]);
    setImagePreviews([]);
    setUploadedImageUrls([]);
    setUploadErrors('');
    
    // Reset file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  /**
   * Upload images to server
   * Returns array of uploaded image URLs
   */
  const uploadImages = async () => {
    if (selectedImages.length === 0) {
      return [];
    }

    setIsUploadingImages(true);
    setUploadErrors('');

    try {
      const formData = new FormData();
      
      // Append all selected images
      selectedImages.forEach((image) => {
        formData.append('media', image);
      });

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/api/posts/upload-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload images');
      }

      const data = await response.json();
      const imageUrls = data.media.map(item => item.url);
      
      setUploadedImageUrls(imageUrls);
      console.log(`Successfully uploaded ${imageUrls.length} images`);
      
      return imageUrls;

    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadErrors(error.message || 'Failed to upload images');
      return [];
    } finally {
      setIsUploadingImages(false);
    }
  };

  /**
   * Handle post submission with image upload
   */
  const handlePost = async () => {
    if (!title || !description || !category) {
      alert('Title, Description and Category are required');
      return;
    }

    setIsSubmitting(true);
    setUploadErrors('');

    try {
      // Step 1: Upload images first if any are selected
      let imageUrls = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages();
        
        // If image upload failed, don't proceed with post creation
        if (selectedImages.length > 0 && imageUrls.length === 0) {
          setIsSubmitting(false);
          return;
        }
      }

      // Step 2: Create post with uploaded image URLs
      const postData = {
        title,
        content: description,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        category,
        privacy,
        // Include uploaded images in media object
        media: {
          images: imageUrls.map(url => ({
            url: url,
            caption: '', // Could be extended to allow captions
            altText: title // Use title as alt text for accessibility
          }))
        }
      };

      // Add location if provided
      if (location && location.trim()) {
        postData.location = {
          name: location.trim()
        };
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }

      const createdPost = await response.json();
      console.log('Post created successfully:', createdPost);

      // Clean up object URLs
      imagePreviews.forEach(preview => {
        URL.revokeObjectURL(preview.url);
      });

      // Navigate to home
      navigate('/home');

    } catch (error) {
      console.error('Error creating post:', error);
      setUploadErrors(error.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, []);

  return (
    <div className="post-creation-container">
      {/* Navigation bar at the top */}
      <Navbar />

      <div className="post-body">
        {/* Media Upload Area */}
        <div className="media-upload">
          {/* Hidden file input for multiple image selection */}
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          
          {/* Upload Box */}
          <div className="upload-box" onClick={triggerImageUpload} style={{ cursor: 'pointer' }}>
            <p>Drag and drop photos or videos here</p>
            <p>or</p>
            <Button text="Select from device" onClick={(e) => {
              e.stopPropagation();
              triggerImageUpload();
            }} />
          </div>

          {/* Upload Errors */}
          {uploadErrors && (
            <div className="upload-error" style={{ 
              color: 'red', 
              padding: '10px', 
              backgroundColor: '#ffebee', 
              borderRadius: '4px',
              marginTop: '10px'
            }}>
              {uploadErrors}
            </div>
          )}

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="image-previews" style={{ marginTop: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h4 style={{ margin: 0 }}>Selected Images ({imagePreviews.length}/5)</h4>
                <button 
                  onClick={clearAllImages}
                  style={{
                    background: 'none',
                    border: '1px solid #ddd',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Clear All
                </button>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '10px' 
              }}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid #ddd'
                      }}
                    />
                    <button
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'rgba(255, 0, 0, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '25px',
                        height: '25px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                    <div style={{ 
                      fontSize: '10px', 
                      marginTop: '5px', 
                      textAlign: 'center',
                      color: '#666',
                      wordBreak: 'break-all'
                    }}>
                      {preview.name}
                    </div>
                  </div>
                ))}
              </div>

              {isUploadingImages && (
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '15px',
                  color: '#666'
                }}>
                  Uploading images...
                </div>
              )}
            </div>
          )}

          {/* Optional Configuration */}
          <div className="toggle-options">
            <label>
              Add multiple photos
              <input 
                type="checkbox" 
                checked={true}
                readOnly
                style={{ pointerEvents: 'none' }}
              />
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
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="friends">Friends</option>
              <option value="followers">Followers</option>
            </select>
          </div>

          {/* Post Button */}
          <div className='post-button'>
            <Button
              text={isSubmitting ? "Posting..." : "Post"}
              style={{ width: "100px" }}
              onClick={handlePost}
              disabled={isSubmitting || isUploadingImages}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreation;
