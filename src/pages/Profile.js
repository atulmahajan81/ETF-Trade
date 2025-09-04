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
import MstocksLogin from '../components/MstocksLogin';

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
  updateMoneyManagement,
  completeUserSetup
} = useETFTrading();

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [initialCapitalInput, setInitialCapitalInput] = useState(0);
  const [savingCapital, setSavingCapital] = useState(false);

  // Check trading status on mount
  useEffect(() => {
    try {
      checkTradingEnabled();
    } catch (error) {
      console.error('Error in Profile useEffect:', error);
    }
  }, [checkTradingEnabled]);

  // Sync editable initial capital when userSetup loads/changes
  useEffect(() => {
    if (userSetup && typeof userSetup.initialCapital !== 'undefined') {
      setInitialCapitalInput(Number(userSetup.initialCapital) || 0);
    }
  }, [userSetup]);

  // Test broker API connection
  const testBrokerConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      console.log('🧪 Testing broker API connections...');
      
      // Test MStocks Browser API first (priority 1)
      if (mstocksApiService.isLoggedIn()) {
        console.log('Testing MStocks Browser API...');
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
      }
      
      // Test Shoonya Browser API second (priority 2)
      if (shoonyaApiService.isLoggedIn()) {
        console.log('Testing Shoonya Browser API...');
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
      throw new Error('No broker is currently connected. Please login to MStocks or Shoonya.');
      
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
      <div className="min-h-screen bg-upstox-primary text-upstox-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-upstox-primary">Profile & Settings</h1>
            <p className="text-upstox-secondary mt-2">Loading profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-upstox-primary text-upstox-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-upstox-primary">Profile & Settings</h1>
          <p className="text-upstox-secondary mt-2">Manage your account and broker connections</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-upstox-primary mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-upstox-accent text-upstox-primary bg-upstox-tertiary rounded-t-lg'
                      : 'border-transparent text-upstox-secondary hover:text-upstox-primary hover:border-upstox-primary'
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
            <div className="card-upstox">
              <div className="px-6 py-4 border-b border-upstox-primary bg-upstox-tertiary">
                <h2 className="text-xl font-semibold text-upstox-primary">User Profile</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-upstox-primary mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={userSetup?.userData?.username || ''}
                      disabled
                      className="input-upstox bg-upstox-tertiary text-upstox-secondary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-upstox-primary mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userSetup?.userData?.email || ''}
                      disabled
                      className="input-upstox bg-upstox-tertiary text-upstox-secondary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-upstox-primary mb-2">
                      Initial Capital (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={initialCapitalInput}
                      onChange={(e) => setInitialCapitalInput(Number(e.target.value) || 0)}
                      className="input-upstox"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-upstox-primary mb-2">
                      Daily Trading Amount (auto)
                    </label>
                    <input
                      type="text"
                      value={`₹${Math.floor((Number(initialCapitalInput) || 0) / 50).toLocaleString()}`}
                      disabled
                      className="input-upstox bg-upstox-tertiary text-upstox-secondary"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={async () => {
                      try {
                        setSavingCapital(true);
                        const derivedTradingAmount = Math.floor((Number(initialCapitalInput) || 0) / 50);
                        await completeUserSetup({
                          initialCapital: Number(initialCapitalInput) || 0,
                          tradingAmount: derivedTradingAmount,
                          hasETFTradingExperience: !!userSetup?.hasETFTradingExperience,
                          userData: userSetup?.userData || null
                        });
                        setTestResult({ success: true, message: 'Initial capital saved and daily trading amount updated.' });
                      } catch (e) {
                        setTestResult({ success: false, message: e?.message || 'Failed to save changes' });
                      } finally {
                        setSavingCapital(false);
                      }
                    }}
                    disabled={savingCapital}
                    className="btn-upstox-primary"
                  >
                    {savingCapital ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Broker Connection Tab */}
        {activeTab === 'broker' && (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="card-upstox">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-upstox-primary">Multi-Broker Connection</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`status-indicator ${
                    connectionStatus === 'connected' 
                      ? 'status-success' 
                      : connectionStatus === 'failed'
                      ? 'status-error'
                      : 'status-neutral'
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
                       'Ready to Connect'}
                    </span>
                  </div>
                  
                  {isTradingEnabled && (
                    <div className="status-indicator status-primary">
                      <Shield className="w-4 h-4" />
                      <span>Trading Enabled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* API Connection Status */}
            <div className="card-upstox">
              <div className="card-header">
                <h3 className="text-lg font-medium text-upstox-primary">API Connection Status</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* MStocks Browser API Status */}
                  <div className={`p-4 rounded-xl border ${
                    mstocksApiService.isLoggedIn()
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' 
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          mstocksApiService.isLoggedIn() ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-500'
                        }`}></div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">MStocks Browser API</h4>
                      </div>
                      <span className={`badge ${
                        mstocksApiService.isLoggedIn()
                          ? 'badge-success' 
                          : 'badge-neutral'
                      }`}>
                        {mstocksApiService.isLoggedIn() ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Direct integration with session management</p>
                  </div>

                  {/* Shoonya Browser API Status */}
                  <div className={`p-4 rounded-xl border ${
                    shoonyaApiService.isLoggedIn()
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' 
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          shoonyaApiService.isLoggedIn() ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-500'
                        }`}></div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Shoonya Browser API</h4>
                      </div>
                      <span className={`badge ${
                        shoonyaApiService.isLoggedIn()
                          ? 'badge-success' 
                          : 'badge-neutral'
                      }`}>
                        {shoonyaApiService.isLoggedIn() ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Alternative broker option</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 dark:bg-blue-900/20 dark:border-blue-700">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Connection Priority</h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>1️⃣ <strong>MStocks Browser API</strong> - Direct integration with session management</p>
                    <p>2️⃣ <strong>Shoonya Browser API</strong> - Alternative broker option</p>
                  </div>
                </div>
              </div>
            </div>

            {/* MStocks Login Form */}
            <div className="card-upstox">
              <MstocksLogin 
                onLoginSuccess={(sessionData) => {
                  setConnectionStatus('connected');
                  setTestResult({
                    success: true,
                    message: `✅ Successfully connected to MStocks! Session established and ready for real-time data fetching.`,
                    sessionData
                  });
                  // loadSessionStatus(); // Refresh session status after login
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

            {/* Test Results */}
            {testResult && (
              <div className={`p-4 rounded-xl ${
                testResult.success ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-700' : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700'
              }`}>
                <div className="flex items-center">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 dark:text-green-300 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 dark:text-red-300 mr-2" />
                  )}
                  <div>
                    <h3 className={`text-sm font-medium ${
                      testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                    }`}>
                      {testResult.message}
                    </h3>
                    
                    {/* Show detailed data for single result */}
                    {testResult.data && !testResult.allResults && (
                      <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                        <p><strong>Symbol:</strong> {testResult.data.symbol}</p>
                        <p><strong>Last Price:</strong> ₹{testResult.data.lastPrice}</p>
                        <p><strong>Change:</strong> ₹{testResult.data.change} ({testResult.data.changePercent}%)</p>
                        <p><strong>Source:</strong> {testResult.data.source}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Account Details */}
            {accountDetails && (
              <div className="card-upstox">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-upstox-primary">Account Details</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-upstox-primary mb-1">Account Type</label>
                      <p className="text-sm text-upstox-primary">{accountDetails.accountType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-upstox-primary mb-1">Broker</label>
                      <p className="text-sm text-upstox-primary">{accountDetails.broker || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-upstox-primary mb-1">Status</label>
                      <p className="text-sm text-upstox-primary">{accountDetails.status || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Action Buttons */}
            <div className="card-upstox">
              <div className="card-header">
                <h3 className="text-lg font-medium text-upstox-primary">Additional Actions</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={testBrokerConnection}
                    disabled={isLoading || connectionStatus !== 'connected'}
                    className="btn-upstox-secondary"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {isLoading ? 'Testing...' : 'Test Connection'}
                  </button>
                  
                  <button
                    onClick={handleFetchAccountDetails}
                    disabled={isLoading || connectionStatus !== 'connected'}
                    className="btn-upstox-secondary"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Fetch Account Details
                  </button>
                  
                  <button
                    onClick={disconnectBroker}
                    disabled={connectionStatus === 'disconnected'}
                    className="btn-upstox-danger"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Tab */}
        {activeTab === 'strategy' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-neutral-900">Trading Strategy Settings</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Profit Target (%)
                    </label>
                    <input
                      type="number"
                      value={strategy?.profitTarget || 6}
                      onChange={(e) => updateStrategy({ profitTarget: parseFloat(e.target.value) })}
                      className="input"
                      min="1"
                      max="20"
                      step="0.5"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Target profit percentage for selling ETFs</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Averaging Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={strategy?.averagingThreshold || 2.5}
                      onChange={(e) => updateStrategy({ averagingThreshold: parseFloat(e.target.value) })}
                      className="input"
                      min="1"
                      max="10"
                      step="0.5"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Percentage drop to trigger averaging down</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Max ETFs per Sector
                    </label>
                    <input
                      type="number"
                      value={strategy?.maxEtfsPerSector || 3}
                      onChange={(e) => updateStrategy({ maxEtfsPerSector: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                      max="5"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Maximum ETFs to hold in a single sector</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Daily Sell Limit
                    </label>
                    <input
                      type="number"
                      value={strategy?.dailySellLimit || 1}
                      onChange={(e) => updateStrategy({ dailySellLimit: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                      max="5"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Maximum ETFs to sell per day</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Money Management Tab */}
        {activeTab === 'money' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-neutral-900">Money Management Settings</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Available Capital (₹)
                    </label>
                    <input
                      type="number"
                      value={moneyManagement?.availableCapital || 0}
                      onChange={(e) => updateMoneyManagement({ availableCapital: parseFloat(e.target.value) })}
                      className="input"
                      min="0"
                      step="1000"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Current available capital for trading</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Next Buy Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={moneyManagement?.nextBuyAmount || 0}
                      onChange={(e) => updateMoneyManagement({ nextBuyAmount: parseFloat(e.target.value) })}
                      className="input"
                      min="0"
                      step="1000"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Amount allocated for next purchase</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-primary-50 rounded-xl">
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Compounding Effect</h3>
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    +{moneyManagement?.compoundingEffect?.toFixed(1) || '0'}%
                  </div>
                  <p className="text-sm text-neutral-600">
                    Profits are automatically reinvested to increase your trading capital over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-neutral-900">Application Settings</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900">Trading Status</h3>
                      <p className="text-sm text-neutral-500">Enable or disable trading functionality</p>
                    </div>
                    <div className={`badge ${
                      isTradingEnabled ? 'badge-success' : 'badge-error'
                    }`}>
                      {isTradingEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900">Broker API Connection</h3>
                      <p className="text-sm text-neutral-500">Multi-broker API connection status (MStocks/Shoonya)</p>
                    </div>
                    <div className={`badge ${
                      connectionStatus === 'connected' ? 'badge-success' : 
                      connectionStatus === 'failed' ? 'badge-error' : 
                      'badge-neutral'
                    }`}>
                      {connectionStatus === 'connected' ? 'Connected' : 
                       connectionStatus === 'failed' ? 'Failed' : 'Not Connected'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 