import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  RefreshCw, 
  Settings,
  Play,
  RotateCcw,
  Percent,
  Table
} from 'lucide-react';
import { useETFTrading } from '../context/ETFTradingContext';
import ChunkSimulationTable from './ChunkSimulationTable';

const ChunkMoneyManagement = () => {
  const { chunkManagement, updateChunkManagement } = useETFTrading();
  
  // Configuration state
  const [config, setConfig] = useState({
    startingCapital: 1000000, // ₹10 Lakh default
    numberOfChunks: 50,
    profitTarget: 6, // 6% target
    averageHoldingDays: 90, // Average days to book profit
    tradingDaysPerYear: 250,
    winRate: 75, // 75% default
    averageLoss: 3, // 3% average loss
    ...chunkManagement?.config
  });

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [showDetailedTable, setShowDetailedTable] = useState(false);

  // Initialize chunks
  const initializeChunks = () => {
    const chunkSize = config.startingCapital / config.numberOfChunks;
    const chunks = [];
    
    for (let i = 0; i < config.numberOfChunks; i++) {
      chunks.push({
        id: i + 1,
        initialCapital: chunkSize,
        currentCapital: chunkSize,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        isActive: false, // Whether chunk is currently deployed
        deploymentDate: null, // When chunk was last deployed
        expectedExitDate: null, // Expected profit booking date
        actualExitDate: null, // Actual profit booking date
        history: []
      });
    }
    
    return chunks;
  };

  // Deploy a chunk (start a new trade)
  const deployChunk = (chunk, day) => {
    // Generate random holding period around the average (70-110 days)
    const minDays = Math.max(30, config.averageHoldingDays - 20);
    const maxDays = config.averageHoldingDays + 20;
    const holdingDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    
    chunk.isActive = true;
    chunk.deploymentDate = day;
    chunk.expectedExitDate = day + holdingDays;
    
    return {
      day,
      chunkId: chunk.id,
      action: 'DEPLOY',
      startingCapital: chunk.currentCapital,
      holdingDays: holdingDays,
      expectedExitDate: chunk.expectedExitDate
    };
  };

  // Exit a chunk (book profit or loss)
  const exitChunk = (chunk, day) => {
    const isWin = Math.random() < (config.winRate / 100);
    const holdingDays = day - chunk.deploymentDate;
    
    const result = {
      day,
      chunkId: chunk.id,
      action: 'EXIT',
      startingCapital: chunk.currentCapital,
      isWin,
      profit: 0,
      endingCapital: chunk.currentCapital,
      holdingDays: holdingDays,
      deploymentDate: chunk.deploymentDate
    };

    if (isWin) {
      result.profit = chunk.currentCapital * (config.profitTarget / 100);
      result.endingCapital = chunk.currentCapital + result.profit;
      chunk.winningTrades++;
    } else {
      result.profit = -(chunk.currentCapital * (config.averageLoss / 100));
      result.endingCapital = chunk.currentCapital + result.profit;
      chunk.losingTrades++;
    }

    chunk.currentCapital = result.endingCapital;
    chunk.totalProfit += result.profit;
    chunk.totalTrades++;
    chunk.isActive = false;
    chunk.actualExitDate = day;
    chunk.history.push(result);

    return result;
  };

  // Run complete simulation
  const runSimulation = () => {
    setIsSimulating(true);
    
    const chunks = initializeChunks();
    const simulationData = [];
    const deploymentQueue = []; // Track chunks ready for deployment
    
    // Initially, all chunks are available for deployment
    chunks.forEach(chunk => deploymentQueue.push(chunk));
    
    // Track chunks that will be available for redeployment
    const coolingChunks = []; // [{chunk, availableDate}]
    
    // Simulate over the trading year
    for (let day = 1; day <= config.tradingDaysPerYear; day++) {
      // Check for chunks that need to exit today
      chunks.forEach(chunk => {
        if (chunk.isActive && chunk.expectedExitDate <= day) {
          const exitResult = exitChunk(chunk, day);
          simulationData.push(exitResult);
          
          // Add chunk to cooling period (5-10 days)
          const coolingDays = Math.floor(Math.random() * 6) + 5; // 5-10 days
          const availableDate = day + coolingDays;
          if (availableDate <= config.tradingDaysPerYear) {
            coolingChunks.push({ chunk, availableDate });
          }
        }
      });
      
      // Move chunks from cooling to deployment queue if they're ready
      for (let i = coolingChunks.length - 1; i >= 0; i--) {
        if (coolingChunks[i].availableDate <= day) {
          deploymentQueue.push(coolingChunks[i].chunk);
          coolingChunks.splice(i, 1);
        }
      }
      
      // Deploy available chunks (limit to 1-2 deployments per day to be realistic)
      const maxDeploymentsPerDay = Math.floor(Math.random() * 2) + 1; // 1-2 deployments
      let deploymentsToday = 0;
      
      while (deploymentQueue.length > 0 && deploymentsToday < maxDeploymentsPerDay) {
        const chunk = deploymentQueue.shift();
        if (!chunk.isActive) {
          const deployResult = deployChunk(chunk, day);
          simulationData.push(deployResult);
          deploymentsToday++;
        }
      }
    }
    
    // Handle any remaining active chunks at year end
    chunks.forEach(chunk => {
      if (chunk.isActive) {
        const exitResult = exitChunk(chunk, config.tradingDaysPerYear);
        simulationData.push(exitResult);
      }
    });

    // Calculate final results
    const totalCurrentCapital = chunks.reduce((sum, chunk) => sum + chunk.currentCapital, 0);
    const totalProfit = chunks.reduce((sum, chunk) => sum + chunk.totalProfit, 0);
    const roi = ((totalCurrentCapital - config.startingCapital) / config.startingCapital) * 100;
    
    const totalTrades = chunks.reduce((sum, chunk) => sum + chunk.totalTrades, 0);
    const totalWins = chunks.reduce((sum, chunk) => sum + chunk.winningTrades, 0);
    const actualWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
    
    // Calculate deployment efficiency
    const deploymentActions = simulationData.filter(action => action.action === 'DEPLOY');
    const exitActions = simulationData.filter(action => action.action === 'EXIT');
    const averageHoldingPeriod = exitActions.reduce((sum, exit) => sum + exit.holdingDays, 0) / exitActions.length || 0;
    
    // Calculate capital utilization
    const maxPossibleDeployments = Math.floor(config.tradingDaysPerYear / config.averageHoldingDays) * config.numberOfChunks;
    const actualDeployments = deploymentActions.length;
    const capitalUtilization = (actualDeployments / maxPossibleDeployments) * 100;

    const results = {
      chunks,
      simulationData,
      deploymentActions,
      exitActions,
      summary: {
        initialCapital: config.startingCapital,
        finalCapital: totalCurrentCapital,
        totalProfit,
        roi,
        totalTrades,
        actualWinRate,
        averageHoldingPeriod: Math.round(averageHoldingPeriod),
        capitalUtilization: Math.round(capitalUtilization),
        totalDeployments: deploymentActions.length,
        bestChunk: chunks.reduce((best, chunk) => chunk.totalProfit > best.totalProfit ? chunk : best),
        worstChunk: chunks.reduce((worst, chunk) => chunk.totalProfit < worst.totalProfit ? chunk : worst)
      }
    };

    setSimulationResults(results);
    updateChunkManagement({ 
      config, 
      simulationResults: results,
      lastSimulationDate: new Date().toISOString()
    });
    
    setIsSimulating(false);
  };

  // Reset simulation
  const resetSimulation = () => {
    setSimulationResults(null);
    setSelectedChunk(null);
  };

  // Calculate simple compounding results for comparison
  const calculateSimpleCompounding = () => {
    if (!simulationResults) return null;
    
    const { initialCapital, totalTrades, actualWinRate } = simulationResults.summary;
    const profitTarget = config.profitTarget / 100;
    const averageLoss = config.averageLoss / 100;
    
    // Calculate simple compounding with same parameters
    let simpleCapital = initialCapital;
    let simpleTrades = 0;
    let simpleWins = 0;
    
    // Use same number of trades as chunk simulation
    for (let i = 0; i < totalTrades; i++) {
      const isWin = Math.random() < (actualWinRate / 100);
      simpleTrades++;
      
      // Calculate trade amount (total capital divided by 50)
      const tradeAmount = simpleCapital / 50;
      
      if (isWin) {
        // Add profit to total capital
        const profit = tradeAmount * profitTarget;
        simpleCapital += profit;
        simpleWins++;
      } else {
        // Subtract loss from total capital
        const loss = tradeAmount * averageLoss;
        simpleCapital -= loss;
      }
    }
    
    const simpleProfit = simpleCapital - initialCapital;
    const simpleROI = (simpleProfit / initialCapital) * 100;
    const simpleWinRate = (simpleWins / simpleTrades) * 100;
    
    return {
      initialCapital,
      finalCapital: simpleCapital,
      totalProfit: simpleProfit,
      roi: simpleROI,
      totalTrades: simpleTrades,
      winRate: simpleWinRate
    };
  };

  // Get chunk performance metrics
  const getChunkMetrics = (chunk) => {
    if (!chunk || chunk.totalTrades === 0) return null;
    
    const winRate = (chunk.winningTrades / chunk.totalTrades) * 100;
    const roi = ((chunk.currentCapital - chunk.initialCapital) / chunk.initialCapital) * 100;
    const avgProfitPerTrade = chunk.totalProfit / chunk.totalTrades;
    
    return { winRate, roi, avgProfitPerTrade };
  };

  // Load existing data on mount
  useEffect(() => {
    if (chunkManagement?.config) {
      setConfig(chunkManagement.config);
    }
    if (chunkManagement?.simulationResults) {
      setSimulationResults(chunkManagement.simulationResults);
    }
  }, [chunkManagement]);

  return (
    <div className="space-y-6 text-upstox-primary">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-upstox-primary">Chunk Money Management System</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfiguration(!showConfiguration)}
            className="btn-upstox-secondary"
          >
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </button>
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="btn-upstox-success disabled:bg-upstox-tertiary disabled:text-upstox-secondary"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Simulation</span>
              </>
            )}
          </button>
          {simulationResults && (
            <>
              <button
                onClick={() => setShowDetailedTable(!showDetailedTable)}
                className="btn-upstox-primary"
              >
                <Table className="w-4 h-4" />
                <span>{showDetailedTable ? 'Hide' : 'Show'} Details</span>
              </button>
              <button
                onClick={resetSimulation}
                className="btn-upstox-danger"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfiguration && (
        <div className="card-upstox p-6 border-l-4 border-accent-blue">
          <h3 className="text-lg font-semibold text-upstox-primary mb-4">Simulation Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-upstox-secondary mb-2">
                Starting Capital (₹)
              </label>
              <input
                type="number"
                value={config.startingCapital}
                onChange={(e) => setConfig({...config, startingCapital: Number(e.target.value)})}
                className="input-upstox"
                min="100000"
                step="50000"
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
                Profit Target (%)
              </label>
              <input
                type="number"
                value={config.profitTarget}
                onChange={(e) => setConfig({...config, profitTarget: Number(e.target.value)})}
                className="input-upstox"
                min="1"
                max="20"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-upstox-secondary mb-2">
                Avg Holding Days
              </label>
              <input
                type="number"
                value={config.averageHoldingDays}
                onChange={(e) => setConfig({...config, averageHoldingDays: Number(e.target.value)})}
                className="input-upstox"
                min="30"
                max="180"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-upstox-secondary mb-2">
                Trading Days/Year
              </label>
              <input
                type="number"
                value={config.tradingDaysPerYear}
                onChange={(e) => setConfig({...config, tradingDaysPerYear: Number(e.target.value)})}
                className="input-upstox"
                min="200"
                max="365"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-upstox-secondary mb-2">
                Win Rate (%)
              </label>
              <input
                type="number"
                value={config.winRate}
                onChange={(e) => setConfig({...config, winRate: Number(e.target.value)})}
                className="input-upstox"
                min="30"
                max="95"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-upstox-secondary mb-2">
                Average Loss (%)
              </label>
              <input
                type="number"
                value={config.averageLoss}
                onChange={(e) => setConfig({...config, averageLoss: Number(e.target.value)})}
                className="input-upstox"
                min="1"
                max="10"
                step="0.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* Strategy Overview */}
      <div className="card-upstox p-6">
        <h3 className="text-lg font-semibold text-upstox-primary mb-4">Strategy Overview</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-upstox-primary mb-3">Key Principles</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-positive rounded-full"></div>
                <span className="text-sm text-upstox-secondary">
                  Divide capital into {config.numberOfChunks} independent chunks of ₹{(config.startingCapital / config.numberOfChunks).toLocaleString()} each
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent-blue rounded-full"></div>
                <span className="text-sm text-upstox-secondary">
                  Deploy chunks for ~{config.averageHoldingDays} days average holding period
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-upstox-tertiary rounded-full"></div>
                <span className="text-sm text-upstox-secondary">
                  Target +{config.profitTarget}% profit per completed trade
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-upstox-secondary rounded-full"></div>
                <span className="text-sm text-upstox-secondary">
                  Each chunk compounds independently over time
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-negative rounded-full"></div>
                <span className="text-sm text-upstox-secondary">
                  Chunks redeploy after cooling period (5-10 days)
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-upstox-primary mb-3">Current Configuration</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Starting Capital:</span>
                <span className="text-sm font-medium text-upstox-primary">₹{config.startingCapital.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Per Chunk:</span>
                <span className="text-sm font-medium text-upstox-primary">₹{(config.startingCapital / config.numberOfChunks).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Number of Chunks:</span>
                <span className="text-sm font-medium text-upstox-primary">{config.numberOfChunks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Profit Target:</span>
                <span className="text-sm font-medium text-upstox-primary">{config.profitTarget}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Expected Win Rate:</span>
                <span className="text-sm font-medium text-upstox-primary">{config.winRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Average Loss:</span>
                <span className="text-sm font-medium text-upstox-primary">{config.averageLoss}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      {simulationResults && (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-upstox p-6">
              <div className="flex items-center">
                <div className="p-2 bg-upstox-tertiary rounded-lg">
                  <DollarSign className="w-6 h-6 text-positive" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-upstox-secondary">Final Capital</p>
                  <p className="text-2xl font-bold text-upstox-primary">
                    ₹{simulationResults.summary.finalCapital.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-upstox p-6">
              <div className="flex items-center">
                <div className="p-2 bg-upstox-tertiary rounded-lg">
                  <TrendingUp className="w-6 h-6 text-accent-blue" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-upstox-secondary">Total Profit</p>
                  <p className="text-2xl font-bold text-upstox-primary">
                    ₹{simulationResults.summary.totalProfit.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-upstox p-6">
              <div className="flex items-center">
                <div className="p-2 bg-upstox-tertiary rounded-lg">
                  <Percent className="w-6 h-6 text-positive" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-upstox-secondary">ROI</p>
                  <p className="text-2xl font-bold text-upstox-primary">
                    {simulationResults.summary.roi.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="card-upstox p-6">
              <div className="flex items-center">
                <div className="p-2 bg-upstox-tertiary rounded-lg">
                  <Target className="w-6 h-6 text-accent-blue" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-upstox-secondary">Win Rate</p>
                  <p className="text-2xl font-bold text-upstox-primary">
                    {simulationResults.summary.actualWinRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison: Simple vs Chunk Compounding */}
          <div className="card-upstox p-6">
            <h3 className="text-lg font-semibold text-upstox-primary mb-6">Comparison: Simple vs Chunk Compounding</h3>
            
            {(() => {
              const simpleResults = calculateSimpleCompounding();
              if (!simpleResults) return null;
              
              const chunkResults = simulationResults.summary;
              const profitDifference = chunkResults.totalProfit - simpleResults.totalProfit;
              const roiDifference = chunkResults.roi - simpleResults.roi;
              
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Simple Compounding */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Simple Compounding</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Final Capital:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          ₹{simpleResults.finalCapital.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Total Profit:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          ₹{simpleResults.totalProfit.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">ROI:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {simpleResults.roi.toFixed(2)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Total Trades:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {simpleResults.totalTrades}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Win Rate:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {simpleResults.winRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chunk Compounding */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Chunk Compounding</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Final Capital:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          ₹{chunkResults.finalCapital.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Total Profit:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          ₹{chunkResults.totalProfit.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">ROI:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {chunkResults.roi.toFixed(2)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Total Trades:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {chunkResults.totalTrades}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Win Rate:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {chunkResults.actualWinRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>



          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-upstox p-6">
              <div className="flex items-center">
                <div className="p-2 bg-upstox-tertiary rounded-lg">
                  <RefreshCw className="w-6 h-6 text-accent-blue" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-upstox-secondary">Total Deployments</p>
                  <p className="text-2xl font-bold text-upstox-primary">
                    {simulationResults.summary.totalDeployments}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-upstox p-6">
              <div className="flex items-center">
                <div className="p-2 bg-upstox-tertiary rounded-lg">
                  <Settings className="w-6 h-6 text-accent-blue" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-upstox-secondary">Avg Holding Period</p>
                  <p className="text-2xl font-bold text-upstox-primary">
                    {simulationResults.summary.averageHoldingPeriod} days
                  </p>
                </div>
              </div>
            </div>

            <div className="card-upstox p-6">
              <div className="flex items-center">
                <div className="p-2 bg-upstox-tertiary rounded-lg">
                  <TrendingUp className="w-6 h-6 text-positive" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-upstox-secondary">Capital Utilization</p>
                  <p className="text-2xl font-bold text-upstox-primary">
                    {simulationResults.summary.capitalUtilization}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Best and Worst Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-upstox p-6 border-l-4 border-positive">
              <h3 className="text-lg font-semibold text-upstox-primary mb-4">Best Performing Chunk</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-upstox-secondary">Chunk ID:</span>
                  <span className="text-sm font-medium text-upstox-primary">#{simulationResults.summary.bestChunk.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-upstox-secondary">Final Capital:</span>
                  <span className="text-sm font-medium text-positive">
                    ₹{simulationResults.summary.bestChunk.currentCapital.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-upstox-secondary">Total Profit:</span>
                  <span className="text-sm font-medium text-positive">
                    ₹{simulationResults.summary.bestChunk.totalProfit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-upstox-secondary">Win Rate:</span>
                  <span className="text-sm font-medium text-upstox-primary">
                    {((simulationResults.summary.bestChunk.winningTrades / simulationResults.summary.bestChunk.totalTrades) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="card-upstox p-6 border-l-4 border-negative">
              <h3 className="text-lg font-semibold text-upstox-primary mb-4">Worst Performing Chunk</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-upstox-secondary">Chunk ID:</span>
                  <span className="text-sm font-medium text-upstox-primary">#{simulationResults.summary.worstChunk.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-upstox-secondary">Final Capital:</span>
                  <span className="text-sm font-medium text-negative">
                    ₹{simulationResults.summary.worstChunk.currentCapital.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-upstox-secondary">Total Profit:</span>
                  <span className="text-sm font-medium text-negative">
                    ₹{simulationResults.summary.worstChunk.totalProfit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-upstox-secondary">Win Rate:</span>
                  <span className="text-sm font-medium text-upstox-primary">
                    {((simulationResults.summary.worstChunk.winningTrades / simulationResults.summary.worstChunk.totalTrades) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chunks Performance Grid */}
          <div className="card-upstox p-6">
            <h3 className="text-lg font-semibold text-upstox-primary mb-4">Chunks Performance Overview</h3>
            
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-4">
              {simulationResults.chunks.map((chunk) => {
                const metrics = getChunkMetrics(chunk);
                const isSelected = selectedChunk?.id === chunk.id;
                const isProfit = chunk.totalProfit > 0;
                
                return (
                  <button
                    key={chunk.id}
                    onClick={() => setSelectedChunk(isSelected ? null : chunk)}
                    className={`p-2 text-xs font-medium rounded border-2 transition-colors ${
                      isSelected
                        ? 'border-accent-blue bg-upstox-tertiary'
                        : isProfit
                        ? 'border-positive bg-upstox-tertiary hover:border-positive'
                        : 'border-negative bg-upstox-tertiary hover:border-negative'
                    }`}
                  >
                    <div className={`font-bold ${isProfit ? 'text-positive' : 'text-negative'}`}>
                      #{chunk.id}
                    </div>
                    <div className={`${isProfit ? 'text-positive' : 'text-negative'}`}>
                      {metrics?.roi.toFixed(1)}%
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedChunk && (
              <div className="border-t border-upstox-tertiary pt-4">
                <h4 className="font-medium text-upstox-primary mb-3">Chunk #{selectedChunk.id} Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-upstox-secondary">Performance</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-upstox-secondary">Initial:</span>
                        <span className="text-xs font-medium text-upstox-primary">₹{selectedChunk.initialCapital.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-upstox-secondary">Current:</span>
                        <span className="text-xs font-medium text-upstox-primary">₹{selectedChunk.currentCapital.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-upstox-secondary">Profit:</span>
                        <span className={`text-xs font-medium ${selectedChunk.totalProfit >= 0 ? 'text-positive' : 'text-negative'}`}>
                          ₹{selectedChunk.totalProfit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-upstox-secondary">Trading Stats</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-upstox-secondary">Total Trades:</span>
                        <span className="text-xs font-medium text-upstox-primary">{selectedChunk.totalTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-upstox-secondary">Wins:</span>
                        <span className="text-xs font-medium text-positive">{selectedChunk.winningTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-upstox-secondary">Losses:</span>
                        <span className="text-xs font-medium text-negative">{selectedChunk.losingTrades}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-upstox-secondary">Metrics</div>
                    <div className="space-y-1">
                      {(() => {
                        const metrics = getChunkMetrics(selectedChunk);
                        return metrics ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-xs text-upstox-secondary">Win Rate:</span>
                              <span className="text-xs font-medium text-upstox-primary">{metrics.winRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-upstox-secondary">ROI:</span>
                              <span className={`text-xs font-medium ${metrics.roi >= 0 ? 'text-positive' : 'text-negative'}`}>
                                {metrics.roi.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-upstox-secondary">Avg P/L:</span>
                              <span className={`text-xs font-medium ${metrics.avgProfitPerTrade >= 0 ? 'text-positive' : 'text-negative'}`}>
                                ₹{metrics.avgProfitPerTrade.toLocaleString()}
                              </span>
                            </div>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Simulation Table */}
          {showDetailedTable && (
            <ChunkSimulationTable 
              simulationData={simulationResults.simulationData}
              chunks={simulationResults.chunks}
              config={config}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ChunkMoneyManagement;
