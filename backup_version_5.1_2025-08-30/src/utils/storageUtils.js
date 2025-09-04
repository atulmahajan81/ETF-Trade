// Storage utilities for handling large datasets
// Implements compression and chunking to avoid localStorage quota issues
// Falls back to IndexedDB for larger datasets

// More aggressive compression: Remove unnecessary precision and use shorter keys
const compressData = (data) => {
  try {
    // Convert to string with minimal precision and shorter keys
    const compressed = JSON.stringify(data, (key, value) => {
      if (typeof value === 'number') {
        // Round to 1 decimal place for prices, 0 for volumes
        if (key === 'volume' || key === 'traded_volume' || key === 'totalTradedVolume') {
          return Math.round(value);
        }
        return Math.round(value * 10) / 10; // 1 decimal place for prices
      }
      return value;
    });
    
    return compressed;
  } catch (error) {
    console.error('Compression failed:', error);
    return JSON.stringify(data);
  }
};

// Decompress data
const decompressData = (compressedData) => {
  try {
    return JSON.parse(compressedData);
  } catch (error) {
    console.error('Decompression failed:', error);
    return null;
  }
};

// Calculate approximate size of data in bytes
const getDataSize = (data) => {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch (error) {
    return 0;
  }
};

// Check localStorage quota
const checkStorageQuota = () => {
  try {
    const testKey = 'quota_test';
    const testData = 'x'.repeat(1024 * 1024); // 1MB test
    
    // Try to store 1MB
    localStorage.setItem(testKey, testData);
    localStorage.removeItem(testKey);
    
    return true; // Can store at least 1MB
  } catch (error) {
    console.warn('Storage quota check failed:', error);
    return false;
  }
};

// IndexedDB operations
const openIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ETFHistoricalData', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('historicalData')) {
        db.createObjectStore('historicalData', { keyPath: 'key' });
      }
    };
  });
};

const saveToIndexedDB = async (key, data) => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['historicalData'], 'readwrite');
    const store = transaction.objectStore('historicalData');
    
    await store.put({ key, data, timestamp: new Date().toISOString() });
    console.log(`✅ Data saved to IndexedDB: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save to IndexedDB:', error);
    return false;
  }
};

const loadFromIndexedDB = async (key) => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['historicalData'], 'readonly');
    const store = transaction.objectStore('historicalData');
    
    const result = await store.get(key);
    if (result) {
      console.log(`✅ Data loaded from IndexedDB: ${key}`);
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to load from IndexedDB:', error);
    return null;
  }
};

// Chunk large data into smaller pieces
const chunkData = (data, maxChunkSize = 512 * 1024) => { // 512KB chunks (smaller)
  const chunks = [];
  const keys = Object.keys(data);
  let currentChunk = {};
  let currentSize = 0;
  
  for (const key of keys) {
    const itemSize = getDataSize({ [key]: data[key] });
    
    // If adding this item would exceed chunk size, start a new chunk
    if (currentSize + itemSize > maxChunkSize && Object.keys(currentChunk).length > 0) {
      chunks.push(currentChunk);
      currentChunk = {};
      currentSize = 0;
    }
    
    currentChunk[key] = data[key];
    currentSize += itemSize;
  }
  
  // Add the last chunk if it has data
  if (Object.keys(currentChunk).length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

// Save large data with compression and chunking
export const saveLargeData = async (key, data) => {
  try {
    console.log(`💾 Saving large data for key: ${key}`);
    console.log(`📊 Data size: ${(getDataSize(data) / 1024 / 1024).toFixed(2)} MB`);
    
    // First try to save as single compressed item
    const compressed = compressData(data);
    const compressedSize = compressed.length;
    
    console.log(`📦 Compressed size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
    
    // If compressed size is reasonable, save as single item
    if (compressedSize < 2 * 1024 * 1024) { // 2MB limit (reduced from 4MB)
      localStorage.setItem(key, compressed);
      localStorage.setItem(`${key}_metadata`, JSON.stringify({
        type: 'single',
        size: compressedSize,
        timestamp: new Date().toISOString()
      }));
      console.log('✅ Data saved as single compressed item');
      return true;
    }
    
    // If too large, try IndexedDB first
    console.log('📦 Data too large for localStorage, trying IndexedDB...');
    const indexedDBSuccess = await saveToIndexedDB(key, data);
    if (indexedDBSuccess) {
      localStorage.setItem(`${key}_metadata`, JSON.stringify({
        type: 'indexeddb',
        size: getDataSize(data),
        timestamp: new Date().toISOString()
      }));
      return true;
    }
    
    // If IndexedDB fails, try chunking
    console.log('📦 IndexedDB failed, chunking data...');
    const chunks = chunkData(data);
    
    // Save chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunkKey = `${key}_chunk_${i}`;
      const compressedChunk = compressData(chunks[i]);
      localStorage.setItem(chunkKey, compressedChunk);
    }
    
    // Save metadata
    localStorage.setItem(`${key}_metadata`, JSON.stringify({
      type: 'chunked',
      chunks: chunks.length,
      totalSize: getDataSize(data),
      timestamp: new Date().toISOString()
    }));
    
    console.log(`✅ Data saved as ${chunks.length} chunks`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to save large data:', error);
    
    // If quota exceeded, try to clear old data and retry
    if (error.name === 'QuotaExceededError') {
      console.log('🔄 Storage quota exceeded, clearing old data...');
      clearOldData();
      
      try {
        // Try IndexedDB again after clearing
        console.log('🔄 Trying IndexedDB after clearing old data...');
        const indexedDBSuccess = await saveToIndexedDB(key, data);
        if (indexedDBSuccess) {
          localStorage.setItem(`${key}_metadata`, JSON.stringify({
            type: 'indexeddb',
            size: getDataSize(data),
            timestamp: new Date().toISOString()
          }));
          return true;
        }
        
        // Try again with smaller chunks
        const chunks = chunkData(data, 256 * 1024); // 256KB chunks (even smaller)
        
        for (let i = 0; i < chunks.length; i++) {
          const chunkKey = `${key}_chunk_${i}`;
          const compressedChunk = compressData(chunks[i]);
          localStorage.setItem(chunkKey, compressedChunk);
        }
        
        localStorage.setItem(`${key}_metadata`, JSON.stringify({
          type: 'chunked',
          chunks: chunks.length,
          totalSize: getDataSize(data),
          timestamp: new Date().toISOString()
        }));
        
        console.log(`✅ Data saved as ${chunks.length} smaller chunks`);
        return true;
      } catch (retryError) {
        console.error('❌ Failed to save even with smaller chunks:', retryError);
        return false;
      }
    }
    
    return false;
  }
};

// Load large data with decompression and chunking
export const loadLargeData = async (key) => {
  try {
    console.log(`📂 Loading large data for key: ${key}`);
    
    // Check metadata
    const metadataStr = localStorage.getItem(`${key}_metadata`);
    if (!metadataStr) {
      // Try to load as single item (backward compatibility)
      const data = localStorage.getItem(key);
      if (data) {
        return decompressData(data);
      }
      return null;
    }
    
    const metadata = JSON.parse(metadataStr);
    
    if (metadata.type === 'single') {
      // Single compressed item
      const data = localStorage.getItem(key);
      return decompressData(data);
    } else if (metadata.type === 'indexeddb') {
      // IndexedDB data
      return await loadFromIndexedDB(key);
    } else if (metadata.type === 'chunked') {
      // Chunked data
      const allData = {};
      
      for (let i = 0; i < metadata.chunks; i++) {
        const chunkKey = `${key}_chunk_${i}`;
        const chunkData = localStorage.getItem(chunkKey);
        
        if (chunkData) {
          const decompressedChunk = decompressData(chunkData);
          if (decompressedChunk) {
            Object.assign(allData, decompressedChunk);
          }
        }
      }
      
      console.log(`✅ Loaded ${metadata.chunks} chunks`);
      return allData;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to load large data:', error);
    return null;
  }
};

// Clear old data to free up space
const clearOldData = () => {
  try {
    const keysToClear = [];
    
    // Find old historical data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('etf_historical_data') || key.includes('_chunk_'))) {
        keysToClear.push(key);
      }
    }
    
    // Clear old data
    keysToClear.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`🗑️ Cleared ${keysToClear.length} old data items`);
  } catch (error) {
    console.error('❌ Failed to clear old data:', error);
  }
};

// Check if data exists
export const hasLargeData = (key) => {
  const metadata = localStorage.getItem(`${key}_metadata`);
  if (metadata) {
    return true;
  }
  
  // Check for single item (backward compatibility)
  return localStorage.getItem(key) !== null;
};

// Get data size info
export const getDataInfo = (key) => {
  try {
    const metadataStr = localStorage.getItem(`${key}_metadata`);
    if (metadataStr) {
      return JSON.parse(metadataStr);
    }
    
    // For single items
    const data = localStorage.getItem(key);
    if (data) {
      return {
        type: 'single',
        size: data.length,
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get data info:', error);
    return null;
  }
};
