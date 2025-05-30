import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

/**
 * Register Page
 * 
 * Handles new user registration with form validation and database integration.
 * Features a split-screen design with a welcome message and registration form.
 * Collects email, username, and password with appropriate validation.
 * Sends registration data to backend API and handles success/error responses.
 * Includes social media registration options and links to terms/privacy policies.
 * Redirects to home page after successful registration.
 */
const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

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

    const validateForm = () => {
        let tempErrors = {};
        let isValid = true;

        if (!formData.username.trim()) {
            tempErrors.username = 'Username is required';
            isValid = false;
        } else if (formData.username.length < 3) {
            tempErrors.username = 'Username must be at least 3 characters';
            isValid = false;
        }

        if (!formData.email.trim()) {
            tempErrors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            tempErrors.email = 'Email is invalid';
            isValid = false;
        }

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

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        
        try {
            // Send registration data to backend API
            const response = await axios.post('http://localhost:4000/api/users', formData);
            
            console.log('Registration successful:', response.data);
            
            // Clear form after successful registration
            setFormData({ email: '', username: '', password: '' });
            setErrors({});
            
            // Show success message
            alert('Account created successfully! Welcome to Momento!');
            
            // Redirect to login page or home page
            navigate('/login');
            
        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle different types of errors
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
                // Other error
                setErrors({ general: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-left-panel">
                <div className="circle-container">
                    <div className="register-welcome">
                        <h1 className="welcome-title">Share Your World</h1>
                        <p className="welcome-text">Join our creative community<br />and discover amazing content</p>
                    </div>
                </div>
            </div>
            
            <div className="register-form-panel">
                <div className="register-form-container">
                    <h2 className="register-logo" onClick={() => navigate('/home')}>Momento</h2>
                    <p className="register-subtitle">Create your account</p>

                    {errors.general && (
                        <div className="error-message" style={{ textAlign: 'center', marginBottom: '16px', color: '#d32f2f' }}>
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`register-input ${errors.email ? 'input-error' : ''}`}
                                placeholder="Enter your email"
                                disabled={isLoading}
                            />
                            {errors.email && <div className="error-message">{errors.email}</div>}
                        </div>
                    
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
              
                    <div className="register-options">
                        <p className="login-link">
                            Already have an account? <Link to="/login" className="link-text">Login</Link>
                        </p>

                        <p className="terms-text">
                            By signing up, you agree to our <Link to="/terms" className="link-text">Terms of Service</Link> and <Link to="/privacy" className="link-text">Privacy Policy</Link>
                        </p>
                    
                        <p className="register-with-text">Or sign up with</p>

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
        </div>
    );
};

export default Register;
