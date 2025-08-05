# CashCompass

CashCompass is a personal finance tracker built with the MERN stack (MongoDB, Express, React, Node.js). It allows users to manage income and expense entries, view weekly summaries, and receive AI-generated financial insights using the DeepSeek V3 0324 model through the OpenRouter API.

## Features added till now

- Add, edit, and delete financial entries
- Filter entries by type (income or expense)
- View current and previous week's financial summary
- AI-generated insight comparing weekly performance
- Uses DeepSeek V3 0324 model via OpenRouter 
- Separate loading and error messages for summary and entries
- Clean and responsive user interface

## Tech Stack

- *Frontend*: React.js
- *Backend*: Node.js, Express.js
- *Database*: MongoDB (with Mongoose)
- *AI Integration*: DeepSeek via OpenRouter API
- *Other Tools*: dotenv, marked, nodemon

## Getting Started

### 1. Clone the Repository

bash
git clone https://github.com/yourusername/cashcompass.git
cd cashcompass


### 2. Backend Setup

bash
cd backend
npm install


Create a .env file inside the backend folder and add the following:

env
PORT=5000
MONGO_URI=your_mongodb_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key


Start the backend server:

bash
npm run dev


### 3. Frontend Setup

bash
cd ../frontend
npm install
npm start


The frontend will run at http://localhost:3000.

## How It Works

- Users input income or expense entries with category, amount, note, and date.
- On load, the backend:
  - Separates entries into current week and previous week
  - Calculates income, expense, and savings for both
  - Generates a financial insight using DeepSeek AI
- The frontend:
  - Displays the weekly breakdown and AI comment
  - Allows filtering and entry management

## DeepSeek AI Integration

- Model: deepseek/deepseek-chat-v3-0324:free
- API Provider: [OpenRouter](https://openrouter.ai)
- Endpoint: https://openrouter.ai/api/v1/chat/completions
- Authorization: Bearer token from OpenRouter API key

Example prompt sent to the model:


This week: Income $500, Expense $400
Last week: Income $700, Expense $200
Write a short, human-friendly summary comparing both weeks, and provide a suggestion for improvement.


## File Structure Overview

<pre><code>
cashcompass/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── AddEntryForm.js
│   │   ├── services/
│   │   │   ├── entryService.js
│   │   │   └── summaryService.js
│   │   └── index.js
├── README.md</code></pre>


## Completed Tasks 

- MongoDB database and backend API setup
- Frontend connected to backend
- Entry form for adding/editing/deleting entries
- Weekly summary (this week vs. last week)
- DeepSeek AI integration via OpenRouter
- Custom summary loading and error states
- Improved date-based calculation logic

## Upcoming Enhancements

- Monthly/Yearly filters and reports
- Data visualization (charts, graphs)
- Exporting data (CSV, PDF)
- User authentication (login/signup)
- Persistent storage for AI summaries

## Author

Raiyan Khan  
Built as part of a CSE470 Software Development Project

## License

This project is open-source and free to use for educational and personal purposes.
