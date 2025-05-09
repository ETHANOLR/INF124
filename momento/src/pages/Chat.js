import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Chat.css';
import Navbar from '../components/NavBar/navBar';

/**
 * Chat Page
 * 
 * Real-time messaging interface with conversation list and active chat display.
 * Features:
 * - Conversation list with search functionality
 * - Message tabs (All, Unread, Archive)
 * - Active chat display with message history
 * - Message input and sending functionality
 * - Unread indicator management
 */
const Chat = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All');
    const [selectedChat, setSelectedChat] = useState(1);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showMessageMenu, setShowMessageMenu] = useState(null);
    
    // Updated conversation data with online status
    const [conversations, setConversations] = useState([
        {
            id: 1,
            username: 'Username1',
            lastMessage: 'You: Thanks for your...',
            timestamp: '12:45',
            unread: true,
            avatar: null,
            isOnline: true  // New field
        },
        {
            id: 2,
            username: 'Username2',
            lastMessage: 'Great! See you tomorrow...',
            timestamp: 'Wed',
            unread: false,
            avatar: null,
            isOnline: false
        },
        {
            id: 3,
            username: 'Username3',
            lastMessage: 'Let me check and get back...',
            timestamp: 'Tue',
            unread: false,
            avatar: null,
            isOnline: true
        },
        {
            id: 4,
            username: 'Username4',
            lastMessage: 'That\'s amazing! Congrats...',
            timestamp: 'Mon',
            unread: false,
            avatar: null,
            isOnline: false
        }
    ]);
    
    // Updated messages with read status and deletable property
    const [allMessages, setAllMessages] = useState({
        1: [
            {
                id: 1,
                sender: 'Username1',
                content: 'Hi there! How are you doing today?',
                timestamp: '12:30 PM',
                isCurrentUser: false,
                isRead: true,
                isDeleted: false
            },
            {
                id: 2,
                sender: 'You',
                content: 'Hey! I\'m good, thanks for asking.',
                timestamp: '12:35 PM',
                isCurrentUser: true,
                isRead: true,
                isDeleted: false
            }
        ],
        2: [
            {
                id: 1,
                sender: 'You',
                content: 'Are we still on for tomorrow?',
                timestamp: '2:00 PM',
                isCurrentUser: true,
                isRead: true,
                isDeleted: false
            },
            {
                id: 2,
                sender: 'Username2',
                content: 'Yes, absolutely! See you at 3 PM.',
                timestamp: '2:05 PM',
                isCurrentUser: false,
                isRead: true,
                isDeleted: false
            },
            {
                id: 3,
                sender: 'You',
                content: 'Great! See you tomorrow then.',
                timestamp: '2:10 PM',
                isCurrentUser: true,
                isRead: false,
                isDeleted: false
            }
        ],
        3: [
            {
                id: 1,
                sender: 'Username3',
                content: 'Hey, did you get the documents I sent?',
                timestamp: '11:00 AM',
                isCurrentUser: false,
                isRead: true,
                isDeleted: false
            },
            {
                id: 2,
                sender: 'You',
                content: 'Let me check and get back to you.',
                timestamp: '11:15 AM',
                isCurrentUser: true,
                isRead: true,
                isDeleted: false
            }
        ],
        4: [
            {
                id: 1,
                sender: 'You',
                content: 'I just got promoted!',
                timestamp: '4:30 PM',
                isCurrentUser: true,
                isRead: true,
                isDeleted: false
            },
            {
                id: 2,
                sender: 'Username4',
                content: 'That\'s amazing! Congratulations! You deserve it!',
                timestamp: '4:35 PM',
                isCurrentUser: false,
                isRead: true,
                isDeleted: false
            }
        ]
    });
    
    // Handle tab switching
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };
    
    // Handle conversation selection - mark as read when clicked
    const handleConversationClick = (id) => {
        setSelectedChat(id);
        
        // Mark the conversation as read
        setConversations(prevConversations => 
            prevConversations.map(conv => 
                conv.id === id ? { ...conv, unread: false } : conv
            )
        );
        
        // Mark all messages in this conversation as read
        setAllMessages(prevMessages => ({
            ...prevMessages,
            [id]: prevMessages[id].map(msg => ({ ...msg, isRead: true }))
        }));
    };
    
    // Handle message sending
    const handleSendMessage = () => {
        if (messageInput.trim()) {
            const newMessage = {
                id: Date.now(),
                sender: 'You',
                content: messageInput,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isCurrentUser: true,
                isRead: false,
                isDeleted: false
            };
            
            setAllMessages(prevMessages => ({
                ...prevMessages,
                [selectedChat]: [...(prevMessages[selectedChat] || []), newMessage]
            }));
            
            // Update last message in conversation
            setConversations(prevConversations =>
                prevConversations.map(conv =>
                    conv.id === selectedChat
                        ? { ...conv, lastMessage: `You: ${messageInput}`, timestamp: 'Just now' }
                        : conv
                )
            );
            
            setMessageInput('');
            
            // Simulate message being read after 2 seconds
            setTimeout(() => {
                setAllMessages(prevMessages => ({
                    ...prevMessages,
                    [selectedChat]: prevMessages[selectedChat].map(msg =>
                        msg.id === newMessage.id ? { ...msg, isRead: true } : msg
                    )
                }));
            }, 2000);
        }
    };
    
    // Handle message deletion
    const handleDeleteMessage = (messageId) => {
        setAllMessages(prevMessages => ({
            ...prevMessages,
            [selectedChat]: prevMessages[selectedChat].map(msg =>
                msg.id === messageId ? { ...msg, isDeleted: true } : msg
            )
        }));
        setShowMessageMenu(null);
    };
    
    // Handle right click on message
    const handleMessageRightClick = (e, messageId) => {
        e.preventDefault();
        setShowMessageMenu(messageId);
    };
    
    // Handle click outside message menu
    const handleClickOutside = () => {
        setShowMessageMenu(null);
    };
    
    // Handle message input
    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
    };
    
    // Handle search
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };
    
    // Handle new conversation
    const handleNewMessage = () => {
        console.log('Creating new conversation');
        // this would open a dialog to create a new conversation
    };
    
    // Filter conversations based on search query
    const filteredConversations = conversations.filter(conv =>
        conv.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Get the active conversation
    const activeConversation = conversations.find(conv => conv.id === selectedChat);
    
    // Get messages for the selected chat
    const messages = allMessages[selectedChat] || [];
    
    return (
        <div className="chat-container" onClick={handleClickOutside}>
            <Navbar />
            
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
                            onClick={() => handleTabClick('All')}
                        >
                            All
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Unread' ? 'active' : ''}`}
                            onClick={() => handleTabClick('Unread')}
                        >
                            Unread
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Archive' ? 'active' : ''}`}
                            onClick={() => handleTabClick('Archive')}
                        >
                            Archive
                        </button>
                    </div>
                    
                    <div className="conversation-list">
                        {filteredConversations.map(conversation => (
                            <div
                                key={conversation.id}
                                className={`conversation-item ${selectedChat === conversation.id ? 'active' : ''}`}
                                onClick={() => handleConversationClick(conversation.id)}
                            >
                                <div className="conversation-avatar">
                                    {conversation.isOnline && <div className="online-indicator"></div>}
                                </div>
                                <div className="conversation-info">
                                    <div className="conversation-header">
                                        <span className="conversation-username">{conversation.username}</span>
                                        <span className="conversation-timestamp">{conversation.timestamp}</span>
                                    </div>
                                    <p className="conversation-preview">{conversation.lastMessage}</p>
                                </div>
                                {conversation.unread && <div className="unread-indicator"></div>}
                            </div>
                        ))}
                    </div>
                    
                    {filteredConversations.length === 0 && (
                        <div className="no-messages">No More Message</div>
                    )}
                    
                    <button className="new-message-button" onClick={handleNewMessage}>
                        +
                    </button>
                </div>
                
                {/* Right side - Active chat */}
                <div className="chat-main">
                    {activeConversation ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-user-info">
                                    <div className="chat-avatar">
                                        {activeConversation.isOnline && <div className="online-indicator"></div>}
                                    </div>
                                    <div className="chat-user-details">
                                        <span className="chat-username">{activeConversation.username}</span>
                                        {activeConversation.isOnline && <span className="online-status">Active now</span>}
                                    </div>
                                </div>
                                <button className="menu-button">⋯</button>
                            </div>
                            
                            <div className="messages-container">
                                <div className="date-divider">Today, 12:30 PM</div>
                                
                                {messages.map(message => !message.isDeleted && (
                                    <div
                                        key={message.id}
                                        className={`message ${message.isCurrentUser ? 'sent' : 'received'}`}
                                        onContextMenu={(e) => message.isCurrentUser && handleMessageRightClick(e, message.id)}
                                    >
                                        <div className="message-content">{message.content}</div>
                                        <div className="message-timestamp">
                                            {message.timestamp}
                                            {message.isCurrentUser && (
                                                <span className="read-status">
                                                    {message.isRead ? ' ✓✓' : ' ✓'}
                                                </span>
                                            )}
                                        </div>
                                        {showMessageMenu === message.id && (
                                            <div className="message-menu">
                                                <button onClick={() => handleDeleteMessage(message.id)}>Delete</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="message-input-container">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="message-input"
                                    value={messageInput}
                                    onChange={handleInputChange}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button className="send-button" onClick={handleSendMessage}>
                                    ↑
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            Select a conversation to start messaging
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
