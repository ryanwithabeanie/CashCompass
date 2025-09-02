const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Entry = require("../models/Entry");
const Budget = require("../models/Budget");
const WeeklyPlan = require("../models/WeeklyPlan");
const ChatMessage = require("../models/ChatMessage");
const FriendRequest = require("../models/FriendRequest");
const auth = require("../middleware/auth");
const router = express.Router();

console.log("✅ Auth routes loaded");

// Helper: generate token
function generateToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = generateToken(user);

    return res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// GET /api/auth/verify - Verify token validity
router.get("/verify", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ valid: false });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ valid: false });
      }
      return res.json({ valid: true });
    } catch (err) {
      return res.status(401).json({ valid: false });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.error('Missing email or password');
      return res.status(400).json({ error: 'Missing email or password' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found for email:', email);
      return res.status(400).json({ error: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.error('Password mismatch for user:', email);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    let token;
    try {
      token = generateToken(user);
    } catch (jwtErr) {
      console.error('JWT error:', jwtErr);
      return res.status(500).json({ error: 'JWT error: ' + jwtErr.message });
    }

    return res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Login route error:', err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
});

// PUT /api/auth/update-profile - Update user profile
router.put("/update-profile", auth, async (req, res) => {
  try {
    const { username, email, newPassword, currentPassword } = req.body;
    const userId = req.user._id;

    // Verify current password
    const user = await User.findById(userId);
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({ error: "Email is already taken by another user" });
      }
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    // Hash new password if provided
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
});

// DELETE /api/auth/delete-user - Delete user and all associated data
router.delete("/delete-user", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete all user-related data
    await Promise.all([
      Entry.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      WeeklyPlan.deleteMany({ userId }),
      ChatMessage.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
      FriendRequest.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
      // Remove user from other users' friends arrays
      User.updateMany(
        { friends: userId },
        { $pull: { friends: userId } }
      )
    ]);

    // Finally, delete the user
    await User.findByIdAndDelete(userId);

    return res.json({ message: "User and all associated data deleted successfully" });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
});

module.exports = router;
