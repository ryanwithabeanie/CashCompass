import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Utility function to handle API calls
const api = {
  fetchPlannerData: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/weeklyPlan', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch planner data');
    return response.json();
  },

  updatePlannerData: async (data) => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/weeklyPlan/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update planner data');
    return response.json();
  }
};

const EXPENSE_CATEGORIES = [
  { id: 1, icon: '🏠', name: 'Rent/Accommodation' },
  { id: 2, icon: '🛒', name: 'Groceries' },
  { id: 3, icon: '🍔', name: 'Eating Out' },
  { id: 4, icon: '🚌', name: 'Transport' },
  { id: 5, icon: '📱', name: 'Phone & Internet' },
  { id: 6, icon: '📚', name: 'Study Materials' },
  { id: 7, icon: '💡', name: 'Utilities' },
  { id: 8, icon: '🧼', name: 'Toiletries/Essentials' },
  { id: 9, icon: '📺', name: 'Entertainment' },
  { id: 10, icon: '💸', name: 'Miscellaneous' },
];

export default function WeeklyPlannerCard({ user }) {
  const [plannerData, setPlannerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    const loadPlannerData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.fetchPlannerData();
        
        // Create a map of saved data by category
        const savedDataMap = data.reduce((acc, item) => {
          acc[item.category] = item;
          return acc;
        }, {});
        
        // Initialize with default categories, using saved data if available
        const initialData = EXPENSE_CATEGORIES.map(cat => {
          const savedData = savedDataMap[cat.name] || {};
          return {
            id: cat.id,
            icon: cat.icon,
            name: cat.name,
            planned: savedData.planned || 0,
            actual: savedData.actual || 0,
            difference: (savedData.planned || 0) - (savedData.actual || 0),
            notes: savedData.notes || ''
          };
        });
        
        setPlannerData(initialData);
      } catch (err) {
        console.error('Failed to load planner data:', err);
        setError('Failed to load planner data. Please try again later.');
        // Initialize with default categories on error
        setPlannerData(EXPENSE_CATEGORIES.map(cat => ({
          ...cat,
          planned: 0,
          actual: 0,
          difference: 0,
          notes: ''
        })));
      } finally {
        setLoading(false);
      }
    };

    loadPlannerData();
  }, []);

  const [saveStatus, setSaveStatus] = useState('');
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  
  const handleChange = (id, field, value) => {
    setPlannerData(prevData => {
      return prevData.map(item => {
        if (item.id === id) {
          const newItem = { ...item };
          if (field === 'planned' || field === 'actual') {
            // Convert to integer and ensure it's not negative
            const numValue = Math.max(0, parseInt(value) || 0);
            newItem[field] = numValue;
            // Recalculate difference (planned - actual = savings)
            newItem.difference = newItem.planned - newItem.actual;
          } else {
            newItem[field] = value;
          }
          return newItem;
        }
        return item;
      });
    });
  };

  const handleSaveChanges = async () => {
    try {
      setSaveStatus('Saving...');
      // Prepare data for backend
      const dataToSend = plannerData.map(item => ({
        category: item.name,
        icon: item.icon,
        planned: item.planned || 0,
        actual: item.actual || 0,
        notes: item.notes || ''
      }));

      await api.updatePlannerData(dataToSend);
      setSaveStatus('Changes saved successfully!');
      setShowDownloadButton(true); // Show download button after successful save
      setTimeout(() => setSaveStatus(''), 3000); // Clear message after 3 seconds
    } catch (err) {
      console.error('Failed to save planner data:', err);
      setSaveStatus('Failed to save changes. Please try again.');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleDownloadPlannerPDF = () => {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Set document title
    doc.setFontSize(14);
    doc.text('Weekly Expense Planner', 20, 15);
    
    // Add current date and user info
    doc.setFontSize(9);
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Generated on: ${currentDate}`, 20, 22);
    
    // Add generated by user info
    console.log('User object in PDF:', user); // Debug log
    
    // Try to get user info from multiple sources
    let username = 'User';
    if (user && (user.username || user.email)) {
      username = user.username || user.email;
    } else {
      // Fallback: try to get from localStorage
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          username = parsedUser.username || parsedUser.email || 'User';
        }
      } catch (e) {
        console.log('Could not parse stored user:', e);
      }
    }
    
    doc.text(`Generated by: ${username}`, 20, 28);
    
    // Prepare table data
    const tableHeaders = ['Category', 'Planned', 'Actual', 'Savings', 'Notes'];
    const tableData = plannerData.map(item => [
      item.name.replace(/^🏠|🛒|🍔|🚌|📱|📚|💡|🧼|📺|💸\s*/, ''), // Remove emojis
      `$${item.planned}`,
      `$${item.actual}`,
      `$${item.difference}`,
      item.notes || '-'
    ]);
    
    // Create table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 34,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [220, 220, 220], // Light gray header
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fillColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 50 }, // Category
        1: { cellWidth: 25, halign: 'right' }, // Planned
        2: { cellWidth: 25, halign: 'right' }, // Actual
        3: { cellWidth: 25, halign: 'right' }, // Savings
        4: { cellWidth: 45 } // Notes
      }
    });
    
    // Calculate totals and add compact summary
    const totalPlanned = plannerData.reduce((sum, item) => sum + item.planned, 0);
    const totalActual = plannerData.reduce((sum, item) => sum + item.actual, 0);
    const totalDifference = totalPlanned - totalActual;
    
    // Add summary section (more compact)
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.text('Financial Summary', 20, finalY);
    
    doc.setFontSize(9);
    doc.text(`Total Planned: $${totalPlanned}  |  Total Spent: $${totalActual}  |  Net Result: $${totalDifference}`, 20, finalY + 8);
    
    // Add financial comment (more compact)
    let comment = '';
    if (totalDifference > 0) {
      comment = `Great! You saved $${totalDifference}. Keep up the excellent work!`;
    } else if (totalDifference < 0) {
      comment = `Overspent by $${Math.abs(totalDifference)}. Consider reviewing expenses.`;
    } else {
      comment = 'Perfect budget balance achieved!';
    }
    
    doc.setFontSize(9);
    doc.text('Status:', 20, finalY + 18);
    const splitComment = doc.splitTextToSize(comment, 170);
    doc.text(splitComment, 20, finalY + 26);
    
    // Save the PDF
    doc.save('Weekly-Expense-Planner.pdf');
  };

  // Calculate total savings/overspending
  const totalDifference = plannerData.reduce((sum, item) => sum + item.difference, 0);

  const getSummaryMessage = () => {
    if (totalDifference > 0) {
      return (
        <div className="saving-message" style={{
          color: '#1e8449',
          fontSize: '1.2rem',
          textAlign: 'center',
          padding: '1rem',
          background: 'rgba(46, 204, 113, 0.15)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(46, 204, 113, 0.3)',
          borderRadius: '12px',
          marginTop: '1rem'
        }}>
          <span>🎉 Congratulations! 🌟</span>
          <p style={{ margin: '0.5rem 0' }}>
            You're saving well! Total savings: <strong>${totalDifference}</strong>
          </p>
          <span>Keep up the great work! 💪✨</span>
        </div>
      );
    } else if (totalDifference < 0) {
      return (
        <div className="overspend-message" style={{
          color: '#e74c3c',
          fontSize: '1.2rem',
          textAlign: 'center',
          padding: '1rem',
          background: 'rgba(231, 76, 60, 0.15)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(231, 76, 60, 0.3)',
          borderRadius: '12px',
          marginTop: '1rem'
        }}>
          <span>😔 Attention Needed 💭</span>
          <p style={{ margin: '0.5rem 0' }}>
            You've overspent by: <strong>${Math.abs(totalDifference)}</strong>
          </p>
          <span>Let's try to get back on track! 💪</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      padding: '1.5rem',
      marginBottom: '2rem',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <h2 style={{
        margin: '0 0 1rem',
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#222',
        textAlign: 'left',
        userSelect: 'none'
      }}>Weekly Expense Planner</h2>

      {loading ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#666'
        }}>
          Loading your planner data...
        </div>
      ) : error ? (
        <div style={{
          padding: '1rem',
          textAlign: 'center',
          color: '#e74c3c',
          background: 'rgba(231, 76, 60, 0.15)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(231, 76, 60, 0.3)',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      ) : (
        <div>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '1rem'
        }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
              color: '#fff'
            }}>
              <th style={{ 
                padding: '1rem', 
                textAlign: 'left', 
                borderRadius: '12px 0 0 0',
                width: '25%'
              }}>Category</th>
              <th style={{ 
                padding: '1rem', 
                textAlign: 'center',
                width: '120px'
              }}>Planned Budget</th>
              <th style={{ 
                padding: '1rem', 
                textAlign: 'center',
                width: '120px'
              }}>Actual Spent</th>
              <th style={{ 
                padding: '1rem', 
                textAlign: 'center',
                width: '120px'
              }}>Net Savings</th>
              <th style={{ 
                padding: '1rem', 
                textAlign: 'left', 
                borderRadius: '0 12px 0 0',
                width: '30%'
              }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {plannerData.map((item, index) => (
              <tr key={item.id} style={{
                backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                transition: 'background-color 0.2s'
              }}>
                <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                  <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
                  {item.name}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={item.planned}
                    onChange={(e) => handleChange(item.id, 'planned', e.target.value)}
                    style={{
                      width: '100px',
                      padding: '0.5rem',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      textAlign: 'right',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(12px)',
                      color: '#222',
                      outline: 'none'
                    }}
                  />
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={item.actual}
                    onChange={(e) => handleChange(item.id, 'actual', e.target.value)}
                    style={{
                      width: '100px',
                      padding: '0.5rem',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      textAlign: 'right',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(12px)',
                      color: '#222',
                      outline: 'none'
                    }}
                  />
                </td>
                <td style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: item.difference > 0 ? '#1e8449' : item.difference < 0 ? '#e74c3c' : '#666'
                }}>
                  {item.difference > 0 ? '+' : ''}{item.difference}
                </td>
                <td style={{ padding: '1rem' }}>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => handleChange(item.id, 'notes', e.target.value)}
                    placeholder="Add notes..."
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(12px)',
                      color: '#222',
                      outline: 'none'
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {!loading && !error && getSummaryMessage()}

      {/* Save Changes Button and Status */}
      {!loading && !error && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '1.5rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleSaveChanges}
            style={{
            background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
            color: '#fff',
            border: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease'
          }}
        >
          Save Changes
        </button>
        
        {/* Download PDF Button - Only visible after successful save */}
        {showDownloadButton && (
          <button
            onClick={handleDownloadPlannerPDF}
            style={{
              background: 'linear-gradient(90deg, rgba(46, 204, 113, 0.9) 0%, rgba(26, 188, 156, 0.9) 100%)',
              color: '#fff',
              border: 'none',
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            Download Planner PDF
          </button>
        )}
        
        {saveStatus && (
          <span style={{
            color: saveStatus.includes('success') ? '#1e8449' : saveStatus.includes('Failed') ? '#e74c3c' : '#3498db',
            fontWeight: 'bold'
          }}>
            {saveStatus}
          </span>
        )}
      </div>
      )}
    </div>
  );
}
