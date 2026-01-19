import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3001`;

const Login = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { userId, password });
      localStorage.setItem('token', res.data.token);
      setError(false);
      onLogin(res.data.user);
    } catch (err) {
      setError(true);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-icon">
          <i className="fas fa-comments"></i>
        </div>
        <h2>Login to Whisp</h2>
        <div className="input-group">
          <i className="fas fa-user input-icon"></i>
          <input
            className="login-input"
            type="text"
            placeholder="Username"
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
            autoComplete="current-password"
          />
        </div>
        <button className="login-button" type="submit">Login</button>
        {error && <p className="error-message">Invalid credentials.</p>}
      </form>
    </div>
  );
};

export default Login;