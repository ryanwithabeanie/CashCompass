import React, { useEffect, useState, useMemo, useCallback } from 'react';
import AddEntryForm from './AddEntryForm';
import { fetchEntries } from './services/entryService';
import bgImage from './assets/bg.jpg';
import { fetchSummary } from './services/summaryService';
import CalendarCard from './CalendarCard';
import { validateToken, clearAuth } from './services/authService';
import Login from "./Login";
import { Chart, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import Planner from './pages/Planner';
import Budget from './pages/Budget';
import Dynamics from './pages/Dynamics';
import Friends from './pages/Friends';

Chart.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function App() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [expandedChatId, setExpandedChatId] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [editForm, setEditForm] = useState({
    type: '',
    category: '',
    amount: '',
    note: '',
    date: ''
  });
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState([]);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [dashboardCollapsed, setDashboardCollapsed] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [profileMode, setProfileMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
    currentPassword: ''
  });
  const [highlightedEntries, setHighlightedEntries] = useState([]);
  const [highlightTimeout, setHighlightTimeout] = useState(null);

  // -------------------- Effects (always at top level) --------------------
  // Initialize auth state from localStorage and validate token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthChecking(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          clearAuth(); // Use the imported clearAuth
          setUser(null);
          return;
        }

        const isValid = await validateToken(); // Use the imported validateToken
        if (!isValid) {
          clearAuth();
          setUser(null);
          // Clear all cached data
          setSummary(null);
          localStorage.removeItem("lastSummary");
          localStorage.removeItem("lastSummaryUserId");
          localStorage.removeItem("lastSummaryTime");
        } else {
          // Fetch complete user data from the server
          try {
            const res = await fetch('http://localhost:5000/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (res.ok) {
              const userData = await res.json();
              setUser(userData);
              localStorage.setItem("user", JSON.stringify(userData));
            } else {
              throw new Error('Failed to fetch user data');
            }
          } catch (err) {
            console.error('Error fetching user data:', err);
            clearAuth();
            setUser(null);
          }
          
          // Clear any previous summary data
          setSummary(null);
          localStorage.removeItem("lastSummary");
          localStorage.removeItem("lastSummaryUserId");
          localStorage.removeItem("lastSummaryTime");
        }
      } catch (err) {
        console.error('Auth check error:', err);
        clearAuth();
        setUser(null);
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, []);

  // Reset expanded chat when user changes
  useEffect(() => {
    setExpandedChatId(null);
  }, [user]);

  // Load initial data and friends when user is validated
  useEffect(() => {
    // Clear all data when user is null
    if (!user) {
      setFriends([]);
      setEntries([]);
      setSummary(null);
      setFilter('all');
      setEntriesLoading(false);
      setEntriesError('');
      setSummaryLoading(false);
      setSummaryError('');
      return;
    }

    // Debug logging
    console.log('Current User:', user);

    // Load data only once when user is first set
    const loadInitialData = async () => {
      const token = localStorage.getItem("token");
      
      // Load entries first
      try {
        console.log('Fetching entries for user:', user.id);
        const entriesData = await fetchEntries();
        console.log('Received entries:', entriesData);
        setEntries(Array.isArray(entriesData) ? entriesData : []);
      } catch (err) {
        console.error('Error fetching entries:', err);
        setEntriesError('Failed to load entries.');
      }

      // Load friends
      try {
        const res = await fetch("http://localhost:5000/api/chat/friends", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setFriends(data.friends || []);
      } catch {
        setFriends([]);
      }

      // Try to load cached summary for this user
      const cachedSummary = localStorage.getItem("lastSummary");
      const cachedUserId = localStorage.getItem("lastSummaryUserId");
      const currentUserId = localStorage.getItem("user");
      
      // Only load cached summary if it belongs to the current user
      if (cachedSummary && cachedUserId === currentUserId) {
        try {
          setSummary(JSON.parse(cachedSummary));
        } catch (e) {
          console.error("Failed to parse cached summary");
          localStorage.removeItem("lastSummary");
          localStorage.removeItem("lastSummaryUserId");
        }
      } else {
        // Clear summary if it belongs to a different user
        setSummary(null);
        localStorage.removeItem("lastSummary");
        localStorage.removeItem("lastSummaryUserId");
      }
    };

    loadInitialData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent background scroll when settings panel is open
  useEffect(() => {
    if (settingsPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [settingsPanelOpen]);

  // -------------------- Functions --------------------
  
  // Function to load/refresh friends list
  const loadFriends = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/chat/friends", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
    }
  };

  const generateNewSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryLoading(true);
    setSummaryError('');
    
    try {
      const summaryData = await fetchSummary();
      if (summaryData) {
        // Check if the API returned an error about daily limit
        if (summaryData.error && summaryData.error.toLowerCase().includes('daily limit')) {
          setSummaryError('OpenRouter API daily limit reached. Please try again tomorrow.');
          setSummary(null);
          return;
        }
        
        setSummary(summaryData);
        
        // Save summary with user ID
        if (user?.id) {
          localStorage.setItem("lastSummary", JSON.stringify(summaryData));
          localStorage.setItem("lastSummaryUserId", user.id);
          localStorage.setItem("lastSummaryTime", Date.now().toString());
        }
      }
    } catch (err) {
      console.error('Summary fetch error:', err);
      setSummaryError(err.message === 'Summary request timed out' 
        ? 'Request timed out. Please try again.'
        : 'Failed to generate summary. Backend might be disconnected.');
    } finally {
      setSummaryLoading(false);
      setIsGeneratingSummary(false);
    }
  };

  const reloadData = async (forceSummary = false) => {
    setEntriesLoading(true);
    setEntriesError('');
    
    const hasToken = !!localStorage.getItem("token");
    if (!hasToken) {
      setSummary(null);
      return;
    }

    // Always reload entries
    try {
      const entriesData = await fetchEntries();
      setEntries(Array.isArray(entriesData) ? entriesData : []);
    } catch (err) {
      setEntriesError('Failed to load entries.');
    } finally {
      setEntriesLoading(false);
    }

    // If forcing summary update, use generateNewSummary
    if (forceSummary) {
      await generateNewSummary();
    }
  };

  const cancelEditing = () => {
    setEditingEntry(null);
    setEditForm({ type: '', category: '', amount: '', note: '', date: '' });
  };

  const startEditing = (entry) => {
    setEditingEntry(entry._id);
    setEditForm({ ...entry, date: entry.date?.split('T')[0] || '' }); // Trim timestamp
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/entries/${id}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
      if (res.ok) {
        // Only reload entries
        await reloadData(false);
      } else {
        console.error("Failed to delete");
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/entries/${editingEntry}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        cancelEditing();
        // Only reload entries
        reloadData(false);
      } else {
        console.error("Failed to update entry");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  // -------------------- Settings Panel Functions --------------------
  const handleLogout = () => {
    clearAuth(); 
    setUser(null);
    setEntries([]);
    setFriends([]);
    setSummary(null);
    setSettingsPanelOpen(false);
    setProfileMode(false);
  };

  const handleProfileClick = () => {
    setProfileMode(true);
    setProfileForm({
      username: user.username || '',
      email: user.email || '',
      newPassword: '',
      confirmPassword: '',
      currentPassword: ''
    });
  };

  const handleBackToSettings = () => {
    setProfileMode(false);
    setProfileForm({
      username: '',
      email: '',
      newPassword: '',
      confirmPassword: '',
      currentPassword: ''
    });
  };

  const handleProfileUpdate = async () => {
    if (!profileForm.currentPassword) {
      alert('Please enter your current password to confirm changes.');
      return;
    }

    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        currentPassword: profileForm.currentPassword,
        username: profileForm.username,
        email: profileForm.email
      };

      if (profileForm.newPassword) {
        updateData.newPassword = profileForm.newPassword;
      }

      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('Profile updated successfully! Please log in again with your new credentials.');
        handleLogout();
      } else {
        const error = await response.json();
        alert(`Failed to update profile: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/delete-user', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Account deleted successfully');
        handleLogout();
      } else {
        const error = await response.json();
        alert(`Failed to delete account: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  // Handle calendar date click to highlight entries
  const handleDateClick = (date) => {
    // Clear any existing timeout
    if (highlightTimeout) {
      clearTimeout(highlightTimeout);
    }

    // Format date to match entry dates
    const formatDateToString = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const clickedDateStr = formatDateToString(date);
    
    // Find entries that match the clicked date
    const matchingEntries = entries.filter(entry => {
      if (!entry.date) return false;
      const entryDateStr = formatDateToString(entry.date);
      return entryDateStr === clickedDateStr;
    });

    if (matchingEntries.length > 0) {
      // Highlight the matching entries
      setHighlightedEntries(matchingEntries.map(entry => entry._id));
      
      // Scroll to the first highlighted entry after a short delay to ensure rendering
      setTimeout(() => {
        const firstEntryId = matchingEntries[0]._id;
        const entryElement = document.getElementById(`entry-${firstEntryId}`);
        if (entryElement) {
          entryElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);
      
      // Set timeout to clear highlights after 3 seconds
      const timeout = setTimeout(() => {
        setHighlightedEntries([]);
        setHighlightTimeout(null);
      }, 3000);
      
      setHighlightTimeout(timeout);
    }
  };

  // -------------------- Navigation Functions (Optimized with useCallback) --------------------
  const navigateToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // -------------------- Derived/UI data --------------------
  const pieData = useMemo(() => {
    return summary?.currentWeek ? {
      labels: ['Income', 'Expense', 'Savings'],
      datasets: [{
        data: [
          summary.currentWeek.income,
          summary.currentWeek.expense,
          summary.currentWeek.savings
        ],
        backgroundColor: ['#3498db', '#e74c3c', '#2ecc71']
      }]
    } : null;
  }, [summary?.currentWeek]);

  const lineData = useMemo(() => {
    return (summary?.currentWeek && summary?.previousWeek) ? {
      labels: ['Last Week', 'This Week'],
      datasets: [
        {
          label: 'Income',
          data: [summary.previousWeek.income, summary.currentWeek.income],
          borderColor: '#3498db',
          fill: false
        },
        {
          label: 'Expense',
          data: [summary.previousWeek.expense, summary.currentWeek.expense],
          borderColor: '#e74c3c',
          fill: false
        },
        {
          label: 'Savings',
          data: [summary.previousWeek.savings, summary.currentWeek.savings],
          borderColor: '#2ecc71',
          fill: false
        }
      ]
    } : null;
  }, [summary?.currentWeek, summary?.previousWeek]);

  // -------------------- Early return for login (AFTER hooks) --------------------
  if (authChecking) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      Checking authentication...
    </div>;
  }

  if (!user) {
    return <Login onLoggedIn={async (userData) => {
      console.log('New user logging in:', userData);
      // Clear any existing data first
      setEntries([]);
      setFriends([]);
      setSummary(null);
      
      // Reset to dashboard page for new login
      setCurrentPage('dashboard');
      setDashboardCollapsed(true); // Start with collapsed dashboard
      
      // Set the new user, which will trigger the useEffect to load their data
      setUser(userData);
      // Force a new fetch of entries
      try {
        const entriesData = await fetchEntries();
        console.log('Initial entries load:', entriesData);
        setEntries(Array.isArray(entriesData) ? entriesData : []);
      } catch (err) {
        console.error('Error loading initial entries:', err);
      }
    }} />;
  }

  // -------------------- JSX --------------------
  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh'
      }}
    >
      {/* App Header */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
        padding: '1.5rem',
        marginBottom: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo and Title Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          userSelect: 'none'
        }}>
          <img 
            src={require('./assets/2.png')} 
            alt="CashCompass Logo" 
            style={{
              height: '60px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
            userSelect: 'none'
          }}>
            <h1 style={{
              margin: 0,
              color: '#ffffff',
              fontSize: '2.5rem',
              fontFamily: '"Segoe UI", Arial, sans-serif',
              fontWeight: '600',
              letterSpacing: '1px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              userSelect: 'none'
            }}>
              CashCompass
            </h1>
            <span style={{
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: '400',
              opacity: '0.9',
              fontStyle: 'italic',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
              userSelect: 'none'
            }}>
              Your ultimate finance tracker
            </span>
          </div>
        </div>

        {/* Welcome User and Logout Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          {user && (
            <span style={{
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: '400',
              opacity: '0.9',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
              userSelect: 'none'
            }}>
              Welcome, {user.username || user.email}!
            </span>
          )}

          {/* Settings Button */}
          <button
          onClick={() => setSettingsPanelOpen(true)}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            color: "#fff",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            padding: "0.5rem",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "all 0.2s",
            backdropFilter: "blur(5px)",
            textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
            userSelect: "none",
            width: "40px",
            height: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            hover: {
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              borderColor: "rgba(255, 255, 255, 0.4)"
            }
          }}
        >
          <div style={{
            width: "20px",
            height: "3px",
            backgroundColor: "#fff",
            borderRadius: "1.5px",
            display: "block"
          }}></div>
          <div style={{
            width: "20px",
            height: "3px",
            backgroundColor: "#fff",
            borderRadius: "1.5px",
            display: "block"
          }}></div>
          <div style={{
            width: "20px",
            height: "3px",
            backgroundColor: "#fff",
            borderRadius: "1.5px",
            display: "block"
          }}></div>
        </button>
        </div>
      </div>

      {/* Dashboard Navigation */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
        marginBottom: '2rem',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: dashboardCollapsed ? '0' : '1rem'
        }}>
          <h3 style={{ 
            margin: '0', 
            color: '#000',
            fontSize: '1.5rem',
            textAlign: 'left',
            userSelect: 'none'
          }}>
            Dashboard
          </h3>
          <button
            onClick={() => setDashboardCollapsed(!dashboardCollapsed)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              color: '#222',
              cursor: 'pointer',
              padding: '0.5rem',
              fontSize: '1rem',
              backdropFilter: 'blur(8px)',
              userSelect: 'none',
              transition: 'all 0.2s ease'
            }}
            title={dashboardCollapsed ? "Expand Dashboard" : "Collapse Dashboard"}
          >
            {dashboardCollapsed ? '▼' : '▲'}
          </button>
        </div>
        
        {!dashboardCollapsed && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button 
              onClick={() => navigateToPage('home')}
              style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: currentPage === 'home' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: currentPage === 'home' ? '2px solid rgba(52, 152, 219, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: currentPage === 'home' ? '#222' : '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              backdropFilter: 'blur(8px)',
              userSelect: 'none'
            }}>
              Home
            </button>
          <button 
            onClick={() => navigateToPage('friends')}
            style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: currentPage === 'friends' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: currentPage === 'friends' ? '2px solid rgba(52, 152, 219, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: currentPage === 'friends' ? '#222' : '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            backdropFilter: 'blur(8px)',
            userSelect: 'none'
          }}>
            Friends
          </button>
          <button 
            onClick={() => navigateToPage('budget')}
            style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: currentPage === 'budget' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: currentPage === 'budget' ? '2px solid rgba(52, 152, 219, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: currentPage === 'budget' ? '#222' : '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            backdropFilter: 'blur(8px)',
            userSelect: 'none'
          }}>
            Budget
          </button>
          <button 
            onClick={() => navigateToPage('dynamics')}
            style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: currentPage === 'dynamics' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: currentPage === 'dynamics' ? '2px solid rgba(52, 152, 219, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: currentPage === 'dynamics' ? '#222' : '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            backdropFilter: 'blur(8px)',
            userSelect: 'none'
          }}>
            Dynamics
          </button>
          <button 
            onClick={() => navigateToPage('planner')}
            style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: currentPage === 'planner' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: currentPage === 'planner' ? '2px solid rgba(52, 152, 219, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: currentPage === 'planner' ? '#222' : '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            backdropFilter: 'blur(8px)',
            userSelect: 'none'
          }}>
            Planner
          </button>
        </div>
        )}
      </div>

      {/* Conditional Page Content */}
      {currentPage === 'home' && (
        <>
          {/* Summary Section with Generate Button - Moved to Dynamics page */}
          {/* 
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            marginBottom: '2rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            Weekly Summary content moved to Dynamics page
          </div>
          */}

      {/* Budget Card */}
      {/* <div style={{ width: '100%', marginBottom: '2rem' }}>
        <BudgetCard user={user} />
      </div> */}

      {/* Weekly Planner Card */}
      {/* <div style={{ width: '100%', marginBottom: '2rem' }}>
        <WeeklyPlannerCard user={user} />
      </div> */}

      {/* Calendar Card */}
      <div style={{ width: '100%', marginBottom: '2rem' }}>
        <CalendarCard entries={entries} onDateClick={handleDateClick} />
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 260px', minWidth: 260, maxWidth: 300 }}>
          {/* Add Entry */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(12px)',
            marginBottom: '1rem'
          }}>
            <AddEntryForm onEntryAdded={() => reloadData(false)} />
          </div>
        </div>

        {/* Entries List */}
        <div style={{
          flex: '2 1 500px',
          padding: '1.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(12px)'
        }}>
          <h2 style={{ marginBottom: '1rem', color: '#222', textAlign: 'left', fontSize: '1.5rem', fontWeight: '600', userSelect: 'none' }}>Entries</h2>

          {entriesLoading && <p style={{ fontStyle: 'italic', userSelect: 'none' }}>Loading entries...</p>}
          {entriesError && <p style={{ color: 'red', userSelect: 'none' }}>{entriesError}</p>}

          <label style={{ marginBottom: '1rem', display: 'block', userSelect: 'none' }}>
            Filter Entries:
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ 
                marginLeft: '0.9rem',
                padding: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                backdropFilter: 'blur(12px)',
                color: '#222',
                outline: 'none'
              }}
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>

          <input
            type="text"
            placeholder="🔍︎ Search entries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              color: '#222',
              outline: 'none'
            }}
          />

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {entries
              .slice() // Create a copy to avoid mutating original array
              .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
              .filter(entry =>
                (filter === 'all' || entry.type === filter) &&
                (
                  (entry.category || '').toLowerCase().includes(search.toLowerCase()) ||
                  (entry.note || '').toLowerCase().includes(search.toLowerCase())
                )
              )
              .map((entry) => {
                const isHighlighted = highlightedEntries.includes(entry._id);
                return (
                <li
                  key={entry._id}
                  id={`entry-${entry._id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    padding: '1rem',
                    border: isHighlighted 
                      ? '2px solid rgba(52, 152, 219, 0.8)' 
                      : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    backgroundColor: isHighlighted 
                      ? 'rgba(52, 152, 219, 0.2)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)',
                    transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                    boxShadow: isHighlighted 
                      ? '0 8px 20px rgba(52, 152, 219, 0.3)' 
                      : '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {editingEntry === entry._id ? (
                    <form onSubmit={handleEditSubmit} style={{ flex: 1 }}>
                      <input
                        type="text"
                        name="category"
                        value={editForm.category}
                        onChange={handleEditChange}
                        required
                      />
                      <input
                        type="number"
                        name="amount"
                        value={editForm.amount}
                        onChange={handleEditChange}
                        required
                      />
                      <input
                        type="text"
                        name="note"
                        value={editForm.note}
                        onChange={handleEditChange}
                      />
                      <input
                        type="date"
                        name="date"
                        value={editForm.date}
                        onChange={handleEditChange}
                        required
                      />
                      <select
                        name="type"
                        value={editForm.type}
                        onChange={handleEditChange}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <button type="submit" style={{ marginLeft: '0.5rem' }}>
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', width: '100%' }}>
                      <div style={{ flex: 1 }}>
                        <strong>{entry.category}</strong>: ${entry.amount} ({entry.type})
                        <br />
                        <small>{entry.note}</small>
                      </div>
                      <div>
                        <button
                          onClick={() => startEditing(entry)}
                          style={{
                            marginRight: '0.5rem',
                            background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '5px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteEntry(entry._id)}
                          style={{
                            backgroundColor: '#ff3b3b',
                            color: '#fff',
                            border: 'none',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '5px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
              })}
          </ul>
        </div>
      </div>
        </>
      )}

      {/* Planner Page */}
      {currentPage === 'planner' && (
        <Planner />
      )}

      {/* Budget Page */}
      {currentPage === 'budget' && (
        <Budget user={user} />
      )}

      {/* Friends Page */}
      {currentPage === 'friends' && (
        <Friends 
          user={user}
          friends={friends}
          expandedChatId={expandedChatId}
          setExpandedChatId={setExpandedChatId}
          refreshFriends={loadFriends}
        />
      )}

      {/* Dynamics Page */}
      {currentPage === 'dynamics' && (
        <Dynamics 
          user={user}
          summary={summary}
          summaryLoading={summaryLoading}
          summaryError={summaryError}
          isGeneratingSummary={isGeneratingSummary}
          generateNewSummary={generateNewSummary}
          pieData={pieData}
          lineData={lineData}
        />
      )}

      {/* Settings Panel */}
      {settingsPanelOpen && (
        <>
          {/* Overlay */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 1000
            }}
            onClick={() => setSettingsPanelOpen(false)}
          />
          
          {/* Settings Panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: settingsPanelOpen ? 0 : '-300px',
              height: '100vh',
              width: '300px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRight: 'none',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Panel Header - Fixed */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '2rem 2rem 1rem 2rem',
              flexShrink: 0
            }}>
              <h2 style={{
                margin: 0,
                color: '#ffffff',
                fontSize: '1.8rem',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
              }}>
                {profileMode ? 'Profile' : 'Settings'}
              </h2>
              <button
                onClick={profileMode ? handleBackToSettings : () => setSettingsPanelOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s',
                  hover: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {profileMode ? '←' : '×'}
              </button>
            </div>

            {/* Panel Content - Scrollable */}
            <div style={{
              flex: 1,
              padding: '0 2rem 2rem 2rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {!profileMode ? (
                // Settings Mode - Show buttons
                <>
                  {/* Profile Button */}
                  <button
                    onClick={handleProfileClick}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      padding: '1rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: '500',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      backdropFilter: 'blur(10px)',
                      boxSizing: 'border-box'
                    }}
                  >
                    Profile
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      padding: '1rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: '500',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      backdropFilter: 'blur(10px)',
                      boxSizing: 'border-box'
                    }}
                  >
                    Logout
                  </button>

                  {/* Delete User Button */}
                  <button
                    onClick={handleDeleteUser}
                    style={{
                      backgroundColor: 'rgba(220, 53, 69, 0.2)',
                      color: '#ffffff',
                      border: '1px solid rgba(220, 53, 69, 0.5)',
                      padding: '1rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: '500',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      backdropFilter: 'blur(10px)',
                      boxSizing: 'border-box'
                    }}
                  >
                    Delete Account
                  </button>
                </>
              ) : (
                // Profile Mode - Show form
                <>
                  {/* Username Field */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem',
                      fontWeight: '500'
                    }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Email Field */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem',
                      fontWeight: '500'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* New Password Field */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem',
                      fontWeight: '500'
                    }}>
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({...profileForm, newPassword: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Confirm New Password Field */}
                  {profileForm.newPassword && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{
                        display: 'block',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        marginBottom: '0.5rem',
                        fontWeight: '500'
                      }}>
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={profileForm.confirmPassword}
                        onChange={(e) => setProfileForm({...profileForm, confirmPassword: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(8px)',
                          color: '#ffffff',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}

                  {/* Current Password Field */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem',
                      fontWeight: '500'
                    }}>
                      Current Password (required to confirm changes)
                    </label>
                    <input
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm({...profileForm, currentPassword: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Update Button */}
                  <button
                    onClick={handleProfileUpdate}
                    style={{
                      backgroundColor: 'rgba(52, 152, 219, 0.3)',
                      color: '#ffffff',
                      border: '1px solid rgba(52, 152, 219, 0.5)',
                      padding: '1rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: '500',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      backdropFilter: 'blur(10px)',
                      boxSizing: 'border-box'
                    }}
                  >
                    Update Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
