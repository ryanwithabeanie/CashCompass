// Shared button styles and hover effects to reduce code duplication

export const getButtonHoverHandlers = (baseColor = 'rgba(52, 152, 219, 0.8)', hoverColor = 'rgba(52, 152, 219, 1)') => ({
  onMouseEnter: (e) => {
    e.target.style.boxShadow = `0 0 20px ${hoverColor.replace('1)', '0.6)')}, 0 12px 20px rgba(0,0,0,0.4)`;
    e.target.style.transform = 'scale(1.05) translateY(-3px)';
    e.target.style.borderColor = hoverColor;
  },
  onMouseLeave: (e) => {
    e.target.style.boxShadow = `0 0 15px ${baseColor.replace('0.8)', '0.4)')}, 0 8px 15px rgba(0,0,0,0.3)`;
    e.target.style.transform = 'scale(1) translateY(0px)';
    e.target.style.borderColor = baseColor;
  }
});

export const getBaseButtonStyle = (color = 'rgba(52, 152, 219, 0.9)', disabled = false) => ({
  padding: '0.75rem 1.8rem',
  background: disabled 
    ? `rgba(${color.match(/\d+/g).join(', ')}, 0.1)` 
    : `linear-gradient(90deg, ${color} 0%, ${color.replace(/0\.\d+/, '0.7')} 100%)`,
  color: disabled ? '#999' : '#fff',
  border: `2px solid ${color.replace(/0\.\d+/, '0.8')}`,
  borderRadius: '12px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '1rem',
  fontWeight: 'bold',
  boxShadow: disabled 
    ? 'none' 
    : `0 0 15px ${color.replace(/0\.\d+/, '0.4')}, 0 8px 15px rgba(0,0,0,0.3)`,
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  transform: 'scale(1) translateY(0px)',
  textShadow: disabled ? 'none' : '0 2px 4px rgba(0,0,0,0.3)',
  backdropFilter: 'blur(12px)',
  outline: 'none'
});

export const getCompactButtonStyle = (color = 'rgba(52, 152, 219, 0.9)', disabled = false) => ({
  padding: '0.5rem 1rem',
  background: disabled 
    ? `rgba(${color.match(/\d+/g).join(', ')}, 0.1)` 
    : `linear-gradient(90deg, ${color} 0%, ${color.replace(/0\.\d+/, '0.7')} 100%)`,
  color: disabled ? '#999' : '#fff',
  border: `2px solid ${color.replace(/0\.\d+/, '0.8')}`,
  borderRadius: '8px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  boxShadow: disabled 
    ? 'none' 
    : `0 0 10px ${color.replace(/0\.\d+/, '0.3')}, 0 4px 8px rgba(0,0,0,0.2)`,
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  transform: 'scale(1) translateY(0px)',
  textShadow: disabled ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
  backdropFilter: 'blur(8px)',
  outline: 'none'
});

export const getCompactButtonHoverHandlers = (baseColor = 'rgba(52, 152, 219, 0.8)', hoverColor = 'rgba(52, 152, 219, 1)') => ({
  onMouseEnter: (e) => {
    e.target.style.boxShadow = `0 0 12px ${hoverColor.replace('1)', '0.5)')}, 0 6px 12px rgba(0,0,0,0.3)`;
    e.target.style.transform = 'scale(1.05) translateY(-2px)';
    e.target.style.borderColor = hoverColor;
  },
  onMouseLeave: (e) => {
    e.target.style.boxShadow = `0 0 10px ${baseColor.replace('0.8)', '0.3)')}, 0 4px 8px rgba(0,0,0,0.2)`;
    e.target.style.transform = 'scale(1) translateY(0px)';
    e.target.style.borderColor = baseColor;
  }
});

// Predefined color schemes
export const buttonColors = {
  primary: 'rgba(52, 152, 219, 0.9)',     // Blue
  success: 'rgba(46, 204, 113, 0.9)',     // Green  
  danger: 'rgba(231, 76, 60, 0.9)',       // Red
  warning: 'rgba(241, 196, 15, 0.9)',     // Yellow
  info: 'rgba(155, 89, 182, 0.9)'         // Purple
};

// Navigation button specific styles
export const getNavButtonStyle = (isActive = false) => ({
  padding: '0.75rem 1.5rem',
  background: isActive 
    ? 'rgba(52, 152, 219, 0.2)' 
    : 'rgba(255, 255, 255, 0.15)',
  border: isActive 
    ? '2px solid rgba(52, 152, 219, 0.8)' 
    : '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '12px',
  cursor: 'pointer',
  color: isActive ? '#222' : '#fff',
  fontSize: '1rem',
  fontWeight: 'bold',
  boxShadow: isActive 
    ? '0 0 20px rgba(52, 152, 219, 0.4), 0 8px 15px rgba(0,0,0,0.3)' 
    : '0 4px 12px rgba(0,0,0,0.2)',
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  transform: isActive ? 'scale(1.1) translateY(-3px)' : 'scale(1) translateY(0px)',
  textShadow: isActive ? '0 2px 4px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.5)',
  backdropFilter: 'blur(12px)',
  userSelect: 'none',
  outline: 'none'
});

export const getNavButtonHoverHandlers = (isActive = false) => ({
  onMouseEnter: (e) => {
    if (!isActive) {
      e.target.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.4), 0 8px 15px rgba(0,0,0,0.3)';
      e.target.style.transform = 'scale(1.05) translateY(-2px)';
      e.target.style.borderColor = 'rgba(52, 152, 219, 0.6)';
    }
  },
  onMouseLeave: (e) => {
    if (!isActive) {
      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      e.target.style.transform = 'scale(1) translateY(0px)';
      e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }
  }
});
