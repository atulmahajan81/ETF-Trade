import React, { useState, useEffect } from 'react';
import mstocksApiService from '../services/mstocksApi';
import shoonyaApiService from '../services/shoonyaApi';

const MultiBrokerLogin = ({ onLoginSuccess, onLoginError }) => {
  const [selectedBroker, setSelectedBroker] = useState('mstocks');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // MStocks credentials
  const [mstocksCredentials, setMstocksCredentials] = useState({
    username: '',
    password: '',
    apiKey: '',
    requestToken: ''
  });
  
  // Shoonya credentials
  const [shoonyaCredentials, setShoonyaCredentials] = useState({
    userId: '',
    password: '',
    apiKey: '',
    vendorCode: '',
    imei: ''
  });

  // Broker options
  const brokerOptions = [
    {
      value: 'mstocks',
      label: 'MStocks',
      description: 'MStocks Trading API',
      icon: 'M'
    },
    {
      value: 'shoonya',
      label: 'Shoonya',
      description: 'Shoonya Fintech API',
      icon: 'S'
    }
  ];

  useEffect(() => {
    // Load saved credentials based on selected broker
    if (selectedBroker === 'mstocks') {
      const saved = mstocksApiService.loadSavedCredentials();
      if (saved) {
        setMstocksCredentials(prev => ({
          ...prev,
          username: saved.username || '',
          password: saved.password || '',
          apiKey: saved.apiKey || ''
        }));
      }
    } else if (selectedBroker === 'shoonya') {
      const saved = shoonyaApiService.loadSavedCredentials();
      if (saved) {
                         setShoonyaCredentials(prev => ({
          ...prev,
          userId: saved.userId || '',
          password: saved.password || '',
          apiKey: saved.apiKey || '',
          vendorCode: saved.vendorCode || '',
          imei: saved.imei || ''
        }));
      }
    }
  }, [selectedBroker]);

  const handleBrokerChange = (e) => {
    setSelectedBroker(e.target.value);
    setStep(1);
    setError('');
  };

  const handleMstocksInputChange = (e) => {
    const { name, value } = e.target;
    setMstocksCredentials(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Save credentials when they change
      if (name === 'username' || name === 'password' || name === 'apiKey') {
        mstocksApiService.saveCredentials(
          updated.username,
          updated.password,
          updated.apiKey
        );
      }
      
      return updated;
    });
  };

  const handleShoonyaInputChange = (e) => {
    const { name, value } = e.target;
    setShoonyaCredentials(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
                                                                                                               // Save credentials when they change
          if (name === 'userId' || name === 'password' || name === 'apiKey' || name === 'vendorCode' || name === 'imei') {
            localStorage.setItem('shoonya_credentials', JSON.stringify(updated));
          }
      
      return updated;
    });
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isDemoMode) {
        console.log('Demo mode: Simulating login');
        setStep(2);
        return;
      }

      if (selectedBroker === 'mstocks') {
        // MStocks Step 1: Login with username and password via direct API
        console.log('🔐 Logging in via direct MStocks API...');
        
        const loginResult = await mstocksApiService.login(
          mstocksCredentials.username,
          mstocksCredentials.password
        );
        
        if (loginResult.status === 'success') {
          console.log('✅ MStocks API login successful');
          setMstocksCredentials(prev => ({
            ...prev,
            requestToken: loginResult.data?.request_token || loginResult.data?.ugid || ''
          }));
          setStep(2);
        } else {
          throw new Error(loginResult.message || 'Login failed');
        }
      } else if (selectedBroker === 'shoonya') {
        // Shoonya: Direct login with all credentials
        const result = await shoonyaApiService.login(
          shoonyaCredentials.userId,
          shoonyaCredentials.password,
          shoonyaCredentials.apiKey,
          shoonyaCredentials.vendorCode,
          shoonyaCredentials.imei
        );
        
        if (result.success) {
          if (onLoginSuccess) {
            onLoginSuccess({
              broker: 'shoonya',
              ...result
            });
          }
        } else {
          throw new Error(result.message);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      if (onLoginError) {
        onLoginError(err.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isDemoMode) {
        console.log('Demo mode: Simulating session generation');
        
        mstocksApiService.setCredentials(
          mstocksCredentials.username,
          mstocksCredentials.password,
          'demo_otp'
        );
        
        mstocksApiService.apiKey = 'demo_api_key';
        mstocksApiService.accessToken = 'demo_access_token_12345';
        mstocksApiService.tokenExpiry = new Date(Date.now() + (2 * 60 * 60 * 1000));
        
        if (onLoginSuccess) {
          onLoginSuccess({
            broker: 'mstocks',
            apiKey: 'demo_api_key',
            accessToken: mstocksApiService.accessToken
          });
        }
        return;
      }

             // MStocks Step 2: Generate session token via direct API
       console.log('🔐 Generating session via direct MStocks API...');
       
       const sessionResult = await mstocksApiService.generateSession(
         mstocksCredentials.apiKey,
         mstocksCredentials.requestToken
       );
      
      if (sessionResult.status === 'success') {
                 console.log('✅ MStocks API session generation successful');
        
        // Also set credentials in browser API for fallback
        mstocksApiService.setCredentials(
          mstocksCredentials.username,
          mstocksCredentials.password,
          mstocksCredentials.requestToken
        );
        
        mstocksApiService.apiKey = mstocksCredentials.apiKey;
        mstocksApiService.accessToken = sessionResult.data?.access_token;
        mstocksApiService.enctoken = sessionResult.data?.enctoken;
        mstocksApiService.refreshToken = sessionResult.data?.refresh_token;
        mstocksApiService.tokenExpiry = new Date(Date.now() + (2 * 60 * 60 * 1000));
        
        if (onLoginSuccess) {
          onLoginSuccess({
            broker: 'mstocks',
            apiKey: mstocksCredentials.apiKey,
            accessToken: sessionResult.data?.access_token,
            userData: sessionResult.data,
                         directApi: true
          });
        }
      } else {
        throw new Error(sessionResult.message || 'Session generation failed');
      }
    } catch (err) {
      console.error('Session generation error:', err);
      setError(err.message || 'Session generation failed. Please check your API key and request token.');
      if (onLoginError) {
        onLoginError(err.message || 'Session generation failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
         if (selectedBroker === 'mstocks') {
       // Logout from MStocks API
       try {
         mstocksApiService.logout();
         console.log('✅ Logged out from MStocks API');
       } catch (error) {
         console.warn('⚠️ MStocks API logout failed:', error);
       }
      
      // Also logout from browser API
      mstocksApiService.logout();
      mstocksApiService.clearCredentials();
      setMstocksCredentials({ username: '', password: '', apiKey: '', requestToken: '' });
    } else if (selectedBroker === 'shoonya') {
      shoonyaApiService.logout();
      setShoonyaCredentials({ userId: '', password: '', apiKey: '', vendorCode: '', imei: '' });
    }
    setError('');
    setStep(1);
    setIsDemoMode(false);
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setError('');
  };

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
    setError('');
  };

  const isLoggedIn = () => {
    if (selectedBroker === 'mstocks') {
      return mstocksApiService.isLoggedIn();
    } else if (selectedBroker === 'shoonya') {
      return shoonyaApiService.isLoggedIn();
    }
    return false;
  };

  const selectedBrokerInfo = brokerOptions.find(b => b.value === selectedBroker);

  if (isLoggedIn()) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{selectedBrokerInfo.label} Connected</h2>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <p className="text-gray-600 mb-4">
          You are successfully logged into {selectedBrokerInfo.label} API.
          {isDemoMode && <span className="text-blue-600 font-medium"> (Demo Mode)</span>}
        </p>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-lg">{selectedBrokerInfo.icon}</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{selectedBrokerInfo.label} Login</h2>
          <p className="text-sm text-gray-500">
            {selectedBroker === 'mstocks' 
              ? (step === 1 ? 'Step 1: Enter credentials' : 'Step 2: Enter API details')
              : 'Enter your credentials'
            }
            {isDemoMode && <span className="text-blue-600 font-medium"> (Demo Mode)</span>}
          </p>
        </div>
      </div>

      {/* Broker Selection */}
      <div className="mb-4">
        <label htmlFor="broker" className="block text-sm font-medium text-gray-700 mb-1">
          Select Broker
        </label>
        <select
          id="broker"
          value={selectedBroker}
          onChange={handleBrokerChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {brokerOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label} - {option.description}
            </option>
          ))}
        </select>
      </div>

      {/* Demo Mode Toggle */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-800 font-medium">Demo Mode</p>
            <p className="text-xs text-yellow-700">Use this for testing without real API calls</p>
          </div>
          <button
            onClick={toggleDemoMode}
            className={`px-3 py-1 rounded-md text-xs font-medium transition duration-200 ${
              isDemoMode
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isDemoMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* MStocks Login Form */}
      {selectedBroker === 'mstocks' && (
        <>
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={mstocksCredentials.username}
                  onChange={handleMstocksInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isDemoMode ? "Enter any username (demo)" : "Enter your MStocks username"}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={mstocksCredentials.password}
                    onChange={handleMstocksInputChange}
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={isDemoMode ? "Enter any password (demo)" : "Enter your password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  id="apiKey"
                  name="apiKey"
                  value={mstocksCredentials.apiKey}
                  onChange={handleMstocksInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isDemoMode ? "Enter any API key (demo)" : "Enter your MStocks API key"}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !mstocksCredentials.username || !mstocksCredentials.password || !mstocksCredentials.apiKey}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                {isLoading ? 'Logging in...' : 'Continue to Step 2'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label htmlFor="requestToken" className="block text-sm font-medium text-gray-700 mb-1">
                  Request Token (OTP)
                </label>
                <input
                  type="text"
                  id="requestToken"
                  name="requestToken"
                  value={mstocksCredentials.requestToken}
                  onChange={handleMstocksInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isDemoMode ? "Enter any OTP (demo)" : "Enter 3-digit OTP from mobile"}
                  maxLength={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Request token (OTP) is sent to your mobile
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !mstocksCredentials.requestToken}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  {isLoading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Shoonya Login Form */}
      {selectedBroker === 'shoonya' && (
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={shoonyaCredentials.userId}
              onChange={handleShoonyaInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isDemoMode ? "Enter any user ID (demo)" : "Enter your Shoonya user ID"}
            />
          </div>

          <div>
            <label htmlFor="shoonyaPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="shoonyaPassword"
                name="password"
                value={shoonyaCredentials.password}
                onChange={handleShoonyaInputChange}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isDemoMode ? "Enter any password (demo)" : "Enter your Shoonya password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="shoonyaApiKey" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="text"
              id="shoonyaApiKey"
              name="apiKey"
              value={shoonyaCredentials.apiKey}
              onChange={handleShoonyaInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isDemoMode ? "Enter any API key (demo)" : "Enter your Shoonya API key"}
            />
          </div>

          <div>
            <label htmlFor="vendorCode" className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Code
            </label>
            <input
              type="text"
              id="vendorCode"
              name="vendorCode"
              value={shoonyaCredentials.vendorCode}
              onChange={handleShoonyaInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isDemoMode ? "Enter any vendor code (demo)" : "Enter your Shoonya vendor code"}
            />
          </div>

                     <div>
             <label htmlFor="imei" className="block text-sm font-medium text-gray-700 mb-1">
               IMEI
             </label>
             <input
               type="text"
               id="imei"
               name="imei"
               value={shoonyaCredentials.imei}
               onChange={handleShoonyaInputChange}
               required
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               placeholder={isDemoMode ? "Enter any IMEI (demo)" : "Enter your Shoonya IMEI"}
             />
           </div>

           

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
                         disabled={isLoading || !shoonyaCredentials.userId || !shoonyaCredentials.password || !shoonyaCredentials.apiKey || !shoonyaCredentials.vendorCode || !shoonyaCredentials.imei}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            {isLoading ? 'Connecting...' : 'Connect to Shoonya'}
          </button>
        </form>
      )}
    </div>
  );
};

export default MultiBrokerLogin; 