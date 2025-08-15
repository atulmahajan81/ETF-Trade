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
  Table,
  Users,
  BarChart3,
  Cpu,
  Database,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useETFTrading } from '../context/ETFTradingContext';

const RealChunkManager = () => {
  const { 
    chunkManagement, 
    updateChunkManagement, 
    initializeChunksWithReconciliation,
    holdings,
    soldItems,
    userSetup
  } = useETFTrading();
  
  // Configuration state
  const [config, setConfig] = useState({
    startingCapital: userSetup?.initialCapital || 100000,
    numberOfChunks: 50,
    profitTarget: 6,
    averageHoldingDays: 90,
    tradingDaysPerYear: 250,
    winRate: 75,
    averageLoss: 3,
    ...chunkManagement?.config
  });

  // UI state
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [showBacktrackingPreview, setShowBacktrackingPreview] = useState(false);

  // Helper function to get color from palette based on compound level
  const getColorFromPalette = (compoundLevel, type = 'border') => {
    // Determine the range and position within that range
    const range = Math.floor(compoundLevel / 10);
    const position = compoundLevel % 10;
    
    // Define color palettes for each range (lighter to darker)
    // Each range uses the same color family with increasing intensity
    // Updated for better visibility in dark theme
    const colorPalettes = {
      0: ['slate-400', 'slate-500', 'slate-600', 'slate-700', 'slate-800', 'slate-900', 'slate-950'], // S0-9: Slate shades (more visible than gray)
      1: ['blue-400', 'blue-500', 'blue-600', 'blue-700', 'blue-800', 'blue-900', 'blue-950'], // S10-19: Blue shades
      2: ['green-400', 'green-500', 'green-600', 'green-700', 'green-800', 'green-900', 'green-950'], // S20-29: Green shades
      3: ['yellow-400', 'yellow-500', 'yellow-600', 'yellow-700', 'yellow-800', 'yellow-900', 'yellow-950'], // S30-39: Yellow shades
      4: ['purple-400', 'purple-500', 'purple-600', 'purple-700', 'purple-800', 'purple-900', 'purple-950'], // S40-49: Purple shades
      5: ['red-400', 'red-500', 'red-600', 'red-700', 'red-800', 'red-900', 'red-950'], // S50-59: Red shades
      6: ['indigo-400', 'indigo-500', 'indigo-600', 'indigo-700', 'indigo-800', 'indigo-900', 'indigo-950'], // S60-69: Indigo shades
      7: ['pink-400', 'pink-500', 'pink-600', 'pink-700', 'pink-800', 'pink-900', 'pink-950'], // S70-79: Pink shades
      8: ['cyan-400', 'cyan-500', 'cyan-600', 'cyan-700', 'cyan-800', 'cyan-900', 'cyan-950'], // S80-89: Cyan shades
      9: ['orange-400', 'orange-500', 'orange-600', 'orange-700', 'orange-800', 'orange-900', 'orange-950'], // S90-99: Orange shades
      10: ['emerald-400', 'emerald-500', 'emerald-600', 'emerald-700', 'emerald-800', 'emerald-900', 'emerald-950'], // S100-109: Emerald shades
    };
    
    // Get the appropriate color palette
    const palette = colorPalettes[range] || colorPalettes[10]; // Default to emerald for very high stages
    const colorIndex = Math.min(position, palette.length - 1);
    const color = palette[colorIndex];
    
    if (type === 'border') {
      return `border-${color} bg-upstox-tertiary hover:border-${color.replace(/\d+$/, (match) => {
        const num = parseInt(match);
        return Math.max(num - 100, 100).toString();
      })}`;
    } else if (type === 'background') {
      return `bg-${color} text-white`;
    }
    
    return color;
  };

  // Get border color based on compound level using single color palette with shades
  const getChunkBorderColor = (compoundLevel) => {
    return getColorFromPalette(compoundLevel, 'border');
  };

  // Auto-initialize chunks if they don't exist
  useEffect(() => {
    if (!chunkManagement.chunks || chunkManagement.chunks.length === 0) {
      console.log('🔧 Auto-initializing chunks...');
      initializeChunksWithReconciliation({ ...config, reconcileExisting: false });
    }
  }, [chunkManagement.chunks, config.startingCapital, initializeChunksWithReconciliation]);

  // Calculate chunk statistics
  const calculateChunkStats = () => {
    if (!chunkManagement.chunks || !chunkManagement.chunks.length) {
      return {
        totalAvailableCapital: 0,
        totalDeployed: 0,
        currentHoldingsValue: 0,
        totalProfit: 0,
        unrealizedPnL: 0,
        totalPnL: 0,
        totalTrades: 0,
        totalHoldings: 0
      };
    }

    const stats = chunkManagement.chunks.reduce((acc, chunk) => {
      acc.totalAvailableCapital += chunk.currentCapital || 0;
      acc.totalDeployed += chunk.deployedCapital || 0;
      acc.totalProfit += chunk.totalProfit || 0;
      acc.totalTrades += chunk.totalTrades || 0;
      acc.totalHoldings += chunk.holdings ? chunk.holdings.length : 0;
      
      // Calculate current holdings value
      if (chunk.holdings) {
        chunk.holdings.forEach(holding => {
          const currentValue = (holding.currentPrice || holding.avgPrice || holding.buyPrice || 0) * (holding.quantity || 0);
          const investedValue = (holding.avgPrice || holding.buyPrice || 0) * (holding.quantity || 0);
          acc.currentHoldingsValue += currentValue;
          acc.unrealizedPnL += (currentValue - investedValue);
        });
      }
      
      return acc;
    }, {
      totalAvailableCapital: 0,
      totalDeployed: 0,
      currentHoldingsValue: 0,
      totalProfit: 0,
      unrealizedPnL: 0,
      totalPnL: 0,
      totalTrades: 0,
      totalHoldings: 0
    });

    stats.totalPnL = stats.totalProfit + stats.unrealizedPnL;
    return stats;
  };

  // Calculate backtracking preview
  const calculateBacktrackingPreview = () => {
    if (!holdings.length && !soldItems.length) {
      return null;
    }

    const baseChunkSize = config.startingCapital / config.numberOfChunks;
    const compoundChunkMap = new Map();
    
    // Analyze holdings
    holdings.forEach((holding) => {
      const investmentAmount = (holding.avgPrice || holding.buyPrice || 0) * (holding.quantity || 0);
      
      // Calculate compound level based on 6% progression
      let compoundLevel = 0;
      let currentAmount = baseChunkSize;
      
      while (currentAmount < investmentAmount && compoundLevel < 20) {
        currentAmount = currentAmount * 1.06;
        compoundLevel++;
      }
      
      let assignedChunkNumber = 1;
      let compoundChunkId;
      
      if (investmentAmount > baseChunkSize * 10) {
        compoundChunkId = `MultiChunk${assignedChunkNumber}`;
      } else if (compoundLevel === 0) {
        compoundChunkId = `PartialChunk${assignedChunkNumber}`;
      } else {
        while (compoundChunkMap.has(`Compound${compoundLevel}Chunk${assignedChunkNumber}`)) {
          assignedChunkNumber++;
        }
        compoundChunkId = `Compound${compoundLevel}Chunk${assignedChunkNumber}`;
      }
      
      compoundChunkMap.set(compoundChunkId, {
        compoundLevel,
        chunkNumber: assignedChunkNumber,
        symbol: holding.symbol,
        investmentAmount,
        type: 'holding'
      });
    });

    // Analyze sold items
    soldItems.forEach((item) => {
      const investmentAmount = (item.buyPrice || 0) * (item.quantity || 0);
      
      let compoundLevel = 0;
      let currentAmount = baseChunkSize;
      
      while (currentAmount < investmentAmount && compoundLevel < 20) {
        currentAmount = currentAmount * 1.06;
        compoundLevel++;
      }
      
      let assignedChunkNumber = 1;
      let compoundChunkId;
      
      if (investmentAmount > baseChunkSize * 10) {
        compoundChunkId = `MultiChunk${assignedChunkNumber}`;
      } else if (compoundLevel === 0) {
        compoundChunkId = `PartialChunk${assignedChunkNumber}`;
      } else {
        while (compoundChunkMap.has(`Compound${compoundLevel}Chunk${assignedChunkNumber}`)) {
          assignedChunkNumber++;
        }
        compoundChunkId = `Compound${compoundLevel}Chunk${assignedChunkNumber}`;
      }
      
      compoundChunkMap.set(compoundChunkId, {
        compoundLevel,
        chunkNumber: assignedChunkNumber,
        symbol: item.symbol,
        investmentAmount,
        profit: item.profit || 0,
        type: 'sold'
      });
    });

    return {
      totalChunks: compoundChunkMap.size,
      holdingsCount: holdings.length,
      soldItemsCount: soldItems.length,
      totalInvestment: Array.from(compoundChunkMap.values()).reduce((sum, chunk) => sum + chunk.investmentAmount, 0),
      totalProfit: Array.from(compoundChunkMap.values()).reduce((sum, chunk) => sum + (chunk.profit || 0), 0),
      chunks: Array.from(compoundChunkMap.entries()).map(([id, data]) => ({ id, ...data }))
    };
  };

  // Handle initialization with reconciliation
  const handleInitializeWithReconciliation = () => {
    initializeChunksWithReconciliation(config);
  };

  // Handle sync with holdings
  const handleSyncWithHoldings = () => {
    console.log('🔄 Syncing chunks with holdings...');
    
    if (holdings.length === 0) {
      console.log('No holdings to sync with');
      return;
    }

    // Reinitialize chunks with reconciliation to properly analyze all holdings
    console.log('🔧 Reinitializing chunks with reconciliation...');
    initializeChunksWithReconciliation(config);
    
    // Log expected chunk stages for verification
    const baseChunkSize = config.startingCapital / config.numberOfChunks;
    console.log(`📊 Base chunk size: ₹${baseChunkSize.toLocaleString()}`);
    
    holdings.forEach((holding) => {
      const investmentAmount = (holding.avgPrice || holding.buyPrice || 0) * (holding.quantity || 0);
      
      // Calculate compound level based on 6% progression
      let compoundLevel = 0;
      let currentAmount = baseChunkSize;
      
      while (currentAmount < investmentAmount && compoundLevel < 20) {
        currentAmount = currentAmount * 1.06;
        compoundLevel++;
      }
      
      console.log(`📊 ${holding.symbol}: ₹${investmentAmount.toLocaleString()} → Expected Stage S${compoundLevel}`);
    });
    
    console.log('✅ Sync completed - chunks will be recreated with proper compound levels');
  };

  // Handle activation
  const handleActivate = () => {
    if (holdings.length > 0 || soldItems.length > 0) {
      handleInitializeWithReconciliation();
    } else {
      // Initialize chunks even for empty portfolio
      initializeChunksWithReconciliation({ ...config, reconcileExisting: false });
      updateChunkManagement({ isActive: true });
    }
  };

  // Load demo data
  const loadDemoData = () => {
    const demoHoldings = [
      {
        id: 'demo1',
        symbol: 'NSE:ALPHA',
        name: 'Alpha ETF',
        quantity: 300,
        buyPrice: 50.30,
        avgPrice: 50.30,
        currentPrice: 52.50,
        buyDate: '2024-01-15'
      },
      {
        id: 'demo2',
        symbol: 'NSE:NIFTY',
        name: 'Nifty ETF',
        quantity: 200,
        buyPrice: 45.20,
        avgPrice: 45.20,
        currentPrice: 47.80,
        buyDate: '2024-02-10'
      }
    ];

    const demoSoldItems = [
      {
        id: 'sold1',
        symbol: 'NSE:BANKNIFTY',
        name: 'Bank Nifty ETF',
        quantity: 150,
        buyPrice: 42.10,
        sellPrice: 44.80,
        profit: 405,
        buyDate: '2024-01-05',
        sellDate: '2024-03-15'
      }
    ];

    // This would need to be implemented in the context
    console.log('Demo data loaded:', { demoHoldings, demoSoldItems });
  };

  const stats = calculateChunkStats();
  const backtrackingPreview = calculateBacktrackingPreview();

  // Debug logging
  console.log('🔍 RealChunkManager Debug:', {
    chunkManagement,
    chunksCount: chunkManagement?.chunks?.length || 0,
    isActive: chunkManagement?.isActive,
    holdingsCount: holdings.length,
    soldItemsCount: soldItems.length
  });

  return (
    <div className="space-y-6 text-upstox-primary">
             {/* Header */}
       <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-upstox-primary">Real Chunk Trading System</h2>
         <div className="flex items-center space-x-2">
           <button
             onClick={() => setShowConfiguration(!showConfiguration)}
             className="btn-upstox-secondary"
           >
             <Settings className="w-4 h-4" />
             <span>Configure</span>
           </button>
           
                       {/* Sync with Holdings Button */}
            {holdings.length > 0 && (
              <button
                onClick={handleSyncWithHoldings}
                className="btn-upstox-primary"
                title="Sync chunks with current holdings to update compound stages"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sync with Holdings</span>
              </button>
            )}
           
           {!chunkManagement.isActive && (
             <button
               onClick={handleActivate}
               className="btn-upstox-success"
             >
               <Play className="w-4 h-4" />
               <span>Activate System</span>
             </button>
           )}
           {chunkManagement.isActive && (
             <button
               onClick={() => updateChunkManagement({ isActive: false })}
               className="btn-upstox-danger"
             >
               <XCircle className="w-4 h-4" />
               <span>Deactivate</span>
             </button>
           )}
         </div>
       </div>

      {/* System Status */}
      <div className="card-upstox p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-upstox-primary">System Status</h3>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            chunkManagement.isActive 
              ? 'bg-positive/20 text-positive' 
              : 'bg-upstox-secondary/20 text-upstox-secondary'
          }`}>
            {chunkManagement.isActive ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Active</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Inactive</span>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-upstox-tertiary rounded-lg">
              <DollarSign className="w-5 h-5 text-positive" />
            </div>
            <div>
              <p className="text-sm text-upstox-secondary">Available Capital</p>
              <p className="text-lg font-bold text-upstox-primary">₹{stats.totalAvailableCapital.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-upstox-tertiary rounded-lg">
              <BarChart3 className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <p className="text-sm text-upstox-secondary">Deployed Amount</p>
              <p className="text-lg font-bold text-upstox-primary">₹{stats.totalDeployed.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-upstox-tertiary rounded-lg">
              <TrendingUp className="w-5 h-5 text-positive" />
            </div>
            <div>
              <p className="text-sm text-upstox-secondary">Total P&L</p>
              <p className={`text-lg font-bold ${stats.totalPnL >= 0 ? 'text-positive' : 'text-negative'}`}>
                ₹{stats.totalPnL.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-upstox-tertiary rounded-lg">
              <Cpu className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <p className="text-sm text-upstox-secondary">Active Chunks</p>
              <p className="text-lg font-bold text-upstox-primary">
                {chunkManagement.chunks ? chunkManagement.chunks.filter(c => c.holdings && c.holdings.length > 0).length : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Analysis */}
      {backtrackingPreview && (
        <div className="card-upstox p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-upstox-primary">Portfolio Backtracking Analysis</h3>
            <button
              onClick={() => setShowBacktrackingPreview(!showBacktrackingPreview)}
              className="btn-upstox-secondary"
            >
              <FileText className="w-4 h-4" />
              <span>{showBacktrackingPreview ? 'Hide' : 'Show'} Details</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-upstox-primary">{backtrackingPreview.totalChunks}</p>
              <p className="text-sm text-upstox-secondary">Compound Chunks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-upstox-primary">{backtrackingPreview.holdingsCount}</p>
              <p className="text-sm text-upstox-secondary">Current Holdings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-upstox-primary">{backtrackingPreview.soldItemsCount}</p>
              <p className="text-sm text-upstox-secondary">Sold Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-positive">₹{backtrackingPreview.totalProfit.toLocaleString()}</p>
              <p className="text-sm text-upstox-secondary">Total Profit</p>
            </div>
          </div>

          {showBacktrackingPreview && (
            <div className="border-t border-upstox-tertiary pt-4">
              <h4 className="font-medium text-upstox-primary mb-3">Compound Chunks Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {backtrackingPreview.chunks.map((chunk) => (
                  <div key={chunk.id} className="p-3 bg-upstox-tertiary rounded-lg">
                    <div className="text-center">
                      <div className={`text-xs font-bold px-2 py-1 rounded mb-1 ${
                        chunk.compoundLevel >= 8 ? 'bg-negative/20 text-negative' :
                        chunk.compoundLevel >= 6 ? 'bg-upstox-secondary/20 text-upstox-secondary' :
                        chunk.compoundLevel >= 4 ? 'bg-accent-blue/20 text-accent-blue' :
                        'bg-positive/20 text-positive'
                      }`}>
                        S{chunk.compoundLevel}
                      </div>
                      <div className="text-xs font-medium text-upstox-primary mb-1">
                        {chunk.symbol?.split(':')[1] || chunk.symbol}
                      </div>
                      <div className="text-xs text-upstox-secondary">
                        ₹{(chunk.investmentAmount / 1000).toFixed(0)}k
                      </div>
                      {chunk.profit && (
                        <div className={`text-xs font-medium ${chunk.profit >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {chunk.profit >= 0 ? '+' : ''}₹{chunk.profit.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration Panel */}
      {showConfiguration && (
        <div className="card-upstox p-6 border-l-4 border-accent-blue">
          <h3 className="text-lg font-semibold text-upstox-primary mb-4">System Configuration</h3>
          
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
                min="10000"
                step="1000"
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
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleInitializeWithReconciliation}
              className="btn-upstox-primary"
            >
              <Database className="w-4 h-4" />
              <span>Initialize with Reconciliation</span>
            </button>
            
            <button
              onClick={() => initializeChunksWithReconciliation({ ...config, reconcileExisting: false })}
              className="btn-upstox-secondary"
            >
              <Cpu className="w-4 h-4" />
              <span>Initialize Empty Chunks</span>
            </button>
            
            {holdings.length > 0 && (
              <button
                onClick={handleSyncWithHoldings}
                className="btn-upstox-primary"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sync with Holdings</span>
              </button>
            )}
            
            <button
              onClick={loadDemoData}
              className="btn-upstox-secondary"
            >
              <Users className="w-4 h-4" />
              <span>Load Demo Portfolio</span>
            </button>
          </div>
        </div>
      )}

      {/* Chunks Overview */}
      {chunkManagement.chunks && chunkManagement.chunks.length > 0 ? (
        <div className="card-upstox p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-upstox-primary">Chunks Overview</h3>
            <div className="flex items-center space-x-4 text-xs">
              <span className="text-upstox-secondary">Compound Stages:</span>
                             <div className="flex items-center space-x-2">
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-slate-400 rounded"></div>
                   <span className="text-upstox-secondary">S0-9</span>
                 </div>
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-blue-400 rounded"></div>
                   <span className="text-upstox-secondary">S10-19</span>
                 </div>
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-green-400 rounded"></div>
                   <span className="text-upstox-secondary">S20-29</span>
                 </div>
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                   <span className="text-upstox-secondary">S30-39</span>
                 </div>
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-purple-400 rounded"></div>
                   <span className="text-upstox-secondary">S40-49</span>
                 </div>
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-red-400 rounded"></div>
                   <span className="text-upstox-secondary">S50-59</span>
                 </div>
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-indigo-400 rounded"></div>
                   <span className="text-upstox-secondary">S60-69</span>
                 </div>
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-pink-400 rounded"></div>
                   <span className="text-upstox-secondary">S70-79</span>
                 </div>
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-cyan-400 rounded"></div>
                   <span className="text-upstox-secondary">S80-89</span>
                 </div>
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-orange-400 rounded"></div>
                   <span className="text-upstox-secondary">S90-99</span>
                 </div>
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-emerald-400 rounded"></div>
                   <span className="text-upstox-secondary">S100+</span>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {chunkManagement.chunks.map((chunk) => {
              const isSelected = selectedChunk?.id === chunk.id;
              const hasHoldings = chunk.holdings && chunk.holdings.length > 0;
              const compoundLevel = chunk.compoundLevel || 0;
              
              // Get symbol from holdings using the holdings array IDs to find actual holding objects
              let symbol = null;
              if (hasHoldings && chunk.holdings.length > 0) {
                const holdingId = chunk.holdings[0];
                const actualHolding = holdings.find(h => h.id === holdingId);
                if (actualHolding && actualHolding.symbol) {
                  symbol = actualHolding.symbol.includes(':') ? 
                    actualHolding.symbol.split(':')[1] : 
                    actualHolding.symbol;
                }
              }
              
              const deployedAmount = chunk.deployedCapital || 0;
              const totalValue = hasHoldings ? 
                chunk.holdings.reduce((sum, holdingId) => {
                  const holding = holdings.find(h => h.id === holdingId);
                  if (holding) {
                    return sum + ((holding.currentPrice || holding.avgPrice || holding.buyPrice || 0) * (holding.quantity || 0));
                  }
                  return sum;
                }, 0) : 
                deployedAmount;
              
              return (
                <button
                  key={chunk.id}
                  onClick={() => setSelectedChunk(isSelected ? null : chunk)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-upstox-tertiary'
                      : hasHoldings
                      ? getChunkBorderColor(compoundLevel)
                      : 'border-gray-600 bg-upstox-tertiary hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-xs font-bold px-2 py-1 rounded mb-1 ${
                                             getColorFromPalette(compoundLevel, 'background')
                    }`}>
                      S{compoundLevel}
                    </div>
                    <div className="text-xs font-medium text-upstox-primary mb-1">
                      {symbol || `Chunk${chunk.id}`}
                    </div>
                    <div className="text-xs text-upstox-secondary">
                      ₹{(deployedAmount / 1000).toFixed(0)}k
                    </div>
                    <div className="text-xs text-upstox-secondary">
                      Total: ₹{(totalValue / 1000).toFixed(0)}k
                    </div>
                    {chunk.totalProfit !== 0 && (
                      <div className={`text-xs font-medium ${chunk.totalProfit >= 0 ? 'text-positive' : 'text-negative'}`}>
                        R: {chunk.totalProfit >= 0 ? '+' : ''}₹{(chunk.totalProfit / 1000).toFixed(1)}k
                      </div>
                    )}
                    <div className="text-xs text-upstox-secondary">
                      {chunk.totalTrades || 0}T • {chunk.holdings ? chunk.holdings.length : 0}H
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedChunk && (
            <div className="border-t border-upstox-tertiary pt-4 mt-4">
              <h4 className="font-medium text-upstox-primary mb-3">Chunk #{selectedChunk.id} Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-upstox-secondary mb-2">Performance</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-upstox-secondary">Initial:</span>
                      <span className="text-xs font-medium text-upstox-primary">₹{(config.startingCapital / config.numberOfChunks).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-upstox-secondary">Current:</span>
                      <span className="text-xs font-medium text-upstox-primary">₹{(selectedChunk.currentCapital || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-upstox-secondary">Deployed:</span>
                      <span className="text-xs font-medium text-upstox-primary">₹{(selectedChunk.deployedCapital || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-upstox-secondary">Profit:</span>
                      <span className={`text-xs font-medium ${(selectedChunk.totalProfit || 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                        ₹{(selectedChunk.totalProfit || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-upstox-secondary mb-2">Trading Stats</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-upstox-secondary">Total Trades:</span>
                      <span className="text-xs font-medium text-upstox-primary">{selectedChunk.totalTrades || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-upstox-secondary">Wins:</span>
                      <span className="text-xs font-medium text-positive">{selectedChunk.winningTrades || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-upstox-secondary">Losses:</span>
                      <span className="text-xs font-medium text-negative">{selectedChunk.losingTrades || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-upstox-secondary">Holdings:</span>
                      <span className="text-xs font-medium text-upstox-primary">{selectedChunk.holdings ? selectedChunk.holdings.length : 0}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-upstox-secondary mb-2">Holdings</div>
                  <div className="space-y-1">
                    {selectedChunk.holdings && selectedChunk.holdings.length > 0 ? (
                      selectedChunk.holdings.map((holding, index) => (
                        <div key={index} className="text-xs">
                          <div className="font-medium text-upstox-primary">{holding.symbol?.split(':')[1] || holding.symbol}</div>
                          <div className="text-upstox-secondary">
                            {holding.quantity} × ₹{(holding.avgPrice || holding.buyPrice || 0).toFixed(2)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-upstox-secondary">No holdings</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card-upstox p-6">
          <h3 className="text-lg font-semibold text-upstox-primary mb-4">Chunks Overview</h3>
          <div className="text-center py-8">
            <div className="text-upstox-secondary mb-4">
              <Cpu className="w-12 h-12 mx-auto mb-3" />
              <p className="text-lg font-medium">No Chunks Available</p>
              <p className="text-sm">Click "Activate System" to initialize the chunk management system</p>
            </div>
            <button
              onClick={handleActivate}
              className="btn-upstox-primary"
            >
              <Play className="w-4 h-4" />
              <span>Activate System</span>
            </button>
          </div>
        </div>
      )}

      {/* Capital Overview */}
      <div className="card-upstox p-6">
        <h3 className="text-lg font-semibold text-upstox-primary mb-4">Capital Overview</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-upstox-primary mb-3">Capital Breakdown</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Initial Capital:</span>
                <span className="text-sm font-medium text-upstox-primary">₹{config.startingCapital.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Available Cash:</span>
                <span className="text-sm font-medium text-upstox-primary">₹{stats.totalAvailableCapital.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Currently Invested:</span>
                <span className="text-sm font-medium text-upstox-primary">₹{stats.totalDeployed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Holdings Value:</span>
                <span className="text-sm font-medium text-upstox-primary">₹{stats.currentHoldingsValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Booked Profit:</span>
                <span className="text-sm font-medium text-positive">₹{stats.totalProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Total P&L:</span>
                <span className={`text-sm font-medium ${stats.totalPnL >= 0 ? 'text-positive' : 'text-negative'}`}>
                  ₹{stats.totalPnL.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-upstox-primary mb-3">Formula</h4>
            <div className="text-sm text-upstox-secondary space-y-2">
              <div>Total Available Capital = Initial Capital + Booked Profit - Currently Invested Amount</div>
              <div>Total P&L = Realized Profit + Unrealized P&L</div>
              <div>Capital Utilization = (Deployed Amount / Total Capital) × 100</div>
            </div>
            
            <div className="mt-4 p-3 bg-upstox-tertiary rounded-lg">
              <div className="text-sm text-upstox-secondary mb-2">Quick Stats</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-upstox-secondary">Trades:</span>
                  <span className="text-upstox-primary ml-1">{stats.totalTrades}</span>
                </div>
                <div>
                  <span className="text-upstox-secondary">Holdings:</span>
                  <span className="text-upstox-primary ml-1">{stats.totalHoldings}</span>
                </div>
                <div>
                  <span className="text-upstox-secondary">Utilization:</span>
                  <span className="text-upstox-primary ml-1">
                    {config.startingCapital > 0 ? ((stats.totalDeployed / config.startingCapital) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div>
                  <span className="text-upstox-secondary">ROI:</span>
                  <span className={`ml-1 ${stats.totalPnL >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {config.startingCapital > 0 ? ((stats.totalPnL / config.startingCapital) * 100).toFixed(2) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealChunkManager;
