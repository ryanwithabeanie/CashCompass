const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const auth = require('../middleware/auth');

// Send a friend request
router.post('/send', auth, async (req, res) => {
  const { email } = req.body;
  const toUser = await User.findOne({ email });
  if (!toUser) return res.status(404).json({ error: 'User not found' });
  if (toUser._id.equals(req.user._id)) return res.status(400).json({ error: 'Cannot send request to yourself' });

  // Check if already friends
  if (req.user.friends.includes(toUser._id)) return res.status(400).json({ error: 'Already friends' });

  // Check if request already exists
  const existing = await FriendRequest.findOne({ from: req.user._id, to: toUser._id, status: 'pending' });
  if (existing) return res.status(400).json({ error: 'Request already sent' });

  const request = new FriendRequest({ from: req.user._id, to: toUser._id });
  await request.save();
  res.json({ success: true });
});

// Get sent and received requests
router.get('/requests', auth, async (req, res) => {
  const sent = await FriendRequest.find({ from: req.user._id, status: 'pending' }).populate('to', 'email username');
  const received = await FriendRequest.find({ to: req.user._id, status: 'pending' }).populate('from', 'email username');
  res.json({ sent, received });
});

// Accept a friend request
router.post('/accept', auth, async (req, res) => {
  const { requestId } = req.body;
  const request = await FriendRequest.findOne({ _id: requestId, to: req.user._id, status: 'pending' });
  if (!request) return res.status(404).json({ error: 'Request not found' });

  request.status = 'accepted';
  await request.save();

  // Add each other as friends
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { friends: request.from } });
  await User.findByIdAndUpdate(request.from, { $addToSet: { friends: req.user._id } });

  res.json({ success: true });
});

// Decline a friend request
router.post('/decline', auth, async (req, res) => {
  const { requestId } = req.body;
  const request = await FriendRequest.findOne({ _id: requestId, to: req.user._id, status: 'pending' });
  if (!request) return res.status(404).json({ error: 'Request not found' });

  request.status = 'declined';
  await request.save();
  res.json({ success: true });
});

// Get friends list
router.get('/list', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('friends', 'username email');
  res.json({ friends: user.friends });
});

module.exports = router;