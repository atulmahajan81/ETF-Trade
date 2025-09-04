// DMA API Service for React Native
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class DmaApiService {
  constructor() {
    this.baseURL = 'https://api.dma.com'; // Replace with actual DMA API URL
    this.axiosInstance = this.createAxiosInstance();
  }

  createAxiosInstance() {
    const instance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    instance.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem('dmaAccessToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting DMA token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear it
          await AsyncStorage.removeItem('dmaAccessToken');
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }

  // Get DMA data for ETFs
  async getDMAData(symbols = []) {
    try {
      if (!symbols || symbols.length === 0) {
        return { success: false, data: [], message: 'No symbols provided' };
      }

      const response = await this.axiosInstance.post('/dma/calculate', {
        symbols: symbols,
        period: 20 // Default to 20-day moving average
      });

      return {
        success: true,
        data: response.data,
        message: 'DMA data retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching DMA data:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch DMA data'
      };
    }
  }

  // Calculate 20-day moving average locally (fallback)
  calculateDMA20(priceHistory = []) {
    try {
      if (!priceHistory || priceHistory.length < 20) {
        return null;
      }

      const last20Prices = priceHistory.slice(-20);
      const sum = last20Prices.reduce((acc, price) => acc + price, 0);
      return sum / 20;
    } catch (error) {
      console.error('Error calculating DMA20:', error);
      return null;
    }
  }

  // Get sample DMA data for testing
  getSampleDMAData() {
    return {
      success: true,
      data: [
        { symbol: 'NSE:CPSEETF', dma20: 44.80, trend: 'bullish' },
        { symbol: 'NSE:GOLDBEES', dma20: 52.10, trend: 'bullish' },
        { symbol: 'NSE:GOLD1', dma20: 51.60, trend: 'bullish' },
        { symbol: 'NSE:SETFGOLD', dma20: 53.20, trend: 'bullish' },
        { symbol: 'NSE:HNGSNGBEES', dma20: 52.70, trend: 'bullish' },
        { symbol: 'NSE:MONQ50', dma20: 80.5, trend: 'bearish' },
        { symbol: 'NSE:MON100', dma20: 124.20, trend: 'bullish' },
        { symbol: 'NSE:NIF100IETF', dma20: 28.45, trend: 'bearish' },
        { symbol: 'NSE:LOWVOL1', dma20: 94.90, trend: 'bullish' },
      ],
      message: 'Sample DMA data'
    };
  }

  // Check if API is available
  async isApiAvailable() {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      console.warn('DMA API not available, using fallback mode');
      return false;
    }
  }
}

const dmaApiService = new DmaApiService();
export default dmaApiService;

