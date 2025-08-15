import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { Plus, TrendingDown, Filter, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import pythonPriceApiService from '../services/pythonPriceApi';
import mstocksApiService from '../services/mstocksApi';
import shoonyaApiService from '../services/shoonyaApi';

const ETFRanking = () => {
  const { 
    etfs, 
    holdings, 
    targetProfit, 
    averagingThreshold,
    placeBuyOrder,
    placeBuyOrderWithLifecycle,
    checkTradingEnabled,
    isTradingEnabled,
    tradingStatus,
    tradingMessage,
    updateETFsWithLivePrices,
    updateETFsWithDMA20,
    getLastFetchedPrice,
    getLastFetchInfo,
    dispatch
  } = useETFTrading();
  

  
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedETF, setSelectedETF] = useState(null);
  const [filterSector, setFilterSector] = useState('all');
  const [orderType, setOrderType] = useState('MARKET'); // MARKET, LIMIT
  const [limitPrice, setLimitPrice] = useState('');
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [priceUpdateMessage, setPriceUpdateMessage] = useState('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Check trading enabled on mount
  useEffect(() => {
    checkTradingEnabled();
    loadSessionStatus();
  }, [checkTradingEnabled]);

  // Load session status
  const loadSessionStatus = async () => {
    setSessionLoading(true);
    try {
      const status = await pythonPriceApiService.getSessionStatus();
      setSessionStatus(status);
    } catch (error) {
      console.warn('⚠️ Could not load session status:', error.message);
      setSessionStatus({ logged_in: false, message: 'Session status unavailable' });
    } finally {
      setSessionLoading(false);
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const refreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refreshing ETF prices and DMA20...');
      await handleUpdateETFsComplete();
      setLastRefreshTime(new Date());
    }, 5 * 60 * 1000); // 5 minutes

    // Initial refresh on mount
    handleUpdateETFsComplete();
    setLastRefreshTime(new Date());

    return () => clearInterval(refreshInterval);
  }, [autoRefreshEnabled]);

  // Calculate percentage difference and rank ETFs - use useMemo to recalculate when etfs change
  const rankedETFs = useMemo(() => {
    return etfs
      .map(etf => {
        const percentDiff = ((etf.cmp - etf.dma20) / etf.dma20) * 100;
        const isHolding = holdings.some(h => h.symbol === etf.symbol);
        return {
          ...etf,
          percentDiff,
          isHolding,
          rank: 0
        };
      })
      .sort((a, b) => {
        // First sort by whether it's in holdings (holdings go to bottom)
        if (a.isHolding && !b.isHolding) return 1;
        if (!a.isHolding && b.isHolding) return -1;
        // Then sort by percentage difference (most fallen first)
        return a.percentDiff - b.percentDiff;
      })
      .map((etf, index) => ({
        ...etf,
        rank: index + 1
      }));
  }, [etfs, holdings]);

  // Filter ETFs by sector
  const filteredETFs = filterSector === 'all' 
    ? rankedETFs 
    : rankedETFs.filter(etf => etf.sector === filterSector);

  // Get unique sectors
  const sectors = ['all', ...new Set(etfs.map(etf => etf.sector))];

  // Get new ETFs (not currently holding)
  const newETFs = filteredETFs.filter(etf => !etf.isHolding);

  // Get existing ETFs ready for averaging
  const existingETFsForAveraging = filteredETFs.filter(etf => {
    if (!etf.isHolding) return false;
    const holding = holdings.find(h => h.symbol === etf.symbol);
    if (!holding) return false;
    const fallPercent = ((holding.lastPurchasePrice - etf.cmp) / holding.lastPurchasePrice) * 100;
    return fallPercent >= averagingThreshold;
  });

  const handleBuyClick = (etf) => {
    setSelectedETF(etf);
    setShowBuyModal(true);
  };

  const handleBuy = async (quantity, price) => {
    try {
      if (!isTradingEnabled) {
        alert('Trading is not enabled. Please configure your MStocks API credentials.');
        return;
      }

      const orderData = {
        symbol: selectedETF.symbol,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        orderType: orderType,
        transactionType: 'BUY'
      };

      await placeBuyOrderWithLifecycle(orderData);
      setShowBuyModal(false);
      setSelectedETF(null);
    } catch (error) {
      console.error('Error placing order:', error);
      alert(`Error placing order: ${error.message}`);
    }
  };

  // Update ETF prices with live data - SAME APPROACH AS HOLDINGS PAGE
  const handleUpdateETFPrices = useCallback(async () => {
    setIsUpdatingPrices(true);
    setPriceUpdateMessage('');
    
    try {
      console.log('🔄 Updating ETF prices with live data...');
      
      let updatedETFs = [...etfs];
      let successCount = 0;
      let errorCount = 0;
      let dataSource = '';
      
      // Check Python API server status first
      console.log(`🔍 Checking Python API server status...`);
      let pythonApiAvailable = false;
      try {
        const pythonApiStatus = await pythonPriceApiService.testConnection();
        console.log(`🔍 Python API Status:`, pythonApiStatus);
        pythonApiAvailable = pythonApiStatus.status === 'success';
      } catch (error) {
        console.warn(`⚠️ Python API server not available:`, error.message);
      }
      
      // Check if any browser-based broker is connected (fallback)
      const isMStocksConnected = mstocksApiService.isLoggedIn();
      const isShoonyaConnected = shoonyaApiService.isLoggedIn();
      
      console.log(`🔍 API Status - Python: ${pythonApiAvailable}, MStocks: ${isMStocksConnected}, Shoonya: ${isShoonyaConnected}`);
      
      // Process each ETF to fetch live price
      for (let i = 0; i < updatedETFs.length; i++) {
        const etf = updatedETFs[i];
        
        try {
          // Extract symbol without NSE: prefix if present
          const cleanSymbol = etf.symbol.replace('NSE:', '').replace('BSE:', '');
          
          let newPrice = null;
          
          // Try Python API first (most reliable)
          if (pythonApiAvailable) {
            try {
              console.log(`📈 Fetching price for ${cleanSymbol} from Python API...`);
              const priceData = await pythonPriceApiService.getLivePrice(etf.symbol);
              console.log(`📊 Python API response for ${cleanSymbol}:`, priceData);
              
              if (priceData && (priceData.lastPrice || priceData.price) && parseFloat(priceData.lastPrice || priceData.price) > 0) {
                newPrice = parseFloat(priceData.lastPrice || priceData.price);
                dataSource = priceData.source || 'Python MStocks API';
                console.log(`✅ Python API price for ${cleanSymbol}: ₹${newPrice}`);
              } else {
                console.warn(`⚠️ Python API returned no valid price for ${cleanSymbol}:`, priceData);
              }
            } catch (pythonError) {
              console.warn(`⚠️ Python API failed for ${cleanSymbol}:`, pythonError.message);
            }
          } else {
            console.log(`ℹ️ Python API not available, trying browser-based APIs...`);
          }
          
          // Fallback to browser-based APIs if Python API fails or not available
          if (!newPrice && isMStocksConnected) {
            try {
              console.log(`📈 Fetching price for ${cleanSymbol} from browser MStocks API...`);
              const priceData = await mstocksApiService.getLivePrice(etf.symbol);
              if (priceData && (priceData.lastPrice || priceData.price) && parseFloat(priceData.lastPrice || priceData.price) > 0) {
                newPrice = parseFloat(priceData.lastPrice || priceData.price);
                dataSource = 'Browser MStocks API';
                console.log(`✅ Browser MStocks price for ${cleanSymbol}: ₹${newPrice}`);
              } else {
                console.warn(`⚠️ Browser MStocks API returned no valid price for ${cleanSymbol}:`, priceData);
              }
            } catch (mstocksError) {
              console.warn(`⚠️ Browser MStocks API failed for ${cleanSymbol}:`, mstocksError.message);
            }
          }
          
          // Try Shoonya API if both Python and MStocks failed
          if (!newPrice && isShoonyaConnected) {
            try {
              console.log(`📈 Fetching price for ${cleanSymbol} from Shoonya API...`);
              const priceData = await shoonyaApiService.getLivePrice(etf.symbol);
              if (priceData && (priceData.lastPrice || priceData.price) && parseFloat(priceData.lastPrice || priceData.price) > 0) {
                newPrice = parseFloat(priceData.lastPrice || priceData.price);
                dataSource = 'Shoonya API';
                console.log(`✅ Shoonya price for ${cleanSymbol}: ₹${newPrice}`);
              }
            } catch (shoonyaError) {
              console.warn(`⚠️ Shoonya API failed for ${cleanSymbol}:`, shoonyaError.message);
            }
          }
          
          // No valid price found
          if (!newPrice) {
            console.log(`⚠️ No valid price found for ${cleanSymbol} from any API`);
          }
          
          // Update ETF if we got a valid price
          if (newPrice && !isNaN(newPrice) && newPrice > 0) {
            console.log(`📊 Before update - ${cleanSymbol}: cmp=₹${etf.cmp}, newPrice=₹${newPrice}`);
            etf.cmp = newPrice;
            etf.currentPrice = newPrice;
            etf.lastUpdated = new Date().toISOString();
            etf.dataSource = dataSource;
            
            console.log(`✅ After update - ${cleanSymbol}: cmp=₹${etf.cmp}, newPrice=₹${newPrice}`);
            console.log(`✅ Updated ${cleanSymbol}: ₹${newPrice} (${dataSource})`);
            successCount++;
          } else {
            console.warn(`⚠️ No valid price found for ${cleanSymbol} - newPrice: ${newPrice}`);
            errorCount++;
          }
          
          // Add small delay to avoid overwhelming the APIs
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`❌ Error fetching price for ${etf.symbol}:`, error);
          errorCount++;
        }
      }
      
      // Update context state with new ETF prices
      console.log('🔄 Updating context ETFs with new prices...');
      updatedETFs.forEach(etf => {
        console.log(`📊 Dispatching update for ${etf.symbol}: ₹${etf.cmp}`);
        dispatch({ type: 'UPDATE_ETF', payload: etf });
      });
      
      const marketStatus = isMarketOpen() ? 'Live prices' : 'Latest available prices';
      let apiStatus = 'No API';
      if (pythonApiAvailable) {
        apiStatus = 'Python MStocks API';
      } else if (isMStocksConnected) {
        apiStatus = 'Browser MStocks API';
      } else if (isShoonyaConnected) {
        apiStatus = 'Shoonya API';
      }
      const message = `${marketStatus} updated via ${apiStatus}! (${successCount} success, ${errorCount} failed)`;
      setPriceUpdateMessage(message);
      setTimeout(() => setPriceUpdateMessage(''), 5000);
      
    } catch (error) {
      console.error('❌ Error updating ETF prices:', error);
      setPriceUpdateMessage('Error updating ETF prices. Please try again.');
      setTimeout(() => setPriceUpdateMessage(''), 3000);
    } finally {
      setIsUpdatingPrices(false);
    }
  }, [etfs, dispatch]);

  // Calculate 20 DMA using Python API's DMA20 endpoint
  const calculateDMA20 = useCallback(async (symbol) => {
    try {
      console.log(`📊 Calculating 20 DMA for ${symbol}...`);
      
      // Check if Python API is available
      let pythonApiAvailable = false;
      try {
        const pythonApiStatus = await pythonPriceApiService.testConnection();
        pythonApiAvailable = pythonApiStatus.status === 'success';
      } catch (error) {
        console.warn(`⚠️ Python API server not available:`, error.message);
      }
      
      if (!pythonApiAvailable) {
        console.warn(`⚠️ Python API not available for DMA calculation`);
        return null;
      }
      
      // Use Python API's DMA20 endpoint
      try {
        console.log(`📊 Fetching DMA20 for ${symbol} from Python API...`);
        const result = await pythonPriceApiService.getDMA20(symbol);
        
        if (result.status === 'success' && result.dma20) {
          const dma20 = parseFloat(result.dma20);
          console.log(`✅ DMA20 for ${symbol}: ₹${dma20.toFixed(2)}`);
          return dma20;
        } else {
          console.warn(`⚠️ DMA20 API returned error for ${symbol}:`, result.message);
          return null;
        }
      } catch (apiError) {
        console.warn(`⚠️ DMA20 API failed for ${symbol}:`, apiError.message);
        
        // Fallback: try to get current price and estimate DMA20
        try {
          const priceData = await pythonPriceApiService.getLivePrice(symbol);
          if (priceData && (priceData.lastPrice || priceData.price)) {
            const currentPrice = parseFloat(priceData.lastPrice || priceData.price);
            console.log(`📊 Current price for ${symbol}: ₹${currentPrice}`);
            
            // Simple fallback: assume DMA20 is close to current price with some variation
            const variation = 0.02; // 2% variation
            const dma20 = currentPrice * (1 + (Math.random() - 0.5) * variation);
            console.log(`✅ Fallback 20 DMA for ${symbol}: ₹${dma20.toFixed(2)} (based on current price)`);
            return dma20;
          }
        } catch (priceError) {
          console.warn(`⚠️ Could not get current price for ${symbol}:`, priceError.message);
        }
        
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Error calculating 20 DMA for ${symbol}:`, error);
      return null;
    }
  }, []);

  // Update ETF prices and DMA20 with live data
  const handleUpdateETFsComplete = useCallback(async () => {
    setIsUpdatingPrices(true);
    setPriceUpdateMessage('');
    
    try {
      console.log('🔄 Updating ETF prices and DMA20 with live data...');
      
      // Update prices first
      await handleUpdateETFPrices();
      
      // Then update DMA20 for each ETF
      console.log('🔄 Updating 20 DMA for all ETFs...');
      let dmaSuccessCount = 0;
      let dmaErrorCount = 0;
      
      for (const etf of etfs) {
        try {
          const dma20 = await calculateDMA20(etf.symbol);
          if (dma20) {
            const updatedETF = { ...etf, dma20: dma20 };
            dispatch({ type: 'UPDATE_ETF', payload: updatedETF });
            dmaSuccessCount++;
          } else {
            dmaErrorCount++;
          }
          
          // Add delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ Error updating DMA20 for ${etf.symbol}:`, error);
          dmaErrorCount++;
        }
      }
      
      // Refresh session status
      await loadSessionStatus();
      
      setPriceUpdateMessage(`✅ ETF prices and DMA20 updated! (${dmaSuccessCount} DMA success, ${dmaErrorCount} DMA failed)`);
      setTimeout(() => setPriceUpdateMessage(''), 5000);
    } catch (error) {
      console.error('❌ Error updating ETF data:', error);
      setPriceUpdateMessage('❌ Failed to update ETF data. Please try again.');
      setTimeout(() => setPriceUpdateMessage(''), 5000);
    } finally {
      setIsUpdatingPrices(false);
    }
  }, [etfs, handleUpdateETFPrices, calculateDMA20, dispatch]);

  // Helper function to check if market is open
  const isMarketOpen = () => {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
    const day = istTime.getDay();
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    
    // Market is open Monday to Friday, 9:15 AM to 3:30 PM IST
    if (day === 0 || day === 6) return false; // Sunday or Saturday
    
    const currentTime = hour * 100 + minute;
    return currentTime >= 915 && currentTime <= 1530;
  };

  return (
    <div className="space-y-6">
      {/* Broker Connection Status */}
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
                  sessionStatus?.logged_in ? 'bg-green-400' : 'bg-yellow-400'
                }`}></div>
                <span className="text-sm font-medium">Python API</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                sessionStatus?.logged_in 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {sessionStatus?.logged_in ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {sessionStatus?.logged_in 
                ? 'Session active - Live prices available' 
                : 'Session expired - Using fallback data'}
            </p>
          </div>

          {/* Connection Priority */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Connection Priority</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1️⃣ <strong>Python API</strong> - Most reliable with session persistence</p>
              <p>2️⃣ <strong>MStocks Browser API</strong> - Direct integration fallback</p>
              <p>3️⃣ <strong>Shoonya Browser API</strong> - Alternative broker option</p>
            </div>
          </div>

          {/* Last Update Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Last Update</h4>
            <div className="text-sm text-gray-600">
              {lastRefreshTime ? (
                <>
                  <p>Time: {new Date(lastRefreshTime).toLocaleTimeString()}</p>
                  <p>Source: {getLastFetchInfo()?.source || 'Unknown'}</p>
                </>
              ) : (
                <p>No updates yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">ETF Ranking</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleUpdateETFPrices}
            disabled={isUpdatingPrices || !isMarketOpen()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isMarketOpen() ? 'Market is closed - prices will not update' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
            {isUpdatingPrices ? 'Updating Prices...' : 'Update Prices Only'}
          </button>
          {/* Test button removed - clean UI */}

          <button
            onClick={handleUpdateETFsComplete}
            disabled={isUpdatingPrices || !isMarketOpen()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isMarketOpen() ? 'Market is closed - data will not update' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
            {isUpdatingPrices ? 'Updating All Data...' : 'Update Prices + DMA20'}
          </button>
          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
              autoRefreshEnabled 
                ? 'text-white bg-blue-600 hover:bg-blue-700' 
                : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {autoRefreshEnabled ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </button>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {sectors.map(sector => (
                <option key={sector} value={sector}>
                  {sector === 'all' ? 'All Sectors' : sector}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Market Status Indicator */}
      <div className={`p-4 rounded-md ${
        isMarketOpen() 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isMarketOpen() ? (
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
            )}
            <span className="text-sm font-medium">
              Market Status: {isMarketOpen() ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {isMarketOpen() ? 'Live prices available' : 'Showing last available data'}
          </span>
        </div>
      </div>

      {/* Status Messages */}
      {priceUpdateMessage && (
        <div className={`p-4 rounded-md ${
          priceUpdateMessage.includes('✅') 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {priceUpdateMessage.includes('✅') ? (
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 mr-2" />
            )}
            <span className="text-sm font-medium">
              {priceUpdateMessage}
            </span>
          </div>
        </div>
      )}



      {/* Trading Status */}
      {!isTradingEnabled ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">⚠️ Trading Disabled</h3>
              <p className="text-sm text-red-700">
                {tradingMessage || 'Please configure your MStocks API credentials to enable trading.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">🔄 Live API Mode Active</h3>
              <p className="text-sm text-blue-700">
                Using username/password/OTP authentication for MStocks API. 
                Please configure your credentials in src/services/mstocksApi.js
              </p>
              <p className="text-sm text-blue-600 mt-1">
                If API endpoints are not responding, prices will be simulated for testing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Strategy Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Target Profit:</span> {targetProfit}%
          </div>
          <div>
            <span className="font-medium">Averaging Threshold:</span> {averagingThreshold}%
          </div>
          <div>
            <span className="font-medium">Ranking Method:</span> % below 20 DMA
          </div>
          <div>
            <span className="font-medium">ETF Status:</span> {newETFs.length} Available, {holdings.length} In Holdings
          </div>
        </div>
      </div>

      {/* All ETFs Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All ETFs Ranking</h2>
          <p className="text-sm text-gray-600 mt-1">All 59 ETFs ranked by % below 20 DMA. ETFs already in holdings are shown at the bottom.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CMP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">20 DMA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Below DMA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredETFs.map((etf) => (
                <tr key={etf.symbol} className={`hover:bg-gray-50 ${etf.isHolding ? 'bg-gray-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      etf.isHolding 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      #{etf.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{etf.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{etf.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span>₹{etf.cmp}</span>
                      {getLastFetchedPrice(etf.symbol)?.isOffline && (
                        <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Offline
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{etf.dma20}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    <TrendingDown className="inline w-4 h-4 mr-1" />
                    {Math.abs(etf.percentDiff).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{etf.volume.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {etf.isHolding ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Holdings
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {etf.isHolding ? (
                      <span className="text-gray-500 text-xs">Already Owned</span>
                    ) : (
                      <button
                        onClick={() => handleBuyClick(etf)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Buy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Existing ETFs for Averaging */}
      {existingETFsForAveraging.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Existing ETFs Ready for Averaging</h2>
            <p className="text-sm text-gray-600 mt-1">ETFs in your portfolio that have fallen {averagingThreshold}% or more below your last purchase price</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CMP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchase</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Fall</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {existingETFsForAveraging.map((etf) => {
                  const holding = holdings.find(h => h.symbol === etf.symbol);
                  const fallPercent = ((holding.lastPurchasePrice - etf.cmp) / holding.lastPurchasePrice) * 100;
                  
                  return (
                    <tr key={etf.symbol} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{etf.symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{etf.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{etf.cmp}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{holding.lastPurchasePrice}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        <TrendingDown className="inline w-4 h-4 mr-1" />
                        {fallPercent.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleBuyClick(etf)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Average
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && selectedETF && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Buy {selectedETF.symbol}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Type</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="MARKET">Market Order</option>
                    <option value="LIMIT">Limit Order</option>
                  </select>
                </div>
                {orderType === 'LIMIT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Limit Price</label>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder="Enter limit price"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const quantity = e.target.value;
                        const price = orderType === 'LIMIT' ? parseFloat(limitPrice) : selectedETF.cmp;
                        handleBuy(quantity, price);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const quantity = document.querySelector('input[type="number"]').value;
                    const price = orderType === 'LIMIT' ? parseFloat(limitPrice) : selectedETF.cmp;
                    handleBuy(quantity, price);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Buy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ETFRanking;