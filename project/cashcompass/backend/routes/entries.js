const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();




// Create new entry
router.post('/add', async (req, res) => {
  try {
    const newEntry = new Entry(req.body);
    const savedEntry = await newEntry.save();
    res.status(201).json({ message: "Entry saved successfully", entry: savedEntry });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all entries
router.get('/', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Test route for verifying backend
router.get('/test', (req, res) => {
  res.json({ message: "Test route is working!" });
});



// Delete an entry by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Entry.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Update an entry by ID
router.put('/:id', async (req, res) => {
  try {
    const updated = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Entry not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//generate a summary of the last two weeks
router.get('/summary', async (req, res) => {
  try {
    const entries = await Entry.find();

    const now = new Date();

    

    // Get start of this week (Sunday)
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
      
    // Get start of last week (Sunday of previous week)
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      
    // Get end of last week (Saturday before this week)
    const endOfLastWeek = new Date(startOfThisWeek);
    endOfLastWeek.setMilliseconds(-1); // 1ms before this week's start


    let thisWeek = { income: 0, expense: 0 };
    let lastWeek = { income: 0, expense: 0 };

    entries.forEach(entry => {
      const date = new Date(entry.date);
      if (date >= startOfThisWeek) {
        if (entry.type === 'income') thisWeek.income += entry.amount;
        else if (entry.type === 'expense') thisWeek.expense += entry.amount;
      } else if (date >= startOfLastWeek && date <= endOfLastWeek) {
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

    //  OpenRouter DeepSeek API Request
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

    console.log('AI Response:', data);
    console.log('AI Comment:', aiComment);




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

