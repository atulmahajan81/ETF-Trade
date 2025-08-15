import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Eye, 
  EyeOff,
  Play,
  Square
} from 'lucide-react';

const ProfessionalHeader = ({ 
  userSetup, 
  moneyManagement, 
  userLogout, 
  isDemoMode, 
  onEnableDemo, 
  onDisableDemo 
}) => {
  const [showBalance, setShowBalance] = useState(true);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <header className="bg-upstox-secondary border-b border-upstox-primary sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-upstox-primary">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-blue-light rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-upstox-primary">ETF Trading Pro</h1>
            </div>
            
                         {isDemoMode && (
               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                 <Play className="h-3 w-3 mr-1" />
                 Demo Mode
               </span>
             )}
          </div>
          
          {/* User Info and Controls */}
            <div className="flex items-center gap-6">
            {/* User Info (name/account removed as requested) */}
            
            {/* Balance Display */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 text-upstox-secondary hover:text-upstox-primary transition-colors rounded-md hover:bg-upstox-tertiary"
                title={showBalance ? 'Hide Balance' : 'Show Balance'}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              
              <div className="text-right">
                <div className="text-xs text-upstox-secondary">Available Capital</div>
                <div className="text-sm font-semibold text-upstox-primary">
                  {showBalance ? formatCurrency(moneyManagement?.availableCapital || 0) : '••••••'}
                </div>
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-8 w-px bg-upstox-primary"></div>
            
            {/* Demo Mode Toggle */}
            <div className="flex items-center gap-2">
              {!isDemoMode ? (
                <button
                  onClick={onEnableDemo}
                  className="btn-upstox-secondary"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Demo
                </button>
              ) : (
                 <button
                   onClick={onDisableDemo}
                   className="btn-upstox-danger"
                 >
                   <Square className="h-3 w-3 mr-1" />
                   Exit Demo
                 </button>
              )}
            </div>
            
            {/* Settings and Logout */}
            <div className="flex items-center gap-1">
              <Link 
                to="/profile" 
                className="p-2 text-upstox-secondary hover:text-upstox-primary transition-colors rounded-md hover:bg-upstox-tertiary"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
              
               <button
                 onClick={userLogout}
                 className="p-2 text-upstox-secondary hover:text-negative transition-colors rounded-md hover:bg-upstox-tertiary"
                 title="Logout"
               >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProfessionalHeader;
