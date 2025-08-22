const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get friends list
router.get('/friends', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('friends', 'username email');
  res.json({ friends: user.friends });
});

// Get chat history with a friend
router.get('/history/:friendId', auth, async (req, res) => {
  const friendId = req.params.friendId;
  // Check if they are friends
  const user = await User.findById(req.user._id);
  if (!user.friends.includes(friendId)) return res.status(403).json({ error: "Not friends" });

  const messages = await ChatMessage.find({
    $or: [
      { from: req.user._id, to: friendId },
      { from: friendId, to: req.user._id }
    ]
  }).sort({ timestamp: 1 });
  res.json({ messages });
});

// Send a message
router.post('/send', auth, async (req, res) => {
  const { to, message } = req.body;
  // Check if they are friends
  const user = await User.findById(req.user._id);
  if (!user.friends.includes(to)) return res.status(403).json({ error: "Not friends" });

  const chat = new ChatMessage({
    from: req.user._id,
    to,
    message
  });
  await chat.save();
  res.json({ success: true, chat });
});

module.exports = router;