import React, { useState, useEffect } from 'react';
import './Remind.css';

const Remind = ({ 
    message, 
    type = 'error', // 'success', 'warning', 'error', 'info'
    isVisible, 
    onClose, 
    duration = 5000,
    position = 'top-center' // 'top-center', 'top-right', 'bottom-center', 'bottom-right'
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);
            
            // Auto close after duration
            if (duration > 0) {
                const timer = setTimeout(() => {
                    handleClose();
                }, duration);
                
                return () => clearTimeout(timer);
            }
        }
    }, [isVisible, duration]);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => {
            onClose();
        }, 300); // Wait for animation to complete
    };

    const getIconClass = () => {
        switch (type) {
            case 'success':
                return 'remind-icon-success';
            case 'warning':
                return 'remind-icon-warning';
            case 'error':
                return 'remind-icon-error';
            case 'info':
                return 'remind-icon-info';
            default:
                return 'remind-icon-error';
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`remind-overlay ${position}`}>
            <div className={`remind ${type} ${isAnimating ? 'slide-in' : 'slide-out'}`}>
                <div className="remind-content">
                    <div className={`remind-icon ${getIconClass()}`}></div>
                    <span className="remind-message">{message}</span>
                    <button 
                        className="remind-close" 
                        onClick={handleClose}
                        aria-label="Close reminder"
                    >
                        ×
                    </button>
                </div>
                <div className={`remind-progress ${type}`}></div>
            </div>
        </div>
    );
};

// Custom hook for managing reminders
export const useRemind = () => {
    const [remind, setRemind] = useState({
        isVisible: false,
        message: '',
        type: 'info'
    });

    const showRemind = (message, type = 'info', duration = 5000) => {
        setRemind({
            isVisible: true,
            message,
            type,
            duration
        });
    };

    const hideRemind = () => {
        setRemind(prev => ({
            ...prev,
            isVisible: false
        }));
    };

    const showSuccess = (message, duration) => showRemind(message, 'success', duration);
    const showError = (message, duration) => showRemind(message, 'error', duration);
    const showWarning = (message, duration) => showRemind(message, 'warning', duration);
    const showInfo = (message, duration) => showRemind(message, 'info', duration);

    return {
        remind,
        showRemind,
        hideRemind,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
};

export default Remind;
