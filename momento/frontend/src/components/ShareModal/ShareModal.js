// frontend/src/components/ShareModal/ShareModal.js
import React, { useState, useEffect } from 'react';
import './ShareModal.css';

/**
 * ShareModal Component
 * A reusable modal component for sharing content with social media integration
 */
const ShareModal = ({ 
    isOpen, 
    onClose, 
    shareUrl, 
    title = '', 
    description = '',
    options = {}
}) => {
    const [copied, setCopied] = useState(false);
    const [shareData, setShareData] = useState(null);

    // Default options
    const defaultOptions = {
        showSocialButtons: true,
        showCopyButton: true,
        socialPlatforms: ['twitter', 'facebook', 'whatsapp'],
        theme: 'light', // 'light' or 'dark'
        size: 'medium' // 'small', 'medium', 'large'
    };

    const config = { ...defaultOptions, ...options };

    // Update share data when props change
    useEffect(() => {
        if (shareUrl && title) {
            setShareData({
                url: shareUrl,
                title: title,
                text: description || title
            });
        }
    }, [shareUrl, title, description]);

    // Handle ESC key press
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Copy to clipboard function
    const copyToClipboard = async () => {
        if (!shareUrl) return;

        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareUrl);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    // Social media share functions
    const shareOnSocialMedia = (platform) => {
        if (!shareUrl) return;

        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedTitle = encodeURIComponent(title);
        const encodedText = encodeURIComponent(description || title);
        
        let shareLink = '';
        
        switch (platform.toLowerCase()) {
            case 'twitter':
                shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
                break;
            case 'facebook':
                shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case 'whatsapp':
                shareLink = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
                break;
            case 'email':
                shareLink = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;
                break;
            default:
                console.warn(`Unsupported platform: ${platform}`);
                return;
        }
        
        if (platform === 'email') {
            window.location.href = shareLink;
        } else {
            window.open(shareLink, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
        }
    };

    // Get platform display info
    const getPlatformInfo = (platform) => {
        const platforms = {
            twitter: { name: 'Twitter', icon: '🐦', color: '#1da1f2' },
            facebook: { name: 'Facebook', icon: '📘', color: '#4267b2' },
            whatsapp: { name: 'WhatsApp', icon: '💬', color: '#25d366' },
            email: { name: 'Email', icon: '📧', color: '#666666' }
        };
        
        return platforms[platform.toLowerCase()] || { name: platform, icon: '🔗', color: '#666666' };
    };

    if (!isOpen) return null;

    return (
        <div 
            className={`share-modal-overlay ${config.theme === 'dark' ? 'dark' : ''}`}
            onClick={onClose}
        >
            <div 
                className={`share-modal-content ${config.size}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="share-modal-header">
                    <h3>Share</h3>
                    <button 
                        onClick={onClose} 
                        className="share-modal-close"
                        aria-label="Close share modal"
                    >
                        ×
                    </button>
                </div>

                {/* Content Info */}
                {title && (
                    <div className="share-content-info">
                        <h4 className="share-content-title">{title}</h4>
                        {description && (
                            <p className="share-content-description">{description}</p>
                        )}
                    </div>
                )}

                {/* Copy Link Section */}
                {config.showCopyButton && (
                    <div className="share-link-section">
                        <label htmlFor="share-url-input">Share Link:</label>
                        <div className="share-link-container">
                            <input 
                                id="share-url-input"
                                type="text" 
                                value={shareUrl || ''} 
                                readOnly 
                                className="share-link-input"
                            />
                            <button 
                                onClick={copyToClipboard}
                                className={`copy-btn ${copied ? 'copied' : ''}`}
                                disabled={!shareUrl}
                            >
                                {copied ? '✓ Copied!' : '📋 Copy'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Social Media Buttons */}
                {config.showSocialButtons && config.socialPlatforms.length > 0 && (
                    <div className="social-share-section">
                        <p>Share on social media:</p>
                        <div className="social-share-buttons">
                            {config.socialPlatforms.map((platform) => {
                                const platformInfo = getPlatformInfo(platform);
                                return (
                                    <button
                                        key={platform}
                                        onClick={() => shareOnSocialMedia(platform)}
                                        className="social-btn"
                                        style={{ backgroundColor: platformInfo.color }}
                                        disabled={!shareUrl}
                                    >
                                        <span className="social-icon">{platformInfo.icon}</span>
                                        <span className="social-name">{platformInfo.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="share-modal-footer">
                    <small>Share this content with your friends and followers</small>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
