import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { getConfigInfo, updateProxyConfig, PROXY_URLS } from '../config/apiConfig';

const ProxyConfig = () => {
  const [config, setConfig] = useState({
    USE_LOCAL_PROXY: false,
    USE_VERCEL_PROXY: false,
    USE_DIRECT_API: true
  });
  const [isVisible, setIsVisible] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [configInfo, setConfigInfo] = useState(null);

  useEffect(() => {
    // Load current configuration from localStorage
    const savedConfig = localStorage.getItem('proxyConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    
    // Get current configuration info
    setConfigInfo(getConfigInfo());
  }, []);

  const updateConfig = (newConfig) => {
    setConfig(newConfig);
    updateProxyConfig(newConfig);
  };

  const testConnection = async () => {
    setTestResult({ status: 'testing', message: 'Testing connection...' });
    
    try {
      console.log('🧪 Testing proxy connection...');
      
      // Get the current proxy URL based on configuration
      let testUrl;
      if (config.USE_LOCAL_PROXY) {
        testUrl = PROXY_URLS.LOCAL.TYPEA;
      } else if (config.USE_VERCEL_PROXY) {
        testUrl = PROXY_URLS.VERCEL.TYPEA;
      } else {
        testUrl = PROXY_URLS.DIRECT.TYPEA;
      }
      
      console.log('Testing URL:', testUrl);
      
      const response = await fetch(`${testUrl}?path=user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setTestResult({ status: 'success', message: 'Proxy connection successful!' });
        console.log('✅ Proxy test successful');
      } else {
        const errorData = await response.text();
        setTestResult({ 
          status: 'error', 
          message: `Proxy error: ${response.status} - ${errorData.substring(0, 100)}...` 
        });
        console.log('❌ Proxy test failed:', response.status, errorData);
      }
    } catch (error) {
      setTestResult({ status: 'error', message: `Connection failed: ${error.message}` });
      console.error('❌ Proxy test error:', error);
    }
  };

  const getConfigDescription = () => {
    if (config.USE_DIRECT_API) {
      return 'Direct API calls (may have CORS issues)';
    } else if (config.USE_LOCAL_PROXY) {
      return 'Local proxy (requires local server)';
    } else {
      return 'Vercel proxy (works without local server)';
    }
  };

  const getConfigColor = () => {
    if (config.USE_DIRECT_API) {
      return 'text-yellow-500';
    } else if (config.USE_LOCAL_PROXY) {
      return 'text-green-500';
    } else {
      return 'text-blue-500';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-upstox-primary text-white p-3 rounded-full shadow-lg hover:bg-upstox-primary/80 transition-all duration-200"
        title="Proxy Configuration"
      >
        <Settings size={20} />
      </button>

      {/* Configuration Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-upstox-card border border-upstox-primary rounded-lg shadow-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-upstox-primary">Proxy Configuration</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-upstox-secondary hover:text-upstox-primary"
            >
              ×
            </button>
          </div>

          {/* Current Configuration */}
          <div className="mb-4 p-3 bg-upstox-dark-secondary rounded">
            <p className="text-sm text-upstox-secondary mb-1">Current Mode:</p>
            <p className={`text-sm font-medium ${getConfigColor()}`}>
              {getConfigDescription()}
            </p>
          </div>

          {/* Configuration Options */}
          <div className="space-y-3 mb-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="proxyConfig"
                checked={config.USE_LOCAL_PROXY}
                onChange={() => updateConfig({
                  USE_LOCAL_PROXY: true,
                  USE_VERCEL_PROXY: false,
                  USE_DIRECT_API: false
                })}
                className="text-upstox-primary"
              />
              <div>
                <p className="text-sm font-medium text-upstox-primary">Local Proxy</p>
                <p className="text-xs text-upstox-secondary">Best for development</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="proxyConfig"
                checked={config.USE_VERCEL_PROXY}
                onChange={() => updateConfig({
                  USE_LOCAL_PROXY: false,
                  USE_VERCEL_PROXY: true,
                  USE_DIRECT_API: false
                })}
                className="text-upstox-primary"
              />
              <div>
                <p className="text-sm font-medium text-upstox-primary">Vercel Proxy</p>
                <p className="text-xs text-upstox-secondary">Best for production</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="proxyConfig"
                checked={config.USE_DIRECT_API}
                onChange={() => updateConfig({
                  USE_LOCAL_PROXY: false,
                  USE_VERCEL_PROXY: false,
                  USE_DIRECT_API: true
                })}
                className="text-upstox-primary"
              />
              <div>
                <p className="text-sm font-medium text-upstox-primary">Direct API</p>
                <p className="text-xs text-upstox-secondary">May have CORS issues</p>
              </div>
            </label>
          </div>

          {/* Test Connection */}
          <div className="space-y-2">
            <button
              onClick={testConnection}
              disabled={testResult?.status === 'testing'}
              className="w-full btn-upstox-secondary text-sm flex items-center justify-center space-x-2"
            >
              {testResult?.status === 'testing' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Test Connection</span>
            </button>

            {testResult && (
              <div className={`p-2 rounded text-sm flex items-center space-x-2 ${
                testResult.status === 'success' 
                  ? 'bg-green-900/20 text-green-400' 
                  : testResult.status === 'error'
                  ? 'bg-red-900/20 text-red-400'
                  : 'bg-blue-900/20 text-blue-400'
              }`}>
                {testResult.status === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : testResult.status === 'error' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Configuration Info */}
          {configInfo && (
            <div className="mt-4 p-3 bg-upstox-dark-secondary rounded text-xs text-upstox-secondary">
              <p className="font-medium mb-1">Current Configuration:</p>
              <div className="space-y-1">
                <div>Environment: {configInfo.IS_LOCAL_DEV ? 'Development' : 'Production'}</div>
                <div>Server: {configInfo.IS_EXPRESS_SERVER ? 'Express' : configInfo.IS_REACT_DEV_SERVER ? 'React Dev' : 'Production'}</div>
                <div>URL: {configInfo.MSTOCKS_API_BASE_URL}</div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 p-3 bg-upstox-dark-secondary rounded text-xs text-upstox-secondary">
            <p className="font-medium mb-1">Instructions:</p>
            <ul className="space-y-1">
              <li>• Local Proxy: Requires local server running</li>
              <li>• Vercel Proxy: Works without local server</li>
              <li>• Direct API: May have CORS issues</li>
              <li>• Changes require page reload</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default ProxyConfig;

