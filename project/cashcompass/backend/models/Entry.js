const mongoose = require('mongoose');






const fetchEntries = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/entries", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      setEntries(data); // whatever state you use to render entries
    } else {
      console.error("Failed to fetch entries");
    }
  } catch (err) {
    console.error("Error fetching entries", err);
  }
};




const EntrySchema = new mongoose.Schema({
  type: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  note: String,
  date: { type: Date, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isRecurring: { type: Boolean, default: false },
  recurringPeriod: { type: String, enum: ['monthly', 'yearly'], default: null },
  nextDueDate: { type: Date, default: null }
});

module.exports = mongoose.model('Entry', EntrySchema);
