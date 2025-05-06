import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      {/* Page content goes here */}
      <h1>Home Page</h1>
      <Link to="/profile">Go to profile Page</Link>
      <p>Testing for routing</p>
    </div>
  );
};

export default Home;