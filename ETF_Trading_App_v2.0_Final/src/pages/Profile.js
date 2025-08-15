import React, { useState, useEffect, useCallback } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { 
  User, 
  Settings, 
  Key, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  TestTube,
  Clock,
  LogOut,
  DollarSign,
  Target
} from 'lucide-react';
import mstocksApiService from '../services/mstocksApi';
import shoonyaApiService from '../services/shoonyaApi';
import pythonPriceApiService from '../services/pythonPriceApi';
import SimpleLoginForm from '../components/SimpleLoginForm';

const Profile = () => {
  const { 
    userSetup, 
    isTradingEnabled,
    checkTradingEnabled,
    fetchAccountDetails,
    accountDetails,
    strategy = {},
    moneyManagement = {},
    updateStrategy,
    updateMoneyManagement
  } = useETFTrading();

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [sessionStatus, setSessionStatus] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Load session status
  const loadSessionStatus = useCallback(async () => {
    console.log('🔄 loadSessionStatus called - preventing infinite loop');
    try {
      const status = await pythonPriceApiService.getSessionStatus();
      setSessionStatus(status);
    } catch (error) {
      console.error('Failed to load session status:', error);
    }
  }, []);

  // Check trading status on mount
  useEffect(() => {
    try {
      checkTradingEnabled();
      loadSessionStatus();
    } catch (error) {
      console.error('Error in Profile useEffect:', error);
    }
  }, [checkTradingEnabled, loadSessionStatus]); // Include dependencies

  // Refresh session
  const handleRefreshSession = async () => {
    setSessionLoading(true);
    try {
      const result = await pythonPriceApiService.refreshSession();
      if (result.status === 'success') {
        await loadSessionStatus();
        setTestResult({
          success: true,
          message: 'Session refreshed successfully!'
        });
      } else {
        setTestResult({
          success: false,
          message: result.message || 'Failed to refresh session'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Session refresh failed: ${error.message}`
      });
    } finally {
      setSessionLoading(false);
    }
  };

  // Clear session
  const handleClearSession = async () => {
    setSessionLoading(true);
    try {
      const result = await pythonPriceApiService.clearSession();
      if (result.status === 'success') {
        await loadSessionStatus();
        setTestResult({
          success: true,
          message: 'Session cleared successfully!'
        });
      } else {
        setTestResult({
          success: false,
          message: result.message || 'Failed to clear session'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Session clear failed: ${error.message}`
      });
    } finally {
      setSessionLoading(false);
    }
  };

  // Test broker API connection
  const testBrokerConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      console.log('🧪 Testing broker API connections...');
      
      // Test Python API first (most reliable)
      console.log('🔍 Testing Python API server...');
      const pythonStatus = await pythonPriceApiService.testConnection();
      console.log('🐍 Python API Status:', pythonStatus);
      
      // Test with multiple symbols to verify functionality
      const testSymbols = ['NIFTYBEES', 'MIDSELIETF', 'SETFNIF50'];
      let results = [];
      let brokerName = 'Python MStocks API';
      let apiType = 'Python API';
      
      if (pythonStatus.status === 'success') {
        console.log('🐍 Testing Python API with multiple symbols...');
        
        for (const symbol of testSymbols) {
          try {
            const result = await pythonPriceApiService.getLivePrice(symbol);
            if (result && result.lastPrice && parseFloat(result.lastPrice) > 0) {
              results.push({
                symbol,
                price: result.lastPrice,
                change: result.change,
                changePercent: result.changePercent,
                source: result.source || 'Python MStocks API'
              });
            }
          } catch (error) {
            console.log(`🐍 Error fetching ${symbol}:`, error.message);
          }
        }
        
        if (results.length > 0) {
          setTestResult({
            success: true,
            message: `✅ Successfully connected to ${brokerName}! Fetched ${results.length} live prices.`,
            data: results[0], // Show first result in detail
            allResults: results, // Store all results
            brokerName,
            apiType
          });
          setConnectionStatus('connected');
          return;
        }
      }
      
      // Fallback to browser-based APIs if Python API failed
      console.log('🔄 Python API not available, trying browser APIs...');
      
      if (mstocksApiService.isLoggedIn()) {
        console.log('Testing browser MStocks API...');
        const result = await mstocksApiService.getLivePrice('NIFTYBEES');
        if (result && result.lastPrice && parseFloat(result.lastPrice) > 0) {
          setTestResult({
            success: true,
            message: '✅ Successfully connected to MStocks (Browser API)!',
            data: result,
            brokerName: 'MStocks',
            apiType: 'Browser API'
          });
          setConnectionStatus('connected');
          return;
        }
      } else if (shoonyaApiService.isLoggedIn()) {
        console.log('Testing Shoonya API...');
        const result = await shoonyaApiService.getLivePrice('NIFTYBEES');
        if (result && result.lastPrice && parseFloat(result.lastPrice) > 0) {
          setTestResult({
            success: true,
            message: '✅ Successfully connected to Shoonya (Browser API)!',
            data: result,
            brokerName: 'Shoonya',
            apiType: 'Browser API'
          });
          setConnectionStatus('connected');
          return;
        }
      }
      
      // No working connection found
      throw new Error('No broker is currently connected or all connections failed');
      
    } catch (error) {
      console.error('❌ Broker connection test failed:', error);
      setTestResult({
        success: false,
        message: `❌ Connection test failed: ${error.message}`,
        error: error.message
      });
      setConnectionStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch account details
  const handleFetchAccountDetails = async () => {
    setIsLoading(true);
    try {
      await fetchAccountDetails();
      setTestResult({
        success: true,
        message: 'Account details fetched successfully!'
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        message: `Failed to fetch account details: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from broker
  const disconnectBroker = () => {
    if (mstocksApiService.isLoggedIn()) {
      mstocksApiService.logout();
      setTestResult({
        success: true,
        message: 'Disconnected from MStocks broker'
      });
    } else if (shoonyaApiService.isLoggedIn()) {
      shoonyaApiService.logout();
      setTestResult({
        success: true,
        message: 'Disconnected from Shoonya broker'
      });
    }
    setConnectionStatus('disconnected');
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'broker', name: 'Broker Connection', icon: Key },
    { id: 'strategy', name: 'Strategy', icon: Target },
    { id: 'money', name: 'Money Management', icon: DollarSign },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  // Add error boundary
  if (!userSetup) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
          <p className="text-gray-600 mt-2">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and broker connections</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Profile</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={userSetup?.userData?.username || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={userSetup?.userData?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Capital
                </label>
                <input
                  type="text"
                  value={`₹${userSetup?.initialCapital?.toLocaleString() || 0}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Trading Amount
                </label>
                <input
                  type="text"
                  value={`₹${userSetup?.tradingAmount?.toLocaleString() || 0}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broker Connection Tab */}
      {activeTab === 'broker' && (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Multi-Broker Connection</h2>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : connectionStatus === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {connectionStatus === 'connected' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : connectionStatus === 'failed' ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'failed' ? 'Connection Failed' : 
                   'Not Connected'}
                </span>
              </div>
              
              {isTradingEnabled && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  <span>Trading Enabled</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                <Key className="w-4 h-4" />
                <span>Python API + Multi-Broker Support</span>
              </div>
            </div>
          </div>

          {/* API Connection Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Connection Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Python API Status */}
              <div className={`p-4 rounded-md border ${
                sessionStatus?.logged_in 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      sessionStatus?.logged_in ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <h4 className="text-sm font-medium text-gray-900">Python API</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    sessionStatus?.logged_in 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sessionStatus?.logged_in ? 'Connected' : 'Ready'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Flask server with session persistence</p>
                {sessionStatus?.logged_in && (
                  <p className="text-xs text-green-600 mt-1">✓ Session active</p>
                )}
              </div>

              {/* MStocks Browser API Status */}
              <div className={`p-4 rounded-md border ${
                mstocksApiService.isLoggedIn()
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      mstocksApiService.isLoggedIn() ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <h4 className="text-sm font-medium text-gray-900">MStocks Browser</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    mstocksApiService.isLoggedIn()
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {mstocksApiService.isLoggedIn() ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Direct browser API integration</p>
              </div>

              {/* Shoonya Browser API Status */}
              <div className={`p-4 rounded-md border ${
                shoonyaApiService.isLoggedIn()
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      shoonyaApiService.isLoggedIn() ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <h4 className="text-sm font-medium text-gray-900">Shoonya Browser</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    shoonyaApiService.isLoggedIn()
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {shoonyaApiService.isLoggedIn() ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Direct browser API integration</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Connection Priority</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>1️⃣ <strong>Python API</strong> - Most reliable with session persistence</p>
                <p>2️⃣ <strong>MStocks Browser API</strong> - Direct integration fallback</p>
                <p>3️⃣ <strong>Shoonya Browser API</strong> - Alternative broker option</p>
              </div>
            </div>
          </div>

          {/* Simple MStocks Login Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <SimpleLoginForm 
              onLoginSuccess={(sessionData) => {
                setConnectionStatus('connected');
                setTestResult({
                  success: true,
                  message: `✅ Successfully connected to MStocks via Python API! Session established and ready for real-time data fetching.`,
                  sessionData
                });
                loadSessionStatus(); // Refresh session status after login
              }}
              onLoginError={(error) => {
                setConnectionStatus('failed');
                setTestResult({
                  success: false,
                  message: `❌ MStocks login failed: ${error}`,
                  error: error
                });
              }}
            />
          </div>

          {/* Session Management */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session Management</h3>
            
            {sessionStatus && (
              <div className="space-y-4">
                {/* Session Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-md ${
                    sessionStatus.logged_in && sessionStatus.session_valid 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {sessionStatus.logged_in && sessionStatus.session_valid ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        )}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Session Status</h4>
                          <p className={`text-sm ${
                            sessionStatus.logged_in && sessionStatus.session_valid 
                              ? 'text-green-700' 
                              : 'text-yellow-700'
                          }`}>
                            {sessionStatus.logged_in && sessionStatus.session_valid 
                              ? 'Active' 
                              : sessionStatus.logged_in 
                              ? 'Expired' 
                              : 'Not Logged In'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-md bg-blue-50 border border-blue-200">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Session Duration</h4>
                        <p className="text-sm text-blue-700">
                          {sessionStatus.session_duration_hours || 24} hours
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                {sessionStatus.logged_in && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Session Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Username:</span>
                        <span className="ml-2 font-medium">{sessionStatus.username || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Auto-refresh:</span>
                        <span className={`ml-2 font-medium ${
                          sessionStatus.auto_refresh_available ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {sessionStatus.auto_refresh_available ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                      {sessionStatus.session_expires && (
                        <div className="md:col-span-2">
                          <span className="text-gray-600">Expires:</span>
                          <span className="ml-2 font-medium">
                            {new Date(sessionStatus.session_expires).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Session Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleRefreshSession}
                    disabled={sessionLoading || !sessionStatus.auto_refresh_available}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${sessionLoading ? 'animate-spin' : ''}`} />
                    {sessionLoading ? 'Refreshing...' : 'Refresh Session'}
                  </button>
                  
                  <button
                    onClick={handleClearSession}
                    disabled={sessionLoading || !sessionStatus.logged_in}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Clear Session
                  </button>
                  
                  <button
                    onClick={loadSessionStatus}
                    disabled={sessionLoading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${sessionLoading ? 'animate-spin' : ''}`} />
                    Refresh Status
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResult && (
            <div className={`p-4 rounded-md ${
              testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 mr-2" />
                )}
                <div>
                  <h3 className={`text-sm font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </h3>
                  
                  {/* Show detailed data for single result */}
                  {testResult.data && !testResult.allResults && (
                    <div className="mt-2 text-sm text-green-700">
                      <p><strong>Symbol:</strong> {testResult.data.symbol}</p>
                      <p><strong>Last Price:</strong> ₹{testResult.data.lastPrice}</p>
                      <p><strong>Change:</strong> ₹{testResult.data.change} ({testResult.data.changePercent}%)</p>
                      <p><strong>Source:</strong> {testResult.data.source}</p>
                    </div>
                  )}
                  
                  {/* Show multiple results for Python API test */}
                  {testResult.allResults && testResult.allResults.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Live Prices Fetched:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {testResult.allResults.map((result, index) => (
                          <div key={index} className="bg-white p-3 rounded border border-green-200">
                            <div className="text-sm font-medium text-gray-900">{result.symbol}</div>
                            <div className="text-lg font-bold text-green-600">₹{result.price}</div>
                            <div className="text-xs text-gray-600">
                              {result.change} ({result.changePercent}%)
                            </div>
                            <div className="text-xs text-blue-600">{result.source}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {testResult.error && (
                    <div className="mt-2 text-sm text-red-700">
                      <p><strong>Error:</strong> {testResult.error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Account Details */}
          {accountDetails && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <p className="text-sm text-gray-900">{accountDetails.accountType || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Broker</label>
                  <p className="text-sm text-gray-900">{accountDetails.broker || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <p className="text-sm text-gray-900">{accountDetails.status || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Action Buttons */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={testBrokerConnection}
                disabled={isLoading || connectionStatus !== 'connected'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {isLoading ? 'Testing...' : 'Test Connection'}
              </button>
              
              <button
                onClick={handleFetchAccountDetails}
                disabled={isLoading || connectionStatus !== 'connected'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Fetch Account Details
              </button>
              
              <button
                onClick={disconnectBroker}
                disabled={connectionStatus === 'disconnected'}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Tab */}
      {activeTab === 'strategy' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trading Strategy Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profit Target (%)
                </label>
                <input
                  type="number"
                  value={strategy?.profitTarget || 6}
                  onChange={(e) => updateStrategy({ profitTarget: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="20"
                  step="0.5"
                />
                <p className="text-xs text-gray-500 mt-1">Target profit percentage for selling ETFs</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Averaging Threshold (%)
                </label>
                <input
                  type="number"
                  value={strategy?.averagingThreshold || 2.5}
                  onChange={(e) => updateStrategy({ averagingThreshold: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                  step="0.5"
                />
                <p className="text-xs text-gray-500 mt-1">Percentage drop to trigger averaging down</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max ETFs per Sector
                </label>
                <input
                  type="number"
                  value={strategy?.maxEtfsPerSector || 3}
                  onChange={(e) => updateStrategy({ maxEtfsPerSector: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="5"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum ETFs to hold in a single sector</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Sell Limit
                </label>
                <input
                  type="number"
                  value={strategy?.dailySellLimit || 1}
                  onChange={(e) => updateStrategy({ dailySellLimit: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="5"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum ETFs to sell per day</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Money Management Tab */}
      {activeTab === 'money' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Money Management Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Capital (₹)
                </label>
                <input
                  type="number"
                  value={moneyManagement?.availableCapital || 0}
                  onChange={(e) => updateMoneyManagement({ availableCapital: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">Current available capital for trading</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Buy Amount (₹)
                </label>
                <input
                  type="number"
                  value={moneyManagement?.nextBuyAmount || 0}
                  onChange={(e) => updateMoneyManagement({ nextBuyAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">Amount allocated for next purchase</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Compounding Effect</h3>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                +{moneyManagement?.compoundingEffect?.toFixed(1) || '0'}%
              </div>
              <p className="text-sm text-gray-600">
                Profits are automatically reinvested to increase your trading capital over time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Trading Status</h3>
                  <p className="text-sm text-gray-500">Enable or disable trading functionality</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isTradingEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isTradingEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Broker API Connection</h3>
                  <p className="text-sm text-gray-500">Multi-broker API connection status (MStocks/Shoonya)</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 
                  connectionStatus === 'failed' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'failed' ? 'Failed' : 'Not Connected'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 