import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user.id && user.username && user.email) {
          validateToken(token, user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const validateToken = async (token, userData) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || (
        process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:4000/api'
      );
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const currentUser = await response.json();
        setUser(currentUser);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setUser(userData);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 w-full max-w-md mx-4">
          {showRegister ? (
            <Register 
              onLogin={handleLogin}
              onToggle={() => setShowRegister(false)}
            />
          ) : (
            <Login 
              onLogin={handleLogin}
              onToggle={() => setShowRegister(true)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-pink-900 to-purple-900">
      <Chat user={user} onLogout={handleLogout} />
    </div>
  );
}

export default App;
