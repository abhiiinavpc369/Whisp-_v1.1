const express = require('express');

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const rateLimit = require('express-rate-limit');

const User = require('../models/User');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

router.post('/login', loginLimiter, async (req, res) => {

  try {

    const { userId, password } = req.body;

    const user = await User.findOne({ userId });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const { password, ...userWithoutPassword } = user._doc; // Exclude password from response
    res.json({ token, user: userWithoutPassword });

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

module.exports = router;