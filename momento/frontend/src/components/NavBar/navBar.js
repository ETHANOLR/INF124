// components/NavBar/navBar.js
import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CircleButton } from '../buttons/buttons'; 
import SearchBar from '../SearchBar/searchBar';
import './navBar.css';
import { AuthContext } from '../../contexts/AuthContext';
import logoImage from '../../Momento_Transparent.png'; // Import the logo image

/**
 * Navbar Component
 * 
 * Navigation bar that adapts based on user authentication status.
 * TODO: When logged out, only displays logo and login button.
 * When logged in, displays full navigation with search bar and icons.
 */
function Navbar() {
    const navigate = useNavigate();
    const { isLoggedIn } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState('');
  
    const handleSearch = (searchQuery) => {
        navigate(`/search?q=${searchQuery}`);
    };
  
    return (
        <nav className="navbar">
            <div className="logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                <img src={logoImage} alt="Momento Logo" className="logo-image" />
                <span className="logo-text">Momento</span>
            </div>

            <SearchBar
                placeholder="Search for ..."
                onSearch={handleSearch}
                style = {{maxWidth: '500px', padding: '8px', borderRadius: '8px'}}
            />
            
            {isLoggedIn ? (
                // Full navigation when logged in
                <div className="nav-buttons">
                    <CircleButton icon="🔭" onClick={() => navigate('/explore')} />
                    {/* Search input instead of search icon */}
                    <CircleButton icon="💬" onClick={() => navigate('/chat')} />
                    <CircleButton icon="🔔" onClick={() => navigate('/notification')} />
                    <CircleButton icon="👤" onClick={() => navigate('/profile')} />
                </div>
            ) : (
                // Only login button when logged out
                <div className="login-button-container">
                    <button 
                        className="login-nav-button" 
                        onClick={() => navigate('/login')}
                    >
                        Log In
                    </button>
                </div>
            )}
        </nav>
    );
}
  
export default Navbar;
