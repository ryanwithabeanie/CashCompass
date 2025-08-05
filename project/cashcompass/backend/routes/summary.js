const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');

const getWeekRange = (offset = 0) => {
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - now.getDay() - (offset * 7)));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
};

router.get('/weekly', async (req, res) => {
  try {
    const { start: currStart, end: currEnd } = getWeekRange(0);
    const { start: prevStart, end: prevEnd } = getWeekRange(1);

    const currentEntries = await Entry.find({ date: { $gte: currStart, $lt: currEnd } });
    const previousEntries = await Entry.find({ date: { $gte: prevStart, $lt: prevEnd } });

    const summarize = (entries) => {
      const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      const expense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
