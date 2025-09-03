const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Entry = require('../models/Entry');
const auth = require('../middleware/auth');

// Set or update budget
router.post('/set', auth, async (req, res) => {
  const { amount } = req.body;
  try {
    let budget = await Budget.findOne({ user: req.user._id });
    if (budget) {
      budget.amount = amount;
      budget.notified = false;
      await budget.save();
    } else {
      budget = await Budget.create({ user: req.user._id, amount });
    }
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get budget and progress
router.get('/', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({ user: req.user._id });
    if (!budget) return res.json({ amount: 0, progress: 0 });
    const entries = await Entry.find({ user: req.user._id, type: 'expense' });
    const totalExpense = entries.reduce((sum, e) => sum + e.amount, 0);
    const progress = budget.amount > 0 ? totalExpense / budget.amount : 0;
    // Notify if close to exceeding budget (e.g., >90%)
    let notify = false;
    if (progress >= 0.9 && !budget.notified) {
      budget.notified = true;
      await budget.save();
      notify = true;
    }
    res.json({ amount: budget.amount, expense: totalExpense, progress, notify });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
