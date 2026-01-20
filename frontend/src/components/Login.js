import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}`;

const Login = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await axios.post(`${API_BASE}/api/auth/register`, { userId, username, password });
        displayToast('Account created successfully!');
        setIsSignup(false);
        setError('');
      } else {
        const res = await axios.post(`${API_BASE}/api/auth/login`, { userId, password });
        localStorage.setItem('token', res.data.token);
        setError('');
        displayToast('Welcome back!');
        setTimeout(() => onLogin(res.data.user), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  const toggleMode = (mode) => {
    setIsSignup(mode === 'signup');
    setError('');
  };

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#f0f2f5' }}>
      <div id="container" className={`auth-container ${isSignup ? 'signup-mode' : 'login-mode'}`}>
        {/* Sliding Overlay */}
        <div className="overlay-panel">
          <div id="overlay-login-content" className={isSignup ? 'hidden' : ''}>
            <h2 className="text-4xl font-extrabold mb-4">New Here?</h2>
            <p className="text-indigo-100 mb-8 max-w-[280px] mx-auto">Sign up and start your journey with us today.</p>
            <button onClick={() => toggleMode('signup')} className="px-10 py-3 border-2 border-white rounded-full font-bold hover:bg-white hover:text-indigo-600 transition-all duration-300">
              Sign Up
            </button>
          </div>
          <div id="overlay-signup-content" className={isSignup ? '' : 'hidden'}>
            <h2 className="text-4xl font-extrabold mb-4">Welcome Back!</h2>
            <p className="text-indigo-100 mb-8 max-w-[280px] mx-auto">To keep connected with us please login with your personal info.</p>
            <button onClick={() => toggleMode('login')} className="px-10 py-3 border-2 border-white rounded-full font-bold hover:bg-white hover:text-indigo-600 transition-all duration-300">
              Sign In
            </button>
          </div>
        </div>

        {/* Login Form Section */}
        <div className="form-section login-section">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-slate-800">Sign In</h1>
            <p className="text-slate-500 mt-2">Enter your credentials to access your account</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Username</label>
              <input
                type="text"
                placeholder="your_username"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="input-box w-full px-5 py-4 rounded-2xl outline-none text-slate-700 font-medium"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-box w-full px-5 py-4 rounded-2xl outline-none text-slate-700 font-medium"
                autoComplete="current-password"
              />
            </div>
            <div className="text-right">
              <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Forgot password?</a>
            </div>
            <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transform active:scale-[0.98] transition-all">
              Login
            </button>
          </form>

          <button onClick={() => toggleMode('signup')} className="md:hidden mt-6 text-sm font-bold text-indigo-600">Don't have an account? Sign Up</button>
        </div>

        {/* Sign Up Form Section */}
        <div className="form-section signup-section">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-800">Create Account</h1>
            <p className="text-slate-500 mt-2">Join us and explore the possibilities</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Display Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-box w-full px-5 py-3.5 rounded-2xl outline-none text-slate-700 font-medium"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Username</label>
              <input
                type="text"
                placeholder="username"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="input-box w-full px-5 py-3.5 rounded-2xl outline-none text-slate-700 font-medium"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-box w-full px-5 py-3.5 rounded-2xl outline-none text-slate-700 font-medium"
                autoComplete="new-password"
              />
            </div>
            <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transform active:scale-[0.98] transition-all mt-4">
              Get Started
            </button>
          </form>

          <button onClick={() => toggleMode('login')} className="md:hidden mt-6 text-sm font-bold text-indigo-600">Already have an account? Sign In</button>
        </div>
      </div>

      {/* Toast Notification */}
      <div id="toast" className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl transition-all duration-300 font-bold z-[100] ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
        <span>{toastMessage}</span>
      </div>

      <style jsx>{`
        .auth-container {
          width: 900px;
          max-width: 95vw;
          height: 600px;
          background: #fff;
          border-radius: 30px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          position: relative;
        }

        /* The Sliding Panel */
        .overlay-panel {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          transition: transform 0.6s cubic-bezier(0.7, 0, 0.3, 1);
          z-index: 20;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          padding: 40px;
          text-align: center;
        }

        /* Sliding Logic */
        .auth-container.signup-mode .overlay-panel {
          transform: translateX(-100%);
          border-radius: 0 30px 30px 0;
        }

        .auth-container.login-mode .overlay-panel {
          border-radius: 30px 0 0 30px;
        }

        /* Content Transition */
        .form-section {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          transition: all 0.6s ease-in-out;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-section {
          left: 0;
          z-index: 10;
        }

        .signup-section {
          left: 50%;
          z-index: 5;
          opacity: 0;
          pointer-events: none;
        }

        .auth-container.signup-mode .login-section {
          opacity: 0;
          pointer-events: none;
        }

        .auth-container.signup-mode .signup-section {
          opacity: 1;
          pointer-events: inherit;
        }

        /* Input Styling */
        .input-box {
          background: #f8fafc;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .input-box:focus {
          background: #fff;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .auth-container {
            height: auto;
            min-height: 600px;
          }
          .overlay-panel {
            display: none; /* Hide overlay on mobile for simplicity */
          }
          .form-section {
            width: 100%;
            position: relative;
            left: 0 !important;
            display: none;
          }
          .auth-container.login-mode .login-section { display: flex; }
          .auth-container.signup-mode .signup-section { display: flex; }
        }
      `}</style>
    </div>
  );
};

export default Login;