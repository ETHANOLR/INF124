import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';
import { AuthContext } from '../contexts/AuthContext';
import logoImage from '../Momento_Transparent.png';

/**
 * Settings Component
 * 
 * Provides user account settings management including:
 * - Profile information editing
 * - Password change functionality
 * - Avatar management
 * - Privacy, notification, and display settings
 * - Account logout functionality
 */
const Settings = () => {
    const navigate = useNavigate();
    const { currentUser, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('Account');
    
    // Form state
    const [formData, setFormData] = useState({
        name: currentUser?.name || 'xxx xxxxx',
        username: currentUser?.username || 'xxxxx',
        email: currentUser?.email || 'xxxxx@example.com',
        bio: currentUser?.bio || 'Travel enthusiast and photography lover. Exploring the world one photo at a time.',
        currentPassword: ''
    });
    
    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    // Handle tab switching
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };
    
    // Handle save button click
    const handleSave = () => {
        // We will handle this would send data to backend in the future
        console.log('Saving profile data:', formData);
        // Show success message or handle errors
    };
    
    // Handle avatar change
    const handleAvatarChange = () => {
        // We will handle this, and this would open file picker in the future
        console.log('Opening avatar change dialog');
    };
    
    // Handle password change
    const handlePasswordChange = () => {
        // This would validate and update password, in the future when we add the database
        console.log('Changing password');
    };
    
    // Handle logout
    const handleLogout = () => {
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
    
    return (
        <div className="settings-page">
            {/* Header */}
            <div className="settings-header">
                <div className="settings-logo" onClick={() => navigate('/home')}>
                    <img src={logoImage} alt="Momento Logo" className="settings-logo-image" />
                    <span className="settings-logo-text">Momento</span>
                </div>
                <h2 className="settings-title">Setting</h2>
                <button className="save-button" onClick={handleSave}>Save</button>
            </div>
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
                                            
                                            <div className="input-group">
                                                <label>Name</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    placeholder="xxx xxxxx"
                                                />
                                            </div>
                                            
                                            <div className="input-group">
                                                <label>Username</label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleInputChange}
                                                    placeholder="xxxxx"
                                                />
                                            </div>
                                            
                                            <div className="input-group">
                                                <label>Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    placeholder="xxxxx@example.com"
                                                />
                                            </div>
                                            
                                            <div className="input-group">
                                                <label>Bio</label>
                                                <textarea
                                                    name="bio"
                                                    value={formData.bio}
                                                    onChange={handleInputChange}
                                                    rows="3"
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Avatar section */}
                                        <div className="profile-avatar-section">
                                            <h4 className="section-title">Profile Avatar</h4>
                                            <div className="avatar-container">
                                                <div className="avatar-preview"></div>
                                                <button 
                                                    className="change-avatar-button"
                                                    onClick={handleAvatarChange}
                                                >
                                                    Change Avatar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Password section */}
                                    <div className="password-section">
                                        <h4 className="section-title">Change Password</h4>
                                        <div className="input-group">
                                            <label>Current Password</label>
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                value={formData.currentPassword}
                                                onChange={handleInputChange}
                                                placeholder="••••••••••••"
                                            />
                                        </div>
                                        <button 
                                            className="save-change-button"
                                            onClick={handlePasswordChange}
                                        >
                                            Save Change
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Other tabs content can be added here */}
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
                            
                            {/* Add more tab content as needed */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
