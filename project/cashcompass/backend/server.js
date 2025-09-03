const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const entryRoutes = require('./routes/entries');
app.use('/api/entries', entryRoutes);

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const friendsRoutes = require('./routes/friends');
app.use('/api/friends', friendsRoutes);


const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

const budgetRoutes = require('./routes/budget');
app.use('/api/budget', budgetRoutes);

const weeklyPlanRoutes = require('./routes/weeklyPlan');
app.use('/api/weeklyPlan', weeklyPlanRoutes);


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('CashCompass Backend Running!');
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
