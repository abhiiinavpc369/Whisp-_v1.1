const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
  mediaUrl: String,
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 24 hours
  views: [{ userId: String, viewedAt: Date }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Status', statusSchema);