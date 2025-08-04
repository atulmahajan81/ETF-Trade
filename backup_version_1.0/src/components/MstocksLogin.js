import React, { useState } from 'react';
import mstocksApiService from '../services/mstocksApi';

const MstocksLogin = ({ onLoginSuccess, onLoginError }) => {
  const [step, setStep] = useState(1); // 1: username/password, 2: OTP
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    apiKey: 'RNGlIJO6Ua+J0NWjZ+jnyA==', // Hidden API key
    requestToken: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isDemoMode) {
        // Demo mode - simulate successful login
        console.log('Demo mode: Simulating login');
        setStep(2);
        return;
      }

      // Step 1: Login with username and password using MStocks API
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await fetch('https://api.mstock.trade/openapi/typea/connect/login', {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Login failed: ${response.status}`);
      }

      const loginData = await response.json();
      
      if (loginData.status === 'success') {
        // Store the UGID for session generation
        setCredentials(prev => ({
          ...prev,
          ugid: loginData.data.ugid
        }));
        setStep(2);
      } else {
        throw new Error(loginData.message || 'Login failed');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to MStocks API. Please check your internet connection or try demo mode.');
      } else {
        setError(err.message || 'Login failed. Please check your username and password.');
      }
      
      if (onLoginError) {
        onLoginError(err);
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
        // Demo mode - simulate successful session generation
        console.log('Demo mode: Simulating session generation');
        
        // Set demo credentials in the service
        mstocksApiService.setCredentials(
          credentials.username,
          credentials.password,
          'demo_otp'
        );
        
        // Store demo session details
        mstocksApiService.apiKey = 'demo_api_key';
        mstocksApiService.accessToken = 'demo_access_token_12345';
        mstocksApiService.tokenExpiry = new Date(Date.now() + (2 * 60 * 60 * 1000)); // 2 hours
        
        if (onLoginSuccess) {
          onLoginSuccess({
            apiKey: 'demo_api_key',
            accessToken: mstocksApiService.accessToken
          });
        }
        return;
      }

      // Step 2: Generate session token using API key, request token, and checksum
      const formData = new URLSearchParams();
      formData.append('api_key', credentials.apiKey);
      formData.append('request_token', credentials.requestToken);
      formData.append('checksum', 'L'); // Default checksum as per documentation

      const response = await fetch('https://api.mstock.trade/openapi/typea/session/token', {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Session generation failed: ${response.status}`);
      }

      const sessionData = await response.json();
      
      if (sessionData.status === 'success') {
        // Set credentials in the service for future use
        mstocksApiService.setCredentials(
          credentials.username,
          credentials.password,
          credentials.requestToken
        );
        
        // Store session details in service
        mstocksApiService.apiKey = credentials.apiKey;
        mstocksApiService.accessToken = sessionData.data.access_token;
        mstocksApiService.enctoken = sessionData.data.enctoken;
        mstocksApiService.refreshToken = sessionData.data.refresh_token;
        mstocksApiService.tokenExpiry = new Date(Date.now() + (2 * 60 * 60 * 1000)); // 2 hours
        
        if (onLoginSuccess) {
          onLoginSuccess({
            apiKey: credentials.apiKey,
            accessToken: sessionData.data.access_token,
            userData: sessionData.data
          });
        }
      } else {
        throw new Error(sessionData.message || 'Session generation failed');
      }
    } catch (err) {
      console.error('Session generation error:', err);
      
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to MStocks API. Please check your internet connection or try demo mode.');
      } else {
        setError(err.message || 'Session generation failed. Please check your API key and request token.');
      }
      
      if (onLoginError) {
        onLoginError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    mstocksApiService.logout();
    setCredentials({ username: '', password: '', apiKey: '', requestToken: '' });
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

  const isLoggedIn = mstocksApiService.isLoggedIn();

  if (isLoggedIn) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">MStocks Connected</h2>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <p className="text-gray-600 mb-4">
          You are successfully logged into MStocks API.
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
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">MStocks Login</h2>
          <p className="text-sm text-gray-500">
            {step === 1 ? 'Step 1: Enter credentials' : 'Step 2: Enter API details'}
            {isDemoMode && <span className="text-blue-600 font-medium"> (Demo Mode)</span>}
          </p>
        </div>
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

      {/* Step 1: Username and Password */}
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
              value={credentials.username}
              onChange={handleInputChange}
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
                value={credentials.password}
                onChange={handleInputChange}
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
              {error.includes('Network error') && (
                <p className="text-xs text-red-500 mt-1">
                  💡 Tip: Try enabling Demo Mode to test the interface without API calls
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !credentials.username || !credentials.password}
            className={`w-full py-2 px-4 rounded-md font-medium transition duration-200 ${
              isLoading || !credentials.username || !credentials.password
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isDemoMode ? 'Simulating...' : 'Logging in...'}
              </div>
            ) : (
              isDemoMode ? 'Simulate Login' : 'Login'
            )}
          </button>
        </form>
      )}

      {/* Step 2: API Key and Request Token */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-blue-700">
                {isDemoMode 
                  ? 'Demo mode: Enter API details to generate session'
                  : 'Login successful! Now enter your API details to generate session token'
                }
              </p>
            </div>
          </div>



          <div>
            <label htmlFor="requestToken" className="block text-sm font-medium text-gray-700 mb-1">
              Request Token (OTP)
            </label>
            <input
              type="text"
              id="requestToken"
              name="requestToken"
              value={credentials.requestToken}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
              placeholder={isDemoMode ? "123" : "Enter 3-digit OTP"}
              maxLength="3"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              {isDemoMode 
                ? 'Enter any 3-digit token (e.g., 123)'
                : 'Enter the 3-digit OTP sent to your mobile'
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleBackToStep1}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || !credentials.requestToken || credentials.requestToken.length !== 3}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition duration-200 ${
                isLoading || !credentials.requestToken || credentials.requestToken.length !== 3
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isDemoMode ? 'Simulating...' : 'Generating Session...'}
                </div>
              ) : (
                isDemoMode ? 'Simulate Generate Session' : 'Generate Session'
              )}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Important Notes:</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Your credentials are stored locally and not shared</li>
          <li>• API key is required for session generation</li>
          <li>• Session expires after 2 hours for security</li>
          <li>• Demo mode is available for testing without API calls</li>
          <li>• Get API key from <a href="https://trade.mstock.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">trade.mstock.com</a></li>
        </ul>
      </div>
    </div>
  );
};

export default MstocksLogin; 