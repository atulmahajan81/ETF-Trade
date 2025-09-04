// MStocks API Service for live price fetching and trading
// Using official MStocks Trading API v1
// Enhanced to replace Python backend functionality

// Removed demoDataService import
import googleFinanceApiService from './googleFinanceApi';
import {
  MSTOCKS_API_BASE_URL,
  MSTOCKS_TYPEB_API_BASE_URL,
  ORDERS_BASE_URL,
  buildProxyUrl,
  getConfigInfo,
  IS_LOCAL_DEV,
  IS_PRODUCTION
} from '../config/apiConfig';

// Log current configuration
console.log('🔧 API Configuration:', getConfigInfo());

// Demo mode flag - set to true for demo mode, false for live API calls
const DEMO_MODE = false; // Set to false for real trading, true for testing

class MStocksApiService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.apiKey = null;
    this.enctoken = null;
    this.refreshToken = null;
    this.userCredentials = null;
    this.username = null;
    this.demoMode = false;
    this.typebBaseUrl = MSTOCKS_TYPEB_API_BASE_URL;
    this._scriptMaster = null;
    this._scriptMasterFetchedAt = null;
    this.symbolTokenMap = {};
    
    // Initialize demo mode state from localStorage
    this.initializeDemoMode();
    
    // Auto-restore session on initialization
    this.autoRestoreSession();
  }

  // Fetch and cache Scriptmaster to resolve security tokens
  async getScriptMaster(force = false) {
    if (this.demoMode) return null;
    if (!this.validateSession()) return null;
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (!force && this._scriptMaster && this._scriptMasterFetchedAt && (Date.now() - this._scriptMasterFetchedAt.getTime()) < oneDayMs) {
      return this._scriptMaster;
    }
    try {
      const resp = await fetch(buildProxyUrl(MSTOCKS_API_BASE_URL, 'instruments/scriptmaster'), {
        method: 'GET',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!resp.ok) return null;
      const data = await resp.json().catch(() => null);
      if (data) {
        this._scriptMaster = data?.data || data;
        this._scriptMasterFetchedAt = new Date();
        return this._scriptMaster;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Resolve security token for a given symbol using Scriptmaster
  async resolveSecurityToken(symbol) {
    // Check cache first
    const cacheKeyVariants = [symbol, symbol.replace('NSE:', ''), symbol.replace('BSE:', ''), `${symbol}-EQ`];
    for (const k of cacheKeyVariants) {
      if (this.symbolTokenMap[k]) return this.symbolTokenMap[k];
    }

    const clean = symbol.replace('NSE:', '').replace('BSE:', '');
    const variants = [clean, `${clean}-EQ`, `${clean}.NS`, clean.toUpperCase()];
    const sm = await this.getScriptMaster();
    if (!sm) return null;
    const list = Array.isArray(sm) ? sm : (Array.isArray(sm?.instruments) ? sm.instruments : []);
    if (!Array.isArray(list)) return null;
    const pickToken = (obj) => obj.security_token || obj.token || obj.instrument_token || obj.tkn || obj.id || obj.securityToken || null;
    const pickSymbol = (obj) => obj.trading_symbol || obj.tradingsymbol || obj.tradingSymbol || obj.symbol || obj.sym || obj.tsym || '';
    const isNSE = (obj) => {
      const exch = obj.exchange || obj.exch || obj.exch_seg || obj.segment || '';
      return String(exch).toUpperCase().includes('NSE') || String(exch).toUpperCase() === 'E';
    };
    for (const v of variants) {
      const match = list.find(o => isNSE(o) && String(pickSymbol(o)).toUpperCase() === String(v).toUpperCase());
      if (match) {
        const token = pickToken(match);
        if (token) {
          this.symbolTokenMap[symbol] = token;
          this.symbolTokenMap[clean] = token;
          return token;
        }
      }
    }
    // Looser contains match
    for (const v of variants) {
      const match = list.find(o => isNSE(o) && String(pickSymbol(o)).toUpperCase().startsWith(String(v).toUpperCase()));
      if (match) {
        const token = pickToken(match);
        if (token) {
          this.symbolTokenMap[symbol] = token;
          this.symbolTokenMap[clean] = token;
          return token;
        }
      }
    }
    return null;
  }

  // Set user credentials for login
  setCredentials(username, password, requestToken) {
    this.userCredentials = { username, password, requestToken };
  }

  // Clear stored credentials
  clearCredentials() {
    this.userCredentials = null;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.apiKey = null;
    this.enctoken = null;
    this.refreshToken = null;
    this.username = null;
    this.demoMode = false;
    
    // Clear demo mode flag from localStorage
    localStorage.removeItem('demoMode');
  }

  // Load saved credentials from localStorage
  loadSavedCredentials() {
    try {
      const saved = localStorage.getItem('mstocks_credentials');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading saved MStocks credentials:', error);
    }
    return null;
  }

  // Save credentials to localStorage
  saveCredentials(username, password, apiKey) {
    try {
      localStorage.setItem('mstocks_credentials', JSON.stringify({
        username, password, apiKey
      }));
    } catch (error) {
      console.error('Error saving MStocks credentials:', error);
    }
  }

  // Check if credentials are set
  hasCredentials() {
    return this.userCredentials && 
           this.userCredentials.username && 
           this.userCredentials.password;
  }

  // Check if API is configured (alias for hasCredentials for compatibility)
  isConfigured() {
    return this.hasCredentials() || this.demoMode;
  }

  // Enable demo mode
  enableDemoMode() {
    this.demoMode = true;
    this.username = 'demo_user';
    this.accessToken = 'demo_token_' + Date.now();
    this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    this.saveSession();
    
    // Set demo mode flag in localStorage for persistence
    localStorage.setItem('demoMode', 'true');
    
    console.log('🎮 Demo mode enabled');
  }

  // Disable demo mode
  disableDemoMode() {
    this.demoMode = false;
    this.username = null;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.saveSession();
    
    // Remove demo mode flag from localStorage
    localStorage.removeItem('demoMode');
    
    console.log('🔧 Demo mode disabled');
  }

  // Initialize demo mode state from localStorage
  initializeDemoMode() {
    const demoModeFlag = localStorage.getItem('demoMode');
    if (demoModeFlag === 'true') {
      this.demoMode = true;
      this.username = 'demo_user';
      console.log('🎮 Demo mode initialized from localStorage');
    } else {
      // Default to real mode if no flag or flag is false/null
      this.demoMode = false;
      console.log('🔧 Real mode initialized from localStorage (default)');
    }
  }

  // Check if in demo mode
  isDemoMode() {
    return this.demoMode;
  }

  // Validate session
  validateSession() {
    if (this.demoMode) return true;
    if (!this.accessToken) return false;
    if (this.tokenExpiry && new Date() > this.tokenExpiry) return false;
    return true;
  }

  // Save session to localStorage
  saveSession() {
    try {
      const sessionData = {
        access_token: this.accessToken,
        api_key: this.apiKey,
        enctoken: this.enctoken,
        refresh_token: this.refreshToken,
        username: this.username,
        demo_mode: this.demoMode,
        token_expiry: this.tokenExpiry ? this.tokenExpiry.toISOString() : null,
        // Save encrypted credentials for auto-refresh (only if not in demo mode)
        ...(this.userCredentials && !this.demoMode && {
          user_credentials: {
            username: this.userCredentials.username,
            // Note: Password is stored for auto-refresh but should be handled securely
            password: this.userCredentials.password
          }
        })
      };
      localStorage.setItem('mstocks_session', JSON.stringify(sessionData));
      console.log('✅ Session saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving session:', error);
    }
  }

  // Restore session from localStorage with auto-refresh
  async restoreSession() {
    try {
      const saved = localStorage.getItem('mstocks_session');
      if (saved) {
        const sessionData = JSON.parse(saved);
        this.accessToken = sessionData.access_token;
        this.apiKey = sessionData.api_key;
        this.enctoken = sessionData.enctoken;
        this.refreshToken = sessionData.refresh_token;
        this.username = sessionData.username;
        this.demoMode = sessionData.demo_mode || false;
        this.tokenExpiry = sessionData.token_expiry ? new Date(sessionData.token_expiry) : null;
        
        // Restore user credentials for auto-refresh
        if (sessionData.user_credentials && !this.demoMode) {
          this.userCredentials = {
            username: sessionData.user_credentials.username,
            password: sessionData.user_credentials.password
          };
        }
        
        console.log('🔄 Attempting to restore session...');
        console.log('📅 Token expires:', this.tokenExpiry);
        console.log('⏰ Current time:', new Date());
        
        if (this.validateSession()) {
          console.log('✅ Session restored successfully');
          
          // Check if token expires soon (within 1 hour) and refresh if needed
          if (this.tokenExpiry && this.refreshToken) {
            const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
            if (this.tokenExpiry < oneHourFromNow) {
              console.log('🔄 Token expires soon, attempting auto-refresh...');
              const refreshResult = await this.refreshAccessToken();
              if (refreshResult) {
                console.log('✅ Token refreshed successfully');
              } else {
                console.log('⚠️ Token refresh failed, but session is still valid');
              }
            }
          }
          
          return true;
        } else {
          console.log('❌ Session expired, attempting auto-refresh...');
          
          // Try to refresh the token if we have refresh token
          if (this.refreshToken && this.username && this.userCredentials) {
            const refreshResult = await this.refreshAccessToken();
            if (refreshResult) {
              console.log('✅ Session refreshed successfully');
              return true;
            }
          }
          
          console.log('❌ Auto-refresh failed, clearing session...');
          this.clearSession();
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Error restoring session:', error);
    }
    return false;
  }

  // Clear session
  clearSession() {
    this.clearCredentials();
    localStorage.removeItem('mstocks_session');
    console.log('🔓 Session cleared');
  }

  // Get session status
  getSessionStatus() {
    return {
      logged_in: this.accessToken !== null,
      username: this.username,
      session_expires: this.tokenExpiry ? this.tokenExpiry.toISOString() : null,
      session_valid: this.validateSession(),
      demo_mode: this.demoMode
    };
  }

  // Refresh access token using refresh token
  async refreshAccessToken() {
    if (!this.refreshToken || !this.apiKey) {
      console.log('❌ No refresh token or API key available');
      return false;
    }

    try {
      console.log('🔄 Refreshing access token...');
      
      const url = buildProxyUrl(MSTOCKS_API_BASE_URL, 'session/refresh');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          refresh_token: this.refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          this.accessToken = data.data.access_token;
          this.refreshToken = data.data.refresh_token || this.refreshToken;
          this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
          this.saveSession();
          console.log('✅ Access token refreshed successfully');
          return true;
        }
      }
      
      console.log('❌ Token refresh failed:', response.status);
      return false;
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      return false;
    }
  }

  // Auto-refresh session if needed
  async autoRefreshSession() {
    if (this.demoMode) return true;
    
    if (!this.validateSession()) {
      console.log('🔄 Session invalid, attempting auto-refresh...');
      return await this.refreshAccessToken();
    }
    
    return true;
  }

  // Auto-restore session on app initialization
  async autoRestoreSession() {
    console.log('🚀 Auto-restoring session on app initialization...');
    
    try {
      const restored = await this.restoreSession();
      if (restored) {
        console.log('✅ Session auto-restored successfully');
        return true;
      } else {
        console.log('ℹ️ No valid session to restore');
        return false;
      }
    } catch (error) {
      console.error('❌ Error auto-restoring session:', error);
      return false;
    }
  }

  // Update demo holdings with current prices
  async updateDemoHoldings() {
    if (!this.demoMode) return;
    
    try {
      const existingData = localStorage.getItem('etfTradingData');
      if (existingData) {
        const data = JSON.parse(existingData);
        
        // Update each holding with current price
        for (let holding of data.holdings) {
          const priceData = await this.getLivePrice(holding.symbol);
          if (priceData.status === 'success') {
            const currentPrice = priceData.data.price;
            holding.currentPrice = currentPrice;
            holding.currentValue = currentPrice * holding.quantity;
            holding.profitLoss = (currentPrice - holding.buyPrice) * holding.quantity;
            holding.profitPercentage = ((currentPrice - holding.buyPrice) / holding.buyPrice) * 100;
          }
        }
        
        localStorage.setItem('etfTradingData', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error updating demo holdings:', error);
    }
  }



  // Login to MStocks API using username/password - Step 2 of official flow
  async login(username, password) {
    if (DEMO_MODE) {
      this.demoMode = true;
      this.username = username;
      this.saveSession();
      return {
        status: 'success',
        data: {
          ugid: 'demo-ugid-12345',
          is_kyc: 'true',
          is_activate: 'true',
          is_password_reset: 'true',
          is_error: 'false',
          cid: username,
          nm: username,
          flag: 0
        },
        requiresOtp: true,
        message: 'OTP sent to your registered mobile number (Demo Mode)'
      };
    }

    try {
      console.log('🔐 Step 2: Logging in to MStocks API:', { username });

      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(buildProxyUrl(MSTOCKS_API_BASE_URL, 'connect/login'), {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      console.log('📡 MStocks Login Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ MStocks Login Error Response:', errorData);
        throw new Error(errorData.message || `Login failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ MStocks Login Success Response:', data);
      
      // According to official docs, successful login generates OTP
      if (data.status === 'success') {
        console.log('📱 OTP generated and sent to registered mobile number');
        this.username = username;
        
        // Save credentials for auto-refresh capability
        this.userCredentials = { username, password };
        
        this.saveSession();
        return {
          ...data,
          requiresOtp: true,
          message: 'OTP sent to your registered mobile number'
        };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error logging into MStocks API:', error);
      throw error;
    }
  }

  // Generate session token using API key and request token - Step 3 of official flow
  async generateSession(apiKey, requestToken, otp = null) {
    if (DEMO_MODE) {
      this.demoMode = true;
      this.accessToken = 'demo_access_token_123';
      this.apiKey = apiKey;
      this.enctoken = 'demo_enctoken_789';
      this.refreshToken = 'demo_refresh_token_456';
      this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      this.saveSession();
      return {
        status: 'success',
        data: {
          user_type: 'individual',
          email: 'demo@example.com',
          user_name: 'Demo User',
          user_shortname: 'NA',
          broker: 'MIRAE',
          exchanges: ['NSE', 'NFO', 'CDS'],
          products: ['CNC', 'NRML', 'MIS'],
          order_types: ['MARKET', 'LIMIT'],
          avatar_url: '',
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
          enctoken: this.enctoken,
          api_key: this.apiKey
        },
        message: 'Demo session generated successfully'
      };
    }

    try {
      console.log('🔐 Step 3: Generating session with MStocks API');
      console.log('📋 Session generation parameters:', {
        apiKey: apiKey ? '***' + apiKey.slice(-4) : 'N/A',
        requestToken: requestToken ? '***' + requestToken.slice(-4) : 'N/A',
        otp: otp ? '***' : 'Not provided',
        username: this.username || 'N/A'
      });
      
      // First try Type B API
      try {
        const typebPayload = {
          username: this.username || requestToken || '',
          password: this.userCredentials?.password || '',
          totp: otp || '',
          state: 'session',
          clientcode: this.username || requestToken || ''
        };
        
        const typebResponse = await fetch(`${this.typebBaseUrl}/connect/login`, {
          method: 'POST',
          headers: {
            'X-Mirae-Version': '1.0',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(typebPayload)
        });
        
        if (typebResponse.ok) {
          const typebData = await typebResponse.json();
          if (typebData.status === 'true' && typebData.data) {
            this.accessToken = typebData.data.jwtToken;
            this.enctoken = typebData.data.enctoken || '';
            this.refreshToken = typebData.data.refreshToken || '';
            this.apiKey = apiKey;
            this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
            this.saveSession();
            console.log('✅ Type B session generated successfully');
            return {
              status: 'success',
              data: typebData.data,
              message: 'Session generated successfully via Type B API'
            };
          }
        }
      } catch (typebError) {
        console.warn('⚠️ Type B session attempt failed:', typebError.message);
      }
      
      // Fallback to Type A API - try different session endpoints
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Use the correct endpoint from Python API: /session/token
      console.log('🔍 Using correct session endpoint: /session/token');
      
      const formData = new URLSearchParams();
      formData.append('api_key', apiKey);
      formData.append('request_token', requestToken); // This should be the OTP
      formData.append('checksum', 'L'); // Default checksum as per documentation
      
      const response = await fetch(buildProxyUrl(MSTOCKS_API_BASE_URL, 'session/token'), {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        signal: controller.signal
      });
      
      const sessionData = await response.json();
      
      clearTimeout(timeoutId);

      console.log('📡 MStocks Session Response Status:', response.status);

      if (!response.ok) {
        console.error('❌ MStocks Session Error Response:', sessionData);
        throw new Error(sessionData.message || `Session generation failed: ${response.status}`);
      }

      console.log('✅ MStocks Session Success Response:', sessionData);
      
      if (sessionData.status === 'success' && sessionData.data) {
        this.accessToken = sessionData.data.access_token;
        this.enctoken = sessionData.data.enctoken || '';
        this.refreshToken = sessionData.data.refresh_token || '';
        this.apiKey = apiKey;
        this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        this.saveSession();
        console.log('✅ Session generated and saved successfully');
        return sessionData;
      }
      
      throw new Error(sessionData.message || 'Session generation failed');
    } catch (error) {
      console.error('❌ Error generating MStocks session:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Session generation timed out. Please try again.');
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to MStocks API. Please check your internet connection.');
      } else {
        throw error;
      }
    }
  }

  // Get live price using Type A API (matching Python API)
  async _getLivePriceTypeA(symbol) {
    if (!this.accessToken || !this.apiKey) {
      return { status: 'error', message: 'Missing access token or API key' };
    }

    try {
      const cleanSymbol = symbol.replace('NSE:', '').replace('BSE:', '');
      
      // Try different symbol formats - ETFs don't need -EQ suffix
      const symbolFormats = [
        `NSE:${cleanSymbol}`,
        cleanSymbol,
        `${cleanSymbol}-EQ`,
        `NSE:${cleanSymbol}-EQ`
      ];
      
      for (const symbolFormat of symbolFormats) {
        try {
          const url = buildProxyUrl(MSTOCKS_API_BASE_URL, `instruments/quote/ltp?i=${encodeURIComponent(symbolFormat)}&_=${Date.now()}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'X-Mirae-Version': '1',
              'Authorization': `token ${this.apiKey}:${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              console.warn(`⚠️ Non-JSON response for ${symbolFormat}: ${contentType}`);
              continue;
            }
            
            const data = await response.json();
            if (data.status === 'success' && data.data) {
              // Data may be keyed by symbol or be an array/object
              const pd = data.data[symbolFormat] || data.data[cleanSymbol] || (Array.isArray(data.data) ? data.data[0] : data.data);
              if (pd) {
                const price = parseFloat(pd.ltp || pd.last_price || pd.price || 0);
                const vol = pd.volume || pd.vol || pd.traded_volume || pd.totalTradedVolume;
                const token = pd.security_token || pd.token || pd.instrument_token;
                if (price > 0) {
                  if (token) {
                    this.symbolTokenMap[symbol] = token;
                    this.symbolTokenMap[cleanSymbol] = token;
                  }
                  return {
                    status: 'success',
                    data: {
                      symbol,
                      price,
                      change: parseFloat(pd.change || pd.netChange || 0),
                      changePercent: parseFloat(pd.changePercent || pd.perChange || 0),
                      volume: vol != null ? Number(vol) : 0,
                      source: 'Type A API'
                    }
                  };
                }
              }
            }
          }
        } catch (formatError) {
          console.warn(`⚠️ Symbol format ${symbolFormat} failed:`, formatError.message);
          continue;
        }
      }
      
      return { status: 'error', message: `All symbol formats failed for Type A API: ${symbol}` };
    } catch (error) {
      return { status: 'error', message: `Type A API error: ${error.message}` };
    }
  }

  // Get live price using Type A OHLC endpoint as fallback
  async _getLivePriceTypeA_OHLC(symbol) {
    if (!this.accessToken || !this.apiKey) {
      return { status: 'error', message: 'Missing access token or API key' };
    }

    try {
      const cleanSymbol = symbol.replace('NSE:', '').replace('BSE:', '');
      const symbolFormats = [
        `NSE:${cleanSymbol}`,
        cleanSymbol,
        `${cleanSymbol}-EQ`,
        `NSE:${cleanSymbol}-EQ`
      ];

      for (const symbolFormat of symbolFormats) {
        try {
          const url = buildProxyUrl(MSTOCKS_API_BASE_URL, `instruments/quote/ohlc?i=${encodeURIComponent(symbolFormat)}&_=${Date.now()}`);
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'X-Mirae-Version': '1',
              'Authorization': `token ${this.apiKey}:${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const pd = data?.data?.[symbolFormat] || data?.data?.[cleanSymbol] || (Array.isArray(data?.data) ? data.data[0] : data?.data);
            if (pd) {
              const price = parseFloat(pd.ltp || pd.last_price || pd.close || pd.price || 0);
              const vol = pd.volume || pd.vol || pd.traded_volume || pd.totalTradedVolume;
              const token = pd.security_token || pd.token || pd.instrument_token;
              if (price > 0) {
                if (token) {
                  this.symbolTokenMap[symbol] = token;
                  this.symbolTokenMap[cleanSymbol] = token;
                }
                return {
                  status: 'success',
                  data: {
                    symbol,
                    price,
                    change: parseFloat(pd.change || pd.netChange || 0),
                    changePercent: parseFloat(pd.changePercent || pd.perChange || 0),
                    volume: vol != null ? Number(vol) : 0,
                    source: 'Type A OHLC'
                  }
                };
              }
            }
          }
        } catch {}
      }

      return { status: 'error', message: 'All symbol formats failed for Type A OHLC API' };
    } catch (error) {
      return { status: 'error', message: `Type A OHLC API error: ${error.message}` };
    }
  }

  // Get live price using Type B API (matching Python API)
  async _getLivePriceTypeB(symbol) {
    if (!this.accessToken || !this.apiKey) {
      return { status: 'error', message: 'Missing JWT token or API key' };
    }

    try {
      const cleanSymbol = symbol.replace('NSE:', '').replace('BSE:', '');
      
      // Try different symbol formats as per Python API
      const symbolFormats = [
        `NSE:${cleanSymbol}-EQ`,
        `NSE:${cleanSymbol}`,
        cleanSymbol,
        `${cleanSymbol}-EQ`
      ];
      
      for (const symbolFormat of symbolFormats) {
        try {
          // Use Type B API endpoint as per Python API
          const payload = {
            mode: 'LTP',
            exchangeTokens: {
              NSE: [cleanSymbol]
            }
          };

          const response = await fetch(`${this.typebBaseUrl}/instruments/quote?_=${Date.now()}`, {
            method: 'GET',
            headers: {
              'X-Mirae-Version': '1',
              'Authorization': `Bearer ${this.accessToken}`,
              'X-PrivateKey': this.apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            if (data.status === 'true' && data.data) {
              const fetchedData = data.data.fetched || data.data.data || [];
              for (const item of fetchedData) {
                if ((item.exchange || item.exch) === 'NSE' && (item.tradingSymbol || item.symbol || '').startsWith(cleanSymbol)) {
                  const price = parseFloat(item.ltp || item.last_price || item.price || 0);
                  const vol = item.volume || item.traded_volume || item.totalTradedVolume;
                  const token = item.security_token || item.token || item.instrument_token;
                  if (price > 0) {
                    if (token) {
                      this.symbolTokenMap[symbol] = token;
                      this.symbolTokenMap[cleanSymbol] = token;
                    }
                    return {
                      status: 'success',
                      data: {
                        symbol,
                        price,
                        change: parseFloat(item.change || item.netChange || 0),
                        changePercent: parseFloat(item.changePercent || item.perChange || 0),
                        volume: vol != null ? Number(vol) : 0,
                        source: 'Type B API'
                      }
                    };
                  }
                }
              }
            }
          }
        } catch (formatError) {
          console.warn(`⚠️ Symbol format ${symbolFormat} failed for Type B:`, formatError.message);
          continue;
        }
      }
      
      return { status: 'error', message: 'All symbol formats failed for Type B API' };
    } catch (error) {
      return { status: 'error', message: `Type B API error: ${error.message}` };
    }
  }

  // Get live price with fallback
  async getLivePrice(symbol) {
    // Even in demo mode, prefer real broker prices to avoid sample CMP
    if (!this.validateSession()) {
      // Attempt auto-refresh once
      try { await this.autoRefreshSession(); } catch {}
      if (!this.validateSession()) {
        return { status: 'error', message: 'Session not valid. Please login first.' };
      }
    }

    // Try Type A first, then Type B, then swap symbol formats and retry one more pass
    let res = await this._getLivePriceTypeA(symbol);
    if (res?.status === 'success') return res;
    // Try Type A OHLC fallback
    res = await this._getLivePriceTypeA_OHLC(symbol);
    if (res?.status === 'success') return res;
    res = await this._getLivePriceTypeB(symbol);
    if (res?.status === 'success') return res;

    // Retry with stripped/prefixed variations
    const s = symbol.replace('NSE:', '').replace('BSE:', '');
    const candidates = [`NSE:${s}`, `${s}-EQ`, s.toUpperCase()];
    for (const cand of candidates) {
      let r = await this._getLivePriceTypeA(cand);
      if (r?.status === 'success') return r;
      r = await this._getLivePriceTypeB(cand);
      if (r?.status === 'success') return r;
    }

    return { status: 'error', message: `Both Type A and Type B APIs failed for ${symbol}` };
  }

  // Get multiple live prices
  async getLivePrices(symbols) {
    const results = {};
    const promises = symbols.map(async (symbol) => {
      const result = await this.getLivePrice(symbol);
      results[symbol] = result;
    });
    
    await Promise.all(promises);
    return results;
  }



  // Calculate DMA20; optionally align to a provided expected LTP to avoid series mismatch
  async calculateDMA20(symbol, expectedLtp = null) {
    const historicalData = await this.getHistoricalData(symbol, 60);
    if (historicalData.status !== 'success') {
      return historicalData;
    }

    try {
      // Ensure we only use numeric closes and at least 20 values
      // Normalize various possible history shapes and pick close/settlement price
      let closes = (historicalData.data || [])
        .map(item => Number(item.close ?? item.c ?? item.settlement ?? item.price ?? 0))
        .filter(v => Number.isFinite(v) && v > 0);

      if (closes.length < 20) {
        return { status: 'error', message: 'Insufficient history for DMA20', meta: historicalData.meta };
      }

      // Adjust for scale mismatches (e.g., splits) by aligning last close to current LTP
      try {
        const lastClose = closes[closes.length - 1];
        let ltp = Number(expectedLtp);
        if (!Number.isFinite(ltp) || ltp <= 0) {
          const live = await this.getLivePrice(symbol);
          ltp = Number(live?.data?.price ?? live?.lastPrice ?? live?.price ?? 0);
        }
        if (ltp > 0 && lastClose > 0) {
          const ratio = ltp / lastClose;
          const diffPct = Math.abs(ltp - lastClose) / Math.max(ltp, lastClose);
          // If the difference is significant (> 10%), rescale history
          if (diffPct > 0.1 && ratio > 0 && Number.isFinite(ratio)) {
            closes = closes.map(v => v * ratio);
            historicalData.meta = { ...(historicalData.meta || {}), rescaled: true, scaleRatio: Number(ratio.toFixed(6)), ltp, lastCloseOriginal: lastClose };
          }
        }
      } catch {}

      const last20 = closes.slice(-20);
      const sum = last20.reduce((s, v) => s + v, 0);
      let dma20 = sum / last20.length;

      // Post-check: if DMA is still wildly off from LTP (>50%), force align
      try {
        const ltpCheck = Number(expectedLtp);
        if (Number.isFinite(ltpCheck) && ltpCheck > 0) {
          const disparity = Math.abs(dma20 - ltpCheck) / Math.max(dma20, ltpCheck);
          if (disparity > 0.5) {
            const lc = closes[closes.length - 1];
            if (lc > 0) {
              const ratio2 = ltpCheck / lc;
              if (ratio2 > 0 && Number.isFinite(ratio2)) {
                const aligned = closes.map(v => v * ratio2);
                const last20b = aligned.slice(-20);
                dma20 = last20b.reduce((s, v) => s + v, 0) / last20b.length;
                historicalData.meta = { ...(historicalData.meta || {}), rescaledPost: true, ratio2: Number(ratio2.toFixed(6)) };
              }
            }
          }
        }
      } catch {}

      return {
        status: 'success',
        data: {
          symbol,
          dma20: Number(dma20.toFixed(2)),
          currentPrice: closes[closes.length - 1],
          source: 'Historical LTP',
          meta: {
            ...(historicalData.meta || {}),
            closesCount: closes.length
          }
        }
      };
    } catch (error) {
      return { status: 'error', message: `DMA calculation error: ${error.message}` };
    }
  }

  // Check if logged in
  isLoggedIn() {
    return this.validateSession();
  }

  // Logout
  logout() {
    this.clearSession();
    console.log('🔓 Logged out from MStocks API');
  }

  // Place buy order
  async placeBuyOrder(orderData) {
    if (this.demoMode) {
      // Virtual buy order in demo mode - add to holdings
      const orderId = 'DEMO_BUY_' + Date.now();
      console.log('🎮 Demo mode: Virtual buy order', orderData);
      
      // Simulate order processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get current price for the symbol
      const priceData = await this.getLivePrice(orderData.symbol);
      const buyPrice = priceData.status === 'success' ? priceData.data.price : (orderData.price || 100);
      
      // Create virtual holding entry
      const virtualHolding = {
        id: `demo_holding_${Date.now()}`,
        symbol: orderData.symbol,
        name: orderData.symbol.replace('NSE:', ''),
        sector: 'ETF',
        buyDate: new Date().toISOString().split('T')[0],
        buyPrice: buyPrice,
        quantity: orderData.quantity,
        totalInvested: buyPrice * orderData.quantity,
        currentPrice: buyPrice,
        currentValue: buyPrice * orderData.quantity,
        profitLoss: 0,
        profitPercentage: 0,
        lastBuyPrice: buyPrice,
        lastBuyDate: new Date().toISOString().split('T')[0],
        orderType: orderData.orderType || 'MARKET',
        productType: 'CNC'
      };
      
      // Add to demo holdings in localStorage
      try {
        const existingData = localStorage.getItem('etfTradingData');
        if (existingData) {
          const data = JSON.parse(existingData);
          data.holdings = data.holdings || [];
          data.holdings.push(virtualHolding);
          localStorage.setItem('etfTradingData', JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error saving virtual holding:', error);
      }
      
      return {
        status: 'success',
        data: {
          orderId: orderId,
          status: 'COMPLETE',
          message: 'Virtual buy order placed successfully (Demo Mode)',
          orderDetails: {
            symbol: orderData.symbol,
            quantity: orderData.quantity,
            price: buyPrice,
            orderType: orderData.orderType || 'MARKET',
            timestamp: new Date().toISOString()
          },
          virtualHolding: virtualHolding
        }
      };
    }

    if (!this.validateSession()) {
      console.log('❌ Session validation failed, attempting auto-refresh...');
      if (!this.autoRefreshSession()) {
        return { status: 'error', message: 'Session not valid. Please login first.' };
      }
    }

    try {
      console.log('🔐 Placing real buy order with MStocks API:', orderData);
      
      // Prepare variations for tradingsymbol resolution
      const root = orderData.symbol.replace('NSE:', '').replace('BSE:', '');
      const candidates = [
        root,
        `${root}-EQ`,
        root.toUpperCase(),
        `${root.toUpperCase()}-EQ`
      ];
      let token = null;
      try { token = await this.resolveSecurityToken(orderData.symbol); } catch {}

      // Use correct endpoint and format as per MStocks API
      const url = `${ORDERS_BASE_URL}/orders/regular`;
      const axios = await import('axios');
      let lastError = null;
      for (const tsym of candidates) {
        try {
          const formData = new URLSearchParams();
          formData.append('tradingsymbol', tsym);
          formData.append('exchange', 'NSE');
          formData.append('transaction_type', 'BUY');
          formData.append('order_type', orderData.orderType || 'MARKET');
          formData.append('quantity', orderData.quantity.toString());
          formData.append('product', orderData.product || 'CNC');
          formData.append('validity', orderData.validity || 'DAY');
          formData.append('price', orderData.price ? orderData.price.toString() : '0');
          formData.append('trigger_price', orderData.triggerPrice ? orderData.triggerPrice.toString() : '0');
          formData.append('disclosed_quantity', '0');
          if (token) formData.append('security_token', String(token));

          const response = await axios.default.post(url, formData, {
            headers: {
              'X-Mirae-Version': '1',
              'Authorization': `token ${this.apiKey}:${this.accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 30000
          });
          if (response.status !== 200) {
            lastError = { code: response.status, body: response.data };
            continue;
          }
          const result = response.data;
          console.log('✅ Order placement successful with tradingsymbol:', tsym, result);
          const normalizedOrderId = (
            result?.orderId ||
            result?.order_id ||
            result?.data?.order_id ||
            result?.data?.orderId ||
            result?.data?.nOrdNo ||
            result?.nOrdNo ||
            result?.data?.orderid ||
            result?.orderid ||
            null
          );
          if (String(result?.status).toLowerCase() === 'error') {
            lastError = { code: 200, body: result };
            continue;
          }
          return {
            status: 'success',
            data: result?.data || result,
            orderId: normalizedOrderId || undefined,
            message: result?.message || 'Order placed successfully'
          };
        } catch (err) {
          if (err.response) {
            lastError = { code: err.response.status, body: err.response.data };
          } else if (err.request) {
            lastError = { code: 0, body: 'No response' };
          } else {
            lastError = { code: -1, body: err.message };
          }
        }
      }
      console.error('❌ All tradingsymbol variations failed for BUY:', candidates, 'lastError:', lastError);
      return { status: 'error', message: `Buy order failed: ${lastError?.code || 'NA'} - ${JSON.stringify(lastError?.body || 'Unknown')}` };
    } catch (error) {
      console.error('❌ Order placement error:', error);
      
      // Handle axios errors specifically
      if (error.response) {
        console.error('❌ Server responded with error:', error.response.status, error.response.data);
        return { 
          status: 'error', 
          message: `Buy order failed: ${error.response.status} - ${error.response.data?.message || error.response.data || 'Server error'}` 
        };
      } else if (error.request) {
        console.error('❌ No response received:', error.request);
        return { 
          status: 'error', 
          message: 'Buy order failed: No response from server. Please check your internet connection.' 
        };
      } else {
        console.error('❌ Request setup error:', error.message);
        return { 
          status: 'error', 
          message: `Buy order error: ${error.message}` 
        };
      }
    }
  }

  // Place sell order
  async placeSellOrder(orderData) {
    if (this.demoMode) {
      // Virtual sell order in demo mode - move from holdings to sold items
      const orderId = 'DEMO_SELL_' + Date.now();
      console.log('🎮 Demo mode: Virtual sell order', orderData);
      
      // Simulate order processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get current price for the symbol
      const priceData = await this.getLivePrice(orderData.symbol);
      const sellPrice = priceData.status === 'success' ? priceData.data.price : (orderData.price || 100);
      
      try {
        const existingData = localStorage.getItem('etfTradingData');
        if (existingData) {
          const data = JSON.parse(existingData);
          
          // Find the holding to sell
          const holdingIndex = data.holdings.findIndex(h => h.symbol === orderData.symbol);
          if (holdingIndex !== -1) {
            const holding = data.holdings[holdingIndex];
            const buyPrice = holding.buyPrice || 100;
            const profit = (sellPrice - buyPrice) * orderData.quantity;
            const profitPercent = ((sellPrice - buyPrice) / buyPrice) * 100;
            
            // Create sold item entry
            const soldItem = {
              id: `demo_sold_${Date.now()}`,
              symbol: orderData.symbol,
              name: holding.name,
              quantity: orderData.quantity,
              buyPrice: buyPrice,
              sellPrice: sellPrice,
              buyDate: holding.buyDate,
              sellDate: new Date().toISOString().split('T')[0],
              profit: profit,
              profitPercent: profitPercent
            };
            
            // Add to sold items
            data.soldItems = data.soldItems || [];
            data.soldItems.push(soldItem);
            
            // Update total profit
            data.totalProfit = (data.totalProfit || 0) + profit;
            
            // Remove from holdings or reduce quantity
            if (orderData.quantity >= holding.quantity) {
              // Sell entire holding
              data.holdings.splice(holdingIndex, 1);
            } else {
              // Partial sell - reduce quantity
              holding.quantity -= orderData.quantity;
              holding.totalInvested = holding.buyPrice * holding.quantity;
              holding.currentValue = holding.currentPrice * holding.quantity;
            }
            
            localStorage.setItem('etfTradingData', JSON.stringify(data));
            
            return {
              status: 'success',
              data: {
                orderId: orderId,
                status: 'COMPLETE',
                message: 'Virtual sell order placed successfully (Demo Mode)',
                orderDetails: {
                  symbol: orderData.symbol,
                  quantity: orderData.quantity,
                  price: sellPrice,
                  orderType: orderData.orderType || 'MARKET',
                  timestamp: new Date().toISOString()
                },
                soldItem: soldItem,
                profit: profit
              }
            };
          } else {
            return {
              status: 'error',
              message: 'No holding found for this symbol in demo mode'
            };
          }
        }
      } catch (error) {
        console.error('Error processing virtual sell order:', error);
        return {
          status: 'error',
          message: 'Error processing virtual sell order'
        };
      }
    }

    if (!this.validateSession()) {
      console.log('❌ Session validation failed, attempting auto-refresh...');
      if (!this.autoRefreshSession()) {
        return { status: 'error', message: 'Session not valid. Please login first.' };
      }
    }

    try {
      console.log('🔐 Placing real sell order with MStocks API:', orderData);
      
      // Format order data according to MStocks API specification
      const orderPayload = {
        tradingsymbol: orderData.symbol.replace('NSE:', '').replace('BSE:', ''),
        exchange: 'NSE',
        transaction_type: 'SELL',
        order_type: orderData.orderType || 'MARKET',
        quantity: orderData.quantity.toString(),
        product: orderData.product || 'CNC',
        validity: orderData.validity || 'DAY',
        price: orderData.price ? orderData.price.toString() : '0',
        trigger_price: orderData.triggerPrice ? orderData.triggerPrice.toString() : '0'
      };
      
      console.log('📋 Sell order payload:', orderPayload);
      
      // Use correct endpoint and format as per MStocks API
      const url = `${ORDERS_BASE_URL}/orders/regular`;
      
      // Convert to form data as per MStocks API specification
      const formData = new URLSearchParams();
      formData.append('tradingsymbol', orderPayload.tradingsymbol);
      formData.append('exchange', orderPayload.exchange);
      formData.append('transaction_type', orderPayload.transaction_type);
      formData.append('order_type', orderPayload.order_type);
      formData.append('quantity', orderPayload.quantity);
      formData.append('product', orderPayload.product);
      formData.append('validity', orderPayload.validity);
      formData.append('price', orderPayload.price);
      formData.append('trigger_price', orderPayload.trigger_price);
      
      // Use axios for better error handling and compatibility
      const axios = await import('axios');
      const response = await axios.default.post(url, formData, {
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${this.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      console.log('📡 Sell order placement response status:', response.status);

      if (response.status !== 200) {
        console.error('❌ Sell order placement failed:', response.data);
        return { status: 'error', message: `Sell order failed: ${response.status} - ${response.data?.message || 'Unknown error'}` };
      }

      const result = response.data;
      console.log('✅ Sell order placement successful:', result);
      console.log('📊 Full sell response data:', JSON.stringify(result, null, 2));

      // Normalize order id across possible broker formats
      const normalizedOrderId = (
        result?.orderId ||
        result?.order_id ||
        result?.data?.order_id ||
        result?.data?.orderId ||
        result?.data?.nOrdNo ||
        result?.nOrdNo ||
        result?.data?.orderid ||
        result?.orderid ||
        null
      );

      if (String(result?.status).toLowerCase() === 'error') {
        console.error('❌ Broker rejected sell order:', result);
        return { status: 'error', message: result?.message || 'Broker rejected the sell order' };
      }

      return {
        status: 'success',
        data: result?.data || result,
        orderId: normalizedOrderId || undefined,
        message: result?.message || 'Sell order placed successfully'
      };
    } catch (error) {
      console.error('❌ Sell order placement error:', error);
      
      // Handle axios errors specifically
      if (error.response) {
        console.error('❌ Server responded with error:', error.response.status, error.response.data);
        return { 
          status: 'error', 
          message: `Sell order failed: ${error.response.status} - ${error.response.data?.message || error.response.data || 'Server error'}` 
        };
      } else if (error.request) {
        console.error('❌ No response received:', error.request);
        return { 
          status: 'error', 
          message: 'Sell order failed: No response from server. Please check your internet connection.' 
        };
      } else {
        console.error('❌ Request setup error:', error.message);
        return { 
          status: 'error', 
          message: `Sell order error: ${error.message}` 
        };
      }
    }
  }

  // Get order status - Using proxy system (working version)
  async getOrderStatus(orderId) {
    // Demo mode returns a pending-like state to avoid false positives
    if (this.demoMode) {
      return {
        status: 'PENDING',
        data: { orderId, status: 'PENDING', message: 'Demo mode - no broker status' }
      };
    }

    if (!this.validateSession()) {
      return { status: 'error', message: 'Session not valid. Please login first.' };
    }

    try {
      console.log(`🔍 Checking order status for: ${orderId}`);
      
      // Primary: Individual Order Details (GET with querystring)
      const params = new URLSearchParams();
      params.append('order_no', orderId);
      params.append('segment', 'E');
      const urlDetailsGet = buildProxyUrl(MSTOCKS_API_BASE_URL, `order/details?${params.toString()}`);
      
      console.log(`📡 Primary endpoint: ${urlDetailsGet}`);
      
      const respDetailsGet = await fetch(urlDetailsGet, {
        method: 'GET',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${this.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log(`📊 Primary response status: ${respDetailsGet.status}`);

      if (respDetailsGet.ok) {
        try {
          const responseText = await respDetailsGet.text();
          const data = JSON.parse(responseText);
          console.log(`✅ Primary endpoint success:`, data);
          return data;
        } catch (jsonError) {
          console.error(`❌ Primary endpoint JSON parse error:`, jsonError);
          throw new Error(`Invalid JSON response: ${jsonError.message}`);
        }
      } else {
        console.error(`❌ Primary endpoint failed: ${respDetailsGet.status}`);
        try {
          const errorText = await respDetailsGet.text();
          console.error(`❌ Primary endpoint error response:`, errorText.substring(0, 500));
        } catch (textError) {
          console.error(`❌ Primary endpoint error response read failed:`, textError);
        }
      }

      // Secondary: Some stacks require POST form to /order/details
      try {
        const form = new URLSearchParams();
        form.append('order_no', orderId);
        form.append('segment', 'E');
        const respDetailsPost = await fetch(buildProxyUrl(MSTOCKS_API_BASE_URL, 'order/details'), {
          method: 'POST',
          headers: {
            'X-Mirae-Version': '1',
            'Authorization': `token ${this.apiKey}:${this.accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: form
        });
        
        if (respDetailsPost.ok) {
          try {
            const responseText = await respDetailsPost.text();
            const data = JSON.parse(responseText);
            console.log(`✅ Secondary endpoint success:`, data);
            return data;
          } catch (jsonError) {
            console.error(`❌ Secondary endpoint JSON parse error:`, jsonError);
          }
        } else {
          console.error(`❌ Secondary endpoint failed: ${respDetailsPost.status}`);
        }
      } catch (error) {
        console.error(`❌ Secondary endpoint exception:`, error);
      }

      // Tertiary: Order Book and filter by order_id
      try {
        const bookResp = await fetch(buildProxyUrl(MSTOCKS_API_BASE_URL, 'orders'), {
          method: 'GET',
          headers: {
            'X-Mirae-Version': '1',
            'Authorization': `token ${this.apiKey}:${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (bookResp.ok) {
          const book = await bookResp.json();
          const list = (() => {
            const d = book?.data || book;
            if (Array.isArray(d)) return d;
            if (Array.isArray(d?.orders)) return d.orders;
            if (Array.isArray(book?.orders)) return book.orders;
            return [];
          })();
          const match = list.find(o => String(o.order_id || o.orderId || o.nOrdNo || o.orderid || o.id) === String(orderId));
          if (match) {
            return { data: match };
          }
        }
      } catch {}

      // Quaternary: Tradebook (executed orders)
      try {
        const tradesResp = await fetch(buildProxyUrl(MSTOCKS_API_BASE_URL, 'tradebook'), {
          method: 'GET',
          headers: {
            'X-Mirae-Version': '1',
            'Authorization': `token ${this.apiKey}:${this.accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        if (tradesResp.ok) {
          const trades = await tradesResp.json();
          const arr = trades?.data || trades;
          if (Array.isArray(arr)) {
            const tmatch = arr.find(t => String(t.order_id || t.orderId) === String(orderId));
            if (tmatch) return { data: tmatch };
          }
        }
      } catch {}

      // If we reached here, surface prior failure code where available
      return { status: 'error', message: 'Order status check failed: 405 or not supported' };
    } catch (error) {
      return { status: 'error', message: `Order status error: ${error.message}` };
    }
  }

  // Cancel order
  async cancelOrder(orderId) {
    if (this.demoMode) {
      console.log('🎮 Demo mode: Virtual order cancellation', orderId);
      return {
        status: 'success',
        data: {
          orderId: orderId,
          status: 'CANCELLED',
          message: 'Order cancelled successfully (Demo Mode)',
          timestamp: new Date().toISOString()
        }
      };
    }

    if (!this.validateSession()) {
      return { status: 'error', message: 'Session not valid. Please login first.' };
    }

    try {
      console.log('🔐 Cancelling order with MStocks API:', orderId);
      
      const url = `${ORDERS_BASE_URL}/orders/regular/${orderId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Order cancellation response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Order cancellation failed:', errorData);
        return { status: 'error', message: `Order cancellation failed: ${response.status} - ${errorData.message || 'Unknown error'}` };
      }

      const result = await response.json();
      console.log('✅ Order cancellation successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Order cancellation error:', error);
      return { status: 'error', message: `Order cancellation error: ${error.message}` };
    }
  }

  // Get today's orders
  async getTodaysOrders() {
    if (this.demoMode) {
      return {
        status: 'success',
        data: [
          {
            orderId: 'DEMO_ORDER_1',
            symbol: 'NSE:NIFTYBEES',
            quantity: 100,
            price: 245.50,
            orderType: 'MARKET',
            side: 'BUY',
            status: 'COMPLETE',
            timestamp: new Date().toISOString()
          },
          {
            orderId: 'DEMO_ORDER_2',
            symbol: 'NSE:BANKBEES',
            quantity: 50,
            price: 456.78,
            orderType: 'MARKET',
            side: 'SELL',
            status: 'COMPLETE',
            timestamp: new Date().toISOString()
          }
        ]
      };
    }

    if (!this.validateSession()) {
      return { status: 'error', message: 'Session not valid. Please login first.' };
    }

    // Try multiple endpoints in order of preference
    const endpoints = [
      buildProxyUrl(MSTOCKS_API_BASE_URL, 'orders'),
      `${ORDERS_BASE_URL}/orders`,  // Direct API as fallback
    ];

    for (let i = 0; i < endpoints.length; i++) {
      const url = endpoints[i];
      console.log(`🔄 Trying getTodaysOrders endpoint ${i + 1}/${endpoints.length}: ${url}`);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-Mirae-Version': '1',
            'Authorization': `token ${this.apiKey}:${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.log(`❌ Endpoint ${i + 1} failed: ${response.status} ${response.statusText}`);
          if (i === endpoints.length - 1) {
            return { status: 'error', message: `All endpoints failed. Last error: ${response.status}` };
          }
          continue;
        }

        const result = await response.json();
        console.log(`✅ Endpoint ${i + 1} succeeded:`, result);
        return result;
      } catch (error) {
        console.log(`❌ Endpoint ${i + 1} error: ${error.message}`);
        if (i === endpoints.length - 1) {
          return { status: 'error', message: `All endpoints failed. Last error: ${error.message}` };
        }
        continue;
      }
    }

    return { status: 'error', message: 'No endpoints available' };
  }

  // Get today's trade book (executed trades)
  async getTradeBook() {
    if (this.demoMode) {
      return { status: 'success', data: [] };
    }

    if (!this.validateSession()) {
      return { status: 'error', message: 'Session not valid. Please login first.' };
    }

    try {
      const url = buildProxyUrl(MSTOCKS_API_BASE_URL, 'tradebook?segment=E');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${this.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        return { status: 'error', message: `Trade book fetch failed: ${response.status}` };
      }

      const result = await response.json();
      // Normalize shape: always return array
      const arr = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : (Array.isArray(result?.trades) ? result.trades : []));
      return { status: 'success', data: arr };
    } catch (error) {
      return { status: 'error', message: `Trade book error: ${error.message}` };
    }
  }

  // Get holdings
  async getHoldings() {
    if (this.demoMode) {
      return {
        status: 'success',
        data: [
          {
            symbol: 'NSE:NIFTYBEES',
            name: 'NIFTY 50 ETF',
            quantity: 100,
            avgPrice: 245.50,
            currentPrice: 248.20,
            profitLoss: 270,
            profitPercent: 1.1
          },
          {
            symbol: 'NSE:BANKBEES',
            name: 'Bank ETF',
            quantity: 50,
            avgPrice: 456.78,
            currentPrice: 462.30,
            profitLoss: 276,
            profitPercent: 1.2
          }
        ]
      };
    }

    if (!this.validateSession()) {
      return { status: 'error', message: 'Session not valid. Please login first.' };
    }

    try {
      const url = buildProxyUrl(MSTOCKS_API_BASE_URL, 'holdings');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return { status: 'error', message: `Holdings fetch failed: ${response.status}` };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return { status: 'error', message: `Holdings error: ${error.message}` };
    }
  }



  // Get historical data for a symbol
  async getHistoricalData(symbol, startDate, endDate) {
    if (this.demoMode) {
      // Return demo historical data
      return this.generateDemoHistoricalData(symbol, startDate, endDate);
    }
    
    if (!this.validateSession()) {
      throw new Error('Session not valid. Please login again.');
    }

    try {
      // Get symbol token first
      const symbolToken = await this.getSymbolToken(symbol);
      if (!symbolToken) {
        console.log(`Symbol token not found for ${symbol}, using demo data`);
        return this.generateDemoHistoricalData(symbol, startDate, endDate);
      }

      // Format dates for API (YYYY-MM-DD HH:MM:SS format)
      const fromDateTime = `${startDate} 09:15:00`;
      const toDateTime = `${endDate} 15:30:00`;

      // Fetch historical data from MStocks API using the correct endpoint format
      const url = buildProxyUrl(MSTOCKS_API_BASE_URL, `instruments/historical/${symbolToken}/1D`);
      const params = new URLSearchParams({
        from: fromDateTime,
        to: toDateTime
      });

      console.log(`📊 Fetching historical data for ${symbol} (Token: ${symbolToken})`);
      console.log(`📅 Date range: ${fromDateTime} to ${toDateTime}`);

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error for ${symbol}:`, response.status, errorText);
        
        // Fallback to demo data if API fails
        console.log(`Using demo data for ${symbol} due to API error`);
        return this.generateDemoHistoricalData(symbol, startDate, endDate);
      }

      const data = await response.json();
      console.log(`📈 Raw API response for ${symbol}:`, data);
      
      if (data?.status === 'success' && data?.data?.candles) {
        const candles = data.data.candles;
        console.log(`✅ ${symbol}: ${candles.length} candles received`);
        
        return candles.map(candle => ({
          date: candle[0].split('T')[0], // Extract date part from ISO string
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseInt(candle[5])
        }));
      } else if (data?.candles) {
        // Alternative response format
        const candles = data.candles;
        console.log(`✅ ${symbol}: ${candles.length} candles received (alt format)`);
        
        return candles.map(candle => ({
          date: candle[0].split('T')[0], // Extract date part from ISO string
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseInt(candle[5])
        }));
      } else {
        console.log(`⚠️ No valid data format for ${symbol}, using demo data`);
        return this.generateDemoHistoricalData(symbol, startDate, endDate);
      }

    } catch (error) {
      console.error(`❌ Error fetching historical data for ${symbol}:`, error);
      
      // Fallback to demo data if API fails
      console.log(`Using demo data for ${symbol} due to error`);
      return this.generateDemoHistoricalData(symbol, startDate, endDate);
    }
  }

  // Generate demo historical data for testing - More realistic approach
  generateDemoHistoricalData(symbol, startDate, endDate) {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // More realistic base prices for different ETF types
    let basePrice;
    if (symbol.includes('NIFTY')) {
      basePrice = 200 + Math.random() * 100; // Nifty ETFs: 200-300
    } else if (symbol.includes('GOLD')) {
      basePrice = 50 + Math.random() * 20; // Gold ETFs: 50-70
    } else if (symbol.includes('BANK')) {
      basePrice = 400 + Math.random() * 200; // Bank ETFs: 400-600
    } else {
      basePrice = 100 + Math.random() * 150; // Other ETFs: 100-250
    }
    
    // Add some trend and volatility
    let trend = (Math.random() - 0.5) * 0.0001; // Slight trend
    let volatility = 0.02 + Math.random() * 0.03; // 2-5% daily volatility
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Generate more realistic price movement
      const randomChange = (Math.random() - 0.5) * 2; // Standard normal distribution approximation
      const dailyChange = trend + (randomChange * volatility);
      const price = basePrice * (1 + dailyChange);
      
      // Ensure price doesn't go negative
      const finalPrice = Math.max(price, basePrice * 0.1);
      
      // Generate OHLC data
      const open = finalPrice * (1 + (Math.random() - 0.5) * 0.01);
      const high = Math.max(open, finalPrice) * (1 + Math.random() * 0.02);
      const low = Math.min(open, finalPrice) * (1 - Math.random() * 0.02);
      const close = finalPrice;
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.floor(Math.random() * 500000) + 50000
      });
      
      // Update base price for next day with some mean reversion
      basePrice = close * (1 + (Math.random() - 0.5) * 0.001);
    }
    
    console.log(`🎲 Generated ${data.length} realistic demo records for ${symbol} (base: ₹${Math.round(basePrice)})`);
    return data;
  }

  // Test API connection
  async testConnection() {
    try {
      if (this.demoMode) {
        return true; // Demo mode always returns true
      }
      
      if (!this.validateSession()) {
        return false;
      }

      // Try to get user profile as a connection test
      const url = buildProxyUrl(MSTOCKS_API_BASE_URL, 'user/profile');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  // Get symbol token for historical data
  async getSymbolToken(symbol) {
    // Check cache first
    const cacheKeyVariants = [symbol, symbol.replace('NSE:', ''), symbol.replace('BSE:', ''), `${symbol}-EQ`];
    for (const k of cacheKeyVariants) {
      if (this.symbolTokenMap[k]) return this.symbolTokenMap[k];
    }

    const clean = symbol.replace('NSE:', '').replace('BSE:', '');
    const variants = [clean, `${clean}-EQ`, `${clean}.NS`, clean.toUpperCase()];
    const sm = await this.getScriptMaster();
    if (!sm) return null;
    const list = Array.isArray(sm) ? sm : (Array.isArray(sm?.instruments) ? sm.instruments : []);
    if (!Array.isArray(list)) return null;
    const pickToken = (obj) => obj.security_token || obj.token || obj.instrument_token || obj.tkn || obj.id || obj.securityToken || null;
    const pickSymbol = (obj) => obj.trading_symbol || obj.tradingsymbol || obj.tradingSymbol || obj.symbol || obj.sym || obj.tsym || '';
    const isNSE = (obj) => {
      const exch = obj.exchange || obj.exch || obj.exch_seg || obj.segment || '';
      return String(exch).toUpperCase().includes('NSE') || String(exch).toUpperCase() === 'E';
    };
    for (const v of variants) {
      const match = list.find(o => isNSE(o) && String(pickSymbol(o)).toUpperCase() === String(v).toUpperCase());
      if (match) {
        const token = pickToken(match);
        if (token) {
          this.symbolTokenMap[symbol] = token;
          this.symbolTokenMap[clean] = token;
          return token;
        }
      }
    }
    // Looser contains match
    for (const v of variants) {
      const match = list.find(o => isNSE(o) && String(pickSymbol(o)).toUpperCase().startsWith(String(v).toUpperCase()));
      if (match) {
        const token = pickToken(match);
        if (token) {
          this.symbolTokenMap[symbol] = token;
          this.symbolTokenMap[clean] = token;
          return token;
        }
      }
    }
    return null;
  }
}

// Create singleton instance
const mstocksApiService = new MStocksApiService();

// Try to restore session on load
mstocksApiService.restoreSession();

export default mstocksApiService; 