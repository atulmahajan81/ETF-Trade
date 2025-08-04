import React, { useState } from 'react';
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
import Profile from './pages/Profile';

const AppContent = () => {
  const { auth, userSetup, completeUserSetup, userLogin, userSignup, userLogout } = useETFTrading();
  const [showDataImport, setShowDataImport] = useState(false);

  console.log('=== AppContent Debug Info ===');
  console.log('auth.isAuthenticated:', auth.isAuthenticated);
  console.log('auth.currentUser:', auth.currentUser);
  console.log('userSetup.isCompleted:', userSetup.isCompleted);
  console.log('showDataImport:', showDataImport);

  // Direct check for existing user from localStorage
  const checkExistingUser = () => {
    if (auth.currentUser && auth.currentUser.uid) {
      const savedUsers = localStorage.getItem('etfUsers');
      const users = savedUsers ? JSON.parse(savedUsers) : {};
      const userData = users[auth.currentUser.uid];
      const isExistingUser = userData?.userSetup?.isCompleted;
      console.log('Direct localStorage check - isExistingUser:', isExistingUser);
      return isExistingUser;
    }
    return false;
  };

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

  // If not authenticated, show login/signup
  if (!auth.isAuthenticated) {
    console.log('🔐 Showing UserAuth - user not authenticated');
    return <UserAuth onLogin={handleLogin} onSignup={handleSignup} />;
  }

  // Check if user is an existing user (has completed setup before)
  const isExistingUser = auth.currentUser && auth.currentUser.isExistingUser;
  const directCheckExistingUser = checkExistingUser();
  const finalIsExistingUser = isExistingUser || directCheckExistingUser;
  
  console.log('Is existing user (state):', isExistingUser);
  console.log('Is existing user (direct check):', directCheckExistingUser);
  console.log('Final is existing user:', finalIsExistingUser);
  
  // If authenticated but user setup not completed AND not an existing user, show user setup
  if (!userSetup.isCompleted && !finalIsExistingUser) {
    console.log('🆕 Showing UserSetup component for new user');
    return <UserSetup onComplete={handleUserSetupComplete} />;
  }

  // Show data import ONLY for new users with ETF experience (not existing users)
  if (showDataImport && !finalIsExistingUser) {
    console.log('📁 Showing DataImport component for new user with ETF experience');
    return <DataImport onImportComplete={handleDataImportComplete} />;
  }

  console.log('🏠 Showing main app - user is authenticated and setup is complete');
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLogout={userLogout} currentUser={auth.currentUser} />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/sold-items" element={<SoldItems />} />
          <Route path="/etf-ranking" element={<ETFRanking />} />
          <Route path="/strategy" element={<Strategy />} />
          <Route path="/money-management" element={<MoneyManagement />} />
          <Route path="/data-import" element={<DataImport onImportComplete={handleDataImportComplete} />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
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