import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar/navBar';
import { Button } from '../components/buttons/buttons';
import InfiniteScroll from '../components/InfiniteScroll/InfiniteScroll';
import './Chat.css';

const contactsData = [
    { id: 1, username: 'Username1', lastMessage: 'Hey! I’m good,...', time: '12:45', unread: true },
    { id: 2, username: 'Username2', lastMessage: 'Great! See you tomorrow...', time: 'Wed', unread: false },
    { id: 3, username: 'Username3', lastMessage: 'Let me check and get back...', time: 'Tue', unread: false },
    { id: 4, username: 'Username4', lastMessage: 'That’s amazing! Congrats...', time: 'Mon', unread: false }
];

const Chat = () => {
    const [contacts, setContacts] = useState(contactsData);
    const [selectedContact, setSelectedContact] = useState(contactsData[0]);
    const [messages, setMessages] = useState([
        { id: 1, sender: 'them', text: 'Hi there! How are you doing today?', time: '12:30 PM' },
        { id: 2, sender: 'me', text: 'Hey! I’m good, thanks for asking.', time: '12:35 PM' }
    ]);
    const [input, setInput] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const handleSend = () => {
        if (input.trim()) {
            setMessages([...messages, {
                id: messages.length + 1,
                sender: 'me',
                text: input,
                time: '12:50 PM'
            }]);

            setContacts(prevContacts =>
                prevContacts.map(contact =>
                    contact.id === selectedContact.id
                        ? {
                            ...contact,
                            unread: false,
                            lastMessage: `${input}`
                        }
                        : contact
                )
            );

            setInput('');
        }
    };

    return (
        <div className="chatpage">
            <Navbar />
            <div className="chat-container">
                {/* Left panel */}
                <div className="contacts-panel">
                    <h3>Messages</h3>
                    <input
                        className="search-input"
                        placeholder="Search messages..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <div className="contacts-list">
                        {contacts.map(contact => (
                            <div
                                key={contact.id}
                                className={`contact-item ${selectedContact.id === contact.id ? 'active' : ''}`}
                                onClick={() => setSelectedContact(contact)}
                            >
                                <div className="avatar">
                                    {contact.unread && <div className="red-dot" />}
                                </div>
                                <div className="contact-info">
                                    <div className="contact-top">
                                        <span className="username">{contact.username}</span>
                                        <span className="time">{contact.time}</span>
                                    </div>
                                    <div className="last-message">{contact.lastMessage}</div>
                                </div>
                            </div>
                        ))}
                        <div className="no-more-message">No More Message</div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="chat-panel">
                    <div className="chat-header">
                        <div className="chat-avatar"></div>
                        <span className="chat-username">{selectedContact.username}</span>
                        <div className="chat-more">...</div>
                    </div>

                    <div className="chat-body">
                        <div className="messages">
                            {messages.map(msg => (
                                <div key={msg.id} className={`message ${msg.sender === 'me' ? 'me' : 'them'}`}>
                                    <div className="bubble">{msg.text}</div>
                                    <div className="msg-time">{msg.time}</div>
                                </div>
                            ))}
                        </div>

                        <div className="chatbox">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                            <div className="send-btn" onClick={handleSend}>↑</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;