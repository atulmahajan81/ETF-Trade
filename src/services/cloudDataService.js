// Cloud Data Persistence Service
// Syncs user data across all devices and browsers using Firebase Firestore

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';

class CloudDataService {
  constructor() {
    this.userId = null;
    this.isOnline = navigator.onLine;
    this.setupOnlineStatusListener();
  }

  // Set the current user ID for data operations
  setUserId(userId) {
    this.userId = userId;
    console.log('🔐 Cloud Data Service: User ID set to', userId);
  }

  // Setup online/offline status listener
  setupOnlineStatusListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - syncing data...');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Offline - data will be cached locally');
    });
  }

  // Generic method to save data to cloud
  async saveToCloud(dataType, data, options = {}) {
    if (!this.userId) {
      console.warn('⚠️ No user ID set, saving to localStorage only');
      return this.saveToLocalStorage(dataType, data);
    }

    try {
      const docRef = doc(db, 'users', this.userId, 'data', dataType);
      const dataToSave = {
        ...data,
        lastUpdated: serverTimestamp(),
        userId: this.userId,
        ...options
      };

      await setDoc(docRef, dataToSave, { merge: true });
      console.log(`✅ ${dataType} saved to cloud successfully`);
      
      // Also save to localStorage as backup
      this.saveToLocalStorage(dataType, data);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to save ${dataType} to cloud:`, error);
      
      // Fallback to localStorage
      this.saveToLocalStorage(dataType, data);
      return false;
    }
  }

  // Generic method to load data from cloud
  async loadFromCloud(dataType) {
    if (!this.userId) {
      console.warn('⚠️ No user ID set, loading from localStorage only');
      return this.loadFromLocalStorage(dataType);
    }

    try {
      const docRef = doc(db, 'users', this.userId, 'data', dataType);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`✅ ${dataType} loaded from cloud successfully`);
        
        // Also save to localStorage for offline access
        this.saveToLocalStorage(dataType, data);
        
        return data;
      } else {
        console.log(`📄 No ${dataType} found in cloud, checking localStorage`);
        return this.loadFromLocalStorage(dataType);
      }
    } catch (error) {
      console.error(`❌ Failed to load ${dataType} from cloud:`, error);
      
      // Fallback to localStorage
      return this.loadFromLocalStorage(dataType);
    }
  }

  // Real-time data sync (listens for changes)
  subscribeToData(dataType, callback) {
    if (!this.userId) {
      console.warn('⚠️ No user ID set, cannot subscribe to real-time updates');
      return () => {};
    }

    const docRef = doc(db, 'users', this.userId, 'data', dataType);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log(`🔄 Real-time update for ${dataType}:`, data);
        
        // Save to localStorage for offline access
        this.saveToLocalStorage(dataType, data);
        
        callback(data);
      } else {
        console.log(`📄 No ${dataType} found in real-time sync`);
        callback(null);
      }
    }, (error) => {
      console.error(`❌ Real-time sync error for ${dataType}:`, error);
    });
  }

  // Save holdings data
  async saveHoldings(holdings) {
    return await this.saveToCloud('holdings', { holdings });
  }

  // Load holdings data
  async loadHoldings() {
    const data = await this.loadFromCloud('holdings');
    return data?.holdings || [];
  }

  // Save sold items data
  async saveSoldItems(soldItems) {
    return await this.saveToCloud('soldItems', { soldItems });
  }

  // Load sold items data
  async loadSoldItems() {
    const data = await this.loadFromCloud('soldItems');
    return data?.soldItems || [];
  }

  // Save backtest historical data
  async saveBacktestData(historicalData) {
    // Split large data into chunks for Firestore limits
    const chunks = this.chunkData(historicalData, 1000000); // 1MB chunks
    
    for (let i = 0; i < chunks.length; i++) {
      await this.saveToCloud(`backtestData_chunk_${i}`, { 
        chunkIndex: i,
        totalChunks: chunks.length,
        data: chunks[i]
      });
    }
    
    // Save metadata
    await this.saveToCloud('backtestData_meta', {
      totalChunks: chunks.length,
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`✅ Backtest data saved in ${chunks.length} chunks`);
    return true;
  }

  // Load backtest historical data
  async loadBacktestData() {
    try {
      // Load metadata first
      const meta = await this.loadFromCloud('backtestData_meta');
      if (!meta || !meta.totalChunks) {
        return {};
      }

      // Load all chunks
      const allData = {};
      for (let i = 0; i < meta.totalChunks; i++) {
        const chunkData = await this.loadFromCloud(`backtestData_chunk_${i}`);
        if (chunkData && chunkData.data) {
          Object.assign(allData, chunkData.data);
        }
      }

      console.log(`✅ Backtest data loaded from ${meta.totalChunks} chunks`);
      return allData;
    } catch (error) {
      console.error('❌ Failed to load backtest data:', error);
      return {};
    }
  }

  // Save user preferences/settings
  async saveUserSettings(settings) {
    return await this.saveToCloud('userSettings', { settings });
  }

  // Load user preferences/settings
  async loadUserSettings() {
    const data = await this.loadFromCloud('userSettings');
    return data?.settings || {};
  }

  // Save MStocks session data
  async saveMStocksSession(sessionData) {
    return await this.saveToCloud('mstocksSession', { sessionData });
  }

  // Load MStocks session data
  async loadMStocksSession() {
    const data = await this.loadFromCloud('mstocksSession');
    return data?.sessionData || null;
  }

  // Save API configuration
  async saveApiConfig(config) {
    return await this.saveToCloud('apiConfig', { config });
  }

  // Load API configuration
  async loadApiConfig() {
    const data = await this.loadFromCloud('apiConfig');
    return data?.config || null;
  }

  // Sync all pending data when coming back online
  async syncPendingData() {
    if (!this.isOnline || !this.userId) return;

    console.log('🔄 Syncing pending data...');
    
    // Get all localStorage keys that need syncing
    const keysToSync = [
      'holdings',
      'soldItems', 
      'userSettings',
      'mstocksSession',
      'apiConfig'
    ];

    for (const key of keysToSync) {
      try {
        const localData = this.loadFromLocalStorage(key);
        if (localData) {
          await this.saveToCloud(key, localData);
        }
      } catch (error) {
        console.error(`❌ Failed to sync ${key}:`, error);
      }
    }

    console.log('✅ Pending data sync completed');
  }

  // Helper method to chunk large data
  chunkData(data, maxSize) {
    const jsonString = JSON.stringify(data);
    const chunks = [];
    
    for (let i = 0; i < jsonString.length; i += maxSize) {
      chunks.push(JSON.parse(jsonString.slice(i, i + maxSize)));
    }
    
    return chunks;
  }

  // Local storage fallback methods
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(`cloud_${key}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`❌ Failed to save ${key} to localStorage:`, error);
      return false;
    }
  }

  loadFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(`cloud_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`❌ Failed to load ${key} from localStorage:`, error);
      return null;
    }
  }

  // Clear all user data (for logout)
  async clearUserData() {
    if (!this.userId) return;

    try {
      // Clear from cloud
      const dataTypes = [
        'holdings',
        'soldItems',
        'backtestData_meta',
        'userSettings',
        'mstocksSession',
        'apiConfig'
      ];

      for (const dataType of dataTypes) {
        const docRef = doc(db, 'users', this.userId, 'data', dataType);
        await deleteDoc(docRef);
      }

      // Clear from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cloud_')) {
          localStorage.removeItem(key);
        }
      });

      console.log('✅ All user data cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear user data:', error);
      return false;
    }
  }
}

// Create singleton instance
const cloudDataService = new CloudDataService();

export default cloudDataService;
