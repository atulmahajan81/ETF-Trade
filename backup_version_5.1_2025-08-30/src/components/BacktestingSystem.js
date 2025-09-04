import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Download, 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Settings,
  LineChart,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useETFTrading } from '../context/ETFTradingContext';
import mstocksApiService from '../services/mstocksApi';
import { saveLargeData, loadLargeData, hasLargeData, getDataInfo } from '../utils/storageUtils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const BacktestingSystem = () => {
  // Get ETF list from context
  const { etfs } = useETFTrading();
  
  // Configuration state
  const [config, setConfig] = useState({
    startCapital: 1000000, // ₹10 Lakh
    numberOfChunks: 50,
    profitPerTrade: 6, // 6% profit per trade
    totalTradingDays: 1000, // ~4 years (2020-2024)
    tradingDays: 250, // trading days per year
    useRealData: true, // Use real market data from MStocks
    startDate: '2020-01-01', // Start from 2020
    endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days ago
  });

  // Results state
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentDay, setCurrentDay] = useState(0);
  
  // Data management state
  const [historicalData, setHistoricalData] = useState({});
  const [dataStatus, setDataStatus] = useState('not_loaded');
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  // Progress tracking
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
    currentETF: '',
    completed: 0,
    failed: 0,
    percentage: 0,
    status: 'idle',
    message: '',
    apiConnected: false
  });

  // Initialize data status on component mount
  useEffect(() => {
    checkDataStatus();
  }, []);

  // Check existing data status
  const checkDataStatus = async () => {
    try {
      const status = localStorage.getItem('etf_backtest_data_status');
      const dataDate = localStorage.getItem('etf_backtest_data_date');
      
      // Check if data exists and is recent (within last 7 days) and matches current date range
      const isDataRecent = dataDate && (Date.now() - new Date(dataDate).getTime()) < (7 * 24 * 60 * 60 * 1000);
      const cachedStartDate = localStorage.getItem('etf_backtest_start_date');
      const cachedEndDate = localStorage.getItem('etf_backtest_end_date');
      const isDateRangeMatching = cachedStartDate === config.startDate && cachedEndDate === config.endDate;
      
      if (status === 'loaded' && isDataRecent && isDateRangeMatching) {
        setDataStatus('loaded');
        const data = await loadLargeData('etf_backtest_historical_data');
        if (data && Object.keys(data).length > 0) {
          setHistoricalData(data);
          console.log('✅ Backtest historical data loaded from cache');
        } else {
          setDataStatus('not_loaded');
        }
      } else {
        setDataStatus('not_loaded');
        if (status === 'loaded' && !isDataRecent) {
          console.log('⚠️ Cached backtest data is outdated, will reload');
        }
        if (status === 'loaded' && !isDateRangeMatching) {
          console.log('⚠️ Cached backtest data has different date range, will reload');
        }
      }
    } catch (error) {
      console.error('Error checking data status:', error);
      setDataStatus('error');
    }
  };

  // Pull historical data for all ETFs from ETF ranking
  const pullHistoricalData = async () => {
    if (!etfs || etfs.length === 0) {
      alert('No ETF list available. Please ensure ETF data is loaded.');
      return;
    }

    setIsDataLoading(true);
    setDataStatus('loading');
    
    // Initialize progress
    setDownloadProgress({
      current: 0,
      total: etfs.length,
      currentETF: '',
      completed: 0,
      failed: 0,
      percentage: 0,
      status: 'connecting',
      message: 'Connecting to MStocks API...',
      apiConnected: false
    });
    
    try {
      // Test API connection first
      try {
        console.log('🔗 Testing API connection...');
        const testConnection = await mstocksApiService.testConnection();
        console.log('🔗 API Connection Test Result:', testConnection);
        
        if (testConnection) {
          setDownloadProgress(prev => ({
            ...prev,
            status: 'downloading',
            message: 'API connected successfully. Starting download...',
            apiConnected: true
          }));
        } else {
          setDownloadProgress(prev => ({
            ...prev,
            status: 'downloading',
            message: 'API connection failed. Using demo data...',
            apiConnected: false
          }));
        }
      } catch (error) {
        console.log('⚠️ API connection test failed, proceeding with demo data:', error);
        setDownloadProgress(prev => ({
          ...prev,
          status: 'downloading',
          message: 'API connection failed. Using demo data...',
          apiConnected: false
        }));
      }

      const allData = {};
      const startDate = config.startDate;
      const endDate = config.endDate;

      console.log('📊 Pulling historical data for ETFs from ETF Ranking...');
      console.log('📊 ETF count:', etfs.length);
      console.log('📅 Date range:', startDate, 'to', endDate);
      
      for (let i = 0; i < etfs.length; i++) {
        const etf = etfs[i];
        const symbol = etf.symbol;
        
        // Update progress
        setDownloadProgress(prev => ({
          ...prev,
          current: i + 1,
          currentETF: symbol,
          percentage: Math.round(((i + 1) / etfs.length) * 100),
          message: `Downloading ${symbol}... (${i + 1}/${etfs.length})`
        }));
        
        try {
          console.log(`📈 Fetching data for ${symbol}... (${i + 1}/${etfs.length})`);
          
          // Fetch historical data from broker API
          const data = await mstocksApiService.getHistoricalData(symbol, startDate, endDate);
          console.log(`📊 Raw data received for ${symbol}:`, data);
          
          if (data && Array.isArray(data) && data.length > 0) {
            // Clean and format data
            allData[symbol] = data.map(item => ({
              date: item.date,
              close: parseFloat(item.close || 0),
              high: parseFloat(item.high || item.close || 0),
              low: parseFloat(item.low || item.close || 0),
              volume: parseInt(item.volume || 0)
            })).filter(item => item.close > 0); // Filter out invalid data
            
            console.log(`✅ ${symbol}: ${allData[symbol].length} records loaded`);
            
            // Update completed count
            setDownloadProgress(prev => ({
              ...prev,
              completed: prev.completed + 1,
              message: `✅ ${symbol} completed (${allData[symbol].length} records)`
            }));
          } else {
            console.log(`⚠️ No valid data for ${symbol}, generating demo data`);
            // Generate demo data for missing ETFs
            allData[symbol] = mstocksApiService.generateDemoHistoricalData(symbol, startDate, endDate);
            
            setDownloadProgress(prev => ({
              ...prev,
              failed: prev.failed + 1,
              message: `⚠️ Using demo data for ${symbol}`
            }));
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`❌ Error fetching ${symbol}:`, error);
          // Generate demo data for failed ETFs
          allData[symbol] = mstocksApiService.generateDemoHistoricalData(symbol, startDate, endDate);
          
          setDownloadProgress(prev => ({
            ...prev,
            failed: prev.failed + 1,
            message: `❌ Error downloading ${symbol}, using demo data`
          }));
        }
      }

      // Ensure we have data for all ETFs
      if (Object.keys(allData).length === 0) {
        throw new Error('No historical data available');
      }
       
      // Save to localStorage using compression and chunking
      const saveSuccess = await saveLargeData('etf_backtest_historical_data', allData);
      if (saveSuccess) {
        localStorage.setItem('etf_backtest_data_status', 'loaded');
        localStorage.setItem('etf_backtest_data_date', new Date().toISOString());
        localStorage.setItem('etf_backtest_start_date', startDate);
        localStorage.setItem('etf_backtest_end_date', endDate);
      } else {
        throw new Error('Failed to save historical data - storage quota exceeded');
      }
      
      setHistoricalData(allData);
      setDataStatus('loaded');
      
      setDownloadProgress(prev => ({
        ...prev,
        status: 'completed',
        message: `✅ Download completed! ${Object.keys(allData).length} ETFs loaded successfully.`
      }));
      
      console.log('✅ Historical data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error pulling historical data:', error);
      setDataStatus('error');
      setDownloadProgress(prev => ({
        ...prev,
        status: 'error',
        message: `❌ Download failed: ${error.message}`
      }));
    } finally {
      setIsDataLoading(false);
      // Reset progress after completion
      setTimeout(() => {
        setDownloadProgress({
          current: 0,
          total: 0,
          currentETF: '',
          completed: 0,
          failed: 0,
          percentage: 0,
          status: 'idle',
          message: '',
          apiConnected: false
        });
      }, 5000);
    }
  };

  // Clear historical data
  const clearHistoricalData = () => {
    try {
      // Clear all backtest data related keys
      const keysToClear = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('etf_backtest')) {
          keysToClear.push(key);
        }
      }
      
      keysToClear.forEach(key => {
        localStorage.removeItem(key);
      });
      
      setHistoricalData({});
      setDataStatus('not_loaded');
      setResults(null);
      
      console.log(`🗑️ Cleared ${keysToClear.length} backtest data items`);
      alert(`Cleared ${keysToClear.length} backtest data items. You can now download fresh data.`);
    } catch (error) {
      console.error('Failed to clear historical data:', error);
      alert('Failed to clear historical data');
    }
  };

  // Helper function to select best ETF for buying (most fallen from 20DMA)
  const selectBestETFForBuy = (availableETFs, day) => {
    if (!availableETFs.length) return null;
    
    let bestETF = null;
    let bestScore = -Infinity;
    
    availableETFs.forEach(symbol => {
      const data = historicalData[symbol]?.[day];
      if (data) {
        // Calculate 20-day moving average
        const dma20 = calculate20DMA(symbol, day);
        if (dma20 > 0) {
          // Score = percentage below 20DMA (negative value, so lower is better for buying)
          const score = ((data.close - dma20) / dma20) * 100;
          if (score < bestScore || bestETF === null) {
            bestScore = score;
            bestETF = symbol;
          }
        }
      }
    });
    
    return bestETF || availableETFs[0]; // Fallback to first available
  };
  
  // Helper function to calculate 20-day moving average
  const calculate20DMA = (symbol, currentDay) => {
    if (!historicalData[symbol] || currentDay < 19) return 0;
    
    let sum = 0;
    let count = 0;
    
    for (let i = Math.max(0, currentDay - 19); i <= currentDay; i++) {
      if (historicalData[symbol][i]?.close) {
        sum += historicalData[symbol][i].close;
        count++;
      }
    }
    
    return count > 0 ? sum / count : 0;
  };
  
  // Simulation fallback for when real data is not available
  const runSimulationStrategy = (strategyType) => {
    console.log(`🎯 Running ${strategyType} simulation strategy (fixed ${config.profitPerTrade}% profit)`);
    
    if (strategyType === 'global') {
      let totalCapital = config.startCapital;
      let dailyValues = [totalCapital];
      let trades = [];
      let holdings = [];
      let availableTrades = null;
      
      for (let day = 1; day <= config.totalTradingDays; day++) {
        setCurrentDay(day);
        
        if (!availableTrades) {
          const availableChunks = config.numberOfChunks - holdings.length;
          
          if (availableChunks > 0) {
            const tradeAmount = totalCapital / availableChunks;
            availableTrades = { day, amount: tradeAmount, profit: 0 };
            
            holdings.push({ startDay: day, amount: tradeAmount });
            
            trades.push({
              day, action: 'BUY', amount: tradeAmount,
              availableChunks, totalHoldings: holdings.length,
              capitalAfter: totalCapital
            });
          }
        } else {
          const profit = availableTrades.amount * (config.profitPerTrade / 100);
          totalCapital += profit;
          
          trades.push({
            day, action: 'SELL', amount: availableTrades.amount,
            profit, totalHoldings: holdings.length, capitalAfter: totalCapital
          });
          
          holdings.pop();
          availableTrades = null;
        }
        
        dailyValues.push(totalCapital);
      }
      
      return {
        finalCapital: totalCapital,
        dailyValues,
        trades,
        holdings: holdings.length,
        totalTrades: trades.filter(t => t.action === 'SELL').length
      };
    } else if (strategyType === 'chunk') {
      // Chunk simulation strategy
      const chunks = Array.from({ length: config.numberOfChunks }, (_, i) => ({
        id: i + 1,
        capital: config.startCapital / config.numberOfChunks,
        inTrade: false,
        tradeStartDay: null
      }));
      
      let dailyValues = [config.startCapital];
      let trades = [];
      
      for (let day = 1; day <= config.totalTradingDays; day++) {
        setCurrentDay(day);
        
        // Determine which chunk trades today (round-robin)
        const activeChunkIndex = (day - 1) % config.numberOfChunks;
        const activeChunk = chunks[activeChunkIndex];
        
        if (!activeChunk.inTrade) {
          // Start new trade for this chunk
          activeChunk.inTrade = true;
          activeChunk.tradeStartDay = day;
          
          trades.push({
            day, chunkId: activeChunk.id, action: 'BUY',
            amount: activeChunk.capital, capitalAfter: getTotalChunkCapital(chunks)
          });
        } else {
          // Close trade with profit
          const profit = activeChunk.capital * (config.profitPerTrade / 100);
          activeChunk.capital += profit;
          activeChunk.inTrade = false;
          activeChunk.tradeStartDay = null;
          
          trades.push({
            day, chunkId: activeChunk.id, action: 'SELL',
            amount: activeChunk.capital - profit, profit: profit,
            capitalAfter: getTotalChunkCapital(chunks)
          });
        }
        
        dailyValues.push(getTotalChunkCapital(chunks));
      }
      
      return {
        finalCapital: getTotalChunkCapital(chunks),
        dailyValues,
        trades,
        chunks,
        totalTrades: trades.filter(t => t.action === 'SELL').length
      };
    }
  };

  // Run the backtest simulation
  const runBacktest = async () => {
    // Validate data availability
    if (config.useRealData && dataStatus !== 'loaded') {
      alert('Please load historical data first before running backtest.');
      return;
    }
    
    if (config.useRealData && Object.keys(historicalData).length === 0) {
      alert('No historical data available. Please load data first.');
      return;
    }
    
    setIsRunning(true);
    setCurrentDay(0);
    
    try {
      // Strategy 1: Global Compounding
      const globalResults = runGlobalCompoundingStrategy();
      
      // Strategy 2: Independent Chunk Compounding  
      const chunkResults = runIndependentChunkStrategy();
      
      // Calculate performance metrics
      const globalMetrics = calculateMetrics(globalResults, config.startCapital, config.totalTradingDays);
      const chunkMetrics = calculateMetrics(chunkResults, config.startCapital, config.totalTradingDays);
      
      setResults({
        global: {
          ...globalResults,
          ...globalMetrics
        },
        chunk: {
          ...chunkResults,
          ...chunkMetrics
        },
        config: { ...config }
      });
      
      console.log('✅ Backtest completed successfully');
      
    } catch (error) {
      console.error('Backtest error:', error);
      alert('Error running backtest: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  // Strategy 1: Global Compounding with Real Historical Data
  const runGlobalCompoundingStrategy = () => {
    console.log('🚀 Running Global Compounding Strategy with Real Data...');
    
    if (!config.useRealData) {
      return runSimulationStrategy('global');
    }
    
    if (!historicalData || Object.keys(historicalData).length === 0) {
      console.error('❌ No historical data available for real data backtest');
      return runSimulationStrategy('global');
    }
    
    const etfSymbols = Object.keys(historicalData);
    const tradingDaysData = Object.values(historicalData)[0]; // Get trading days from first ETF
    const totalTradingDays = Math.min(config.totalTradingDays, tradingDaysData.length - 1);
    
    console.log(`📊 Using real data for ${etfSymbols.length} ETFs over ${totalTradingDays} trading days`);
    
    let totalCapital = config.startCapital;
    let availableCapital = config.startCapital; // Cash available for new investments
    let investedCapital = 0; // Money currently invested in holdings
    let dailyValues = [totalCapital];
    let trades = [];
    let holdings = []; // { symbol, quantity, buyPrice, buyDate, startDay }
    
    for (let day = 0; day < totalTradingDays; day++) {
      setCurrentDay(day + 1);
      
      // Get available ETFs for trading
      const availableETFs = etfSymbols.filter(symbol => {
        // ETF is available if we don't already hold it
        return !holdings.find(holding => holding.symbol === symbol);
      });
      
      // Calculate available chunks (50 - number of holdings)
      const availableChunks = config.numberOfChunks - holdings.length;
      
      // Recalculate total capital (available + invested)
      totalCapital = availableCapital + investedCapital;
      
      // Decision 1: Buy new ETF if we have available chunks and ETFs
      if (availableChunks > 0 && availableETFs.length > 0) {
        const tradeAmount = totalCapital / availableChunks;
        
        // Only buy if we have enough available capital
        if (tradeAmount <= availableCapital) {
          // Select ETF with best ranking (most fallen from 20DMA)
          const selectedETF = selectBestETFForBuy(availableETFs, day);
          
          if (selectedETF && historicalData[selectedETF] && historicalData[selectedETF][day]) {
            const buyPrice = historicalData[selectedETF][day].close;
            const quantity = Math.floor(tradeAmount / buyPrice);
            
            if (quantity > 0) {
              const actualInvestment = quantity * buyPrice;
              
              // Update capital tracking
              availableCapital -= actualInvestment;
              investedCapital += actualInvestment;
              
              holdings.push({
                symbol: selectedETF,
                quantity: quantity,
                buyPrice: buyPrice,
                buyDate: historicalData[selectedETF][day].date,
                startDay: day,
                actualInvestment: actualInvestment
              });
              
              trades.push({
                day: day + 1,
                date: historicalData[selectedETF][day].date,
                action: 'BUY',
                symbol: selectedETF,
                quantity: quantity,
                price: buyPrice,
                amount: actualInvestment,
                availableChunks: availableChunks,
                totalHoldings: holdings.length,
                availableCapital: availableCapital,
                capitalAfter: totalCapital
              });
              
              console.log(`📈 Day ${day + 1}: BUY ${quantity} ${selectedETF} @ ₹${buyPrice} = ₹${actualInvestment} (Available: ₹${availableCapital.toFixed(2)})`);
            }
          }
        }
      }
      
      // Decision 2: Check for sell opportunities (profit target reached)
      const holdingsToSell = [];
      holdings.forEach((holding, index) => {
        const currentData = historicalData[holding.symbol]?.[day];
        if (currentData) {
          const currentPrice = currentData.close;
          const profitPercent = ((currentPrice - holding.buyPrice) / holding.buyPrice) * 100;
          
          // Sell if we've reached target profit (default 6%)
          if (profitPercent >= config.profitPerTrade) {
            holdingsToSell.push({ ...holding, index, currentPrice, profitPercent });
          }
        }
      });
      
      // Execute sells (LIFO - Last In, First Out)
      holdingsToSell.reverse().forEach(sellInfo => {
        const sellValue = sellInfo.quantity * sellInfo.currentPrice;
        const profit = sellValue - sellInfo.actualInvestment;
        
        // Update capital tracking properly
        availableCapital += sellValue; // Return full sell value to available capital
        investedCapital -= sellInfo.actualInvestment; // Remove original investment from invested capital
        totalCapital = availableCapital + investedCapital; // Recalculate total capital
        
        trades.push({
          day: day + 1,
          date: historicalData[sellInfo.symbol][day].date,
          action: 'SELL',
          symbol: sellInfo.symbol,
          quantity: sellInfo.quantity,
          price: sellInfo.currentPrice,
          amount: sellValue,
          profit: profit,
          profitPercent: sellInfo.profitPercent,
          holdingDays: day - sellInfo.startDay,
          totalHoldings: holdings.length - 1,
          availableCapital: availableCapital,
          capitalAfter: totalCapital
        });
        
        console.log(`💰 Day ${day + 1}: SELL ${sellInfo.quantity} ${sellInfo.symbol} @ ₹${sellInfo.currentPrice} = ₹${sellValue} (Profit: ₹${profit.toFixed(2)}, ${sellInfo.profitPercent.toFixed(2)}%) Available: ₹${availableCapital.toFixed(2)}`);
        
        // Remove from holdings
        holdings.splice(sellInfo.index, 1);
      });
      
      // Update daily portfolio value to include both available capital and current holding values
      let currentPortfolioValue = availableCapital;
      holdings.forEach(holding => {
        const currentData = historicalData[holding.symbol]?.[day];
        if (currentData) {
          currentPortfolioValue += holding.quantity * currentData.close;
        } else {
          currentPortfolioValue += holding.actualInvestment; // Fallback to original investment
        }
      });
      
      dailyValues.push(currentPortfolioValue);
      
      // Debug logging every 50 days
      if ((day + 1) % 50 === 0) {
        console.log(`📊 Day ${day + 1}: Available: ₹${availableCapital.toFixed(2)}, Invested: ₹${investedCapital.toFixed(2)}, Portfolio: ₹${currentPortfolioValue.toFixed(2)}, Holdings: ${holdings.length}`);
      }
    }
    
    // Calculate final portfolio value including unsold holdings
    let finalPortfolioValue = availableCapital; // Start with available cash
    holdings.forEach(holding => {
      const lastDayData = historicalData[holding.symbol]?.[totalTradingDays - 1];
      if (lastDayData) {
        finalPortfolioValue += holding.quantity * lastDayData.close;
      } else {
        finalPortfolioValue += holding.actualInvestment; // Fallback to original investment
      }
    });
    
    console.log(`✅ Global Strategy Complete:`);
    console.log(`   💰 Final Available Capital: ₹${availableCapital.toFixed(2)}`);
    console.log(`   📊 Final Invested Capital: ₹${investedCapital.toFixed(2)}`);
    console.log(`   🎯 Final Portfolio Value: ₹${finalPortfolioValue.toFixed(2)}`);
    console.log(`   📈 Total Trades: ${trades.filter(t => t.action === 'BUY').length} buys, ${trades.filter(t => t.action === 'SELL').length} sells`);
    console.log(`   🏠 Final Holdings: ${holdings.length} ETFs`);
    console.log(`   💹 Total Return: ${((finalPortfolioValue - config.startCapital) / config.startCapital * 100).toFixed(2)}%`);
    
    return {
      finalCapital: finalPortfolioValue,
      dailyValues,
      trades,
      holdings: holdings.length,
      totalTrades: trades.filter(t => t.action === 'SELL').length,
      finalHoldings: holdings,
      availableCapital: availableCapital,
      investedCapital: investedCapital
    };
  };

  // Strategy 2: Independent Chunk Compounding with Real Historical Data
  const runIndependentChunkStrategy = () => {
    console.log('🚀 Running Independent Chunk Strategy with Real Data...');
    
    if (!config.useRealData) {
      return runSimulationStrategy('chunk');
    }
    
    if (!historicalData || Object.keys(historicalData).length === 0) {
      console.error('❌ No historical data available for chunk strategy backtest');
      return runSimulationStrategy('chunk');
    }
    
    const etfSymbols = Object.keys(historicalData);
    const tradingDaysData = Object.values(historicalData)[0];
    const totalTradingDays = Math.min(config.totalTradingDays, tradingDaysData.length - 1);
    
    console.log(`📊 Chunk Strategy: Using real data for ${etfSymbols.length} ETFs over ${totalTradingDays} trading days`);
    
    // Initialize chunks with cash and holdings tracking
    const chunks = Array.from({ length: config.numberOfChunks }, (_, i) => ({
      id: i + 1,
      availableCapital: config.startCapital / config.numberOfChunks,
      holding: null, // { symbol, quantity, buyPrice, buyDate, startDay, investment }
      inTrade: false
    }));
    
    let dailyValues = [config.startCapital];
    let trades = [];
    
    for (let day = 0; day < totalTradingDays; day++) {
      setCurrentDay(day + 1);
      
      // Determine which chunk trades today (round-robin)
      const activeChunkIndex = day % config.numberOfChunks;
      const activeChunk = chunks[activeChunkIndex];
      
      if (!activeChunk.inTrade && !activeChunk.holding) {
        // Find available ETF for this chunk (not held by any other chunk)
        const availableETFs = etfSymbols.filter(symbol => {
          return !chunks.some(chunk => chunk.holding?.symbol === symbol);
        });
        
        if (availableETFs.length > 0) {
          // Select best ETF for buying
          const selectedETF = selectBestETFForBuy(availableETFs, day);
          
          if (selectedETF && historicalData[selectedETF]?.[day]) {
            const buyPrice = historicalData[selectedETF][day].close;
            const quantity = Math.floor(activeChunk.availableCapital / buyPrice);
            
            if (quantity > 0) {
              const actualInvestment = quantity * buyPrice;
              
              activeChunk.holding = {
                symbol: selectedETF,
                quantity: quantity,
                buyPrice: buyPrice,
                buyDate: historicalData[selectedETF][day].date,
                startDay: day,
                investment: actualInvestment
              };
              activeChunk.availableCapital -= actualInvestment;
              activeChunk.inTrade = true;
              
              trades.push({
                day: day + 1,
                date: historicalData[selectedETF][day].date,
                chunkId: activeChunk.id,
                action: 'BUY',
                symbol: selectedETF,
                quantity: quantity,
                price: buyPrice,
                amount: actualInvestment,
                capitalAfter: getTotalChunkCapital(chunks)
              });
              
              console.log(`📈 Day ${day + 1}: Chunk ${activeChunk.id} BUY ${quantity} ${selectedETF} @ ₹${buyPrice}`);
            }
          }
        }
      } else if (activeChunk.inTrade && activeChunk.holding) {
        // Check if we should sell (profit target reached)
        const currentData = historicalData[activeChunk.holding.symbol]?.[day];
        if (currentData) {
          const currentPrice = currentData.close;
          const profitPercent = ((currentPrice - activeChunk.holding.buyPrice) / activeChunk.holding.buyPrice) * 100;
          
          if (profitPercent >= config.profitPerTrade) {
            const sellValue = activeChunk.holding.quantity * currentPrice;
            const profit = sellValue - activeChunk.holding.investment;
            
            activeChunk.availableCapital += sellValue; // Return proceeds to chunk
            
            trades.push({
              day: day + 1,
              date: currentData.date,
              chunkId: activeChunk.id,
              action: 'SELL',
              symbol: activeChunk.holding.symbol,
              quantity: activeChunk.holding.quantity,
              price: currentPrice,
              amount: sellValue,
              profit: profit,
              profitPercent: profitPercent,
              holdingDays: day - activeChunk.holding.startDay,
              capitalAfter: getTotalChunkCapital(chunks)
            });
            
            console.log(`💰 Day ${day + 1}: Chunk ${activeChunk.id} SELL ${activeChunk.holding.quantity} ${activeChunk.holding.symbol} @ ₹${currentPrice} (Profit: ₹${profit.toFixed(2)}, ${profitPercent.toFixed(2)}%)`);
            
            activeChunk.holding = null;
            activeChunk.inTrade = false;
          }
        }
      }
      
      // Calculate daily portfolio value
      let totalPortfolioValue = 0;
      chunks.forEach(chunk => {
        totalPortfolioValue += chunk.availableCapital;
        if (chunk.holding) {
          const currentData = historicalData[chunk.holding.symbol]?.[day];
          if (currentData) {
            totalPortfolioValue += chunk.holding.quantity * currentData.close;
          } else {
            totalPortfolioValue += chunk.holding.investment; // Fallback
          }
        }
      });
      
      dailyValues.push(totalPortfolioValue);
    }
    
    // Calculate final portfolio value
    let finalPortfolioValue = 0;
    chunks.forEach(chunk => {
      finalPortfolioValue += chunk.availableCapital;
      if (chunk.holding) {
        const lastDayData = historicalData[chunk.holding.symbol]?.[totalTradingDays - 1];
        if (lastDayData) {
          finalPortfolioValue += chunk.holding.quantity * lastDayData.close;
        } else {
          finalPortfolioValue += chunk.holding.investment;
        }
      }
    });
    
    console.log(`✅ Chunk Strategy Complete: Final Portfolio Value: ₹${finalPortfolioValue.toFixed(2)}`);
    
    return {
      finalCapital: finalPortfolioValue,
      dailyValues,
      trades,
      chunks,
      totalTrades: trades.filter(t => t.action === 'SELL').length
    };
  };

  // Helper function to get total capital across all chunks
  const getTotalChunkCapital = (chunks) => {
    return chunks.reduce((total, chunk) => {
      let chunkValue = chunk.availableCapital || chunk.capital || 0;
      if (chunk.holding) {
        // Add current holding value (use investment as fallback)
        chunkValue += chunk.holding.investment || 0;
      }
      return total + chunkValue;
    }, 0);
  };

  // Calculate performance metrics
  const calculateMetrics = (strategyResults, startCapital, totalDays) => {
    const { finalCapital, dailyValues } = strategyResults;
    
    // Total return
    const totalReturn = ((finalCapital - startCapital) / startCapital) * 100;
    
    // CAGR (Compound Annual Growth Rate)
    const years = totalDays / 250; // 250 trading days per year
    const cagr = (Math.pow(finalCapital / startCapital, 1 / years) - 1) * 100;
    
    // Max Drawdown
    let maxDrawdown = 0;
    let peak = dailyValues[0];
    
    for (let i = 1; i < dailyValues.length; i++) {
      if (dailyValues[i] > peak) {
        peak = dailyValues[i];
      } else {
        const drawdown = ((peak - dailyValues[i]) / peak) * 100;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    return {
      totalReturn: totalReturn,
      cagr: cagr,
      maxDrawdown: maxDrawdown,
      profitLoss: finalCapital - startCapital
    };
  };

  // Prepare chart data for equity curves
  const getChartData = () => {
    if (!results) return null;

    const { global, chunk } = results;
    const maxLength = Math.max(global.dailyValues.length, chunk.dailyValues.length);
    
    // Create labels (days)
    const labels = Array.from({ length: maxLength }, (_, i) => `Day ${i}`);
    
    return {
      labels,
      datasets: [
        {
          label: 'Global Compounding Strategy',
          data: global.dailyValues,
          borderColor: 'rgb(59, 130, 246)', // Blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Independent Chunk Strategy',
          data: chunk.dailyValues,
          borderColor: 'rgb(16, 185, 129)', // Green
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Portfolio Value Over Time - Strategy Comparison',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Trading Days',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Portfolio Value (₹)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      point: {
        radius: 0
      }
    }
  };

  // Export results to CSV
  const exportToCSV = (strategyName) => {
    if (!results) return;
    
    const strategy = strategyName === 'global' ? results.global : results.chunk;
    const csvData = strategy.trades.map(trade => ({
      Day: trade.day,
      Date: trade.date || 'N/A',
      Action: trade.action,
      Symbol: trade.symbol || 'N/A',
      Quantity: trade.quantity || 'N/A',
      Price: trade.price ? `₹${trade.price.toFixed(2)}` : 'N/A',
      Amount: `₹${trade.amount.toFixed(2)}`,
      Profit: `₹${(trade.profit || 0).toFixed(2)}`,
      ProfitPercent: trade.profitPercent ? trade.profitPercent.toFixed(2) + '%' : 'N/A',
      HoldingDays: trade.holdingDays || 'N/A',
      AvailableChunks: trade.availableChunks || 'N/A',
      TotalHoldings: trade.totalHoldings || 'N/A',
      AvailableCapital: trade.availableCapital ? `₹${trade.availableCapital.toFixed(2)}` : 'N/A',
      CapitalAfter: `₹${trade.capitalAfter.toFixed(2)}`
    }));
    
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${strategyName}_backtest_results.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export daily equity curve data to CSV
  const exportEquityCurveCSV = () => {
    if (!results) return;
    
    const { global, chunk } = results;
    const maxLength = Math.max(global.dailyValues.length, chunk.dailyValues.length);
    
    const csvData = [];
    for (let i = 0; i < maxLength; i++) {
      csvData.push({
        Day: i,
        GlobalStrategy: global.dailyValues[i] || '',
        ChunkStrategy: chunk.dailyValues[i] || ''
      });
    }
    
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'equity_curve_comparison.csv';
    link.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-upstox-primary">Money Management Backtest Framework</h2>
          <p className="text-sm text-upstox-secondary mt-1">
            Compare Global vs Independent Chunk Compounding Strategies using real ETF data from MStocks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={pullHistoricalData}
            disabled={isDataLoading}
            className="btn-upstox-secondary"
          >
            {isDataLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading Data...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Load Historical Data</span>
              </>
            )}
          </button>
          
          <button
            onClick={runBacktest}
            disabled={isRunning || (config.useRealData && dataStatus !== 'loaded')}
            className="btn-upstox-primary"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running... Day {currentDay}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Backtest</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              console.log('🔍 Debug Info:');
              console.log('Data Status:', dataStatus);
              console.log('Historical Data Keys:', Object.keys(historicalData));
              console.log('ETF Count:', etfs?.length || 0);
              console.log('Config:', config);
            }}
            className="btn-upstox-secondary"
          >
            <FileText className="w-4 h-4" />
            <span>Debug Info</span>
          </button>
          
          <button
            onClick={clearHistoricalData}
            disabled={isDataLoading}
            className="btn-upstox-danger"
            title="Clear all historical data to free up storage space"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Clear Data</span>
          </button>
        </div>
      </div>

      {/* Data Status */}
      <div className="card-upstox p-6">
        <div className="flex items-center space-x-4">
          <div className={`status-indicator ${
            dataStatus === 'loaded' ? 'status-success' : 
            dataStatus === 'loading' ? 'status-warning' : 
            dataStatus === 'error' ? 'status-error' : 'status-neutral'
          }`}>
            {dataStatus === 'loaded' ? (
              <CheckCircle className="w-4 h-4" />
            ) : dataStatus === 'loading' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : dataStatus === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>
              {dataStatus === 'loaded' ? 'Historical Data Loaded' : 
               dataStatus === 'loading' ? 'Loading Data...' : 
               dataStatus === 'error' ? 'Data Load Error' : 
               'No Historical Data'}
            </span>
          </div>
          
          {dataStatus === 'loaded' && (
            <div className="text-sm text-upstox-secondary">
              {Object.keys(historicalData).length} ETFs from ETF Ranking • {etfs?.length || 0} total available
            </div>
          )}
        </div>
      </div>

      {/* Download Progress */}
      {isDataLoading && (
        <div className="card-upstox p-6">
          <h3 className="text-lg font-semibold text-upstox-primary mb-4">Download Progress</h3>
          
          {/* API Connection Status */}
          <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                downloadProgress.apiConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-upstox-secondary">
                API Connection: {downloadProgress.apiConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {!downloadProgress.apiConnected && (
              <p className="text-xs text-upstox-secondary mt-1">
                Using demo data for backtesting
              </p>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-upstox-secondary">
                Progress: {downloadProgress.percentage}%
              </span>
              <span className="text-sm text-upstox-secondary">
                {downloadProgress.current}/{downloadProgress.total} ETFs
              </span>
            </div>
            <div className="w-full bg-upstox-tertiary rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ease-out ${
                  downloadProgress.status === 'error' ? 'bg-red-500' :
                  downloadProgress.status === 'completed' ? 'bg-green-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${downloadProgress.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-upstox-secondary">Current:</span>
              <span className="text-sm font-medium text-upstox-primary">{downloadProgress.currentETF}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-upstox-secondary">Completed:</span>
              <span className="text-sm font-medium text-positive">{downloadProgress.completed}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-upstox-secondary">Failed:</span>
              <span className="text-sm font-medium text-negative">{downloadProgress.failed}</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-sm text-upstox-secondary">
            {downloadProgress.message && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                {downloadProgress.status === 'connecting' && <RefreshCw className="w-4 h-4 animate-spin" />}
                {downloadProgress.status === 'downloading' && <Clock className="w-4 h-4" />}
                {downloadProgress.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {downloadProgress.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                <span>{downloadProgress.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="card-upstox p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-upstox-primary" />
          <h3 className="text-lg font-semibold text-upstox-primary">Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-upstox-secondary mb-2">
              Start Capital (₹)
            </label>
            <input
              type="number"
              value={config.startCapital}
              onChange={(e) => setConfig({...config, startCapital: Number(e.target.value)})}
              className="input-upstox"
              min="100000"
              step="100000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-upstox-secondary mb-2">
              Number of Chunks
            </label>
            <input
              type="number"
              value={config.numberOfChunks}
              onChange={(e) => setConfig({...config, numberOfChunks: Number(e.target.value)})}
              className="input-upstox"
              min="10"
              max="100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-upstox-secondary mb-2">
              Profit per Trade (%)
            </label>
            <input
              type="number"
              value={config.profitPerTrade}
              onChange={(e) => setConfig({...config, profitPerTrade: Number(e.target.value)})}
              className="input-upstox"
              min="1"
              max="20"
              step="0.5"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-upstox-secondary mb-2">
              Total Trading Days
            </label>
            <input
              type="number"
              value={config.totalTradingDays}
              onChange={(e) => setConfig({...config, totalTradingDays: Number(e.target.value)})}
              className="input-upstox"
              min="250"
              max="2500"
              step="250"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-upstox-secondary mb-2">
              Years
            </label>
            <input
              type="text"
              value={(config.totalTradingDays / 250).toFixed(1)}
              disabled
              className="input-upstox bg-gray-100 dark:bg-gray-700"
            />
          </div>
        </div>
        
        {/* Date Range Controls */}
        <div className="mt-6 pt-6 border-t border-upstox-primary">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-upstox-primary">Historical Data Range</h4>
            <div className="text-sm text-upstox-secondary bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
              📊 Now fetching from 2020 onwards (~4+ years of data)
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-upstox-secondary mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({...config, startDate: e.target.value})}
                className="input-upstox"
                max={config.endDate}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-upstox-secondary mb-2">
                End Date
              </label>
              <input
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig({...config, endDate: e.target.value})}
                className="input-upstox"
                min={config.startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="flex items-end">
              <div className="w-full">
                <label className="block text-sm font-medium text-upstox-secondary mb-2">
                  Data Source
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useRealData"
                    checked={config.useRealData}
                    onChange={(e) => setConfig({...config, useRealData: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="useRealData" className="text-sm text-upstox-secondary">
                    Use Real Market Data
                  </label>
                </div>
                {!config.useRealData && (
                  <p className="text-xs text-upstox-secondary mt-1">
                    Simulation mode: Fixed 6% profit per trade
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="card-upstox p-6">
        <h3 className="text-lg font-semibold text-upstox-primary mb-4">Strategy Assumptions</h3>
        <div className="space-y-6">
          
          {/* Data Source Info */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h4 className="font-medium text-upstox-primary mb-2">Data Source</h4>
            <ul className="text-sm text-upstox-secondary space-y-1">
              <li>• ETF List: {etfs?.length || 0} ETFs from ETF Ranking page</li>
              <li>• Historical Data: {config.useRealData ? 'Real market data from MStocks API' : 'Simulated data with fixed 6% profit'}</li>
              <li>• Date Range: {config.startDate} to {config.endDate} (~{Math.round((new Date(config.endDate) - new Date(config.startDate)) / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10} years)</li>
              <li>• Data Persistence: Cached locally for all users, auto-updates when broker connects</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strategy 1 */}
            <div className="space-y-3">
              <h4 className="font-medium text-upstox-primary flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Strategy 1: Global Compounding</span>
              </h4>
              <ul className="text-sm text-upstox-secondary space-y-1">
                <li>• Each trade uses: total capital / ({config.numberOfChunks} - number of holdings)</li>
                <li>• {config.useRealData ? 'Trade outcomes based on real ETF performance' : `Fixed +${config.profitPerTrade}% profit per trade`}</li>
                <li>• Profits added to total capital and compounded</li>
                <li>• Available chunks decrease as holdings increase</li>
                <li>• Portfolio compounds globally with dynamic allocation</li>
              </ul>
            </div>
            
            {/* Strategy 2 */}
            <div className="space-y-3">
              <h4 className="font-medium text-upstox-primary flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Strategy 2: Independent Chunk Compounding</span>
              </h4>
              <ul className="text-sm text-upstox-secondary space-y-1">
                <li>• Portfolio split into {config.numberOfChunks} independent chunks</li>
                <li>• Each day, only one chunk trades (round-robin)</li>
                <li>• {config.useRealData ? 'Each chunk performance based on real ETF data' : `Each chunk grows by ${config.profitPerTrade}% when trade closes`}</li>
                <li>• Chunks compound independently</li>
                <li>• Total portfolio = sum of all chunks</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Global Strategy */}
            <div className="card-upstox p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-upstox-secondary">Global Strategy</p>
                  <p className="text-2xl font-bold text-upstox-primary">
                    ₹{results.global.finalCapital.toLocaleString()}
                  </p>
                  <p className="text-sm text-upstox-secondary">
                    {results.global.totalReturn.toFixed(2)}% Total Return
                  </p>
                </div>
              </div>
            </div>
            
            {/* Chunk Strategy */}
            <div className="card-upstox p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-upstox-secondary">Chunk Strategy</p>
                  <p className="text-2xl font-bold text-upstox-primary">
                    ₹{results.chunk.finalCapital.toLocaleString()}
                  </p>
                  <p className="text-sm text-upstox-secondary">
                    {results.chunk.totalReturn.toFixed(2)}% Total Return
                  </p>
                </div>
              </div>
            </div>
            
            {/* Difference */}
            <div className="card-upstox p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-upstox-secondary">Difference</p>
                  <p className={`text-2xl font-bold ${
                    results.global.finalCapital > results.chunk.finalCapital ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₹{Math.abs(results.global.finalCapital - results.chunk.finalCapital).toLocaleString()}
                  </p>
                  <p className="text-sm text-upstox-secondary">
                    {results.global.finalCapital > results.chunk.finalCapital ? 'Global Wins' : 'Chunk Wins'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Better Strategy */}
            <div className="card-upstox p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <LineChart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-upstox-secondary">Better Strategy</p>
                  <p className="text-2xl font-bold text-upstox-primary">
                    {results.global.finalCapital > results.chunk.finalCapital ? 'Global' : 'Chunk'}
                  </p>
                  <p className="text-sm text-upstox-secondary">
                    {((Math.abs(results.global.finalCapital - results.chunk.finalCapital) / 
                      Math.min(results.global.finalCapital, results.chunk.finalCapital)) * 100).toFixed(2)}% Better
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="card-upstox p-6">
            <h3 className="text-lg font-semibold text-upstox-primary mb-6">Performance Metrics</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Global Strategy Metrics */}
              <div>
                <h4 className="text-lg font-medium text-upstox-primary mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Global Compounding</span>
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">Initial Capital:</span>
                    <span className="text-sm font-medium text-upstox-primary">₹{config.startCapital.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">Final Capital:</span>
                    <span className="text-sm font-medium text-upstox-primary">₹{results.global.finalCapital.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">Total Profit:</span>
                    <span className="text-sm font-medium text-upstox-primary">₹{results.global.profitLoss.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">CAGR:</span>
                    <span className="text-sm font-medium text-upstox-primary">{results.global.cagr.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">Max Drawdown:</span>
                    <span className="text-sm font-medium text-upstox-primary">{results.global.maxDrawdown.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">Total Trades:</span>
                    <span className="text-sm font-medium text-upstox-primary">{results.global.totalTrades}</span>
                  </div>
                </div>
              </div>

              {/* Chunk Strategy Metrics */}
              <div>
                <h4 className="text-lg font-medium text-upstox-primary mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Independent Chunk Compounding</span>
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">Initial Capital:</span>
                    <span className="text-sm font-medium text-upstox-primary">₹{config.startCapital.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">Final Capital:</span>
                    <span className="text-sm font-medium text-upstox-primary">₹{results.chunk.finalCapital.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">Total Profit:</span>
                    <span className="text-sm font-medium text-upstox-primary">₹{results.chunk.profitLoss.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">CAGR:</span>
                    <span className="text-sm font-medium text-upstox-primary">{results.chunk.cagr.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">Max Drawdown:</span>
                    <span className="text-sm font-medium text-upstox-primary">{results.chunk.maxDrawdown.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-upstox-secondary">Total Trades:</span>
                    <span className="text-sm font-medium text-upstox-primary">{results.chunk.totalTrades}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Equity Curve Visualization */}
          <div className="card-upstox p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-upstox-primary">Equity Curves Comparison</h3>
              <div className="flex space-x-2">
                <button
                  onClick={exportEquityCurveCSV}
                  className="btn-upstox-primary text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Equity Curve Data
                </button>
                <button
                  onClick={() => exportToCSV('global')}
                  className="btn-upstox-secondary text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Global Trades
                </button>
                <button
                  onClick={() => exportToCSV('chunk')}
                  className="btn-upstox-secondary text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Chunk Trades
                </button>
              </div>
            </div>
            
            {/* Chart Container */}
            <div className="h-96 w-full">
              {getChartData() ? (
                <Line data={getChartData()} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center bg-upstox-tertiary rounded-lg">
                  <div className="text-center">
                                    <LineChart className="w-12 h-12 text-upstox-muted mx-auto mb-2" />
                <p className="text-upstox-muted text-sm">No data available for visualization</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chart Legend and Stats */}
            {results && (
              <div className="mt-6 pt-4 border-t border-upstox-primary">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Global Strategy Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-upstox-primary">Global Compounding Strategy</span>
                    </div>
                    <div className="text-sm text-upstox-secondary space-y-1">
                      <div>Final Value: ₹{results.global.finalCapital.toLocaleString()}</div>
                      <div>Total Return: {results.global.totalReturn.toFixed(2)}%</div>
                      <div>CAGR: {results.global.cagr.toFixed(2)}%</div>
                      <div>Max Drawdown: {results.global.maxDrawdown.toFixed(2)}%</div>
                    </div>
                  </div>
                  
                  {/* Chunk Strategy Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-upstox-primary">Independent Chunk Strategy</span>
                    </div>
                    <div className="text-sm text-upstox-secondary space-y-1">
                      <div>Final Value: ₹{results.chunk.finalCapital.toLocaleString()}</div>
                      <div>Total Return: {results.chunk.totalReturn.toFixed(2)}%</div>
                      <div>CAGR: {results.chunk.cagr.toFixed(2)}%</div>
                      <div>Max Drawdown: {results.chunk.maxDrawdown.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
                
                {/* Performance Comparison */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium text-upstox-primary">
                      Performance Winner: 
                    </span>
                    <span className={`ml-2 font-bold ${
                      results.global.finalCapital > results.chunk.finalCapital ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {results.global.finalCapital > results.chunk.finalCapital ? 'Global Strategy' : 'Chunk Strategy'}
                    </span>
                    <span className="text-upstox-secondary ml-2">
                      (by ₹{Math.abs(results.global.finalCapital - results.chunk.finalCapital).toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chunk Status (for Chunk Strategy) */}
          <div className="card-upstox p-6">
            <h3 className="text-lg font-semibold text-upstox-primary mb-4">Final Chunk Status</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
              {results.chunk.chunks.map((chunk) => (
                <div
                  key={chunk.id}
                  className={`p-2 rounded text-center text-xs ${
                    chunk.inTrade 
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' 
                      : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  }`}
                >
                  <div className="font-medium">Chunk {chunk.id}</div>
                  <div>₹{Math.round(chunk.capital).toLocaleString()}</div>
                  <div className="text-xs opacity-75">
                    {chunk.inTrade ? 'Trading' : 'Ready'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestingSystem;