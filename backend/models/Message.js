const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'video', 'file'], default: 'text' },
  content: String,
  fileMeta: {
    fileName: String,
    fileSize: String,
    fileType: String
  },
  timestamp: { type: Date, default: Date.now },
  readStatus: { type: Boolean, default: false },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions: [{ userId: String, emoji: String }],
  pinned: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  editedAt: Date
});

module.exports = mongoose.model('Message', messageSchema);