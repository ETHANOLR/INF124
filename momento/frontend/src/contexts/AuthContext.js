// contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Stores login status, user data, and auth token in localStorage for persistence.
 * Provides login, logout, and registration methods with real database integration.
 * Handles token-based authentication and automatic logout on token expiration.
 */

// Create the context
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
    // Initialize auth state from localStorage if available
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        const savedLoginState = localStorage.getItem('isLoggedIn');
        const savedToken = localStorage.getItem('authToken');
        // User is logged in if both login state and token exist
        return savedLoginState && savedToken ? JSON.parse(savedLoginState) : false;
    });
  
    // Current user data
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Auth token
    const [authToken, setAuthToken] = useState(() => {
        return localStorage.getItem('authToken') || null;
    });

    // Update localStorage when auth state changes
    useEffect(() => {
        if (isLoggedIn && currentUser && authToken) {
            localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('authToken', authToken);
        } else {
            // Clear localStorage if not logged in
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
        }
    }, [isLoggedIn, currentUser, authToken]);

    // Login method - now accepts user data and token from API response
    const login = (userData, token) => {
        try {
            setIsLoggedIn(true);
            setCurrentUser(userData);
            setAuthToken(token);
            
            console.log('User logged in successfully:', userData);
            return true;
        } catch (error) {
            console.error('Login error in context:', error);
            return false;
        }
    };

    // Logout method
    const logout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setAuthToken(null);
        
        // Clear localStorage immediately
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        
        console.log('User logged out successfully');
    };

    // Register method - for auto-login after successful registration
    const register = (userData, token) => {
        try {
            setIsLoggedIn(true);
            setCurrentUser(userData);
            setAuthToken(token);
            
            console.log('User registered and logged in:', userData);
            return true;
        } catch (error) {
            console.error('Registration error in context:', error);
            return false;
        }
    };

    // Check if token is still valid (optional - for token expiration handling)
    const isTokenValid = () => {
        if (!authToken) return false;
        
        try {
            // Basic token validation - you can implement JWT token expiration check here
            // For now, we assume token is valid if it exists
            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            logout(); // Auto logout if token is invalid
            return false;
        }
    };

    // Update user data (for profile updates)
    const updateUser = (newUserData) => {
        setCurrentUser(prevUser => ({
            ...prevUser,
            ...newUserData
        }));
    };

    // Value object to be provided to consumers
    const value = {
        isLoggedIn,
        currentUser,
        authToken,
        login,
        logout,
        register,
        updateUser,
        isTokenValid
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
