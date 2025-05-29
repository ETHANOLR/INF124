import React, { useState } from 'react';
import Navbar from '../components/NavBar/navBar';
import { Button, CircleButton } from '../components/buttons/buttons';
import SearchBar from '../components/SearchBar/searchBar';
import PostCard from '../components/PostCard/PostCard';

function ComponentShowcase() {
    
    const handleSearch = (searchText) => { //search function
        alert(`Search submitted with: ${searchText}`);
    }

  return (
    <div>
      <Navbar />

      <div className="showcase-container">
        <h2>🔧 Component Showcase</h2>

        <section>
            <h3>SearchBar</h3>
            <SearchBar 
                placeholder="Search here..."
                onSearch={handleSearch}
                style={{ maxWidth: '300px', padding: '8px', borderRadius: '8px' }}
            />
        </section>


        <section>
          <h3>Buttons</h3>
          <div className="button-row">
            <Button text="Primary" onClick={() => alert('Primary clicked')} />
            <Button text="Secondary" onClick={() => alert('Secondary clicked')} type = 'secondary' />
            <CircleButton icon="🧭" onClick={() => alert('Explore clicked')} />
          </div>
        </section>

        <section>
          <h3>PostCard</h3>
          <PostCard
            title="Post Title"
            detail="Details..."
            username="Username"
            avatar={<img src="https://via.placeholder.com/32" alt="Avatar" style={{ borderRadius: '50%' }} />}
            thumbnail="https://via.placeholder.com/300x150"
            onLike={() => alert('Liked')}
            onComment={() => alert('Commented')}
            onShare={() => alert('Shared')}
          />
        </section>
      </div>
    </div>
  );
}

export default ComponentShowcase;
