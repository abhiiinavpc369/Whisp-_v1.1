import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3001`;

const ProfileSettings = ({ user, onClose, onUpdate }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [status, setStatus] = useState(user.status || 'Online');
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState('public');

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API_BASE}/api/users/profile`, { bio, status, profilePicture, notifications, privacy }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate(res.data);
      onClose();
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Profile Settings</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#A0A3BD' }}>Bio:</label>
          <textarea
            className="profile-textarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell something about yourself..."
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#A0A3BD' }}>Status:</label>
          <select
            className="profile-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Online">Online</option>
            <option value="Away">Away</option>
            <option value="Busy">Busy</option>
            <option value="Offline">Offline</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#A0A3BD' }}>Profile Picture URL:</label>
          <input
            className="profile-input"
            type="url"
            value={profilePicture}
            onChange={(e) => setProfilePicture(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#A0A3BD' }}>Notifications:</label>
          <label style={{ display: 'flex', alignItems: 'center', color: '#FFFFFF' }}>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Enable notifications
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#A0A3BD' }}>Privacy:</label>
          <select
            className="profile-select"
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="profile-button" onClick={onClose}>Cancel</button>
          <button className="profile-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;