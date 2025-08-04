import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, TrendingUp, BarChart3, Settings, Upload, LogOut, User } from 'lucide-react';

const Navbar = ({ onLogout, currentUser }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/holdings', label: 'Holdings', icon: Package },
    { path: '/sold-items', label: 'Sold Items', icon: TrendingUp },
    { path: '/etf-ranking', label: 'ETF Ranking', icon: BarChart3 },
    { path: '/strategy', label: 'Strategy', icon: Settings },
    { path: '/money-management', label: 'Money Management', icon: BarChart3 },
    { path: '/data-import', label: 'Data Import', icon: Upload },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ETF Trading v2.0</h1>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* User Info */}
            {currentUser && (
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                {currentUser.picture ? (
                  <img 
                    src={currentUser.picture} 
                    alt={currentUser.name || currentUser.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {currentUser.name || currentUser.username}
                </span>
              </div>
            )}
            
            {/* Profile Link */}
            <Link
              to="/profile"
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <User className="w-4 h-4 mr-1" />
              Profile
            </Link>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 