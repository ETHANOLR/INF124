import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar/navBar';
import { Button } from '../components/buttons/buttons';
import './Notification.css';

const tabs = ['All', 'Likes', 'Comments', 'Follows', 'Mentions'];

const sampleNotifications = [
    { id: 1, type: 'Likes', username: 'Username1', content: 'liked your post', detail: '"Amazing sunset view from the city"', time: 'Just now', unread: true },
    { id: 2, type: 'Comments', username: 'Username2', content: 'commented on your post', detail: '"This is stunning! Where was this taken?"', time: '2h ago', unread: true },
    { id: 3, type: 'Follows', username: 'Username3', content: 'started following you', time: '5h ago', unread: true },
    { id: 4, type: 'Mentions', username: 'Username4', content: 'mentioned you in a comment', detail: '"@xxx, I think you would love this place!"', time: 'Yesterday', unread: false },
    { id: 5, type: 'Likes', username: 'Username2', content: 'liked your comment', detail: '"This looks absolutely incredible!"', time: '2 days ago', unread: false },
];

function Notification() {
    const [selectedTab, setSelectedTab] = useState('All');
    const [notifications, setNotifications] = useState(sampleNotifications);

    const filteredNotifications = selectedTab === 'All'
        ? notifications
        : notifications.filter(n => n.type === selectedTab);

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    return (
        <div>
            <Navbar/>
            <div className="notification-wrapper">
                <div className="notification-header">
                    <h2>Notifications</h2>
                    <Button text="Mark All Read" type="secondary" onClick={markAllRead}/>
                </div>

                <div className="notification-section">
                    <div className="notification-tabs">
                        {tabs.map(tab => (
                            <div
                                key={tab}
                                className={`notification-tab ${selectedTab === tab ? 'active' : ''}`}
                                onClick={() => setSelectedTab(tab)}
                            >
                                {tab}
                            </div>
                        ))}
                    </div>

                    <div className="notification-list">
                        {filteredNotifications.map(item => (
                            <div key={item.id} className={`notification-item ${item.unread ? 'unread' : ''}`}>
                                <div className="notification-avatar">
                                    {item.unread && <div className="red-dot"/>}
                                    <div className="avatar-circle"/>
                                </div>

                                <div className="notification-content">
                                    <div className="notification-text">
                                        <span className="username">{item.username}</span> {item.content}
                                    </div>
                                    {item.detail && (
                                        <div className="notification-detail">{item.detail}</div>
                                    )}
                                    {item.type === 'Follows' && (
                                        <Button
                                            text="Follow"
                                            type="primary"
                                            onClick={() => alert(`Followed back ${item.username}`)}
                                        />
                                    )}
                                </div>

                                <div className="notification-time">
                                    <div className="time-text">{item.time}</div>
                                    <div className="more-button">...</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Notification;
