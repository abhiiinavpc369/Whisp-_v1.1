const express = require('express');

const auth = require('../middleware/auth');

const User = require('../models/User');
const Status = require('../models/Status');

const router = express.Router();

// Post a status
router.post('/', auth, async (req, res) => {
  try {
    const { content, type, mediaUrl } = req.body;
    const status = new Status({
      userId: req.user.userId,
      content,
      type,
      mediaUrl
    });
    await status.save();
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get statuses from friends
router.get('/friends', auth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    const friendIds = user.friends.filter(f => f.status === 'accepted').map(f => f.userId);
    friendIds.push(req.user.userId); // Include own statuses

    const statuses = await Status.find({
      userId: { $in: friendIds },
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// View a status
router.put('/view/:id', auth, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) return res.status(404).json({ message: 'Status not found' });

    const alreadyViewed = status.views.some(v => v.userId === req.user.userId);
    if (!alreadyViewed) {
      status.views.push({ userId: req.user.userId, viewedAt: new Date() });
      await status.save();
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my statuses
router.get('/my', auth, async (req, res) => {
  try {
    const statuses = await Status.find({
      userId: req.user.userId,
      expiresAt: { $gt: new Date() }
    });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;