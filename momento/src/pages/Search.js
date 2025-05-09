import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/buttons/buttons';
import Navbar from '../components/NavBar/navBar';
import '../pages/Search.css';
import PostCard from '../components/PostCard/PostCard';
import InfiniteScroll from '../components/InfiniteScroll/InfiniteScroll';


const user1 = {
  username: 'Username1',
  avatar: null
}
const user2 = {
  username: 'Username2',
  avatar: null
}

const initialSearches = [user1, '#trending', user2, '#NewYork']; //Example

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchPage = () => {
  const [searchCategory, setCategory] = useState('All');
  const [recentSearches, setRecentSearches] = useState(initialSearches);
  // State for infinite scrolling
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);


  const query = useQuery();
  const searchParam = query.get('q');

  const hasSearched = useRef(false);

  useEffect(() => {
    if (searchParam && !hasSearched.current) {
      hasSearched.current = true;
      handleSearch(searchParam);
    }
  }, [searchParam]);


  const generatePosts = (pageNumber, limit = 6) => {
    // Simulate API response time
    return new Promise((resolve) => {
        setTimeout(() => {
            // Create an array of posts for the current page
            const newPosts = Array.from({ length: limit }, (_, i) => {
                const postId = (pageNumber - 1) * limit + i + 1;
              
                // Limit total posts to 30 for demonstration
                if (postId > 30) {
                    return null;
                }
              
                return {
                  id: postId,
                  title: `Post Title ${postId}`,
                  details: `This is the description for post number ${postId}. It contains some details about the post.`,
                  username: `User${Math.floor(Math.random() * 10) + 1}`,
                  thumbnail: null, // In a real app, this would be an image URL
                };
              }).filter(Boolean); // Remove null entries (when postId > 30)
          
              resolve({
                posts: newPosts,
                hasMore: newPosts.length === limit && (pageNumber * limit) < 30
              });
          }, 800); // Simulate network delay
    });
  };

  /**
   * Load initial posts when the component mounts
   * or when activeTab or activeCategory changes
   */
  useEffect(() => {
      const loadInitialPosts = async () => {
          setIsLoading(true);
          const result = await generatePosts(1);
          setPosts(result.posts);
          setHasMore(result.hasMore);
          setPage(1);
          setIsLoading(false);
      };
          
      loadInitialPosts();
  }, [searchCategory]);

  /**
   * Load more posts when the user scrolls to the bottom
   * This function is memoized with useCallback to prevent
   * unnecessary re-renders of the InfiniteScroll component
   */
  const loadMorePosts = useCallback(async () => {
      if (isLoading) return;
          
      setIsLoading(true);
      const nextPage = page + 1;
          
      try {
          const result = await generatePosts(nextPage);
              
          setPosts(prevPosts => [...prevPosts, ...result.posts]);
          setHasMore(result.hasMore);
          setPage(nextPage);
      } catch (error) {
          console.error('Error loading more posts:', error);
      } finally {
          setIsLoading(false);
      }
  }, [isLoading, page]);

  const categories = ['All', 'Users', 'Posts', 'Tags', 'Places'];

  const handleSearch = (input) => {
    alert(`Search the input: ${input}`);
    //The Actuall Search handling will be here
  };

  const handleSearchCategory = (input) => {
    setCategory(input);
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

  const trendingTags = [
    { tag: '#summertrends', posts: '12.5K posts today' },
    { tag: '#foodie', posts: '8.3K posts today' },
    { tag: '#traveldiary', posts: '6.7K posts today' },
    { tag: '#beautytips', posts: '5.2K posts today' },
  ];

  const allTrendingTafs = '#summertrends #foodie #traveldiary #beautytips';//Example


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
                  loadMore={loadMorePosts}
                  hasMore={hasMore}
                  isLoading={isLoading}
                  loader={<div className="posts-loader">Loading more posts...</div>}
                  endMessage={<p className="posts-end-message">You've seen all posts</p>}
                >
                  <div className = "post-grid">
                    {posts.map((post) => (
                      <div key={post.id} className="post-item">
                        <div className="post-thumbnail"></div>
                        <div className="post-content">
                          <h3 className="post-title">{post.title}</h3>
                          <p className="post-details">{post.details}</p>
                          <div className="post-user">
                              <div className="user-avatar"></div>
                              <span className="username">{post.username}</span>
                          </div>
                          <div className="post-actions">
                              <button className="action-button" onClick={() => handleLike(post.id)}>Like</button>
                              <button className="action-button" onClick={() => handleComment(post.id)}>Comment</button>
                              <button className="action-button" onClick={() => handleShare(post.id)}>Share</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
