import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  TrendingUp, 
  BarChart3, 
  Upload, 
  User, 
  DollarSign,
  Search,
  Clock,
  Settings,
  Activity,
  Target
} from 'lucide-react';

const Sidebar = ({ currentUser }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/holdings', label: 'Holdings', icon: Package },
    { path: '/sold-items', label: 'Sold Items', icon: TrendingUp },
    { path: '/etf-ranking', label: 'ETF Ranking', icon: BarChart3 },
    { path: '/money-management', label: 'Money Management', icon: DollarSign },
    { path: '/strategy', label: 'Strategy', icon: Target },
    { path: '/data-import', label: 'Data Import', icon: Upload },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="sidebar-upstox">
      {/* Logo Section */}
      <div className="p-6 border-b border-upstox-primary">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-upstox-primary">ETF Trading</h1>
            <p className="text-xs text-upstox-muted">Pro v4.1</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'nav-active'
                    : 'text-upstox-secondary hover:bg-upstox-tertiary hover:text-upstox-primary'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-upstox-secondary'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      {currentUser && (
        <div className="p-4 border-t border-upstox-primary">
          <div className="flex items-center space-x-3">
            {currentUser.picture ? (
              <img 
                src={currentUser.picture} 
                alt={currentUser.name || currentUser.username}
                className="w-8 h-8 rounded-full border-2 border-upstox-primary"
              />
            ) : (
              <div className="w-8 h-8 bg-upstox-tertiary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-upstox-muted" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-upstox-primary truncate">
                {currentUser.name || currentUser.username}
              </p>
              <p className="text-xs text-upstox-muted truncate">
                {currentUser.email || 'User'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
