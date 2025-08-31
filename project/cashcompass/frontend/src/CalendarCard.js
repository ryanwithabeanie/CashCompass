import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarCard.css';

export default function CalendarCard({ entries }) {
  // Debug logging
  console.log('Calendar Entries:', entries);
  
  // Function to format date as YYYY-MM-DD in local timezone
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Group entries by date and type
  const entryDates = entries.reduce((acc, entry) => {
    // Ensure we have a date string to work with
    if (!entry.date) return acc;
    
    // Convert the entry date to local timezone and format it
    const date = formatDate(entry.date);
    
    if (!acc[date]) {
      acc[date] = { income: false, expense: false };
    }
    acc[date][entry.type] = true;
    return acc;
  }, {});

  // Function to determine tile color based on entry types
  const getTileColor = (date) => {
    // Convert the calendar tile date to local timezone YYYY-MM-DD format
    const localDate = new Date(date);
    const dateStr = formatDate(localDate);
    
    // Debug logging
    console.log('Checking date:', dateStr, 'Has entry:', !!entryDates[dateStr], 'Entry info:', entryDates[dateStr]);
    
    const dateInfo = entryDates[dateStr];
    if (!dateInfo) return null;

    if (dateInfo.income && dateInfo.expense) return 'var(--both-color)';
    if (dateInfo.income) return 'var(--income-color)';
    if (dateInfo.expense) return 'var(--expense-color)';
    return null;
  };

  // Debug logging
  console.log('Entry Dates:', entryDates);
  console.log('Sample Entry:', entries[0]);

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(8px)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#3498db', textAlign: 'center' }}>Financial Calendar</h2>
      <div className="calendar-container">
        <Calendar
          className="custom-calendar"
          tileClassName={({ date, view }) => {
            if (view !== 'month') return null;
            const color = getTileColor(date);
            if (!color) return '';
            const colorClass = color === 'var(--income-color)' ? 'income' :
                             color === 'var(--expense-color)' ? 'expense' : 'both';
            return `highlighted ${colorClass}`;
          }}
          formatDay={(locale, date) => date.getDate().toString()} // Simple day display
        />
      </div>
      <div style={{ 
        marginTop: '1.5rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        fontSize: '0.95rem'
      }}>
        <div className="legend-item income">
          <span className="legend-dot"></span>
          Income
        </div>
        <div className="legend-item expense">
          <span className="legend-dot"></span>
          Expense
        </div>
        <div className="legend-item both">
          <span className="legend-dot"></span>
          Both
        </div>
      </div>
    </div>
  );
}
