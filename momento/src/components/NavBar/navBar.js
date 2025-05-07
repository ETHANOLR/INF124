// components/Navbar.js
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CircleButton } from '../buttons/buttons'; 
import './navBar.css';

function Navbar() {
    //Deafult NavBar for every page, contain logo and the button for navigation
    const navigate = useNavigate(); // for routing
  
    return (
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>Momento</div>
        <div className="nav-buttons">
          <CircleButton icon="🔭" onClick={() => navigate('/explore')} />
          <CircleButton icon="🔍" onClick={() => navigate('/search')} />
          <CircleButton icon="💬" onClick={() => navigate('/chat')} />
          <CircleButton icon="🔔" onClick={() => navigate('/notifications')} />
          <CircleButton icon="👤" onClick={() => navigate('/profile')} />
        </div>
      </nav>
    );
  }
  
  export default Navbar;
