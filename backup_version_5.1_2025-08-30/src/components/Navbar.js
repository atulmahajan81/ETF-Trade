import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  Clock,
  Play,
  Square,
  Moon,
  Sun
} from 'lucide-react';

const Navbar = ({ onLogout, currentUser, isDemoMode, onEnableDemo, onDisableDemo, isDarkMode, toggleDarkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [marketStatus, setMarketStatus] = useState('Market Closed');
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Check market status
  const checkMarketStatus = () => {
    const now = new Date();
    
    // Get current time in IST (Indian Standard Time)
    // Use toLocaleString with Asia/Kolkata timezone for accurate IST conversion
    const istTimeString = now.toLocaleString('en-US', { 
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Parse IST time
    const [hours, minutes] = istTimeString.split(':').map(Number);
    const currentTimeInMinutes = hours * 60 + minutes;
    
    // Get IST date for day of week
    const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const dayOfWeek = istDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Market hours: 9:15 AM to 3:30 PM IST (Monday to Friday)
    const marketOpenTime = 9 * 60 + 15; // 9:15 AM
    const marketCloseTime = 15 * 60 + 30; // 3:30 PM
    
    // Check if it's a weekday (Monday = 1, Tuesday = 2, ..., Friday = 5)
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    // Check if market is open
    const isOpen = isWeekday && currentTimeInMinutes >= marketOpenTime && currentTimeInMinutes <= marketCloseTime;
    
    // Debug logging
    console.log('Market Status Debug:', {
      localTime: now.toLocaleString(),
      istTime: istTimeString,
      istDate: istDate.toLocaleDateString(),
      dayOfWeek,
      isWeekday,
      currentTimeInMinutes,
      marketOpenTime,
      marketCloseTime,
      isOpen
    });
    
    if (isOpen) {
      setMarketStatus('Market Open');
      setIsMarketOpen(true);
    } else {
      if (!isWeekday) {
        setMarketStatus('Market Closed (Weekend)');
      } else if (currentTimeInMinutes < marketOpenTime) {
        setMarketStatus('Market Closed (Pre-Market)');
      } else {
        setMarketStatus('Market Closed (After Hours)');
      }
      setIsMarketOpen(false);
    }
  };

  // Initialize market status on component mount
  useEffect(() => {
    // Check market status immediately
    checkMarketStatus();
    
    // Update market status every minute
    const interval = setInterval(checkMarketStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <nav className="navbar-upstox">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section - Search */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-upstox-muted" />
            <input
              type="text"
              placeholder="Search ETFs, stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-upstox pl-10 w-80 text-sm"
            />
          </div>
        </div>

        {/* Center Section - Market Status */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isMarketOpen ? 'bg-upstox-success' : 'bg-upstox-danger'
            }`}></div>
            <span className="text-sm text-upstox-secondary">{marketStatus}</span>
          </div>
          <div className="flex items-center space-x-2 text-upstox-secondary">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{currentTime}</span>
            <span className="text-sm">{currentDate}</span>
          </div>
        </div>

        {/* Right Section - User Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-upstox-secondary hover:text-upstox-primary hover:bg-upstox-tertiary rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-2">
            {!isDemoMode ? (
              <button
                onClick={onEnableDemo}
                className="btn-upstox-secondary text-sm px-3 py-2"
              >
                <Play className="h-3 w-3 mr-1" />
                Demo
              </button>
            ) : (
               <button
                 onClick={onDisableDemo}
                 className="btn-upstox-danger text-sm px-3 py-2"
               >
                 <Square className="h-3 w-3 mr-1" />
                 Exit Demo
               </button>
            )}
          </div>
          
          {isDemoMode && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-upstox-warning text-white">
              <Play className="h-3 w-3 mr-1" />
              Demo Mode
            </span>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-upstox-secondary hover:text-upstox-primary transition-colors rounded-md hover:bg-upstox-tertiary"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Settings */}
          <Link
            to="/profile"
            className="p-2 text-upstox-secondary hover:text-upstox-primary hover:bg-upstox-tertiary rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>

          {/* User Profile */}
          {currentUser && (
            <Link
              to="/profile"
              className="flex items-center space-x-3 px-3 py-2 bg-upstox-tertiary rounded-lg hover:bg-upstox-elevated transition-colors"
            >
              {currentUser.picture ? (
                <img 
                  src={currentUser.picture} 
                  alt={currentUser.name || currentUser.username}
                  className="w-6 h-6 rounded-full border border-upstox-primary"
                />
              ) : (
                <div className="w-6 h-6 bg-upstox-elevated rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-upstox-muted" />
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-medium text-upstox-primary">
                  {currentUser.name || currentUser.username}
                </p>
              </div>
            </Link>
          )}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn-upstox-danger text-sm px-3 py-2"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 