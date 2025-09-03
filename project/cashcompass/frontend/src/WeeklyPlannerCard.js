import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBaseButtonStyle, getButtonHoverHandlers, buttonColors } from './utils/buttonStyles';

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
  const [saveStatus, setSaveStatus] = useState('');
  const [showDownloadButton, setShowDownloadButton] = useState(false);

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

  // Recalculate differences when data changes
  useEffect(() => {
    setPlannerData(prev => prev.map(item => ({
      ...item,
      difference: (item.planned || 0) - (item.actual || 0)
    })));
  }, []);

  const handleInputChange = (id, field, value) => {
    setPlannerData(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            [field]: field === 'notes' ? value : parseFloat(value) || 0,
            difference: field === 'planned' 
              ? (parseFloat(value) || 0) - item.actual
              : field === 'actual'
              ? item.planned - (parseFloat(value) || 0)
              : item.difference
          }
        : item
    ));
  };

  const handleSaveChanges = async () => {
    try {
      setSaveStatus('Saving...');
      
      const dataToSave = plannerData.map(item => ({
        category: item.name,
        planned: item.planned || 0,
        actual: item.actual || 0,
        notes: item.notes || ''
      }));

      await api.updatePlannerData(dataToSave);
      setSaveStatus('Changes saved successfully!');
      setShowDownloadButton(true);
      
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    } catch (err) {
      console.error('Failed to save changes:', err);
      setSaveStatus('Failed to save changes. Please try again.');
      
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    }
  };

  const handleDownloadPlannerPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Weekly Budget Planner', 20, 20);
      
      // Add date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Prepare data for table
      const tableData = plannerData.map(item => [
        `${item.icon} ${item.name}`,
        `$${(item.planned || 0).toFixed(2)}`,
        `$${(item.actual || 0).toFixed(2)}`,
        `$${(item.difference || 0).toFixed(2)}`,
        item.notes || '-'
      ]);
      
      // Add summary row
      const totalPlanned = plannerData.reduce((sum, item) => sum + (item.planned || 0), 0);
      const totalActual = plannerData.reduce((sum, item) => sum + (item.actual || 0), 0);
      const totalDifference = totalPlanned - totalActual;
      
      tableData.push([
        'TOTAL',
        `$${totalPlanned.toFixed(2)}`,
        `$${totalActual.toFixed(2)}`,
        `$${totalDifference.toFixed(2)}`,
        ''
      ]);

      // Generate table
      autoTable(doc, {
        head: [['Category', 'Planned', 'Actual', 'Difference', 'Notes']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fillColor: [245, 245, 245]
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        },
        footStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontStyle: 'bold'
        }
      });

      // Add footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Generated by CashCompass - Your Financial Planning Assistant', 20, pageHeight - 10);
      
      // Save the PDF
      doc.save(`weekly-budget-planner-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(12px)',
        borderRadius: '20px',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        color: '#fff',
        textAlign: 'center'
      }}>
        Loading your weekly planner...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: 'rgba(255, 99, 99, 0.15)',
        backdropFilter: 'blur(12px)',
        borderRadius: '20px',
        padding: '2rem',
        border: '1px solid rgba(255, 99, 99, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <h3>Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(12px)',
      borderRadius: '20px',
      padding: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      color: '#fff',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <h2 style={{ 
        marginBottom: '1.5rem', 
        textAlign: 'left',
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: '#222'
      }}>
        Weekly Budget Planner
      </h2>
      
      {/* Table Container */}
      <div style={{
        overflowX: 'auto',
        marginBottom: '1.5rem',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem',
          userSelect: 'none'
        }}>
          <thead>
            <tr style={{
              backgroundColor: 'rgba(52, 152, 219, 0.3)',
              borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 'bold' }}>Category</th>
              <th style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>Planned ($)</th>
              <th style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>Actual ($)</th>
              <th style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>Difference</th>
              <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 'bold' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {plannerData.map((item, index) => (
              <tr key={item.id} style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
              }}>
                <td style={{ 
                  padding: '0.8rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  {item.name}
                </td>
                <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                  <input
                    type="number"
                    value={item.planned || ''}
                    onChange={(e) => handleInputChange(item.id, 'planned', e.target.value)}
                    style={{
                      width: '80px',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                  <input
                    type="number"
                    value={item.actual || ''}
                    onChange={(e) => handleInputChange(item.id, 'actual', e.target.value)}
                    style={{
                      width: '80px',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td style={{ 
                  padding: '0.8rem', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: item.difference >= 0 ? '#2ecc71' : '#e74c3c'
                }}>
                  ${(item.difference || 0).toFixed(2)}
                </td>
                <td style={{ padding: '0.4rem' }}>
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => handleInputChange(item.id, 'notes', e.target.value)}
                    placeholder="Add notes..."
                    style={{
                      width: '100%',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{
              backgroundColor: 'rgba(52, 152, 219, 0.3)',
              borderTop: '2px solid rgba(255, 255, 255, 0.2)',
              fontWeight: 'bold'
            }}>
              <td style={{ padding: '0.8rem' }}>TOTAL</td>
              <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                ${plannerData.reduce((sum, item) => sum + (item.planned || 0), 0).toFixed(2)}
              </td>
              <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                ${plannerData.reduce((sum, item) => sum + (item.actual || 0), 0).toFixed(2)}
              </td>
              <td style={{ 
                padding: '0.8rem', 
                textAlign: 'center',
                color: plannerData.reduce((sum, item) => sum + (item.difference || 0), 0) >= 0 ? '#2ecc71' : '#e74c3c'
              }}>
                ${plannerData.reduce((sum, item) => sum + (item.difference || 0), 0).toFixed(2)}
              </td>
              <td style={{ padding: '0.8rem' }}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleSaveChanges}
          style={{
            ...getBaseButtonStyle(buttonColors.primary),
            padding: '0.85rem 1.8rem',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '1rem',
            boxShadow: '0 0 15px rgba(52, 152, 219, 0.4), 0 8px 15px rgba(0,0,0,0.3)',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)'
          }}
          {...getButtonHoverHandlers('rgba(52, 152, 219, 0.8)', 'rgba(52, 152, 219, 1)')}
        >
          Save Changes
        </button>
        
        {/* Download PDF Button - Only visible after successful save */}
        {showDownloadButton && (
          <button
            onClick={handleDownloadPlannerPDF}
            style={{
              ...getBaseButtonStyle(buttonColors.success),
              padding: '0.85rem 1.8rem',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '1rem',
              boxShadow: '0 0 15px rgba(46, 204, 113, 0.4), 0 8px 15px rgba(0,0,0,0.3)',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(12px)'
            }}
            {...getButtonHoverHandlers('rgba(46, 204, 113, 0.8)', 'rgba(46, 204, 113, 1)')}
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
    </div>
  );
}
