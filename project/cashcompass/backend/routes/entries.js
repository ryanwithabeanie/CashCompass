const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');
const auth = require("../middleware/auth"); // JWT middleware
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

// Create new entry (protected)
router.post('/add', auth, async (req, res) => {
  try {
    const { amount, category, type, note, date } = req.body; // <-- use note (matches schema)
    if (!amount || !category || !type) {
      return res.status(400).json({ error: "Amount, category, and type are required" });
    }

    const newEntry = new Entry({
      amount,
      category,
      type,           // 'income' | 'expense'
      note: note || '',
      date: date || new Date(),
      user: req.user.id // <-- schema uses 'user'
    });

    const savedEntry = await newEntry.save();
    res.status(201).json({ message: "Entry saved successfully", entry: savedEntry });
  } catch (err) {
    console.error("Add entry error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get all entries for logged-in user (protected)
router.get('/', auth, async (req, res) => {
  try {
    const entries = await Entry.find({ user: req.user._id });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// Test route (unprotected)
router.get('/test', (req, res) => {
  res.json({ message: "Test route is working!" });
});

// Delete an entry (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Entry.findOneAndDelete({ _id: req.params.id, user: req.user.id }); // <-- 'user'
    if (!deleted) return res.status(404).json({ error: 'Entry not found or not yours' });
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    console.error("Delete entry error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update an entry (protected)
router.put('/:id', auth, async (req, res) => {
  try {
    const entry = await Entry.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, // <-- filter by user
      req.body,
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// Weekly summary with AI (protected)
router.get('/summary', auth, async (req, res) => {
  try {
    // <-- filter by 'user' (not userId)
    const entries = await Entry.find({ user: req.user.id });

    const now = new Date();

    // Start of this week (Sunday)
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    // Start of last week
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // End of last week (one ms before this week starts)
    const endOfLastWeek = new Date(startOfThisWeek);
    endOfLastWeek.setMilliseconds(-1);

    let thisWeek = { income: 0, expense: 0 };
    let lastWeek = { income: 0, expense: 0 };

    entries.forEach(entry => {
      const d = new Date(entry.date);
      if (d >= startOfThisWeek) {
        if (entry.type === 'income') thisWeek.income += entry.amount;
        else if (entry.type === 'expense') thisWeek.expense += entry.amount;
      } else if (d >= startOfLastWeek && d <= endOfLastWeek) {
        if (entry.type === 'income') lastWeek.income += entry.amount;
        else if (entry.type === 'expense') lastWeek.expense += entry.amount;
      }
    });

    const balance = thisWeek.income - thisWeek.expense;

    // If no API key, return numeric summary only (no failure)
    if (!process.env.OPENROUTER_API_KEY) {
      return res.json({
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
        aiComment: "AI summary disabled (no OPENROUTER_API_KEY configured)."
      });
    }

    const aiPrompt = `
      This week: Income $${thisWeek.income}, Expense $${thisWeek.expense}
      Last week: Income $${lastWeek.income}, Expense $${lastWeek.expense}
      Write a short, human-friendly summary comparing both weeks, and provide one suggestion for improvement.
    `;

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
      // Graceful fallbacks
      if (response.status === 429) {
        return res.json({
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
          aiComment: "AI summary unavailable (free daily limit reached)."
        });
      }
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      return res.json({
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
        aiComment: "AI summary unavailable due to an API error."
      });
    }

    const data = await response.json();
    const aiComment = data.choices?.[0]?.message?.content || "No AI insight available.";

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
    console.error("Summary error:", err);
    // Final fallback: never 500 because of AI; still return numeric summary if we computed it
    res.status(200).json({
      currentWeek: { income: 0, expense: 0, savings: 0 },
      previousWeek: { income: 0, expense: 0, savings: 0 },
      balance: 0,
      aiComment: "Summary unavailable due to a server error."
    });
  }
});

module.exports = router;
