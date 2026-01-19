import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:3001`;

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and set user
      const verifyToken = async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCurrentUser(res.data);
          fetchUsers();
        } catch (err) {
          // Token invalid, remove it
          localStorage.removeItem('token');
        }
      };
      verifyToken();
    }
  }, []);

  const handleLogin = async (userData) => {
    setCurrentUser(userData);
    fetchUsers();
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_BASE}/api/friends/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch friends');
    }
  };

  const updateUsers = (updatedUsers) => {
    setUsers(updatedUsers);
  };

  return (
    <div className="App">
      {!currentUser ? <Login onLogin={handleLogin} /> : <Chat user={currentUser} users={users} onUpdateUser={setCurrentUser} onUpdateUsers={updateUsers} />}
    </div>
  );
}

export default App;