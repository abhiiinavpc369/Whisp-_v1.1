const express = require('express');

const auth = require('../middleware/auth');

const User = require('../models/User');

const router = express.Router();

// Send friend request
router.post('/send-request/:userId', auth, async (req, res) => {

  try {

    const { userId: targetUserId } = req.params;

    const currentUserId = req.user.userId;

    if (currentUserId === targetUserId) return res.status(400).json({ message: 'Cannot add yourself' });

    const targetUser = await User.findOne({ userId: targetUserId });

    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Check if already friends or request exists

    const existingFriend = targetUser.friends.find(f => f.userId === currentUserId);

    if (existingFriend) return res.status(400).json({ message: 'Request already exists' });

    // Add to target's friends

    targetUser.friends.push({

      userId: currentUserId,

      status: 'pending',

      requestedBy: currentUserId

    });

    await targetUser.save();

    // Optionally add to current user's sent requests

    const currentUser = await User.findOne({ userId: currentUserId });

    currentUser.friends.push({

      userId: targetUserId,

      status: 'pending',

      requestedBy: currentUserId

    });

    await currentUser.save();

    res.json({ message: 'Friend request sent' });

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

// Accept friend request

router.put('/accept/:userId', auth, async (req, res) => {

  try {

    const { userId: requesterId } = req.params;

    const currentUserId = req.user.userId;

    const currentUser = await User.findOne({ userId: currentUserId });

    const friendEntry = currentUser.friends.find(f => f.userId === requesterId && f.status === 'pending');

    if (!friendEntry) return res.status(404).json({ message: 'Request not found' });

    friendEntry.status = 'accepted';

    await currentUser.save();

    // Also update requester's status

    const requester = await User.findOne({ userId: requesterId });

    const reqFriendEntry = requester.friends.find(f => f.userId === currentUserId);

    if (reqFriendEntry) {

      reqFriendEntry.status = 'accepted';

      await requester.save();

    }

    res.json({ message: 'Friend request accepted' });

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

// Get friend requests (pending from others)

router.get('/requests', auth, async (req, res) => {

  try {

    const currentUser = await User.findOne({ userId: req.user.userId }).populate('friends');

    const requests = currentUser.friends.filter(f => f.status === 'pending' && f.requestedBy !== req.user.userId);

    res.json(requests);

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

// Get friends (accepted)

router.get('/friends', auth, async (req, res) => {

  try {

    const currentUser = await User.findOne({ userId: req.user.userId });

    const friends = currentUser.friends.filter(f => f.status === 'accepted');

    // Get full user details

    const friendDetails = await Promise.all(

      friends.map(async (f) => {

        const user = await User.findOne({ userId: f.userId }, 'userId username status lastSeen profilePicture');

        return user;

      })

    );

    res.json(friendDetails.filter(Boolean));

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

// Search users

router.get('/search', auth, async (req, res) => {

  try {

    const { q } = req.query;

    if (!q) return res.json([]);

    const users = await User.find({

      $or: [

        { username: new RegExp(q, 'i') },

        { userId: new RegExp(q, 'i') }

      ],

      userId: { $ne: req.user.userId } // Exclude self

    }, 'userId username status profilePicture');

    res.json(users);

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

module.exports = router;