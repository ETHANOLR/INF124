import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/NavBar/navBar';
import './Explore.css';
import PostModal from '../components/PostModel/PostModel';
import axios from 'axios';
import PostCard from '../components/PostCard/PostCard';
import InfiniteScroll from '../components/InfiniteScroll/InfiniteScroll';

const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
              ? 'http://localhost:4000' 
              : 'https://api.momento.lifestyle'),
};

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

const apiService = {
  async fetchPosts({ page = 1, limit = 10, city }) {
    try {

      const params = { page, limit, city:city };
      // const params = { page, limit };

      // 在单次调用里注入 Authorization 头
      const token = localStorage.getItem('token');
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      console.log('Requesting posts with params:', params);

      const response = await api.get(`/api/posts`, {
        params, headers
      });

      // const response = await api.get('/api/posts', {
      //   params, headers
      // });
      
      console.log("Posts fetched:", response.data);

      return response.data;

    } catch (error) {
      console.error('Error fetching posts via Axios:', error);
      throw error;
    }
  },
};

const normalize = s => s.trim().split(/\s+/)
  .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');


const Explore = () => {

  const [city, setCity] = useState("Irvine");
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationStats, setLocationStats] = useState([]); 
  const [searchInput, setSearchInput] = useState(''); 
  const [suggestions, setSuggestions] = useState([]);

  const loadPosts = useCallback(async (pageNumber = 1, reset = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
        const response = await apiService.fetchPosts({
          page: pageNumber,
          limit: 10,
          city,
        });

        const { posts: newPosts, pagination } = response;
        
        if (reset) {
            setPosts(newPosts);
        } else {
            setPosts(prevPosts => [...prevPosts, ...newPosts]);
        }

        // console.log("Posts loaded:", newPosts);
        // console.log("pagination:", pagination);
        
        setHasMore(pagination.hasNextPage);
        setPage(pageNumber);
        
    } catch (error) {
        console.error('Error loading posts:', error);
        setError('Failed to load posts. Please try again.');
    } finally {
        setIsLoading(false);
    }
  }, [isLoading, city]);


  const loadMorePosts = useCallback(async () => {
      if (hasMore && !isLoading) {
          // console.log("Call loaded:", page + 1);
          await loadPosts(page + 1, false);
      }
  }, [hasMore, isLoading, page, loadPosts]);

  // get location stats
  const fetchLocationStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/posts/location-stats');
      setLocationStats(data);
      console.log('Location stats fetched:', data);
    } catch (err) {
      console.error('Error fetching location stats:', err);
    }
  }, []);
  
  useEffect(() => {
    (async () => {
      await loadPosts(1, true);
      await fetchLocationStats();
    })();
  }, [city]);

  // auto-suggest for searching cities
  useEffect(() => {
    if (searchInput.trim() === '') {
      setSuggestions([]);
      return;
    }
    const q = searchInput.trim().toLowerCase();
    const matches = locationStats
      .filter(({ city: loc }) => loc.toLowerCase().includes(q) && loc.toLowerCase() !== q)
      .slice(0, 5); // max 5 suggestions
    setSuggestions(matches);
  }, [searchInput, locationStats]);

  const onSearchSubmit = e => {
    e.preventDefault();
    if (searchInput.trim()) {
      const norm = normalize(searchInput);
      setCity(norm);
      setSearchInput('');
      setSuggestions([]);
    }
  };
  
  const onSuggestionClick = loc => {
    setCity(loc);
    setSearchInput('');
    setSuggestions([]);
  };

  return (
    <div className = "explore-main-container">
      
      <Navbar />
      <div className = "explore-main-content">

        {/* Side bar searching/choosing interested location */}
        <div className="sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Current Location: <br/>{city}</h3>
            <form className="explore-city-search-section" onSubmit={onSearchSubmit}>
              <input
                className="explore-city-search-bar"
                type="text"
                placeholder="Search city…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
              />

              {suggestions.length > 0 && (
                <ul
                  className='explore-suggestions'
                >
                  {suggestions.map(({ city: loc }) => (
                    <li key={loc}>
                      <button
                        type="button"
                        onClick={() => onSuggestionClick(loc)}
                      >
                        {loc}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </form>
          </div>

          {/* Categories section */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Popular Cities</h3>
            <ol className="explore-popular-cities">
              {locationStats.map(({ city: loc, count }) => (
                <li key={loc}>
                  <button
                    onClick={() => setCity(loc)}
                    className={loc === city ? 'active' : ''}
                  >
                    <span className="explore-city-name">{loc}</span>
                    <span className="explore-city-count">{count}</span>
                    {/* {loc} ({count}) */}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className = "content-container">
          {/* Explore Section */}
          <h3 className = "feed-title">Explore in {city}</h3>
          {/* <div className = "explore-section">
          </div> */}
          
          {/* <div className = "explore-section">
            
            <h4 className = "explore-section-title">Featured</h4>
            <div className = "popular-post-container">
                <PostCard 
                  postData={posts.at(0)}
                />
                <PostCard 
                  postData={posts.at(1)}
                  />
              <div className="explore-post-thumbnail"></div>
              <div className="explore-post-content"></div>
                
            </div>
          </div> */}
          {/* <h4 className = "explore-section-title">Popular Today</h4> */}

          <div className = "explore-feed">
            {/* Popular Today*/}
            {/* Infinite scroll container */}
            <InfiniteScroll
                loadMore={loadMorePosts}
                hasMore={hasMore}
                isLoading={isLoading}
                loader={<div className="posts-loader">Loading more posts...</div>}
                endMessage={<p className="posts-end-message">You've seen all posts!</p>}
            >
              <div className="post-grid">
                {posts.map((post) => (
                  <PostCard 
                    postData={post}
                  />
                ))}
              </div>
            </InfiniteScroll>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Explore;
