import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/buttons/buttons';
import Navbar from '../components/NavBar/navBar';
import './Search.css';
import InfiniteScroll from '../components/InfiniteScroll/InfiniteScroll';
import PostModal from '../components/PostModel/PostModel';

const API_BASE = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://api.momento.lifestyle');


function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchPage = () => {
  const [searchCategory, setCategory] = useState('All');
  const [recentSearches, setRecentSearches] = useState([]);
  // State for infinite scrolling
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);



  const query = useQuery();
  const searchParam = query.get('q');

  const hasSearched = useRef(false);
  const navigate = useNavigate();
  
  // 获取当前用户信息
  useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
          try {
              const tokenData = JSON.parse(atob(token.split('.')[1]));
              setCurrentUser({ userId: tokenData.userId, username: tokenData.username });
          } catch (e) {
              console.error('Error parsing token:', e);
          }
      }
  }, []);

  const fetchResults = async (pageNumber = 1, isNewSearch = false) => {
    if (!searchParam) return;
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(searchParam)}&type=${searchCategory.toLowerCase()}&page=${pageNumber}`);
      const data = await res.json();

      const categoryKey = searchCategory.toLowerCase();
      const items = categoryKey === 'all' ? data.results.posts || [] : data.results[categoryKey] || [];

      if (isNewSearch) {
        setResults(items);
      } else {
        setResults(prev => [...prev, ...items]);
      }

      setHasMore(items.length >= 10);
      setPage(pageNumber);
    } catch (error) {
      console.error('Search API error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchParam && !hasSearched.current) {
      hasSearched.current = true;
      fetchResults(1, true);
    }
  }, [searchParam]);

  useEffect(() => {
    fetchResults(1, true);
  }, [searchCategory]);

  const loadMoreResults = useCallback(async () => {
    if (isLoading || !hasMore) return;
    fetchResults(page + 1);
  }, [isLoading, hasMore, page]);

  const categories = ['All', 'Users', 'Posts', 'Tags', 'Places'];

  const handleSearch = () => {
    console.log("search");
  };

  const handlePostClick = (postId) => {
    navigate(`/posts/${postId}`);
  };

  const handleSearchCategory = (input) => {
    setCategory(input);
    setPage(1);
    hasSearched.current = false;
  }

  const handleClearAll = () => {
    setRecentSearches([]);
  }
  
  const handleLike = (id) => {
    alert(`Like Click: ${id}`);
  }

  const handleComment = (id) => {
    alert(`Comment Click: ${id}`);
  }

  const handleShare = (id) => {
    alert(`Share Click: ${id}`);
  }

  const handleFollow = (id) => {
    alert(`Followed`);
  }

  const trendingTags = [
    { tag: '#summertrends', posts: '12.5K posts today' },
    { tag: '#foodie', posts: '8.3K posts today' },
    { tag: '#traveldiary', posts: '6.7K posts today' },
    { tag: '#beautytips', posts: '5.2K posts today' },
  ];

  const allTrendingTafs = '#summertrends #foodie #traveldiary #beautytips';//Example


  /**
     * Format date for display
     */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };


  return (
    <div className="search-page">
      <Navbar />
      <div className="search-main-container">
        {/* Search input with button 你加一个类似search-input的class */}
        <div className="search-input-container">
          {/* SideBar */}
          <div className="category-bar">
            {categories.map((cat) => (
              <div
              key={cat}
              className={`category-tab ${searchCategory === cat ? 'active' : ''}`}
              onClick={() => handleSearchCategory(cat)}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>
        {/* Content area for search results */}
        <div className="contents-containers">
          {/* Left side - Recent searches */}
          <div className="recent-trending-container">
            <h3 className="section-title">Recent Searches</h3>
            {/* 加个列表 */}
            <div className="recent-searches-list">
              <ul>
                {recentSearches.map((item, index) => (
                  <li key={index} className="search-item">
                    {typeof item === 'object' && item !== null && 'username' in item ? (
                      <div className="user-search">
                        <img
                          src={item.avatar || 'https://via.placeholder.com/32'}
                          alt="Avatar"
                          className="avatar"
                        />
                        <span className="username">{item.username}</span>
                      </div>
                    ) : (
                      <span>{item}</span>
                    )}
                    <button className="close-btn">✕</button>
                  </li>
                ))}
              </ul>
              <Button text="Clear All" type="secondary" onClick={handleClearAll}/>
            </div>
          </div>
          {/* Right side - Trending Now */}
          <div className="trending-now-container">
            <h3 className="section-title">Trending Now</h3>
            {/* 我感觉这是个tag，可能得弄一个map？ */}
            <div className="trending-tags">
              <ul>
                {trendingTags.map((item, i) => (
                  <li key={i}>
                    <div>
                      <strong>{item.tag}</strong>
                      <div className="subtext">{item.posts}</div>
                    </div>
                    <Button text="View" type="secondary" onClick = {() => handleSearch(item.tag)}/>
                  </li>
                ))}
              </ul>
              <Button text="View All" onClick={() => handleSearch(allTrendingTafs)}/>
            </div>
          </div>
          <div className="history-container">
            <div className="content-area">
            {/* Content will appear here after search */}
              <div className = "search-result-section">
                <InfiniteScroll
                  loadMore={loadMoreResults}
                  hasMore={hasMore}
                  isLoading={isLoading}
                  loader={<div className="posts-loader">Loading more posts...</div>}
                  endMessage={<p className="posts-end-message">You've seen all posts</p>}
                >
                  <div className = "post-grid">
                      {results.map((post) => (
                          <div 
                              key={post._id || post.id} 
                              className="post-item"
                              onClick={() => handlePostClick(post._id || post.id)}
                              style={{ cursor: 'pointer' }}
                          >
                              {/* Post thumbnail - use first image if available */}
                              <div className="search-post-thumbnail">
                                  {post.media?.images?.[0]?.url ? (
                                      <img 
                                          src={post.media.images[0].url} 
                                          alt={post.media.images[0].altText || post.title}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                  ) : (
                                      <div style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          height: '100%',
                                          backgroundColor: '#f0f0f0',
                                          color: '#999'
                                      }}>
                                          {post.category}
                                      </div>
                                  )}
                              </div>
                                    
                              <div className="search-post-content">
                                  <h3 className="search-post-title">{post.title}</h3>
                                  <p className="search-post-details">
                                      {post.excerpt || post.content.substring(0, 150) + '...'}
                                  </p>
                                        
                                  {/* Post metadata */}
                                  <div className="search-post-metadata">
                                      <span className="search-post-category">{post.category}</span>
                                      <span className="search-post-date">{formatDate(post.createdAt)}</span>
                                  </div>
                                        
                                  {/* Author information */}
                                  <div className="search-post-user">
                                      <div className="search-user-avatar">
                                          {post.author?.profile?.profilePicture?.url ? (
                                              <img 
                                                  src={post.author.profile.profilePicture.url}
                                                  alt={post.author.username}
                                                  style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                                              />
                                          ) : (
                                              <div style={{ 
                                                  display: 'flex', 
                                                  alignItems: 'center', 
                                                  justifyContent: 'center',
                                                  height: '100%',
                                                  backgroundColor: '#e0e0e0',
                                                  borderRadius: '50%'
                                              }}>
                                                  {post.author?.username?.[0]?.toUpperCase()}
                                              </div>
                                          )}
                                      </div>
                                      <div className="search-author-info">
                                          <span className="search-username">
                                              {post.author?.profile?.displayName || post.author?.username}
                                          </span>
                                          {/* 关注按钮 */}
                                          {currentUser && currentUser.userId !== post.author._id && (
                                              <button 
                                                  className={`follow-btn-small ${post.author.isFollowedByUser ? 'following' : ''}`}
                                                  onClick={(e) => handleFollow(e, post.author._id)}
                                              >
                                                  {post.author.isFollowedByUser ? 'Following' : 'Follow'}
                                              </button>
                                          )}
                                      </div>
                                  </div>
                                        
                                  {/* Post statistics */}
                                  <div className="post-stats">
                                      <span>{post.likesCount || 0} likes</span>
                                      <span>{post.commentsCount || 0} comments</span>
                                      <span>{post.analytics?.views || 0} views</span>
                                  </div>
                                        
                                  {/* Action buttons */}
                                  <div className="post-actions">
                                      <button 
                                          className={`action-button ${post.isLikedByUser ? 'liked' : ''}`}
                                          onClick={(e) => handleLike(e, post._id || post.id)}
                                      >
                                          {post.isLikedByUser ? '❤️' : '🤍'} Like
                                      </button>
                                      <button 
                                          className="action-button" 
                                          onClick={(e) => handleComment(e, post._id || post.id)}
                                      >
                                          💬 Comment
                                      </button>
                                      <button 
                                          className="action-button" 
                                          onClick={(e) => handleShare(e, post._id || post.id)}
                                      >
                                          📤 Share
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
                        
                  {/* Show message when no posts are found */}
                  {!isLoading && results.length === 0 && !error && (
                      <div className="no-posts-message">
                          <h3>No posts found</h3>
                          <p>Try adjusting your filters or search query.</p>
                      </div>
                  )}
                </InfiniteScroll>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
