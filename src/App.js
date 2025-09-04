import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ETFTradingProvider, useETFTrading } from './context/ETFTradingContext';
import Dashboard from './pages/Dashboard';
import Holdings from './pages/Holdings';
import SoldItems from './pages/SoldItems';
import ETFRanking from './pages/ETFRanking';
import Strategy from './pages/Strategy';
import MoneyManagement from './components/MoneyManagement';
import DataImport from './components/DataImport';
import UserSetup from './components/UserSetup';
import UserAuth from './components/UserAuth';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Profile from './pages/Profile';
import ProxyConfig from './components/ProxyConfig';

const AppContent = () => {
  const { auth, userSetup, completeUserSetup, userLogin, userSignup, userLogout } = useETFTrading();
  const [showDataImport, setShowDataImport] = useState(false);
  // Real trading mode only
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(prefersDark);
    applyTheme(prefersDark);

    // Real trading mode only
  }, []);

  // Apply theme to body
  const applyTheme = (isDark) => {
    const body = document.body;
    if (isDark) {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    } else {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // Save preference
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    
    // Apply theme
    applyTheme(newMode);
  };

  // Real trading mode only

  console.log('=== AppContent Debug Info ===');
  console.log('auth.isAuthenticated:', auth.isAuthenticated);
  console.log('auth.currentUser:', auth.currentUser);
  console.log('userSetup.isCompleted:', userSetup.isCompleted);
  console.log('showDataImport:', showDataImport);
  // Real trading mode only

  const handleUserSetupComplete = (userData) => {
    console.log('User setup completed:', userData);
    completeUserSetup(userData);
    
    // Show data import ONLY for new users with ETF experience
    if (userData.hasETFTradingExperience && !auth.currentUser?.isExistingUser) {
      console.log('📁 New user with ETF experience - showing data import');
      setShowDataImport(true);
    } else {
      console.log('🏠 User setup complete - going to dashboard');
      setShowDataImport(false);
    }
  };

  const handleDataImportComplete = () => {
    console.log('Data import completed - going to dashboard');
    setShowDataImport(false);
  };

  const handleLogin = async (credentials) => {
    await userLogin(credentials);
  };

  const handleSignup = async (userData) => {
    await userSignup(userData);
  };

  // Always show login/signup if not authenticated
  if (!auth.isAuthenticated) {
    console.log('🔐 Showing UserAuth - user not authenticated');
    return <UserAuth onLogin={handleLogin} onSignup={handleSignup} />;
  }

  // Check if user is an existing user (has completed setup before)
  const isExistingUser = auth.currentUser && auth.currentUser.isExistingUser;
  
  console.log('Is existing user (state):', isExistingUser);
  console.log('User setup completed:', userSetup.isCompleted);
  
  // If authenticated but user setup not completed AND not an existing user, show user setup
  if (!userSetup.isCompleted && !isExistingUser) {
    console.log('🆕 Showing UserSetup component for new user');
    return <UserSetup onComplete={handleUserSetupComplete} />;
  }

  // Show data import ONLY for new users with ETF experience (not existing users)
  if (showDataImport && !isExistingUser) {
    console.log('📁 Showing DataImport component for new user with ETF experience');
    return <DataImport onImportComplete={handleDataImportComplete} />;
  }

  console.log('🏠 Showing main app - user is authenticated and setup is complete');
  return (
    <div className="flex h-screen bg-upstox-primary">
      {/* Sidebar */}
      <Sidebar currentUser={auth.currentUser} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <Navbar 
          onLogout={userLogout} 
          currentUser={auth.currentUser} 
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
        {/* Global Ticker removed as requested */}
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/sold-items" element={<SoldItems />} />
            <Route path="/etf-ranking" element={<ETFRanking />} />
            {/* Eligible page removed - content moved to Dashboard */}
            <Route path="/strategy" element={<Strategy />} />
            <Route path="/money-management" element={<MoneyManagement />} />
            <Route path="/data-import" element={<DataImport onImportComplete={handleDataImportComplete} />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
      
      {/* Proxy Configuration Panel */}
      <ProxyConfig />
    </div>
  );
};

const App = () => {
  return (
    <ETFTradingProvider>
      <Router>
        <AppContent />
      </Router>
    </ETFTradingProvider>
  );
};

export default App; 