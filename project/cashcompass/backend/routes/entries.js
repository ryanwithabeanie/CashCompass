const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');
const auth = require("../middleware/auth");  // ✅ JWT middleware
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

// ✅ Create new entry (protected)
router.post('/add', auth, async (req, res) => {
  try {
    const { amount, category, type, description, date } = req.body;
    if (!amount || !category || !type) {
      return res.status(400).json({ error: "Amount, category, and type are required" });
    }

    const newEntry = new Entry({
      amount,
      category,
      type, // income | expense
      description,
      date: date || new Date(),
      user: req.user.id   // ✅ consistent with model (user not userId)
    });

    const savedEntry = await newEntry.save();
    res.status(201).json({ message: "Entry saved successfully", entry: savedEntry });
  } catch (err) {
    console.error("Add entry error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get all entries for logged-in user (protected)
router.get('/', auth, async (req, res) => {
  try {
    const entries = await Entry.find({ user: req.user.id }).sort({ date: -1 }); // ✅ user not userId
    res.json(entries);
  } catch (err) {
    console.error("Get entries error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Test route (unprotected)
router.get('/test', (req, res) => {
  res.json({ message: "Test route is working!" });
});

// ✅ Delete an entry (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Entry.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Entry not found or not yours' });
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    console.error("Delete entry error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update an entry (protected)
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await Entry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Entry not found or not yours' });
    res.json(updated);
  } catch (err) {
    console.error("Update entry error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Weekly summary with AI (protected)
router.get('/summary', auth, async (req, res) => {
  try {
    const entries = await Entry.find({ user: req.user.id });

    const now = new Date();

    // Start of this week (Sunday)
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    // Start of last week (Sunday before this week)
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // End of last week (Saturday)
    const endOfLastWeek = new Date(startOfThisWeek);
    endOfLastWeek.setMilliseconds(-1);

    let thisWeek = { income: 0, expense: 0 };
    let lastWeek = { income: 0, expense: 0 };

    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= startOfThisWeek) {
        if (entry.type === 'income') thisWeek.income += entry.amount;
        else if (entry.type === 'expense') thisWeek.expense += entry.amount;
      } else if (entryDate >= startOfLastWeek && entryDate <= endOfLastWeek) {
        if (entry.type === 'income') lastWeek.income += entry.amount;
        else if (entry.type === 'expense') lastWeek.expense += entry.amount;
      }
    });

    const balance = thisWeek.income - thisWeek.expense;

    const aiPrompt = `
      This week: Income $${thisWeek.income}, Expense $${thisWeek.expense}
      Last week: Income $${lastWeek.income}, Expense $${lastWeek.expense}
      Write a short, human-friendly summary comparing both weeks, and provide a suggestion for improvement.
    `;

    // 🔗 OpenRouter DeepSeek API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [{ role: "user", content: aiPrompt }],
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiComment = data.choices[0]?.message?.content || "No AI insight available.";

    res.json({
      currentWeek: {
        income: thisWeek.income,
        expense: thisWeek.expense,
        savings: thisWeek.income - thisWeek.expense
      },
      previousWeek: {
        income: lastWeek.income,
        expense: lastWeek.expense,
        savings: lastWeek.income - lastWeek.expense
      },
      balance,
      aiComment
    });
  } catch (err) {
    console.error("Summary error:", err.message);
    res.status(500).json({ error: "Failed to generate AI summary" });
  }
});

module.exports = router;
