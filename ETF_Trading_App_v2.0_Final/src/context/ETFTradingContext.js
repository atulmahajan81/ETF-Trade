import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import mstocksApiService from '../services/mstocksApi';
import pythonPriceApiService from '../services/pythonPriceApi';
import dmaApiService from '../services/dmaApi';
// Removed demo data service import
import { sampleSoldItems } from '../data/complete_sold_items.js';

// Sample ETF data - Updated with specific ETFs for ranking (no duplicates)
const sampleETFs = [
  { id: 'etf_001', symbol: 'NSE:CPSEETF', name: 'CPSE ETF', sector: 'PSU', currentPrice: 45.20, change: 0.8, cmp: 45.20, dma20: 44.80, volume: 850000 },
  { id: 'etf_002', symbol: 'NSE:GOLDBEES', name: 'Gold Bees ETF', sector: 'Gold', currentPrice: 52.30, change: 0.5, cmp: 52.30, dma20: 52.10, volume: 450000 },
  { id: 'etf_003', symbol: 'NSE:GOLD1', name: 'Gold ETF', sector: 'Gold', currentPrice: 51.80, change: 0.3, cmp: 51.80, dma20: 51.60, volume: 380000 },
  { id: 'etf_004', symbol: 'NSE:SETFGOLD', name: 'SBI Gold ETF', sector: 'Gold', currentPrice: 53.40, change: 0.7, cmp: 53.40, dma20: 53.20, volume: 520000 },
  { id: 'etf_005', symbol: 'NSE:HNGSNGBEES', name: 'HDFC Gold ETF', sector: 'Gold', currentPrice: 52.90, change: 0.4, cmp: 52.90, dma20: 52.70, volume: 410000 },
  { id: 'etf_006', symbol: 'NSE:MAHKTECH', name: 'Mahindra Tech ETF', sector: 'Technology', currentPrice: 28.50, change: 1.2, cmp: 28.50, dma20: 28.20, volume: 120000 },
  { id: 'etf_007', symbol: 'NSE:MONQ50', name: 'Motilal Oswal Nifty 50 ETF', sector: 'Nifty 50', currentPrice: 79.7, change: 1.1, cmp: 79.7, dma20: 80.5, volume: 950000 },
  { id: 'etf_008', symbol: 'NSE:MON100', name: 'Motilal Oswal Nasdaq 100 ETF', sector: 'International', currentPrice: 125.80, change: 1.3, cmp: 125.80, dma20: 124.20, volume: 280000 },
  { id: 'etf_009', symbol: 'NSE:NIF100IETF', name: 'NIFTY 100 ETF', sector: 'Nifty 100', currentPrice: 28.12, change: 0.9, cmp: 28.12, dma20: 28.45, volume: 680000 },
  { id: 'etf_010', symbol: 'NSE:LOWVOL1', name: 'Low Volatility ETF', sector: 'Low Vol', currentPrice: 95.20, change: 0.3, cmp: 95.20, dma20: 94.90, volume: 320000 },
  { id: 'etf_011', symbol: 'NSE:LOWVOLIETF', name: 'Low Volatility ETF', sector: 'Low Vol', currentPrice: 96.80, change: 0.4, cmp: 96.80, dma20: 96.50, volume: 280000 },
  { id: 'etf_012', symbol: 'NSE:MOM30IETF', name: 'Momentum 30 ETF', sector: 'Momentum', currentPrice: 78.40, change: 1.5, cmp: 78.40, dma20: 77.80, volume: 420000 },
  { id: 'etf_013', symbol: 'NSE:MOMOMENTUM', name: 'Momentum ETF', sector: 'Momentum', currentPrice: 82.60, change: 1.8, cmp: 82.60, dma20: 81.90, volume: 380000 },
  { id: 'etf_014', symbol: 'NSE:NIFTYQLITY', name: 'NIFTY Quality ETF', sector: 'Quality', currentPrice: 165.30, change: 0.7, cmp: 165.30, dma20: 164.80, volume: 520000 },
  { id: 'etf_015', symbol: 'NSE:NIFTYIETF', name: 'NIFTY ETF', sector: 'Nifty 50', currentPrice: 246.20, change: 1.0, cmp: 246.20, dma20: 245.40, volume: 1100000 },
  { id: 'etf_016', symbol: 'NSE:NIFTYBEES', name: 'NIFTY 50 ETF', sector: 'Nifty 50', currentPrice: 245.50, change: 1.2, cmp: 245.50, dma20: 248.20, volume: 1250000 },
  { id: 'etf_017', symbol: 'NSE:SETFNIF50', name: 'SBI NIFTY 50 ETF', sector: 'Nifty 50', currentPrice: 244.80, change: 1.1, cmp: 244.80, dma20: 244.20, volume: 890000 },
  { id: 'etf_018', symbol: 'NSE:EQUAL50ADD', name: 'Equal Weight 50 ETF', sector: 'Equal Weight', currentPrice: 185.60, change: 0.8, cmp: 185.60, dma20: 185.20, volume: 450000 },
  { id: 'etf_019', symbol: 'NSE:ALPHA', name: 'Alpha ETF', sector: 'Alpha', currentPrice: 92.40, change: 1.3, cmp: 92.40, dma20: 91.80, volume: 320000 },
  { id: 'etf_020', symbol: 'NSE:AUTOBEES', name: 'Auto ETF', sector: 'Auto', currentPrice: 68.90, change: 0.9, cmp: 68.90, dma20: 68.40, volume: 280000 },
  { id: 'etf_021', symbol: 'NSE:BANKBEES', name: 'Bank ETF', sector: 'Bank', currentPrice: 456.78, change: -0.8, cmp: 456.78, dma20: 457.50, volume: 890000 },
  { id: 'etf_022', symbol: 'NSE:BANKIETF', name: 'Bank ETF', sector: 'Bank', currentPrice: 56.86, change: -0.6, cmp: 56.86, dma20: 56.25, volume: 720000 },
  { id: 'etf_023', symbol: 'NSE:SETFNIFBK', name: 'SBI Bank ETF', sector: 'Bank', currentPrice: 455.40, change: -0.9, cmp: 455.40, dma20: 461.20, volume: 680000 },
  { id: 'etf_024', symbol: 'NSE:DIVOPPBEES', name: 'Dividend Opportunities ETF', sector: 'Dividend', currentPrice: 125.60, change: 0.5, cmp: 125.60, dma20: 125.20, volume: 380000 },
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
  { id: 'etf_055', symbol: 'NSE:BSE500IETF', name: 'BSE 500 ETF', sector: 'Broad Market', currentPrice: 185.60, change: 0.9, cmp: 185.60, dma20: 184.80, volume: 380000 },
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
      return {
        ...state,
        holdings: [...state.holdings, action.payload]
      };
    
    case actionTypes.UPDATE_HOLDING:
      return {
        ...state,
        holdings: state.holdings.map(holding =>
          holding.id === action.payload.id ? action.payload : holding
        )
      };
    
    case actionTypes.REMOVE_HOLDING:
      return {
        ...state,
        holdings: state.holdings.filter(holding => holding.id !== action.payload)
      };
    
    case actionTypes.CLEAR_HOLDINGS:
      return {
        ...state,
        holdings: []
      };
    
    case actionTypes.ADD_SOLD_ITEM:
      return {
        ...state,
        soldItems: [...state.soldItems, action.payload],
        dailySellCount: state.dailySellCount + 1,
        lastSellDate: new Date().toISOString().split('T')[0]
      };
    
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
      // NUCLEAR OPTION: Completely ignore any data loading for new users
      console.log('🚫 NUCLEAR OPTION: Ignoring all data loading to prevent demo data');
      console.log('Payload received:', action.payload);
      
      // Only allow data loading if user is authenticated AND has completed setup
      if (!action.payload.auth || !action.payload.auth.isAuthenticated) {
        console.log('🚫 User not authenticated - ignoring data load');
        return {
          ...state,
          holdings: [],
          soldItems: [],
          userSetup: {
            isCompleted: false,
            userData: null,
            initialCapital: 0,
            tradingAmount: 0,
            hasETFTradingExperience: false
          }
        };
      }
      
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
      
      // For new users, don't load holdings and sold items from localStorage
      // Only load data if user setup is completed
      if (!action.payload.userSetup || !action.payload.userSetup.isCompleted) {
        console.log('🚫 New user detected - not loading holdings/sold items from localStorage');
        return {
          ...state,
          // Only load non-user-specific data
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
          // Keep user-specific data empty for new users
          holdings: [],
          soldItems: [],
          userSetup: state.userSetup,
          moneyManagement: state.moneyManagement,
          auth: state.auth
        };
      }
      
      // For existing users, load all data
      console.log('✅ Existing user - loading all data from localStorage');
      return {
        ...state,
        ...action.payload,
        tradingMessage: safeTradingMessage
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
          order.orderId === action.payload.orderId
            ? { ...order, ...action.payload }
            : order
        )
      };
    
    case actionTypes.REMOVE_PENDING_ORDER:
      return {
        ...state,
        pendingOrders: state.pendingOrders.filter(order => order.orderId !== action.payload)
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
        moneyManagement: action.payload.userData?.moneyManagement || state.moneyManagement
      };
    
    case actionTypes.USER_SIGNUP:
      // Clear any old demo data for new users - more aggressive approach
      console.log('🗑️ Clearing ALL demo data for new user signup');
      localStorage.removeItem('etfTradingData');
      localStorage.removeItem('etfHoldings');
      localStorage.removeItem('etfSoldItems');
      localStorage.removeItem('etfUserData');
      console.log('✅ All demo data cleared for new user');
      
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

  // Function to clear all demo data
  const clearAllDemoData = () => {
    console.log('🧹 Clearing all demo data...');
    localStorage.removeItem('etfTradingData');
    localStorage.removeItem('etfHoldings');
    localStorage.removeItem('etfSoldItems');
    console.log('✅ All demo data cleared');
  };

  // NUCLEAR OPTION: Completely clear state and prevent data loading
  useEffect(() => {
    console.log('🚫 NUCLEAR OPTION: Starting with completely empty state');
    clearAllDemoData();
    
    // Force empty state for new users
    dispatch({ type: actionTypes.CLEAR_HOLDINGS });
    dispatch({ type: actionTypes.CLEAR_SOLD_ITEMS });
    
    // Disable data loading until user is authenticated
    setDataLoadingEnabled(false);
    console.log('🚫 Data loading disabled until user authentication');
  }, []);

  // Load data from localStorage on mount - ONLY for existing users
  useEffect(() => {
    // Skip loading data if not enabled
    if (!dataLoadingEnabled) {
      console.log('🚫 Data loading disabled - skipping localStorage load');
      return;
    }

    // Skip loading data for new user sessions
    if (isNewUserSession) {
      console.log('🚫 Skipping localStorage loading for new user session');
      return;
    }

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
    }
    
    // Load data from localStorage (if any)
    const savedData = localStorage.getItem('etfTradingData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('📦 Loaded data:', parsedData);
        
        // Don't load demo data if user setup is not completed
        if (!parsedData.userSetup || !parsedData.userSetup.isCompleted) {
          console.log('🚫 User setup not completed, not loading demo data from localStorage');
          // Clear the old demo data for new users
          localStorage.removeItem('etfTradingData');
          console.log('🗑️ Cleared old demo data for new user');
          return;
        }
        
        // Ensure tradingMessage is always a string in loaded data
        if (parsedData.tradingMessage && typeof parsedData.tradingMessage === 'object') {
          console.log('🔄 Converting object tradingMessage to string:', parsedData.tradingMessage);
          parsedData.tradingMessage = JSON.stringify(parsedData.tradingMessage);
        }
        dispatch({ type: actionTypes.LOAD_DATA, payload: parsedData });
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    } else {
      console.log('📭 No saved data found in localStorage');
    }
  }, [isNewUserSession, dataLoadingEnabled]);

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
      // Check if market is open
      const isMarketOpen = checkMarketStatus();
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
  }, [state.etfs, state.holdings, state.lastFetchTime, checkMarketStatus]);

  // Auto-fetch data when user completes setup
  useEffect(() => {
    if (state.userSetup?.isCompleted && dataLoadingEnabled) {
      console.log('🎯 User setup completed - fetching initial data...');
      fetchAllDataOnLogin();
    }
  }, [state.userSetup?.isCompleted, dataLoadingEnabled, fetchAllDataOnLogin]);

  // Save data to localStorage whenever state changes (only in real mode)
  useEffect(() => {
    const isDemoMode = false; // Enable localStorage saving
    
    if (!isDemoMode) {
      localStorage.setItem('etfTradingData', JSON.stringify(state));
    }
  }, [state.holdings, state.soldItems, state.strategy, state.dailySellCount, state.lastSellDate, state.userSetup, state.moneyManagement]);

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
            const pythonPrices = await pythonPriceApiService.getLivePrices(symbols);
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
          
          // Update holdings with live prices
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
          
          // Update holdings in state
          updatedHoldings.forEach(holding => {
            dispatch({ type: actionTypes.UPDATE_HOLDING, payload: holding });
          });
        }
      } catch (error) {
        console.error('Error fetching live prices:', error);
      }
    };

    // Fetch prices immediately
    fetchLivePrices();

    // Set up interval for periodic updates (every 2 minutes during market hours)
    const interval = setInterval(() => {
      if (state.marketStatus) {
        fetchLivePrices();
      }
    }, 120000); // Changed from 30000 to 120000

    return () => clearInterval(interval);
  }, [state.marketStatus]); // Removed state.holdings dependency

  // Check market status periodically
  useEffect(() => {
    const checkMarketStatus = async () => {
      try {
        // Use Python API instead of browser-based API
        const pythonStatus = await pythonPriceApiService.testConnection();
        if (pythonStatus.status === 'success') {
          // If Python API is connected, assume market is open
          dispatch({ type: actionTypes.SET_MARKET_STATUS, payload: true });
        } else {
          // If Python API is not connected, assume market is closed
          dispatch({ type: actionTypes.SET_MARKET_STATUS, payload: false });
        }
      } catch (error) {
        console.error('Error checking market status via Python API:', error);
        // Default to closed if there's an error
        dispatch({ type: actionTypes.SET_MARKET_STATUS, payload: false });
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

      const result = await mstocksApiService.placeBuyOrder(orderData);
      
      // Add to pending orders
      const pendingOrder = {
        ...result,
        type: 'BUY',
        symbol: orderData.symbol,
        quantity: orderData.quantity,
        price: orderData.price,
        timestamp: new Date().toISOString()
      };
      
      dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: pendingOrder });
      
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'success', message: `Buy order placed successfully! Order ID: ${result.orderId}` } 
      });

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

      const result = await mstocksApiService.placeSellOrder(orderData);
      
      // Add to pending orders
      const pendingOrder = {
        ...result,
        type: 'SELL',
        symbol: orderData.symbol,
        quantity: orderData.quantity,
        price: orderData.price,
        timestamp: new Date().toISOString()
      };
      
      dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: pendingOrder });
      
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'success', message: `Sell order placed successfully! Order ID: ${result.orderId}` } 
      });

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
      
      const result = await mstocksApiService.placeBuyOrderWithLifecycle(orderData);
      
      if (result.success && result.holdingEntry) {
        // Add the new holding to the state
        dispatch({ type: actionTypes.ADD_HOLDING, payload: result.holdingEntry });
        dispatch({ 
          type: actionTypes.SET_TRADING_STATUS, 
          payload: { status: 'success', message: 'Buy order completed and added to holdings!' } 
        });
      } else {
        dispatch({ 
          type: actionTypes.SET_TRADING_STATUS, 
          payload: { status: 'warning', message: result.message } 
        });
      }
      
      return result;
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
      
      const result = await mstocksApiService.placeSellOrderWithLifecycle(orderData);
      
      if (result.success && result.soldItemEntry) {
        // Remove the holding from state
        if (orderData.holdingId) {
          dispatch({ type: actionTypes.REMOVE_HOLDING, payload: orderData.holdingId });
        }
        
        // Add the sold item to sold items
        dispatch({ type: actionTypes.ADD_SOLD_ITEM, payload: result.soldItemEntry });
        
        dispatch({ 
          type: actionTypes.SET_TRADING_STATUS, 
          payload: { status: 'success', message: 'Sell order completed and processed!' } 
        });
      } else {
        dispatch({ 
          type: actionTypes.SET_TRADING_STATUS, 
          payload: { status: 'warning', message: result.message } 
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

  const checkOrderStatus = async (orderId) => {
    try {
      const status = await mstocksApiService.getOrderStatus(orderId);
      
      dispatch({ type: actionTypes.UPDATE_ORDER_STATUS, payload: status });
      
      // If order is complete, move to history and update holdings
      if (status.status === 'COMPLETE') {
        const pendingOrder = state.pendingOrders.find(order => order.orderId === orderId);
        if (pendingOrder) {
          // Move to order history
          dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: pendingOrder });
          dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: orderId });
          
          // Update holdings based on order type
          if (pendingOrder.type === 'BUY') {
            // Add new holding
            const newHolding = {
              id: `holding_${Date.now()}`,
              symbol: pendingOrder.symbol,
              name: state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.name || pendingOrder.symbol,
              sector: state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.sector || 'Unknown',
              buyDate: new Date().toISOString().split('T')[0],
              buyPrice: status.averagePrice || pendingOrder.price,
              quantity: status.filledQuantity || pendingOrder.quantity,
              totalInvested: (status.averagePrice || pendingOrder.price) * (status.filledQuantity || pendingOrder.quantity),
              avgPrice: status.averagePrice || pendingOrder.price,
              currentPrice: status.averagePrice || pendingOrder.price,
              currentValue: (status.averagePrice || pendingOrder.price) * (status.filledQuantity || pendingOrder.quantity),
              profitLoss: 0,
              profitPercentage: 0,
              lastBuyPrice: status.averagePrice || pendingOrder.price,
              lastBuyDate: new Date().toISOString().split('T')[0]
            };
            dispatch({ type: actionTypes.ADD_HOLDING, payload: newHolding });
          } else if (pendingOrder.type === 'SELL') {
            // Add to sold items
            const soldItem = {
              id: `sold_${Date.now()}`,
              symbol: pendingOrder.symbol,
              name: state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.name || pendingOrder.symbol,
              sector: state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.sector || 'Unknown',
              buyDate: new Date().toISOString().split('T')[0], // This should come from the original holding
              sellDate: new Date().toISOString().split('T')[0],
              buyPrice: 0, // This should come from the original holding
              sellPrice: status.averagePrice || pendingOrder.price,
              quantity: status.filledQuantity || pendingOrder.quantity,
              profit: 0, // This should be calculated from original holding
              reason: 'Target achieved'
            };
            dispatch({ type: actionTypes.ADD_SOLD_ITEM, payload: soldItem });
          }
        }
      }
      
      return status;
    } catch (error) {
      console.error('Error checking order status:', error);
      throw error;
    }
  };

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

  const checkTradingEnabled = useCallback(() => {
    const isEnabled = mstocksApiService.isConfigured();
    dispatch({ type: actionTypes.SET_TRADING_ENABLED, payload: isEnabled });
    return isEnabled;
  }, []);

  const fetchOrderHistory = async () => {
    try {
      const history = await mstocksApiService.getOrderHistory();
      dispatch({ type: actionTypes.FETCH_ORDER_HISTORY, payload: history });
      return history;
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
    
    // Save user data to localStorage
    if (state.auth.currentUser) {
      const savedUsers = localStorage.getItem('etfUsers');
      const users = savedUsers ? JSON.parse(savedUsers) : {};
      const userKey = state.auth.currentUser.uid || state.auth.currentUser.username;
      
      console.log('User key:', userKey);
      console.log('Current users in localStorage:', users);
      
      if (users[userKey]) {
        users[userKey].userData = {
          holdings: state.holdings,
          soldItems: state.soldItems,
          userSetup: {
            isCompleted: true,
            userData: userData,
            initialCapital: userData.initialCapital,
            tradingAmount: userData.tradingAmount,
            hasETFTradingExperience: userData.hasETFTradingExperience
          },
          moneyManagement: state.moneyManagement
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
          const pythonApiStatus = await pythonPriceApiService.testConnection();
          console.log(`🔍 Python API Status:`, pythonApiStatus);
          pythonApiAvailable = pythonApiStatus.status === 'success';
        } catch (error) {
          console.warn(`⚠️ Python API server not available:`, error.message);
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
                console.log(`📈 Fetching price for ${etf.symbol} from Python API...`);
                const priceData = await pythonPriceApiService.getLivePrice(etf.symbol);
                console.log(`📊 Python API response for ${etf.symbol}:`, priceData);
                
                if (priceData && priceData.lastPrice && parseFloat(priceData.lastPrice) > 0) {
                  newPrice = parseFloat(priceData.lastPrice);
                  dataSource = priceData.source || 'Python MStocks API';
                  console.log(`✅ Python API price for ${etf.symbol}: ₹${newPrice}`);
                } else {
                  console.warn(`⚠️ Python API returned no valid price for ${etf.symbol}:`, priceData);
                }
              } catch (pythonError) {
                console.warn(`⚠️ Python API failed for ${etf.symbol}:`, pythonError.message);
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
          const pythonApiStatus = await pythonPriceApiService.testConnection();
          pythonApiAvailable = pythonApiStatus.status === 'success';
        } catch (error) {
          console.warn(`⚠️ Python API server not available:`, error.message);
        }
        
        let updatedHoldings = [...state.holdings];
        let successCount = 0;
        let errorCount = 0;
        
        for (const holding of updatedHoldings) {
          try {
            const priceData = await pythonPriceApiService.getLivePrice(holding.symbol);
            
            if (priceData && priceData.lastPrice && parseFloat(priceData.lastPrice) > 0) {
              const newPrice = parseFloat(priceData.lastPrice);
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