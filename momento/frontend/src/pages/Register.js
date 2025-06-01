import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';
import SuccessModal from '../components/SuccessModal/SuccessModal';

/**
 * Register Page
 * 
 * Handles new user registration with form validation and database integration.
 * Features a split-screen design with a welcome message and registration form.
 * Collects email, username, and password with appropriate validation.
 * Sends registration data to backend API and handles success/error responses.
 * Shows a  success modal after successful registration.
 * Includes social media registration options and links to terms/privacy policies.
 */
const Register = () => {
    // Form data state
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: ''
    });

    // Form validation and UI state
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    // Handle input changes and clear errors
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear specific error when user starts typing
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    // List of allowed email domains for validation
    const allowedEmailDomains = [
        // 美国
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'icloud.com',
        'protonmail.com',
        'live.com',
        
        // 中国
        'qq.com',
        '163.com',
        '126.com',
        'sina.com',
        '139.com',        // 中国移动
        'yeah.net',       // 网易邮箱
        'foxmail.com',    // 腾讯企业邮箱
        'vip.163.com',    // 网易VIP邮箱
        'vip.126.com',    // 网易VIP邮箱
        'vip.sina.com',   // 新浪VIP邮箱
    ];

    // Validate if email domain is in allowed list
    const validateEmailDomain = (email) => {
        const domain = email.toLowerCase().split('@')[1];
        return allowedEmailDomains.includes(domain);
    };

    // Form validation function
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
        }

        // Email validation
        if (!formData.email.trim()) {
            tempErrors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            tempErrors.email = 'Email format is invalid';
            isValid = false;
        } else if (!validateEmailDomain(formData.email)) {
            tempErrors.email = 'Please use a mainstream email provider (Gmail, QQ, 163, Yahoo, Outlook, etc.)';
            isValid = false;
        }

        // Password validation
        if (!formData.password) {
            tempErrors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 6) {
            tempErrors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        
        try {
            // Send registration data to backend API
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/users`, formData);
            
            console.log('Registration successful:', response.data);
            
            // Clear form after successful registration
            setFormData({ email: '', username: '', password: '' });
            setErrors({});
            
            // Show success modal instead of alert
            setShowSuccessModal(true);
            
        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle different types of errors from backend
            if (error.response) {
                // Server responded with error status
                const { data, status } = error.response;
                
                if (status === 400 && data.message) {
                    // Handle validation errors from backend
                    if (data.message.includes('email')) {
                        setErrors({ email: 'Email already exists' });
                    } else if (data.message.includes('username')) {
                        setErrors({ username: 'Username already taken' });
                    } else {
                        setErrors({ general: data.message });
                    }
                } else {
                    setErrors({ general: 'Registration failed. Please try again.' });
                }
            } else if (error.request) {
                // Network error
                setErrors({ general: 'Network error. Please check your connection and try again.' });
            } else {
                // Other unexpected error
                setErrors({ general: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle success modal close - redirect to login page
    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigate('/login');
    };

    return (
        <div className="register-container">
            {/* Left panel with welcome message */}
            <div className="register-left-panel">
                <div className="circle-container">
                    <div className="register-welcome">
                        <h1 className="welcome-title">Share Your World</h1>
                        <p className="welcome-text">Join our creative community<br />and discover amazing content</p>
                    </div>
                </div>
            </div>
            
            {/* Right panel with registration form */}
            <div className="register-form-panel">
                <div className="register-form-container">
                    <h2 className="register-logo" onClick={() => navigate('/home')}>Momento</h2>
                    <p className="register-subtitle">Create your account</p>

                    {/* Display general errors */}
                    {errors.general && (
                        <div className="error-message" style={{ textAlign: 'center', marginBottom: '16px', color: '#d32f2f' }}>
                            {errors.general}
                        </div>
                    )}

                    {/* Registration form */}
                    <form onSubmit={handleSubmit}>
                        {/* Email input field */}
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`register-input ${errors.email ? 'input-error' : ''}`}
                                placeholder="Enter your email (Gmail, QQ, 163, Yahoo, etc.)"
                                disabled={isLoading}
                            />
                            {errors.email && <div className="error-message">{errors.email}</div>}
                            {!errors.email && (
                                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                    Supported: Gmail, QQ, 163, 126, Yahoo, Outlook, Hotmail, and other mainstream providers
                                </div>
                            )}
                        </div>
                    
                        {/* Username input field */}
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`register-input ${errors.username ? 'input-error' : ''}`}
                                placeholder="Choose a username"
                                disabled={isLoading}
                            />
                            {errors.username && <div className="error-message">{errors.username}</div>}
                        </div>
                    
                        {/* Password input field */}
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`register-input ${errors.password ? 'input-error' : ''}`}
                                placeholder="Create a password"
                                disabled={isLoading}
                            />
                            {errors.password && <div className="error-message">{errors.password}</div>}
                        </div>
                    
                        {/* Submit button */}
                        <button 
                            type="submit" 
                            className="register-button"
                            disabled={isLoading}
                            style={{ 
                                backgroundColor: isLoading ? '#ccc' : '#ff6f61',
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
              
                    {/* Additional options and links */}
                    <div className="register-options">
                        <p className="login-link">
                            Already have an account? <Link to="/login" className="link-text">Login</Link>
                        </p>

                        <p className="terms-text">
                            By signing up, you agree to our <Link to="/terms" className="link-text">Terms of Service</Link> and <Link to="/privacy" className="link-text">Privacy Policy</Link>
                        </p>
                    
                        <p className="register-with-text">Or sign up with</p>

                        {/* Social media registration buttons */}
                        <div className="social-buttons">
                            <button className="social-button" disabled={isLoading}>
                                <div className="social-icon google-icon"></div>
                            </button>
                            <button className="social-button" disabled={isLoading}>
                                <div className="social-icon facebook-icon"></div>
                            </button>
                            <button className="social-button" disabled={isLoading}>
                                <div className="social-icon twitter-icon"></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success modal - shown after successful registration */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={handleSuccessModalClose}
                title="Welcome to Momento!"
                message="Your account has been created successfully. You can now start sharing your amazing moments with the world!"
                buttonText="Go to Login"
                onButtonClick={handleSuccessModalClose}
            />
        </div>
    );
};

export default Register;
