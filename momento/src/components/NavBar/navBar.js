// components/NavBar/navBar.js
import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CircleButton } from '../buttons/buttons'; 
import './navBar.css';
import { AuthContext } from '../../contexts/AuthContext';

/**
 * Navbar Component
 * 
 * Navigation bar that adapts based on user authentication status.
 * When logged out, only displays logo and login button.
 * When logged in, displays full navigation with all icons.
 */
function Navbar() {
    const navigate = useNavigate();
    const { isLoggedIn } = useContext(AuthContext);
  
  return (
        <nav className="navbar">
        <div className="logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>Momento</div>
        
        {isLoggedIn ? (
            // Full navigation when logged in
            <div className="nav-buttons">
            <CircleButton icon="🔭" onClick={() => navigate('/explore')} />
            <CircleButton icon="🔍" onClick={() => navigate('/search')} />
            <CircleButton icon="💬" onClick={() => navigate('/chat')} />
            <CircleButton icon="🔔" onClick={() => navigate('/notifications')} />
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