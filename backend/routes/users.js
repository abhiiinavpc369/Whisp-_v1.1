const express = require('express');

const auth = require('../middleware/auth');

const User = require('../models/User');

const router = express.Router();

router.get('/profile', auth, async (req, res) => {

  try {

    const user = await User.findOne({ userId: req.user.userId });

    res.json(user);

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

router.put('/profile', auth, async (req, res) => {

  try {

    const { username, bio, status, profilePicture } = req.body;

    const user = await User.findOneAndUpdate(

      { userId: req.user.userId },

      { username, bio, status, profilePicture },

      { new: true }

    );

    res.json(user);

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

router.get('/all', auth, async (req, res) => {

  try {

    const users = await User.find({}, 'userId username status lastSeen profilePicture');

    res.json(users);

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

module.exports = router;