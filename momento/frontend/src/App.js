import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Notification from './pages/Notification';
import Explore from './pages/Explore';
import Chat from './pages/Chat';
import Search from './pages/Search';
import Example from './pages/ExamplePage';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthProvider from './contexts/AuthContext';
import PostCreation from './pages/PostCreation';
import Settings from './pages/Settings';
import TestPage from './pages/Test';

/**
 * Main App Component
 * 
 * Wraps the entire application in the AuthProvider context
 * to make authentication state available throughout the app.
 * Sets up all application routes.
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/search" element={<Search />} />
          <Route path="/example" element={<Example />} />
          <Route path="/create-post" element={<PostCreation />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/test" element={<TestPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
