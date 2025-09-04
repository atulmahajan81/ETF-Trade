import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { Plus, TrendingDown, Filter, AlertCircle, CheckCircle, XCircle, RefreshCw, BarChart3 } from 'lucide-react';
import mstocksApiService from '../services/mstocksApi';
import TradingModal from '../components/TradingModal';

const ETFRanking = () => {
  const { 
    etfs, 
    holdings, 
    targetProfit, 
    averagingThreshold,
    checkTradingEnabled,
    isTradingEnabled,
    tradingMessage,
    getLastFetchedPrice,
    dispatch
  } = useETFTrading();
  

  
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [selectedETF, setSelectedETF] = useState(null);
  const [filterSector, setFilterSector] = useState('all');
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [priceUpdateMessage, setPriceUpdateMessage] = useState('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);


  // Check trading enabled on mount
  useEffect(() => {
    checkTradingEnabled();
    loadSessionStatus();
  }, [checkTradingEnabled]);

  // Load session status
  const loadSessionStatus = async () => {
    try {
      const status = mstocksApiService.getSessionStatus();
      setSessionStatus(status);
    } catch (error) {
      setSessionStatus({ logged_in: false, message: 'Session status unavailable' });
    }
  };

  // Auto-refresh every 5 minutes - only during market hours
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const refreshInterval = setInterval(async () => {
      // Guard: only fetch during market hours and when session is valid
      try {
        const s = mstocksApiService.getSessionStatus();
        if (s?.session_valid && isMarketOpen()) {
          await handleUpdateETFsComplete();
          setLastRefreshTime(new Date());
        }
      } catch (e) {
        // Session status not available, skip refresh
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Initial refresh on mount (run regardless of market hours)
    (async () => {
      try {
        const s = mstocksApiService.getSessionStatus();
        if (s?.session_valid) {
          await handleUpdateETFsComplete();
          setLastRefreshTime(new Date());
        }
      } catch {}
    })();

    return () => clearInterval(refreshInterval);
  }, [autoRefreshEnabled]);

  // Calculate percentage difference and rank ETFs - use useMemo to recalculate when etfs change
  const rankedETFs = useMemo(() => {
    return etfs
      .map(etf => {
        const cmp = Number(etf.cmp ?? etf.currentPrice ?? 0);
        const dma = Number(etf.dma20 ?? 0);
        // Only calculate percentage difference if we have valid DMA20 data
        const percentDiff = dma > 0 && cmp > 0 ? ((cmp - dma) / dma) * 100 : null;
        const isHolding = holdings.some(h => h.symbol === etf.symbol);
        return {
          ...etf,
          cmp,
          dma20: dma,
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
        // Handle null values - put them at the end
        if (a.percentDiff === null && b.percentDiff === null) return 0;
        if (a.percentDiff === null) return 1;
        if (b.percentDiff === null) return -1;
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
    setShowTradingModal(true);
  };

  const handleCloseTradingModal = () => {
    setShowTradingModal(false);
    setSelectedETF(null);
  };

  // Update ETF prices with live data
  const handleUpdateETFPrices = useCallback(async () => {
    setIsUpdatingPrices(true);
    setPriceUpdateMessage('');
    
    try {
      let updatedETFs = [...etfs];
      let successCount = 0;
      let errorCount = 0;
      let dataSource = '';

      // Ensure session is fresh but do not gate the fetch on this
      try { await mstocksApiService.autoRefreshSession?.(); } catch {}
      
      // Process each ETF to fetch live price
      for (let i = 0; i < updatedETFs.length; i++) {
        const etf = updatedETFs[i];
        
        try {
          // Extract symbol without NSE: prefix if present
          const cleanSymbol = etf.symbol.replace('NSE:', '').replace('BSE:', '');
          
          let newPrice = null;
          let newVolume = null;
          
          // Always try MStocks live price for each symbol
          try {
            const priceData = await mstocksApiService.getLivePrice(etf.symbol);
            const ltp = Number(
              priceData?.data?.price ??
              priceData?.lastPrice ??
              priceData?.price ??
              priceData?.data?.ltp ??
              0
            );
            if (ltp > 0) {
              newPrice = ltp;
              dataSource = priceData?.data?.source || priceData?.source || 'MStocks API';
              const vol = priceData?.data?.volume ?? priceData?.volume;
              if (typeof vol !== 'undefined') newVolume = Number(vol);
            }
          } catch {}
          
          // Update ETF if we got a valid price
          if (newPrice && !isNaN(newPrice) && newPrice > 0) {
            etf.cmp = newPrice;
            etf.currentPrice = newPrice;
            etf.lastUpdated = new Date().toISOString();
            etf.dataSource = dataSource;
            if (newVolume !== null && Number.isFinite(newVolume) && newVolume >= 0) {
              etf.volume = newVolume;
            }
            successCount++;
          } else {
            errorCount++;
          }
          
          // Add small delay to avoid overwhelming the APIs
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          errorCount++;
        }
      }
      
      // Update context state with new ETF prices
      updatedETFs.forEach(etf => {
        dispatch({ type: 'UPDATE_ETF', payload: etf });
      });
      
      const marketStatus = isMarketOpen() ? 'Live prices' : 'Latest available data';
      const apiStatus = 'MStocks API';
      const message = `${marketStatus} updated via ${apiStatus}! (${successCount} success, ${errorCount} failed)`;
      setPriceUpdateMessage(message);
      setTimeout(() => setPriceUpdateMessage(''), 5000);
      
    } catch (error) {
      setPriceUpdateMessage('Error updating ETF prices. Please try again.');
      setTimeout(() => setPriceUpdateMessage(''), 3000);
    } finally {
      setIsUpdatingPrices(false);
    }
  }, [etfs, dispatch]);

  // Calculate 20 DMA using broker historical data via service
  const calculateDMA20 = useCallback(async (symbol, expectedLtp = null) => {
    try {
      const res = await mstocksApiService.calculateDMA20(symbol, expectedLtp);
      if (res && res.status === 'success' && res.data && typeof res.data.dma20 !== 'undefined') {
        return Number(res.data.dma20);
      }
      return null;
    } catch (e) {
      return null;
    }
  }, []);

  // Update ETF prices and DMA20 with live data
  const handleUpdateETFsComplete = useCallback(async () => {
    setIsUpdatingPrices(true);
    setPriceUpdateMessage('');
    
    try {
      // Update prices first
      await handleUpdateETFPrices();
      
      // Then update DMA20 for each ETF
      let dmaSuccessCount = 0;
      let dmaErrorCount = 0;
      
       for (const etf of etfs) {
        try {
          const cmp = Number(etf.cmp ?? etf.currentPrice ?? 0);
          const dma20 = await calculateDMA20(etf.symbol, Number.isFinite(cmp) && cmp > 0 ? cmp : null);
          if (typeof dma20 === 'number' && Number.isFinite(dma20) && dma20 > 0) {
            const updatedETF = { ...etf, dma20: Number(dma20.toFixed(2)) };
            dispatch({ type: 'UPDATE_ETF', payload: updatedETF });
            dmaSuccessCount++;
          } else {
            dmaErrorCount++;
          }
          
          // Small stagger to avoid bursts
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          dmaErrorCount++;
        }
      }
      
      // Refresh session status
      await loadSessionStatus();
      
      setPriceUpdateMessage(`✅ ETF prices and DMA20 updated! (${dmaSuccessCount} DMA success, ${dmaErrorCount} DMA failed)`);
      setTimeout(() => setPriceUpdateMessage(''), 5000);
    } catch (error) {
      setPriceUpdateMessage('❌ Failed to update ETF data. Please try again.');
      setTimeout(() => setPriceUpdateMessage(''), 5000);
    } finally {
      setIsUpdatingPrices(false);
    }
  }, [etfs, handleUpdateETFPrices, calculateDMA20, dispatch]);

  // Helper function to check if market is open (IST hours only)
  const isMarketOpen = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now);
    const get = (t) => parts.find(p => p.type === t)?.value;
    const weekday = get('weekday'); // e.g., Mon, Tue
    const hour = Number(get('hour'));
    const minute = Number(get('minute'));
    const isWeekday = weekday && !['Sat','Sun'].includes(weekday);
    const currentTime = hour * 100 + minute; // HHMM
    const isMarketHours = currentTime >= 915 && currentTime <= 1530;
    return Boolean(isWeekday && isMarketHours);
  };

  return (
    <div className="min-h-screen bg-upstox-primary text-upstox-primary">
      {/* Header */}
      <div className="bg-upstox-secondary border-b border-upstox-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-blue-light rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-upstox-primary">ETF Ranking</h1>
                  <p className="text-sm text-upstox-secondary">Analyze and rank ETFs based on their performance relative to 20-day moving average</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* API Connection Status */}
        <div className="card-upstox overflow-hidden">
          <div className="px-6 py-4 border-b border-upstox-primary bg-upstox-tertiary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${
                  sessionStatus?.logged_in ? 'text-positive' : 'text-upstox-secondary'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${sessionStatus?.logged_in ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-sm font-medium">
                    {sessionStatus?.logged_in ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <span className="text-sm text-upstox-secondary">
                  {lastRefreshTime ? `Last updated: ${new Date(lastRefreshTime).toLocaleTimeString()}` : 'No updates yet'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card-upstox overflow-hidden">
          <div className="px-6 py-4 border-b border-upstox-primary bg-upstox-tertiary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-upstox-elevated rounded-lg">
                  <Filter className="h-5 w-5 text-upstox-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-upstox-primary">Controls</h2>
                  <p className="text-sm text-upstox-secondary">Manage price updates and filtering</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleUpdateETFPrices}
                  disabled={isUpdatingPrices || !isMarketOpen()}
                  className="btn-upstox-success disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!isMarketOpen() ? 'Market is closed - prices will not update' : ''}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
                  {isUpdatingPrices ? 'Updating Prices...' : 'Update Prices Only'}
                </button>

                <button
                  onClick={handleUpdateETFsComplete}
                  disabled={isUpdatingPrices || !isMarketOpen()}
                  className="btn-upstox-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!isMarketOpen() ? 'Market is closed - data will not update' : ''}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
                  {isUpdatingPrices ? 'Updating All Data...' : 'Update Prices + DMA20'}
                </button>

                <button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className={`btn-upstox-secondary ${autoRefreshEnabled ? 'bg-accent-blue text-white hover:bg-accent-blue-hover' : ''}`}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {autoRefreshEnabled ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
                </button>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-upstox-secondary" />
                  <select
                    value={filterSector}
                    onChange={(e) => setFilterSector(e.target.value)}
                    className="input-upstox text-sm"
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
          </div>
        </div>

        {/* Market Status Indicator */}
        <div className="card-upstox overflow-hidden">
          <div className="px-6 py-4 bg-upstox-tertiary border-b border-upstox-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isMarketOpen() ? (
                  <CheckCircle className="w-5 h-5 text-positive mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-upstox-secondary mr-2" />
                )}
                <span className="text-sm font-medium text-upstox-primary">
                  Market Status: {isMarketOpen() ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
                <div className="text-right">
                  <span className="text-xs text-upstox-secondary">
                    {isMarketOpen() ? 'Live prices available' : 'Showing last available data'}
                  </span>
                  <div className="text-xs text-upstox-secondary mt-1">
                    {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', timeStyle: 'medium' }).format(new Date())}
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {priceUpdateMessage && (
          <div className="card-upstox overflow-hidden">
            <div className="px-6 py-4 bg-upstox-tertiary border-b border-upstox-primary">
              <div className="flex items-center">
                {priceUpdateMessage.includes('✅') ? (
                  <CheckCircle className="w-5 h-5 text-positive mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-negative mr-2" />
                )}
                <span className="text-sm font-medium text-upstox-primary">
                  {priceUpdateMessage}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Trading Status */}
        {!isTradingEnabled && (
          <div className="card-upstox overflow-hidden">
            <div className="px-6 py-4 bg-upstox-tertiary border-b border-upstox-primary">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-upstox-secondary mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-upstox-primary">Trading Disabled</h3>
                  <p className="text-sm text-upstox-secondary">
                    {tradingMessage || 'Please configure your MStocks API credentials to enable trading.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Summary */}
        <div className="card-upstox overflow-hidden">
          <div className="px-6 py-4 bg-upstox-tertiary border-b border-upstox-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <span className="font-medium text-upstox-primary">Target Profit: <span className="text-accent-blue">{targetProfit}%</span></span>
                <span className="font-medium text-upstox-primary">Averaging: <span className="text-accent-blue">{averagingThreshold}%</span></span>
                <span className="font-medium text-upstox-primary">Available: <span className="text-accent-blue">{newETFs.length} ETFs</span></span>
              </div>
              <span className="text-sm text-upstox-secondary">Ranked by % below 20 DMA</span>
            </div>
          </div>
        </div>

        {/* All ETFs Section */}
        <div className="card-upstox overflow-hidden">
          <div className="px-6 py-4 bg-upstox-tertiary border-b border-upstox-primary">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-upstox-elevated rounded-lg">
                <BarChart3 className="h-5 w-5 text-upstox-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-upstox-primary">ETF Ranking</h2>
                <p className="text-sm text-upstox-secondary">ETFs ranked by % below 20 DMA. Holdings shown at bottom.</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-upstox">
              <thead className="bg-upstox-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">CMP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">20 DMA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">% Below DMA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Volume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-upstox-secondary divide-y divide-upstox-primary">
                {filteredETFs.map((etf) => (
                  <tr key={etf.symbol} className={`hover:bg-upstox-tertiary ${etf.isHolding ? 'bg-upstox-tertiary' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        etf.isHolding 
                          ? 'bg-neutral-100 text-neutral-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        #{etf.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-upstox-primary">{etf.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-upstox-secondary">{etf.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-upstox-primary">
                      <div className="flex items-center">
                        <span>₹{etf.cmp}</span>
                        {getLastFetchedPrice(etf.symbol)?.isOffline && (
                          <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Offline
                          </span>
                        )}
                      </div>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-upstox-primary">
                       {etf.dma20 && etf.dma20 > 0 ? `₹${Number(etf.dma20).toFixed(2)}` : 'N/A'}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {etf.percentDiff !== null ? (
                        <>
                          <TrendingDown className="inline w-4 h-4 mr-1" />
                          {Math.abs(etf.percentDiff).toFixed(2)}%
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-upstox-primary">{etf.volume.toLocaleString()}</td>
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
                        <span className="text-upstox-secondary text-xs">Already Owned</span>
                      ) : (
                        <button
                          onClick={() => handleBuyClick(etf)}
                          className="btn-upstox-success text-xs px-3 py-1"
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
          <div className="card-upstox overflow-hidden">
            <div className="px-6 py-4 bg-upstox-tertiary border-b border-upstox-primary">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-upstox-elevated rounded-lg">
                  <Plus className="h-5 w-5 text-upstox-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-upstox-primary">Existing ETFs Ready for Averaging</h2>
                  <p className="text-sm text-upstox-secondary">ETFs in your portfolio that have fallen {averagingThreshold}% or more below your last purchase price</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table-upstox">
                <thead className="bg-upstox-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">CMP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Last Purchase</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">% Fall</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-upstox-secondary divide-y divide-upstox-primary">
                  {existingETFsForAveraging.map((etf) => {
                    const holding = holdings.find(h => h.symbol === etf.symbol);
                    const fallPercent = ((holding.lastPurchasePrice - etf.cmp) / holding.lastPurchasePrice) * 100;
                    
                    return (
                      <tr key={etf.symbol} className="hover:bg-upstox-tertiary">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-upstox-primary">{etf.symbol}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-upstox-secondary">{etf.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-upstox-primary">₹{etf.cmp}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-upstox-primary">₹{holding.lastPurchasePrice}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                          <TrendingDown className="inline w-4 h-4 mr-1" />
                          {fallPercent.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleBuyClick(etf)}
                            className="btn-upstox-primary text-xs px-3 py-1"
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

        {/* Trading Modal */}
        <TradingModal
          isOpen={showTradingModal}
          onClose={handleCloseTradingModal}
          mode="buy"
          selectedItem={selectedETF}
        />
      </div>
    </div>
  );
};

export default ETFRanking;