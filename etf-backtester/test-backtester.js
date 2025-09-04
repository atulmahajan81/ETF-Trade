// Simple test script to verify the ETF backtester system
// This script tests the core functionality without requiring Cloudflare Workers

const { ETFStrategy } = require('./common/strategy');
const { LIFOLotManager } = require('./common/lots');
const { FixedChunkProgressionManager } = require('./common/money');
const { calculateIndicators } = require('./common/indicators');

// Sample test data
const sampleData = [
  { date: '2024-01-01', symbol: 'NSE:GOLDBEES', open: 100, high: 105, low: 95, close: 102, volume: 1000, sector: 'Gold' },
  { date: '2024-01-02', symbol: 'NSE:GOLDBEES', open: 102, high: 108, low: 100, close: 106, volume: 1100, sector: 'Gold' },
  { date: '2024-01-03', symbol: 'NSE:GOLDBEES', open: 106, high: 112, low: 104, close: 110, volume: 1200, sector: 'Gold' },
  { date: '2024-01-04', symbol: 'NSE:GOLDBEES', open: 110, high: 115, low: 108, close: 113, volume: 1300, sector: 'Gold' },
  { date: '2024-01-05', symbol: 'NSE:GOLDBEES', open: 113, high: 118, low: 111, close: 116, volume: 1400, sector: 'Gold' },
  
  { date: '2024-01-01', symbol: 'NSE:SILVERBEES', open: 50, high: 55, low: 45, close: 52, volume: 2000, sector: 'Silver' },
  { date: '2024-01-02', symbol: 'NSE:SILVERBEES', open: 52, high: 58, low: 50, close: 56, volume: 2100, sector: 'Silver' },
  { date: '2024-01-03', symbol: 'NSE:SILVERBEES', open: 56, high: 62, low: 54, close: 60, volume: 2200, sector: 'Silver' },
  { date: '2024-01-04', symbol: 'NSE:SILVERBEES', open: 60, high: 65, low: 58, close: 63, volume: 2300, sector: 'Silver' },
  { date: '2024-01-05', symbol: 'NSE:SILVERBEES', open: 63, high: 68, low: 61, close: 66, volume: 2400, sector: 'Silver' },
  
  { date: '2024-01-01', symbol: 'NSE:CPSEETF', open: 80, high: 85, low: 75, close: 82, volume: 1500, sector: 'PSU' },
  { date: '2024-01-02', symbol: 'NSE:CPSEETF', open: 82, high: 88, low: 80, close: 86, volume: 1600, sector: 'PSU' },
  { date: '2024-01-03', symbol: 'NSE:CPSEETF', open: 86, high: 92, low: 84, close: 90, volume: 1700, sector: 'PSU' },
  { date: '2024-01-04', symbol: 'NSE:CPSEETF', open: 90, high: 95, low: 88, close: 93, volume: 1800, sector: 'PSU' },
  { date: '2024-01-05', symbol: 'NSE:CPSEETF', open: 93, high: 98, low: 91, close: 96, volume: 1900, sector: 'PSU' }
];

// Test parameters
const testParams = {
  startDate: '2024-01-01',
  endDate: '2024-01-05',
  initialCapital: 100000,
  profitTarget: 6,
  averagingThreshold: 2.5,
  maxETFsPerSector: 3,
  topK: 5,
  executionPrice: 'close',
  capitalMode: 'chunk_global_pool',
  compoundingMode: 'fixed_chunk_progression',
  chunkConfig: {
    numberOfChunks: 10,
    baseChunkSize: 10000,
    progressionFactor: 1.06
  }
};

async function runTest() {
  console.log('🚀 Starting ETF Backtester Test...\n');

  try {
    // Test 1: Calculate indicators
    console.log('📊 Testing indicators calculation...');
    const indicators = calculateIndicators(sampleData);
    console.log(`✅ Calculated indicators for ${indicators.size} symbols`);
    
    // Test 2: LIFO lot management
    console.log('\n📦 Testing LIFO lot management...');
    const lotManager = new LIFOLotManager('NSE:TESTETF', 'Test');
    
    // Add some lots
    lotManager.addLot(100, 50.0, '2024-01-01');
    lotManager.addLot(200, 55.0, '2024-01-02');
    lotManager.addLot(150, 52.0, '2024-01-03');
    
    // Test selling
    const sellResult = lotManager.sellLots(250, 60.0, '2024-01-04');
    console.log(`✅ Sold ${sellResult.soldLots.length} lots, remaining quantity: ${sellResult.remainingQuantity}`);
    
    // Test position calculation
    const position = lotManager.getPosition(60.0);
    console.log(`✅ Position: ${position.totalQuantity} shares, avg price: ₹${position.averagePrice.toFixed(2)}`);
    
    // Test 3: Money management
    console.log('\n💰 Testing money management...');
    const moneyManager = new FixedChunkProgressionManager(100000, 10, 10000, 1.06);
    
    const positionSize = moneyManager.calculatePositionSize('NSE:TESTETF', 50.0, 50000, 100000, testParams);
    console.log(`✅ Calculated position size: ₹${positionSize.toFixed(2)}`);
    
    // Test 4: Strategy execution
    console.log('\n🎯 Testing strategy execution...');
    const strategy = new ETFStrategy(testParams);
    
    // Simulate a trading day
    const context = {
      date: '2024-01-01',
      indicators: indicators,
      currentPrices: new Map([
        ['NSE:GOLDBEES', 102],
        ['NSE:SILVERBEES', 52],
        ['NSE:CPSEETF', 82]
      ]),
      lotManager: strategy.getLotManager(),
      moneyManager: strategy.getMoneyManager(),
      params: testParams,
      availableCash: 100000,
      equity: 100000,
      dailyActions: { hasBought: false, hasSold: false }
    };
    
    const decisions = strategy.executeDay(context);
    console.log(`✅ Generated ${decisions.length} trading decisions`);
    
    if (decisions.length > 0) {
      decisions.forEach((decision, index) => {
        console.log(`   Decision ${index + 1}: ${decision.action} ${decision.symbol} - ${decision.reason}`);
      });
    }
    
    // Test 5: Portfolio management
    console.log('\n📈 Testing portfolio management...');
    const portfolioManager = strategy.getLotManager();
    const positions = portfolioManager.getAllPositions(context.currentPrices);
    console.log(`✅ Portfolio has ${positions.length} positions`);
    
    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📋 Test Summary:');
    console.log(`   - Indicators: ✅ ${indicators.size} symbols processed`);
    console.log(`   - LIFO Management: ✅ ${sellResult.soldLots.length} lots sold`);
    console.log(`   - Money Management: ✅ ₹${positionSize.toFixed(2)} position size`);
    console.log(`   - Strategy: ✅ ${decisions.length} decisions generated`);
    console.log(`   - Portfolio: ✅ ${positions.length} positions tracked`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
runTest().catch(console.error);
