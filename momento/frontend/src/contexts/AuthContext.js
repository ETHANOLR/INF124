// frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

/**
 * Authentication Context Provider
 * 
 * Provides authentication state and methods throughout the application.
 * Stores login status, user data, and auth token in memory for session persistence.
 * Provides login, logout, and registration methods with real database integration.
 * Handles token-based authentication and automatic logout on token expiration.
 */

// Create the authentication context
export const AuthContext = createContext();

// Create authentication provider component
export const AuthProvider = ({ children }) => {
    /**
     * Initialize authentication state in memory
     * In production, you would initialize from localStorage
     */
    const [isLoggedIn, setIsLoggedIn] = useState(false);
  
    /**
     * Current user data management
     * Stores complete user profile information including nested objects
     */
    const [currentUser, setCurrentUser] = useState(null);

    /**
     * Authentication token management
     * JWT token used for API authentication
     */
    const [authToken, setAuthToken] = useState(null);

    /**
     * Socket connection state for real-time features
     */
    const [socketConnected, setSocketConnected] = useState(false);

    /**
     * Online status of current user
     */
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    /**
     * Monitor online/offline status
     */
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    /**
     * Log authentication state changes for debugging
     */
    useEffect(() => {
        if (isLoggedIn && currentUser && authToken) {
            console.log('Authentication state updated:', {
                isLoggedIn: true,
                username: currentUser.username,
                hasToken: !!authToken,
                socketConnected
            });
        } else {
            console.log('Authentication state cleared');
        }
    }, [isLoggedIn, currentUser, authToken, socketConnected]);

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
     * Completely clears all authentication data
     */
    const logout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setAuthToken(null);
        setSocketConnected(false);
        
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
                } : prevUser.preferences,
                // Deep merge activity status
                activity: {
                    ...prevUser.activity,
                    ...newUserData.activity
                }
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
     * Update online status for current user
     * @param {boolean} online - Online status
     */
    const updateOnlineStatus = (online) => {
        setIsOnline(online);
        if (currentUser) {
            updateUser({
                activity: {
                    ...currentUser.activity,
                    isOnline: online,
                    lastActiveAt: new Date().toISOString()
                }
            });
        }
    };

    /**
     * Socket connection status update
     * @param {boolean} connected - Socket connection status
     */
    const updateSocketStatus = (connected) => {
        setSocketConnected(connected);
        console.log(`Socket ${connected ? 'connected' : 'disconnected'}`);
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
            const tokenParts = authToken.split('.');
            if (tokenParts.length !== 3) {
                console.log('Invalid token format');
                logout(); // Auto logout for invalid tokens
                return false;
            }
            
            // Decode JWT payload to check expiration
            try {
                const payload = JSON.parse(atob(tokenParts[1]));
                const currentTime = Math.floor(Date.now() / 1000);
                
                if (payload.exp && payload.exp < currentTime) {
                    console.log('Token has expired');
                    logout(); // Auto logout for expired tokens
                    return false;
                }
            } catch (decodeError) {
                console.log('Error decoding token payload');
            }
            
            console.log('Token validation passed');
            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            logout(); // Auto logout if token validation fails
            return false;
        }
    };

    /**
     * Refresh authentication status from server
     * Useful for verifying token validity and getting updated user data
     */
    const refreshAuth = async () => {
        if (!authToken || !isTokenValid()) {
            return false;
        }

        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                updateUser(userData);
                console.log('Authentication refreshed successfully');
                return true;
            } else {
                console.log('Authentication refresh failed');
                logout();
                return false;
            }
        } catch (error) {
            console.error('Authentication refresh error:', error);
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
            avatarUrl: currentUser?.profile?.profilePicture?.url,
            isOnline,
            socketConnected,
            tokenValid: isTokenValid()
        });
    };

    /**
     * Get display name for current user
     * Priority: displayName > fullName > username
     */
    const getDisplayName = () => {
        if (!currentUser) return '';
        
        const profile = currentUser.profile || {};
        
        if (profile.displayName) return profile.displayName;
        if (profile.firstName && profile.lastName) {
            return `${profile.firstName} ${profile.lastName}`;
        }
        if (profile.firstName) return profile.firstName;
        
        return currentUser.username || '';
    };

    /**
     * Check if current user has specific permissions
     * @param {string} permission - Permission to check
     * @returns {boolean} - Has permission
     */
    const hasPermission = (permission) => {
        if (!currentUser) return false;
        
        const userPermissions = currentUser.moderation?.permissions || [];
        const isAdmin = currentUser.moderation?.isAdmin || false;
        const isModerator = currentUser.moderation?.isModerator || false;
        
        // Admins have all permissions
        if (isAdmin) return true;
        
        // Check specific permissions
        if (userPermissions.includes(permission)) return true;
        
        // Moderators have certain default permissions
        if (isModerator && ['moderate_content', 'view_reports'].includes(permission)) {
            return true;
        }
        
        return false;
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
        isOnline,
        socketConnected,
        
        // Authentication methods
        login,
        logout,
        register,
        refreshAuth,
        
        // User data management
        updateUser,
        updateUserAvatar,
        updateOnlineStatus,
        updateSocketStatus,
        
        // Utility methods
        isTokenValid,
        debugAuthState,
        getDisplayName,
        hasPermission
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
