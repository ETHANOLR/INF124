// components/InfiniteScroll/InfiniteScroll.js
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './InfiniteScroll.css';

/**
 * InfiniteScroll Component
 * A reusable component that implements infinite scrolling functionality.
 * It detects when the user has scrolled near the bottom of the content
 * and triggers the loading of more data.
 */
const InfiniteScroll = ({
    children,
    loadMore,
    hasMore,
    isLoading,
    threshold = 200,
    loader,
    endMessage
}) => {
    // Reference to the scrollable container
    const containerRef = useRef(null);
    // State to track if we're near the bottom
    const [nearBottom, setNearBottom] = useState(false);

    // Effect to handle scroll events
    useEffect(() => {
        const container = containerRef.current;
    
        // Checks if the user has scrolled near the bottom of the content
        // and triggers loading more data if needed.
        const handleScroll = () => {
            if (!container || isLoading || !hasMore) return;
      
            // Calculate distance from bottom
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
            // If we're close enough to the bottom, set the nearBottom state
            if (distanceFromBottom < threshold) {
                setNearBottom(true);
            } else {
                setNearBottom(false);
            }
        };
    
        // Add scroll event listener
        if (container) {
        container.addEventListener('scroll', handleScroll);
        }
    
        // Clean up event listener on component unmount
        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [isLoading, hasMore, threshold]);
  
    // Effect to load more data when we're near the bottom
    useEffect(() => {
        if (nearBottom && hasMore && !isLoading) {
        loadMore();
        }
    }, [nearBottom, hasMore, isLoading, loadMore]);
  
    return (
        <div className="infinite-scroll-container" ref={containerRef}>
            {/* Render the child components */}
            {children}
            
            {/* Render the loader if loading */}
            {isLoading && (
                <div className="infinite-scroll-loader">
                    {loader || <div className="default-loader"></div>}
                </div>
            )}
            
            {/* Render the end message if no more data */}
            {!hasMore && !isLoading && endMessage && (
                <div className="infinite-scroll-end-message">
                    {endMessage}
                </div>
            )}
        </div>
    );
};

// PropTypes for component validation
InfiniteScroll.propTypes = {
    children: PropTypes.node.isRequired,
    loadMore: PropTypes.func.isRequired,
    hasMore: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    threshold: PropTypes.number,
    loader: PropTypes.node,
    endMessage: PropTypes.node
};

export default InfiniteScroll;
