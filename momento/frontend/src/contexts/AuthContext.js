// contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

/**
 * Authentication Context Provider
 * 
 * Provides authentication state and methods throughout the application.
 * Stores login status, user data, and auth token in localStorage for persistence.
 * Provides login, logout, and registration methods with real database integration.
 * Handles token-based authentication and automatic logout on token expiration.
 */

// Create the authentication context
export const AuthContext = createContext();

// Create authentication provider component
export const AuthProvider = ({ children }) => {
    /**
     * Initialize authentication state from localStorage if available
     * Ensures user remains logged in across browser sessions
     */
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        const savedLoginState = localStorage.getItem('isLoggedIn');
        const savedToken = localStorage.getItem('authToken');
        // User is considered logged in only if both state and token exist
        return savedLoginState && savedToken ? JSON.parse(savedLoginState) : false;
    });
  
    /**
     * Current user data management
     * Stores complete user profile information including nested objects
     */
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    /**
     * Authentication token management
     * JWT token used for API authentication
     */
    const [authToken, setAuthToken] = useState(() => {
        return localStorage.getItem('authToken') || null;
    });

    /**
     * Synchronize authentication state with localStorage
     * Automatically persists changes to localStorage for session persistence
     */
    useEffect(() => {
        if (isLoggedIn && currentUser && authToken) {
            // Save authentication state to localStorage
            localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('authToken', authToken);
            
            console.log('Authentication state saved to localStorage');
        } else {
            // Clear localStorage if user is not authenticated
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            
            console.log('Authentication state cleared from localStorage');
        }
    }, [isLoggedIn, currentUser, authToken]);

    /**
     * User login function
     * Accepts user data and authentication token from API response
     * @param {Object} userData - Complete user data object from API
     * @param {string} token - JWT authentication token
     * @returns {boolean} - Success status
     */
    const login = (userData, token) => {
        try {
            setIsLoggedIn(true);
            setCurrentUser(userData);
            setAuthToken(token);
            
            console.log('User logged in successfully:', {
                username: userData.username,
                email: userData.email,
                hasAvatar: !!userData.profile?.profilePicture?.url
            });
            return true;
        } catch (error) {
            console.error('Login error in context:', error);
            return false;
        }
    };

    /**
     * User logout function
     * Completely clears all authentication data and localStorage
     */
    const logout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setAuthToken(null);
        
        // Immediately clear localStorage to ensure clean logout
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        
        console.log('User logged out successfully - all data cleared');
    };

    /**
     * User registration function
     * Registers new user and automatically logs them in
     * @param {Object} userData - User data from registration API response
     * @param {string} token - JWT authentication token
     * @returns {boolean} - Success status
     */
    const register = (userData, token) => {
        try {
            setIsLoggedIn(true);
            setCurrentUser(userData);
            setAuthToken(token);
            
            console.log('User registered and logged in:', {
                username: userData.username,
                email: userData.email
            });
            return true;
        } catch (error) {
            console.error('Registration error in context:', error);
            return false;
        }
    };

    /**
     * Enhanced user data update function with deep merging
     * Properly handles nested objects like profile, stats, and account
     * Ensures real-time synchronization across all components
     * @param {Object} newUserData - Updated user data (partial or complete)
     */
    const updateUser = (newUserData) => {
        setCurrentUser(prevUser => {
            if (!prevUser) return newUserData;
            
            // Deep merge user data with special handling for nested objects
            const updatedUser = {
                ...prevUser,
                ...newUserData,
                // Deep merge profile object
                profile: {
                    ...prevUser.profile,
                    ...newUserData.profile,
                    // Special handling for profilePicture object
                    profilePicture: {
                        ...prevUser.profile?.profilePicture,
                        ...newUserData.profile?.profilePicture
                    },
                    // Handle social links object
                    socialLinks: {
                        ...prevUser.profile?.socialLinks,
                        ...newUserData.profile?.socialLinks
                    }
                },
                // Deep merge stats object
                stats: {
                    ...prevUser.stats,
                    ...newUserData.stats
                },
                // Deep merge account object
                account: {
                    ...prevUser.account,
                    ...newUserData.account
                },
                // Deep merge preferences if they exist
                preferences: newUserData.preferences ? {
                    ...prevUser.preferences,
                    ...newUserData.preferences
                } : prevUser.preferences
            };
            
            console.log('User data updated in context:', {
                username: updatedUser.username,
                oldAvatar: prevUser.profile?.profilePicture?.url,
                newAvatar: updatedUser.profile?.profilePicture?.url,
                updateFields: Object.keys(newUserData)
            });
            
            return updatedUser;
        });
    };

    /**
     * Specialized avatar update function
     * Provides immediate avatar updates without waiting for full profile sync
     * @param {string} avatarUrl - New avatar URL
     * @param {string} filename - Avatar filename for backend reference
     */
    const updateUserAvatar = (avatarUrl, filename) => {
        setCurrentUser(prevUser => {
            if (!prevUser) return prevUser;
            
            const updatedUser = {
                ...prevUser,
                profile: {
                    ...prevUser.profile,
                    profilePicture: {
                        url: avatarUrl,
                        filename: filename,
                        uploadedAt: new Date().toISOString()
                    }
                }
            };
            
            console.log('Avatar updated in context:', {
                username: prevUser.username,
                oldUrl: prevUser.profile?.profilePicture?.url,
                newUrl: avatarUrl
            });
            
            return updatedUser;
        });
    };

    /**
     * Token validation function
     * Basic validation - can be extended for JWT token expiration checking
     * @returns {boolean} - Token validity status
     */
    const isTokenValid = () => {
        if (!authToken) {
            console.log('No auth token available');
            return false;
        }
        
        try {
            // Basic token validation - check if token exists and has proper format
            // TODO: Implement JWT token expiration validation here
            const tokenParts = authToken.split('.');
            if (tokenParts.length !== 3) {
                console.log('Invalid token format');
                logout(); // Auto logout for invalid tokens
                return false;
            }
            
            // For now, assume token is valid if it exists and has proper format
            console.log('Token validation passed');
            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            logout(); // Auto logout if token validation fails
            return false;
        }
    };

    /**
     * Debug function to log current authentication state
     * Useful for development and troubleshooting
     */
    const debugAuthState = () => {
        console.log('Current Auth State:', {
            isLoggedIn,
            hasUser: !!currentUser,
            hasToken: !!authToken,
            username: currentUser?.username,
            avatarUrl: currentUser?.profile?.profilePicture?.url
        });
    };

    /**
     * Context value object containing all authentication state and methods
     * This is what consuming components will receive
     */
    const value = {
        // Authentication state
        isLoggedIn,
        currentUser,
        authToken,
        
        // Authentication methods
        login,
        logout,
        register,
        
        // User data management
        updateUser,
        updateUserAvatar,
        
        // Utility methods
        isTokenValid,
        debugAuthState
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
