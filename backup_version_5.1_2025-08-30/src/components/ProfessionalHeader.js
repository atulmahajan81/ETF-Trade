import React from 'react';

const ProfessionalHeader = ({ 
  userSetup, 
  moneyManagement, 
  userLogout, 
  isDemoMode, 
  onEnableDemo, 
  onDisableDemo 
}) => {
  return (
    <header className="navbar-upstox">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-upstox-primary">
        <div className="flex items-center justify-between h-16">
          {/* Empty space - logo and controls removed */}
          <div className="flex items-center gap-4">
            {/* Logo and controls removed as requested */}
          </div>
          
          {/* Empty space */}
          <div className="flex items-center gap-4">
            {/* All controls moved to Navbar */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProfessionalHeader;
