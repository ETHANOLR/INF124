import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();

        // Basic validation
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        
        // We do not handle the authentication with our backend now
        // we just write the login page and we will add other later
        console.log('Login attempt with:', email);
        
        // Clear any previous errors
        setError('');
        
        // Do not add function, so just redirect to home page after successful login
        navigate('/home');
    };
}