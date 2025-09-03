import React from 'react';
import { getNavButtonStyle, getNavButtonHoverHandlers } from '../utils/buttonStyles';

export const NavigationButtons = ({ currentPage, navigateToPage }) => {
  const navButtons = [
    { key: 'home', label: 'Home' },
    { key: 'friends', label: 'Friends' },
    { key: 'dynamics', label: 'Dynamics' },
    { key: 'planner', label: 'Planner' },
    { key: 'budget', label: 'Budget' }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
      justifyContent: 'center'
    }}>
      {navButtons.map(({ key, label }) => (
        <button 
          key={key}
          onClick={() => navigateToPage(key)}
          style={{
            ...getNavButtonStyle(currentPage === key),
            padding: '0.85rem 1.8rem',
            fontSize: '0.95rem'
          }}
          {...getNavButtonHoverHandlers(currentPage === key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default NavigationButtons;
