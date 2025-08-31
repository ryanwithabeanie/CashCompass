const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  amount: { type: Number, required: true },
  notified: { type: Boolean, default: false }
});

module.exports = mongoose.model('Budget', budgetSchema);
