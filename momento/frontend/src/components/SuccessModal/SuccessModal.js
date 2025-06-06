import React, { useEffect } from 'react';
import './SuccessModal.css';

/**
 * SuccessModal Component
 * 
 * A beautiful, animated modal that displays success messages to users.
 * Features a checkmark animation, smooth transitions, and customizable content.
 * Can be closed by clicking the close button, overlay, or escape key.
 * Automatically focuses on the main button for accessibility.
 */
const SuccessModal = ({
    isOpen,
    onClose,
    title = "Success!",
    message = "Your action was completed successfully.",
    buttonText = "Continue",
    onButtonClick,
    autoCloseDelay = null // Optional: auto-close after specified milliseconds
}) => {
    // Handle escape key press to close modal
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            // Prevent body scrolling when modal is open
            document.body.style.overflow = 'hidden';
        }

        // Cleanup function
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Auto-close functionality
    useEffect(() => {
        if (isOpen && autoCloseDelay) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [isOpen, autoCloseDelay, onClose]);

    // Handle button click - either custom handler or default close
    const handleButtonClick = () => {
        if (onButtonClick) {
            onButtonClick();
        } else {
            onClose();
        }
    };

    // Handle overlay click to close modal
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Don't render if modal is not open
    if (!isOpen) {
        return null;
    }

    return (
        <div className="success-modal-overlay" onClick={handleOverlayClick}>
            <div className="success-modal">
                {/* Close button in top-right corner */}
                <button 
                    className="success-close-button" 
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    ×
                </button>

                {/* Success icon with animated checkmark */}
                <div className="success-icon-container">
                    <div className="success-checkmark"></div>
                </div>

                {/* Modal content */}
                <h2 className="success-title">{title}</h2>
                <p className="success-message">{message}</p>

                {/* Action button */}
                <button 
                    className="success-button"
                    onClick={handleButtonClick}
                    autoFocus
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
