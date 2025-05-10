// contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Stores login status in localStorage for persistence across page refreshes.
 * Provides login, logout, and registration methods.
 * TODO: We do not have the database, so defult can be login
 */

// Create the context
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
    // Initialize auth state from localStorage if available
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        const savedLoginState = localStorage.getItem('isLoggedIn');
        return savedLoginState ? JSON.parse(savedLoginState) : false;
    });
  
    // Current user data
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Update localStorage when login state changes
    useEffect(() => {
        localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }, [isLoggedIn, currentUser]);

    // Login method
    // TODO: this would validate against a backend
    const login = (email, password) => {
        // Implement actual authentication logic here
        // For now, we'll just set logged in to true with mock data
        setIsLoggedIn(true);
        setCurrentUser({
        id: 1,
        username: 'Username',
        email: email,
        // Can add other user data as needed
        });
        return true;
    };

    // Logout method
    const logout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
    };

    // Register method
    // TODO: this would send data to a backend
    const register = (username, email, password) => {
        // Implement actual registration logic here
        // For now, we'll just set logged in to true with the provided data
        setIsLoggedIn(true);
        setCurrentUser({
        id: 1,
        username: username,
        email: email,
        // Add other user data as needed
        });
        return true;
    };

    // Value object to be provided to consumers
    const value = {
        isLoggedIn,
        currentUser,
        login,
        logout,
        register
    };

    return (
        <AuthContext.Provider value={value}>
        {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
