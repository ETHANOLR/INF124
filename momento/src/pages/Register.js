import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: ''
});

    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
            setFormData({
                ...formData,
                [name]: value
        });
    };

    const validateForm = () => {
        let tempErrors = {};
        let isValid = true;

        if (!formData.username.trim()) {
            tempErrors.username = 'Username is required';
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

    const handleSubmit = (e) => {
        e.preventDefault();
    
        if (validateForm()) {
        // Here we will send the registration data to our backend
        console.log('Registration data:', formData);
        
        // Redirect to verification page but now we do not write it
        navigate('/verification', { state: { email: formData.email } });
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
            <h2 className="register-logo">Momento</h2>
            <p className="register-subtitle">Create your account</p>

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
                />
                {errors.password && <div className="error-message">{errors.password}</div>}
                </div>
            
                <button type="submit" className="register-button">Create Account</button>
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
                <button className="social-button">
                <div className="social-icon google-icon"></div>
                </button>
                <button className="social-button">
                    <div className="social-icon facebook-icon"></div>
                </button>
                <button className="social-button">
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
