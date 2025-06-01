import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Settings.css';
import { AuthContext } from '../contexts/AuthContext';
import logoImage from '../Momento_Transparent.png';

/**
 * Settings Component
 * 
 * Provides user account settings management including:
 * - Profile information editing with backend integration
 * - Real-time form validation
 * - Error handling and success messages
 * - Loading states
 * - Avatar management with file upload
 * - Password change functionality
 * - Account logout functionality
 */
const Settings = () => {
    const navigate = useNavigate();
    const { currentUser, logout, updateUser, authToken } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('Account');
    
    // Loading and UI states
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Form state - initialize with current user data
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        displayName: '',
        bio: '',
        location: '',
        website: '',
        phoneNumber: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Original data for change detection
    const [originalData, setOriginalData] = useState({});
    
    // Avatar state
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Fetch current user data on component mount
    useEffect(() => {
        fetchUserData();
    }, []);

    // Set up axios interceptor for token
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(
            (config) => {
                if (authToken) {
                    config.headers.Authorization = `Bearer ${authToken}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(interceptor);
        };
    }, [authToken]);

    // Fetch user data from backend
    const fetchUserData = async () => {
        if (!authToken) {
            navigate('/login');
            return;
        }

        try {
            setIsFetching(true);
            const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/auth/me`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                }
            );

            const userData = response.data;
            const profileData = {
                username: userData.username || '',
                email: userData.email || '',
                firstName: userData.profile?.firstName || '',
                lastName: userData.profile?.lastName || '',
                displayName: userData.profile?.displayName || '',
                bio: userData.profile?.bio || '',
                location: userData.profile?.location || '',
                website: userData.profile?.website || '',
                phoneNumber: userData.profile?.phoneNumber || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            };

            setFormData(profileData);
            setOriginalData(profileData);
            
            // Set avatar preview if exists
            if (userData.profile?.profilePicture?.url) {
                setAvatarPreview(userData.profile.profilePicture.url);
            }
            
        } catch (error) {
            console.error('Error fetching user data:', error);
            if (error.response?.status === 401) {
                logout();
                navigate('/login');
            } else {
                setErrors({
                    general: 'Failed to load user data. Please refresh the page.'
                });
            }
        } finally {
            setIsFetching(false);
        }
    };
    
    // Handle input changes with validation
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear specific field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Clear general errors
        if (errors.general) {
            setErrors(prev => ({
                ...prev,
                general: ''
            }));
        }

        // Clear success message when user makes changes
        if (successMessage) {
            setSuccessMessage('');
        }

        // Check for unsaved changes
        const newData = { ...formData, [name]: value };
        const hasChanges = Object.keys(originalData).some(key => {
            if (key.includes('Password')) return false; // Ignore password fields for change detection
            return originalData[key] !== newData[key];
        });
        
        // Also check if there's a password change
        const hasPasswordChange = newData.newPassword || newData.currentPassword || newData.confirmPassword;
        
        // Check if there's an avatar change
        const hasAvatarChange = avatarFile !== null;
        
        setHasUnsavedChanges(hasChanges || hasPasswordChange || hasAvatarChange);
    };
    
    // Handle avatar file selection
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrors({ avatar: 'Please select a valid image file' });
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors({ avatar: 'Image size should be less than 5MB' });
                return;
            }
            
            setAvatarFile(file);
            
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
            
            setHasUnsavedChanges(true);
            
            // Clear avatar error
            if (errors.avatar) {
                setErrors(prev => ({ ...prev, avatar: '' }));
            }
        }
    };
    
    // Trigger avatar file input
    const triggerAvatarUpload = () => {
        const fileInput = document.getElementById('avatar-upload');
        fileInput.click();
    };
    
    // Form validation
    const validateForm = () => {
        let tempErrors = {};
        let isValid = true;

        // Username validation
        if (!formData.username.trim()) {
            tempErrors.username = 'Username is required';
            isValid = false;
        } else if (formData.username.length < 3) {
            tempErrors.username = 'Username must be at least 3 characters';
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            tempErrors.username = 'Username can only contain letters, numbers, and underscores';
            isValid = false;
        }

        // Email validation
        if (!formData.email.trim()) {
            tempErrors.email = 'Email is required';
            isValid = false;
        } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
            tempErrors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Website validation (if provided)
        if (formData.website && formData.website.trim()) {
            const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
            if (!urlPattern.test(formData.website)) {
                tempErrors.website = 'Please enter a valid website URL';
                isValid = false;
            }
        }

        // Phone number validation (if provided)
        if (formData.phoneNumber && formData.phoneNumber.trim()) {
            const phonePattern = /^\+?[\d\s\-\(\)]{10,20}$/;
            if (!phonePattern.test(formData.phoneNumber)) {
                tempErrors.phoneNumber = 'Please enter a valid phone number';
                isValid = false;
            }
        }

        // Password validation (if changing password)
        if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
            console.log('Validating password fields:', {
                currentPassword: formData.currentPassword ? '***' : 'empty',
                newPassword: formData.newPassword ? '***' : 'empty',
                confirmPassword: formData.confirmPassword ? '***' : 'empty'
            });

            if (!formData.currentPassword) {
                tempErrors.currentPassword = 'Current password is required to change password';
                isValid = false;
            }
            
            if (!formData.newPassword) {
                tempErrors.newPassword = 'New password is required';
                isValid = false;
            } else if (formData.newPassword.length < 6) {
                tempErrors.newPassword = 'New password must be at least 6 characters';
                isValid = false;
            }
            
            if (formData.newPassword !== formData.confirmPassword) {
                tempErrors.confirmPassword = 'Passwords do not match';
                isValid = false;
            }
        }

        console.log('Form validation result:', { isValid, errors: tempErrors });
        setErrors(tempErrors);
        return isValid;
    };
    
    // Handle tab switching
    const handleTabClick = (tab) => {
        if (hasUnsavedChanges) {
            const confirmLeave = window.confirm(
                'You have unsaved changes. Are you sure you want to leave this tab?'
            );
            if (!confirmLeave) return;
        }
        setActiveTab(tab);
        setErrors({});
        setSuccessMessage('');
    };
    
    // Handle save button click
    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            let updateSuccessful = false;
            let passwordChangeSuccessful = false;
            let avatarUploadSuccessful = false;
            let errorOccurred = false;

            // Step 1: Update profile information
            const profileHasChanges = Object.keys(originalData).some(key => {
                if (key.includes('Password')) return false;
                return originalData[key] !== formData[key];
            });

            if (profileHasChanges) {
                try {
                    await updateProfileData();
                    updateSuccessful = true;
                } catch (error) {
                    console.error('Profile update failed:', error);
                    setErrors({ general: error.message });
                    errorOccurred = true;
                }
            }

            // Step 2: Handle avatar upload
            if (avatarFile && !errorOccurred) {
                try {
                    await uploadAvatar();
                    avatarUploadSuccessful = true;
                } catch (error) {
                    console.error('Avatar upload failed:', error);
                    setErrors(prev => ({ ...prev, avatar: error.message }));
                    errorOccurred = true;
                }
            }

            // Step 3: Handle password change
            if (formData.newPassword && formData.currentPassword && !errorOccurred) {
                try {
                    await changePassword();
                    passwordChangeSuccessful = true;
                } catch (error) {
                    console.error('Password change failed:', error);
                    setErrors(prev => ({ ...prev, password: error.message }));
                    errorOccurred = true;
                }
            }

            // Only update UI state if no errors occurred
            if (!errorOccurred) {
                // Update original data to reflect current state
                const newOriginalData = { ...formData };
                newOriginalData.currentPassword = '';
                newOriginalData.newPassword = '';
                newOriginalData.confirmPassword = '';
                setOriginalData(newOriginalData);
                
                setHasUnsavedChanges(false);
                setAvatarFile(null);
                
                // Clear password fields
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));

                // Show success message based on what was updated
                let message = 'Settings updated successfully!';
                if (updateSuccessful && passwordChangeSuccessful && avatarUploadSuccessful) {
                    message = 'Profile, avatar, and password updated successfully!';
                } else if (updateSuccessful && passwordChangeSuccessful) {
                    message = 'Profile and password updated successfully!';
                } else if (updateSuccessful && avatarUploadSuccessful) {
                    message = 'Profile and avatar updated successfully!';
                } else if (passwordChangeSuccessful && avatarUploadSuccessful) {
                    message = 'Avatar and password updated successfully!';
                } else if (updateSuccessful) {
                    message = 'Profile updated successfully!';
                } else if (passwordChangeSuccessful) {
                    message = 'Password updated successfully!';
                } else if (avatarUploadSuccessful) {
                    message = 'Avatar updated successfully!';
                } else if (!profileHasChanges && !avatarFile && !formData.newPassword) {
                    message = 'No changes to save';
                }
                
                setSuccessMessage(message);
            }

        } catch (error) {
            console.error('Error updating settings:', error);
            setErrors({ general: 'An unexpected error occurred. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Update profile data
    const updateProfileData = async () => {
        try {
            const updateData = {
                username: formData.username,
                profile: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    displayName: formData.displayName,
                    bio: formData.bio,
                    location: formData.location,
                    website: formData.website,
                    phoneNumber: formData.phoneNumber
                }
            };

            const response = await axios.put(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/profile`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Update local user data
            updateUser(response.data.user);
            console.log('Profile updated successfully:', response.data);

        } catch (error) {
            console.error('Error updating profile:', error);
            
            if (error.response) {
                const { data, status } = error.response;
                
                if (status === 400) {
                    if (data.message?.includes('Username already taken')) {
                        throw new Error('Username is already taken');
                    } else if (data.message?.includes('Email already exists')) {
                        throw new Error('Email is already in use');
                    } else {
                        throw new Error(data.message || 'Invalid data provided');
                    }
                } else if (status === 401) {
                    logout();
                    navigate('/login');
                    throw new Error('Session expired');
                } else {
                    throw new Error('Failed to update profile. Please try again.');
                }
            } else {
                throw new Error('Network error. Please check your connection.');
            }
        }
    };

    // Upload avatar
    const uploadAvatar = async () => {
        try {
            const formDataObj = new FormData();
            formDataObj.append('avatar', avatarFile);

            const response = await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/avatar`,
                formDataObj,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Update avatar preview with the new URL
            setAvatarPreview(response.data.avatarUrl);
            console.log('Avatar uploaded successfully:', response.data);

        } catch (error) {
            console.error('Error uploading avatar:', error);
            
            if (error.response) {
                const { data, status } = error.response;
                
                if (status === 400) {
                    throw new Error(data.message || 'Invalid image file');
                } else if (status === 401) {
                    logout();
                    navigate('/login');
                    throw new Error('Session expired');
                } else {
                    throw new Error('Failed to upload avatar. Please try again.');
                }
            } else {
                throw new Error('Network error. Please check your connection.');
            }
        }
    };

    // Change password
    const changePassword = async () => {
        try {
            const passwordData = {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            };

            console.log('Sending password change request...');

            const response = await axios.put(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/password`,
                passwordData,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Password changed successfully:', response.data);

        } catch (error) {
            console.error('Error changing password:', error);
            
            if (error.response) {
                const { data, status } = error.response;
                console.error('Password change error response:', { data, status });
                
                if (status === 400) {
                    if (data.message?.includes('Current password is incorrect')) {
                        throw new Error('Current password is incorrect');
                    } else if (data.message?.includes('New password must be at least')) {
                        throw new Error('New password must be at least 6 characters long');
                    } else {
                        throw new Error(data.message || 'Invalid password data');
                    }
                } else if (status === 401) {
                    logout();
                    navigate('/login');
                    throw new Error('Session expired. Please login again.');
                } else if (status === 404) {
                    throw new Error('User not found');
                } else {
                    throw new Error('Failed to change password. Please try again.');
                }
            } else if (error.request) {
                throw new Error('Network error. Please check your connection.');
            } else {
                throw new Error('An unexpected error occurred. Please try again.');
            }
        }
    };
    
    // Handle logout
    const handleLogout = () => {
        if (hasUnsavedChanges) {
            const confirmLogout = window.confirm(
                'You have unsaved changes. Are you sure you want to log out?'
            );
            if (!confirmLogout) return;
        }
        
        logout();
        navigate('/login');
    };
    
    // Settings navigation items
    const settingsNav = [
        { name: 'Account', action: () => handleTabClick('Account') },
        { name: 'Privacy', action: () => handleTabClick('Privacy') },
        { name: 'Notifications', action: () => handleTabClick('Notifications') },
        { name: 'Security', action: () => handleTabClick('Security') },
        { name: 'Display', action: () => handleTabClick('Display') },
        { name: 'Blocking', action: () => handleTabClick('Blocking') },
        { name: 'Language', action: () => handleTabClick('Language') },
        { name: 'Help & Support', action: () => handleTabClick('Help & Support') },
        { name: 'About', action: () => handleTabClick('About') },
        { name: 'Log Out', action: handleLogout, isLogout: true }
    ];

    // Show loading screen while fetching data
    if (isFetching) {
        return (
            <div className="settings-page">
                <div className="settings-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your settings...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="settings-page">
            {/* Header */}
            <div className="settings-header">
                <div className="settings-logo" onClick={() => navigate('/home')}>
                    <img src={logoImage} alt="Momento Logo" className="settings-logo-image" />
                    <span className="settings-logo-text">Momento</span>
                </div>
                <h2 className="settings-title">Settings</h2>
                <button 
                    className={`save-button ${(!hasUnsavedChanges || isLoading) ? 'disabled' : ''}`}
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || isLoading}
                >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="success-banner">
                    <p>{successMessage}</p>
                </div>
            )}

            {/* Error Message */}
            {errors.general && (
                <div className="error-banner">
                    <p>{errors.general}</p>
                </div>
            )}

            {/* Settings Content */}
            <div className="settings-container">
                <div className="settings-wrapper">
                    <div className="settings-content">
                        {/* Settings navigation sidebar */}
                        <div className="settings-nav">
                            {settingsNav.map((item) => (
                                <button
                                    key={item.name}
                                    className={`nav-item ${activeTab === item.name ? 'active' : ''} ${item.isLogout ? 'logout' : ''}`}
                                    onClick={item.action}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                        
                        {/* Settings main content */}
                        <div className="settings-main">
                            {activeTab === 'Account' && (
                                <div className="account-settings">
                                    <h3>Account Settings</h3>
                                    
                                    <div className="profile-settings-container">
                                        {/* Profile Information section */}
                                        <div className="profile-info-section">
                                            <h4 className="section-title">Profile Information</h4>
                                            
                                            <div className="form-row">
                                                <div className="input-group">
                                                    <label>First Name</label>
                                                    <input
                                                        type="text"
                                                        name="firstName"
                                                        value={formData.firstName}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter your first name"
                                                        className={errors.firstName ? 'error' : ''}
                                                        disabled={isLoading}
                                                    />
                                                    {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                                                </div>
                                                
                                                <div className="input-group">
                                                    <label>Last Name</label>
                                                    <input
                                                        type="text"
                                                        name="lastName"
                                                        value={formData.lastName}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter your last name"
                                                        className={errors.lastName ? 'error' : ''}
                                                        disabled={isLoading}
                                                    />
                                                    {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                                                </div>
                                            </div>
                                            
                                            <div className="input-group">
                                                <label>Display Name</label>
                                                <input
                                                    type="text"
                                                    name="displayName"
                                                    value={formData.displayName}
                                                    onChange={handleInputChange}
                                                    placeholder="How should we display your name?"
                                                    className={errors.displayName ? 'error' : ''}
                                                    disabled={isLoading}
                                                />
                                                {errors.displayName && <span className="error-text">{errors.displayName}</span>}
                                            </div>
                                            
                                            <div className="input-group">
                                                <label>Username *</label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your username"
                                                    className={errors.username ? 'error' : ''}
                                                    disabled={isLoading}
                                                />
                                                {errors.username && <span className="error-text">{errors.username}</span>}
                                                <small className="input-hint">Your username is visible to other users</small>
                                            </div>
                                            
                                            <div className="input-group">
                                                <label>Email *</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your email"
                                                    className={errors.email ? 'error' : ''}
                                                    disabled={isLoading}
                                                />
                                                {errors.email && <span className="error-text">{errors.email}</span>}
                                            </div>
                                            
                                            <div className="input-group">
                                                <label>Bio</label>
                                                <textarea
                                                    name="bio"
                                                    value={formData.bio}
                                                    onChange={handleInputChange}
                                                    rows="3"
                                                    placeholder="Tell us about yourself..."
                                                    className={errors.bio ? 'error' : ''}
                                                    disabled={isLoading}
                                                    maxLength="500"
                                                />
                                                <small className="input-hint">{formData.bio.length}/500 characters</small>
                                                {errors.bio && <span className="error-text">{errors.bio}</span>}
                                            </div>

                                            <div className="form-row">
                                                <div className="input-group">
                                                    <label>Location</label>
                                                    <input
                                                        type="text"
                                                        name="location"
                                                        value={formData.location}
                                                        onChange={handleInputChange}
                                                        placeholder="Where are you located?"
                                                        className={errors.location ? 'error' : ''}
                                                        disabled={isLoading}
                                                    />
                                                    {errors.location && <span className="error-text">{errors.location}</span>}
                                                </div>

                                                <div className="input-group">
                                                    <label>Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        name="phoneNumber"
                                                        value={formData.phoneNumber}
                                                        onChange={handleInputChange}
                                                        placeholder="+1 (555) 123-4567"
                                                        className={errors.phoneNumber ? 'error' : ''}
                                                        disabled={isLoading}
                                                    />
                                                    {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
                                                </div>
                                            </div>

                                            <div className="input-group">
                                                <label>Website</label>
                                                <input
                                                    type="url"
                                                    name="website"
                                                    value={formData.website}
                                                    onChange={handleInputChange}
                                                    placeholder="https://yourwebsite.com"
                                                    className={errors.website ? 'error' : ''}
                                                    disabled={isLoading}
                                                />
                                                {errors.website && <span className="error-text">{errors.website}</span>}
                                            </div>
                                        </div>
                                        
                                        {/* Avatar section */}
                                        <div className="profile-avatar-section">
                                            <h4 className="section-title">Profile Avatar</h4>
                                            <div className="avatar-container">
                                                <div className="avatar-preview">
                                                    {avatarPreview ? (
                                                        <img 
                                                            src={avatarPreview} 
                                                            alt="Profile Avatar" 
                                                        />
                                                    ) : (
                                                        <div className="avatar-placeholder">
                                                            {formData.username.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    id="avatar-upload"
                                                    accept="image/*"
                                                    onChange={handleAvatarChange}
                                                    style={{ display: 'none' }}
                                                />
                                                <button 
                                                    className="change-avatar-button"
                                                    onClick={triggerAvatarUpload}
                                                    disabled={isLoading}
                                                >
                                                    Change Avatar
                                                </button>
                                                {errors.avatar && <span className="error-text">{errors.avatar}</span>}
                                                <small className="input-hint">
                                                    Recommended: Square image, at least 200x200px, max 5MB
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Password section */}
                                    <div className="password-section">
                                        <h4 className="section-title">Change Password</h4>
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>Current Password</label>
                                                <input
                                                    type="password"
                                                    name="currentPassword"
                                                    value={formData.currentPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter current password"
                                                    className={errors.currentPassword ? 'error' : ''}
                                                    disabled={isLoading}
                                                />
                                                {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
                                            </div>
                                        </div>
                                        
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>New Password</label>
                                                <input
                                                    type="password"
                                                    name="newPassword"
                                                    value={formData.newPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter new password"
                                                    className={errors.newPassword ? 'error' : ''}
                                                    disabled={isLoading}
                                                />
                                                {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                                                <small className="input-hint">At least 6 characters</small>
                                            </div>
                                            
                                            <div className="input-group">
                                                <label>Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Confirm new password"
                                                    className={errors.confirmPassword ? 'error' : ''}
                                                    disabled={isLoading}
                                                />
                                                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                                            </div>
                                        </div>
                                        
                                        {/* Display password change errors */}
                                        {errors.password && (
                                            <div className="error-banner" style={{ margin: '10px 0', padding: '10px' }}>
                                                <p>{errors.password}</p>
                                            </div>
                                        )}
                                        
                                        {/* Display password-specific success message */}
                                        {successMessage && successMessage.includes('password') && (
                                            <div className="success-banner" style={{ margin: '10px 0', padding: '10px' }}>
                                                <p>{successMessage}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Other tabs content (placeholder for future implementation) */}
                            {activeTab === 'Privacy' && (
                                <div className="privacy-settings">
                                    <h3>Privacy Settings</h3>
                                    <p>Privacy settings content coming soon...</p>
                                </div>
                            )}
                            
                            {activeTab === 'Notifications' && (
                                <div className="notifications-settings">
                                    <h3>Notification Settings</h3>
                                    <p>Notification settings content coming soon...</p>
                                </div>
                            )}

                            {activeTab === 'Security' && (
                                <div className="security-settings">
                                    <h3>Security Settings</h3>
                                    <p>Security settings content coming soon...</p>
                                </div>
                            )}

                            {activeTab === 'Display' && (
                                <div className="display-settings">
                                    <h3>Display Settings</h3>
                                    <p>Display settings content coming soon...</p>
                                </div>
                            )}

                            {activeTab === 'Blocking' && (
                                <div className="blocking-settings">
                                    <h3>Blocking Settings</h3>
                                    <p>Blocking settings content coming soon...</p>
                                </div>
                            )}

                            {activeTab === 'Language' && (
                                <div className="language-settings">
                                    <h3>Language Settings</h3>
                                    <p>Language settings content coming soon...</p>
                                </div>
                            )}

                            {activeTab === 'Help & Support' && (
                                <div className="help-settings">
                                    <h3>Help & Support</h3>
                                    <p>Help & Support content coming soon...</p>
                                </div>
                            )}

                            {activeTab === 'About' && (
                                <div className="about-settings">
                                    <h3>About Momento</h3>
                                    <p>About content coming soon...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
