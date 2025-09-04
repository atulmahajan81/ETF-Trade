/**
 * Python Price API Service
 * Calls the Flask API server to get live prices from MStocks API
 * Enhanced with session persistence and management
 */

const PYTHON_API_BASE_URL = 'http://localhost:5000/api';

class PythonPriceApiService {
  constructor() {
    this.baseUrl = PYTHON_API_BASE_URL;
  }

  // Helper to append user id as query or header
  withUser(payload = {}) {
    try {
      const raw = localStorage.getItem('etfCurrentUser');
      if (!raw) return { payload, headers: {} };
      const u = JSON.parse(raw);
      const userId = u?.uid || u?.username;
      return { payload: { ...payload, user_id: userId }, headers: { 'X-User-Id': userId } };
    } catch {
      return { payload, headers: {} };
    }
  }

    // Place buy order via Python API
    async placeBuyOrder({ symbol, quantity, orderType = 'MARKET', product = 'CNC', validity = 'DAY', price, triggerPrice }) {
      try {
        const meta = this.withUser({
          symbol,
          quantity,
          order_type: orderType,
          product,
          validity,
          price,
          trigger_price: triggerPrice
        });
        const response = await fetch(`${this.baseUrl}/order/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...meta.headers },
          body: JSON.stringify(meta.payload)
        });
        return await response.json();
      } catch (error) {
        return { status: 'error', message: error.message };
      }
    }

    // Place sell order via Python API
    async placeSellOrder({ symbol, quantity, orderType = 'MARKET', product = 'CNC', validity = 'DAY', price, triggerPrice }) {
      try {
        const meta = this.withUser({
          symbol,
          quantity,
          order_type: orderType,
          product,
          validity,
          price,
          trigger_price: triggerPrice
        });
        const response = await fetch(`${this.baseUrl}/order/sell`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...meta.headers },
          body: JSON.stringify(meta.payload)
        });
        return await response.json();
      } catch (error) {
        return { status: 'error', message: error.message };
      }
    }
  // Health check with session status
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('Python API health check failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  // Get order status
  async getOrderStatus(orderId) {
    try {
      const meta = this.withUser();
      const url = `${this.baseUrl}/order/status?order_id=${encodeURIComponent(orderId)}${meta.headers['X-User-Id'] ? `&user_id=${encodeURIComponent(meta.headers['X-User-Id'])}` : ''}`;
      const response = await fetch(url, { headers: { ...meta.headers } });
      const result = await response.json();
      // Normalize Python API result to a simple shape
      if (result && result.status) {
        const data = result.data || result;
        return {
          orderId,
          status: (data.status || data.order_status || result.status).toString().toUpperCase(),
          averagePrice: data.averagePrice || data.avg_price,
          filledQuantity: data.filledQuantity || data.filled_qty,
          message: result.message
        };
      }
      return result;
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Get today's orders
  async getTodaysOrders() {
    try {
      const meta = this.withUser();
      const url = `${this.baseUrl}/orders/today${meta.headers['X-User-Id'] ? `?user_id=${encodeURIComponent(meta.headers['X-User-Id'])}` : ''}`;
      const response = await fetch(url, { headers: { ...meta.headers } });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Get detailed session status
  async getSessionStatus() {
    try {
      const meta = this.withUser();
      const response = await fetch(`${this.baseUrl}/session/status${meta.headers['X-User-Id'] ? `?user_id=${encodeURIComponent(meta.headers['X-User-Id'])}` : ''}`, { headers: { ...meta.headers } });
      return await response.json();
    } catch (error) {
      console.error('Python API session status failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  // Manually refresh session
  async refreshSession() {
    try {
      console.log('🔄 Manually refreshing session via Python API...');
      const meta = this.withUser();
      const response = await fetch(`${this.baseUrl}/session/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...meta.headers },
        body: JSON.stringify(meta.payload)
      });

      const result = await response.json();
      console.log('🔄 Python API session refresh result:', result);
      return result;
    } catch (error) {
      console.error('Python API session refresh failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  // Clear session
  async clearSession() {
    try {
      console.log('🗑️ Clearing session via Python API...');
      const meta = this.withUser();
      const response = await fetch(`${this.baseUrl}/session/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...meta.headers },
        body: JSON.stringify(meta.payload)
      });

      const result = await response.json();
      console.log('🗑️ Python API session clear result:', result);
      return result;
    } catch (error) {
      console.error('Python API session clear failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  // Login to MStocks
  async login(username, password) {
    try {
      console.log('🔐 Logging in via Python API...');
      const meta = this.withUser({ username, password });
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...meta.headers },
        body: JSON.stringify(meta.payload)
      });

      const result = await response.json();
      console.log('🔐 Python API login result:', result);
      return result;
    } catch (error) {
      console.error('Python API login failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  // Removed autoLogin

  // Generate session
  async generateSession(apiKey, requestToken, otp) {
    try {
      console.log("🔐 Generating session via Python API...");
      console.log("📋 Parameters:", { apiKey: apiKey?.substring(0, 10) + "...", requestToken: requestToken?.substring(0, 20) + "...", otp });
      
      const meta = this.withUser({
        api_key: apiKey,
        request_token: requestToken,
        otp
      });
      const response = await fetch(`${PYTHON_API_BASE_URL}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...meta.headers },
        body: JSON.stringify(meta.payload)
      });

      const result = await response.json();
      console.log("🔐 Python API session generation result:", result);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.message || 'Session generation failed'}`);
      }
      
      return result;
    } catch (error) {
      console.error("❌ Python API session generation error:", error);
      throw error;
    }
  }

  // Get live price for a single symbol
  async getLivePrice(symbol) {
    try {
      console.log(`�� Fetching price for ${symbol} via Python API...`);
      const meta = this.withUser();
      const response = await fetch(`${this.baseUrl}/price/${encodeURIComponent(symbol)}${meta.headers['X-User-Id'] ? `?user_id=${encodeURIComponent(meta.headers['X-User-Id'])}` : ''}`, { headers: { ...meta.headers } });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`📊 Python API price result for ${symbol}:`, result);

      if (result.status === 'success') {
        return {
          symbol: symbol,
          lastPrice: result.price,
          change: 0,
          changePercent: 0,
          volume: 0,
          timestamp: new Date().toISOString(),
          source: result.source || 'Python MStocks API'
        };
      } else {
        throw new Error(result.message || 'Failed to get price');
      }
    } catch (error) {
      console.error(`Python API price fetch failed for ${symbol}:`, error);
      return {
        symbol: symbol,
        lastPrice: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        timestamp: new Date().toISOString(),
        source: 'Python MStocks API (Failed)',
        error: error.message
      };
    }
  }

  // Get live prices for multiple symbols
  async getLivePrices(symbols) {
    try {
      console.log(`📈 Fetching prices for ${symbols.length} symbols via Python API...`);
      const meta = this.withUser({ symbols });
      const response = await fetch(`${this.baseUrl}/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...meta.headers },
        body: JSON.stringify(meta.payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 Python API multiple prices result:', result);

      if (result.status === 'success' && result.data) {
        return result.data.map(item => ({
          symbol: item.symbol,
          lastPrice: item.price || 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          timestamp: new Date().toISOString(),
          source: item.source || 'Python MStocks API'
        }));
      } else {
        throw new Error(result.message || 'Failed to get prices');
      }
    } catch (error) {
      console.error('Python API multiple prices fetch failed:', error);
      return symbols.map(symbol => ({
        symbol: symbol,
        lastPrice: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        timestamp: new Date().toISOString(),
        source: 'Python MStocks API (Failed)',
        error: error.message
      }));
    }
  }

  // Logout
  async logout() {
    try {
      console.log('🚪 Logging out via Python API...');
      const meta = this.withUser();
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...meta.headers },
        body: JSON.stringify(meta.payload)
      });

      const result = await response.json();
      console.log('🚪 Python API logout result:', result);
      return result;
    } catch (error) {
      console.error('Python API logout failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  // Get server status
  async getStatus() {
    try {
      const meta = this.withUser();
      const response = await fetch(`${this.baseUrl}/status`, { headers: { ...meta.headers } });
      return await response.json();
    } catch (error) {
      console.error('Python API status check failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  // Test connection
  async testConnection() {
    try {
      const healthResult = await this.healthCheck();
      if (healthResult.status === 'success') {
        const sessionResult = await this.getSessionStatus();
        return {
          status: 'success',
          message: 'Python API server is running',
          session: sessionResult
        };
      } else {
        return {
          status: 'error',
          message: 'Python API server is not responding'
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Connection test failed: ${error.message}`
      };
    }
  }

  // Get DMA20 for a symbol
  async getDMA20(symbol) {
    try {
      console.log(`📊 Fetching DMA20 for ${symbol} via Python API...`);
      const meta = this.withUser();
      const response = await fetch(`${this.baseUrl}/dma20/${encodeURIComponent(symbol)}${meta.headers['X-User-Id'] ? `?user_id=${encodeURIComponent(meta.headers['X-User-Id'])}` : ''}`, { headers: { ...meta.headers } });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`📊 Python API DMA20 result for ${symbol}:`, result);
      return result;
    } catch (error) {
      console.error(`Python API DMA20 failed for ${symbol}:`, error);
      return { status: 'error', message: error.message };
    }
  }

  // Get DMA20 for multiple symbols
  async getMultipleDMA20(symbols) {
    try {
      console.log(`📊 Fetching DMA20 for ${symbols.length} symbols via Python API...`);
      const meta = this.withUser({ symbols });
      const response = await fetch(`${this.baseUrl}/dma20/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...meta.headers },
        body: JSON.stringify(meta.payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`📊 Python API batch DMA20 result:`, result);
      return result;
    } catch (error) {
      console.error('Python API batch DMA20 failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  // Check if session is valid and auto-refresh if needed
  async checkAndRefreshSession() {
    try {
      const sessionStatus = await this.getSessionStatus();
      
      if (sessionStatus.status === 'success') {
        if (sessionStatus.logged_in && sessionStatus.session_valid) {
          console.log('✅ Session is valid');
          return { valid: true, session: sessionStatus };
        } else if (sessionStatus.auto_refresh_available) {
          console.log('🔄 Session invalid, attempting auto-refresh...');
          const refreshResult = await this.refreshSession();
          if (refreshResult.status === 'success') {
            console.log('✅ Session auto-refreshed successfully');
            return { valid: true, refreshed: true, session: refreshResult };
          } else {
            console.log('❌ Session auto-refresh failed');
            return { valid: false, error: refreshResult.message };
          }
        } else {
          console.log('❌ Session invalid and no auto-refresh available');
          return { valid: false, error: 'Session expired and no saved credentials for auto-refresh' };
        }
      } else {
        return { valid: false, error: sessionStatus.message };
      }
    } catch (error) {
      console.error('Session check failed:', error);
      return { valid: false, error: error.message };
    }
  }
}

const pythonPriceApiService = new PythonPriceApiService();
export default pythonPriceApiService; 