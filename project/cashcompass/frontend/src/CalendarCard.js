import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarCard.css';

export default function CalendarCard({ entries = [] }) {
  console.log('CalendarCard received entries:', entries);

  // Helper function to format date consistently
  const formatDateToString = (date) => {
    const d = new Date(date);
    // Ensure we're working with local timezone
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Create a map of dates to entry types
  const dateEntryMap = {};
  
  entries.forEach(entry => {
    if (!entry.date || !entry.type) return;
    
    const dateStr = formatDateToString(entry.date);
    
    if (!dateEntryMap[dateStr]) {
      dateEntryMap[dateStr] = {
        hasIncome: false,
        hasExpense: false
      };
    }
    
    if (entry.type === 'income') {
      dateEntryMap[dateStr].hasIncome = true;
    } else if (entry.type === 'expense') {
      dateEntryMap[dateStr].hasExpense = true;
    }
  });

  console.log('Date entry map:', dateEntryMap);

  // Function to get tile class for a given date
  const getTileClass = (date) => {
    const dateStr = formatDateToString(date);
    const dayData = dateEntryMap[dateStr];
    
    if (!dayData) return '';
    
    if (dayData.hasIncome && dayData.hasExpense) {
      return 'calendar-tile-both';
    } else if (dayData.hasIncome) {
      return 'calendar-tile-income';
    } else if (dayData.hasExpense) {
      return 'calendar-tile-expense';
    }
    
    return '';
  };

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: '1.5rem 0.75rem',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(12px)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ 
        marginBottom: '1.5rem', 
        color: '#222', 
        textAlign: 'center',
        fontSize: '1.5rem',
        fontWeight: '600'
      }}>
        Financial Calendar
      </h2>
      
      <div className="calendar-wrapper">
        <Calendar
          className="financial-calendar"
          tileClassName={({ date, view }) => {
            if (view === 'month') {
              return getTileClass(date);
            }
            return null;
          }}
        />
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        marginTop: '1.5rem',
        fontSize: '0.9rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#2ecc71',
            borderRadius: '4px'
          }}></div>
          <span style={{ color: '#222' }}>Income</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#e74c3c',
            borderRadius: '4px'
          }}></div>
          <span style={{ color: '#222' }}>Expense</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#3498db',
            borderRadius: '4px'
          }}></div>
          <span style={{ color: '#222' }}>Both</span>
        </div>
      </div>

      {entries.length === 0 && (
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(52, 152, 219, 0.2)'
        }}>
          <p style={{ color: '#222', margin: '0 0 0.5rem 0' }}>
            No entries found. Add some income or expense entries to see them highlighted on the calendar!
          </p>
          <small style={{ color: '#666' }}>
            💡 Use the "Add Entry" form to create your first entry
          </small>
        </div>
      )}
    </div>
  );
}
