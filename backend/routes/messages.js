const express = require('express');

const auth = require('../middleware/auth');

const Message = require('../models/Message');

const router = express.Router();

router.get('/:receiverId', auth, async (req, res) => {

  try {

    const { receiverId } = req.params;

    const messages = await Message.find({

      $or: [

        { senderId: req.user.userId, receiverId },

        { senderId: receiverId, receiverId: req.user.userId }

      ]

    }).populate('replyTo').sort({ timestamp: 1 });

    res.json(messages);

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

router.get('/last/:receiverId', auth, async (req, res) => {

  try {

    const { receiverId } = req.params;

    const message = await Message.findOne({

      $or: [

        { senderId: req.user.userId, receiverId },

        { senderId: receiverId, receiverId: req.user.userId }

      ]

    }).sort({ timestamp: -1 });

    res.json(message);

  } catch (err) {

    res.json(null);

  }

});

router.post('/', auth, async (req, res) => {

  try {

    const { receiverId, content, messageType, fileMeta, replyTo } = req.body;

    const message = new Message({

      senderId: req.user.userId,

      receiverId,

      content,

      messageType,

      fileMeta,

      replyTo

    });

    await message.save();

    res.json(message);

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

// Add reaction
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId !== req.user.userId && message.receiverId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const existing = message.reactions.find(r => r.userId === userId && r.emoji === emoji);
    if (existing) {
      message.reactions = message.reactions.filter(r => !(r.userId === userId && r.emoji === emoji));
    } else {
      message.reactions.push({ userId, emoji });
    }
    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit message
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId !== userId) return res.status(403).json({ message: 'Not authorized' });

    const timeDiff = Date.now() - new Date(message.timestamp).getTime();
    if (timeDiff > 18 * 60 * 1000) return res.status(400).json({ message: 'Edit time expired' });

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId !== userId) return res.status(403).json({ message: 'Not authorized' });

    const timeDiff = Date.now() - new Date(message.timestamp).getTime();
    if (timeDiff > 6 * 60 * 60 * 1000) return res.status(400).json({ message: 'Delete time expired' });

    await Message.findByIdAndDelete(id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle pin
router.put('/:id/pin', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId !== req.user.userId && message.receiverId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.pinned = !message.pinned;
    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;