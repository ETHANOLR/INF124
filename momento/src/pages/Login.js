import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();

        // Basic validation
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        
        // We do not handle the authentication with our backend now
        // we just write the login page and we will add other later
        console.log('Login attempt with:', email);
        
        // Clear any previous errors
        setError('');
        
        // Do not add function, so just redirect to home page after successful login
        navigate('/home');
    };

    return (
        <div className="login-container">
        <div className="login-left-panel">
            <div className="circle-container">
            <div className="login-welcome">
                <h1 className="welcome-title">Share Your World</h1>
                <p className="welcome-text">Join our creative community<br />and discover amazing content</p>
            </div>
            </div>
        </div>
        
        <div className="login-form-panel">
            <div className="login-form-container">
            <h2 className="login-logo" onClick={() => navigate('/home')}>Momento</h2>
            <p className="login-subtitle">Login to your account</p>
          
            {error && <div className="login-error">{error}</div>}
          
            <form onSubmit={handleLogin}>
                <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="login-input"
                />
                </div>
            
                <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="login-input"
                />
                </div>
            
                <button type="submit" className="login-button">Login</button>
            </form>
          
            <div className="login-options">
                <p className="new-to-momento">
                New to Momento? <Link to="/register" className="link-text">Create an account</Link>
                </p>
            
                <p className="login-with-text">Or login with</p>
            
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

export default Login;
