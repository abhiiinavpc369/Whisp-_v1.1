import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}`;

const ProfileSettings = ({ user, onUpdate, onLogout }) => {
  const [activeSection, setActiveSection] = useState('account');
  const [settings, setSettings] = useState({
    username: user.username || '',
    displayName: user.displayName || '',
    bio: user.bio || '',
    status: user.status || 'Online',
    profilePicture: user.profilePicture || '',
    password: '',
    confirmPassword: '',
    // Add more settings as needed
  });

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (section) => {
    const token = localStorage.getItem('token');
    try {
      const updateData = {};
      // Map sections to update data
      if (section === 'account') {
        updateData.username = settings.username;
        updateData.displayName = settings.displayName;
        updateData.bio = settings.bio;
        updateData.status = settings.status;
        updateData.profilePicture = settings.profilePicture;
      }
      // Add other sections

      const res = await axios.put(`${API_BASE}/api/users/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate(res.data);
      alert('Settings updated successfully!');
    } catch (err) {
      alert('Failed to update settings');
    }
  };

  const sections = [
    { id: 'account', label: '👤 Account', icon: 'user' },
    { id: 'privacy', label: '🔐 Privacy & Security', icon: 'shield' },
    { id: 'chat', label: '💬 Chat Settings', icon: 'message-circle' },
    { id: 'notifications', label: '🔔 Notifications', icon: 'bell' },
    { id: 'media', label: '📁 Media & Storage', icon: 'image' },
    { id: 'appearance', label: '🌗 Appearance', icon: 'palette' },
    { id: 'advanced', label: '🧠 Advanced', icon: 'settings' },
    { id: 'social', label: '🧑‍🤝‍🧑 Social & Friends', icon: 'users' },
    { id: 'safety', label: '🛡️ Safety & Moderation', icon: 'alert-triangle' },
    { id: 'system', label: '🧩 App & System', icon: 'monitor' },
  ];

  return (
    <div className="flex h-full bg-slate-900 text-white">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-800 border-r border-slate-600 p-4">
        <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          ⚙️ Settings
        </h1>
        <nav className="space-y-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-indigo-900 text-indigo-200 border border-indigo-700'
                  : 'text-slate-200 hover:bg-slate-700'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <div className="mt-8 pt-4 border-t border-slate-200">
          <button onClick={onLogout} className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 mb-4">Logout</button>
          <p className="text-xs text-slate-500 mb-2">Made by Abhinav — Exclusively</p>
          <p className="text-xs text-slate-400">Version 1.1.0</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeSection === 'account' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Username</label>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
                <input
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Profile Picture URL</label>
                <input
                  type="url"
                  value={settings.profilePicture}
                  onChange={(e) => handleInputChange('profilePicture', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                <textarea
                  value={settings.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={settings.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Online">Online</option>
                  <option value="Idle">Idle</option>
                  <option value="Do Not Disturb">Do Not Disturb</option>
                  <option value="Invisible">Invisible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status Message</label>
                <input
                  type="text"
                  placeholder="What's on your mind?"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Account Creation Date</label>
                  <p className="text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">User ID</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500 font-mono">{user.id}</span>
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm">Copy</button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleSave('account')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Privacy & Security</h2>
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Current password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={settings.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={settings.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Login Sessions</h3>
                <p className="text-sm text-slate-600 mb-4">Active sessions will be displayed here.</p>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  Logout from Other Devices
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Online Status Privacy</h3>
                <div className="space-y-2">
                  {['Everyone', 'Friends only', 'No one'].map(option => (
                    <label key={option} className="flex items-center space-x-2">
                      <input type="radio" name="onlineStatus" value={option.toLowerCase()} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Block Users</h3>
                <p className="text-sm text-slate-600">Manage blocked users here.</p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Read receipts</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Typing indicators</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Add other sections similarly */}

        {activeSection === 'chat' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Chat Settings</h2>
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chat Theme</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
                <input type="color" className="w-16 h-10 border border-slate-300 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message Density</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Compact</option>
                  <option>Cozy</option>
                  <option>Comfortable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Font Size</label>
                <input type="range" min="12" max="20" className="w-full" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Auto-scroll on new messages</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="sendKey" />
                  <span>Enter to send</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="sendKey" />
                  <span>Shift+Enter for new line</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Notifications</h2>
            <div className="space-y-6 max-w-2xl">
              <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Global notifications</span>
              </label>
              <div>
                <h3 className="text-lg font-semibold mb-2">Do Not Disturb Schedule</h3>
                <input type="time" className="px-3 py-2 border border-slate-300 rounded-lg" />
                <span className="mx-2">to</span>
                <input type="time" className="px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Sound on/off</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Message preview</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Mention-only notifications</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other sections */}
        {['media', 'appearance', 'advanced', 'social', 'safety', 'system'].includes(activeSection) && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{sections.find(s => s.id === activeSection)?.label}</h2>
            <p className="text-slate-600">This section is under development.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;