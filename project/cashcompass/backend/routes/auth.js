const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
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
module.exports = router;
