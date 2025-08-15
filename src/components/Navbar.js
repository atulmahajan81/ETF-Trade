import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const Navbar = ({ onLogout, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
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
            <div className="w-2 h-2 bg-positive rounded-full"></div>
            <span className="text-sm text-upstox-secondary">Market Open</span>
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