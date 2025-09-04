import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// API Configuration
const API_BASE_URL = 'https://api.mstocks.in'; // Replace with your actual API URL
const PROXY_URL = 'http://localhost:3001'; // Your proxy server URL

class MstocksApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.proxyURL = PROXY_URL;
    this.isAuthenticated = false;
    this.sessionToken = null;
    this.userId = null;
  }

  // Initialize the service
  async initialize() {
    try {
      // Load stored credentials
      const storedToken = await SecureStore.getItemAsync('mstocks_token');
      const storedUserId = await SecureStore.getItemAsync('mstocks_user_id');
      
      if (storedToken && storedUserId) {
        this.sessionToken = storedToken;
        this.userId = storedUserId;
        this.isAuthenticated = true;
      }
    } catch (error) {
      console.error('Error initializing Mstocks API service:', error);
    }
  }

  // Create axios instance with default config
  createAxiosInstance(useProxy = false) {
    const baseURL = useProxy ? this.proxyURL : this.baseURL;
    
    const instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ETF-Trading-Mobile/3.0.0',
      },
    });

    // Add request interceptor
    instance.interceptors.request.use(
      (config) => {
        if (this.sessionToken) {
          config.headers.Authorization = `Bearer ${this.sessionToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    instance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          await this.refreshToken();
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }

  // Authentication methods
  async login(credentials) {
    try {
      const api = this.createAxiosInstance();
      
      const response = await api.post('/auth/login', {
        username: credentials.username,
        password: credentials.password,
        // Add any additional required fields
      });

      if (response.data.success) {
        this.sessionToken = response.data.token;
        this.userId = response.data.userId;
        this.isAuthenticated = true;

        // Store credentials securely
        await SecureStore.setItemAsync('mstocks_token', this.sessionToken);
        await SecureStore.setItemAsync('mstocks_user_id', this.userId);

        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.sessionToken) {
        const api = this.createAxiosInstance();
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored credentials
      await SecureStore.deleteItemAsync('mstocks_token');
      await SecureStore.deleteItemAsync('mstocks_user_id');
      
      this.sessionToken = null;
      this.userId = null;
      this.isAuthenticated = false;
    }
  }

  async refreshToken() {
    try {
      const api = this.createAxiosInstance();
      const response = await api.post('/auth/refresh');
      
      if (response.data.success) {
        this.sessionToken = response.data.token;
        await SecureStore.setItemAsync('mstocks_token', this.sessionToken);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.logout();
    }
  }

  // ETF Data methods
  async getETFs() {
    try {
      const api = this.createAxiosInstance(true); // Use proxy for ETF data
      
      const response = await api.get('/etfs/list');
      
      if (response.data.success) {
        return response.data.etfs || [];
      } else {
        throw new Error(response.data.message || 'Failed to fetch ETFs');
      }
    } catch (error) {
      console.error('Error fetching ETFs:', error);
      // Return sample data as fallback
      return this.getSampleETFs();
    }
  }

  async getLivePrices(symbols = []) {
    try {
      const api = this.createAxiosInstance(true); // Use proxy for live prices
      
      const response = await api.post('/prices/live', {
        symbols: symbols.length > 0 ? symbols : undefined
      });
      
      if (response.data.success) {
        return response.data.prices || {};
      } else {
        throw new Error(response.data.message || 'Failed to fetch live prices');
      }
    } catch (error) {
      console.error('Error fetching live prices:', error);
      return {};
    }
  }

  async getHoldings() {
    try {
      if (!this.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const api = this.createAxiosInstance();
      
      const response = await api.get('/holdings/list');
      
      if (response.data.success) {
        return response.data.holdings || [];
      } else {
        throw new Error(response.data.message || 'Failed to fetch holdings');
      }
    } catch (error) {
      console.error('Error fetching holdings:', error);
      return [];
    }
  }

  async getSoldItems() {
    try {
      if (!this.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const api = this.createAxiosInstance();
      
      const response = await api.get('/trades/sold');
      
      if (response.data.success) {
        return response.data.soldItems || [];
      } else {
        throw new Error(response.data.message || 'Failed to fetch sold items');
      }
    } catch (error) {
      console.error('Error fetching sold items:', error);
      return [];
    }
  }

  // Trading methods
  async placeOrder(orderData) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const api = this.createAxiosInstance();
      
      const response = await api.post('/orders/place', orderData);
      
      if (response.data.success) {
        return response.data.order;
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const api = this.createAxiosInstance();
      
      const response = await api.get(`/orders/status/${orderId}`);
      
      if (response.data.success) {
        return response.data.order;
      } else {
        throw new Error(response.data.message || 'Failed to get order status');
      }
    } catch (error) {
      console.error('Error getting order status:', error);
      throw error;
    }
  }

  async cancelOrder(orderId) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const api = this.createAxiosInstance();
      
      const response = await api.post(`/orders/cancel/${orderId}`);
      
      if (response.data.success) {
        return response.data.order;
      } else {
        throw new Error(response.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }

  async getOrderHistory() {
    try {
      if (!this.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const api = this.createAxiosInstance();
      
      const response = await api.get('/orders/history');
      
      if (response.data.success) {
        return response.data.orders || [];
      } else {
        throw new Error(response.data.message || 'Failed to fetch order history');
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
      return [];
    }
  }

  // Market data methods
  async getMarketStatus() {
    try {
      const api = this.createAxiosInstance(true); // Use proxy for market data
      
      const response = await api.get('/market/status');
      
      if (response.data.success) {
        return response.data.marketStatus;
      } else {
        throw new Error(response.data.message || 'Failed to fetch market status');
      }
    } catch (error) {
      console.error('Error fetching market status:', error);
      return { isOpen: false, message: 'Market Closed' };
    }
  }

  // Sample data fallback
  getSampleETFs() {
    return [
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
    ];
  }

  // Utility methods
  isUserAuthenticated() {
    return this.isAuthenticated && this.sessionToken;
  }

  getUserId() {
    return this.userId;
  }

  getSessionToken() {
    return this.sessionToken;
  }
}

// Create and export singleton instance
const mstocksApiService = new MstocksApiService();

// Initialize the service
mstocksApiService.initialize();

export default mstocksApiService;

