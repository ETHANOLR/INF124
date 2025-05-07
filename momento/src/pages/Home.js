import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import SearchBar from '../components/SearchBar/searchBar';
import Navbar from '../components/NavBar/navBar';
import PostCard from '../components/PostCard/PostCard';

const Home = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('For You');
    const [activeCategory, setActiveCategory] = useState(null);

    // Sample post data
    const posts = [
    {
        id: 1,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null, // This place can add image paths
    },
    {
        id: 2,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null,
    },
    {
        id: 3,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null,
    },
    {
        id: 4,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null,
    },
    {
        id: 5,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null,
    },
    {
        id: 6,
        title: 'Post Title',
        details: 'Details...',
        username: 'Username',
        thumbnail: null,
    }
    ];
}