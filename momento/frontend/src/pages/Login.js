import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import { AuthContext } from '../contexts/AuthContext';
import SuccessModal from '../components/SuccessModal/SuccessModal';

/**
 * Login Page
 * 
 * Provides user authentication functionality with email and password.
 * Features a split-screen design with a welcome message and login form.
 * Includes form validation, database authentication, and social media login options.
 * Shows success modal after successful login.
 * Updates global authentication state on successful login.
 * Handles user authentication with email and password via backend API.
 */
const Login = () => {
    // Form data state
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    
    // Form validation and UI state
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    // Get authentication context
    const { login } = useContext(AuthContext);

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
        
        // Clear general error when user starts typing
        if (errors.general) {
            setErrors({
                ...errors,
                general: ''
            });
        }
    };

    // Form validation function
    const validateForm = () => {
        let tempErrors = {};
        let isValid = true;

        // Email validation
        if (!formData.email.trim()) {
            tempErrors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            tempErrors.email = 'Email format is invalid';
            isValid = false;
        } else if (!validateEmailDomain(formData.email)) {
            tempErrors.email = 'Please use a mainstream email provider';
            isValid = false;
        }

        // Password validation
        if (!formData.password) {
            tempErrors.password = 'Password is required';
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    // Handle login form submission
    const handleLogin = async (e) => {
        e.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        
        try {
            // Send login request to backend API
            const response = await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}/api/auth/login`,
                {
                    email: formData.email,
                    password: formData.password
                },
                { withCredentials: true }
            );
            
            console.log('Login successful:', response.data);
            
            // Extract user data and token from response
            const { user, token } = response.data;
            
            // Update authentication context
            login(user, token);
            
            // Clear form and errors
            setFormData({ email: '', password: '' });
            setErrors({});

            // redirect
            // navigate('/home');

            // Show success modal instead of direct navigation
            setShowSuccessModal(true);
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle different types of errors from backend
            if (error.response) {
                // Server responded with error status
                const { data, status } = error.response;
                
                if (status === 400 || status === 401) {
                    // Invalid credentials
                    if (data.message) {
                        setErrors({ general: data.message });
                    } else {
                        setErrors({ general: 'Invalid email or password' });
                    }
                } else if (status === 404) {
                    setErrors({ general: 'Account not found. Please check your email or register.' });
                } else {
                    setErrors({ general: 'Login failed. Please try again.' });
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

    // Handle success modal close - redirect to home page
    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigate('/home');
    };

    return (
        <div className="login-container">
            {/* Left panel with welcome message */}
            <div className="login-left-panel">
                <div className="circle-container">
                    <div className="login-welcome">
                        <h1 className="welcome-title">Welcome Back</h1>
                        <p className="welcome-text">Continue your journey<br />and connect with friends</p>
                    </div>
                </div>
            </div>
      
            {/* Right panel with login form */}
            <div className="login-form-panel">
                <div className="login-form-container">
                    <h2 className="login-logo" onClick={() => navigate('/home')}>Momento</h2>
                    <p className="login-subtitle">Login to your account</p>
                
                    {/* Display general errors */}
                    {errors.general && (
                        <div className="login-error">{errors.general}</div>
                    )}
                
                    {/* Login form */}
                    <form onSubmit={handleLogin}>
                        {/* Email input field */}
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className={`login-input ${errors.email ? 'input-error' : ''}`}
                                disabled={isLoading}
                            />
                            {errors.email && <div className="error-message" style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>{errors.email}</div>}
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
                                placeholder="Enter your password"
                                className={`login-input ${errors.password ? 'input-error' : ''}`}
                                disabled={isLoading}
                            />
                            {errors.password && <div className="error-message" style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>{errors.password}</div>}
                        </div>
                    
                        {/* Submit button */}
                        <button 
                            type="submit" 
                            className="login-button"
                            disabled={isLoading}
                            style={{ 
                                backgroundColor: isLoading ? '#ccc' : '#ff6f61',
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                
                    {/* Additional options and links */}
                    <div className="login-options">
                        <p className="new-to-momento">
                            New to Momento? <Link to="/register" className="link-text">Create an account</Link>
                        </p>
                        
                        <p className="new-to-momento">
                            <Link to="/forgot-password" className="link-text">Forgot your password?</Link>
                        </p>
                    
                        <p className="login-with-text">Or login with</p>
                    
                        {/* Social media login buttons */}
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

            {/* Success modal - shown after successful login */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={handleSuccessModalClose}
                title="Welcome Back!"
                message="You have successfully logged in to your Momento account. Ready to share and discover amazing moments?"
                buttonText="Continue to Home"
                onButtonClick={handleSuccessModalClose}
            />
        </div>
    );
};

export default Login;
