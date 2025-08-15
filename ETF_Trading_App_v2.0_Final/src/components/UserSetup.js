import React, { useState } from 'react';
import { User, DollarSign, CheckCircle, AlertCircle, LogIn, UserPlus } from 'lucide-react';

const UserSetup = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(null); // 'new' or 'existing'
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    hasETFTradingExperience: null,
    initialCapital: '',
    tradingAmount: ''
  });

  const [showFormatGuide, setShowFormatGuide] = useState(false);

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    if (type === 'existing') {
      // For existing users, complete setup with default values and go to dashboard
      const defaultUserData = {
        name: 'Existing User',
        email: 'existing@example.com',
        hasETFTradingExperience: true,
        initialCapital: '100000',
        tradingAmount: '2000'
      };
      onComplete(defaultUserData);
    } else {
      // For new users, proceed to next step
      setStep(2);
    }
  };

  const handleNext = () => {
    if (step === 2 && (!userData.name || !userData.email)) {
      alert('Please fill in all required fields');
      return;
    }
    if (step === 3 && userData.hasETFTradingExperience === null) {
      alert('Please select whether you have ETF trading experience');
      return;
    }
    if (step === 4 && !userData.initialCapital) {
      alert('Please enter your initial capital');
      return;
    }
    
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Calculate trading amount (initial capital / 50)
      const tradingAmount = Math.floor(parseFloat(userData.initialCapital) / 50);
      const finalUserData = {
        ...userData,
        tradingAmount: tradingAmount.toString()
      };
      onComplete(finalUserData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Welcome to ETF Trading App v2.0</h2>
        <p className="text-gray-600 mt-2">Are you a new user or an existing user?</p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleUserTypeSelect('new')}
            className="p-6 border-2 border-blue-300 rounded-lg text-center transition-colors hover:border-blue-500 hover:bg-blue-50"
          >
            <UserPlus className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="font-medium text-gray-900">New User</div>
            <div className="text-sm text-gray-500">I'm setting up for the first time</div>
          </button>
          
          <button
            onClick={() => handleUserTypeSelect('existing')}
            className="p-6 border-2 border-green-300 rounded-lg text-center transition-colors hover:border-green-500 hover:bg-green-50"
          >
            <LogIn className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="font-medium text-gray-900">Existing User</div>
            <div className="text-sm text-gray-500">I've used this app before</div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <UserPlus className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
        <p className="text-gray-600 mt-2">Let's set up your account to get started</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={userData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your full name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={userData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email address"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">ETF Trading Experience</h2>
        <p className="text-gray-600 mt-2">Do you already have ETF trading experience?</p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleInputChange('hasETFTradingExperience', true)}
            className={`p-6 border-2 rounded-lg text-center transition-colors ${
              userData.hasETFTradingExperience === true
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
            <div className="font-medium">Yes, I have experience</div>
            <div className="text-sm text-gray-500">I've traded ETFs before</div>
          </button>
          
          <button
            onClick={() => handleInputChange('hasETFTradingExperience', false)}
            className={`p-6 border-2 rounded-lg text-center transition-colors ${
              userData.hasETFTradingExperience === false
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <User className="w-8 h-8 mx-auto mb-2" />
            <div className="font-medium">No, I'm new to ETFs</div>
            <div className="text-sm text-gray-500">This is my first time</div>
          </button>
        </div>
        
        {userData.hasETFTradingExperience === true && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Import Your Data</h3>
            <p className="text-blue-700 text-sm mb-3">
              We can help you import your existing holdings and sold items. 
              Click below to see the required format or import directly.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFormatGuide(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                View Import Format
              </button>
              <button
                onClick={() => {
                  // Complete setup with current data and proceed to import
                  const tradingAmount = Math.floor(parseFloat(userData.initialCapital || '100000') / 50);
                  const finalUserData = {
                    ...userData,
                    initialCapital: userData.initialCapital || '100000',
                    tradingAmount: tradingAmount.toString()
                  };
                  onComplete(finalUserData);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                Import Data Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <DollarSign className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Initial Capital Setup</h2>
        <p className="text-gray-600 mt-2">Enter your initial trading capital</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initial Capital (₹) *
          </label>
          <input
            type="number"
            value={userData.initialCapital}
            onChange={(e) => handleInputChange('initialCapital', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter amount in rupees"
            min="1000"
          />
          <p className="text-sm text-gray-500 mt-1">
            Minimum recommended: ₹50,000
          </p>
        </div>
        
        {userData.initialCapital && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Trading Strategy</h3>
            <div className="space-y-2 text-sm text-green-700">
              <div>• Daily trading amount: ₹{Math.floor(parseFloat(userData.initialCapital) / 50).toLocaleString()}</div>
              <div>• Buy 1 ETF per day</div>
              <div>• Sell 1 ETF per day (when target reached)</div>
              <div>• Compounding: Profits reinvested in next buy</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Setup Complete!</h2>
        <p className="text-gray-600 mt-2">Review your configuration</p>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">User Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div><strong>Name:</strong> {userData.name}</div>
              <div><strong>Email:</strong> {userData.email}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Trading Configuration</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div><strong>Initial Capital:</strong> ₹{parseFloat(userData.initialCapital).toLocaleString()}</div>
              <div><strong>Daily Trading Amount:</strong> ₹{Math.floor(parseFloat(userData.initialCapital) / 50).toLocaleString()}</div>
              <div><strong>Experience Level:</strong> {userData.hasETFTradingExperience ? 'Experienced' : 'Beginner'}</div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-2">Money Management Strategy</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div>• Capital divided into 50 parts for daily trading</div>
            <div>• 1 buy and 1 sell per day maximum</div>
            <div>• Profits automatically reinvested in next purchase</div>
            <div>• Compounding effect for better returns</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFormatGuide = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Data Import Format</h2>
          <button
            onClick={() => setShowFormatGuide(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Holdings CSV Format</h3>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              Buy Date,ETF Code,Underlying Asset,Buy Price,Actual Buy Qty
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Example: 2024-01-15,NSE:NIFTYBEES,NIFTY 50 ETF,245.50,100
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Sold Items CSV Format</h3>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              Buy Date,ETF Code,Underlying Asset,Buy Price,Actual Buy Qty,Sell Price,Sell Date
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Example: 2024-01-10,NSE:BANKBEES,NIFTY Bank ETF,450.00,50,477.00,2024-01-20
            </p>
            <p className="text-sm text-blue-600 mt-1">
              <strong>Note:</strong> Invested amount and profit are calculated automatically
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Export your data from your broker in CSV format</li>
              <li>• Ensure column headers match exactly</li>
              <li>• Dates should be in YYYY-MM-DD format</li>
              <li>• All amounts should be in rupees</li>
              <li>• Invested amount = Buy Price × Quantity (calculated automatically)</li>
              <li>• You can import this data after completing setup</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const steps = [
    { title: 'User Type', component: renderStep1 },
    { title: 'User Info', component: renderStep2 },
    { title: 'Experience', component: renderStep3 },
    { title: 'Capital', component: renderStep4 },
    { title: 'Review', component: renderStep5 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index + 1 <= step 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    index + 1 < step ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-500">
              Step {step} of {steps.length}: {steps[step - 1].title}
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-8">
          {steps[step - 1].component()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`px-6 py-2 rounded-md transition-colors ${
              step === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {step === 5 ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>

      {showFormatGuide && renderFormatGuide()}
    </div>
  );
};

export default UserSetup; 