import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { auth } from '../firebase/config';
import mstocksApiService from '../services/mstocksApi';
import dmaApiService from '../services/dmaApi';

// Helper function to calculate compounding effect with sanity checks
const calculateCompoundingEffect = (nextBuyAmount, baseTradingAmount) => {
  if (!baseTradingAmount || baseTradingAmount <= 0) return 0;
  
  const effect = ((nextBuyAmount - baseTradingAmount) / baseTradingAmount) * 100;
  
  // Cap the compounding effect at a reasonable maximum (1000%)
  return Math.min(Math.max(effect, 0), 1000);
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
  // ... Add more ETFs as needed
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
  // Authentication state
  auth: {
    isAuthenticated: false,
    currentUser: null,
    isLoading: false,
    error: null
  },
  // User setup state
  userSetup: {
    isCompleted: false,
    userData: null
  },
  // Money management state
  moneyManagement: {
    totalCapital: 100000,
    availableCapital: 100000,
    investedCapital: 0,
    chunkSize: 10000,
    chunks: [],
    nextChunkIndex: 0
  },
  // Trading state
  isTradingEnabled: false,
  tradingMessage: '',
  // UI state
  isLoading: false,
  error: null
};

// Action types
export const actionTypes = {
  // Authentication
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SIGNUP_START: 'SIGNUP_START',
  SIGNUP_SUCCESS: 'SIGNUP_SUCCESS',
  SIGNUP_FAILURE: 'SIGNUP_FAILURE',
  
  // User Setup
  COMPLETE_USER_SETUP: 'COMPLETE_USER_SETUP',
  
  // Holdings
  SET_HOLDINGS: 'SET_HOLDINGS',
  ADD_HOLDING: 'ADD_HOLDING',
  UPDATE_HOLDING: 'UPDATE_HOLDING',
  REMOVE_HOLDING: 'REMOVE_HOLDING',
  
  // Sold Items
  SET_SOLD_ITEMS: 'SET_SOLD_ITEMS',
  ADD_SOLD_ITEM: 'ADD_SOLD_ITEM',
  UPDATE_SOLD_ITEM: 'UPDATE_SOLD_ITEM',
  REMOVE_SOLD_ITEM: 'REMOVE_SOLD_ITEM',
  
  // ETFs
  SET_ETFS: 'SET_ETFS',
  UPDATE_ETF_PRICES: 'UPDATE_ETF_PRICES',
  
  // Strategy
  UPDATE_STRATEGY: 'UPDATE_STRATEGY',
  
  // Money Management
  UPDATE_MONEY_MANAGEMENT: 'UPDATE_MONEY_MANAGEMENT',
  
  // Trading
  SET_TRADING_ENABLED: 'SET_TRADING_ENABLED',
  SET_TRADING_MESSAGE: 'SET_TRADING_MESSAGE',
  ADD_PENDING_ORDER: 'ADD_PENDING_ORDER',
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
  ADD_ORDER_HISTORY: 'ADD_ORDER_HISTORY',
  
  // Loading and Error
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const etfTradingReducer = (state, action) => {
  switch (action.type) {
    // Authentication
    case actionTypes.LOGIN_START:
      return {
        ...state,
        auth: {
          ...state.auth,
          isLoading: true,
          error: null
        }
      };
      
    case actionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        auth: {
          isAuthenticated: true,
          currentUser: action.payload,
          isLoading: false,
          error: null
        }
      };
      
    case actionTypes.LOGIN_FAILURE:
      return {
        ...state,
        auth: {
          ...state.auth,
          isLoading: false,
          error: action.payload
        }
      };
      
    case actionTypes.LOGOUT:
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          currentUser: null,
          isLoading: false,
          error: null
        }
      };
      
    // User Setup
    case actionTypes.COMPLETE_USER_SETUP:
      return {
        ...state,
        userSetup: {
          isCompleted: true,
          userData: action.payload
        }
      };
      
    // Holdings
    case actionTypes.SET_HOLDINGS:
      return {
        ...state,
        holdings: action.payload
      };
      
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
      
    // Sold Items
    case actionTypes.SET_SOLD_ITEMS:
      return {
        ...state,
        soldItems: action.payload
      };
      
    case actionTypes.ADD_SOLD_ITEM:
      return {
        ...state,
        soldItems: [...state.soldItems, action.payload]
      };
      
    // ETFs
    case actionTypes.SET_ETFS:
      return {
        ...state,
        etfs: action.payload
      };
      
    case actionTypes.UPDATE_ETF_PRICES:
      return {
        ...state,
        etfs: state.etfs.map(etf => {
          const updatedPrice = action.payload[etf.symbol];
          return updatedPrice ? { ...etf, currentPrice: updatedPrice, cmp: updatedPrice } : etf;
        }),
        livePrices: action.payload,
        lastPriceUpdate: new Date().toISOString()
      };
      
    // Strategy
    case actionTypes.UPDATE_STRATEGY:
      return {
        ...state,
        strategy: { ...state.strategy, ...action.payload }
      };
      
    // Money Management
    case actionTypes.UPDATE_MONEY_MANAGEMENT:
      return {
        ...state,
        moneyManagement: { ...state.moneyManagement, ...action.payload }
      };
      
    // Trading
    case actionTypes.SET_TRADING_ENABLED:
      return {
        ...state,
        isTradingEnabled: action.payload
      };
      
    case actionTypes.SET_TRADING_MESSAGE:
      return {
        ...state,
        tradingMessage: action.payload
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
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        )
      };
      
    case actionTypes.ADD_ORDER_HISTORY:
      return {
        ...state,
        orderHistory: [...state.orderHistory, action.payload]
      };
      
    // Loading and Error
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
      
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    default:
      return state;
  }
};

// Context
const ETFTradingContext = createContext();

// Provider Component
export const ETFTradingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(etfTradingReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app data from storage
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load data from AsyncStorage
        const [
          holdingsData,
          soldItemsData,
          userData,
          strategyData,
          moneyManagementData
        ] = await Promise.all([
          AsyncStorage.getItem('holdings'),
          AsyncStorage.getItem('soldItems'),
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('strategy'),
          AsyncStorage.getItem('moneyManagement')
        ]);

        // Restore state from storage
        if (holdingsData) {
          dispatch({ type: actionTypes.SET_HOLDINGS, payload: JSON.parse(holdingsData) });
        }
        
        if (soldItemsData) {
          dispatch({ type: actionTypes.SET_SOLD_ITEMS, payload: JSON.parse(soldItemsData) });
        }
        
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          dispatch({ type: actionTypes.LOGIN_SUCCESS, payload: parsedUserData });
        }
        
        if (strategyData) {
          dispatch({ type: actionTypes.UPDATE_STRATEGY, payload: JSON.parse(strategyData) });
        }
        
        if (moneyManagementData) {
          dispatch({ type: actionTypes.UPDATE_MONEY_MANAGEMENT, payload: JSON.parse(moneyManagementData) });
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Firebase auth state listener - simplified for React Native
  useEffect(() => {
    if (!isInitialized) return; // Don't set up auth listener until app is initialized
    
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔄 Firebase auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      if (firebaseUser && !state.auth.isAuthenticated) {
        // Only auto-login if not already authenticated
        console.log('🔄 Firebase auth state detected - auto-login');
        
        // Get user data from storage (like web version)
        const storedUsers = await AsyncStorage.getItem('etfUsers');
        const users = storedUsers ? JSON.parse(storedUsers) : {};
        
        const userData = users[firebaseUser.uid] || {
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
        
        // Check if this is an existing user (has completed setup before)
        const isExistingUser = userData.userSetup && userData.userSetup.isCompleted;
        
        // For existing users, restore their setup state
        if (isExistingUser) {
          console.log('✅ Existing user auto-login - restoring setup state');
          dispatch({ 
            type: actionTypes.COMPLETE_USER_SETUP, 
            payload: userData.userSetup 
          });
        }
        
        const loginData = {
          id: firebaseUser.uid,
          username: userData.username || firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          name: userData.name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
          picture: userData.picture || firebaseUser.photoURL,
          isFirebaseUser: true,
          isGoogleUser: userData.isGoogleUser || false,
          isExistingUser: isExistingUser
        };
        
        await AsyncStorage.setItem('userData', JSON.stringify(loginData));
        dispatch({ type: actionTypes.LOGIN_SUCCESS, payload: loginData });
      } else if (!firebaseUser && state.auth.isAuthenticated) {
        // User signed out
        console.log('🚪 Firebase auth state - user signed out');
        await AsyncStorage.removeItem('userData');
        dispatch({ type: actionTypes.LOGOUT });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [state.auth.isAuthenticated, isInitialized]);

  // Save data to storage when state changes
  useEffect(() => {
    if (!isInitialized) return;

    const saveData = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem('holdings', JSON.stringify(state.holdings)),
          AsyncStorage.setItem('soldItems', JSON.stringify(state.soldItems)),
          AsyncStorage.setItem('strategy', JSON.stringify(state.strategy)),
          AsyncStorage.setItem('moneyManagement', JSON.stringify(state.moneyManagement))
        ]);
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };

    saveData();
  }, [state.holdings, state.soldItems, state.strategy, state.moneyManagement, isInitialized]);

  // Authentication functions
  const userLogin = useCallback(async (credentials) => {
    dispatch({ type: actionTypes.LOGIN_START });
    
    try {
      // Firebase authentication - exactly like web version
      const userCredential = await auth.signInWithEmailAndPassword(credentials.email, credentials.password);
      const firebaseUser = userCredential.user;
      
      console.log('Firebase login successful:', firebaseUser);
      
      // Get user data from storage (like web version)
      const storedUsers = await AsyncStorage.getItem('etfUsers');
      const users = storedUsers ? JSON.parse(storedUsers) : {};
      
      const userData = users[firebaseUser.uid] || {
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
      
      console.log('User data for UID:', firebaseUser.uid);
      console.log('User setup completed:', userData.userSetup?.isCompleted);
      
      // Check if this is an existing user (has completed setup before)
      const isExistingUser = userData.userSetup && userData.userSetup.isCompleted;
      console.log('Is existing user:', isExistingUser);
      
      // For existing users, restore their setup state
      if (isExistingUser) {
        console.log('Existing user detected - setting up completed state');
        dispatch({ 
          type: actionTypes.COMPLETE_USER_SETUP, 
          payload: userData.userSetup 
        });
      }
      
      dispatch({ 
        type: actionTypes.LOGIN_SUCCESS, 
        payload: { 
          id: firebaseUser.uid,
          username: userData.username || firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          name: userData.name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
          picture: userData.picture || firebaseUser.photoURL,
          isFirebaseUser: true,
          isExistingUser: isExistingUser
        }
      });

      // Persist current user for refresh persistence
      await AsyncStorage.setItem('etfCurrentUser', JSON.stringify({
        username: userData.username || firebaseUser.displayName || firebaseUser.email.split('@')[0],
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        isFirebaseUser: true
      }));
      
      console.log('✅ Firebase user logged in successfully:', firebaseUser.email);
      console.log('Is existing user:', isExistingUser);
      
    } catch (error) {
      console.error('❌ Firebase login failed:', error);
      dispatch({ type: actionTypes.LOGIN_FAILURE, payload: error.message });
    }
  }, []);

  const userSignup = useCallback(async (userData) => {
    dispatch({ type: actionTypes.SIGNUP_START });
    
    try {
      let firebaseUser;
      
      if (userData.isGoogleUser) {
        // Handle Google authentication (user already authenticated via Google)
        firebaseUser = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.name,
          photoURL: userData.picture
        };
        console.log('Google user signup:', firebaseUser);
      } else {
        // Handle traditional Firebase email/password signup
        const userCredential = await auth.createUserWithEmailAndPassword(userData.email, userData.password);
        firebaseUser = userCredential.user;
        
        console.log('Firebase signup successful:', firebaseUser);
        
        // Update Firebase profile with display name
        if (userData.username) {
          await firebaseUser.updateProfile({
            displayName: userData.username
          });
        }
      }

      // Store user data like web version
      const storedUsers = await AsyncStorage.getItem('etfUsers');
      const users = storedUsers ? JSON.parse(storedUsers) : {};
      
      const userKey = firebaseUser.uid;
      
      // Check if user already exists
      if (users[userKey]) {
        // User exists, treat as login
        const existingUser = users[userKey];
        const isExistingUser = existingUser.userSetup && existingUser.userSetup.isCompleted;
        
        if (isExistingUser) {
          dispatch({ 
            type: actionTypes.COMPLETE_USER_SETUP, 
            payload: existingUser.userSetup 
          });
        }
        
        dispatch({ 
          type: actionTypes.SIGNUP_SUCCESS, 
          payload: {
            id: firebaseUser.uid,
            username: existingUser.username,
            email: firebaseUser.email,
            name: existingUser.name,
            picture: existingUser.picture,
            isFirebaseUser: true,
            isGoogleUser: userData.isGoogleUser || false,
            isExistingUser: isExistingUser
          }
        });

        // Persist current user for refresh persistence
        await AsyncStorage.setItem('etfCurrentUser', JSON.stringify({
          username: existingUser.username,
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          isFirebaseUser: true,
          isGoogleUser: userData.isGoogleUser || false
        }));
        
        console.log('✅ Existing user logged in successfully:', userData.email);
        return;
      }
      
      // Create new user data structure
      const newUserData = {
        username: userData.username,
        email: firebaseUser.email,
        name: userData.name || userData.username,
        picture: firebaseUser.photoURL,
        uid: firebaseUser.uid,
        isFirebaseUser: true,
        isGoogleUser: userData.isGoogleUser || false,
        isExistingUser: false,
        createdAt: new Date().toISOString(),
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
      
      // Save to users storage
      users[userKey] = newUserData;
      await AsyncStorage.setItem('etfUsers', JSON.stringify(users));
      
      dispatch({ 
        type: actionTypes.SIGNUP_SUCCESS, 
        payload: {
          id: firebaseUser.uid,
          username: userData.username,
          email: firebaseUser.email,
          name: userData.name || userData.username,
          picture: firebaseUser.photoURL,
          isFirebaseUser: true,
          isGoogleUser: userData.isGoogleUser || false,
          isExistingUser: false
        }
      });

      // Persist current user for refresh persistence
      await AsyncStorage.setItem('etfCurrentUser', JSON.stringify({
        username: userData.username,
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        isFirebaseUser: true,
        isGoogleUser: userData.isGoogleUser || false
      }));
      
      console.log('✅ New user signed up successfully:', userData.email);
      
    } catch (error) {
      console.error('❌ Signup failed:', error);
      dispatch({ type: actionTypes.SIGNUP_FAILURE, payload: error.message });
    }
  }, []);

  const userLogout = useCallback(async () => {
    try {
      // Firebase sign out
      await auth.signOut();
      await AsyncStorage.removeItem('userData');
      dispatch({ type: actionTypes.LOGOUT });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  const completeUserSetup = useCallback((userData) => {
    dispatch({ type: actionTypes.COMPLETE_USER_SETUP, payload: userData });
  }, []);

  // API functions - simplified for mobile
  const fetchETFs = useCallback(async () => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      // For now, use sample data to avoid API issues
      console.log('Fetching ETFs (using sample data)');
      dispatch({ type: actionTypes.SET_ETFS, payload: sampleETFs });
    } catch (error) {
      console.error('Error fetching ETFs:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: 'Failed to fetch ETFs' });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, []);

  const updatePrices = useCallback(async () => {
    try {
      console.log('Updating prices (mock implementation)');
      // Mock price updates for now
      const mockPrices = {};
      sampleETFs.forEach(etf => {
        mockPrices[etf.symbol] = etf.currentPrice + (Math.random() - 0.5) * 2;
      });
      dispatch({ type: actionTypes.UPDATE_ETF_PRICES, payload: mockPrices });
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  }, []);

  // Computed values
  const totalInvested = state.holdings.reduce((total, holding) => {
    return total + ((holding.avgPrice || holding.buyPrice) * (holding.quantity || 0));
  }, 0);

  const totalProfit = state.holdings.reduce((total, holding) => {
    const buyPrice = holding.avgPrice || holding.buyPrice;
    const currentPrice = holding.currentPrice || buyPrice;
    const quantity = holding.quantity || 0;
    return total + ((currentPrice - buyPrice) * quantity);
  }, 0);

  const targetProfit = state.strategy.profitTarget;

  // Context value
  const value = {
    // State
    ...state,
    
    // Computed values
    totalInvested,
    totalProfit,
    targetProfit,
    
    // Actions
    dispatch,
    actionTypes,
    
    // Authentication
    userLogin,
    userSignup,
    userLogout,
    completeUserSetup,
    
    // API functions
    fetchETFs,
    updatePrices,
    
    // Loading state
    isInitialized
  };

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <Text style={{ color: '#ffffff', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ETFTradingContext.Provider value={value}>
      {children}
    </ETFTradingContext.Provider>
  );
};

// Hook to use the context
export const useETFTrading = () => {
  const context = useContext(ETFTradingContext);
  if (!context) {
    throw new Error('useETFTrading must be used within an ETFTradingProvider');
  }
  return context;
};
