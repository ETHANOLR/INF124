import React from 'react';
import { Link } from 'react-router-dom';

const Profile = () => {
  return (
    <div>
      {/* Page content goes here */}
      <h1>Profile Page</h1>
      <Link to="/home">Go to home Page</Link>
      <p>Testing for routing</p>
    </div>
  );
};

export default Profile;