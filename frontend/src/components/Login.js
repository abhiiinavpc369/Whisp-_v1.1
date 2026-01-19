import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}`;

const Login = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post(`${API_BASE}/api/auth/register`, { userId, username, password });
        setError('User created successfully! Please log in.');
        setIsRegister(false);
      } else {
        const res = await axios.post(`${API_BASE}/api/auth/login`, { userId, password });
        localStorage.setItem('token', res.data.token);
        setError('');
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-icon">
          <i className="fas fa-comments"></i>
        </div>
        <h2>{isRegister ? 'Sign Up for Whisp' : 'Login to Whisp'}</h2>
        {isRegister && (
          <div className="input-group">
            <i className="fas fa-user input-icon"></i>
            <input
              className="login-input"
              type="text"
              placeholder="Display Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}
        <div className="input-group">
          <i className="fas fa-user input-icon"></i>
          <input
            className="login-input"
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="input-group">
          <i className="fas fa-lock input-icon"></i>
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
        </div>
        <button className="login-button" type="submit">{isRegister ? 'Sign Up' : 'Login'}</button>
        <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }} className="toggle-button">
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default Login;