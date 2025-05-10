import React, { useState } from 'react';
import Navbar from '../components/NavBar/navBar';
import './Explore.css';
import PostModal from '../components/PostModel/PostModel';

const Explore = () => {
  const [exploreCategory, setCategory] = useState('For you');
  const [selectedPost, setSelectedPost] = useState(null);

  const categories = ['For you', 'Trending', 'Fashion', 'Travel', 'Food', 'Beauty', 'Lifestyle', 'Technology'];

  const postsByCategory = { //Example post. the actual post will requires the data obtain from the database.
    'For you': {
      featured: {
        title: 'Featured For You Post',
        details: 'Discover top insights and tips.',
        username: 'Alice',
        thumbnail: null,
      },
      posts: [
        {
          title: 'For You Insights Vol.1',
          details: 'Latest trends you can’t miss.',
          username: 'Bob',
          thumbnail: null,
        },
        {
          title: 'For You Insights Vol.2',
          details: 'Exclusive behind-the-scenes peek.',
          username: 'Charlie',
          thumbnail: null,
        },
        {
          title: 'For You Insights Vol.3',
          details: 'Your guide to the best experiences.',
          username: 'Diana',
          thumbnail: null,
        },
      ]
    },
    'Trending': {
      featured: {
        title: 'Featured Trending Post',
        details: 'Must-have essentials of the season.',
        username: 'Eve',
        thumbnail: null,
      },
      posts: [
        {
          title: 'Trending Now Vol.1',
          details: 'Breaking into the new wave of ideas.',
          username: 'Frank',
          thumbnail: null,
        },
        {
          title: 'Trending Now Vol.2',
          details: 'Exclusive behind-the-scenes peek.',
          username: 'Grace',
          thumbnail: null,
        },
        {
          title: 'Trending Now Vol.3',
          details: 'Latest trends you can’t miss.',
          username: 'Hannah',
          thumbnail: null,
        },
      ]
    },
    'Fashion': {
      featured: {
        title: 'Featured Fashion Post',
        details: 'Top runway looks of the year.',
        username: 'Isabella',
        thumbnail: null,
      },
      posts: [
        {
          title: 'Fashion Week Recap',
          details: 'A behind-the-scenes look at style.',
          username: 'Jack',
          thumbnail: null,
        },
        {
          title: 'Street Style Highlights',
          details: 'How people are styling now.',
          username: 'Kate',
          thumbnail: null,
        },
        {
          title: 'Spring Collection Preview',
          details: 'Fresh picks from top designers.',
          username: 'Liam',
          thumbnail: null,
        },
      ]
    },
    'Travel': {
      featured: {
        title: 'Featured Travel Post',
        details: 'Top destinations of the year.',
        username: 'Maya',
        thumbnail: null,
      },
      posts: [
        {
          title: 'Backpacking Europe',
          details: 'A guide to low-budget adventures.',
          username: 'Nathan',
          thumbnail: null,
        },
        {
          title: 'Hidden Gems in Asia',
          details: 'Places most tourists miss.',
          username: 'Olivia',
          thumbnail: null,
        },
        {
          title: 'Beach Escapes Vol.1',
          details: 'Sun, sand, and serenity.',
          username: 'Paul',
          thumbnail: null,
        },
      ]
    },
    'Food': {
      featured: {
        title: 'Featured Food Post',
        details: 'Must-try dishes this season.',
        username: 'Quinn',
        thumbnail: null,
      },
      posts: [
        {
          title: 'Vegan Delights Vol.1',
          details: 'Flavorful and plant-based.',
          username: 'Rachel',
          thumbnail: null,
        },
        {
          title: 'Street Food Around the World',
          details: 'Explore global tastes.',
          username: 'Sam',
          thumbnail: null,
        },
        {
          title: 'Easy Weeknight Dinners',
          details: 'Tasty meals under 30 minutes.',
          username: 'Tina',
          thumbnail: null,
        },
      ]
    },
    'Beauty': {
      featured: {
        title: 'Featured Beauty Post',
        details: 'New skincare routines to try.',
        username: 'Uma',
        thumbnail: null,
      },
      posts: [
        {
          title: 'Makeup Trends 2024',
          details: 'The looks dominating this year.',
          username: 'Violet',
          thumbnail: null,
        },
        {
          title: 'Haircare Tips for Dry Weather',
          details: 'Keep your hair healthy and soft.',
          username: 'Wes',
          thumbnail: null,
        },
        {
          title: 'Natural Beauty Hacks',
          details: 'Simple ways to glow up.',
          username: 'Xena',
          thumbnail: null,
        },
      ]
    },
    'Lifestyle': {
      featured: {
        title: 'Featured Lifestyle Post',
        details: 'Balancing work and wellness.',
        username: 'Yara',
        thumbnail: null,
      },
      posts: [
        {
          title: 'Morning Routines That Work',
          details: 'Start your day right.',
          username: 'Zack',
          thumbnail: null,
        },
        {
          title: 'Minimalist Living Guide',
          details: 'Less is more.',
          username: 'Amy',
          thumbnail: null,
        },
        {
          title: 'Home Office Setup Ideas',
          details: 'Boost your productivity.',
          username: 'Brian',
          thumbnail: null,
        },
      ]
    },
    'Technology': {
      featured: {
        title: 'Featured Tech Post',
        details: 'Top gadgets to watch in 2024.',
        username: 'Caitlyn',
        thumbnail: null,
      },
      posts: [
        {
          title: 'AI and the Future',
          details: 'What’s next in artificial intelligence.',
          username: 'Daniel',
          thumbnail: null,
        },
        {
          title: 'Web Development Trends',
          details: 'What’s hot in frontend and backend.',
          username: 'Elena',
          thumbnail: null,
        },
        {
          title: 'Smart Home Essentials',
          details: 'Automate your living space.',
          username: 'Finn',
          thumbnail: null,
        },
      ]
    },
  };

  const { featured, posts } = postsByCategory[exploreCategory];

  const handleClickCategory = (category) => {
    setCategory(category);
  }


  return (
    <div className = "explore-main-container">
      <Navbar />
      <div className = "explore-main-content">
        <div className = "content-container">
          {/* Explore Section */}
          <div className = "explore-section">
            <h3 className = "explore-section-title">Explore</h3>
            <div className = "category-bar">
              {categories.map((cat) => (
                <div
                key={cat}
                className={`category-tab ${exploreCategory === cat ? 'active' : ''}`}
                onClick={() => handleClickCategory(cat)}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>
          
          <div className = "explore-section">
            {/* Featured*/}
            <h4 className = "explore-section-title">Featured</h4>
            <div className = "featured-post">
              <div className="explore-post-thumbnail"></div>
              <div className="explore-post-content">
                <div className = "post-title-detial">
                  <h3 className="explore-post-title">{featured.title}</h3>
                  <p className="explore-post-details">{featured.details}</p>
                </div>
                <div className="post-user">
                  <div className="explore-user-avatar"></div>
                  <span className="explore-username">{featured.username}</span>
                </div>
              </div>
            </div>
          </div>

          <div className = "explore-section">
            {/* Popular Today*/}
            <h4 className = "explore-section-title">Pupular Today</h4>
            <div className = "popular-post-container">
              {posts.map((post) => (
                <div className = "popular-post">
                  <div className = "explore-post-thumbnail"></div>
                  <div className = "explore-post-content">
                    <h3 className="explore-post-title">{post.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
