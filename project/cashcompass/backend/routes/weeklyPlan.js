const express = require('express');
const router = express.Router();
const WeeklyPlan = require('../models/WeeklyPlan');
const auth = require('../middleware/auth');

// Get user's weekly plan entries
router.get('/', auth, async (req, res) => {
    try {
        const entries = await WeeklyPlan.find({ userId: req.user._id });
        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create or update weekly plan entries
router.post('/update', auth, async (req, res) => {
    try {
        const entries = req.body;
        if (!Array.isArray(entries)) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const results = [];
        for (const entry of entries) {
            const { category, icon, planned, actual, notes } = entry;
            
            // Find existing entry or create new one
            let planEntry = await WeeklyPlan.findOne({
                userId: req.user._id,
                category: category
            });

            if (planEntry) {
                // Update existing entry
                planEntry.planned = planned;
                planEntry.actual = actual;
                planEntry.notes = notes;
                planEntry.updatedAt = Date.now();
                await planEntry.save();
            } else {
                // Create new entry
                planEntry = new WeeklyPlan({
                    userId: req.user._id,
                    category,
                    icon,
                    planned,
                    actual,
                    notes
                });
                await planEntry.save();
            }
            results.push(planEntry);
        }

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
