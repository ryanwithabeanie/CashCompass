const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');
const auth = require("../middleware/auth");

// helper to get week range [start, end)
function getWeekRange(offsetWeeks = 0) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - today.getDay()); // Sunday start

  const start = new Date(startOfThisWeek);
  start.setDate(start.getDate() - offsetWeeks * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

// GET /api/summary/weekly  (protected, per user)
router.get('/weekly', auth, async (req, res) => {
  try {
    const { start: currStart, end: currEnd } = getWeekRange(0);
    const { start: prevStart, end: prevEnd } = getWeekRange(1);

    const currentEntries = await Entry.find({
      user: req.user.id,
      date: { $gte: currStart, $lt: currEnd }
    });

    const previousEntries = await Entry.find({
      user: req.user.id,
      date: { $gte: prevStart, $lt: prevEnd }
    });

    const summarize = (entries) => {
      const income = entries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
      const expense = entries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        income,
        expense,
        savings: income - expense
      };
    };

    res.json({
      currentWeek: summarize(currentEntries),
      previousWeek: summarize(previousEntries)
    });

  } catch (err) {
    console.error("Weekly summary error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const entries = await Entry.find({ user: req.user._id });
    const summarize = (entries) => {
      const income = entries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
      const expense = entries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        income,
        expense,
        savings: income - expense
      };
    };
    res.json(summarize(entries));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
