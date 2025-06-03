// frontend/src/pages/Chat.js
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './Chat.css';
import Navbar from '../components/NavBar/navBar';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Real-time Chat Page Component
 * 
 * Features:
 * - Real-time messaging with WebSocket connection
 * - Conversation list with search functionality
 * - Message tabs (All, Unread, Archive)
 * - Active chat display with message history
 * - Typing indicators and read receipts
 * - Online/offline status indicators
 * - Message pagination and search
 * - Optimistic UI updates with deduplication
 * - Fixed ID handling and error management
 * - Message persistence after leaving/returning to page
 */

const Chat = () => {
    const navigate = useNavigate();
    const { currentUser, authToken, isLoggedIn, updateSocketStatus } = useContext(AuthContext);
    
    // Socket connection reference
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    
    // Component state
    const [activeTab, setActiveTab] = useState('All');
    const [selectedChat, setSelectedChat] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [showMessageMenu, setShowMessageMenu] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    
    // Data state
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState({});
    const [unreadCounts, setUnreadCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    
    // New chat modal state
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    
    // Typing timeout reference
    const typingTimeoutRef = useRef(null);

    /**
     * Helper function to validate ObjectId format
     */
    const isValidObjectId = (id) => {
        return id && id !== 'undefined' && id !== 'null' && typeof id === 'string' && id.length === 24;
    };

    /**
     * Helper function to get consistent chat ID
     */
    const getChatId = (chat) => {
        if (!chat) return null;
        return chat._id || chat.id;
    };

    /**
     * Helper function to standardize chat object
     */
    const standardizeChat = (chat) => {
        if (!chat) return null;
        const chatId = getChatId(chat);
        return {
            ...chat,
            id: chatId,
            _id: chatId
        };
    };

    /**
     * Initialize socket connection and authentication
     */
    useEffect(() => {
        if (!isLoggedIn || !authToken) {
            navigate('/login');
            return;
        }

        initializeSocket();
        fetchConversations();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [isLoggedIn, authToken]);

    /**
     * Initialize WebSocket connection
     */
    const initializeSocket = () => {
        try {
            console.log('Initializing socket connection...');
            
            socketRef.current = io('http://localhost:4000', {
                transports: ['websocket'],
                timeout: 20000,
            });

            const socket = socketRef.current;

            // Connection event handlers
            socket.on('connect', () => {
                console.log('Connected to socket server');
                setIsConnected(true);
                setConnectionError(null);
                updateSocketStatus(true);
                
                // Authenticate with the server
                socket.emit('authenticate', authToken);
            });

            socket.on('disconnect', () => {
                console.log('Disconnected from socket server');
                setIsConnected(false);
                updateSocketStatus(false);
            });

            socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setConnectionError('Failed to connect to chat server');
                setIsConnected(false);
                updateSocketStatus(false);
            });

            // Authentication handlers
            socket.on('authenticated', (data) => {
                console.log('Socket authenticated successfully:', data);
                setConnectionError(null);
            });

            socket.on('authentication_error', (error) => {
                console.error('Socket authentication error:', error);
                setConnectionError('Authentication failed');
            });

            // Message handlers
            socket.on('new_message', handleIncomingMessage);
            socket.on('message_read', handleMessageRead);

            // Typing indicators
            socket.on('user_typing', handleUserTyping);
            socket.on('user_stopped_typing', handleUserStoppedTyping);

            // Online status
            socket.on('user_online', handleUserOnline);
            socket.on('user_offline', handleUserOffline);

            // Error handler
            socket.on('error', (error) => {
                console.error('Socket error:', error);
                setConnectionError(error.message);
            });

        } catch (error) {
            console.error('Failed to initialize socket:', error);
            setConnectionError('Failed to initialize chat connection');
        }
    };

    /**
     * Fetch user's conversations from API
     */
    const fetchConversations = async () => {
        try {
            setLoading(true);
            console.log('Fetching conversations...');
            
            const response = await fetch('/api/chats', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const chats = await response.json();
                console.log(`Fetched ${chats.length} conversations`);
                
                // Standardize all chat objects
                const standardizedChats = chats.map(standardizeChat);
                setConversations(standardizedChats);
                
                // Extract unread counts
                const unreadMap = {};
                standardizedChats.forEach(chat => {
                    const chatId = getChatId(chat);
                    if (chatId) {
                        unreadMap[chatId] = chat.unreadCount || 0;
                    }
                });
                setUnreadCounts(unreadMap);

                // Join chat rooms via socket
                if (socketRef.current && socketRef.current.connected) {
                    standardizedChats.forEach(chat => {
                        const chatId = getChatId(chat);
                        if (isValidObjectId(chatId)) {
                            socketRef.current.emit('join_chat', chatId);
                        } else {
                            console.warn('Invalid chat ID for joining:', chatId);
                        }
                    });
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch conversations');
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            setConnectionError(`Failed to load conversations: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Enhanced fetch messages for a specific chat
     * Now supports force reload option
     */
    const fetchMessages = async (chatId, forceReload = false) => {
        try {
            console.log(`Fetching messages for chat: ${chatId}${forceReload ? ' (forced reload)' : ''}`);
            
            if (!isValidObjectId(chatId)) {
                console.error('Invalid chatId for fetchMessages:', chatId);
                setConnectionError('Invalid chat selected');
                return;
            }

            // Check if we already have messages and don't need to force reload
            const existingMessages = messages[chatId];
            if (!forceReload && existingMessages && existingMessages.length > 0) {
                console.log(`Using cached messages for chat ${chatId} (${existingMessages.length} messages)`);
                return existingMessages;
            }

            setLoadingMessages(true);
            const response = await fetch(`/api/chats/${chatId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const chatMessages = await response.json();
                console.log(`Loaded ${chatMessages.length} messages for chat ${chatId}`);
                setMessages(prev => ({
                    ...prev,
                    [chatId]: chatMessages
                }));
                return chatMessages;
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch messages');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setConnectionError(`Failed to load messages: ${error.message}`);
            return [];
        } finally {
            setLoadingMessages(false);
        }
    };

    /**
     * Handle incoming new messages from socket
     * Fixed to prevent duplication with optimistic updates
     */
    const handleIncomingMessage = useCallback((messageData) => {
        console.log('=== INCOMING MESSAGE DEBUG ===');
        console.log('Message data:', messageData);
        
        const { chatId, ...message } = messageData;
        
        if (!isValidObjectId(chatId)) {
            console.error('Received message with invalid chatId:', chatId);
            return;
        }
        
        // Add message to chat, but filter out optimistic duplicates
        setMessages(prev => {
            const currentMessages = prev[chatId] || [];
            
            // Check if this message is replacing an optimistic message
            const optimisticIndex = currentMessages.findIndex(msg => 
                msg.isOptimistic && 
                msg.sender._id === message.sender._id && 
                msg.content === message.content &&
                Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 10000 // Within 10 seconds
            );
            
            let updatedMessages;
            if (optimisticIndex !== -1) {
                // Replace optimistic message with real message
                updatedMessages = [...currentMessages];
                updatedMessages[optimisticIndex] = { ...message, isOptimistic: false };
                console.log('Replaced optimistic message with real message');
            } else {
                // Check for exact duplicates (same message ID or content + sender + timestamp)
                const isDuplicate = currentMessages.some(msg => 
                    msg._id === message._id || 
                    (msg.sender._id === message.sender._id && 
                     msg.content === message.content && 
                     Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 1000) // Within 1 second
                );
                
                if (!isDuplicate) {
                    // Add new message
                    updatedMessages = [...currentMessages, message];
                    console.log('Added new message');
                } else {
                    console.log('Duplicate message detected, skipping');
                    updatedMessages = currentMessages;
                }
            }
            
            return {
                ...prev,
                [chatId]: updatedMessages
            };
        });

        // Update conversation list
        setConversations(prev => prev.map(conv => {
            const convId = getChatId(conv);
            if (convId === chatId) {
                return {
                    ...conv,
                    lastMessage: {
                        content: message.content,
                        timestamp: message.timestamp,
                        sender: message.sender
                    },
                    lastActivity: message.timestamp
                };
            }
            return conv;
        }));

        // Update unread count if not current chat or not sender
        const currentChatId = getChatId(selectedChat);
        if (currentChatId !== chatId && message.sender._id !== currentUser?.id) {
            setUnreadCounts(prev => ({
                ...prev,
                [chatId]: (prev[chatId] || 0) + 1
            }));
        }

        // Auto-scroll to bottom if in current chat
        if (currentChatId === chatId) {
            setTimeout(scrollToBottom, 100);
        }

        console.log('Message processed successfully');
        console.log('==============================');
    }, [selectedChat, currentUser]);

    /**
     * Handle message read status updates
     */
    const handleMessageRead = useCallback((data) => {
        const { messageId, userId, chatId } = data;
        
        if (!isValidObjectId(chatId) || !isValidObjectId(messageId)) {
            return;
        }
        
        setMessages(prev => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map(msg =>
                msg._id === messageId
                    ? {
                        ...msg,
                        readBy: [...(msg.readBy || []), { user: userId, readAt: new Date() }]
                    }
                    : msg
            )
        }));
    }, []);

    /**
     * Handle typing indicators
     */
    const handleUserTyping = useCallback((data) => {
        const { userId, username, chatId } = data;
        const currentChatId = getChatId(selectedChat);
        
        if (currentChatId === chatId && userId !== currentUser?.id) {
            setTypingUsers(prev => new Set([...prev, username]));
        }
    }, [selectedChat, currentUser]);

    const handleUserStoppedTyping = useCallback((data) => {
        const { username } = data;
        setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(username);
            return newSet;
        });
    }, []);

    /**
     * Handle online status updates
     */
    const handleUserOnline = useCallback((data) => {
        const { userId } = data;
        setOnlineUsers(prev => new Set([...prev, userId]));
        
        // Update conversation list
        setConversations(prev => prev.map(conv => ({
            ...conv,
            participants: conv.participants.map(participant =>
                participant._id === userId
                    ? { ...participant, activity: { ...participant.activity, isOnline: true } }
                    : participant
            )
        })));
    }, []);

    const handleUserOffline = useCallback((data) => {
        const { userId } = data;
        setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
        
        // Update conversation list
        setConversations(prev => prev.map(conv => ({
            ...conv,
            participants: conv.participants.map(participant =>
                participant._id === userId
                    ? { ...participant, activity: { ...participant.activity, isOnline: false } }
                    : participant
            )
        })));
    }, []);

    /**
     * Handle conversation selection - Fixed for message persistence
     * Always loads messages to ensure history is available
     */
    const handleConversationClick = async (conversation) => {
        try {
            console.log('=== CONVERSATION CLICK DEBUG ===');
            console.log('Conversation object:', conversation);
            
            const chatId = getChatId(conversation);
            console.log('Extracted chatId:', chatId);
            console.log('Is valid ObjectId:', isValidObjectId(chatId));
            
            if (!isValidObjectId(chatId)) {
                console.error('Invalid conversation - missing or invalid ID:', conversation);
                setConnectionError('Invalid conversation selected');
                return;
            }

            // Create standardized chat object
            const standardizedChat = standardizeChat(conversation);
            setSelectedChat(standardizedChat);
            
            // Mark as read
            setUnreadCounts(prev => ({
                ...prev,
                [chatId]: 0
            }));

            // 🔧 CRITICAL FIX: Always reload messages to ensure persistence
            // This ensures that when users return to the chat page, they see their history
            console.log('Loading messages for conversation...');
            await fetchMessages(chatId, true); // Force reload every time

            // Join chat room
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('join_chat', chatId);
            }

            // Scroll to bottom
            setTimeout(scrollToBottom, 100);
            
            console.log('Conversation selected and messages loaded successfully');
            console.log('===============================');
        } catch (error) {
            console.error('Error selecting conversation:', error);
            setConnectionError('Failed to select conversation');
        }
    };

    /**
     * Handle message persistence when returning to the page
     * This ensures messages are reloaded if the user left and came back
     */
    useEffect(() => {
        // When component mounts and there's a selected chat but no messages, reload them
        if (selectedChat && isLoggedIn && authToken && isConnected) {
            const chatId = getChatId(selectedChat);
            if (isValidObjectId(chatId)) {
                const currentMessages = messages[chatId];
                
                console.log('=== PAGE RETURN MESSAGE CHECK ===');
                console.log('Selected chat on return:', chatId);
                console.log('Messages in state:', currentMessages?.length || 0);
                
                // If no messages in state (user returned to page), reload them
                if (!currentMessages || currentMessages.length === 0) {
                    console.log('No messages found in state, reloading due to page return...');
                    fetchMessages(chatId, true); // Force reload
                }
                console.log('===================================');
            }
        }
    }, [selectedChat, isLoggedIn, authToken, isConnected]);

    /**
     * Handle socket reconnection scenarios
     * Reload messages and rejoin chat rooms when socket reconnects
     */
    useEffect(() => {
        if (isConnected && selectedChat) {
            const chatId = getChatId(selectedChat);
            if (isValidObjectId(chatId)) {
                // Rejoin chat room on reconnection
                console.log('Socket reconnected, rejoining chat room...');
                socketRef.current?.emit('join_chat', chatId);
                
                // Check if we need to reload messages
                const currentMessages = messages[chatId];
                if (!currentMessages || currentMessages.length === 0) {
                    console.log('Socket reconnected, reloading messages...');
                    setTimeout(() => fetchMessages(chatId, true), 500);
                }
            }
        }
    }, [isConnected, selectedChat]);

    /**
     * Handle sending messages
     * Enhanced with better optimistic update handling
     */
    const handleSendMessage = () => {
        console.log('=== SEND MESSAGE DEBUG ===');
        console.log('Message input:', messageInput.trim());
        console.log('Selected chat:', selectedChat);
        console.log('Socket connected:', socketRef.current?.connected);
        
        if (!messageInput.trim() || !selectedChat || !socketRef.current?.connected) {
            console.warn('Cannot send message - missing requirements');
            return;
        }

        const chatId = getChatId(selectedChat);
        console.log('Chat ID for sending:', chatId);
        console.log('Is valid ObjectId:', isValidObjectId(chatId));
        
        if (!isValidObjectId(chatId)) {
            console.error('No valid chat ID for sending message');
            setConnectionError('Invalid chat selected');
            return;
        }

        // Create optimistic message with unique temporary ID
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const messageContent = messageInput.trim();
        const tempMessage = {
            _id: tempId,
            content: messageContent,
            sender: {
                _id: currentUser.id,
                username: currentUser.username,
                profilePicture: currentUser.profile?.profilePicture
            },
            timestamp: new Date(),
            tempId: tempId,
            isOptimistic: true // Mark as optimistic for replacement later
        };

        // Optimistic update
        setMessages(prev => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), tempMessage]
        }));

        // Clear input and stop typing immediately for better UX
        setMessageInput('');
        handleStopTyping();

        // Send via socket
        const messageData = {
            chatId: chatId,
            content: messageContent,
            messageType: 'text'
        };
        
        console.log('Sending message data:', messageData);
        
        // Send message and handle potential failure
        try {
            socketRef.current.emit('send_message', messageData);
            console.log('Message sent successfully');
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove optimistic message on failure
            setMessages(prev => ({
                ...prev,
                [chatId]: (prev[chatId] || []).filter(msg => msg._id !== tempId)
            }));
            // Restore input
            setMessageInput(messageContent);
            setConnectionError('Failed to send message');
        }
        
        // Scroll to bottom
        setTimeout(scrollToBottom, 100);
        
        console.log('=========================');
    };

    /**
     * Handle typing start
     */
    const handleStartTyping = () => {
        const chatId = getChatId(selectedChat);
        
        if (!isTyping && isValidObjectId(chatId) && socketRef.current?.connected) {
            setIsTyping(true);
            socketRef.current.emit('typing_start', { chatId });
        }

        // Reset typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            handleStopTyping();
        }, 3000);
    };

    /**
     * Handle typing stop
     */
    const handleStopTyping = () => {
        const chatId = getChatId(selectedChat);
        
        if (isTyping && isValidObjectId(chatId) && socketRef.current?.connected) {
            setIsTyping(false);
            socketRef.current.emit('typing_stop', { chatId });
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    };

    /**
     * Handle message input change
     */
    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        
        if (e.target.value.trim()) {
            handleStartTyping();
        } else {
            handleStopTyping();
        }
    };

    /**
     * Handle search input change
     */
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    /**
     * Handle new chat creation (open modal)
     */
    const handleCreateNewChat = async () => {
        console.log('Opening new chat modal');
        setShowNewChatModal(true);
        setUserSearchQuery('');
        setFetchError(null);
        await fetchAvailableUsers();
    };

    /**
     * Fetch available users for new chat
     */
    const fetchAvailableUsers = async () => {
        try {
            setSearchingUsers(true);
            setFetchError(null);
            
            console.log('Fetching available users...');
            console.log('Auth token present:', !!authToken);

            if (!authToken) {
                throw new Error('Authentication required. Please log in again.');
            }

            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Expected JSON but got:', text.slice(0, 200));
                throw new Error('Server returned non-JSON response');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const users = await response.json();
            console.log('Users fetched successfully:', users.length);

            if (!Array.isArray(users)) {
                throw new Error('Invalid response format from server');
            }

            setAvailableUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            setFetchError(error.message);
            setAvailableUsers([]);
        } finally {
            setSearchingUsers(false);
        }
    };

    /**
     * Create new chat with selected user
     */
    const createNewChat = async (userId) => {
        try {
            console.log('Creating chat with user:', userId);
            
            if (!authToken) {
                throw new Error('Authentication required');
            }

            if (!isValidObjectId(userId)) {
                throw new Error('Invalid user ID');
            }

            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ participantId: userId })
            });

            console.log('Create chat response status:', response.status);

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `${errorMessage}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const newChat = await response.json();
            console.log('Chat created successfully:', newChat);
            
            // Standardize the new chat
            const standardizedChat = standardizeChat(newChat);
            
            setConversations(prev => [standardizedChat, ...prev]);
            setSelectedChat(standardizedChat);
            setShowNewChatModal(false);
            setUserSearchQuery('');
            setFetchError(null);
            
            // Join chat room via socket
            const chatId = getChatId(standardizedChat);
            if (socketRef.current && socketRef.current.connected && isValidObjectId(chatId)) {
                socketRef.current.emit('join_chat', chatId);
            }
            
        } catch (error) {
            console.error('Error creating chat:', error);
            setFetchError(`Failed to create chat: ${error.message}`);
        }
    };

    /**
     * Scroll to bottom of messages
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    /**
     * Format timestamp for display
     */
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    /**
     * Get other participant in direct chat
     */
    const getOtherParticipant = (chat) => {
        if (!chat || !currentUser) return null;
        return chat.participants.find(p => p._id !== currentUser.id);
    };

    /**
     * Get chat display name
     */
    const getChatDisplayName = (chat) => {
        if (chat.type === 'group') {
            return chat.groupInfo?.name || 'Unnamed Group';
        }
        const otherParticipant = getOtherParticipant(chat);
        return otherParticipant?.username || 'Unknown User';
    };

    /**
     * Check if user is online
     */
    const isUserOnline = (userId) => {
        return onlineUsers.has(userId);
    };

    /**
     * Filter conversations based on search query
     */
    const filteredConversations = conversations.filter(conv => {
        const displayName = getChatDisplayName(conv).toLowerCase();
        const lastMessageContent = conv.lastMessage?.content?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return displayName.includes(query) || lastMessageContent.includes(query);
    });

    /**
     * Filter users based on search query
     */
    const filteredUsers = availableUsers.filter(user => {
        if (!userSearchQuery.trim()) return true;
        
        const query = userSearchQuery.toLowerCase();
        const username = user.username?.toLowerCase() || '';
        const displayName = user.profile?.displayName?.toLowerCase() || '';
        
        return username.includes(query) || displayName.includes(query);
    });

    /**
     * Get messages for selected chat
     */
    const currentMessages = selectedChat ? (messages[getChatId(selectedChat)] || []) : [];

    if (!isLoggedIn) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="chat-container">
            <Navbar />
            
            {/* Connection status indicator */}
            {!isConnected && (
                <div className="connection-status error">
                    {connectionError || 'Connecting to chat server...'}
                </div>
            )}
            
            <div className="chat-content">
                {/* Left sidebar - Conversation list */}
                <div className="chat-sidebar">
                    <div className="sidebar-header">
                        <h2>Messages</h2>
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="search-input"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                    
                    <div className="message-tabs">
                        <button
                            className={`tab-button ${activeTab === 'All' ? 'active' : ''}`}
                            onClick={() => setActiveTab('All')}
                        >
                            All
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Unread' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Unread')}
                        >
                            Unread
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Archive' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Archive')}
                        >
                            Archive
                        </button>
                    </div>
                    
                    <div className="conversation-list">
                        {loading ? (
                            <div className="no-messages">Loading conversations...</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="no-messages">No conversations found</div>
                        ) : (
                            filteredConversations.map(conversation => {
                                const otherParticipant = getOtherParticipant(conversation);
                                const isOnline = otherParticipant && isUserOnline(otherParticipant._id);
                                const chatId = getChatId(conversation);
                                const unreadCount = unreadCounts[chatId] || 0;
                                const isActive = getChatId(selectedChat) === chatId;
                                
                                return (
                                    <div
                                        key={chatId}
                                        className={`conversation-item ${isActive ? 'active' : ''}`}
                                        onClick={() => handleConversationClick(conversation)}
                                    >
                                        <div className="conversation-avatar">
                                            {otherParticipant?.profile?.profilePicture?.url ? (
                                                <img 
                                                    src={otherParticipant.profile.profilePicture.url} 
                                                    alt={getChatDisplayName(conversation)}
                                                />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {getChatDisplayName(conversation).charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {isOnline && <div className="online-indicator"></div>}
                                        </div>
                                        <div className="conversation-info">
                                            <div className="conversation-header">
                                                <span className="conversation-username">
                                                    {getChatDisplayName(conversation)}
                                                </span>
                                                <span className="conversation-timestamp">
                                                    {conversation.lastMessage && formatTimestamp(conversation.lastMessage.timestamp)}
                                                </span>
                                            </div>
                                            <p className="conversation-preview">
                                                {conversation.lastMessage?.content || 'No messages yet'}
                                            </p>
                                        </div>
                                        {unreadCount > 0 && (
                                            <div className="unread-indicator">
                                                <span className="unread-count">{unreadCount}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                    
                    <button className="new-message-button" onClick={handleCreateNewChat}>
                        +
                    </button>
                </div>
                
                {/* Right side - Active chat */}
                <div className="chat-main">
                    {selectedChat ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-user-info">
                                    <div className="chat-avatar">
                                        {getOtherParticipant(selectedChat)?.profile?.profilePicture?.url ? (
                                            <img 
                                                src={getOtherParticipant(selectedChat).profile.profilePicture.url} 
                                                alt={getChatDisplayName(selectedChat)}
                                            />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {getChatDisplayName(selectedChat).charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {getOtherParticipant(selectedChat) && 
                                         isUserOnline(getOtherParticipant(selectedChat)._id) && 
                                         <div className="online-indicator"></div>}
                                    </div>
                                    <div className="chat-user-details">
                                        <span className="chat-username">{getChatDisplayName(selectedChat)}</span>
                                        {getOtherParticipant(selectedChat) && 
                                         isUserOnline(getOtherParticipant(selectedChat)._id) && 
                                         <span className="online-status">Active now</span>}
                                    </div>
                                </div>
                                <button className="menu-button">⋯</button>
                            </div>
                            
                            <div className="messages-container">
                                {loadingMessages ? (
                                    <div className="loading-messages">Loading messages...</div>
                                ) : (
                                    <>
                                        {currentMessages.map(message => (
                                            <div
                                                key={message._id}
                                                className={`message ${message.sender._id === currentUser?.id ? 'sent' : 'received'} ${message.isOptimistic ? 'optimistic' : ''}`}
                                            >
                                                <div className="message-content">{message.content}</div>
                                                <div className="message-timestamp">
                                                    {formatTimestamp(message.timestamp)}
                                                    {message.sender._id === currentUser?.id && (
                                                        <span className="read-status">
                                                            {message.readBy?.length > 1 ? ' ✓✓' : ' ✓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {/* Typing indicator */}
                                        {typingUsers.size > 0 && (
                                            <div className="typing-indicator">
                                                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                                            </div>
                                        )}
                                        
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>
                            
                            <div className="message-input-container">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="message-input"
                                    value={messageInput}
                                    onChange={handleInputChange}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={!isConnected}
                                />
                                <button 
                                    className="send-button" 
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || !isConnected}
                                >
                                    ↑
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <h3>Welcome to Messages</h3>
                            <p>Select a conversation to start messaging</p>
                            {!isConnected && (
                                <p className="connection-warning">
                                    Chat server is disconnected. Some features may not work.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Start New Conversation</h3>
                            <button className="close-button" onClick={() => setShowNewChatModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Search input */}
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 15px',
                                    border: '1px solid #ddd',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    marginBottom: '20px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            
                            {/* Error display */}
                            {fetchError && (
                                <div style={{
                                    background: '#fee',
                                    color: '#c33',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    marginBottom: '20px',
                                    fontSize: '14px'
                                }}>
                                    <strong>Error:</strong> {fetchError}
                                    <button 
                                        onClick={fetchAvailableUsers}
                                        style={{
                                            marginLeft: '10px',
                                            background: '#c33',
                                            color: 'white',
                                            border: 'none',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                            
                            {searchingUsers ? (
                                <div className="loading">Loading users...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                    {fetchError ? 
                                        'Failed to load users' : 
                                        (userSearchQuery ? 'No users found matching your search' : 'No users available')
                                    }
                                </div>
                            ) : (
                                <div className="user-list">
                                    {filteredUsers.map(user => (
                                        <div
                                            key={user._id}
                                            className="user-item"
                                            onClick={() => createNewChat(user._id)}
                                        >
                                            <div className="user-avatar">
                                                {user.profile?.profilePicture?.url ? (
                                                    <img src={user.profile.profilePicture.url} alt={user.username} />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {(user.profile?.displayName || user.username).charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                {isUserOnline(user._id) && <div className="online-indicator"></div>}
                                            </div>
                                            <div className="user-info">
                                                <span className="username">
                                                    {user.profile?.displayName || user.username}
                                                </span>
                                                {isUserOnline(user._id) && <span className="online-text">Online</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
