const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  profilePicture: String,
  bio: String,
  status: { type: String, default: 'Online' },
  isOnline: { type: Boolean, default: false },
  lastSeen: Date,
  createdAt: { type: Date, default: Date.now },
  friends: [{
    userId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' },
    requestedBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('User', userSchema);