// components/SearchBar.js
import React, { useState } from 'react';
import './searchBar.css';

function SearchBar({ placeholder, onSearch, style = {}}) {
    //The searchBar component, design for all searching purpose, the function will allow the user ---
    //--- type the input and press Enter key to start the searching.
    //placeholder: the initial text when user didn't type anything
    //onSearch: the function that will call when user press the Enter key(require the function only takes one input)
    //style: the style request that allows for specific styling requirement.
  const [input, setInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch(input); // calls the search function from parent
    }
  };

  return (
    <input
      type="text"
      className="search-bar"
      value={input}
      style = {style}
      placeholder={placeholder || 'Search...'}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}

export default SearchBar;
