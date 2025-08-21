const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true   // ✅ must be linked to a user
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {        // ✅ match routes (was "note")
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Entry', EntrySchema);
