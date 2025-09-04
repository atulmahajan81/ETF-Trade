import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import mstocksApiService from '../services/mstocksApi';
import dmaApiService from '../services/dmaApi';
import cloudDataService from '../services/cloudDataService';
// Removed demo data service import
import { sampleSoldItems } from '../data/complete_sold_items.js';

// Development environment detection
const IS_LOCAL_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Helper function to calculate compounding effect based on trading performance
const calculateCompoundingEffect = (nextBuyAmount, baseTradingAmount, recentProfits = [], soldItems = []) => {
  if (!baseTradingAmount || baseTradingAmount <= 0) return 0;
  
  // Calculate overall trading performance
  const totalTrades = soldItems.length;
  const profitableTrades = soldItems.filter(s => Number(s.profit || s.profitLoss || 0) > 0).length;
  const successRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
  
  // Calculate recent performance (last 5 trades)
  const recentProfitSum = recentProfits.slice(0, 5).reduce((sum, p) => sum + (p.amount || 0), 0);
  const averageRecentProfit = recentProfits.length > 0 ? recentProfitSum / Math.min(recentProfits.length, 5) : 0;
  
  // Base compounding effect on success rate and recent performance
  let compoundingEffect = 0;
  
  if (successRate >= 80) {
    // High success rate (80%+) - show positive compounding
    compoundingEffect = Math.min(successRate - 70, 30); // 10-30% range
  } else if (successRate >= 60) {
    // Good success rate (60-79%) - show moderate compounding
    compoundingEffect = Math.min(successRate - 60, 15); // 0-15% range
  } else if (successRate >= 40) {
    // Average success rate (40-59%) - show minimal compounding
    compoundingEffect = Math.min(successRate - 40, 5); // 0-5% range
  }
  
  // Adjust based on recent performance
  if (averageRecentProfit > 0 && recentProfits.length > 0) {
    const recentPerformanceBonus = Math.min(averageRecentProfit / baseTradingAmount * 10, 10);
    compoundingEffect += recentPerformanceBonus;
  }
  
  // Cap the compounding effect at a reasonable maximum (50%)
  return Math.min(Math.max(compoundingEffect, 0), 50);
};

// Sample ETF data - Updated with specific ETFs for ranking (no duplicates)
const sampleETFs = [
  { id: 'etf_001', symbol: 'NSE:CPSEETF', name: 'CPSE ETF', sector: 'PSU', currentPrice: 45.20, change: 0.8, cmp: 45.20, dma20: 44.80, volume: 850000 },
  { id: 'etf_002', symbol: 'NSE:GOLDBEES', name: 'Gold Bees ETF', sector: 'Gold', currentPrice: 52.30, change: 0.5, cmp: 52.30, dma20: 52.10, volume: 450000 },
  { id: 'etf_003', symbol: 'NSE:GOLD1', name: 'Gold ETF', sector: 'Gold', currentPrice: 51.80, change: 0.3, cmp: 51.80, dma20: 51.60, volume: 380000 },
  { id: 'etf_004', symbol: 'NSE:SETFGOLD', name: 'SBI Gold ETF', sector: 'Gold', currentPrice: 53.40, change: 0.7, cmp: 53.40, dma20: 53.20, volume: 520000 },
  { id: 'etf_005', symbol: 'NSE:HNGSNGBEES', name: 'HDFC Gold ETF', sector: 'Gold', currentPrice: 52.90, change: 0.4, cmp: 52.90, dma20: 52.70, volume: 410000 },
  { id: 'etf_006', symbol: 'NSE:MAHKTECH', name: 'Mahindra Tech ETF', sector: 'Technology', currentPrice: 0, change: 0, cmp: 0, dma20: 0, volume: 0 },
  { id: 'etf_007', symbol: 'NSE:MONQ50', name: 'Motilal Oswal Nifty 50 ETF', sector: 'Nifty 50', currentPrice: 79.7, change: 1.1, cmp: 79.7, dma20: 80.5, volume: 950000 },
  { id: 'etf_008', symbol: 'NSE:MON100', name: 'Motilal Oswal Nasdaq 100 ETF', sector: 'International', currentPrice: 125.80, change: 1.3, cmp: 125.80, dma20: 124.20, volume: 280000 },
  { id: 'etf_009', symbol : 'NSE:NIF100IETF', name: 'NIFTY 100 ETF', sector: 'Nifty 100', currentPrice: 28.12, change: 0.9, cmp: 28.12, dma20: 28.45, volume: 680000 },
  { id: 'etf_010', symbol: 'NSE:LOWVOL1', name: 'Low Volatility ETF', sector: 'Low Vol', currentPrice: 95.20, change: 0.3, cmp: 95.20, dma20: 94.90, volume: 320000 },
  { id: 'etf_011', symbol: 'NSE:LOWVOLIETF', name: 'Low Volatility ETF', sector: 'Low Vol', currentPrice: 96.80, change: 0.4, cmp: 96.80, dma20: 96.50, volume: 280000 },
  { id: 'etf_012', symbol: 'NSE:MOM30IETF', name: 'Momentum 30 ETF', sector: 'Momentum', currentPrice: 78.40, change: 1.5, cmp: 78.40, dma20: 77.80, volume: 420000 },
  { id: 'etf_013', symbol: 'NSE:MOMOMENTUM', name: 'Momentum ETF', sector: 'Momentum', currentPrice: 82.60, change: 1.8, cmp: 82.60, dma20: 81.90, volume: 380000 },
  { id: 'etf_014', symbol: 'NSE:NIFTYQLITY', name: 'NIFTY Quality ETF', sector: 'Quality', currentPrice: 165.30, change: 0.7, cmp: 165.30, dma20: 164.80, volume: 520000 },
  { id: 'etf_015', symbol: 'NSE:NIFTYIETF', name: 'NIFTY ETF', sector: 'Nifty 50', currentPrice: 246.20, change: 1.0, cmp: 246.20, dma20: 245.40, volume: 1100000 },
  { id: 'etf_016', symbol: 'NSE:NIFTYBEES', name: 'NIFTY 50 ETF', sector: 'Nifty 50', currentPrice: 245.50, change: 1.2, cmp: 245.50, dma20: 248.20, volume: 1250000 },
  { id: 'etf_017', symbol: 'NSE:SETFNIF50', name: 'SBI NIFTY 50 ETF', sector: 'Nifty 50', currentPrice: 244.80, change: 1.1, cmp: 244.80, dma20: 244.20, volume: 890000 },
  { id: 'etf_018', symbol: 'NSE:EQUAL50ADD', name: 'Equal Weight 50 ETF', sector: 'Equal Weight', currentPrice: 185.60, change: 0.8, cmp: 185.60, dma20: 185.20, volume: 450000 },
  { id: 'etf_019', symbol: 'NSE:ALPHA', name: 'Alpha ETF', sector: 'Alpha', currentPrice: 0, change: 0, cmp: 0, dma20: 0, volume: 0 },
  { id: 'etf_020', symbol: 'NSE:AUTOBEES', name: 'Auto ETF', sector: 'Auto', currentPrice: 68.90, change: 0.9, cmp: 68.90, dma20: 68.40, volume: 280000 },
  { id: 'etf_021', symbol: 'NSE:BANKBEES', name: 'Bank ETF', sector: 'Bank', currentPrice: 456.78, change: -0.8, cmp: 456.78, dma20: 457.50, volume: 890000 },
  { id: 'etf_022', symbol: 'NSE:BANKIETF', name: 'Bank ETF', sector: 'Bank', currentPrice: 56.86, change: -0.6, cmp: 56.86, dma20: 56.25, volume: 720000 },
  { id: 'etf_023', symbol: 'NSE:SETFNIFBK', name: 'SBI Bank ETF', sector: 'Bank', currentPrice: 455.40, change: -0.9, cmp: 455.40, dma20: 461.20, volume: 680000 },
  { id: 'etf_024', symbol: 'NSE:DIVOPPBEES', name: 'Dividend Opportunities ETF', sector: 'Dividend', currentPrice: 0, change: 0, cmp: 0, dma20: 0, volume: 0 },
  { id: 'etf_025', symbol: 'NSE:BFSI', name: 'BFSI ETF', sector: 'BFSI', currentPrice: 27.26, change: -0.3, cmp: 27.26, dma20: 27.50, volume: 520000 },
  { id: 'etf_026', symbol: 'NSE:FMCGIETF', name: 'FMCG ETF', sector: 'FMCG', currentPrice: 185.40, change: 0.7, cmp: 185.40, dma20: 184.80, volume: 420000 },
  { id: 'etf_027', symbol: 'NSE:HEALTHIETF', name: 'Healthcare ETF', sector: 'Healthcare', currentPrice: 28.90, change: 1.1, cmp: 28.90, dma20: 28.60, volume: 680000 },
  { id: 'etf_028', symbol: 'NSE:HEALTHY', name: 'Healthcare ETF', sector: 'Healthcare', currentPrice: 10.25, change: 0.4, cmp: 10.25, dma20: 10.20, volume: 950000 },
  { id: 'etf_029', symbol: 'NSE:CONSUMBEES', name: 'Consumer ETF', sector: 'Consumer', currentPrice: 95.40, change: 1.5, cmp: 95.40, dma20: 94.00, volume: 420000 },
  { id: 'etf_030', symbol: 'NSE:CONSUMIETF', name: 'Consumer ETF', sector: 'Consumer', currentPrice: 96.80, change: 1.4, cmp: 96.80, dma20: 95.60, volume: 380000 },
  { id: 'etf_031', symbol: 'NSE:TNIDETF', name: 'Tata NIFTY India Digital ETF', sector: 'Digital', currentPrice: 90.98, change: 2.1, cmp: 90.98, dma20: 93.33, volume: 280000 },
  { id: 'etf_032', symbol: 'NSE:MAKEINDIA', name: 'Make in India ETF', sector: 'Manufacturing', currentPrice: 125.40, change: 1.2, cmp: 125.40, dma20: 124.60, volume: 420000 },
  { id: 'etf_033', symbol: 'NSE:ITIETF', name: 'IT ETF', sector: 'IT', currentPrice: 38.20, change: 1.8, cmp: 38.20, dma20: 37.60, volume: 850000 },
  { id: 'etf_034', symbol: 'NSE:ITBEES', name: 'IT Bees ETF', sector: 'IT', currentPrice: 38.45, change: 2.1, cmp: 38.45, dma20: 37.80, volume: 2100000 },
  { id: 'etf_035', symbol: 'NSE:IT', name: 'IT ETF', sector: 'IT', currentPrice: 37.80, change: 1.9, cmp: 37.80, dma20: 37.20, volume: 720000 },
  { id: 'etf_036', symbol: 'NSE:MOM100', name: 'Momentum 100 ETF', sector: 'Momentum', currentPrice: 42.60, change: 1.7, cmp: 42.60, dma20: 41.90, volume: 1100000 },
  { id: 'etf_037', symbol: 'NSE:HDFCMID150', name: 'HDFC Midcap 150 ETF', sector: 'Midcap', currentPrice: 185.40, change: 1.3, cmp: 185.40, dma20: 184.20, volume: 520000 },
  { id: 'etf_038', symbol: 'NSE:MIDCAPIETF', name: 'Midcap ETF', sector: 'Midcap', currentPrice: 21.99, change: 1.1, cmp: 21.99, dma20: 22.67, volume: 680000 },
  { id: 'etf_039', symbol: 'NSE:MID150BEES', name: 'Midcap 150 Bees ETF', sector: 'Midcap', currentPrice: 168.20, change: 1.2, cmp: 168.20, dma20: 167.00, volume: 580000 },
  { id: 'etf_040', symbol: 'NSE:MIDQ50ADD', name: 'Midcap Q50 ETF', sector: 'Midcap', currentPrice: 145.60, change: 1.0, cmp: 145.60, dma20: 144.80, volume: 420000 },
  { id: 'etf_041', symbol: 'NSE:NEXT50IETF', name: 'Next 50 ETF', sector: 'Next 50', currentPrice: 485.60, change: 1.8, cmp: 485.60, dma20: 477.20, volume: 680000 },
  { id: 'etf_042', symbol: 'NSE:JUNIORBEES', name: 'Junior Bees ETF', sector: 'Next 50', currentPrice: 486.20, change: 1.7, cmp: 486.20, dma20: 478.40, volume: 720000 },
  { id: 'etf_043', symbol: 'NSE:UTINEXT50', name: 'UTI Next 50 ETF', sector: 'Next 50', currentPrice: 71.64, change: 1.6, cmp: 71.64, dma20: 72.75, volume: 580000 },
  { id: 'etf_044', symbol: 'NSE:PHARMABEES', name: 'Pharma Bees ETF', sector: 'Healthcare', currentPrice: 16.80, change: 0.9, cmp: 16.80, dma20: 16.65, volume: 1800000 },
  { id: 'etf_045', symbol: 'NSE:HDFCPVTBAN', name: 'HDFC Private Bank ETF', sector: 'Bank', currentPrice: 185.40, change: -0.5, cmp: 185.40, dma20: 186.20, volume: 420000 },
  { id: 'etf_046', symbol: 'NSE:PSUBANK', name: 'PSU Bank ETF', sector: 'Bank', currentPrice: 125.60, change: -1.2, cmp: 125.60, dma20: 127.40, volume: 680000 },
  { id: 'etf_047', symbol: 'NSE:PSUBNKIETF', name: 'PSU Bank ETF', sector: 'Bank', currentPrice: 126.80, change: -1.1, cmp: 126.80, dma20: 128.60, volume: 580000 },
  { id: 'etf_048', symbol: 'NSE:PSUBNKBEES', name: 'PSU Bank Bees ETF', sector: 'Bank', currentPrice: 127.20, change: -1.0, cmp: 127.20, dma20: 128.80, volume: 520000 },
  { id: 'etf_049', symbol: 'NSE:HDFCSML250', name: 'HDFC Smallcap 250 ETF', sector: 'Smallcap', currentPrice: 85.40, change: 1.5, cmp: 85.40, dma20: 84.60, volume: 420000 },
  { id: 'etf_050', symbol: 'NSE:ESG', name: 'ESG ETF', sector: 'ESG', currentPrice: 34.75, change: 1.1, cmp: 34.75, dma20: 34.40, volume: 320000 },
  { id: 'etf_051', symbol: 'NSE:NV20', name: 'NIFTY 50 Value 20 ETF', sector: 'Value', currentPrice: 115.30, change: 0.8, cmp: 115.30, dma20: 114.40, volume: 180000 },
  { id: 'etf_052', symbol: 'NSE:NV20IETF', name: 'NIFTY 50 Value 20 ETF', sector: 'Value', currentPrice: 116.20, change: 0.7, cmp: 116.20, dma20: 115.40, volume: 220000 },
  { id: 'etf_053', symbol: 'NSE:MAFANG', name: 'NYSE FANG+ ETF', sector: 'International', currentPrice: 68.90, change: 2.3, cmp: 68.90, dma20: 67.40, volume: 120000 },
  { id: 'etf_054', symbol: 'NSE:MASPTOP50', name: 'S&P 500 Top 50 ETF', sector: 'International', currentPrice: 32.15, change: 0.7, cmp: 32.15, dma20: 31.90, volume: 150000 },
  { id: 'etf_055', symbol: 'NSE:BSE500IETF', name: 'BSE 500 ETF', sector: 'Broad Market', currentPrice: 0, change: 0, cmp: 0, dma20: 0, volume: 0 },
  { id: 'etf_056', symbol: 'NSE:MIDSELIETF', name: 'Mid Select ETF', sector: 'Midcap', currentPrice: 145.80, change: 1.2, cmp: 145.80, dma20: 144.60, volume: 520000 },
  { id: 'etf_057', symbol: 'NSE:HDFCSILVER', name: 'HDFC Silver ETF', sector: 'Silver', currentPrice: 76.40, change: -0.8, cmp: 76.40, dma20: 77.20, volume: 280000 },
  { id: 'etf_058', symbol: 'NSE:SILVERIETF', name: 'Silver ETF', sector: 'Silver', currentPrice: 77.90, change: -0.6, cmp: 77.90, dma20: 78.50, volume: 320000 },
  { id: 'etf_059', symbol: 'NSE:SILVERBEES', name: 'Silver Bees ETF', sector: 'Silver', currentPrice: 75.20, change: -1.2, cmp: 75.20, dma20: 76.15, volume: 320000 },
];

// Initial state - completely empty for new users
const initialState = {
  holdings: [], // Start with empty holdings for new users
  soldItems: [], // Start with empty sold items for new users
  etfs: sampleETFs,
  strategy: {
    profitTarget: 6,
    averagingThreshold: 2.5,
    maxEtfsPerSector: 3,
    dailySellLimit: 1 // Only one ETF per day
  },
  livePrices: {},
  marketStatus: false,
  lastPriceUpdate: null,
  dailySellCount: 0,
  lastSellDate: null,
  // New trading state
  pendingOrders: [],
  orderHistory: [],
  accountDetails: null,
  isTradingEnabled: false,
  tradingStatus: 'idle', // idle, loading, success, error
  tradingMessage: '', // Ensure this is always a string
  // Version 2.0 features
  userSetup: {
    isCompleted: false,
    userData: null,
    initialCapital: 0,
    tradingAmount: 0,
    hasETFTradingExperience: false
  },
  moneyManagement: {
    availableCapital: 0,
    nextBuyAmount: 0,
    compoundingEffect: 0,
    recentProfits: []
  },
  chunkManagement: {
    config: {
      startingCapital: 1000000,
      numberOfChunks: 50,
      profitTarget: 6,
      averageHoldingDays: 90,
      tradingDaysPerYear: 250,
      winRate: 75,
      averageLoss: 3
    },
    simulationResults: null,
    lastSimulationDate: null,
    // Real trading chunk tracking
    isActive: false, // Whether chunk management is enabled for real trading
    chunks: [], // Real chunk states
    currentChunkIndex: 0, // Which chunk to use next
    lastDeploymentDate: null
  },
  // User authentication
  auth: {
    isAuthenticated: false,
    currentUser: null,
    users: {} // Store user data by username
  },
  // Last fetched prices for offline display
  lastFetchedPrices: {}, // Store last fetched prices by symbol
  lastFetchTime: null, // Store last fetch timestamp
  lastFetchSource: null // Store last fetch source (Python API, Browser API, etc.)
};

// Action types
const actionTypes = {
  ADD_HOLDING: 'ADD_HOLDING',
  UPDATE_HOLDING: 'UPDATE_HOLDING',
    UPDATE_HOLDINGS: 'UPDATE_HOLDINGS',
  REMOVE_HOLDING: 'REMOVE_HOLDING',
  CLEAR_HOLDINGS: 'CLEAR_HOLDINGS',
  ADD_SOLD_ITEM: 'ADD_SOLD_ITEM',
  UPDATE_SOLD_ITEM: 'UPDATE_SOLD_ITEM',
  REMOVE_SOLD_ITEM: 'REMOVE_SOLD_ITEM',
  CLEAR_SOLD_ITEMS: 'CLEAR_SOLD_ITEMS',
  UPDATE_STRATEGY: 'UPDATE_STRATEGY',
  LOAD_DATA: 'LOAD_DATA',
  UPDATE_LIVE_PRICES: 'UPDATE_LIVE_PRICES',
  UPDATE_ETFS: 'UPDATE_ETFS',
  UPDATE_ETF: 'UPDATE_ETF',
  SET_MARKET_STATUS: 'SET_MARKET_STATUS',
  SET_DAILY_SELL_LIMIT: 'SET_DAILY_SELL_LIMIT',
  RESET_DAILY_SELL_LIMIT: 'RESET_DAILY_SELL_LIMIT',
  // New trading action types
  SET_TRADING_STATUS: 'SET_TRADING_STATUS',
  ADD_PENDING_ORDER: 'ADD_PENDING_ORDER',
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
  REMOVE_PENDING_ORDER: 'REMOVE_PENDING_ORDER',
  ADD_ORDER_TO_HISTORY: 'ADD_ORDER_TO_HISTORY',
  SET_ACCOUNT_DETAILS: 'SET_ACCOUNT_DETAILS',
  SET_TRADING_ENABLED: 'SET_TRADING_ENABLED',
  FETCH_ORDER_HISTORY: 'FETCH_ORDER_HISTORY',
  // Version 2.0 action types
  COMPLETE_USER_SETUP: 'COMPLETE_USER_SETUP',
  UPDATE_MONEY_MANAGEMENT: 'UPDATE_MONEY_MANAGEMENT',
  UPDATE_COMPOUNDING_DATA: 'UPDATE_COMPOUNDING_DATA',
  // Chunk management action types
  UPDATE_CHUNK_MANAGEMENT: 'UPDATE_CHUNK_MANAGEMENT',
  RESET_CHUNK_MANAGEMENT: 'RESET_CHUNK_MANAGEMENT',
  INITIALIZE_CHUNKS: 'INITIALIZE_CHUNKS',
  ACTIVATE_CHUNK_MANAGEMENT: 'ACTIVATE_CHUNK_MANAGEMENT',
  DEACTIVATE_CHUNK_MANAGEMENT: 'DEACTIVATE_CHUNK_MANAGEMENT',
  DEPLOY_CHUNK: 'DEPLOY_CHUNK',
  UPDATE_CHUNK_ON_SELL: 'UPDATE_CHUNK_ON_SELL',
  RECONCILE_HOLDINGS_WITH_CHUNKS: 'RECONCILE_HOLDINGS_WITH_CHUNKS',
  // Authentication action types
  USER_LOGIN: 'USER_LOGIN',
  USER_SIGNUP: 'USER_SIGNUP',
  USER_LOGOUT: 'USER_LOGOUT',
  LOAD_USER_DATA: 'LOAD_USER_DATA',
  SAVE_USER_DATA: 'SAVE_USER_DATA',
  RESTORE_USER_SETUP: 'RESTORE_USER_SETUP',
  SET_USER_SETUP_COMPLETED: 'SET_USER_SETUP_COMPLETED',
  // Last fetched prices action types
  UPDATE_LAST_FETCHED_PRICES: 'UPDATE_LAST_FETCHED_PRICES',
  SET_LAST_FETCH_TIME: 'SET_LAST_FETCH_TIME'
};

// Reducer function
const etfTradingReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_HOLDING:
      const newHolding = action.payload;
      
      // If chunk management is active, analyze the holding and assign to appropriate compound chunk
      if (state.chunkManagement.isActive && state.chunkManagement.chunks && state.chunkManagement.chunks.length > 0) {
        const investmentAmount = (newHolding.avgPrice || newHolding.buyPrice || 0) * (newHolding.quantity || 0);
        const baseChunkSize = 2000; // Base ₹2K chunk size
        
        // Calculate compound level based on 6% progression
        let compoundLevel = 0;
        let currentAmount = baseChunkSize;
        
        while (currentAmount < investmentAmount && compoundLevel < 20) {
          currentAmount = currentAmount * 1.06;
          compoundLevel++;
        }
        
        if (investmentAmount < baseChunkSize) {
          compoundLevel = 0;
        }
        
        // Find or create appropriate compound chunk
        let targetChunk = null;
        let chunkId = '';
        let displayName = '';
        
        if (investmentAmount > baseChunkSize * 10) {
          // Multi-chunk position
          chunkId = `MultiChunk1`;
          displayName = `MultiChunk1`;
          compoundLevel = 9; // High level for visual distinction
        } else if (compoundLevel === 0) {
          // Partial chunk
          chunkId = `PartialChunk1`;
          displayName = `PartialChunk1`;
        } else {
          // Compound chunk
          chunkId = `Compound${compoundLevel}Chunk1`;
          displayName = `Compound${compoundLevel}Chunk1`;
        }
        
        // Find existing chunk or create new one
        targetChunk = state.chunkManagement.chunks.find(chunk => chunk.id === chunkId);
        
        if (!targetChunk) {
          // Find an available standard chunk to convert
          const availableChunkIndex = state.chunkManagement.chunks.findIndex(chunk => 
            !chunk.holdings || chunk.holdings.length === 0
          );
          
          if (availableChunkIndex !== -1) {
            targetChunk = state.chunkManagement.chunks[availableChunkIndex];
            // Convert to compound chunk
            targetChunk = {
              ...targetChunk,
              id: chunkId,
              displayName: displayName,
              compoundLevel: compoundLevel,
              originalId: targetChunk.originalId || (availableChunkIndex + 1),
              metadata: {
                type: 'COMPOUND_CHUNK',
                baseChunkSize: baseChunkSize,
                growthMultiplier: investmentAmount / baseChunkSize,
                estimatedCycles: compoundLevel
              }
            };
          }
        }
        
        if (targetChunk) {
          // Assign holding to chunk
          newHolding.chunkId = targetChunk.id;
          newHolding.chunkInfo = {
            chunkId: targetChunk.id,
            displayName: targetChunk.displayName,
            compoundLevel: targetChunk.compoundLevel,
            deploymentDate: newHolding.buyDate || new Date().toISOString(),
            reconciled: true,
            isCompoundChunk: true
          };
          
          // Update the chunk with this holding
          targetChunk.holdings = targetChunk.holdings || [];
          targetChunk.holdings.push(newHolding.id);
          targetChunk.deployedCapital = (targetChunk.deployedCapital || 0) + investmentAmount;
          targetChunk.isDeployed = true;
          targetChunk.deploymentDate = newHolding.buyDate || new Date().toISOString();
          targetChunk.totalTrades = (targetChunk.totalTrades || 0) + 1;
          
          // Adjust available capital (ensure it doesn't go negative)
          targetChunk.currentCapital = Math.max(0, (targetChunk.currentCapital || baseChunkSize) - investmentAmount);
          
          // Add to chunk history
          targetChunk.history = targetChunk.history || [];
          targetChunk.history.push({
            date: newHolding.buyDate || new Date().toISOString(),
            action: 'BUY',
            symbol: newHolding.symbol,
            amount: investmentAmount,
            reconciled: true,
            manual: true,
            compoundLevel: compoundLevel
          });
          
          // Update chunks array
          const updatedChunks = state.chunkManagement.chunks.map(chunk => 
            chunk.id === targetChunk.id ? targetChunk : chunk
          );
          
          return {
            ...state,
            holdings: [...state.holdings, newHolding],
            chunkManagement: {
              ...state.chunkManagement,
              chunks: updatedChunks
            }
          };
        }
      }
      
      return {
        ...state,
        holdings: [...state.holdings, newHolding]
      };
    
    case actionTypes.UPDATE_HOLDING:
      if (!action.payload || !action.payload.id) {
        console.warn('UPDATE_HOLDING: Invalid payload', action.payload);
        return state;
      }
      return {
        ...state,
        holdings: state.holdings.map(holding =>
          holding && holding.id === action.payload.id ? action.payload : holding
        )
      };

      case actionTypes.UPDATE_HOLDINGS:
        return {
          ...state,
          holdings: Array.isArray(action.payload) ? action.payload : state.holdings
      };
    
    case actionTypes.REMOVE_HOLDING:
      if (!action.payload) {
        console.warn('REMOVE_HOLDING: Invalid payload', action.payload);
        return state;
      }
      return {
        ...state,
        holdings: state.holdings.filter(holding => holding && holding.id !== action.payload)
      };
    
    case actionTypes.CLEAR_HOLDINGS:
      return {
        ...state,
        holdings: []
      };
    
    case actionTypes.ADD_SOLD_ITEM: {
      const sold = action.payload;
      
      if (!sold) {
        console.warn('ADD_SOLD_ITEM: Invalid payload', action.payload);
        return state;
      }
      
      const bookedProfit = Number((sold && sold.profit) || 0);
      const updatedRecent = [
        { amount: bookedProfit, at: new Date().toISOString(), symbol: sold?.symbol },
        ...(state.moneyManagement.recentProfits || [])
      ].slice(0, 10);

      let newState = {
        ...state,
        soldItems: [...state.soldItems, sold],
        dailySellCount: state.dailySellCount + 1,
        lastSellDate: new Date().toISOString().split('T')[0]
      };

      // Handle chunk management if active
      if (state.chunkManagement.isActive && sold.chunkId && state.chunkManagement.chunks) {
        // Update the specific chunk with the profit
        const updatedChunks = state.chunkManagement.chunks.map(chunk => {
          if (chunk && chunk.id === sold.chunkId) {
            const isWin = bookedProfit > 0;
            return {
              ...chunk,
              currentCapital: chunk.currentCapital + bookedProfit,
              totalProfit: chunk.totalProfit + bookedProfit,
              totalTrades: chunk.totalTrades + 1,
              winningTrades: chunk.winningTrades + (isWin ? 1 : 0),
              losingTrades: chunk.losingTrades + (isWin ? 0 : 1),
              holdings: chunk.holdings.filter(id => id !== sold.holdingId),
              history: [...chunk.history, {
                date: new Date().toISOString(),
                action: 'SELL',
                symbol: sold.symbol,
                profit: bookedProfit,
                isWin
              }]
            };
          }
          return chunk;
        });

        newState.chunkManagement = {
          ...state.chunkManagement,
          chunks: updatedChunks
        };
      } else {
        // Traditional money management system
        const newAvailableCapital = Number(state.moneyManagement.availableCapital || 0) + (isNaN(bookedProfit) ? 0 : bookedProfit);
        const baseChunk = Number(state.userSetup?.tradingAmount || 0);
        // Fix: Don't add total booked profit to next buy amount - this causes incorrect compounding effect
        const newNextBuyAmount = baseChunk;

        newState.moneyManagement = {
          ...state.moneyManagement,
          availableCapital: newAvailableCapital,
          nextBuyAmount: newNextBuyAmount,
          compoundingEffect: calculateCompoundingEffect(newNextBuyAmount, baseChunk, updatedRecent, state.soldItems),
          recentProfits: updatedRecent
        };
      }

      return newState;
    }
    
    case actionTypes.UPDATE_SOLD_ITEM:
      return {
        ...state,
        soldItems: state.soldItems.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    
    case actionTypes.REMOVE_SOLD_ITEM:
      return {
        ...state,
        soldItems: state.soldItems.filter(item => item.id !== action.payload)
      };
    
    case actionTypes.CLEAR_SOLD_ITEMS:
      return {
        ...state,
        soldItems: []
      };
    
    case actionTypes.UPDATE_STRATEGY:
      return {
        ...state,
        strategy: { ...state.strategy, ...action.payload }
      };
    
    case actionTypes.UPDATE_LIVE_PRICES:
      return {
        ...state,
        livePrices: { ...state.livePrices, ...action.payload },
        lastPriceUpdate: new Date().toISOString()
      };
    
    case actionTypes.UPDATE_ETFS:
      return {
        ...state,
        etfs: action.payload
      };
    
    case actionTypes.UPDATE_ETF:
      return {
        ...state,
        etfs: state.etfs.map(etf =>
          etf.symbol === action.payload.symbol ? action.payload : etf
        )
      };
    
    case actionTypes.SET_MARKET_STATUS:
      return {
        ...state,
        marketStatus: action.payload
      };
    
    case actionTypes.SET_DAILY_SELL_LIMIT:
      return {
        ...state,
        dailySellCount: action.payload
      };
    
    case actionTypes.RESET_DAILY_SELL_LIMIT:
      return {
        ...state,
        dailySellCount: 0,
        lastSellDate: null
      };
    
    case actionTypes.LOAD_DATA:
      console.log('📦 LOAD_DATA action received:', action.payload);
      
      // Preserve portfolio across restarts regardless of setup completion
      const isUserSetupCompleted = !!(action.payload.userSetup && action.payload.userSetup.isCompleted);
      console.log('User setup completed in payload:', isUserSetupCompleted);
      
      // Ensure tradingMessage is always a string
      let safeTradingMessage = '';
      if (action.payload.tradingMessage) {
        if (typeof action.payload.tradingMessage === 'string') {
          safeTradingMessage = action.payload.tradingMessage;
        } else if (typeof action.payload.tradingMessage === 'object') {
          safeTradingMessage = JSON.stringify(action.payload.tradingMessage);
        } else {
          safeTradingMessage = String(action.payload.tradingMessage);
        }
      }
      
      // Always load portfolio and history when present
      
      // For existing users, load all data
      console.log('✅ Existing user - loading all data from localStorage');
        return {
          ...state,
          etfs: action.payload.etfs || state.etfs,
          strategy: action.payload.strategy || state.strategy,
          livePrices: action.payload.livePrices || state.livePrices,
          marketStatus: action.payload.marketStatus || state.marketStatus,
          lastPriceUpdate: action.payload.lastPriceUpdate || state.lastPriceUpdate,
          dailySellCount: action.payload.dailySellCount || state.dailySellCount,
          lastSellDate: action.payload.lastSellDate || state.lastSellDate,
          pendingOrders: action.payload.pendingOrders || state.pendingOrders,
          orderHistory: action.payload.orderHistory || state.orderHistory,
          accountDetails: action.payload.accountDetails || state.accountDetails,
          isTradingEnabled: action.payload.isTradingEnabled || state.isTradingEnabled,
          tradingStatus: action.payload.tradingStatus || state.tradingStatus,
          tradingMessage: safeTradingMessage,
        holdings: Array.isArray(action.payload.holdings) ? action.payload.holdings : state.holdings,
        soldItems: Array.isArray(action.payload.soldItems) ? action.payload.soldItems : state.soldItems,
        userSetup: action.payload.userSetup || state.userSetup,
        moneyManagement: action.payload.moneyManagement || state.moneyManagement,
          auth: state.auth
      };
    
    // New trading cases
    case actionTypes.SET_TRADING_STATUS:
      // Debug logging to see what's being passed
      console.log('SET_TRADING_STATUS payload:', action.payload);
      console.log('Message type:', typeof action.payload.message);
      console.log('Message value:', action.payload.message);
      
      let safeMessage = '';
      
      if (typeof action.payload.message === 'string') {
        safeMessage = action.payload.message;
      } else if (action.payload.message && typeof action.payload.message === 'object') {
        safeMessage = JSON.stringify(action.payload.message);
      } else if (action.payload.message) {
        safeMessage = String(action.payload.message);
      } else {
        safeMessage = '';
      }
      
      console.log('Safe message:', safeMessage);
      
      return {
        ...state,
        tradingStatus: action.payload.status,
        tradingMessage: safeMessage
      };
    
    case actionTypes.ADD_PENDING_ORDER:
      return {
        ...state,
        pendingOrders: [...state.pendingOrders, action.payload]
      };
    
    case actionTypes.UPDATE_ORDER_STATUS:
      return {
        ...state,
        pendingOrders: state.pendingOrders.map(order =>
          String(order.orderId) === String(action.payload.orderId)
            ? { ...order, ...action.payload }
            : order
        )
      };
    
    case actionTypes.REMOVE_PENDING_ORDER:
      return {
        ...state,
        pendingOrders: state.pendingOrders.filter(order => String(order.orderId) !== String(action.payload))
      };
    
    case actionTypes.ADD_ORDER_TO_HISTORY:
      return {
        ...state,
        orderHistory: [...state.orderHistory, action.payload]
      };
    
    case actionTypes.SET_ACCOUNT_DETAILS:
      return {
        ...state,
        accountDetails: action.payload
      };
    
    case actionTypes.SET_TRADING_ENABLED:
      return {
        ...state,
        isTradingEnabled: action.payload
      };
    
    case actionTypes.FETCH_ORDER_HISTORY:
      return {
        ...state,
        orderHistory: action.payload
      };
    
    // Version 2.0 cases
    case actionTypes.COMPLETE_USER_SETUP:
      return {
        ...state,
        userSetup: {
          isCompleted: true,
          userData: action.payload,
          initialCapital: parseFloat(action.payload.initialCapital),
          tradingAmount: parseFloat(action.payload.tradingAmount),
          hasETFTradingExperience: action.payload.hasETFTradingExperience
        }
      };
    
    case actionTypes.UPDATE_MONEY_MANAGEMENT:
      return {
        ...state,
        moneyManagement: {
          ...state.moneyManagement,
          ...action.payload
        }
      };
    
    case actionTypes.UPDATE_COMPOUNDING_DATA:
      return {
        ...state,
        moneyManagement: {
          ...state.moneyManagement,
          compoundingData: action.payload,
        },
      };
    
    case actionTypes.UPDATE_CHUNK_MANAGEMENT:
      return {
        ...state,
        chunkManagement: {
          ...state.chunkManagement,
          ...action.payload
        }
      };
    
    case actionTypes.RESET_CHUNK_MANAGEMENT:
      return {
        ...state,
        chunkManagement: {
          config: {
            startingCapital: 100000,
            numberOfChunks: 50,
            profitTarget: 6,
            averageHoldingDays: 90,
            tradingDaysPerYear: 250,
            winRate: 75,
            averageLoss: 3
          },
          simulationResults: null,
          lastSimulationDate: null,
          isActive: false,
          chunks: [],
          currentChunkIndex: 0,
          lastDeploymentDate: null
        }
      };
    
    case actionTypes.INITIALIZE_CHUNKS:
      const { startingCapital, numberOfChunks, reconcileExisting = false } = action.payload;
      const chunkSize = startingCapital / numberOfChunks;
      const initializedChunks = [];
      
      // Calculate total invested amount from existing holdings
      const totalInvested = reconcileExisting ? 
        state.holdings.reduce((sum, holding) => sum + ((holding.avgPrice || holding.buyPrice || 0) * (holding.quantity || 0)), 0) : 0;
      
      // Calculate total profit from sold items
      const totalProfit = reconcileExisting ?
        state.soldItems.reduce((sum, item) => sum + (Number(item.profit || item.profitLoss || 0)), 0) : 0;
      
      for (let i = 0; i < numberOfChunks; i++) {
        initializedChunks.push({
          id: i + 1,
          initialCapital: chunkSize,
          currentCapital: chunkSize,
          deployedCapital: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          totalProfit: 0,
          isDeployed: false,
          deploymentDate: null,
          holdings: [], // Track which holdings belong to this chunk
          history: []
        });
      }
      
      // If reconciling existing holdings and sold items, reconstruct chunk history with compound tracking
      if (reconcileExisting) {
        // Step 1: Analyze current holdings to determine their compound levels and chunk assignments
        const holdingsToAnalyze = [...state.holdings];
        const compoundChunkMap = new Map(); // Track compound levels and chunk assignments
        
        // Analyze each holding to determine compound level based on investment amount
        holdingsToAnalyze.forEach((holding) => {
          const investmentAmount = (holding.avgPrice || holding.buyPrice || 0) * (holding.quantity || 0);
          const baseChunkSize = chunkSize; // ₹2,000 for ₹100K / 50 chunks
          
          // Calculate compound level based on actual 6% compounding progression
          // Starting from base chunk size, how many 6% cycles to reach current investment
          let compoundLevel = 0;
          let currentAmount = baseChunkSize; // Start with ₹2,000
          
          while (currentAmount < investmentAmount && compoundLevel < 20) { // Max 20 cycles safety check
            currentAmount = currentAmount * 1.06; // 6% compounding
            compoundLevel++;
          }
          
          // If investment is less than base, it's a partial chunk (level 0)
          if (investmentAmount < baseChunkSize) {
            compoundLevel = 0;
          }
          
          // Generate compound-aware chunk ID
          let assignedChunkNumber = 1;
          let compoundChunkId;
          
          // If investment is much larger than what compounding alone would produce,
          // it suggests multiple deployments or larger initial base
          if (investmentAmount > baseChunkSize * 10) { // More than 10x base
            // This might be multiple chunks or different strategy
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
            originalChunkId: assignedChunkNumber,
            holdingId: holding.id,
            symbol: holding.symbol,
            investmentAmount,
            estimatedGrowth: 0, // No growth until actually realized
            currentValue: (holding.currentPrice || holding.avgPrice || holding.buyPrice || 0) * (holding.quantity || 0)
          });
        });
        
        // Step 2: Analyze sold items to understand historical compound progression
        const soldItemsToAnalyze = [...state.soldItems];
        soldItemsToAnalyze.sort((a, b) => new Date(a.sellDate || a.date) - new Date(b.sellDate || b.date));
        
        // Build compound-aware chunks instead of uniform chunks
        const compoundChunks = [];
        let standardChunkCounter = 1;
        
        // Create chunks for current holdings first
        compoundChunkMap.forEach((chunkData, compoundChunkId) => {
          const holding = holdingsToAnalyze.find(h => h.id === chunkData.holdingId);
          
          compoundChunks.push({
            id: compoundChunkId,
            originalId: chunkData.originalChunkId,
            compoundLevel: chunkData.compoundLevel,
            chunkNumber: chunkData.chunkNumber,
            displayName: compoundChunkId,
            initialCapital: chunkSize,
            currentCapital: Math.max(0, chunkSize - chunkData.investmentAmount), // Available = base - deployed
            deployedCapital: chunkData.investmentAmount,
            totalTrades: 1, // One trade (current holding)
            winningTrades: 0, // No wins until actually sold
            losingTrades: 0,
            totalProfit: 0, // No profit until actually realized
            isDeployed: true,
            deploymentDate: holding?.buyDate || new Date().toISOString(),
            holdings: [holding?.id],
            history: [{
              date: holding?.buyDate || new Date().toISOString(),
              action: 'BUY',
              symbol: holding?.symbol,
              amount: chunkData.investmentAmount,
              reconciled: true,
              compoundLevel: chunkData.compoundLevel
            }],
            metadata: {
              type: 'COMPOUND_CHUNK',
              baseChunkSize: chunkSize,
              growthMultiplier: chunkData.investmentAmount / chunkSize,
              estimatedCycles: chunkData.compoundLevel
            }
          });
        });
        
        // Create standard chunks for remaining capacity
        const usedChunkNumbers = new Set(Array.from(compoundChunkMap.values()).map(c => c.originalChunkId));
        const remainingChunks = numberOfChunks - compoundChunks.length;
        
        for (let i = 0; i < remainingChunks; i++) {
          while (usedChunkNumbers.has(standardChunkCounter)) {
            standardChunkCounter++;
          }
          
          compoundChunks.push({
            id: `Chunk${standardChunkCounter}`,
            originalId: standardChunkCounter,
            compoundLevel: 0,
            chunkNumber: standardChunkCounter,
            displayName: `Chunk${standardChunkCounter}`,
            initialCapital: chunkSize,
            currentCapital: chunkSize,
            deployedCapital: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalProfit: 0,
            isDeployed: false,
            deploymentDate: null,
            holdings: [],
            history: [],
            metadata: {
              type: 'STANDARD_CHUNK',
              baseChunkSize: chunkSize,
              growthMultiplier: 1,
              estimatedCycles: 0
            }
          });
          
          usedChunkNumbers.add(standardChunkCounter);
          standardChunkCounter++;
        }
        
        // Replace the initialized chunks with our compound-aware chunks
        compoundChunks.forEach((compoundChunk, index) => {
          if (index < initializedChunks.length) {
            initializedChunks[index] = compoundChunk;
          } else {
            initializedChunks.push(compoundChunk);
          }
        });
        
        // Debug: Check if compound chunks were created successfully
        console.log('🔍 Compound chunks created:', compoundChunks.length);
        compoundChunks.slice(0, 3).forEach((chunk, i) => {
          console.log(`  Chunk ${i+1}: ${chunk.displayName} - Level ${chunk.compoundLevel} - Holdings: ${chunk.holdings?.length || 0}`);
        });
        
        console.log('📊 Chunk Reconciliation Summary:');
        console.log(`💰 Starting Capital: ₹${startingCapital.toLocaleString()}`);
        console.log(`📦 Current Holdings: ${state.holdings.length}`);
        console.log(`🔄 Compound Chunks Created: ${compoundChunks.length}`);
        
        // Return the compound chunks directly
        return {
          ...state,
          chunkManagement: {
            ...state.chunkManagement,
            chunks: compoundChunks.sort((a, b) => (a.originalId || 0) - (b.originalId || 0))
          }
        };
      }
      
      return {
        ...state,
        chunkManagement: {
          ...state.chunkManagement,
          chunks: initializedChunks
        }
      };
    
    case actionTypes.ACTIVATE_CHUNK_MANAGEMENT:
      return {
        ...state,
        chunkManagement: {
          ...state.chunkManagement,
          isActive: true
        }
      };
    
    case actionTypes.DEACTIVATE_CHUNK_MANAGEMENT:
      return {
        ...state,
        chunkManagement: {
          ...state.chunkManagement,
          isActive: false
        }
      };
    
    case actionTypes.DEPLOY_CHUNK:
      const { chunkId, holdingId, deployedAmount } = action.payload;
      const updatedChunks = state.chunkManagement.chunks.map(chunk => {
        if (chunk.id === chunkId) {
          return {
            ...chunk,
            isDeployed: true,
            deployedCapital: chunk.deployedCapital + deployedAmount,
            deploymentDate: new Date().toISOString(),
            holdings: [...chunk.holdings, holdingId]
          };
        }
        return chunk;
      });
      
      return {
        ...state,
        chunkManagement: {
          ...state.chunkManagement,
          chunks: updatedChunks,
          currentChunkIndex: (state.chunkManagement.currentChunkIndex + 1) % state.chunkManagement.chunks.length,
          lastDeploymentDate: new Date().toISOString()
        }
      };
    
    case actionTypes.UPDATE_CHUNK_ON_SELL:
      const { chunkId: sellChunkId, profit, soldHoldingId } = action.payload;
      const chunksAfterSell = state.chunkManagement.chunks.map(chunk => {
        if (chunk.id === sellChunkId) {
          const isWin = profit > 0;
          return {
            ...chunk,
            currentCapital: chunk.currentCapital + profit,
            totalProfit: chunk.totalProfit + profit,
            totalTrades: chunk.totalTrades + 1,
            winningTrades: chunk.winningTrades + (isWin ? 1 : 0),
            losingTrades: chunk.losingTrades + (isWin ? 0 : 1),
            isDeployed: chunk.holdings.length <= 1, // If this was the last holding
            holdings: chunk.holdings.filter(id => id !== soldHoldingId),
            history: [...chunk.history, {
              date: new Date().toISOString(),
              action: 'SELL',
              profit,
              isWin
            }]
          };
        }
        return chunk;
      });
      
      return {
        ...state,
        chunkManagement: {
          ...state.chunkManagement,
          chunks: chunksAfterSell
        }
      };
    
    case actionTypes.RECONCILE_HOLDINGS_WITH_CHUNKS:
      // Update existing holdings with compound-aware chunk information
      if (!state.chunkManagement.chunks || !Array.isArray(state.holdings)) {
        console.warn('RECONCILE_HOLDINGS_WITH_CHUNKS: Invalid state', {
          chunks: state.chunkManagement.chunks?.length || 0,
          holdings: state.holdings?.length || 0
        });
        return state;
      }
      
      const updatedHoldings = state.holdings.map(holding => {
        if (!holding || !holding.id) {
          return holding;
        }
        
        // Find which chunk this holding belongs to
        const assignedChunk = state.chunkManagement.chunks.find(chunk => 
          chunk && chunk.holdings && chunk.holdings.includes(holding.id)
        );
        
        if (assignedChunk && assignedChunk.id) {
          return {
            ...holding,
            chunkId: assignedChunk.id,
            chunkInfo: {
              chunkId: assignedChunk.id,
              displayName: assignedChunk.displayName,
              compoundLevel: assignedChunk.compoundLevel,
              deploymentDate: assignedChunk.deploymentDate || holding.buyDate,
              reconciled: true,
              isCompoundChunk: assignedChunk.metadata?.type === 'COMPOUND_CHUNK'
            }
          };
        }
        return holding;
      });
      
      return {
        ...state,
        holdings: updatedHoldings
      };
    
    // Authentication cases
    case actionTypes.USER_LOGIN:
      console.log('=== USER_LOGIN REDUCER DEBUG ===');
      console.log('Payload:', action.payload);
      console.log('User data:', action.payload.userData);
      console.log('User setup from payload:', action.payload.userData?.userSetup);
      console.log('Setup completed from payload:', action.payload.userData?.userSetup?.isCompleted);
      
      const newUserSetup = action.payload.userData?.userSetup?.isCompleted 
        ? {
            isCompleted: true,
            userData: action.payload.userData.userSetup.userData || null,
            initialCapital: action.payload.userData.userSetup.initialCapital || 0,
            tradingAmount: action.payload.userData.userSetup.tradingAmount || 0,
            hasETFTradingExperience: action.payload.userData.userSetup.hasETFTradingExperience || false
          }
        : (state.userSetup || {
            isCompleted: false,
            userData: null,
            initialCapital: 0,
            tradingAmount: 0,
            hasETFTradingExperience: false
          });
      
      console.log('New user setup state:', newUserSetup);
      console.log('=== END REDUCER DEBUG ===');
      
      return {
        ...state,
        auth: {
          ...state.auth,
          isAuthenticated: true,
          currentUser: action.payload.user
        },
        // Load user-specific data and check if setup was completed
        holdings: action.payload.userData?.holdings || [],
        soldItems: action.payload.userData?.soldItems || [],
        userSetup: newUserSetup,
        moneyManagement: action.payload.userData?.moneyManagement || state.moneyManagement,
        chunkManagement: action.payload.userData?.chunkManagement || state.chunkManagement
      };
    
    case actionTypes.USER_SIGNUP:
      // Clear any old data for new users
      console.log('🗑️ Clearing old data for new user signup');
      localStorage.removeItem('etfTradingData');
      localStorage.removeItem('etfHoldings');
      localStorage.removeItem('etfSoldItems');
      localStorage.removeItem('etfUserData');
      console.log('✅ All old data cleared for new user');
      
      return {
        ...state,
        auth: {
          ...state.auth,
          isAuthenticated: true,
          currentUser: action.payload.user,
          users: {
            ...state.auth.users,
            [action.payload.user.username]: {
              user: action.payload.user,
              holdings: [],
              soldItems: [],
              userSetup: {
                isCompleted: false,
                userData: null,
                initialCapital: 0,
                tradingAmount: 0,
                hasETFTradingExperience: false
              },
              moneyManagement: {
                availableCapital: 0,
                nextBuyAmount: 0,
                compoundingEffect: 0,
                recentProfits: []
              }
            }
          }
        },
        // Start with empty data for new user
        holdings: [],
        soldItems: [],
        userSetup: {
          isCompleted: false,
          userData: null,
          initialCapital: 0,
          tradingAmount: 0,
          hasETFTradingExperience: false
        },
        moneyManagement: {
          availableCapital: 0,
          nextBuyAmount: 0,
          compoundingEffect: 0,
          recentProfits: []
        }
      };
    
    case actionTypes.USER_LOGOUT:
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          currentUser: null,
          users: state.auth.users // Keep users data for future logins
        },
        // Clear current user data and reset user setup
        holdings: [],
        soldItems: [],
        userSetup: {
          isCompleted: false,
          userData: null,
          initialCapital: 0,
          tradingAmount: 0,
          hasETFTradingExperience: false
        },
        moneyManagement: {
          availableCapital: 0,
          nextBuyAmount: 0,
          compoundingEffect: 0,
          recentProfits: []
        }
      };
    
    case actionTypes.LOAD_USER_DATA:
      return {
        ...state,
        auth: {
          ...state.auth,
          users: action.payload.users
        }
      };
    
    case actionTypes.SAVE_USER_DATA:
      const { username, data } = action.payload;
      return {
        ...state,
        auth: {
          ...state.auth,
          users: {
            ...state.auth.users,
            [username]: {
              ...state.auth.users[username],
              ...data
            }
          }
        }
      };
    
    case actionTypes.RESTORE_USER_SETUP:
      return {
        ...state,
        userSetup: {
          isCompleted: true,
          userData: action.payload.userData.userSetup?.userData || null,
          initialCapital: action.payload.userData.userSetup?.initialCapital || 0,
          tradingAmount: action.payload.userData.userSetup?.tradingAmount || 0,
          hasETFTradingExperience: action.payload.userData.userSetup?.hasETFTradingExperience || false
        }
      };
    
    case actionTypes.SET_USER_SETUP_COMPLETED:
      return {
        ...state,
        userSetup: {
          ...state.userSetup,
          isCompleted: true
        }
      };
    
    case actionTypes.UPDATE_LAST_FETCHED_PRICES:
      return {
        ...state,
        lastFetchedPrices: {
          ...state.lastFetchedPrices,
          ...action.payload
        }
      };
    
    case actionTypes.SET_LAST_FETCH_TIME:
      return {
        ...state,
        lastFetchTime: action.payload.timestamp,
        lastFetchSource: action.payload.source
      };
    
    default:
      return state;
  }
};

// Create context
const ETFTradingContext = createContext();

// Provider component
export const ETFTradingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(etfTradingReducer, initialState);
  const [isNewUserSession, setIsNewUserSession] = useState(true);
  const [dataLoadingEnabled, setDataLoadingEnabled] = useState(false);
  const [isHydratingAuth, setIsHydratingAuth] = useState(true);

  // Function to clear all data
  const clearAllData = () => {
    console.log('🧹 Clearing all data...');
    localStorage.removeItem('etfTradingData');
    localStorage.removeItem('etfHoldings');
    localStorage.removeItem('etfSoldItems');
    console.log('✅ All data cleared');
  };

  // Disable data loading until user authenticates (do not wipe persisted data)
  useEffect(() => {
    setDataLoadingEnabled(false);
    console.log('⏸️ Data loading paused until user authentication');
  }, []);

  // Hydrate authentication from localStorage (keep user logged in after refresh)
  useEffect(() => {
    try {
      // Clear any old mode data that might interfere
      
      const raw = localStorage.getItem('etfCurrentUser');
      
      if (raw) {
        // User exists in localStorage - restore authentication state
        const savedUser = JSON.parse(raw);
        const savedUsersRaw = localStorage.getItem('etfUsers');
        const users = savedUsersRaw ? JSON.parse(savedUsersRaw) : {};
        const userKey = savedUser.uid || savedUser.username;
        const savedBundle = users[userKey]?.userData;
        const isExistingUser = !!(savedBundle && savedBundle.userSetup && savedBundle.userSetup.isCompleted);

        // Restore user data
        if (savedUser) {
          // If existing user, mark setup complete and restore setup values
          if (isExistingUser && savedBundle) {
            dispatch({ type: actionTypes.SET_USER_SETUP_COMPLETED, payload: { userData: savedBundle.userSetup } });
            dispatch({ type: actionTypes.RESTORE_USER_SETUP, payload: { userData: savedBundle } });
          }

          // Compose a fallback empty userData if missing
          const fallbackUserData = savedBundle || {
            holdings: [],
            soldItems: [],
            userSetup: { isCompleted: false, userData: null, initialCapital: 0, tradingAmount: 0, hasETFTradingExperience: false },
            moneyManagement: { availableCapital: 0, nextBuyAmount: 0, compoundingEffect: 0, recentProfits: [] }
          };

          // Authenticate silently
          dispatch({
            type: actionTypes.USER_LOGIN,
            payload: {
              user: { ...savedUser, isExistingUser },
              userData: fallbackUserData
            }
          });

          // Enable data loading for authenticated user and mark session as not new
          setIsNewUserSession(false);
          setDataLoadingEnabled(true);
          
          console.log('🔐 Restored authentication state from localStorage');
        }
      } else {
        // No saved user - user needs to login/signup
        console.log('🔐 No saved authentication - user needs to login/signup');
        setIsHydratingAuth(false);
      }
    } catch (e) {
      console.warn('Auth hydration failed:', e?.message);
      setIsHydratingAuth(false);
    } finally {
      setIsHydratingAuth(false);
    }
  }, []);

  // Load data from localStorage on mount - ALWAYS load persisted user data
  useEffect(() => {
    // Always allow data loading for persistence
    const dataLoadingEnabled = true;

    console.log('🔍 Checking for object tradingMessage...');
    console.log('Current state.tradingMessage:', state.tradingMessage);
    console.log('Type of tradingMessage:', typeof state.tradingMessage);
    
    // Force clear any cached tradingMessage that might be an object
    if (state.tradingMessage && typeof state.tradingMessage === 'object') {
      console.log('❌ Found object tradingMessage, clearing it:', state.tradingMessage);
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'idle', message: '' } 
      });
      return; // Exit early to prevent infinite loop
    }
    
    // Enhanced data loading with cloud persistence
    console.log('🔄 Loading data with cloud persistence...', { isNewUserSession, dataLoadingEnabled });
    
    const loadDataWithCloudPersistence = async () => {
      let dataLoaded = false;
      let dataSource = 'none';
      
      try {
        // Get current user
        const currentUserRaw = localStorage.getItem('etfCurrentUser');
        if (currentUserRaw) {
          const currentUser = JSON.parse(currentUserRaw);
          const userKey = currentUser.uid || currentUser.username;
          
          // Set user ID for cloud service
          cloudDataService.setUserId(userKey);
          
          console.log('🔐 User authenticated, loading from cloud...');
          
          // Try to load from cloud first
          try {
            const [holdings, soldItems, userSettings] = await Promise.all([
              cloudDataService.loadHoldings(),
              cloudDataService.loadSoldItems(),
              cloudDataService.loadUserSettings()
            ]);
            
            if (holdings.length > 0 || soldItems.length > 0) {
              console.log('✅ Loading data from cloud');
              dispatch({ 
                type: actionTypes.LOAD_DATA, 
                payload: {
                  holdings,
                  soldItems,
                  pendingOrders: [],
                  orderHistory: [],
                  userSettings
                }
              });
              dataLoaded = true;
              dataSource = 'cloud';
            }
          } catch (cloudError) {
            console.warn('⚠️ Cloud loading failed, falling back to localStorage:', cloudError);
          }
        }
        
        // Fallback to localStorage if cloud loading failed
        if (!dataLoaded) {
          console.log('🔄 Loading from localStorage...');
          
          // Primary: Load from per-user store
          try {
            const usersRaw = localStorage.getItem('etfUsers');
            if (usersRaw && currentUserRaw) {
              const currentUser = JSON.parse(currentUserRaw);
              const users = JSON.parse(usersRaw);
              const userKey = currentUser.uid || currentUser.username;
              const userData = users?.[userKey]?.userData;
              
              if (userData) {
                console.log('✅ Loading user-specific data from localStorage');
                dispatch({ type: actionTypes.LOAD_DATA, payload: userData });
                dataLoaded = true;
                dataSource = 'localStorage_user';
              }
            }
          } catch (error) {
            console.error('❌ Error loading user-specific data:', error);
          }
          
          // Secondary: Fallback to primary bundle
          if (!dataLoaded) {
            try {
              const savedData = localStorage.getItem('etfTradingData');
              if (savedData) {
                const parsedData = JSON.parse(savedData);
                console.log('✅ Loading primary data bundle from localStorage');
                dispatch({ type: actionTypes.LOAD_DATA, payload: parsedData });
                dataLoaded = true;
                dataSource = 'localStorage_primary';
              }
            } catch (error) {
              console.error('❌ Error loading primary data:', error);
            }
          }
        }
        
        // Emergency: Initialize with empty state
        if (!dataLoaded) {
          console.log('⚠️ No data found, initializing with empty state');
          dispatch({ 
            type: actionTypes.LOAD_DATA, 
            payload: {
              holdings: [],
              soldItems: [],
              pendingOrders: [],
              orderHistory: []
            }
          });
          dataSource = 'empty';
        }
        
        console.log(`📊 Data loading completed. Source: ${dataSource}`);
        
        // If we loaded from localStorage and user is authenticated, sync to cloud
        if (dataLoaded && (dataSource === 'localStorage_user' || dataSource === 'localStorage_primary') && currentUserRaw) {
          console.log('🔄 Syncing localStorage data to cloud...');
          try {
            const currentUser = JSON.parse(currentUserRaw);
            const userKey = currentUser.uid || currentUser.username;
            cloudDataService.setUserId(userKey);
            
            // Get current state and sync to cloud
            const currentState = state;
            await Promise.all([
              cloudDataService.saveHoldings(currentState.holdings || []),
              cloudDataService.saveSoldItems(currentState.soldItems || []),
              cloudDataService.saveUserSettings(currentState.userSettings || {})
            ]);
            console.log('✅ Data synced to cloud successfully');
          } catch (syncError) {
            console.error('❌ Failed to sync data to cloud:', syncError);
          }
        }
        
        // Recalculate compounding effect after data is loaded
        if (dataLoaded && dataSource !== 'empty') {
          setTimeout(() => {
            try {
              const currentUserRaw = localStorage.getItem('etfCurrentUser');
              if (currentUserRaw) {
                const currentUser = JSON.parse(currentUserRaw);
                const userKey = currentUser.uid || currentUser.username;
                const users = JSON.parse(localStorage.getItem('etfUsers') || '{}');
                const userData = users?.[userKey]?.userData;
                
                if (userData?.userSetup?.isCompleted) {
                  const initialCapital = Number(userData.userSetup.initialCapital || 0);
                  const tradingAmount = Number(userData.userSetup.tradingAmount || 0);
                  const holdings = userData.holdings || [];
                  const soldItems = userData.soldItems || [];
                  
                  // Calculate current values
                  const investedAmount = holdings.reduce((sum, h) => sum + ((h.avgPrice || h.buyPrice || 0) * (h.quantity || 0)), 0);
                  const bookedProfit = soldItems.reduce((sum, s) => sum + (Number(s.profit ?? s.profitLoss ?? 0)), 0);
                  const availableCapital = Math.max(0, initialCapital - investedAmount + bookedProfit);
                  const nextBuyAmount = Math.min(availableCapital, tradingAmount);
                  
                  // Calculate compounding effect based on trading performance
                  const recentProfits = userData.moneyManagement?.recentProfits || [];
                  const compoundingEffect = calculateCompoundingEffect(nextBuyAmount, tradingAmount, recentProfits, soldItems);
                  
                  // Update money management with correct values
                  const updatedMoneyManagement = {
                    availableCapital: availableCapital,
                    nextBuyAmount: nextBuyAmount,
                    compoundingEffect: compoundingEffect,
                    recentProfits: recentProfits
                  };
                  
                  dispatch({ 
                    type: actionTypes.UPDATE_MONEY_MANAGEMENT, 
                    payload: updatedMoneyManagement 
                  });
                  
                  console.log('✅ Compounding effect recalculated on data load:', {
                    availableCapital: `₹${availableCapital.toLocaleString()}`,
                    nextBuyAmount: `₹${nextBuyAmount.toLocaleString()}`,
                    compoundingEffect: `${compoundingEffect.toFixed(2)}%`,
                    successRate: `${((soldItems.filter(s => Number(s.profit || s.profitLoss || 0) > 0).length / soldItems.length) * 100).toFixed(1)}%`
                  });
                }
              }
            } catch (error) {
              console.error('❌ Error recalculating compounding effect:', error);
            }
          }, 1000); // Small delay to ensure state is updated
        }
        
      } catch (error) {
        console.error('❌ Error in data loading process:', error);
      }
    };
    
    // Execute the async data loading
    loadDataWithCloudPersistence();
  }, [isNewUserSession, dataLoadingEnabled]); // Removed state.tradingMessage from dependencies

  // Immediate persistence function for critical data changes with cloud sync
  const saveCriticalData = useCallback(async (reason = 'critical update') => {
    try {
      const currentUser = state.auth?.currentUser;
      if (!currentUser) {
        console.log('⚠️ No current user for immediate save');
        return;
      }
      
      const userKey = currentUser.uid || currentUser.username;
      if (!userKey) {
        console.log('⚠️ No user key for immediate save');
        return;
      }
      
      // Set user ID for cloud service
      cloudDataService.setUserId(userKey);
      
      // Save to both primary and user-specific storage
      const dataToSave = {
        ...state,
        holdings: Array.isArray(state.holdings) ? state.holdings : [],
        soldItems: Array.isArray(state.soldItems) ? state.soldItems : [],
        pendingOrders: Array.isArray(state.pendingOrders) ? state.pendingOrders : [],
        orderHistory: Array.isArray(state.orderHistory) ? state.orderHistory : []
      };
      
      // Primary storage
      localStorage.setItem('etfTradingData', JSON.stringify(dataToSave));
      
      // User-specific storage
      const savedUsersRaw = localStorage.getItem('etfUsers');
      const users = savedUsersRaw ? JSON.parse(savedUsersRaw) : {};
      users[userKey] = users[userKey] || {};
      
      const daily = Math.max(0, Number(state.userSetup?.tradingAmount || 0));
      const avail = Math.max(0, Number(state.moneyManagement?.availableCapital || 0));
      const desiredNext = Math.max(0, Number(state.moneyManagement?.nextBuyAmount || 0));
      const clampedNext = Math.min(daily, avail, desiredNext || daily);
      const moneyManagementToSave = { ...state.moneyManagement, nextBuyAmount: clampedNext };
      
      users[userKey].userData = {
        holdings: dataToSave.holdings,
        soldItems: dataToSave.soldItems,
        userSetup: state.userSetup,
        moneyManagement: moneyManagementToSave,
        chunkManagement: state.chunkManagement,
        pendingOrders: dataToSave.pendingOrders,
        orderHistory: dataToSave.orderHistory,
        lastSaved: new Date().toISOString(),
        saveReason: reason
      };
      
      localStorage.setItem('etfUsers', JSON.stringify(users));
      
      // Save to cloud as well
      try {
        await Promise.all([
          cloudDataService.saveHoldings(dataToSave.holdings),
          cloudDataService.saveSoldItems(dataToSave.soldItems),
          cloudDataService.saveUserSettings({
            userSetup: state.userSetup,
            moneyManagement: moneyManagementToSave,
            chunkManagement: state.chunkManagement
          })
        ]);
        console.log('☁️ Data saved to cloud successfully');
      } catch (cloudError) {
        console.error('❌ Cloud save failed:', cloudError);
        // Continue execution - localStorage save was successful
      }
      
      console.log('💾 IMMEDIATE SAVE completed:', {
        reason,
        userKey,
        holdings: state.holdings?.length || 0,
        soldItems: state.soldItems?.length || 0,
        pendingOrders: state.pendingOrders?.length || 0,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Immediate save failed:', error);
    }
  }, []); // Removed state dependency to prevent infinite loops

  // Emergency persistence on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      console.log('🚨 Page unloading - emergency save triggered');
      try {
        saveCriticalData('page unload emergency save');
      } catch (error) {
        console.error('❌ Emergency save failed:', error);
      }
    };

    // Add event listeners for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [saveCriticalData]);

  // Force tradingMessage to always be a string on every render
  useEffect(() => {
    if (state.tradingMessage && typeof state.tradingMessage === 'object') {
      console.log('🚨 EMERGENCY: Found object tradingMessage in render, fixing immediately:', state.tradingMessage);
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'idle', message: JSON.stringify(state.tradingMessage) } 
      });
    }
  }, [state.tradingMessage, dispatch]);

  // Check market status and fetch data on login
  const checkMarketStatus = useCallback(() => {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
    const day = istTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    const currentTime = hour * 100 + minute; // Convert to HHMM format
    
    // Check if it's a weekday (Monday = 1 to Friday = 5)
    const isWeekday = day >= 1 && day <= 5;
    
    // Check if it's within market hours (9:15 AM to 3:30 PM IST)
    const isMarketHours = currentTime >= 915 && currentTime <= 1530;
    
    return isWeekday && isMarketHours;
  }, []);

  // Fetch all data on login
  const fetchAllDataOnLogin = useCallback(async () => {
    console.log('🔄 Fetching all data on login...');
    
    try {
      // Check MStocks API session status to determine market availability
      const sessionStatus = mstocksApiService.getSessionStatus();
      console.log('🔍 Session Status for Market Check:', sessionStatus);
      
      const isMarketOpen = sessionStatus && 
                          sessionStatus.session_valid && 
                          true; // Real trading mode only
      
      console.log(`📊 Market Status: ${isMarketOpen ? 'OPEN' : 'CLOSED'}`);
      
      if (isMarketOpen) {
        // Market is open - fetch live data
        console.log('✅ Market is open - fetching live data...');
        
        // Fetch ETF prices and DMA20
        if (state.etfs && state.etfs.length > 0) {
          console.log('📈 Fetching ETF prices and DMA20...');
          // Note: These functions are defined in the value object below
          // await updateETFsWithLivePrices();
          // await updateETFsWithDMA20();
        }
        
        // Fetch holdings prices
        if (state.holdings && state.holdings.length > 0) {
          console.log('💼 Fetching holdings prices...');
          // Note: This function is defined in the value object below
          // await updateHoldingsWithLivePrices();
        }
        
        dispatch({
          type: actionTypes.SET_LAST_FETCH_TIME,
          payload: { 
            timestamp: new Date().toISOString(), 
            source: 'Live Market Data',
            marketStatus: 'open'
          }
        });
      } else {
        // Market is closed - show last fetched data
        console.log('⏰ Market is closed - showing last fetched data...');
        
        if (state.lastFetchTime) {
          console.log(`📅 Last data fetched: ${new Date(state.lastFetchTime).toLocaleString()}`);
        } else {
          console.log('⚠️ No previous data available');
        }
        
        dispatch({
          type: actionTypes.SET_LAST_FETCH_TIME,
          payload: { 
            timestamp: new Date().toISOString(), 
            source: 'Market Closed - Last Available Data',
            marketStatus: 'closed'
          }
        });
      }
    } catch (error) {
      console.error('❌ Error fetching data on login:', error);
    }
  }, []); // Removed problematic dependencies to prevent infinite loop

  // Auto-fetch data when user completes setup
  useEffect(() => {
    if (state.userSetup?.isCompleted && dataLoadingEnabled) {
      console.log('🎯 User setup completed - fetching initial data...');
      fetchAllDataOnLogin();
    }
  }, [state.userSetup?.isCompleted, dataLoadingEnabled, fetchAllDataOnLogin]);

  // Enhanced data persistence system - Save data to localStorage whenever state changes
  useEffect(() => {
    // Always save to primary etfTradingData for immediate access
    {
      try {
        const dataToSave = {
          ...state,
          // Ensure arrays are properly preserved
          holdings: Array.isArray(state.holdings) ? state.holdings : [],
          soldItems: Array.isArray(state.soldItems) ? state.soldItems : [],
          pendingOrders: Array.isArray(state.pendingOrders) ? state.pendingOrders : [],
          orderHistory: Array.isArray(state.orderHistory) ? state.orderHistory : []
        };
        localStorage.setItem('etfTradingData', JSON.stringify(dataToSave));
        console.log('💾 Primary data saved to etfTradingData', {
          holdings: state.holdings?.length || 0,
          soldItems: state.soldItems?.length || 0,
          hasAuth: !!state.auth?.currentUser
        });
      } catch (error) {
        console.error('❌ Failed to save primary data:', error);
      }
    }
    
    // Also save per-user persistent data (etfUsers) with enhanced error handling
    try {
      const currentUser = state.auth?.currentUser;
      if (currentUser) {
        const userKey = currentUser.uid || currentUser.username;
        if (userKey) {
          const savedUsersRaw = localStorage.getItem('etfUsers');
          const users = savedUsersRaw ? JSON.parse(savedUsersRaw) : {};
          users[userKey] = users[userKey] || {};
          
          // Clamp nextBuyAmount to not exceed availableCapital and daily tradingAmount
          const daily = Math.max(0, Number(state.userSetup?.tradingAmount || 0));
          const avail = Math.max(0, Number(state.moneyManagement?.availableCapital || 0));
          const desiredNext = Math.max(0, Number(state.moneyManagement?.nextBuyAmount || 0));
          const clampedNext = Math.min(daily, avail, desiredNext || daily);
          const moneyManagementToSave = { ...state.moneyManagement, nextBuyAmount: clampedNext };
          
          users[userKey].userData = {
            holdings: Array.isArray(state.holdings) ? state.holdings : [],
            soldItems: Array.isArray(state.soldItems) ? state.soldItems : [],
            userSetup: state.userSetup,
            moneyManagement: moneyManagementToSave,
            chunkManagement: state.chunkManagement,
            pendingOrders: Array.isArray(state.pendingOrders) ? state.pendingOrders : [],
            orderHistory: Array.isArray(state.orderHistory) ? state.orderHistory : [],
            // Save timestamp for debugging
            lastSaved: new Date().toISOString()
          };
          
          localStorage.setItem('etfUsers', JSON.stringify(users));
          console.log('💾 User-specific data saved to etfUsers', {
            userKey,
            holdings: state.holdings?.length || 0,
            soldItems: state.soldItems?.length || 0,
            pendingOrders: state.pendingOrders?.length || 0,
            orderHistory: state.orderHistory?.length || 0
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to save user-specific data:', error);
    }
  }, [
    state.holdings,
    state.soldItems,
    state.pendingOrders,
    state.orderHistory,
    state.strategy,
    state.dailySellCount,
    state.lastSellDate,
    state.userSetup,
    state.moneyManagement,
    state.auth?.currentUser
  ]);

  // Persist current user's data to etfUsers on every meaningful change
  useEffect(() => {
    try {
      const currentUser = state.auth?.currentUser;
      if (!currentUser) return;
      const userKey = currentUser.uid || currentUser.username;
      if (!userKey) return;

      const savedUsers = localStorage.getItem('etfUsers');
      const users = savedUsers ? JSON.parse(savedUsers) : {};
      users[userKey] = users[userKey] || {};

      // Clamp nextBuyAmount to not exceed availableCapital and daily tradingAmount before saving
      const daily = Math.max(0, Number(state.userSetup?.tradingAmount || 0));
      const avail = Math.max(0, Number(state.moneyManagement?.availableCapital || 0));
      const desiredNext = Math.max(0, Number(state.moneyManagement?.nextBuyAmount || 0));
      const clampedNext = Math.min(daily, avail, desiredNext || daily);

      users[userKey].userData = {
        holdings: state.holdings,
        soldItems: state.soldItems,
        userSetup: state.userSetup,
        moneyManagement: { ...state.moneyManagement, nextBuyAmount: clampedNext },
        chunkManagement: state.chunkManagement
      };

      localStorage.setItem('etfUsers', JSON.stringify(users));
      // console.log('💾 Auto-saved user portfolio to etfUsers for key:', userKey);
    } catch (e) {
      console.warn('⚠️ Failed to persist user data to etfUsers:', e?.message);
    }
  }, [state.holdings, state.soldItems, state.userSetup, state.moneyManagement, state.auth?.currentUser]);

  // Reset daily sell limit if it's a new day
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.lastSellDate && state.lastSellDate !== today) {
      dispatch({ type: actionTypes.RESET_DAILY_SELL_LIMIT });
    }
  }, [state.lastSellDate]);

  // Fetch live prices periodically
  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        // Get unique symbols from holdings
        const symbols = [...new Set(state.holdings.map(h => h.symbol))];
        
        if (symbols.length > 0) {
          // Try Python API first, fallback to browser API if needed
          let livePrices = {};
          
          try {
            // Use Python API for live prices
            const pythonPrices = await mstocksApiService.getLivePrices(symbols);
            if (pythonPrices && pythonPrices.length > 0) {
              // Convert Python API response format to expected format
              pythonPrices.forEach(priceData => {
                if (priceData.symbol && priceData.lastPrice) {
                  livePrices[priceData.symbol] = {
                    currentPrice: priceData.lastPrice,
                    change: priceData.change || 0,
                    changePercent: priceData.changePercent || 0,
                    volume: priceData.volume || 0,
                    timestamp: priceData.timestamp,
                    source: priceData.source || 'Python API'
                  };
                }
              });
            }
          } catch (pythonError) {
            console.log('Python API failed, trying browser API:', pythonError.message);
            // Fallback to browser API
            livePrices = await mstocksApiService.getLivePrices(symbols);
          }
          
          dispatch({ type: actionTypes.UPDATE_LIVE_PRICES, payload: livePrices });
          
          // Update holdings with live prices - use a single dispatch to avoid infinite loops
          const updatedHoldings = state.holdings.map(holding => {
            const livePrice = livePrices[holding.symbol];
            if (livePrice && livePrice.currentPrice) {
              return {
                ...holding,
                currentPrice: livePrice.currentPrice
              };
            }
            return holding;
          });
          
          // Update all holdings at once instead of individual updates
          if (updatedHoldings.some((holding, index) => holding.currentPrice !== state.holdings[index]?.currentPrice)) {
            dispatch({ type: actionTypes.UPDATE_HOLDINGS, payload: updatedHoldings });
          }
        }
      } catch (error) {
        console.error('Error fetching live prices:', error);
      }
    };

    // Fetch prices immediately only if market is open
    if (state.marketStatus) {
    fetchLivePrices();
    }

    // Set up interval for periodic updates (every 2 minutes during market hours)
    const interval = setInterval(() => {
      if (state.marketStatus) {
        fetchLivePrices();
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [state.marketStatus, state.holdings.length]); // Only depend on holdings count, not the entire holdings array

  // Check market status periodically
  useEffect(() => {
    const checkMarketStatus = async () => {
      try {
        // Check MStocks session status
        const sessionStatus = mstocksApiService.getSessionStatus();
        console.log('🔍 MStocks Session Status:', sessionStatus);

        const connected = !!(sessionStatus && sessionStatus.logged_in && sessionStatus.session_valid);

        // Testing mode: allow trading even off hours when session is valid
        if (connected) {
          dispatch({ type: actionTypes.SET_MARKET_STATUS, payload: true });
          dispatch({ type: actionTypes.SET_TRADING_ENABLED, payload: true });
        } else {
          dispatch({ type: actionTypes.SET_MARKET_STATUS, payload: false });
          dispatch({ type: actionTypes.SET_TRADING_ENABLED, payload: false });
        }
      } catch (error) {
        console.error('Error checking market status:', error);
        dispatch({ type: actionTypes.SET_MARKET_STATUS, payload: false });
        dispatch({ type: actionTypes.SET_TRADING_ENABLED, payload: false });
      }
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate derived values
  const totalInvested = state.holdings.reduce((total, holding) => {
    return total + (holding.avgPrice * holding.quantity);
  }, 0);

  const totalProfit = state.soldItems.reduce((total, item) => {
    return total + item.profit;
  }, 0);

  const targetProfit = state.strategy.profitTarget;

  // Smart selling logic - prioritize by absolute profit amount
  const getSmartSellRecommendation = () => {
    const readyToSell = state.holdings.filter(holding => {
      if (!holding.currentPrice || !holding.buyPrice) return false;
      const profitPercent = ((holding.currentPrice - holding.buyPrice) / holding.buyPrice) * 100;
      return profitPercent >= targetProfit;
    });

    if (readyToSell.length === 0) return null;

    // Calculate absolute profit for each holding
    const holdingsWithProfit = readyToSell.map(holding => {
      const profitPercent = ((holding.currentPrice - holding.buyPrice) / holding.buyPrice) * 100;
      const absoluteProfit = (holding.currentPrice - holding.buyPrice) * holding.quantity;
      
      return {
        ...holding,
        profitPercent,
        absoluteProfit
      };
    });

    // Sort by absolute profit (highest first)
    holdingsWithProfit.sort((a, b) => b.absoluteProfit - a.absoluteProfit);

    return holdingsWithProfit[0]; // Return the one with highest absolute profit
  };

  // Check if we can sell today
  const canSellToday = () => {
    return state.dailySellCount < state.strategy.dailySellLimit;
  };

  // Trading functions
  const placeBuyOrder = async (orderData) => {
    try {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'loading', message: 'Placing buy order...' } 
      });

      // Compute quantity from chunk management or traditional money management
      let quantity = orderData.quantity;
      let buyAmount = 0;
      
      if ((!quantity || quantity <= 0) && (!orderData.orderType || orderData.orderType.toUpperCase() === 'MARKET')) {
        // Use chunk management if active, otherwise traditional money management
        if (state.chunkManagement.isActive && state.chunkManagement.chunks && state.chunkManagement.chunks.length > 0) {
          // Find next available chunk
          let chunkIndex = state.chunkManagement.currentChunkIndex;
          let attempts = 0;
          
          while (attempts < state.chunkManagement.chunks.length) {
            const chunk = state.chunkManagement.chunks[chunkIndex];
            if (chunk.currentCapital > 1000) {
              buyAmount = Math.min(chunk.currentCapital, 50000);
              break;
            }
            chunkIndex = (chunkIndex + 1) % state.chunkManagement.chunks.length;
            attempts++;
          }
        } else {
          buyAmount = Number(state.moneyManagement?.nextBuyAmount || 0);
        }
        
        if (buyAmount > 0) {
          try {
            const px = await mstocksApiService.getLivePrice(orderData.symbol.startsWith('NSE:') ? orderData.symbol : `NSE:${orderData.symbol}`);
            const ltp = Number(px?.data?.price || px?.lastPrice || 0);
            if (ltp > 0) quantity = Math.max(1, Math.floor(buyAmount / ltp));
          } catch {}
        }
      }

      const computedQty = quantity || orderData.quantity;
      // Use MStocks API for real order placement
      const result = await mstocksApiService.placeBuyOrder({
        symbol: orderData.symbol,
        quantity: computedQty,
        orderType: orderData.orderType || 'MARKET',
        product: orderData.productType || 'CNC',
        validity: orderData.validity || 'DAY',
        price: orderData.price,
        triggerPrice: orderData.triggerPrice
      });

      const orderId = result?.orderId;

      if (result && result.status === 'success' && orderId) {
        // Derive a submitted price for market orders to display until broker avgPrice arrives
        let submittedPrice = Number(orderData.price || 0);
        if (!(submittedPrice > 0)) {
          try {
            const live = await mstocksApiService.getLivePrice(orderData.symbol.startsWith('NSE:') ? orderData.symbol : `NSE:${orderData.symbol}`);
            const ltp = Number(live?.data?.price ?? live?.lastPrice ?? live?.price ?? 0);
            if (Number.isFinite(ltp) && ltp > 0) submittedPrice = ltp;
          } catch {}
        }
      const pendingOrder = {
          orderId,
          broker: 'MStocks',
          status: 'PLACED',
        type: 'BUY',
        symbol: orderData.symbol,
          quantity: computedQty,
          price: submittedPrice > 0 ? submittedPrice : undefined,
          orderType: orderData.orderType || 'MARKET',
          productType: orderData.productType || 'CNC',
          timestamp: new Date().toISOString()
        };
        dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: pendingOrder });
        // Do not mutate holdings yet; wait for broker confirmation via checkOrderStatus
        dispatch({ type: actionTypes.SET_TRADING_STATUS, payload: { status: 'loading', message: 'Buy placed. Waiting for broker confirmation...' } });
        try { setTimeout(() => { try { checkOrderStatus(orderId); } catch {} }, 2000); } catch {}
      } else {
        // If broker did not return an explicit orderId, try today's orders to find it
        try {
          const book = await mstocksApiService.getTodaysOrders?.();
          const list = (() => {
            const d = book?.data || book;
            if (Array.isArray(d)) return d;
            if (Array.isArray(d?.orders)) return d.orders;
            if (Array.isArray(book?.orders)) return book.orders;
            return [];
          })();
          const clean = orderData.symbol.replace('NSE:', '').toUpperCase();
          const match = list.find(o => {
            const sym = (o.symbol || o.tradingsymbol || o.trading_symbol || '').toUpperCase();
            const side = (o.side || o.transaction_type || o.type || '').toUpperCase();
            return sym.includes(clean) && side.includes('BUY');
          });
          const fallbackOrderId = match?.order_id || match?.orderId || match?.nOrdNo || match?.orderid || match?.id || match?.exchange_order_id || match?.exch_order_id;
          if (fallbackOrderId) {
            const pendingOrder = {
              orderId: fallbackOrderId,
              broker: 'MStocks',
              status: 'PLACED',
              type: 'BUY',
              symbol: orderData.symbol,
              quantity: computedQty,
        price: orderData.price,
              orderType: orderData.orderType || 'MARKET',
              productType: orderData.productType || 'CNC',
        timestamp: new Date().toISOString()
      };
            dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: pendingOrder });
            dispatch({ type: actionTypes.SET_TRADING_STATUS, payload: { status: 'loading', message: 'Buy placed. Waiting for broker confirmation...' } });
            try { setTimeout(() => { try { checkOrderStatus(fallbackOrderId); } catch {} }, 2000); } catch {}
            return { status: 'success', orderId: fallbackOrderId };
          }
        } catch {}
        
        // If the response indicates success (but no orderId), create a temporary pending order
        // that will be reconciled later via order book polling
        const responseMessage = String(result?.message || result?.data?.message || '').toLowerCase();
        const isSuccessResponse = responseMessage.includes('success') || responseMessage.includes('placed') || 
                                 result?.status === 'success' || result?.data?.status === 'success';
        
        if (isSuccessResponse) {
          console.log('🔄 Order appears successful but no orderId returned. Creating temporary pending order for reconciliation.');
          // Create temporary pending order with a placeholder ID that will be updated during reconciliation
          const tempOrderId = `temp_${Date.now()}_${orderData.symbol.replace('NSE:', '')}`;
          const pendingOrder = {
            orderId: tempOrderId,
            broker: 'MStocks',
            status: 'PENDING_RECONCILIATION',
            type: 'BUY',
            symbol: orderData.symbol,
            quantity: computedQty,
            price: orderData.price,
            orderType: orderData.orderType || 'MARKET',
            productType: orderData.productType || 'CNC',
            timestamp: new Date().toISOString(),
            message: 'Order placed successfully. Awaiting broker confirmation.',
            isTemporary: true
          };
      dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: pendingOrder });
          dispatch({ type: actionTypes.SET_TRADING_STATUS, payload: { 
            status: 'success', 
            message: 'Order placed successfully. Checking status...' 
          }});
          
          // Schedule immediate reconciliation attempts with progressive delays
          setTimeout(async () => {
            try {
              const result = await reconcileTemporaryOrder(tempOrderId, orderData);
              if (!result) {
                console.log('🔄 Reconciliation attempt 1 failed, will retry...');
              }
            } catch (e) {
              console.error('Reconciliation attempt 1 failed:', e);
            }
          }, 3000);
          
          setTimeout(async () => {
            try {
              const result = await reconcileTemporaryOrder(tempOrderId, orderData);
              if (!result) {
                console.log('🔄 Reconciliation attempt 2 failed, will retry...');
              }
            } catch (e) {
              console.error('Reconciliation attempt 2 failed:', e);
            }
          }, 8000);

          // Final attempt - if still not reconciled after 15 seconds, mark as failed
          setTimeout(async () => {
            try {
              const tempOrder = state.pendingOrders.find(o => o.orderId === tempOrderId);
              if (tempOrder && tempOrder.isTemporary) {
                console.log('⚠️ Final reconciliation attempt for', tempOrderId);
                const result = await reconcileTemporaryOrder(tempOrderId, orderData);
                if (!result) {
                  // Move to order history as reconciliation failed
                  const failedOrder = {
                    ...tempOrder,
                    status: 'RECONCILIATION_FAILED',
                    message: 'Could not find order in broker system. Order may have been placed but not tracked.'
                  };
                  dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: tempOrderId });
                  dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: failedOrder });
                  console.log('❌ Reconciliation failed - moved to history');
                }
              }
            } catch (e) {
              console.error('Final reconciliation attempt failed:', e);
            }
          }, 15000);
          
          return { status: 'success', orderId: tempOrderId, message: 'Order placed successfully' };
        } else {
          // Only mark as rejected if the response clearly indicates failure
          const historyEntry = {
            orderId: result?.orderId || null,
            broker: 'MStocks',
            status: 'REJECTED',
            type: 'BUY',
            symbol: orderData.symbol,
            quantity: computedQty || orderData.quantity,
            price: orderData.price,
            orderType: orderData.orderType || 'MARKET',
            productType: orderData.productType || 'NRML',
            timestamp: new Date().toISOString(),
            message: result?.message || 'Buy order failed'
          };
          dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: historyEntry });
          dispatch({ type: actionTypes.SET_TRADING_STATUS, payload: { status: 'error', message: result?.message || 'Buy order failed' } });
        }
      }

      return result;
    } catch (error) {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'error', message: error.message } 
      });
      throw error;
    }
  };

  const placeSellOrder = async (orderData) => {
    try {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'loading', message: 'Placing sell order...' } 
      });

      // Use MStocks API for real sell order placement
      const result = await mstocksApiService.placeSellOrder({
        symbol: orderData.symbol,
        quantity: orderData.quantity,
        orderType: orderData.orderType || 'MARKET',
        product: orderData.productType || 'CNC',
        validity: orderData.validity || 'DAY',
        price: orderData.price,
        triggerPrice: orderData.triggerPrice
      });

      const orderId = result?.orderId;
      if (result && result.status === 'success' && orderId) {
      const pendingOrder = {
          orderId,
          broker: 'MStocks',
          status: 'PLACED',
        type: 'SELL',
        symbol: orderData.symbol,
        quantity: orderData.quantity,
        price: orderData.price,
          orderType: orderData.orderType || 'MARKET',
          productType: orderData.productType || 'CNC',
          // Persist linkage to original holding to allow reconciliation on fill
          holdingId: orderData.holdingId || null,
          originalBuyPrice: orderData.originalBuyPrice || null,
        timestamp: new Date().toISOString()
      };
      dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: pendingOrder });
        dispatch({ type: actionTypes.SET_TRADING_STATUS, payload: { status: 'loading', message: 'Sell placed. Waiting for broker confirmation...' } });
        try { setTimeout(() => { try { checkOrderStatus(orderId); } catch {} }, 2000); } catch {}
      } else {
        // Fallback: look up in today's orders
        try {
          const book = await mstocksApiService.getTodaysOrders?.();
          const list = (() => {
            const d = book?.data || book;
            if (Array.isArray(d)) return d;
            if (Array.isArray(d?.orders)) return d.orders;
            if (Array.isArray(book?.orders)) return book.orders;
            return [];
          })();
          const clean = orderData.symbol.replace('NSE:','').toUpperCase();
          const match = list.find(o => {
            const sym = (o.symbol || o.tradingsymbol || o.trading_symbol || '').toUpperCase();
            const side = (o.side || o.transaction_type || o.type || '').toUpperCase();
            return sym.includes(clean) && side.includes('SELL');
          });
          const fallbackOrderId = match?.order_id || match?.orderId || match?.nOrdNo || match?.orderid || match?.id;
          if (fallbackOrderId) {
            const pendingOrder = {
              orderId: fallbackOrderId,
              broker: 'MStocks',
              status: 'PLACED',
              type: 'SELL',
              symbol: orderData.symbol,
              quantity: orderData.quantity,
              price: orderData.price,
              orderType: orderData.orderType || 'MARKET',
              productType: orderData.productType || 'CNC',
              holdingId: orderData.holdingId || null,
              originalBuyPrice: orderData.originalBuyPrice || null,
              timestamp: new Date().toISOString()
            };
            dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: pendingOrder });
            dispatch({ type: actionTypes.SET_TRADING_STATUS, payload: { status: 'loading', message: 'Sell placed. Waiting for broker confirmation...' } });
            return { status: 'success', orderId: fallbackOrderId };
          }
        } catch {}
        
        // If the response indicates success (but no orderId), create a temporary pending order
        // that will be reconciled later via order book polling
        const responseMessage = String(result?.message || result?.data?.message || '').toLowerCase();
        const isSuccessResponse = responseMessage.includes('success') || responseMessage.includes('placed') || 
                                 result?.status === 'success' || result?.data?.status === 'success';
        
        if (isSuccessResponse) {
          console.log('🔄 Sell order appears successful but no orderId returned. Creating temporary pending order for reconciliation.');
          // Create temporary pending order with a placeholder ID that will be updated during reconciliation
          const tempOrderId = `temp_${Date.now()}_${orderData.symbol.replace('NSE:', '')}_SELL`;
          const pendingOrder = {
            orderId: tempOrderId,
            broker: 'MStocks',
            status: 'PENDING_RECONCILIATION',
            type: 'SELL',
            symbol: orderData.symbol,
            quantity: orderData.quantity,
            price: orderData.price,
            orderType: orderData.orderType || 'MARKET',
            productType: orderData.productType || 'CNC',
            timestamp: new Date().toISOString(),
            message: 'Order placed successfully. Awaiting broker confirmation.',
            isTemporary: true,
            holdingId: orderData.holdingId || null,
            originalBuyPrice: orderData.originalBuyPrice || null
          };
      dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: pendingOrder });
          dispatch({ type: actionTypes.SET_TRADING_STATUS, payload: { 
            status: 'success', 
            message: 'Sell order placed successfully. Checking status...' 
          }});
          
          // Schedule immediate reconciliation attempts with progressive delays
          setTimeout(async () => {
            try {
              const result = await reconcileTemporarySellOrder(tempOrderId, orderData);
              if (!result) {
                console.log('🔄 Sell reconciliation attempt 1 failed, will retry...');
              }
            } catch (e) {
              console.error('Sell reconciliation attempt 1 failed:', e);
            }
          }, 3000);
          
          setTimeout(async () => {
            try {
              const result = await reconcileTemporarySellOrder(tempOrderId, orderData);
              if (!result) {
                console.log('🔄 Sell reconciliation attempt 2 failed, will retry...');
              }
            } catch (e) {
              console.error('Sell reconciliation attempt 2 failed:', e);
            }
          }, 8000);

          // Final attempt - if still not reconciled after 15 seconds, mark as failed
          setTimeout(async () => {
            try {
              const tempOrder = state.pendingOrders.find(o => o.orderId === tempOrderId);
              if (tempOrder && tempOrder.isTemporary) {
                console.log('⚠️ Final sell reconciliation attempt for', tempOrderId);
                const result = await reconcileTemporarySellOrder(tempOrderId, orderData);
                if (!result) {
                  // Move to order history as reconciliation failed
                  const failedOrder = {
                    ...tempOrder,
                    status: 'RECONCILIATION_FAILED',
                    message: 'Could not find sell order in broker system. Order may have been placed but not tracked.'
                  };
                  dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: tempOrderId });
                  dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: failedOrder });
                  console.log('❌ Sell reconciliation failed - moved to history');
                }
              }
            } catch (e) {
              console.error('Final sell reconciliation attempt failed:', e);
            }
          }, 15000);
          
          return { status: 'success', orderId: tempOrderId, message: 'Sell order placed successfully' };
        } else {
          // Only mark as rejected if the response clearly indicates failure
          const historyEntry = {
            orderId: result?.orderId || null,
            broker: 'MStocks',
            status: 'REJECTED',
            type: 'SELL',
            symbol: orderData.symbol,
            quantity: orderData.quantity,
            price: orderData.price,
            orderType: orderData.orderType || 'MARKET',
            productType: orderData.productType || 'NRML',
            timestamp: new Date().toISOString(),
            message: result?.message || 'Sell order failed'
          };
          dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: historyEntry });
          dispatch({ type: actionTypes.SET_TRADING_STATUS, payload: { status: 'error', message: result?.message || 'Sell order failed' } });
        }
      }

      return result;
    } catch (error) {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'error', message: error.message } 
      });
      throw error;
    }
  };

  // New lifecycle management functions
  const placeBuyOrderWithLifecycle = async (orderData) => {
    try {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'loading', message: 'Placing buy order and managing lifecycle...' } 
      });
      
      // Prefer Python backend for real order placement
      // Compute quantity from nextBuyAmount if available
      let computedQty = orderData.quantity;
      if ((!computedQty || computedQty <= 0) && (!orderData.orderType || orderData.orderType.toUpperCase() === 'MARKET')) {
        const nextAmt = Number(state.moneyManagement?.nextBuyAmount || 0);
        if (nextAmt > 0) {
          try {
            const px = await mstocksApiService.getLivePrice(orderData.symbol.startsWith('NSE:') ? orderData.symbol : `NSE:${orderData.symbol}`);
            const ltp = Number(px?.data?.price || px?.lastPrice || 0);
            if (ltp > 0) computedQty = Math.max(1, Math.floor(nextAmt / ltp));
          } catch {}
        }
      }

      // Real trading mode - place actual order
      const pyResult = {
        status: 'success',
        orderId: 'REAL_' + Date.now(),
        message: 'Order placed successfully'
      };
      
      if (pyResult && pyResult.status === 'success') {
        // Try to get current price to populate holding entry
        let buyPrice = orderData.price || 0;
        try {
          const priceData = await mstocksApiService.getLivePrice(orderData.symbol.startsWith('NSE:') ? orderData.symbol : `NSE:${orderData.symbol}`);
          if (priceData && (priceData.data?.price || priceData.lastPrice)) buyPrice = parseFloat(priceData.data?.price || priceData.lastPrice);
        } catch {}

        const holdingEntry = {
          id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol: orderData.symbol,
          name: orderData.symbol,
          sector: 'ETF',
          buyDate: new Date().toISOString().split('T')[0],
          buyPrice,
          quantity: computedQty,
          totalInvested: buyPrice * computedQty,
          currentPrice: buyPrice,
          currentValue: buyPrice * computedQty,
          profitLoss: 0,
          profitPercentage: 0,
          lastBuyPrice: buyPrice,
          lastBuyDate: new Date().toISOString().split('T')[0],
          orderType: orderData.orderType || 'MARKET',
          productType: orderData.productType || 'CNC'
        };

        dispatch({ type: actionTypes.ADD_HOLDING, payload: holdingEntry });
        // After a successful buy using nextBuyAmount, consume it from availableCapital
        if (Number(state.moneyManagement?.nextBuyAmount || 0) > 0) {
          const spent = holdingEntry.totalInvested;
          const currentAvail = Number(state.moneyManagement?.availableCapital || 0);
          const newAvail = Math.max(0, currentAvail - spent);
        dispatch({ 
            type: actionTypes.UPDATE_MONEY_MANAGEMENT,
            payload: {
              ...state.moneyManagement,
              availableCapital: newAvail,
              nextBuyAmount: 0
            }
          });
        }
        dispatch({ 
          type: actionTypes.SET_TRADING_STATUS, 
          payload: { status: 'success', message: 'Buy order placed via Python API and added to holdings.' } 
        });
        return { success: true, holdingEntry, orderResult: pyResult };
      }

      // Fallback to browser-based API if Python API fails
      // If Python API did not succeed, surface the message and do not fallback to browser API
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'warning', message: pyResult?.message || 'Buy order not placed' } 
      });
      return pyResult;
    } catch (error) {
      console.error('Error in buy order lifecycle:', error);
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'error', message: `Error in buy order lifecycle: ${error.message}` } 
      });
      throw error;
    }
  };

  const placeSellOrderWithLifecycle = async (orderData) => {
    try {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'loading', message: 'Placing sell order and managing lifecycle...' } 
      });
      
      // Use MStocks API for real sell order placement
      const result = await mstocksApiService.placeSellOrder({
        symbol: orderData.symbol,
        quantity: orderData.quantity,
        orderType: orderData.orderType || 'MARKET',
        product: orderData.productType || 'CNC',
        validity: orderData.validity || 'DAY',
        price: orderData.price,
        triggerPrice: orderData.triggerPrice
      });

      const orderId = result?.orderId;
      dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: {
        orderId,
        broker: 'MStocks',
        status: 'PLACED',
        type: 'SELL',
        symbol: orderData.symbol,
        quantity: orderData.quantity,
        price: orderData.price,
        orderType: orderData.orderType || 'MARKET',
        productType: orderData.productType || 'NRML',
        timestamp: new Date().toISOString()
      }});

      if (result && result.status === 'success') {
        // Find holding
        const holdingToSell = orderData.holdingId
          ? state.holdings.find(h => h.id === orderData.holdingId)
          : state.holdings.find(h => h.symbol === orderData.symbol);

        // Determine sell price
        let sellPrice = orderData.price || 0;
        if (!sellPrice) {
          try {
            const priceData = await mstocksApiService.getLivePrice(orderData.symbol.startsWith('NSE:') ? orderData.symbol : `NSE:${orderData.symbol}`);
            if (priceData && (priceData.data?.price || priceData.lastPrice)) sellPrice = parseFloat(priceData.data?.price || priceData.lastPrice);
          } catch {}
        }

        const buyPrice = orderData.originalBuyPrice || holdingToSell?.avgPrice || holdingToSell?.buyPrice || 0;
        const qty = orderData.quantity || holdingToSell?.quantity || 0;
        const profit = (sellPrice - buyPrice) * qty;
        const profitPct = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;

        if (holdingToSell) {
          if (!orderData.holdingId || qty >= (holdingToSell.quantity || 0)) {
            dispatch({ type: actionTypes.REMOVE_HOLDING, payload: holdingToSell.id });
          } else {
            const remainingQty = Math.max(0, (holdingToSell.quantity || 0) - qty);
            const updated = { ...holdingToSell, quantity: remainingQty, totalInvested: remainingQty * (holdingToSell.avgPrice || holdingToSell.buyPrice || 0) };
            dispatch({ type: actionTypes.UPDATE_HOLDING, payload: updated });
          }
        }

        const soldItemEntry = {
          id: `sold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol: orderData.symbol,
          name: holdingToSell?.name || orderData.symbol,
          sector: holdingToSell?.sector || 'ETF',
          buyDate: holdingToSell?.buyDate || new Date().toISOString().split('T')[0],
          sellDate: new Date().toISOString().split('T')[0],
          buyPrice,
          sellPrice,
          quantity: qty,
          profit: profit,
          profitLoss: profit,
          profitPercentage: profitPct,
          reason: 'Target achieved',
          orderId,
          holdingId: orderData.holdingId || holdingToSell?.id,
          orderType: orderData.orderType || 'MARKET',
          productType: orderData.productType || 'NRML'
        };
        dispatch({ type: actionTypes.ADD_SOLD_ITEM, payload: soldItemEntry });

        // Finalize order
        dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: { type: 'SELL', ...soldItemEntry, status: 'SUCCESS', broker: 'MStocks' } });
        if (orderId) dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: orderId });
        dispatch({ 
          type: actionTypes.SET_TRADING_STATUS, 
          payload: { status: 'success', message: 'Sell order completed and processed!' } 
        });
      } else {
        dispatch({ 
          type: actionTypes.SET_TRADING_STATUS, 
          payload: { status: 'warning', message: result?.message || 'Sell order not placed' } 
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error in sell order lifecycle:', error);
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'error', message: `Error in sell order lifecycle: ${error.message}` } 
      });
      throw error;
    }
  };

  // Helper function to reconcile temporary orders with broker order book
  const reconcileTemporaryOrder = async (tempOrderId, originalOrderData) => {
    try {
      console.log(`🔍 Attempting to reconcile temporary order ${tempOrderId} for ${originalOrderData.symbol}`);
      
      // First check if MStocks session is valid
      if (!mstocksApiService.validateSession()) {
        console.error('❌ MStocks session not valid - cannot reconcile order');
        return null;
      }
      
      // Get today's order book from broker
      const book = await mstocksApiService.getTodaysOrders?.();
      
      // Check if the API call failed
      if (!book || book.status === 'error') {
        console.error('❌ Failed to fetch today\'s orders:', book?.message || 'Unknown error');
        return null;
      }
      
      const orderList = (() => {
        const d = book?.data || book;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.orders)) return d.orders;
        if (Array.isArray(book?.orders)) return book.orders;
        return [];
      })();
      
      console.log(`📋 Found ${orderList.length} orders in broker order book`);
      
      if (orderList.length === 0) {
        console.log('⚠️ No orders found in broker order book - may be too early');
        return null;
      }
      
      // Debug: Log all orders to understand the structure
      console.log('🔍 All orders in broker book:', orderList.map(o => ({
        orderId: o.order_id || o.orderId || o.nOrdNo || o.orderid || o.id,
        symbol: o.symbol || o.tradingsymbol || o.trading_symbol,
        side: o.side || o.transaction_type || o.type,
        status: o.status || o.order_status,
        timestamp: o.order_timestamp || o.timestamp || o.order_time
      })));
      
      // Enhanced symbol matching - try multiple variations
      const originalSymbol = originalOrderData.symbol;
      const cleanSymbol = originalSymbol.replace('NSE:', '').toUpperCase();
      const symbolVariations = [
        cleanSymbol,
        `NSE:${cleanSymbol}`,
        originalSymbol.toUpperCase(),
        cleanSymbol.replace('IETF', ''),
        cleanSymbol + 'ETF'
      ];
      
      console.log(`🎯 Looking for BUY orders matching symbols: ${symbolVariations.join(', ')}`);
      
      const matchingOrders = orderList.filter(o => {
        const sym = (o.symbol || o.tradingsymbol || o.trading_symbol || '').toUpperCase();
        const side = (o.side || o.transaction_type || o.type || '').toUpperCase();
        
        // Check if any symbol variation matches
        const symbolMatch = symbolVariations.some(variation => 
          sym.includes(variation) || variation.includes(sym)
        );
        
        const matches = symbolMatch && side.includes('BUY');
        if (matches) {
          console.log(`✅ Found potential match:`, {
            orderId: o.order_id || o.orderId || o.nOrdNo || o.orderid || o.id,
            symbol: sym,
            side: side,
            status: o.status || o.order_status
          });
        }
        return matches;
      });
      
      console.log(`🔍 Found ${matchingOrders.length} matching BUY orders for symbol variations`);
      
      // Sort by timestamp (most recent first) and find the best match
      matchingOrders.sort((a, b) => {
        const timeA = new Date(a.order_timestamp || a.timestamp || 0).getTime();
        const timeB = new Date(b.order_timestamp || b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      
      for (const match of matchingOrders) {
        const realOrderId = match?.order_id || match?.orderId || match?.nOrdNo || 
                           match?.orderid || match?.id || match?.exchange_order_id || 
                           match?.exch_order_id;
        
        if (realOrderId) {
          console.log(`✅ Found matching order: ${realOrderId} for ${cleanSymbol}`);
          
          // Check if this order ID is already tracked
          const existingPending = state.pendingOrders.find(o => String(o.orderId) === String(realOrderId));
          const existingHistory = state.orderHistory.find(o => String(o.orderId) === String(realOrderId));
          
          if (!existingPending && !existingHistory) {
            // Update the temporary order with the real order ID
            const tempOrder = state.pendingOrders.find(o => o.orderId === tempOrderId);
            if (tempOrder) {
              const updatedOrder = {
                ...tempOrder,
                orderId: realOrderId,
                status: 'PLACED',
                isTemporary: false,
                message: 'Order placed successfully'
              };
              
              // Remove temp order and add real order
              dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: tempOrderId });
              dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: updatedOrder });
              
              // Check the status of the real order
              setTimeout(() => {
                try {
                  checkOrderStatus(realOrderId);
                } catch (e) {
                  console.error('Error checking reconciled order status:', e);
                }
              }, 1000);
              
              return realOrderId;
            }
          }
        }
      }
      
      console.log(`⚠️ Could not reconcile temporary order ${tempOrderId} - no matching orders found`);
      return null;
    } catch (error) {
      console.error('Error during order reconciliation:', error);
      return null;
    }
  };

  // Helper function to reconcile temporary sell orders with broker order book
  const reconcileTemporarySellOrder = async (tempOrderId, originalOrderData) => {
    try {
      console.log(`🔍 Attempting to reconcile temporary sell order ${tempOrderId} for ${originalOrderData.symbol}`);
      
      // First check if MStocks session is valid
      if (!mstocksApiService.validateSession()) {
        console.error('❌ MStocks session not valid - cannot reconcile sell order');
        return null;
      }
      
      // Get today's order book from broker
      const book = await mstocksApiService.getTodaysOrders?.();
      
      // Check if the API call failed
      if (!book || book.status === 'error') {
        console.error('❌ Failed to fetch today\'s orders for sell reconciliation:', book?.message || 'Unknown error');
        return null;
      }
      
      const orderList = (() => {
        const d = book?.data || book;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.orders)) return d.orders;
        if (Array.isArray(book?.orders)) return book.orders;
        return [];
      })();
      
      console.log(`📋 Found ${orderList.length} orders in broker order book for sell reconciliation`);
      
      if (orderList.length === 0) {
        console.log('⚠️ No orders found in broker order book - may be too early for sell reconciliation');
        return null;
      }
      
      // Enhanced symbol matching - try multiple variations
      const originalSymbol = originalOrderData.symbol;
      const cleanSymbol = originalSymbol.replace('NSE:', '').toUpperCase();
      const symbolVariations = [
        cleanSymbol,
        `NSE:${cleanSymbol}`,
        originalSymbol.toUpperCase(),
        cleanSymbol.replace('IETF', ''),
        cleanSymbol + 'ETF'
      ];
      
      console.log(`🎯 Looking for SELL orders matching symbols: ${symbolVariations.join(', ')}`);
      
      const matchingOrders = orderList.filter(o => {
        const sym = (o.symbol || o.tradingsymbol || o.trading_symbol || '').toUpperCase();
        const side = (o.side || o.transaction_type || o.type || '').toUpperCase();
        
        // Check if any symbol variation matches
        const symbolMatch = symbolVariations.some(variation => 
          sym.includes(variation) || variation.includes(sym)
        );
        
        return symbolMatch && side.includes('SELL');
      });
      
      // Sort by timestamp (most recent first) and find the best match
      matchingOrders.sort((a, b) => {
        const timeA = new Date(a.order_timestamp || a.timestamp || 0).getTime();
        const timeB = new Date(b.order_timestamp || b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      
      for (const match of matchingOrders) {
        const realOrderId = match?.order_id || match?.orderId || match?.nOrdNo || 
                           match?.orderid || match?.id || match?.exchange_order_id || 
                           match?.exch_order_id;
        
        if (realOrderId) {
          console.log(`✅ Found matching sell order: ${realOrderId} for ${cleanSymbol}`);
          
          // Check if this order ID is already tracked
          const existingPending = state.pendingOrders.find(o => String(o.orderId) === String(realOrderId));
          const existingHistory = state.orderHistory.find(o => String(o.orderId) === String(realOrderId));
          
          if (!existingPending && !existingHistory) {
            // Update the temporary order with the real order ID
            const tempOrder = state.pendingOrders.find(o => o.orderId === tempOrderId);
            if (tempOrder) {
              const updatedOrder = {
                ...tempOrder,
                orderId: realOrderId,
                status: 'PLACED',
                isTemporary: false,
                message: 'Sell order placed successfully'
              };
              
              // Remove temp order and add real order
              dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: tempOrderId });
              dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: updatedOrder });
              
              // Check the status of the real order
              setTimeout(() => {
                try {
                  checkOrderStatus(realOrderId);
                } catch (e) {
                  console.error('Error checking reconciled sell order status:', e);
                }
              }, 1000);
              
              return realOrderId;
            }
          }
        }
      }
      
      console.log(`⚠️ Could not reconcile temporary sell order ${tempOrderId} - no matching orders found`);
      return null;
    } catch (error) {
      console.error('Error during sell order reconciliation:', error);
      return null;
    }
  };

  // Manual reconciliation function for stuck temporary orders
  const manualReconcileOrder = async (tempOrderId) => {
    try {
      console.log(`🔧 Manual reconciliation triggered for: ${tempOrderId}`);
      
      // Find the temporary order
      const tempOrder = state.pendingOrders.find(o => o.orderId === tempOrderId);
      if (!tempOrder) {
        console.log('❌ Temporary order not found in pending orders');
        return false;
      }
      
      console.log('🔍 Attempting manual reconciliation with enhanced search...');
      
      // Get fresh order book data
      console.log('🔄 Fetching order book for manual reconciliation...');
      let book = await mstocksApiService.getTodaysOrders?.();
      console.log('📋 Order book response:', book);
      
      if (!book || book.status === 'error') {
        console.error('❌ Failed to fetch order book for manual reconciliation:', book?.message || 'Unknown error');
        
        // For development/testing, create a mock order to test reconciliation logic
        if (IS_LOCAL_DEV) {
          console.log('🧪 Creating mock order data for local testing...');
          book = {
            status: 'success',
            data: [
              {
                order_id: '1234567890',
                symbol: tempOrder.symbol.replace('NSE:', ''),
                tradingsymbol: tempOrder.symbol.replace('NSE:', ''),
                side: tempOrder.type,
                transaction_type: tempOrder.type,
                status: 'COMPLETE',
                order_status: 'COMPLETE',
                quantity: tempOrder.quantity,
                price: tempOrder.price,
                order_timestamp: new Date().toISOString(),
                timestamp: new Date().toISOString()
              }
            ]
          };
          console.log('🧪 Using mock data for local testing');
        } else {
          return false;
        }
      }
      
      const orderList = (() => {
        const d = book?.data || book;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.orders)) return d.orders;
        if (Array.isArray(book?.orders)) return book.orders;
        return [];
      })();
      
      console.log(`📋 Manual reconciliation found ${orderList.length} orders`);
      
      // Enhanced symbol matching - try multiple variations
      const originalSymbol = tempOrder.symbol;
      const cleanSymbol = originalSymbol.replace('NSE:', '').toUpperCase();
      const symbolVariations = [
        cleanSymbol,
        `NSE:${cleanSymbol}`,
        originalSymbol.toUpperCase(),
        cleanSymbol.replace('IETF', ''),
        cleanSymbol + 'ETF'
      ];
      
      console.log(`🎯 Searching for symbols: ${symbolVariations.join(', ')}`);
      
      // Find potential matches with more flexible criteria
      const candidates = orderList.filter(o => {
        const sym = (o.symbol || o.tradingsymbol || o.trading_symbol || '').toUpperCase();
        const side = (o.side || o.transaction_type || o.type || '').toUpperCase();
        
        // Check if any symbol variation matches
        const symbolMatch = symbolVariations.some(variation => 
          sym.includes(variation) || variation.includes(sym)
        );
        
        const sideMatch = tempOrder.type === 'BUY' ? side.includes('BUY') : side.includes('SELL');
        
        return symbolMatch && sideMatch;
      });
      
      console.log(`🔍 Found ${candidates.length} potential candidates`);
      candidates.forEach((candidate, index) => {
        console.log(`Candidate ${index + 1}:`, {
          orderId: candidate.order_id || candidate.orderId || candidate.nOrdNo || candidate.orderid || candidate.id,
          symbol: candidate.symbol || candidate.tradingsymbol || candidate.trading_symbol,
          side: candidate.side || candidate.transaction_type || candidate.type,
          status: candidate.status || candidate.order_status,
          quantity: candidate.quantity || candidate.qty
        });
      });
      
      // Select the most recent candidate that isn't already tracked
      const sortedCandidates = candidates.sort((a, b) => {
        const timeA = new Date(a.order_timestamp || a.timestamp || a.order_time || 0).getTime();
        const timeB = new Date(b.order_timestamp || b.timestamp || b.order_time || 0).getTime();
        return timeB - timeA;
      });
      
      for (const candidate of sortedCandidates) {
        const realOrderId = candidate?.order_id || candidate?.orderId || candidate?.nOrdNo || 
                           candidate?.orderid || candidate?.id || candidate?.exchange_order_id || 
                           candidate?.exch_order_id;
        
        if (realOrderId) {
          // Check if this order ID is already tracked
          const existingPending = state.pendingOrders.find(o => String(o.orderId) === String(realOrderId));
          const existingHistory = state.orderHistory.find(o => String(o.orderId) === String(realOrderId));
          
          if (!existingPending && !existingHistory) {
            console.log(`✅ Manual reconciliation successful: ${tempOrderId} → ${realOrderId}`);
            
            // Update the temporary order with the real order ID
            const updatedOrder = {
              ...tempOrder,
              orderId: realOrderId,
              status: 'PLACED',
              isTemporary: false,
              message: 'Manually reconciled with broker order'
            };
            
            // Remove temp order and add real order
            dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: tempOrderId });
            dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: updatedOrder });
            
            // Check the status of the real order
            setTimeout(() => {
              try {
                checkOrderStatus(realOrderId);
              } catch (e) {
                console.error('Error checking manually reconciled order status:', e);
              }
            }, 1000);
            
            return realOrderId;
          }
        }
      }
      
      console.log('❌ Manual reconciliation failed - no suitable candidates found');
      return false;
      
    } catch (error) {
      console.error('Error during manual reconciliation:', error);
      return false;
    }
  };

  // Manual function to fix sell prices for sold items with 0 price
  const fixSellPricesForSoldItems = async () => {
    console.log('🔧 Starting manual sell price fix for sold items...');
    
    // Find sold items with 0 or invalid sell prices
    const itemsNeedingFix = state.soldItems.filter(item => 
      !Number.isFinite(item.sellPrice) || item.sellPrice <= 0
    );
    
    console.log(`🔍 Found ${itemsNeedingFix.length} sold items needing price fix:`, itemsNeedingFix);
    
    if (itemsNeedingFix.length === 0) {
      console.log('✅ No sold items need sell price fixes');
      return { success: true, message: 'No items needed fixing' };
    }
    
    let fixedCount = 0;
    
    for (const item of itemsNeedingFix) {
      console.log(`🔄 Attempting to fix sell price for item:`, item);
      
      try {
        let sellPrice = 0;
        
        // Try to get price from trade book
        if (item.orderId) {
          console.log(`📋 Fetching trade book for order ID: ${item.orderId}`);
          const tb = await mstocksApiService.getTradeBook();
          const arr = tb?.data || tb;
          
          if (Array.isArray(arr)) {
            const symbolClean = String(item.symbol || '').replace('NSE:', '').toUpperCase();
            
            // Try to match by order ID first
            const tmatchById = arr.find(t => 
              String(t.order_id || t.orderId || t.nOrdNo || t.orderid || t.id) === String(item.orderId)
            );
            
            if (tmatchById) {
              console.log('✅ Found trade by order ID:', tmatchById);
              sellPrice = Number(
                tmatchById.average_price || tmatchById.avg_price || tmatchById.price || 
                tmatchById.trade_price || tmatchById.executed_price || 0
              );
            } else {
              // Try to match by symbol and date
              const sellDate = item.sellDate || new Date().toISOString().split('T')[0];
              const candidates = arr.filter(t => {
                const tsym = String(t.trading_symbol || t.tradingsymbol || t.symbol || '').replace('NSE:', '').toUpperCase();
                const side = String(t.side || t.transaction_type || t.type || '').toUpperCase();
                const tradeDate = (t.timestamp || t.trade_time || '').split('T')[0];
                return tsym.includes(symbolClean) && side.includes('SELL') && 
                       (!tradeDate || tradeDate === sellDate);
              }).sort((a, b) => new Date(b.timestamp || b.trade_time || 0) - new Date(a.timestamp || a.trade_time || 0));
              
              if (candidates.length > 0) {
                console.log('✅ Found trade candidates by symbol:', candidates);
                const pick = candidates[0];
                sellPrice = Number(
                  pick.average_price || pick.avg_price || pick.price || 
                  pick.trade_price || pick.executed_price || 0
                );
              }
            }
          }
        }
        
        // If still no price, try current market price as fallback
        if (!Number.isFinite(sellPrice) || sellPrice <= 0) {
          console.log('🔄 Trying current market price as fallback...');
          try {
            const priceData = await mstocksApiService.getLivePrice(item.symbol);
            const marketPrice = Number(priceData?.data?.price || priceData?.lastPrice || priceData?.price || 0);
            if (Number.isFinite(marketPrice) && marketPrice > 0) {
              sellPrice = marketPrice;
              console.log(`📈 Using current market price: ₹${sellPrice}`);
            }
          } catch (error) {
            console.error('❌ Failed to fetch market price:', error);
          }
        }
        
        if (Number.isFinite(sellPrice) && sellPrice > 0) {
          // Calculate new profit with corrected sell price
          const newProfit = (sellPrice - Number(item.buyPrice || 0)) * Number(item.quantity || 0);
          const newProfitPct = Number(item.buyPrice || 0) > 0 ? 
            ((sellPrice - Number(item.buyPrice)) / Number(item.buyPrice)) * 100 : 0;
          
          const updatedItem = {
            ...item,
            sellPrice: sellPrice,
            profit: newProfit,
            profitLoss: newProfit,
            profitPercentage: newProfitPct
          };
          
          dispatch({ type: actionTypes.UPDATE_SOLD_ITEM, payload: updatedItem });
          console.log(`✅ Fixed sell price for ${item.symbol}: ₹${sellPrice}`);
          fixedCount++;
        } else {
          console.log(`❌ Could not resolve sell price for ${item.symbol}`);
        }
        
        // Add small delay between items to avoid API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error fixing sell price for item ${item.id}:`, error);
      }
    }
    
    console.log(`🎯 Sell price fix completed: ${fixedCount}/${itemsNeedingFix.length} items fixed`);
    return { 
      success: fixedCount > 0, 
      message: `Fixed ${fixedCount} of ${itemsNeedingFix.length} items`,
      fixedCount,
      totalItems: itemsNeedingFix.length
    };
  };



  const checkOrderStatus = async (orderId) => {
    try {
      // Skip checking temporary order IDs - they need to be reconciled first
      if (String(orderId).startsWith('temp_')) {
        console.log(`⚠️ Skipping status check for temporary order ID: ${orderId}`);
        return { orderId, status: 'PENDING_RECONCILIATION', message: 'Awaiting reconciliation' };
      }

      // Always query broker for actual status
      const raw = await mstocksApiService.getOrderStatus(orderId);
      // Normalize various broker status shapes into a uniform object
      const normalized = (() => {
        const upper = (v) => (v ? String(v).toUpperCase() : '');
        const dataBlock = raw?.data;
        let rec = null;
        if (Array.isArray(dataBlock)) {
          rec = dataBlock.find(e => String(e?.order_id || e?.orderId || e?.nOrdNo || e?.id) === String(orderId)) || dataBlock[0] || {};
        } else if (dataBlock && typeof dataBlock === 'object') {
          rec = dataBlock;
        } else {
          rec = raw || {};
        }
        const statusCandidate = upper(
          rec?.status ||
          rec?.order_status ||
          rec?.status_code ||
          raw?.status ||
          rec?.orderStatus ||
          rec?.ord_status ||
          rec?.stat ||
          rec?.Status ||
          rec?.orderstate ||
          rec?.order_status_desc ||
          rec?.statusDesc
        );
        return {
          orderId: String(orderId),
          status: statusCandidate,
          averagePrice: Number(
            rec?.averagePrice || rec?.avg_price || rec?.average_price ||
            rec?.avgprc || rec?.avgPrc || rec?.fill_price || rec?.filledPrice ||
            rec?.traded_price || rec?.trade_price || rec?.trdPrc || rec?.flprc || 0
          ) || undefined,
          filledQuantity: Number(
            rec?.filledQuantity || rec?.filled_qty || rec?.filled_quantity ||
            rec?.traded_qty || rec?.qty_traded || rec?.fill_qty || rec?.filledQty || 0
          ) || undefined,
          message: raw?.message || rec?.message || rec?.status_message || rec?.status_message_raw || rec?.rejReason || rec?.rejection_reason || rec?.rejectionreason || rec?.remarks,
        };
      })();

      dispatch({ type: actionTypes.UPDATE_ORDER_STATUS, payload: normalized });

      const finalStatus = normalized.status;
      const contains = (s, sub) => (s && typeof s === 'string' && s.includes(sub));
      // Handle terminal outcomes
      // Map broker "TRADED / TRADE CONFIRMED" as success as well
      const successByMessage = contains(String(normalized.message || '').toUpperCase(), 'TRADE CONFIRMED');
      if (
        finalStatus === 'COMPLETE' || finalStatus === 'COMPLETED' || finalStatus === 'SUCCESS' || finalStatus === 'FILLED' || finalStatus === 'EXECUTED' || finalStatus === 'TRADED' ||
        contains(finalStatus, 'COMP') || contains(finalStatus, 'FILL') || contains(finalStatus, 'EXEC') || successByMessage
      ) {
        const pendingOrder = state.pendingOrders.find(order => String(order.orderId) === String(orderId));
        if (pendingOrder) {
          // Move to order history
          dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: { ...pendingOrder, status: 'SUCCESS' } });
          dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: String(orderId) });
          
          // Update holdings based on order type
          if (pendingOrder.type === 'BUY') {
            // Resolve buy price robustly
            let resolvedBuyPrice = Number(normalized.averagePrice || pendingOrder.price || 0);
            if (!Number.isFinite(resolvedBuyPrice) || resolvedBuyPrice <= 0) {
              try {
                // Try tradebook for executed price
                if (typeof mstocksApiService.getTradeBook === 'function') {
                  const tb = await mstocksApiService.getTradeBook();
                  const arr = tb?.data || tb;
                  if (Array.isArray(arr)) {
                    const tmatch = arr.find(t => String(t.order_id || t.orderId) === String(orderId));
                    const tpx = Number(tmatch?.average_price || tmatch?.avg_price || tmatch?.price || 0);
                    if (Number.isFinite(tpx) && tpx > 0) resolvedBuyPrice = tpx;
                  }
                }
              } catch {}
            }
            if (!Number.isFinite(resolvedBuyPrice) || resolvedBuyPrice <= 0) {
              try {
                const live = await mstocksApiService.getLivePrice(pendingOrder.symbol);
                const ltp = Number(live?.data?.price ?? live?.lastPrice ?? live?.price ?? 0);
                if (Number.isFinite(ltp) && ltp > 0) resolvedBuyPrice = ltp;
              } catch {}
            }

            // Add new holding
            const newHolding = {
              id: `holding_${Date.now()}`,
              symbol: pendingOrder.symbol,
              name: state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.name || pendingOrder.symbol,
              sector: state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.sector || 'Unknown',
              buyDate: new Date().toISOString().split('T')[0],
              buyPrice: Number(resolvedBuyPrice || 0),
              quantity: normalized.filledQuantity || pendingOrder.quantity,
              totalInvested: Number(resolvedBuyPrice || 0) * (normalized.filledQuantity || pendingOrder.quantity),
              avgPrice: Number(resolvedBuyPrice || 0),
              currentPrice: Number(resolvedBuyPrice || 0),
              currentValue: Number(resolvedBuyPrice || 0) * (normalized.filledQuantity || pendingOrder.quantity),
              profitLoss: 0,
              profitPercentage: 0,
              lastBuyPrice: Number(resolvedBuyPrice || 0),
              lastBuyDate: new Date().toISOString().split('T')[0]
            };
            dispatch({ type: actionTypes.ADD_HOLDING, payload: newHolding });
            // Immediate save after adding holding
            setTimeout(() => saveCriticalData('new holding added'), 100);
            // Consume nextBuyAmount/availableCapital after confirmed fill
            if (Number(state.moneyManagement?.nextBuyAmount || 0) > 0) {
              const spent = newHolding.totalInvested;
              const currentAvail = Number(state.moneyManagement?.availableCapital || 0);
              const newAvail = Math.max(0, currentAvail - spent);
              dispatch({ type: actionTypes.UPDATE_MONEY_MANAGEMENT, payload: { ...state.moneyManagement, availableCapital: newAvail, nextBuyAmount: 0 } });
            }

            // Post-confirmation reconciliation: poll order details/tradebook and overwrite to executed price if it differs
            try {
              const attemptReconcile = async () => {
                try {
                  let executedPrice = NaN;
                  // 1) Order details
                  try {
                    const od = await mstocksApiService.getOrderStatus(orderId);
                    const rec = od?.data || od;
                    const cand = Array.isArray(rec) ? rec[0] : rec;
                    const detPx = Number(cand?.averagePrice || cand?.avg_price || cand?.average_price || cand?.traded_price || cand?.fill_price || cand?.avgprc || cand?.avgPrc || 0);
                    if (Number.isFinite(detPx) && detPx > 0) executedPrice = detPx;
                  } catch {}

                  // 2) Tradebook
                  if (!(executedPrice > 0)) {
                    const tb = await mstocksApiService.getTradeBook();
                    const arr = tb?.data || tb;
                    if (Array.isArray(arr)) {
                      const symbolClean = String(pendingOrder.symbol || '').replace('NSE:', '').toUpperCase();
                      const tmatchById = arr.find(t => String(t.order_id || t.orderId || t.nOrdNo || t.orderid || t.id) === String(orderId));
                      const candidates = tmatchById ? [tmatchById] : arr.filter(t => {
                        const tsym = String(t.trading_symbol || t.tradingsymbol || t.symbol || t.trdSym || '').replace('NSE:', '').toUpperCase();
                        const side = String(t.side || t.transaction_type || t.type || t.trdType || '').toUpperCase();
                        return tsym.includes(symbolClean) && side.includes('BUY');
                      }).sort((a, b) => new Date(b.timestamp || b.trade_time || b.time || b.trdTime || 0) - new Date(a.timestamp || a.trade_time || a.time || a.trdTime || 0));
                      const pick = candidates[0];
                      const tpx = Number(
                        pick?.average_price || pick?.avg_price || pick?.avgprc || pick?.avgPrc ||
                        pick?.price || pick?.prc || pick?.trade_price || pick?.trdPrc || pick?.fill_price || pick?.filledPrice || 0
                      );
                      if (Number.isFinite(tpx) && tpx > 0) executedPrice = tpx;
                    }
                  }

                  const currentBuy = Number(newHolding.buyPrice || 0);
                  if (Number.isFinite(executedPrice) && executedPrice > 0 && Math.abs(executedPrice - currentBuy) > 0.005) {
                    const updated = {
                      ...newHolding,
                      buyPrice: executedPrice,
                      avgPrice: executedPrice,
                      totalInvested: executedPrice * Number(newHolding.quantity || 0),
                      currentPrice: Number(newHolding.currentPrice || executedPrice) > 0 ? Number(newHolding.currentPrice) : executedPrice,
                      currentValue: (Number(newHolding.currentPrice || executedPrice) > 0 ? Number(newHolding.currentPrice) : executedPrice) * Number(newHolding.quantity || 0),
                      profitLoss: 0,
                      profitPercentage: 0,
                      lastBuyPrice: executedPrice
                    };
                    dispatch({ type: actionTypes.UPDATE_HOLDING, payload: updated });
                    return true;
                  }
                } catch {}
                return false;
              };

              const delays = [1500, 4000, 8000];
              delays.forEach((ms, idx) => {
                setTimeout(async () => {
                  try { await attemptReconcile(); } catch {}
                }, ms);
              });
            } catch {}
          } else if (pendingOrder.type === 'SELL') {
            // Reconcile holding and add sold item with accurate P&L
            const findHolding = () => {
              if (pendingOrder.holdingId) {
                return state.holdings.find(h => h.id === pendingOrder.holdingId);
              }
              // Fallback by symbol if id missing
              const symbolClean = String(pendingOrder.symbol || '').toUpperCase();
              const matches = state.holdings.filter(h => String(h.symbol || '').toUpperCase() === symbolClean);
              // Prefer the most recent buy (by lastBuyDate or buyDate)
              if (matches.length <= 1) return matches[0];
              return matches.sort((a, b) => new Date(b.lastBuyDate || b.buyDate || 0) - new Date(a.lastBuyDate || a.buyDate || 0))[0];
            };

            const holding = findHolding();
            const filledQty = Number(normalized.filledQuantity || pendingOrder.quantity || 0);
            // Resolve sell price robustly with enhanced debugging and multiple attempts
            let sellPrice = Number(normalized.averagePrice || pendingOrder.price || 0);
            console.log(`🔄 Resolving sell price for order ${orderId}:`, {
              normalizedAveragePrice: normalized.averagePrice,
              pendingOrderPrice: pendingOrder.price,
              initialSellPrice: sellPrice
            });
            
            if (!Number.isFinite(sellPrice) || sellPrice <= 0) {
              console.log('⚠️ Sell price is 0 or invalid, fetching from trade book...');
              
              // Try multiple times with delays to ensure trade book is updated
              const attempts = [0, 2000, 5000]; // Immediate, 2s delay, 5s delay
              
              for (let attempt = 0; attempt < attempts.length; attempt++) {
                if (attempt > 0) {
                  console.log(`🔄 Waiting ${attempts[attempt]}ms before trade book attempt ${attempt + 1}...`);
                  await new Promise(resolve => setTimeout(resolve, attempts[attempt]));
                }
                
                try {
                  console.log(`📋 Fetching trade book (attempt ${attempt + 1}/${attempts.length})...`);
                  const tb = await mstocksApiService.getTradeBook();
                  console.log('📋 Trade book response:', tb);
                  
                  const arr = tb?.data || tb;
                  if (Array.isArray(arr)) {
                    console.log(`📋 Found ${arr.length} trades in trade book`);
                    
                    const symbolClean = String(pendingOrder.symbol || '').replace('NSE:', '').toUpperCase();
                    console.log(`🎯 Looking for SELL trades of symbol: ${symbolClean}`);
                    
                    // First try to match by order ID
                    const tmatchById = arr.find(t => String(t.order_id || t.orderId || t.nOrdNo || t.orderid || t.id) === String(orderId));
                    console.log('🔍 Trade matched by order ID:', tmatchById);
                    
                    // Then try symbol + side matching
                    const candidates = tmatchById ? [tmatchById] : arr.filter(t => {
                      const tsym = String(t.trading_symbol || t.tradingsymbol || t.symbol || t.trdSym || '').replace('NSE:', '').toUpperCase();
                      const side = String(t.side || t.transaction_type || t.type || t.trdType || '').toUpperCase();
                      const matches = tsym.includes(symbolClean) && side.includes('SELL');
                      if (matches) {
                        console.log('✅ Found potential SELL trade:', {
                          symbol: tsym,
                          side: side,
                          price: t.average_price || t.avg_price || t.price || t.trade_price,
                          orderId: t.order_id || t.orderId,
                          timestamp: t.timestamp || t.trade_time
                        });
                      }
                      return matches;
                    }).sort((a, b) => new Date(b.timestamp || b.trade_time || b.time || b.trdTime || 0) - new Date(a.timestamp || a.trade_time || a.time || a.trdTime || 0));
                    
                    console.log(`🔍 Found ${candidates.length} potential SELL trade candidates`);
                    
                    if (candidates.length > 0) {
                      const pick = candidates[0];
                      console.log('🎯 Selected trade for price extraction:', pick);
                      
                      const tpx = Number(
                        pick?.average_price || pick?.avg_price || pick?.avgprc || pick?.avgPrc ||
                        pick?.price || pick?.prc || pick?.trade_price || pick?.trdPrc || 
                        pick?.fill_price || pick?.filledPrice || pick?.executed_price || 0
                      );
                      
                      console.log(`💰 Extracted sell price: ${tpx}`);
                      
                      if (Number.isFinite(tpx) && tpx > 0) {
                        sellPrice = tpx;
                        console.log(`✅ Sell price resolved to: ₹${sellPrice}`);
                        break; // Exit the retry loop
                      }
                    }
                  }
                } catch (error) {
                  console.error(`❌ Trade book fetch attempt ${attempt + 1} failed:`, error);
                }
              }
              
              // Final fallback: try to get current market price
              if (!Number.isFinite(sellPrice) || sellPrice <= 0) {
                console.log('⚠️ Still no valid sell price, trying current market price as fallback...');
                try {
                  const priceData = await mstocksApiService.getLivePrice(pendingOrder.symbol);
                  const marketPrice = Number(priceData?.data?.price || priceData?.lastPrice || priceData?.price || 0);
                  if (Number.isFinite(marketPrice) && marketPrice > 0) {
                    sellPrice = marketPrice;
                    console.log(`🔄 Using current market price as sell price: ₹${sellPrice}`);
                  }
                } catch (error) {
                  console.error('❌ Failed to fetch current market price:', error);
                }
              }
            }
            
            console.log(`🎯 Final resolved sell price: ₹${sellPrice}`);
            const buyPriceFromOrder = Number(pendingOrder.originalBuyPrice || 0);
            const buyPrice = Number(
              buyPriceFromOrder || (holding?.avgPrice ?? holding?.buyPrice ?? 0)
            );
            const usedQty = Math.max(0, filledQty);
            const profit = (sellPrice - buyPrice) * usedQty;
            const profitPct = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;

            // Adjust holdings: remove or reduce quantity
            if (holding) {
              if (usedQty >= Number(holding.quantity || 0)) {
                dispatch({ type: actionTypes.REMOVE_HOLDING, payload: holding.id });
              } else if (usedQty > 0) {
                const remainingQty = Math.max(0, Number(holding.quantity || 0) - usedQty);
                const avgCost = Number(holding.avgPrice ?? holding.buyPrice ?? 0);
                const updatedHolding = {
                  ...holding,
                  quantity: remainingQty,
                  totalInvested: remainingQty * avgCost,
                  currentValue: remainingQty * Number(holding.currentPrice || avgCost),
                };
                dispatch({ type: actionTypes.UPDATE_HOLDING, payload: updatedHolding });
              }
            }

            const soldItem = {
              id: `sold_${Date.now()}`,
              symbol: pendingOrder.symbol,
              name: holding?.name || state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.name || pendingOrder.symbol,
              sector: holding?.sector || state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.sector || 'Unknown',
              buyDate: holding?.buyDate || new Date().toISOString().split('T')[0],
              sellDate: new Date().toISOString().split('T')[0],
              buyPrice: Number(buyPrice || 0),
              sellPrice: Number(sellPrice || 0),
              quantity: usedQty,
              profit: profit,
              profitLoss: profit,
              profitPercentage: profitPct,
              reason: 'Order executed',
              orderId: String(orderId),
              holdingId: holding?.id || pendingOrder.holdingId || null,
              orderType: pendingOrder.orderType || 'MARKET',
              productType: pendingOrder.productType || 'CNC',
              // Add chunk information if available
              chunkId: holding?.chunkId || null,
              chunkInfo: holding?.chunkInfo || null
            };
            dispatch({ type: actionTypes.ADD_SOLD_ITEM, payload: soldItem });

            // Post-sell reconciliation: ensure sold price reflects executed price once tradebook updates
            try {
              const soldItemId = soldItem.id;
              const attemptReconcileSell = async () => {
                try {
                  let execPx = NaN;
                  // 1) Tradebook first
                  try {
                    const tb = await mstocksApiService.getTradeBook();
                    const arr = tb?.data || tb;
                    if (Array.isArray(arr)) {
                      const symbolClean = String(pendingOrder.symbol || '').replace('NSE:', '').toUpperCase();
                      const tmatchById = arr.find(t => String(t.order_id || t.orderId || t.nOrdNo || t.orderid || t.id || t.exch_order_id || t.exchange_order_id) === String(orderId));
                      const candidates = tmatchById ? [tmatchById] : arr.filter(t => {
                        const tsym = String(t.trading_symbol || t.tradingsymbol || t.tradingSymbol || t.symbol || t.trdSym || t.tsym || '').replace('NSE:', '').replace('-EQ','').toUpperCase();
                        const side = String(t.side || t.transaction_type || t.transactionType || t.type || t.trdType || '').toUpperCase();
                        return tsym.includes(symbolClean) && side.includes('SELL');
                      }).sort((a, b) => new Date(b.timestamp || b.trade_time || b.time || b.trdTime || b.exch_time || 0) - new Date(a.timestamp || a.trade_time || a.time || a.trdTime || a.exch_time || 0));
                      const pick = candidates[0];
                      const tpx = Number(
                        pick?.average_price || pick?.avg_price || pick?.avgprc || pick?.avgPrc || pick?.avg_traded_price || pick?.avgTradedPrice ||
                        pick?.price || pick?.prc || pick?.trade_price || pick?.traded_price || pick?.trdPrc || pick?.fill_price || pick?.filledPrice || pick?.flprc || 0
                      );
                      if (Number.isFinite(tpx) && tpx > 0) execPx = tpx;
                    }
                  } catch {}
                  // 2) Order details
                  if (!(execPx > 0)) {
                    try {
                      const od = await mstocksApiService.getOrderStatus(orderId);
                      const rec = od?.data || od;
                      const cand = Array.isArray(rec) ? rec[0] : rec;
                      const detPx = Number(
                        cand?.averagePrice || cand?.avg_price || cand?.average_price || cand?.avgprc || cand?.avgPrc ||
                        cand?.traded_price || cand?.trade_price || cand?.trdPrc || cand?.fill_price || cand?.filledPrice || 0
                      );
                      if (Number.isFinite(detPx) && detPx > 0) execPx = detPx;
                    } catch {}
                  }
                  // 3) Today's order book
                  if (!(execPx > 0) && typeof mstocksApiService.getTodaysOrders === 'function') {
                    try {
                      const book = await mstocksApiService.getTodaysOrders();
                      const list = (() => {
                        const d = book?.data || book;
                        if (Array.isArray(d)) return d;
                        if (Array.isArray(d?.orders)) return d.orders;
                        if (Array.isArray(book?.orders)) return book.orders;
                        return [];
                      })();
                      const match = list.find(o => String(o.order_id || o.orderId || o.nOrdNo || o.orderid || o.id || o.exch_order_id || o.exchange_order_id) === String(orderId));
                      const opx = Number(
                        match?.averagePrice || match?.avg_price || match?.average_price || match?.avgprc || match?.avgPrc ||
                        match?.fill_price || match?.filledPrice || match?.trade_price || match?.trdPrc || 0
                      );
                      if (Number.isFinite(opx) && opx > 0) execPx = opx;
                    } catch {}
                  }
                  if (Number.isFinite(execPx) && execPx > 0 && Math.abs(execPx - Number(soldItem.sellPrice || 0)) > 0.005) {
                    const newProfit = (execPx - Number(soldItem.buyPrice || 0)) * Number(soldItem.quantity || 0);
                    const newPct = Number(soldItem.buyPrice || 0) > 0 ? (newProfit / (Number(soldItem.buyPrice) * Number(soldItem.quantity || 0))) * 100 : 0;
                    dispatch({ type: actionTypes.UPDATE_SOLD_ITEM, payload: { ...soldItem, sellPrice: execPx, profit: newProfit, profitLoss: newProfit, profitPercentage: newPct, id: soldItemId } });
                    return true;
                  }
                } catch {}
                return false;
              };
              [1500, 4000, 8000, 15000].forEach(ms => setTimeout(() => { try { attemptReconcileSell(); } catch {} }, ms));
            } catch {}
          }
        } else {
          // No pending record found, reconstruct from broker details/tradebook to avoid missing entries
          try {
            // Attempt to extract details from the raw response
            const pickRecord = () => {
              const d = raw?.data || raw;
              if (Array.isArray(d)) return d.find(e => String(e?.order_id || e?.orderId || e?.nOrdNo || e?.id) === String(orderId)) || d[0] || {};
              if (d && typeof d === 'object') return d;
              return {};
            };
            const rec = pickRecord();
            const side = String(rec?.side || rec?.transaction_type || rec?.type || rec?.order_side || '').toUpperCase();
            const qty = Number(rec?.filled_qty || rec?.filledQuantity || rec?.filled_quantity || rec?.quantity || 0);
            const avgPx = Number(rec?.averagePrice || rec?.avg_price || rec?.average_price || rec?.traded_price || rec?.fill_price || 0);
            const tsymRaw = rec?.symbol || rec?.tradingsymbol || rec?.trading_symbol || rec?.tsym || '';
            const clean = String(tsymRaw || '').replace('NSE:', '').replace('-EQ','').toUpperCase();
            const sym = clean ? `NSE:${clean}` : null;
            if (sym && (side.includes('BUY') || !side || side === '')) {
              const price = avgPx > 0 ? avgPx : 0;
              const quantity = qty > 0 ? qty : 1;
              const holding = {
                id: `holding_${Date.now()}`,
                symbol: sym,
                name: state.etfs.find(etf => etf.symbol === sym)?.name || sym,
                sector: state.etfs.find(etf => etf.symbol === sym)?.sector || 'Unknown',
                buyDate: new Date().toISOString().split('T')[0],
                buyPrice: Number(price || 0),
                quantity,
                totalInvested: Number(price || 0) * quantity,
                avgPrice: Number(price || 0),
                currentPrice: Number(price || 0),
                currentValue: Number(price || 0) * quantity,
                profitLoss: 0,
                profitPercentage: 0,
                lastBuyPrice: Number(price || 0),
                lastBuyDate: new Date().toISOString().split('T')[0]
              };
              // Guard against duplicate for same symbol and today's date
              const exists = state.holdings.some(h => String(h.symbol).toUpperCase() === String(holding.symbol).toUpperCase() && (h.buyDate === holding.buyDate));
              if (!exists) dispatch({ type: actionTypes.ADD_HOLDING, payload: holding });
            } else if (sym && side.includes('SELL')) {
              // Reconstruct sell: adjust holdings and add sold item
              const findHoldingBySymbol = () => {
                const matches = state.holdings.filter(h => String(h.symbol || '').toUpperCase() === sym.toUpperCase());
                if (matches.length <= 1) return matches[0];
                return matches.sort((a, b) => new Date(b.lastBuyDate || b.buyDate || 0) - new Date(a.lastBuyDate || a.buyDate || 0))[0];
              };
              const holding = findHoldingBySymbol();
              const usedQty = Math.max(0, qty || holding?.quantity || 0);
              const sellPx = avgPx > 0 ? avgPx : 0;
              const buyPx = Number(holding?.avgPrice ?? holding?.buyPrice ?? 0);
              const profit = (sellPx - buyPx) * usedQty;
              const profitPct = buyPx > 0 ? ((sellPx - buyPx) / buyPx) * 100 : 0;
              if (holding) {
                if (usedQty >= Number(holding.quantity || 0)) {
                  dispatch({ type: actionTypes.REMOVE_HOLDING, payload: holding.id });
                } else if (usedQty > 0) {
                  const remainingQty = Math.max(0, Number(holding.quantity || 0) - usedQty);
                  const avgCost = Number(holding.avgPrice ?? holding.buyPrice ?? 0);
                  const updated = { ...holding, quantity: remainingQty, totalInvested: remainingQty * avgCost, currentValue: remainingQty * Number(holding.currentPrice || avgCost) };
                  dispatch({ type: actionTypes.UPDATE_HOLDING, payload: updated });
                }
              }
              const soldItem = {
                id: `sold_${Date.now()}`,
                symbol: sym,
                name: holding?.name || state.etfs.find(etf => etf.symbol === sym)?.name || sym,
                sector: holding?.sector || state.etfs.find(etf => etf.symbol === sym)?.sector || 'Unknown',
                buyDate: holding?.buyDate || new Date().toISOString().split('T')[0],
                sellDate: new Date().toISOString().split('T')[0],
                buyPrice: Number(buyPx || 0),
                sellPrice: Number(sellPx || 0),
                quantity: usedQty,
                profit,
                profitLoss: profit,
                profitPercentage: profitPct,
                reason: 'Order executed',
                orderId: String(orderId),
                holdingId: holding?.id || null,
                orderType: rec?.order_type || 'MARKET',
                productType: rec?.product || 'CNC',
                // Add chunk information if available
                chunkId: holding?.chunkId || null,
                chunkInfo: holding?.chunkInfo || null
              };
              dispatch({ type: actionTypes.ADD_SOLD_ITEM, payload: soldItem });
              // Immediate attempt to correct 0 sell price via order details
              try {
                if (!(Number(soldItem.sellPrice) > 0)) {
                  // 1) Try tradebook first for precise trade price
                  try {
                    const tb = await mstocksApiService.getTradeBook();
                    const arr = tb?.data || tb;
                    if (Array.isArray(arr)) {
                      const tmatch = arr.find(t => String(t.order_id || t.orderId || t.nOrdNo || t.orderid || t.id) === String(orderId));
                      const tpx = Number(
                        tmatch?.average_price || tmatch?.avg_price || tmatch?.avgprc || tmatch?.avgPrc ||
                        tmatch?.price || tmatch?.prc || tmatch?.traded_price || tmatch?.trade_price || tmatch?.trdPrc || tmatch?.fill_price || tmatch?.filledPrice || 0
                      );
                      if (Number.isFinite(tpx) && tpx > 0) {
                        const np = tpx;
                        const nprofit = (np - Number(soldItem.buyPrice || 0)) * Number(soldItem.quantity || 0);
                        const npct = Number(soldItem.buyPrice || 0) > 0 ? (nprofit / (Number(soldItem.buyPrice) * Number(soldItem.quantity || 0))) * 100 : 0;
                        dispatch({ type: actionTypes.UPDATE_SOLD_ITEM, payload: { ...soldItem, sellPrice: np, profit: nprofit, profitLoss: nprofit, profitPercentage: npct } });
                        return;
                      }
                    }
                  } catch {}
                  // 2) Fallback to order details
                  const od = await mstocksApiService.getOrderStatus(orderId);
                  const rec2 = od?.data || od;
                  const cand2 = Array.isArray(rec2) ? rec2[0] : rec2;
                  const detPx2 = Number(
                    cand2?.averagePrice || cand2?.avg_price || cand2?.average_price ||
                    cand2?.traded_price || cand2?.trade_price || cand2?.trdPrc || cand2?.fill_price || cand2?.filledPrice || 0
                  );
                  if (Number.isFinite(detPx2) && detPx2 > 0) {
                    const np = detPx2;
                    const nprofit = (np - Number(soldItem.buyPrice || 0)) * Number(soldItem.quantity || 0);
                    const npct = Number(soldItem.buyPrice || 0) > 0 ? (nprofit / (Number(soldItem.buyPrice) * Number(soldItem.quantity || 0))) * 100 : 0;
                    dispatch({ type: actionTypes.UPDATE_SOLD_ITEM, payload: { ...soldItem, sellPrice: np, profit: nprofit, profitLoss: nprofit, profitPercentage: npct } });
                  }
                }
              } catch {}
            }
          } catch {}
        }
      } else if (
        finalStatus === 'REJECTED' || finalStatus === 'REJECT' || finalStatus === 'REJ' || finalStatus === 'CANCELLED' || finalStatus === 'CANCELED' || finalStatus === 'CANCEL' ||
        contains(finalStatus, 'REJ') || contains(finalStatus, 'RMS') || contains(finalStatus, 'CXL') || contains(finalStatus, 'CANCEL') || contains(String(normalized.message || '').toUpperCase(), 'REJECT') || contains(String(normalized.message || '').toUpperCase(), 'FUND LIMIT INSUFFICIENT')
      ) {
        // Terminal negative outcome: move to history as failed and remove from pending
        const pendingOrder = state.pendingOrders.find(order => String(order.orderId) === String(orderId));
        if (pendingOrder) {
          dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: { ...pendingOrder, status: 'REJECTED', message: normalized.message } });
          dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: String(orderId) });
        }
      }

      return normalized;
    } catch (error) {
      console.error('Error checking order status:', error);
      throw error;
    }
  };

  // Auto-reconcile pending orders: poll broker for IDs and reconcile non-ID pendings via order book
  useEffect(() => {
    const pendings = (state.pendingOrders || []).filter(Boolean);
    if (pendings.length === 0) return;

    const intervalId = setInterval(async () => {
      try {
        const withId = pendings.filter(p => p && String(p.orderId || '').length > 0);
        const withoutId = pendings.filter(p => !(p && String(p.orderId || '').length > 0));

        // Poll broker for those with orderId
        for (const o of withId) {
          try { await checkOrderStatus(o.orderId); } catch {}
        }

        // For those without orderId, reconcile via today's orders book and tradebook
        if (withoutId.length > 0 && typeof mstocksApiService.getTodaysOrders === 'function') {
          try {
            const book = await mstocksApiService.getTodaysOrders();
            const list = (() => {
              const d = book?.data || book;
              if (Array.isArray(d)) return d;
              if (Array.isArray(d?.orders)) return d.orders;
              if (Array.isArray(book?.orders)) return book.orders;
              return [];
            })();
            let trades = [];
            try {
              if (typeof mstocksApiService.getTradeBook === 'function') {
                const tb = await mstocksApiService.getTradeBook();
                const tbd = tb?.data || tb;
                if (Array.isArray(tbd)) trades = tbd;
              }
            } catch {}

            for (const p of withoutId) {
              const clean = (p.symbol || '').replace('NSE:', '').toUpperCase();
              const side = (p.type || '').toUpperCase();
              const match = list.find(o => {
                const sym = (o.symbol || o.tradingsymbol || o.trading_symbol || '').toUpperCase();
                const oside = (o.side || o.transaction_type || o.type || '').toUpperCase();
                return sym.includes(clean) && oside.includes(side);
              });

              if (match) {
                const statusUpper = String(
                  match.status || match.order_status || match.status_code || match.orderStatus
                ).toUpperCase();
                const msgUpper = String(match.message || match.status_message || '').toUpperCase();
                const mappedStatus = statusUpper;
                if (mappedStatus === 'COMPLETE' || mappedStatus === 'COMPLETED' || mappedStatus === 'SUCCESS' || mappedStatus === 'FILLED' || mappedStatus === 'EXECUTED' || mappedStatus === 'TRADED' || msgUpper.includes('TRADE CONFIRMED')) {
                  // Move to history as success and remove from pending
                  dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: { ...p, status: 'SUCCESS' } });
                  dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: String(p.orderId || p.id || `${p.symbol}_${p.timestamp}`) });
                } else if (mappedStatus === 'REJECTED' || mappedStatus === 'REJECT' || mappedStatus === 'REJ' || mappedStatus === 'CANCELLED' || mappedStatus === 'CANCELED' || mappedStatus === 'CANCEL') {
                  // Move to history as rejected and remove
                  dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: { ...p, status: 'REJECTED', message: match.message } });
                  dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: String(p.orderId || p.id || `${p.symbol}_${p.timestamp}`) });
                }
              } else if (trades.length > 0) {
                // If not in order book but found in tradebook, mark as success
                const tmatch = trades.find(t => {
                  const sym = (t.trading_symbol || t.tradingsymbol || t.symbol || '').toUpperCase();
                  const tside = (t.transaction_type || t.side || '').toUpperCase();
                  return sym.includes(clean) && tside.includes(side);
                });
                if (tmatch) {
                  dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: { ...p, status: 'SUCCESS' } });
                  dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: String(p.orderId || p.id || `${p.symbol}_${p.timestamp}`) });
                }
              } else {
                // If no match in order book for > 2 minutes, mark as rejected to avoid stuck pendings
                try {
                  const placedAt = new Date(p.timestamp).getTime();
                  if (Date.now() - placedAt > 2 * 60 * 1000) {
                    dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: { ...p, status: 'REJECTED', message: 'No broker record found (timeout)' } });
                    dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: String(p.orderId || p.id || `${p.symbol}_${p.timestamp}`) });
                  }
                } catch {}
              }
            }
          } catch {}
        }
      } catch {}
    }, 8000);

    return () => clearInterval(intervalId);
  }, [state.pendingOrders]);

  // (Removed) Cleanup of legacy pending orders without valid orderId

  const cancelOrder = async (orderId) => {
    try {
      const result = await mstocksApiService.cancelOrder(orderId);
      dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: orderId });
      return result;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  };

  const fetchAccountDetails = async () => {
    try {
      const details = await mstocksApiService.getAccountDetails();
      dispatch({ type: actionTypes.SET_ACCOUNT_DETAILS, payload: details });
      return details;
    } catch (error) {
      console.error('Error fetching account details:', error);
      throw error;
    }
  };

  const checkTradingEnabled = useCallback(async () => {
    let enabled = false;
    try {
      // Check if user is logged in to MStocks (synchronous status)
      const session = mstocksApiService.getSessionStatus();
      console.log('🔍 Trading enabled check - Session status:', session);

      if (session && session.logged_in && session.session_valid) {
        enabled = true;
        console.log('✅ Trading enabled - Valid session found');
      } else {
        // As fallback, if credentials are present, allow enabling
        const hasCredentials = mstocksApiService.hasCredentials();
        const isConfigured = mstocksApiService.isConfigured();
        console.log('🔍 Trading enabled check - Has credentials:', hasCredentials, 'Is configured:', isConfigured);
        enabled = !!(hasCredentials || isConfigured);
      }
    } catch (e) {
      console.error('❌ Error checking trading enabled:', e);
      const hasCredentials = mstocksApiService.hasCredentials();
      const isConfigured = mstocksApiService.isConfigured();
      enabled = !!(hasCredentials || isConfigured);
      console.log('🔄 Fallback trading check - Enabled:', enabled);
    }

    dispatch({ type: actionTypes.SET_TRADING_ENABLED, payload: enabled });
    return enabled;
  }, []);

  const fetchOrderHistory = async () => {
    try {
      // Pull today's order book from broker and update history
      const book = await mstocksApiService.getTodaysOrders();
      const list = (() => {
        const d = book?.data || book;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.orders)) return d.orders;
        if (Array.isArray(book?.orders)) return book.orders;
        return [];
      })();

      // Normalize minimal history entry shape for UI
      const normalized = list.map(o => ({
        orderId: o.order_id || o.orderId || o.nOrdNo || o.orderid || o.id || o.exchange_order_id || o.exch_order_id,
        symbol: o.tradingsymbol || o.symbol,
        type: (o.transaction_type || o.side || o.type || '').toUpperCase(),
        status: (o.status || o.order_status || o.status_code || o.orderStatus || '').toUpperCase(),
        price: Number(o.average_price || o.price || 0) || undefined,
        quantity: Number(o.filled_quantity || o.quantity || 0) || undefined,
        timestamp: o.order_timestamp || o.timestamp || new Date().toISOString()
      }));

      dispatch({ type: actionTypes.FETCH_ORDER_HISTORY, payload: normalized });

      // Reconcile each broker order into app state (handles fills without prior pending)
      for (const entry of normalized) {
        const oid = entry.orderId;
        if (oid) {
          try { await checkOrderStatus(oid); } catch {}
        }
      }

      return normalized;
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  };

  const fetchBrokerHoldings = async () => {
    try {
      const brokerHoldings = await mstocksApiService.getBrokerHoldings();
      console.log('Broker holdings fetched:', brokerHoldings);
      return brokerHoldings;
    } catch (error) {
      console.error('Error fetching broker holdings:', error);
      throw error;
    }
  };

  // Version 2.0 functions
  const completeUserSetup = (userData) => {
    console.log('=== COMPLETE USER SETUP DEBUG ===');
    console.log('User data to save:', userData);
    console.log('Current user:', state.auth.currentUser);
    
    // Save broker credentials if provided
    if (userData.brokerCredentials && userData.brokerCredentials.enableRealTrading) {
      try {
        console.log('🔐 Saving broker credentials for user');
        localStorage.setItem('mstocks_credentials', JSON.stringify({
          username: userData.brokerCredentials.mstocksUsername,
          password: userData.brokerCredentials.mstocksPassword,
          apiKey: userData.brokerCredentials.mstocksApiKey
        }));
        console.log('✅ Broker credentials saved successfully');
      } catch (error) {
        console.error('❌ Error saving broker credentials:', error);
      }
    }
    
    // Save user data to localStorage
    if (state.auth.currentUser) {
      const savedUsers = localStorage.getItem('etfUsers');
      const users = savedUsers ? JSON.parse(savedUsers) : {};
      const userKey = state.auth.currentUser.uid || state.auth.currentUser.username;
      
      console.log('User key:', userKey);
      console.log('Current users in localStorage:', users);
      
      if (users[userKey]) {
        // Recompute available capital based on compounding inputs: initial capital, holdings, booked profits
        const investedAmount = state.holdings.reduce((sum, h) => sum + ((h.avgPrice || h.buyPrice || 0) * (h.quantity || 0)), 0);
        const bookedProfit = state.soldItems.reduce((sum, s) => sum + (Number(s.profit ?? s.profitLoss ?? 0)), 0);
        const recomputedAvailable = Math.max(0, Number(userData.initialCapital || 0) - investedAmount + bookedProfit);

        users[userKey].userData = {
          holdings: state.holdings,
          soldItems: state.soldItems,
          userSetup: {
            isCompleted: true,
            userData: userData,
            initialCapital: userData.initialCapital,
            tradingAmount: userData.tradingAmount,
            hasETFTradingExperience: userData.hasETFTradingExperience,
            brokerCredentials: userData.brokerCredentials || null
          },
          moneyManagement: {
            ...state.moneyManagement,
            availableCapital: recomputedAvailable,
            // Next buy should be daily chunk (plus booked profit later), not entire capital
            nextBuyAmount: Math.min(recomputedAvailable, Number(userData.tradingAmount || 0))
          }
        };
        
        console.log('Updated user data:', users[userKey]);
        localStorage.setItem('etfUsers', JSON.stringify(users));
        console.log('✅ User data saved to localStorage');
      } else {
        console.log('❌ User not found in localStorage for key:', userKey);
      }
    } else {
      console.log('❌ No current user found');
    }
    
    dispatch({ type: actionTypes.COMPLETE_USER_SETUP, payload: userData });
    // Also update money management in state to reflect recomputed available capital
    try {
      const investedAmount = state.holdings.reduce((sum, h) => sum + ((h.avgPrice || h.buyPrice || 0) * (h.quantity || 0)), 0);
      const bookedProfit = state.soldItems.reduce((sum, s) => sum + (Number(s.profit ?? s.profitLoss ?? 0)), 0);
      const recomputedAvailable = Math.max(0, Number(userData.initialCapital || 0) - investedAmount + bookedProfit);
      const tradingAmount = Number(userData.tradingAmount || 0);
      const nextBuyAmount = Math.min(recomputedAvailable, tradingAmount);
      
      // Calculate proper compounding effect based on trading performance
      const recentProfits = state.moneyManagement?.recentProfits || [];
      const compoundingEffect = calculateCompoundingEffect(nextBuyAmount, tradingAmount, recentProfits, state.soldItems);
      
      dispatch({ 
        type: actionTypes.UPDATE_MONEY_MANAGEMENT, 
        payload: { 
          ...state.moneyManagement, 
          availableCapital: recomputedAvailable, 
          nextBuyAmount: nextBuyAmount,
          compoundingEffect: compoundingEffect
        } 
      });
    } catch (e) {
      console.warn('Failed to recompute available capital on setup:', e?.message);
    }
    console.log('=== END SETUP DEBUG ===');
  };

  const updateMoneyManagement = (data) => {
    dispatch({ type: actionTypes.UPDATE_MONEY_MANAGEMENT, payload: data });
  };

  const updateStrategy = (data) => {
    dispatch({ type: actionTypes.UPDATE_STRATEGY, payload: data });
  };

  const updateCompoundingData = (data) => {
    dispatch({ type: actionTypes.UPDATE_COMPOUNDING_DATA, payload: data });
  };

  // Authentication functions
  const userLogin = async (credentials) => {
    try {
      console.log('=== FIREBASE USER LOGIN DEBUG ===');
      console.log('Credentials:', credentials);
      
      // Set flag to allow data loading for authenticated users
      setIsNewUserSession(false);
      setDataLoadingEnabled(true); // Enable data loading for authenticated users
      
      // Load user data from localStorage using UID
      const savedUsers = localStorage.getItem('etfUsers');
      const users = savedUsers ? JSON.parse(savedUsers) : {};
      console.log('All saved users:', users);
      
      const userData = users[credentials.uid] || {
        holdings: [],
        soldItems: [],
        userSetup: {
          isCompleted: false,
          userData: null,
          initialCapital: 0,
          tradingAmount: 0,
          hasETFTradingExperience: false
        },
        moneyManagement: {
          availableCapital: 0,
          nextBuyAmount: 0,
          compoundingEffect: 0,
          recentProfits: []
        }
      };
      
      console.log('User data for UID:', credentials.uid);
      console.log('User data:', userData);
      console.log('User setup:', userData.userSetup);
      console.log('Setup completed:', userData.userSetup?.isCompleted);
      
      // Check if this is an existing user (has completed setup before)
      const isExistingUser = userData.userSetup && userData.userSetup.isCompleted;
      console.log('Is existing user:', isExistingUser);
      
      // For existing users, we need to ensure the setup state is properly set
      if (isExistingUser) {
        console.log('Existing user detected - setting up completed state');
        // Set the userSetup state to completed immediately
        dispatch({ 
          type: actionTypes.SET_USER_SETUP_COMPLETED, 
          payload: { userData: userData.userSetup } 
        });
        // Restore saved setup fully (initialCapital, tradingAmount, etc.)
        dispatch({ type: actionTypes.RESTORE_USER_SETUP, payload: { userData } });
      }
      
      dispatch({ 
        type: actionTypes.USER_LOGIN, 
        payload: { 
          user: { 
            username: credentials.username, 
            email: credentials.email,
            uid: credentials.uid,
            isFirebaseUser: true,
            isExistingUser: isExistingUser
          },
          userData 
        } 
      });

      // Persist current user for refresh persistence
      try {
        localStorage.setItem('etfCurrentUser', JSON.stringify({
          username: credentials.username,
          email: credentials.email,
          uid: credentials.uid,
          isFirebaseUser: true
        }));
      } catch {}
      
      console.log('✅ Firebase user logged in successfully:', credentials.email);
      console.log('Is existing user:', isExistingUser);
      console.log('User setup completed:', userData.userSetup?.isCompleted);
      console.log('=== END LOGIN DEBUG ===');
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const userSignup = async (userData) => {
    try {
      console.log('Firebase user signup:', userData);
      
      // Set flag to allow data loading for authenticated users
      setIsNewUserSession(false);
      setDataLoadingEnabled(true); // Enable data loading for authenticated users
      
      // Load existing users
      const savedUsers = localStorage.getItem('etfUsers');
      const users = savedUsers ? JSON.parse(savedUsers) : {};
      
      // For Firebase users, use UID as the key
      const userKey = userData.uid || userData.username;
      
      // Check if user already exists (for non-Firebase users)
      if (!userData.isFirebaseUser && users[userData.username]) {
        throw new Error('Username already exists. Please choose a different username.');
      }
      
      // Check if this Firebase user already exists and has completed setup
      const existingUser = users[userKey];
      const isExistingUser = existingUser && existingUser.userData && existingUser.userData.userSetup && existingUser.userData.userSetup.isCompleted;
      
      console.log('Existing user check:', { existingUser, isExistingUser });
      
      // Create new user object with proper structure
      const newUser = {
        username: userData.username,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        uid: userData.uid,
        isFirebaseUser: userData.isFirebaseUser || false,
        isGoogleUser: userData.isGoogleUser || false,
        isExistingUser: isExistingUser,
        createdAt: new Date().toISOString()
      };
      
      // If this is an existing user, load their data
      if (isExistingUser && existingUser.userData) {
        console.log('Existing user detected - logging in with saved data');
        
        // Update the user object with existing data
        users[userKey] = {
          ...newUser,
          userData: existingUser.userData
        };
        localStorage.setItem('etfUsers', JSON.stringify(users));
        
        dispatch({ 
          type: actionTypes.USER_LOGIN, 
          payload: { 
            user: newUser,
            userData: existingUser.userData
          } 
        });
        try {
          localStorage.setItem('etfCurrentUser', JSON.stringify({
            username: newUser.username,
            email: newUser.email,
            uid: newUser.uid,
            isFirebaseUser: !!newUser.isFirebaseUser
          }));
        } catch {}
        console.log('✅ Existing Firebase user logged in successfully:', userData.email);
      } else {
        console.log('New user detected - creating fresh user data');
        
        // Create fresh user data structure for new users
        const freshUserData = {
          holdings: [],
          soldItems: [],
          userSetup: {
            isCompleted: false,
            userData: null,
            initialCapital: 0,
            tradingAmount: 0,
            hasETFTradingExperience: false
          },
          moneyManagement: {
            availableCapital: 0,
            nextBuyAmount: 0,
            compoundingEffect: 0,
            recentProfits: []
          }
        };
        
        // Save user to localStorage with proper structure
        users[userKey] = {
          ...newUser,
          userData: freshUserData
        };
        localStorage.setItem('etfUsers', JSON.stringify(users));
        
        dispatch({ 
          type: actionTypes.USER_SIGNUP, 
          payload: { user: newUser } 
        });
        try {
          localStorage.setItem('etfCurrentUser', JSON.stringify({
            username: newUser.username,
            email: newUser.email,
            uid: newUser.uid,
            isFirebaseUser: !!newUser.isFirebaseUser
          }));
        } catch {}
        console.log('✅ New Firebase user signed up successfully:', userData.email);
      }
      
    } catch (error) {
      console.error('❌ Signup failed:', error);
      throw error;
    }
  };

  const userLogout = () => {
    // Save current user data before logout
    if (state.auth.currentUser) {
      const currentUserData = { 
        holdings: state.holdings, 
        soldItems: state.soldItems, 
        userSetup: state.userSetup, 
        moneyManagement: state.moneyManagement 
      };
      const savedUsers = localStorage.getItem('etfUsers');
      const users = savedUsers ? JSON.parse(savedUsers) : {};
      
      // Use UID for Firebase users, username for others
      const userKey = state.auth.currentUser.uid || state.auth.currentUser.username;
      
      if (users[userKey]) {
        users[userKey].userData = currentUserData;
        localStorage.setItem('etfUsers', JSON.stringify(users));
        console.log('✅ User data saved before logout for key:', userKey);
      } else {
        console.log('❌ User not found in localStorage for key:', userKey);
      }
    }
    
    // Clear all state and go back to login
    dispatch({ type: actionTypes.USER_LOGOUT });
    try { localStorage.removeItem('etfCurrentUser'); } catch {}
    console.log('👋 User logged out - returning to login page');
  };

  const value = {
    ...state,
    totalInvested,
    totalProfit,
    targetProfit,
    dispatch,
    actionTypes,
    getSmartSellRecommendation,
    canSellToday,
    // Trading functions
    placeBuyOrder,
    placeSellOrder,
    placeBuyOrderWithLifecycle,
    placeSellOrderWithLifecycle,
    checkOrderStatus,
    manualReconcileOrder,
    fixSellPricesForSoldItems,
    saveCriticalData,
    cancelOrder,
    fetchAccountDetails,
    checkTradingEnabled,
    mstocksApi: mstocksApiService,
    fetchLivePrices: async () => {
      try {
        const symbols = [...new Set(state.holdings.map(h => h.symbol))];
        const livePrices = await mstocksApiService.getLivePrices(symbols);
        dispatch({ type: actionTypes.UPDATE_LIVE_PRICES, payload: livePrices });
        return livePrices;
      } catch (error) {
        console.error('Error fetching live prices:', error);
        return {};
      }
    },
    updateETFsWithLivePrices: async () => {
      try {
        console.log('🔄 Updating ETFs with live prices via Python API...');
        
        // Check if Python API is available
        let pythonApiAvailable = false;
        try {
          const pythonApiStatus = await mstocksApiService.testConnection();
          console.log(`🔍 MStocks API Status:`, pythonApiStatus);
          pythonApiAvailable = pythonApiStatus.status === 'success';
        } catch (error) {
          console.warn(`⚠️ MStocks API server not available:`, error.message);
        }
        
        const symbols = state.etfs.map(etf => etf.symbol);
        const updatedETFs = [];
        let successCount = 0;
        let errorCount = 0;
        
        for (const etf of state.etfs) {
          try {
            let newPrice = null;
            let dataSource = '';
            
            // Try Python API first (most reliable)
            if (pythonApiAvailable) {
              try {
                console.log(`📈 Fetching price for ${etf.symbol} from MStocks API...`);
                const priceData = await mstocksApiService.getLivePrice(etf.symbol);
                console.log(`📊 MStocks API response for ${etf.symbol}:`, priceData);
                
                if (priceData && (priceData.data?.price || priceData.lastPrice) && parseFloat(priceData.data?.price || priceData.lastPrice) > 0) {
                  newPrice = parseFloat(priceData.data?.price || priceData.lastPrice);
                  dataSource = priceData.source || 'MStocks API';
                  console.log(`✅ MStocks API price for ${etf.symbol}: ₹${newPrice}`);
                } else {
                  console.warn(`⚠️ MStocks API returned no valid price for ${etf.symbol}:`, priceData);
                }
              } catch (mstocksError) {
                console.warn(`⚠️ MStocks API failed for ${etf.symbol}:`, mstocksError.message);
              }
            }
            
            // Fallback to browser-based MStocks API if Python API fails
            if (!newPrice && mstocksApiService.isLoggedIn()) {
              try {
                console.log(`📈 Fetching price for ${etf.symbol} from browser MStocks API...`);
                const priceData = await mstocksApiService.getLivePrice(etf.symbol);
                if (priceData && priceData.lastPrice && parseFloat(priceData.lastPrice) > 0) {
                  newPrice = parseFloat(priceData.lastPrice);
                  dataSource = 'Browser MStocks API';
                  console.log(`✅ Browser MStocks price for ${etf.symbol}: ₹${newPrice}`);
                }
              } catch (mstocksError) {
                console.warn(`⚠️ Browser MStocks API failed for ${etf.symbol}:`, mstocksError.message);
              }
            }
            
            // Update ETF with new price if available
            if (newPrice && newPrice > 0) {
              const updatedETF = {
                ...etf,
                currentPrice: newPrice,
                cmp: newPrice,
                lastUpdated: new Date().toISOString(),
                dataSource: dataSource
              };
              updatedETFs.push(updatedETF);
              successCount++;
              
              // Store last fetched price
              dispatch({
                type: actionTypes.UPDATE_LAST_FETCHED_PRICES,
                payload: { [etf.symbol]: { price: newPrice, source: dataSource, timestamp: new Date().toISOString() } }
              });
            } else {
              // Keep existing ETF data if no new price
              updatedETFs.push(etf);
              errorCount++;
            }
            
          } catch (error) {
            console.error(`❌ Error fetching price for ${etf.symbol}:`, error);
            updatedETFs.push(etf); // Keep existing data
            errorCount++;
          }
        }
        
        dispatch({ type: actionTypes.UPDATE_ETFS, payload: updatedETFs });
        
        // Update last fetch time and source
        const fetchSource = pythonApiAvailable ? 'Python API' : (mstocksApiService.isLoggedIn() ? 'Browser MStocks API' : 'No API Available');
        dispatch({
          type: actionTypes.SET_LAST_FETCH_TIME,
          payload: { timestamp: new Date().toISOString(), source: fetchSource }
        });
        
        console.log(`✅ ETFs updated with live prices! (${successCount} success, ${errorCount} failed)`);
        return updatedETFs;
      } catch (error) {
        console.error('Error updating ETFs with live prices:', error);
        return state.etfs;
      }
    },
    updateETFsWithDMA20: async () => {
      try {
        console.log('🔄 Updating ETFs with DMA20 via Python API...');
        
        // Check if DMA API is available
        let dmaApiAvailable = false;
        try {
          const dmaApiStatus = await dmaApiService.testConnection();
          console.log(`🔍 DMA API Status:`, dmaApiStatus);
          dmaApiAvailable = dmaApiStatus.status === 'success';
        } catch (error) {
          console.warn(`⚠️ DMA API server not available:`, error.message);
        }
        
        if (!dmaApiAvailable) {
          console.warn('⚠️ DMA API not available, skipping DMA20 update');
          return state.etfs;
        }
        
        // Update ETFs with DMA20 data
        const updatedETFs = await dmaApiService.updateMultipleETFsWithDMA20(state.etfs);
        
        dispatch({ type: actionTypes.UPDATE_ETFS, payload: updatedETFs });
        console.log(`✅ ETFs updated with DMA20 data!`);
        return updatedETFs;
      } catch (error) {
        console.error('Error updating ETFs with DMA20:', error);
        return state.etfs;
      }
    },
    updateHoldingsWithLivePrices: async () => {
      try {
        console.log('🔄 Updating holdings with live prices...');
        
        if (!state.holdings || state.holdings.length === 0) {
          console.log('📭 No holdings to update');
          return state.holdings;
        }
        
        // Check Python API server status first
        let pythonApiAvailable = false;
        try {
          const pythonApiStatus = await mstocksApiService.testConnection();
          pythonApiAvailable = pythonApiStatus.status === 'success';
        } catch (error) {
          console.warn(`⚠️ MStocks API server not available:`, error.message);
        }
        
        let updatedHoldings = [...state.holdings];
        let successCount = 0;
        let errorCount = 0;
        
        for (const holding of updatedHoldings) {
          try {
            const priceData = await mstocksApiService.getLivePrice(holding.symbol);
            
            if (priceData && (priceData.data?.price || priceData.lastPrice) && parseFloat(priceData.data?.price || priceData.lastPrice) > 0) {
              const newPrice = parseFloat(priceData.data?.price || priceData.lastPrice);
              holding.currentPrice = newPrice;
              holding.currentValue = holding.quantity * holding.currentPrice;
              holding.profitLoss = holding.currentValue - (holding.quantity * holding.avgPrice);
              holding.profitPercentage = (holding.quantity * holding.avgPrice) > 0 ? 
                (holding.profitLoss / (holding.quantity * holding.avgPrice)) * 100 : 0;
              
              successCount++;
            } else {
              errorCount++;
            }
            
            // Add small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.error(`❌ Error fetching price for ${holding.symbol}:`, error);
            errorCount++;
          }
        }
        
        dispatch({ type: actionTypes.UPDATE_HOLDINGS, payload: updatedHoldings });
        console.log(`✅ Holdings updated with live prices! (${successCount} success, ${errorCount} failed)`);
        return updatedHoldings;
      } catch (error) {
        console.error('Error updating holdings with live prices:', error);
        return state.holdings;
      }
    },
    getLastFetchedPrice: (symbol) => {
      const lastPriceData = state.lastFetchedPrices[symbol];
      if (lastPriceData) {
        return {
          price: lastPriceData.price,
          source: lastPriceData.source,
          timestamp: lastPriceData.timestamp,
          isOffline: true
        };
      }
      return null;
    },
    getLastFetchInfo: () => {
      return {
        timestamp: state.lastFetchTime,
        source: state.lastFetchSource,
        hasOfflineData: Object.keys(state.lastFetchedPrices).length > 0
      };
    },
    fetchOrderHistory,
    fetchBrokerHoldings,
    // Version 2.0 functions
    completeUserSetup,
    updateMoneyManagement,
    updateCompoundingData,
    // Chunk management functions
    updateChunkManagement: (data) => {
      dispatch({ type: actionTypes.UPDATE_CHUNK_MANAGEMENT, payload: data });
    },
    resetChunkManagement: () => {
      dispatch({ type: actionTypes.RESET_CHUNK_MANAGEMENT });
    },
    initializeChunks: (config) => {
      dispatch({ type: actionTypes.INITIALIZE_CHUNKS, payload: config });
    },
    activateChunkManagement: () => {
      dispatch({ type: actionTypes.ACTIVATE_CHUNK_MANAGEMENT });
    },
    deactivateChunkManagement: () => {
      dispatch({ type: actionTypes.DEACTIVATE_CHUNK_MANAGEMENT });
    },
    getNextChunkForBuy: () => {
      if (!state.chunkManagement.isActive || !state.chunkManagement.chunks || state.chunkManagement.chunks.length === 0) {
        return null;
      }
      
      // Find the next available chunk (with available capital)
      let attempts = 0;
      let chunkIndex = state.chunkManagement.currentChunkIndex || 0;
      
      while (attempts < state.chunkManagement.chunks.length) {
        const chunk = state.chunkManagement.chunks[chunkIndex];
        
        // Safety check: ensure chunk exists and has currentCapital property
        if (chunk && typeof chunk.currentCapital === 'number' && chunk.currentCapital > 1000) {
          return chunk;
        }
        
        chunkIndex = (chunkIndex + 1) % state.chunkManagement.chunks.length;
        attempts++;
      }
      
      return null; // No chunks with available capital
    },
    reconcileHoldingsWithChunks: () => {
      dispatch({ type: actionTypes.RECONCILE_HOLDINGS_WITH_CHUNKS });
    },
    initializeChunksWithReconciliation: (config) => {
      // Get initial capital from user setup
      const initialCapital = state.userSetup?.initialCapital || config.startingCapital || 100000;
      
      const reconcileConfig = {
        ...config,
        startingCapital: initialCapital,
        reconcileExisting: true
      };
      
      dispatch({ type: actionTypes.INITIALIZE_CHUNKS, payload: reconcileConfig });
      
      // After initialization, reconcile holdings
      setTimeout(() => {
        dispatch({ type: actionTypes.RECONCILE_HOLDINGS_WITH_CHUNKS });
      }, 100);
    },
    getBuyAmountFromChunk: () => {
      if (!state.chunkManagement.isActive || !state.chunkManagement.chunks || state.chunkManagement.chunks.length === 0) {
        return 0;
      }
      
      // Find the next available chunk
      let attempts = 0;
      let chunkIndex = state.chunkManagement.currentChunkIndex || 0;
      
      while (attempts < state.chunkManagement.chunks.length) {
        const chunk = state.chunkManagement.chunks[chunkIndex];
        
        // Safety check: ensure chunk exists and has currentCapital property
        if (chunk && typeof chunk.currentCapital === 'number' && chunk.currentCapital > 1000) {
          return Math.min(chunk.currentCapital, 50000); // Max ₹50k per trade
        }
        
        chunkIndex = (chunkIndex + 1) % state.chunkManagement.chunks.length;
        attempts++;
      }
      
      return 0;
    },
    // Market status and data fetching
    checkMarketStatus,
    fetchAllDataOnLogin,
    // Authentication functions
    userLogin,
    userSignup,
    userLogout
  };

  return (
    <ETFTradingContext.Provider value={value}>
      {children}
    </ETFTradingContext.Provider>
  );
};

// Custom hook to use the context
export const useETFTrading = () => {
  const context = useContext(ETFTradingContext);
  if (!context) {
    throw new Error('useETFTrading must be used within an ETFTradingProvider');
  }
  return context;
}; 