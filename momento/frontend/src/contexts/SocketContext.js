// frontend/src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

/**
 * Socket Context for Real-time Communication
 * 
 * Manages WebSocket connection and provides real-time functionality:
 * - Connection management and authentication
 * - Message sending and receiving
 * - User online/offline status
 * - Typing indicators
 * - Connection error handling
 * - Automatic reconnection
 */

const SocketContext = createContext();

// Custom hook to use socket context
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const { authToken, isLoggedIn, currentUser, updateSocketStatus } = useContext(AuthContext);
    
    // Socket connection reference
    const socketRef = useRef(null);
    
    // Connection state
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    
    // Real-time data state
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [typingUsers, setTypingUsers] = useState(new Map()); // chatId -> Set of usernames
    
    // Event listeners map for cleanup
    const eventListenersRef = useRef(new Map());
    
    // Constants
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000';
    const MAX_RETRY_ATTEMPTS = 5;
    const RETRY_DELAY = 1000; // 1 second base delay

    /**
     * Initialize socket connection when user is authenticated
     */
    useEffect(() => {
        if (isLoggedIn && authToken && currentUser) {
            connectSocket();
        } else {
            disconnectSocket();
        }

        return () => {
            disconnectSocket();
        };
    }, [isLoggedIn, authToken, currentUser]);

    /**
     * Connect to socket server
     */
    const connectSocket = () => {
        if (socketRef.current?.connected) {
            return;
        }

        try {
            console.log('Connecting to socket server...');
            
            socketRef.current = io(SOCKET_URL, {
                transports: ['websocket'],
                timeout: 20000,
                forceNew: true,
                reconnection: true,
                reconnectionAttempts: MAX_RETRY_ATTEMPTS,
                reconnectionDelay: RETRY_DELAY,
            });

            setupSocketEventListeners();
            
        } catch (error) {
            console.error('Failed to create socket connection:', error);
            setConnectionError('Failed to initialize connection');
        }
    };

    /**
     * Disconnect from socket server
     */
    const disconnectSocket = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        
        setIsConnected(false);
        setConnectionError(null);
        setRetryCount(0);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
        updateSocketStatus(false);
        
        // Clear all event listeners
        eventListenersRef.current.clear();
    };

    /**
     * Setup socket event listeners
     */
    const setupSocketEventListeners = () => {
        const socket = socketRef.current;
        if (!socket) return;

        // Connection events
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('reconnect', handleReconnect);
        socket.on('reconnect_error', handleReconnectError);
        socket.on('reconnect_failed', handleReconnectFailed);

        // Authentication events
        socket.on('authenticated', handleAuthenticated);
        socket.on('authentication_error', handleAuthenticationError);

        // User status events
        socket.on('user_online', handleUserOnline);
        socket.on('user_offline', handleUserOffline);

        // Typing events
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stopped_typing', handleUserStoppedTyping);

        // Error handling
        socket.on('error', handleSocketError);
    };

    /**
     * Socket event handlers
     */
    const handleConnect = () => {
        console.log('Connected to socket server');
        setIsConnected(true);
        setConnectionError(null);
        setRetryCount(0);
        updateSocketStatus(true);
        
        // Authenticate with server
        if (authToken) {
            socketRef.current.emit('authenticate', authToken);
        }
    };

    const handleDisconnect = (reason) => {
        console.log('Disconnected from socket server:', reason);
        setIsConnected(false);
        updateSocketStatus(false);
        
        if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            setTimeout(() => {
                if (isLoggedIn && authToken) {
                    connectSocket();
                }
            }, RETRY_DELAY);
        }
    };

    const handleConnectError = (error) => {
        console.error('Socket connection error:', error);
        setConnectionError(`Connection failed: ${error.message}`);
        setIsConnected(false);
        updateSocketStatus(false);
    };

    const handleReconnect = (attemptNumber) => {
        console.log(`Reconnected after ${attemptNumber} attempts`);
        setConnectionError(null);
        setRetryCount(0);
    };

    const handleReconnectError = (error) => {
        console.error('Reconnection error:', error);
        setRetryCount(prev => prev + 1);
    };

    const handleReconnectFailed = () => {
        console.error('Reconnection failed after maximum attempts');
        setConnectionError('Unable to connect to chat server. Please refresh the page.');
    };

    const handleAuthenticated = (data) => {
        console.log('Socket authenticated successfully:', data);
        setConnectionError(null);
    };

    const handleAuthenticationError = (error) => {
        console.error('Socket authentication error:', error);
        setConnectionError('Authentication failed. Please refresh the page.');
    };

    const handleUserOnline = (data) => {
        const { userId, username } = data;
        setOnlineUsers(prev => new Set([...prev, userId]));
        console.log(`User ${username} is now online`);
    };

    const handleUserOffline = (data) => {
        const { userId, username } = data;
        setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
        console.log(`User ${username} is now offline`);
    };

    const handleUserTyping = (data) => {
        const { userId, username, chatId } = data;
        setTypingUsers(prev => {
            const newMap = new Map(prev);
            const chatTypingUsers = newMap.get(chatId) || new Set();
            chatTypingUsers.add(username);
            newMap.set(chatId, chatTypingUsers);
            return newMap;
        });
    };

    const handleUserStoppedTyping = (data) => {
        const { username, chatId } = data;
        setTypingUsers(prev => {
            const newMap = new Map(prev);
            const chatTypingUsers = newMap.get(chatId);
            if (chatTypingUsers) {
                chatTypingUsers.delete(username);
                if (chatTypingUsers.size === 0) {
                    newMap.delete(chatId);
                } else {
                    newMap.set(chatId, chatTypingUsers);
                }
            }
            return newMap;
        });
    };

    const handleSocketError = (error) => {
        console.error('Socket error:', error);
        setConnectionError(error.message || 'Socket error occurred');
    };

    /**
     * Public methods for components to use
     */

    // Add event listener with cleanup tracking
    const addEventListener = (event, callback) => {
        if (!socketRef.current) return;
        
        socketRef.current.on(event, callback);
        
        // Track for cleanup
        const listeners = eventListenersRef.current.get(event) || [];
        listeners.push(callback);
        eventListenersRef.current.set(event, listeners);
    };

    // Remove event listener
    const removeEventListener = (event, callback) => {
        if (!socketRef.current) return;
        
        socketRef.current.off(event, callback);
        
        // Remove from tracking
        const listeners = eventListenersRef.current.get(event) || [];
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
            eventListenersRef.current.set(event, listeners);
        }
    };

    // Emit event to server
    const emit = (event, data) => {
        if (!socketRef.current?.connected) {
            console.warn(`Cannot emit ${event}: socket not connected`);
            return false;
        }
        
        socketRef.current.emit(event, data);
        return true;
    };

    // Join a chat room
    const joinChat = (chatId) => {
        return emit('join_chat', chatId);
    };

    // Leave a chat room
    const leaveChat = (chatId) => {
        return emit('leave_chat', chatId);
    };

    // Send a message
    const sendMessage = (chatId, content, messageType = 'text') => {
        return emit('send_message', {
            chatId,
            content,
            messageType
        });
    };

    // Mark message as read
    const markMessageAsRead = (messageId, chatId) => {
        return emit('mark_message_read', {
            messageId,
            chatId
        });
    };

    // Start typing indicator
    const startTyping = (chatId) => {
        return emit('typing_start', { chatId });
    };

    // Stop typing indicator
    const stopTyping = (chatId) => {
        return emit('typing_stop', { chatId });
    };

    // Check if user is online
    const isUserOnline = (userId) => {
        return onlineUsers.has(userId);
    };

    // Get typing users for a chat
    const getTypingUsers = (chatId) => {
        return typingUsers.get(chatId) || new Set();
    };

    // Get connection status
    const getConnectionStatus = () => {
        return {
            isConnected,
            connectionError,
            retryCount,
            socket: socketRef.current
        };
    };

    // Force reconnect
    const forceReconnect = () => {
        disconnectSocket();
        if (isLoggedIn && authToken) {
            setTimeout(connectSocket, 1000);
        }
    };

    /**
     * Context value
     */
    const value = {
        // Connection state
        isConnected,
        connectionError,
        retryCount,
        
        // Real-time data
        onlineUsers,
        typingUsers,
        
        // Event management
        addEventListener,
        removeEventListener,
        emit,
        
        // Chat methods
        joinChat,
        leaveChat,
        sendMessage,
        markMessageAsRead,
        
        // Typing indicators
        startTyping,
        stopTyping,
        getTypingUsers,
        
        // User status
        isUserOnline,
        
        // Connection management
        getConnectionStatus,
        forceReconnect,
        
        // Direct socket access (use with caution)
        socket: socketRef.current
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;
