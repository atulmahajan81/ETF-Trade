// MStocks API Service for live price fetching and trading
// Using official MStocks Trading API v1

// Removed demoDataService import
import googleFinanceApiService from './googleFinanceApi';

const MSTOCKS_API_BASE_URL = 'https://api.mstock.trade/openapi/typea';

// Demo mode flag - set to true for demo mode, false for live API calls
const DEMO_MODE = false; // Set to false to use real MStocks API

class MStocksApiService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.apiKey = null;
    this.enctoken = null;
    this.refreshToken = null;
    this.userCredentials = null;
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

  // Login to MStocks API using username/password - Step 2 of official flow
  async login(username, password) {
    if (DEMO_MODE) {
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

      const response = await fetch(`${MSTOCKS_API_BASE_URL}/connect/login`, {
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
          access_token: 'demo_access_token_123',
          refresh_token: 'demo_refresh_token_456',
          enctoken: 'demo_enctoken_789',
          api_key: apiKey
        }
      };
    }

    try {
      console.log('🔐 Step 3: Generating session with MStocks API:', { 
        apiKey: apiKey ? '***' + apiKey.slice(-4) : 'N/A',
        hasOtp: !!otp
      });

      // Use JSON payload exactly as in working app
      const payload = {
        api_key: apiKey,
        request_token: requestToken
      };

      // Add OTP if provided (optional parameter)
      if (otp) {
        payload.otp = otp;
      }

      console.log('📤 Session generation payload:', {
        api_key: apiKey ? '***' + apiKey.slice(-4) : 'N/A',
        request_token: requestToken ? '***' + requestToken.slice(-4) : 'N/A',
        otp: otp ? '***' : 'Not provided'
      });

      // Use exact same endpoint and format as working app
      const response = await fetch(`${MSTOCKS_API_BASE_URL}/connect/session`, {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 MStocks Session Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ MStocks Session Error Response:', errorData);
        throw new Error(errorData.message || `Session generation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ MStocks Session Success Response:', result);
      
      // Store session data according to official API documentation
      if (result.data) {
        this.accessToken = result.data.access_token;
        this.refreshToken = result.data.refresh_token;
        this.enctoken = result.data.enctoken;
        this.apiKey = apiKey;
        this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        console.log('📦 Stored session data:');
        console.log('- Access Token:', this.accessToken ? this.accessToken.substring(0, 20) + '...' : 'N/A');
        console.log('- Enc Token:', this.enctoken ? this.enctoken.substring(0, 20) + '...' : 'N/A');
        console.log('- API Key:', this.apiKey);
        console.log('- Token Expiry:', this.tokenExpiry);
      }

      return result;
    } catch (error) {
      console.error('❌ Error generating MStocks session:', error);
      throw error;
    }
  }

  // Get access token
  async getAccessToken() {
    if (!this.accessToken || new Date() >= this.tokenExpiry) {
      throw new Error('Access token expired or not available. Please login again.');
    }
    return this.accessToken;
  }

  // Get enc token (might be needed for orders)
  async getEncToken() {
    if (!this.enctoken) {
      throw new Error('Enc token not available. Please login again.');
    }
    return this.enctoken;
  }

  // Get refresh token
  async getRefreshToken() {
    if (!this.refreshToken) {
      throw new Error('Refresh token not available. Please login again.');
    }
    return this.refreshToken;
  }

  // Refresh access token if needed
  async refreshAccessToken() {
    if (DEMO_MODE) {
      return true;
    }

    try {
      const refreshToken = await this.getRefreshToken();
      
      const formData = new URLSearchParams();
      formData.append('refresh_token', refreshToken);

      const response = await fetch(`${MSTOCKS_API_BASE_URL}/session/refresh`, {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          this.accessToken = result.data.access_token;
          this.refreshToken = result.data.refresh_token;
          this.enctoken = result.data.enctoken;
          this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
          console.log('✅ Access token refreshed successfully');
          return true;
        }
      }
      
      console.log('❌ Failed to refresh access token');
      return false;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return false;
    }
  }

  // Check if API service is configured
  isConfigured() {
    return this.hasCredentials();
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.accessToken && new Date() < this.tokenExpiry;
  }

  // Logout from MStocks API
  async logout() {
    if (DEMO_MODE) {
      this.clearCredentials();
      return { status: 'success', message: 'Logged out successfully (Demo Mode)' };
    }

    try {
      // For MStocks, we don't need to call a logout endpoint
      // Just clear the local credentials and tokens
      console.log('🔓 Clearing MStocks credentials and tokens...');
      this.clearCredentials();
      
      return { status: 'success', message: 'Logged out successfully' };
    } catch (error) {
      console.error('Error during MStocks logout:', error);
      this.clearCredentials(); // Clear credentials even if logout fails
      throw error;
    }
  }

  // Get live price for a symbol using MStocks API only (for testing)
  async getLivePrice(symbol) {
    try {
      if (DEMO_MODE) {
        return {
          symbol: symbol,
          lastPrice: Math.random() * 1000 + 100,
          change: (Math.random() - 0.5) * 10,
          changePercent: (Math.random() - 0.5) * 5,
          volume: Math.floor(Math.random() * 1000000),
          timestamp: new Date().toISOString()
        };
      }

      console.log(`🔍 TESTING MODE: Using MStocks API only for ${symbol}`);
      console.log(`🔍 All other APIs (NSE, Google Finance) are disabled for testing`);

      // Use MStocks API only (testing mode)
      if (!this.isLoggedIn()) {
        console.log(`❌ MStocks API: Not logged in`);
        console.log(`- Access Token: ${this.accessToken ? 'Available' : 'Not available'}`);
        console.log(`- Token Expiry: ${this.tokenExpiry}`);
        console.log(`- API Key: ${this.apiKey ? 'Available' : 'Not available'}`);
        console.log(`- Current Time: ${new Date()}`);
        console.log(`- Token Valid: ${this.tokenExpiry > new Date()}`);
        
        return {
          symbol: symbol,
          lastPrice: 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          timestamp: new Date().toISOString(),
          source: 'Failed - Not Logged into MStocks'
        };
      }
      
      if (this.isLoggedIn()) {
        try {
          console.log(`🔐 MStocks Authentication Check:`);
          console.log(`- Is Logged In: ${this.isLoggedIn()}`);
          console.log(`- API Key: ${this.apiKey ? 'Available' : 'Not available'}`);
          console.log(`- Token Expiry: ${this.tokenExpiry}`);
          console.log(`- Time to Expiry: ${Math.round((this.tokenExpiry - new Date()) / 60000)} minutes`);
          
          const token = await this.getAccessToken();
          console.log(`- Access Token: ${token ? 'Available' : 'Not available'}`);
          if (token) {
            console.log(`- Token Length: ${token.length}`);
            console.log(`- Token Preview: ${token.substring(0, 20)}...`);
          }
          
          // Test MStocks API connectivity first
          console.log(`🔍 Testing MStocks API connectivity...`);
          console.log(`🔍 Base URL: ${MSTOCKS_API_BASE_URL}`);
          
          try {
            const testResponse = await fetch(`${MSTOCKS_API_BASE_URL}/user/profile`, {
              method: 'GET',
              headers: {
                'X-Mirae-Version': '1',
                'Authorization': `token ${this.apiKey}:${token}`,
                'Content-Type': 'application/json',
              }
            });
            console.log(`🔍 MStocks API connectivity test status: ${testResponse.status}`);
            if (testResponse.ok) {
              const testData = await testResponse.json();
              console.log(`✅ MStocks API connectivity successful:`, testData);
            } else {
              console.log(`❌ MStocks API connectivity failed: ${testResponse.status}`);
              const errorText = await testResponse.text();
              console.log(`❌ Error response:`, errorText);
            }
          } catch (testError) {
            console.log(`❌ MStocks API connectivity error:`, testError.message);
          }
          
          // Test different MStocks API endpoints
          console.log(`🔍 Testing different MStocks API endpoints...`);
          const testEndpoints = [
            '/user/profile',
            '/account/details',
            '/market/status',
            '/portfolio/holdings'
          ];
          
          for (const endpoint of testEndpoints) {
            try {
              const endpointResponse = await fetch(`${MSTOCKS_API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                  'X-Mirae-Version': '1',
                  'Authorization': `token ${this.apiKey}:${token}`,
                  'Content-Type': 'application/json',
                }
              });
              console.log(`🔍 Endpoint ${endpoint}: ${endpointResponse.status}`);
            } catch (endpointError) {
              console.log(`🔍 Endpoint ${endpoint}: Error - ${endpointError.message}`);
            }
          }
          
          // Use the correct LTP endpoint from MStocks API documentation
          const cleanSymbol = symbol.replace('NSE:', '').replace('BSE:', '');
          
          // Try to search for the instrument first to get the correct symbol
          console.log(`🔍 Searching for instrument: ${cleanSymbol}`);
          try {
            const searchResponse = await fetch(`${MSTOCKS_API_BASE_URL}/instruments/search?q=${cleanSymbol}`, {
              method: 'GET',
              headers: {
                'X-Mirae-Version': '1',
                'Authorization': `token ${this.apiKey}:${token}`,
                'Content-Type': 'application/json',
              }
            });
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              console.log(`🔍 Instrument search results for ${cleanSymbol}:`, searchData);
              
              // If we found instruments, use the first one's symbol
              if (searchData.data && searchData.data.length > 0) {
                const foundSymbol = searchData.data[0].symbol || searchData.data[0].tradingsymbol;
                console.log(`🔍 Found instrument symbol: ${foundSymbol}`);
                symbolFormats.unshift(foundSymbol); // Add to beginning of array
              }
            } else {
              console.log(`🔍 Instrument search failed: ${searchResponse.status}`);
            }
          } catch (searchError) {
            console.log(`🔍 Instrument search error:`, searchError.message);
          }
          
          // Try different symbol formats for MStocks API
          const symbolFormats = [
            `${cleanSymbol}-EQ`,           // Most common: "MIDSELIETF-EQ"
            `${cleanSymbol}_EQ`,           // With underscore: "MIDSELIETF_EQ"
            cleanSymbol,                   // Original: "MIDSELIETF"
            `${cleanSymbol}.NS`,           // Yahoo style: "MIDSELIETF.NS"
            `${cleanSymbol}.NSE`,          // NSE format: "MIDSELIETF.NSE"
            `NSE:${cleanSymbol}`,          // With exchange prefix: "NSE:MIDSELIETF"
            `BSE:${cleanSymbol}`,          // BSE format: "BSE:MIDSELIETF"
            `${cleanSymbol}`,              // Plain symbol
            cleanSymbol.toUpperCase(),     // Uppercase: "MIDSELIETF"
            cleanSymbol.toLowerCase()      // Lowercase: "midselietf"
          ];
          
          let lastError = null;
          
          for (const symbolFormat of symbolFormats) {
            try {
              const params = new URLSearchParams();
              params.append('i', symbolFormat); // Add symbol as query parameter
          
          console.log(`🔍 Trying MStocks LTP API for: ${symbol} with format: ${symbolFormat}`);
          console.log(`🔍 MStocks API URL: ${MSTOCKS_API_BASE_URL}/instruments/quote`);
          console.log(`🔍 MStocks API Headers:`, {
            'X-Mirae-Version': '1',
            'Authorization': `token ${this.apiKey}:${token}`,
            'Content-Type': 'application/json',
          });
          console.log(`🔍 Full Authorization Header: token ${this.apiKey}:${token}`);
          console.log(`🔍 Request Method: POST`);
          console.log(`🔍 Request URL: ${MSTOCKS_API_BASE_URL}/instruments/quote`);
          
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(`${MSTOCKS_API_BASE_URL}/instruments/quote`, {
            method: 'POST',
            headers: {
              'X-Mirae-Version': '1',
              'Authorization': `token ${this.apiKey}:${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              instruments: [symbolFormat]
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          console.log(`📊 MStocks LTP API Response Status: ${response.status}`);
          console.log(`📊 MStocks LTP API Response Headers:`, Object.fromEntries(response.headers.entries()));

          if (response.ok) {
            let data;
            try {
              data = await response.json();
              console.log('📊 MStocks LTP API Response:', data);
            } catch (parseError) {
              console.error('❌ Failed to parse MStocks LTP API response:', parseError);
              const responseText = await response.text();
              console.log('❌ Raw response text:', responseText);
              throw new Error('Invalid JSON response from MStocks LTP API');
            }
            
            // Handle different response formats for /market/quotes endpoint
            let lastPrice = null;
            
            if (data.status === 'success' && data.data) {
              // Try different data structures
              if (Array.isArray(data.data) && data.data.length > 0) {
                // If data is an array, look for the first item with price
                const firstItem = data.data[0];
                if (firstItem.last_price) {
                  lastPrice = firstItem.last_price;
                } else if (firstItem.ltp) {
                  lastPrice = firstItem.ltp;
                } else if (firstItem.price) {
                  lastPrice = firstItem.price;
                } else if (firstItem.close) {
                  lastPrice = firstItem.close;
                }
              } else if (data.data[symbolFormat] && data.data[symbolFormat].last_price) {
                lastPrice = data.data[symbolFormat].last_price;
              } else if (data.data[cleanSymbol] && data.data[cleanSymbol].last_price) {
                lastPrice = data.data[cleanSymbol].last_price;
              } else if (data.data.last_price) {
                lastPrice = data.data.last_price;
              } else if (data.data.ltp) {
                lastPrice = data.data.ltp;
              } else if (data.data.price) {
                lastPrice = data.data.price;
              }
            } else if (data.last_price) {
              lastPrice = data.last_price;
            } else if (data.ltp) {
              lastPrice = data.ltp;
            } else if (data.price) {
              lastPrice = data.price;
            }
            
                         if (lastPrice && parseFloat(lastPrice) > 0) {
               // Convert from paisa to rupees if needed (MStocks sometimes returns price in paisa)
               let finalPrice = parseFloat(lastPrice);
               if (finalPrice > 1000) { // If price seems too high, it might be in paisa
                 finalPrice = finalPrice / 100;
               }
               
               console.log(`✅ MStocks Market Quotes price for ${symbol} with format ${symbolFormat}: ₹${finalPrice}`);
               
               return {
                 symbol: symbol,
                 lastPrice: finalPrice,
                 change: 0, // Market quotes endpoint doesn't provide change data
                 changePercent: 0,
                 volume: 0, // Market quotes endpoint doesn't provide volume data
                 timestamp: new Date().toISOString(),
                 source: 'MStocks Market Quotes API'
               };
             } else {
               console.log(`⚠️ MStocks Market Quotes API returned invalid price for ${symbol} with format ${symbolFormat}:`, lastPrice);
               lastError = 'No valid price data in MStocks response';
               continue; // Try next symbol format
             }
                      } else {
              console.log(`❌ MStocks Market Quotes API failed with status: ${response.status} for format ${symbolFormat}`);
              const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
              console.log(`❌ MStocks Market Quotes API error response:`, errorData);
              lastError = `MStocks Market Quotes API error: ${response.status} - ${errorData.message || 'Unknown error'}`;
              continue; // Try next symbol format
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.log(`⏰ MStocks LTP API timeout for ${symbol} with format ${symbolFormat} (10 seconds)`);
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
              console.log(`🌐 MStocks LTP API network error for ${symbol} with format ${symbolFormat}:`, error.message);
            } else {
              console.log(`❌ MStocks LTP API failed for ${symbol} with format ${symbolFormat}:`, error.message);
            }
            lastError = error.message;
            continue; // Try next symbol format
          }
        }
        
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log(`⏰ MStocks Market Quotes API timeout for ${symbol} (10 seconds)`);
          } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.log(`🌐 MStocks Market Quotes API network error for ${symbol}:`, error.message);
          } else {
            console.log(`❌ MStocks Market Quotes API failed for ${symbol}:`, error.message);
          }
          console.log('❌ TESTING MODE: No fallback APIs available');
        }
      }

      // Return 0 if MStocks API fails (testing mode - no fallbacks)
      console.log(`❌ MStocks API failed for ${symbol}, returning 0 (testing mode)`);
      return {
        symbol: symbol,
        lastPrice: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        timestamp: new Date().toISOString(),
        source: 'Failed - MStocks API Only (Testing Mode)'
      };
    } catch (error) {
      console.error('Error fetching live price:', error);
      throw error;
    }
  }

  // Fetch live prices for multiple symbols
  async getLivePrices(symbols) {
    try {
      const prices = {};
      for (const symbol of symbols) {
        try {
          const price = await this.getLivePrice(symbol);
          prices[symbol] = {
            currentPrice: price.lastPrice,
            change: price.change,
            changePercent: price.changePercent,
            volume: price.volume,
            timestamp: price.timestamp,
            source: price.source || 'Unknown'
          };
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
          prices[symbol] = {
            error: error.message,
            source: 'Error'
          };
        }
      }
      return prices;
    } catch (error) {
      console.error('Error fetching live prices:', error);
      throw error;
    }
  }

  // Get market status
  async getMarketStatus() {
    try {
      if (DEMO_MODE) {
        return {
          status: 'open',
          message: 'Market is open (Demo Mode)',
          timestamp: new Date().toISOString()
        };
      }

      const token = await this.getAccessToken();
      
      const response = await fetch(`${MSTOCKS_API_BASE_URL}/market/status`, {
        method: 'GET',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get market status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting market status:', error);
      throw error;
    }
  }

  // Place buy order - Based on official Python SDK
  async placeBuyOrder(orderData) {
    try {
      // Log the incoming order data for debugging
      console.log('=== BUY ORDER REQUEST ===');
      console.log('Incoming orderData:', orderData);
      console.log('DEMO_MODE:', DEMO_MODE);
      console.log('isLoggedIn():', this.isLoggedIn());
      console.log('hasCredentials():', this.hasCredentials());
      console.log('API Key:', this.apiKey);
      console.log('Access Token available:', !!this.accessToken);
      console.log('Token Expiry:', this.tokenExpiry);
      console.log('========================');

      // Display parameters in a clear format
      console.log('📋 ORDER PARAMETERS BREAKDOWN:');
      console.log('┌─────────────────────────────────────────┐');
      console.log('│           ORDER PARAMETERS              │');
      console.log('├─────────────────────────────────────────┤');
      console.log(`│ Symbol:           ${orderData.symbol || 'N/A'}           │`);
      console.log(`│ Quantity:         ${orderData.quantity || 'N/A'}           │`);
      console.log(`│ Price:            ${orderData.price || 'N/A'}           │`);
      console.log(`│ Order Type:       ${orderData.orderType || 'MARKET'}           │`);
      console.log(`│ Product Type:     ${orderData.productType || 'CNC'}           │`);
      console.log(`│ Validity:         ${orderData.validity || 'DAY'}           │`);
      console.log(`│ Trigger Price:    ${orderData.triggerPrice || 'N/A'}           │`);
      console.log('└─────────────────────────────────────────┘');

      if (DEMO_MODE) {
        // Simulate order placement in demo mode
        console.log('Demo mode: Simulating buy order placement', orderData);
        
        // Validate demo order data
        if (!orderData.symbol) {
          throw new Error('Symbol is required for order placement');
        }
        if (!orderData.quantity || orderData.quantity <= 0) {
          throw new Error('Valid quantity is required for order placement');
        }
        
        const orderId = `demo_buy_${Date.now()}`;
        
        // Create holding entry for demo data service
        const holdingEntry = {
          id: `demo_holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol: orderData.symbol,
          name: orderData.symbol, // You might want to get the actual name from market data
          sector: 'ETF', // Default sector
          buyDate: new Date().toISOString().split('T')[0],
          buyPrice: orderData.price || 0,
          quantity: orderData.quantity,
          totalInvested: (orderData.price || 0) * orderData.quantity,
          currentPrice: orderData.price || 0,
          currentValue: (orderData.price || 0) * orderData.quantity,
          profitLoss: 0,
          profitPercentage: 0,
          lastBuyPrice: orderData.price || 0,
          lastBuyDate: new Date().toISOString().split('T')[0],
          orderId: orderId,
          orderType: orderData.orderType || 'MARKET',
          productType: orderData.productType || 'CNC'
        };
        
              // Demo mode - add to localStorage instead
      const existingData = localStorage.getItem('etfTradingData');
      const data = existingData ? JSON.parse(existingData) : { holdings: [], soldItems: [], pendingOrders: [], orderHistory: [] };
      data.holdings.push(holdingEntry);
      localStorage.setItem('etfTradingData', JSON.stringify(data));
        
        return {
          status: 'success',
          orderId: orderId,
          message: 'Buy order placed successfully (Demo Mode)',
          timestamp: new Date().toISOString(),
          symbol: orderData.symbol,
          quantity: orderData.quantity,
          price: orderData.price || 0,
          type: 'BUY',
          orderType: orderData.orderType || 'MARKET',
          holdingEntry: holdingEntry
        };
      }

      // Check if we have valid credentials
      if (!this.hasCredentials()) {
        throw new Error('MStocks credentials not configured. Please login first.');
      }

      if (!this.isLoggedIn()) {
        throw new Error('Not logged in to MStocks. Please login again.');
      }

      // Get access token for debugging
      await this.getAccessToken();
      
      // Try to refresh token if it's close to expiry
      const timeUntilExpiry = this.tokenExpiry - new Date();
      if (timeUntilExpiry < 30 * 60 * 1000) { // Less than 30 minutes
        console.log('🔄 Token expiring soon, attempting to refresh...');
        await this.refreshAccessToken();
      }
      
      // Get all available tokens
      let accessToken;
      try {
        accessToken = await this.getAccessToken();
      } catch (error) {
        console.log('❌ Token retrieval error:', error.message);
      }
      
      // Display access token debugging information
      console.log('🔑 ACCESS TOKEN DEBUGGING:');
      console.log('┌─────────────────────────────────────────┐');
      console.log('│         ACCESS TOKEN INFO              │');
      console.log('├─────────────────────────────────────────┤');
      console.log(`│ API Key:          ${this.apiKey}           │`);
      console.log(`│ Access Token:     ${accessToken ? accessToken.substring(0, 20) + '...' : 'N/A'}           │`);
      console.log(`│ Token Length:     ${accessToken ? accessToken.length : 0}           │`);
      console.log(`│ Token Type:       ${typeof accessToken}           │`);
      console.log(`│ Token Expiry:     ${this.tokenExpiry}           │`);
      console.log(`│ Time to Expiry:   ${Math.round(timeUntilExpiry / 60000)} minutes           │`);
      console.log('└─────────────────────────────────────────┘');
      
      // First, let's test if the API is accessible and authentication works
      console.log('🔍 Testing API connectivity and authentication...');
      
      try {
        // Test 1: Check if we can access the API
        const connectivityResponse = await fetch(`${MSTOCKS_API_BASE_URL}/user/profile`, {
          method: 'GET',
          headers: {
            'X-Mirae-Version': '1',
            'Authorization': `token ${this.apiKey}:${accessToken}`,
            'Content-Type': 'application/json',
          }
        });
        
        console.log('🔗 API Connectivity Test:');
        console.log('- Status:', connectivityResponse.status);
        console.log('- Headers:', Object.fromEntries(connectivityResponse.headers.entries()));
        
        if (connectivityResponse.ok) {
          const profileData = await connectivityResponse.json();
          console.log('✅ API connectivity successful:', profileData);
        } else {
          const errorText = await connectivityResponse.text();
          console.log('❌ API connectivity failed:', errorText);
        }
      } catch (error) {
        console.log('❌ API connectivity error:', error.message);
      }
      
      // Test 2: Check if we can get market data (another API endpoint)
      try {
        const marketResponse = await fetch(`${MSTOCKS_API_BASE_URL}/market/quotes`, {
          method: 'POST',
          headers: {
            'X-Mirae-Version': '1',
            'Authorization': `token ${this.apiKey}:${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbols: [orderData.symbol]
          })
        });
        
        console.log('📊 Market Data Test:');
        console.log('- Status:', marketResponse.status);
        
        if (marketResponse.ok) {
          const marketData = await marketResponse.json();
          console.log('✅ Market data successful:', marketData);
        } else {
          const errorText = await marketResponse.text();
          console.log('❌ Market data failed:', errorText);
        }
      } catch (error) {
        console.log('❌ Market data error:', error.message);
      }
      
      // Prepare order data for MStocks API based on official documentation
      // From official docs: https://tradingapi.mstock.com/docs/v1/typeA/Orders/#order-apis
      // Endpoint: POST https://api.mstock.trade/openapi/typea/orders/{variety}
      // Content-Type: application/x-www-form-urlencoded
      // Parameters: tradingsymbol, exchange, transaction_type, order_type, quantity, product, validity, price (no underscores)
      
      // Try different symbol formats - MStocks might require specific format
      const symbolFormats = [
        orderData.symbol,                    // Original: "BANKBEES"
        `${orderData.symbol}-EQ`,           // With suffix: "BANKBEES-EQ"
        `${orderData.symbol}_EQ`,           // With underscore: "BANKBEES_EQ"
        `NSE:${orderData.symbol}`,          // With exchange: "NSE:BANKBEES"
        `${orderData.symbol}NSE`,           // With exchange suffix: "BANKBEESNSE"
        orderData.symbol.toUpperCase(),     // Uppercase: "BANKBEES"
        orderData.symbol.toLowerCase()      // Lowercase: "bankbees"
      ];
      
      console.log('🔍 Testing different symbol formats:', symbolFormats);
      
      let lastError = null;
      
      // Try different API endpoints for order placement based on official docs
      const orderEndpoints = [
        '/orders/regular',     // Official docs endpoint with variety
        '/orders/place',       // Alternative endpoint
        '/order/place',        // Alternative endpoint
        '/trading/place_order', // Trading endpoint
        '/place_order',        // Simple endpoint
        '/orders',             // Orders endpoint
        '/order'               // Order endpoint
      ];
      
      for (const symbolFormat of symbolFormats) {
        for (const endpoint of orderEndpoints) {
          try {
            // Prepare form data according to official API documentation
            const formData = new URLSearchParams();
            formData.append('tradingsymbol', symbolFormat);           // No underscore
            formData.append('exchange', 'NSE');                       // No underscore
            formData.append('transaction_type', 'BUY');               // No underscore
            formData.append('order_type', orderData.orderType || 'MARKET'); // No underscore
            formData.append('quantity', orderData.quantity.toString()); // No underscore
            formData.append('product', orderData.productType || 'CNC'); // No underscore
            formData.append('validity', orderData.validity || 'DAY'); // No underscore
            formData.append('price', orderData.price ? orderData.price.toString() : '0'); // No underscore

            // Display API payload in a clear format
            console.log(`📤 Testing symbol: "${symbolFormat}" on endpoint: "${endpoint}"`);
            console.log('┌─────────────────────────────────────────┐');
            console.log('│           API PAYLOAD (FORM DATA)      │');
            console.log('├─────────────────────────────────────────┤');
            console.log(`│ tradingsymbol:    ${symbolFormat}           │`);
            console.log(`│ exchange:         NSE                  │`);
            console.log(`│ transaction_type: BUY                  │`);
            console.log(`│ order_type:       ${orderData.orderType || 'MARKET'}           │`);
            console.log(`│ quantity:         ${orderData.quantity}           │`);
            console.log(`│ product:          ${orderData.productType || 'CNC'}           │`);
            console.log(`│ validity:         ${orderData.validity || 'DAY'}           │`);
            console.log(`│ price:            ${orderData.price ? orderData.price.toString() : '0'}           │`);
            console.log('└─────────────────────────────────────────┘');

            // Validate required fields
            if (!symbolFormat) {
              throw new Error('Symbol is required for order placement');
            }
            if (!orderData.quantity || orderData.quantity <= 0) {
              throw new Error('Valid quantity is required for order placement');
            }
            if ((orderData.orderType || 'MARKET') === 'LIMIT' && (!orderData.price || parseFloat(orderData.price) <= 0)) {
              throw new Error('Valid price is required for LIMIT orders');
            }

            console.log('=== ORDER PAYLOAD ===');
            console.log('Form Data:', formData.toString());
            console.log('API URL:', `${MSTOCKS_API_BASE_URL}${endpoint}`);
            console.log('Headers:', {
              'X-Mirae-Version': '1',
              'Authorization': `token ${this.apiKey}:${accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            });
            console.log('====================');

            // Based on official MStocks API documentation
            // https://tradingapi.mstock.com/docs/v1/typeA/Orders/#order-apis
            console.log(`🚀 Attempting order placement with symbol: "${symbolFormat}" on endpoint: "${endpoint}"`);
            
            // Try the order placement endpoint with form data
            const response = await fetch(`${MSTOCKS_API_BASE_URL}${endpoint}`, {
              method: 'POST',
              headers: {
                'X-Mirae-Version': '1',
                'Authorization': `token ${this.apiKey}:${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData
            });

            console.log(`Response status for symbol "${symbolFormat}" on endpoint "${endpoint}":`, response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
              const result = await response.json();
              console.log(`✅ Order placed successfully with symbol "${symbolFormat}" on endpoint "${endpoint}":`, result);
              return result;
            } else {
              let errorMessage = `Symbol "${symbolFormat}" on endpoint "${endpoint}" failed with status: ${response.status}`;
              try {
                const errorData = await response.json();
                console.log(`Error response for "${symbolFormat}" on "${endpoint}":`, errorData);
                errorMessage += ` - ${errorData.message || errorData.error || 'Unknown error'}`;
              } catch (parseError) {
                const errorText = await response.text();
                console.log(`Error text for "${symbolFormat}" on "${endpoint}":`, errorText);
                errorMessage += ` - ${errorText || 'Unknown error'}`;
              }
              lastError = errorMessage;
              console.log(`❌ ${lastError}`);
            }
          } catch (error) {
            lastError = `Symbol "${symbolFormat}" on endpoint "${endpoint}" error: ${error.message}`;
            console.log(`❌ ${lastError}`);
          }
        }
      }

      // If all form data endpoints fail, try with JSON payload as fallback
      console.log('📝 Trying with JSON payload as fallback');
      
      try {
        const jsonPayload = {
          tradingsymbol: orderData.symbol,
          exchange: 'NSE',
          transaction_type: 'BUY',
          order_type: orderData.orderType || 'MARKET',
          quantity: orderData.quantity.toString(),
          product: orderData.productType || 'CNC',
          validity: orderData.validity || 'DAY',
          price: orderData.price ? orderData.price.toString() : '0'
        };

        const response = await fetch(`${MSTOCKS_API_BASE_URL}/orders/regular`, {
          method: 'POST',
          headers: {
            'X-Mirae-Version': '1',
            'Authorization': `token ${this.apiKey}:${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonPayload)
        });

        console.log('JSON fallback response status:', response.status);
        console.log('JSON fallback response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Success with JSON fallback:', result);
          return result;
        } else {
          let errorMessage = `JSON fallback failed with status: ${response.status}`;
          try {
            const errorData = await response.json();
            console.log('JSON fallback error response:', errorData);
            errorMessage += ` - ${errorData.message || errorData.error || 'Unknown error'}`;
          } catch (parseError) {
            const errorText = await response.text();
            console.log('JSON fallback error text:', errorText);
            errorMessage += ` - ${errorText || 'Unknown error'}`;
          }
          lastError = errorMessage;
        }
      } catch (error) {
        lastError = `JSON fallback error: ${error.message}`;
      }

      throw new Error(`Failed to place buy order. All symbol formats and endpoints failed. Last error: ${lastError}`);
    } catch (error) {
      console.error('=== ORDER PLACEMENT ERROR ===');
      console.error('Error placing buy order:', error);
      console.error('Error stack:', error.stack);
      console.error('============================');
      throw error;
    }
  }

  // Place sell order - Based on official Python SDK
  async placeSellOrder(orderData) {
    try {
      // Log the incoming order data for debugging
      console.log('=== SELL ORDER REQUEST ===');
      console.log('Symbol:', orderData.symbol, 'Quantity:', orderData.quantity, 'Type:', orderData.orderType);
      console.log('DEMO_MODE:', DEMO_MODE, 'Logged In:', this.isLoggedIn());
      console.log('========================');

      if (DEMO_MODE) {
        // Simulate order placement in demo mode
        console.log('Demo mode: Simulating sell order placement', orderData);
        
        // Validate demo order data
        if (!orderData.symbol) {
          throw new Error('Symbol is required for order placement');
        }
        if (!orderData.quantity || orderData.quantity <= 0) {
          throw new Error('Valid quantity is required for order placement');
        }
        
        const orderId = `demo_sell_${Date.now()}`;
        
        // Create sold item entry for demo data service
        const soldItemEntry = {
          id: `demo_sold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol: orderData.symbol,
          name: orderData.symbol, // You might want to get the actual name from market data
          sector: 'ETF', // Default sector
          buyDate: new Date().toISOString().split('T')[0], // This should come from the holding being sold
          sellDate: new Date().toISOString().split('T')[0],
          buyPrice: orderData.originalBuyPrice || 0, // This should come from the holding being sold
          sellPrice: orderData.price || 0,
          quantity: orderData.quantity,
          profit: ((orderData.price || 0) - (orderData.originalBuyPrice || 0)) * orderData.quantity,
          profitPercentage: orderData.originalBuyPrice ? (((orderData.price || 0) - orderData.originalBuyPrice) / orderData.originalBuyPrice) * 100 : 0,
          reason: 'Target achieved',
          orderId: orderId,
          holdingId: orderData.holdingId // ID of the holding that was sold
        };
        
        // Demo mode - update localStorage
        if (orderData.holdingId) {
          const existingData = localStorage.getItem('etfTradingData');
          if (existingData) {
            const data = JSON.parse(existingData);
            data.holdings = data.holdings.filter(h => h.id !== orderData.holdingId);
            data.soldItems.push(soldItemEntry);
            localStorage.setItem('etfTradingData', JSON.stringify(data));
          }
        }
        
        return {
          status: 'success',
          orderId: orderId,
          message: 'Sell order placed successfully (Demo Mode)',
          timestamp: new Date().toISOString(),
          symbol: orderData.symbol,
          quantity: orderData.quantity,
          price: orderData.price || 0,
          type: 'SELL',
          orderType: orderData.orderType || 'MARKET',
          soldItemEntry: soldItemEntry
        };
      }

      // Check if we have valid credentials
      if (!this.hasCredentials()) {
        throw new Error('MStocks credentials not configured. Please login first.');
      }

      if (!this.isLoggedIn()) {
        throw new Error('Not logged in to MStocks. Please login again.');
      }

      // Try to refresh token if it's close to expiry
      const timeUntilExpiry = this.tokenExpiry - new Date();
      if (timeUntilExpiry < 30 * 60 * 1000) { // Less than 30 minutes
        console.log('🔄 Token expiring soon, attempting to refresh...');
        await this.refreshAccessToken();
      }
      
      // Get all available tokens
      let accessToken;
      try {
        accessToken = await this.getAccessToken();
      } catch (error) {
        console.log('❌ Token retrieval error:', error.message);
      }

      // Test API connectivity first (minimal logging)
      try {
        await fetch(`${MSTOCKS_API_BASE_URL}/user/profile`, {
          method: 'GET',
          headers: {
            'X-Mirae-Version': '1',
            'Authorization': `token ${this.apiKey}:${accessToken}`,
            'Content-Type': 'application/json',
          }
        });
      } catch (error) {
        console.log('⚠️ API connectivity test failed:', error.message);
      }

      // Prepare order data for MStocks API - using the same format as buy orders
      const orderPayload = {
        tradingsymbol: orderData.symbol,
        exchange: 'NSE',
        transaction_type: 'SELL',
        order_type: orderData.orderType || 'MARKET',
        quantity: orderData.quantity.toString(),
        product: orderData.productType || 'CNC',
        validity: orderData.validity || 'DAY',
        price: orderData.price ? orderData.price.toString() : '0',
        trigger_price: orderData.triggerPrice ? orderData.triggerPrice.toString() : '0'
      };

      // Display API payload in a clear format
      console.log('📤 SELL ORDER PAYLOAD:', orderPayload);

      // Validate required fields
      if (!orderPayload.tradingsymbol) {
        throw new Error('Symbol is required for order placement');
      }
      if (!orderPayload.quantity || parseInt(orderPayload.quantity) <= 0) {
        throw new Error('Valid quantity is required for order placement');
      }
      if (orderPayload.order_type === 'LIMIT' && (!orderPayload.price || parseFloat(orderPayload.price) <= 0)) {
        throw new Error('Valid price is required for LIMIT orders');
      }

      console.log('🚀 Starting sell order placement...');

      // Try multiple symbol formats and endpoints like buy orders
      const symbolFormats = [
        orderData.symbol,
        `${orderData.symbol}-EQ`,
        `${orderData.symbol}_EQ`,
        `NSE:${orderData.symbol}`,
        `NSE`,
        orderData.symbol.toUpperCase(),
        orderData.symbol.toLowerCase()
      ];

      const endpoints = [
        '/orders/regular',
        '/orders/place',
        '/order/place',
        '/trading/place_order',
        '/place_order',
        '/orders'
      ];

      let lastError = '';

      // Try form data approach first (as per API docs)
      for (const symbolFormat of symbolFormats) {
        for (const endpoint of endpoints) {
          try {
            // Create form data
            const formData = new URLSearchParams();
            formData.append('tradingsymbol', symbolFormat);
            formData.append('exchange', 'NSE');
            formData.append('transaction_type', 'SELL');
            formData.append('order_type', orderData.orderType || 'MARKET');
            formData.append('quantity', orderData.quantity.toString());
            formData.append('product', orderData.productType || 'CNC');
            formData.append('validity', orderData.validity || 'DAY');
            formData.append('price', orderData.price ? orderData.price.toString() : '0');
            formData.append('trigger_price', orderData.triggerPrice ? orderData.triggerPrice.toString() : '0');

            // Try the order placement endpoint with form data
            const response = await fetch(`${MSTOCKS_API_BASE_URL}${endpoint}`, {
              method: 'POST',
              headers: {
                'X-Mirae-Version': '1',
                'Authorization': `token ${this.apiKey}:${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData
            });

            if (response.ok) {
              const result = await response.json();
              console.log(`✅ SUCCESS: Sell order placed with symbol "${symbolFormat}" on endpoint "${endpoint}"`);
              return result;
            } else {
              let errorMessage = `Symbol "${symbolFormat}" on endpoint "${endpoint}" failed with status: ${response.status}`;
              try {
                const errorData = await response.json();
                console.log(`🔍 ERROR DETAILS for "${symbolFormat}" on "${endpoint}":`, errorData);
                errorMessage += ` - ${errorData.message || errorData.error || JSON.stringify(errorData)}`;
              } catch (parseError) {
                const errorText = await response.text();
                console.log(`🔍 ERROR TEXT for "${symbolFormat}" on "${endpoint}":`, errorText);
                errorMessage += ` - ${errorText || 'Unknown error'}`;
              }
              lastError = errorMessage;
            }
          } catch (error) {
            lastError = `Symbol "${symbolFormat}" on endpoint "${endpoint}" error: ${error.message}`;
          }
        }
      }

      // If all form data endpoints fail, try with JSON payload as fallback
      try {
        const jsonPayload = {
          tradingsymbol: orderData.symbol,
          exchange: 'NSE',
          transaction_type: 'SELL',
          order_type: orderData.orderType || 'MARKET',
          quantity: orderData.quantity.toString(),
          product: orderData.productType || 'CNC',
          validity: orderData.validity || 'DAY',
          price: orderData.price ? orderData.price.toString() : '0'
        };

        const response = await fetch(`${MSTOCKS_API_BASE_URL}/orders/regular`, {
          method: 'POST',
          headers: {
            'X-Mirae-Version': '1',
            'Authorization': `token ${this.apiKey}:${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonPayload)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ SUCCESS: Sell order placed with JSON fallback');
          return result;
        } else {
          let errorMessage = `JSON fallback failed with status: ${response.status}`;
          try {
            const errorData = await response.json();
            console.log('🔍 JSON FALLBACK ERROR DETAILS:', errorData);
            errorMessage += ` - ${errorData.message || errorData.error || JSON.stringify(errorData)}`;
          } catch (parseError) {
            const errorText = await response.text();
            console.log('🔍 JSON FALLBACK ERROR TEXT:', errorText);
            errorMessage += ` - ${errorText || 'Unknown error'}`;
          }
          lastError = errorMessage;
        }
      } catch (error) {
        lastError = `JSON fallback error: ${error.message}`;
      }

      throw new Error(`Failed to place sell order. All symbol formats and endpoints failed. Last error: ${lastError}`);
    } catch (error) {
      console.error('=== SELL ORDER PLACEMENT ERROR ===');
      console.error('Error placing sell order:', error);
      console.error('Error stack:', error.stack);
      console.error('==================================');
      throw error;
    }
  }

  // Get order status - Based on official MStocks API documentation
  async getOrderStatus(orderId) {
    try {
      const token = await this.getAccessToken();
      
      if (DEMO_MODE) {
        return {
          status: 'completed',
          orderId: orderId,
          message: 'Order completed (Demo Mode)',
          timestamp: new Date().toISOString()
        };
      }

      console.log('🔍 Getting order status for order ID:', orderId);

      // Based on official MStocks API documentation
      // https://tradingapi.mstock.com/docs/v1/typeA/Orders/#individual-order-details
      // Endpoint: GET https://api.mstock.trade/openapi/typea/order/details
      // Parameters: order_no, segment (E for Equity)
      
      const formData = new URLSearchParams();
      formData.append('order_no', orderId);
      formData.append('segment', 'E'); // E for Equity

      console.log('📤 Order Status Request:');
      console.log('Form Data:', formData.toString());
      console.log('API URL:', `${MSTOCKS_API_BASE_URL}/order/details`);

      const response = await fetch(`${MSTOCKS_API_BASE_URL}/order/details?${formData.toString()}`, {
        method: 'GET',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      console.log('Order status response status:', response.status);
      console.log('Order status response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `Failed to get order status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('Order status error response:', errorData);
          errorMessage += ` - ${errorData.message || errorData.error || 'Unknown error'}`;
        } catch (parseError) {
          const errorText = await response.text();
          console.log('Order status error text:', errorText);
          errorMessage += ` - ${errorText || 'Unknown error'}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Order status retrieved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error getting order status:', error);
      throw error;
    }
  }

  // Order Lifecycle Management Functions
  async placeBuyOrderWithLifecycle(orderData) {
    try {
      console.log('🔄 Starting buy order lifecycle management...');
      
      // Step 1: Place the buy order
      const orderResult = await this.placeBuyOrder(orderData);
      console.log('📋 Buy order placed:', orderResult);
      
      // Step 2: Extract order ID from result
      const orderId = orderResult.orderId || orderResult.order_id || orderResult.id;
      if (!orderId) {
        throw new Error('No order ID received from buy order placement');
      }
      
      console.log('🆔 Order ID received:', orderId);
      
      // Step 3: Wait a moment for order to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Check order status
      const orderStatus = await this.getOrderStatus(orderId);
      console.log('📊 Order status:', orderStatus);
      
      // Step 5: If order is successful, add to holdings
      const status = orderStatus.status || orderStatus.order_status || orderStatus.status_code;
      if (status === 'COMPLETE' || status === 'COMPLETED' || status === 'SUCCESS') {
        console.log('✅ Buy order completed successfully, adding to holdings...');
        
        // Create holding entry
        const holdingEntry = {
          id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol: orderData.symbol,
          name: orderData.symbol, // You might want to get the actual name from market data
          quantity: orderData.quantity,
          buyPrice: orderData.price || 0,
          currentPrice: orderData.price || 0,
          totalInvested: (orderData.price || 0) * orderData.quantity,
          buyDate: new Date().toISOString().split('T')[0],
          sector: 'ETF', // Default sector
          orderId: orderId,
          orderType: orderData.orderType || 'MARKET',
          productType: orderData.productType || 'CNC'
        };
        
        // Return the holding entry to be added to the context
        return {
          success: true,
          orderResult: orderResult,
          orderStatus: orderStatus,
          holdingEntry: holdingEntry,
          message: 'Buy order completed and ready to add to holdings'
        };
      } else {
        console.log('⚠️ Buy order not completed yet, status:', status);
        return {
          success: false,
          orderResult: orderResult,
          orderStatus: orderStatus,
          message: `Buy order placed but not completed yet. Status: ${status}`
        };
      }
    } catch (error) {
      console.error('❌ Buy order lifecycle failed:', error);
      throw error;
    }
  }

  async placeSellOrderWithLifecycle(orderData) {
    try {
      console.log('🔄 Starting sell order lifecycle management...');
      
      // Step 1: Place the sell order
      const orderResult = await this.placeSellOrder(orderData);
      console.log('📋 Sell order placed:', orderResult);
      
      // Step 2: Extract order ID from result
      const orderId = orderResult.orderId || orderResult.order_id || orderResult.id;
      if (!orderId) {
        throw new Error('No order ID received from sell order placement');
      }
      
      console.log('🆔 Order ID received:', orderId);
      
      // Step 3: Wait a moment for order to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Check order status
      const orderStatus = await this.getOrderStatus(orderId);
      console.log('📊 Order status:', orderStatus);
      
      // Step 5: If order is successful, prepare sold item entry
      const status = orderStatus.status || orderStatus.order_status || orderStatus.status_code;
      if (status === 'COMPLETE' || status === 'COMPLETED' || status === 'SUCCESS') {
        console.log('✅ Sell order completed successfully, preparing sold item entry...');
        
        // Create sold item entry
        const soldItemEntry = {
          id: `sold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol: orderData.symbol,
          name: orderData.symbol, // You might want to get the actual name from market data
          quantity: orderData.quantity,
          buyPrice: orderData.originalBuyPrice || 0, // This should come from the holding being sold
          sellPrice: orderData.price || 0,
          sellDate: new Date().toISOString().split('T')[0],
          profitLoss: ((orderData.price || 0) - (orderData.originalBuyPrice || 0)) * orderData.quantity,
          profitPercentage: orderData.originalBuyPrice ? (((orderData.price || 0) - orderData.originalBuyPrice) / orderData.originalBuyPrice) * 100 : 0,
          orderId: orderId,
          orderType: orderData.orderType || 'MARKET',
          productType: orderData.productType || 'CNC',
          holdingId: orderData.holdingId // ID of the holding that was sold
        };
        
        // Return the sold item entry to be processed
        return {
          success: true,
          orderResult: orderResult,
          orderStatus: orderStatus,
          soldItemEntry: soldItemEntry,
          message: 'Sell order completed and ready to process'
        };
      } else {
        console.log('⚠️ Sell order not completed yet, status:', status);
        return {
          success: false,
          orderResult: orderResult,
          orderStatus: orderStatus,
          message: `Sell order placed but not completed yet. Status: ${status}`
        };
      }
    } catch (error) {
      console.error('❌ Sell order lifecycle failed:', error);
      throw error;
    }
  }

  // Get order history - Based on official MStocks API documentation
  async getOrderHistory(filters = {}) {
    try {
      const token = await this.getAccessToken();
      
      if (DEMO_MODE) {
        return {
          status: 'success',
          data: {
            orders: [
              {
                order_id: 'demo_order_1',
                symbol: 'NIFTY50',
                transaction_type: 'BUY',
                quantity: 100,
                price: 150.50,
                status: 'COMPLETE',
                timestamp: new Date().toISOString()
              }
            ]
          }
        };
      }

      console.log('🔍 Getting order history with filters:', filters);

      // Based on official MStocks API documentation
      // https://tradingapi.mstock.com/docs/v1/typeA/Orders/#order-book
      // Endpoint: GET https://api.mstock.trade/openapi/typea/orders
      
      const response = await fetch(`${MSTOCKS_API_BASE_URL}/orders`, {
        method: 'GET',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Order history response status:', response.status);

      if (!response.ok) {
        let errorMessage = `Failed to get order history: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('Order history error response:', errorData);
          errorMessage += ` - ${errorData.message || errorData.error || 'Unknown error'}`;
        } catch (parseError) {
          const errorText = await response.text();
          console.log('Order history error text:', errorText);
          errorMessage += ` - ${errorText || 'Unknown error'}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Order history retrieved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error getting order history:', error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(orderId) {
    try {
      const token = await this.getAccessToken();
      
      if (DEMO_MODE) {
        return {
          status: 'success',
          message: 'Order cancelled successfully (Demo Mode)',
          orderId: orderId
        };
      }

      const response = await fetch(`${MSTOCKS_API_BASE_URL}/orders/cancel`, {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  // Get account details
  async getAccountDetails() {
    try {
      const token = await this.getAccessToken();
      
      if (DEMO_MODE) {
        return {
          status: 'success',
          data: {
            account_id: 'demo_account_123',
            account_type: 'individual',
            broker: 'MIRAE',
            exchanges: ['NSE', 'NFO', 'CDS'],
            products: ['CNC', 'NRML', 'MIS'],
            order_types: ['MARKET', 'LIMIT']
          }
        };
      }

      const response = await fetch(`${MSTOCKS_API_BASE_URL}/account/details`, {
        method: 'GET',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get account details: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting account details:', error);
      throw error;
    }
  }

  // Get broker holdings - using the correct method from official SDK
  async getBrokerHoldings() {
    try {
      const token = await this.getAccessToken();
      
      if (DEMO_MODE) {
        console.log('Demo mode: Returning sample holdings data with live-like prices');
        const demoHoldings = [
          {
            symbol: 'RELIANCE',
            name: 'Reliance Industries Ltd',
            quantity: 100,
            avgPrice: 2500.00,
            currentPrice: 2550.00 + (Math.random() - 0.5) * 100, // Add some variation
            currentValue: 0, // Will be calculated
            totalInvested: 250000,
            profitLoss: 0, // Will be calculated
            profitPercentage: 0 // Will be calculated
          },
          {
            symbol: 'TCS',
            name: 'Tata Consultancy Services Ltd',
            quantity: 50,
            avgPrice: 3500.00,
            currentPrice: 3600.00 + (Math.random() - 0.5) * 100, // Add some variation
            currentValue: 0, // Will be calculated
            totalInvested: 175000,
            profitLoss: 0, // Will be calculated
            profitPercentage: 0 // Will be calculated
          },
          {
            symbol: 'INFY',
            name: 'Infosys Ltd',
            quantity: 75,
            avgPrice: 1500.00,
            currentPrice: 1550.00 + (Math.random() - 0.5) * 50, // Add some variation
            currentValue: 0, // Will be calculated
            totalInvested: 112500,
            profitLoss: 0, // Will be calculated
            profitPercentage: 0 // Will be calculated
          },
          {
            symbol: 'HDFCBANK',
            name: 'HDFC Bank Ltd',
            quantity: 200,
            avgPrice: 1600.00,
            currentPrice: 1650.00 + (Math.random() - 0.5) * 80, // Add some variation
            currentValue: 0, // Will be calculated
            totalInvested: 320000,
            profitLoss: 0, // Will be calculated
            profitPercentage: 0 // Will be calculated
          }
        ];

        // Calculate derived values
        demoHoldings.forEach(holding => {
          holding.currentValue = holding.quantity * holding.currentPrice;
          holding.profitLoss = holding.currentValue - holding.totalInvested;
          holding.profitPercentage = holding.totalInvested > 0 ? (holding.profitLoss / holding.totalInvested) * 100 : 0;
        });

        console.log('Demo holdings with calculated values:', demoHoldings);
        return demoHoldings;
      }

      console.log('=== FETCHING BROKER HOLDINGS USING MSTOCKS SDK ===');
      console.log('API Key:', this.apiKey);
      console.log('Access Token:', token ? 'Available' : 'Not available');
      console.log('Base URL:', MSTOCKS_API_BASE_URL);

      // Based on the official MStocks Portfolio API documentation:
      // https://tradingapi.mstock.com/docs/v1/typeA/Portfolio/
      // The correct endpoint for holdings is /portfolio/holdings
      
      // Try the official portfolio holdings endpoint first
      const response = await fetch(`${MSTOCKS_API_BASE_URL}/portfolio/holdings`, {
        method: 'GET',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('=== RAW HOLDINGS RESPONSE ===');
        console.log('Full response:', JSON.stringify(result, null, 2));
        console.log('Response type:', typeof result);
        console.log('Is array:', Array.isArray(result));
        console.log('Keys:', result ? Object.keys(result) : 'null');
        console.log('================================');
        
        // Handle different response formats based on SDK documentation
        let holdings = [];
        
        if (result.data) {
          console.log('Found result.data:', result.data);
          holdings = Array.isArray(result.data) ? result.data : [result.data];
        } else if (Array.isArray(result)) {
          console.log('Direct array response');
          holdings = result;
        } else if (result.holdings) {
          console.log('Found result.holdings:', result.holdings);
          holdings = Array.isArray(result.holdings) ? result.holdings : [result.holdings];
        } else if (result.net) {
          console.log('Found result.net:', result.net);
          holdings = Array.isArray(result.net) ? result.net : [result.net];
        } else {
          console.log('No recognizable holdings structure found');
          // Try to find any array in the response
          for (const key in result) {
            if (Array.isArray(result[key])) {
              console.log(`Found array in key '${key}':`, result[key]);
              holdings = result[key];
              break;
            }
          }
        }

        console.log('=== PROCESSED HOLDINGS ===');
        console.log('Number of holdings:', holdings.length);
        console.log('First holding:', holdings[0]);
        console.log('All holdings:', holdings);
        console.log('==========================');

        // Transform holdings to match expected format based on SDK field names
        const transformedHoldings = holdings.map((holding, index) => {
          console.log(`Processing holding ${index}:`, holding);
          
          // Handle different field names from the SDK
          const transformed = {
            symbol: holding.symbol || holding.tradingsymbol || holding.trading_symbol || holding.instrument_key || holding.symbol_name || 'N/A',
            name: holding.name || holding.company_name || holding.instrument_name || holding.symbol || 'N/A',
            quantity: holding.quantity || holding.qty || holding.quantity_held || holding.netqty || 0,
            avgPrice: holding.avgPrice || holding.average_price || holding.buy_price || holding.price || holding.buyprice || 0,
            currentPrice: holding.currentPrice || holding.last_price || holding.ltp || holding.current_price || holding.lastprice || 0,
            currentValue: holding.currentValue || holding.current_value || holding.total_value || holding.marketvalue || 0,
            totalInvested: holding.totalInvested || holding.total_invested || holding.invested_amount || holding.buyvalue || 0,
            profitLoss: holding.profitLoss || holding.pnl || holding.profit_loss || holding.realisedpnl || 0,
            profitPercentage: holding.profitPercentage || holding.profit_percentage || holding.pnl_percentage || 0
          };

          // Calculate derived values if not provided
          if (!transformed.currentValue && transformed.quantity && transformed.currentPrice) {
            transformed.currentValue = transformed.quantity * transformed.currentPrice;
          }
          
          if (!transformed.totalInvested && transformed.quantity && transformed.avgPrice) {
            transformed.totalInvested = transformed.quantity * transformed.avgPrice;
          }
          
          if (!transformed.profitLoss && transformed.currentValue && transformed.totalInvested) {
            transformed.profitLoss = transformed.currentValue - transformed.totalInvested;
          }
          
          if (!transformed.profitPercentage && transformed.totalInvested && transformed.profitLoss) {
            transformed.profitPercentage = (transformed.profitLoss / transformed.totalInvested) * 100;
          }

          console.log(`Transformed holding ${index}:`, transformed);
          return transformed;
        });

        // Fetch live market prices for all holdings to get accurate CMP
        console.log('📊 Fetching live market prices for holdings...');
        try {
          const symbols = transformedHoldings.map(h => h.symbol).filter(s => s && s !== 'N/A');
          if (symbols.length > 0) {
            console.log('Symbols to fetch prices for:', symbols);
            
            // Fetch live prices in batches to avoid overwhelming the API
            const batchSize = 5; // Reduced batch size for better reliability
            const pricePromises = [];
            
            for (let i = 0; i < symbols.length; i += batchSize) {
              const batch = symbols.slice(i, i + batchSize);
              // Call getLivePrices for each batch
              const batchPromise = this.getLivePrices(batch);
              pricePromises.push(batchPromise);
            }
            
            const priceResults = await Promise.allSettled(pricePromises);
            const livePrices = {};
            let successfulPrices = 0;
            
            priceResults.forEach((result, index) => {
              if (result.status === 'fulfilled' && result.value) {
                const batchStart = index * batchSize;
                const currentBatch = symbols.slice(batchStart, batchStart + batchSize);
                
                if (Array.isArray(result.value)) {
                  result.value.forEach((priceData, priceIndex) => {
                    if (priceData && priceData.symbol) {
                      // Extract price from different possible response formats
                      let price = null;
                      if (priceData.lastPrice) {
                        price = priceData.lastPrice;
                      } else if (priceData.price) {
                        price = priceData.price;
                      } else if (priceData.ltp) {
                        price = priceData.ltp;
                      } else if (priceData.data && priceData.data.lastPrice) {
                        price = priceData.data.lastPrice;
                      } else if (priceData.data && priceData.data.price) {
                        price = priceData.data.price;
                      }
                      
                      if (price && typeof price === 'number') {
                        livePrices[priceData.symbol] = price;
                        successfulPrices++;
                        console.log(`✅ Live price for ${priceData.symbol}: ₹${price}`);
                      } else {
                        console.log(`⚠️ No valid price found for ${priceData.symbol}:`, priceData);
                      }
                    }
                  });
                } else if (typeof result.value === 'object') {
                  // Handle single symbol response
                  const symbol = currentBatch[0]; // Get the first symbol from current batch
                  if (symbol && result.value.lastPrice) {
                    livePrices[symbol] = result.value.lastPrice;
                    successfulPrices++;
                    console.log(`✅ Live price for ${symbol}: ₹${result.value.lastPrice}`);
                  } else if (symbol && result.value.price) {
                    livePrices[symbol] = result.value.price;
                    successfulPrices++;
                    console.log(`✅ Live price for ${symbol}: ₹${result.value.price}`);
                  }
                }
              } else if (result.status === 'rejected') {
                console.log(`❌ Failed to fetch prices for batch ${index}:`, result.reason);
              }
            });
            
            console.log(`📊 Live prices summary: ${successfulPrices}/${symbols.length} symbols updated with live prices`);
            console.log('Live prices fetched:', livePrices);
            
            // Update holdings with live prices
            let updatedHoldings = 0;
            transformedHoldings.forEach(holding => {
              if (holding.symbol && livePrices[holding.symbol]) {
                const livePrice = livePrices[holding.symbol];
                const oldPrice = holding.currentPrice;
                holding.currentPrice = livePrice;
                holding.currentValue = holding.quantity * livePrice;
                holding.profitLoss = holding.currentValue - holding.totalInvested;
                holding.profitPercentage = holding.totalInvested > 0 ? (holding.profitLoss / holding.totalInvested) * 100 : 0;
                updatedHoldings++;
                
                console.log(`🔄 Updated ${holding.symbol}: Old CMP=₹${oldPrice}, New CMP=₹${livePrice}, Value=₹${holding.currentValue}, P&L=₹${holding.profitLoss}`);
              } else {
                console.log(`ℹ️ Using existing price for ${holding.symbol}: ₹${holding.currentPrice}`);
              }
            });
            
            console.log(`✅ Holdings update complete: ${updatedHoldings}/${transformedHoldings.length} holdings updated with live prices`);
          }
        } catch (error) {
          console.log('⚠️ Failed to fetch live prices:', error.message);
          console.log('ℹ️ Continuing with existing prices from holdings data');
          // Continue with existing prices if live price fetch fails
        }

        // Ensure we have at least some data even if live price fetching failed
        if (transformedHoldings.length === 0) {
          console.log('⚠️ No holdings data available, returning empty array');
          return [];
        }

        console.log('=== FINAL TRANSFORMED HOLDINGS ===');
        console.log('Number of transformed holdings:', transformedHoldings.length);
        console.log('Sample transformed holding:', transformedHoldings[0]);
        console.log('===================================');

        return transformedHoldings;
      } else {
        // If the first endpoint fails, try alternative endpoints
        console.log('First endpoint failed, trying alternative endpoints...');
        
        const alternativeEndpoints = [
          '/portfolio/holdings',
          '/portfolio/positions',
          '/holdings/positions',
          '/positions/holdings',
          '/portfolio/net',
          '/holdings/net'
        ];

        for (const endpoint of alternativeEndpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const altResponse = await fetch(`${MSTOCKS_API_BASE_URL}${endpoint}`, {
              method: 'GET',
              headers: {
                'X-Mirae-Version': '1',
                'Authorization': `token ${this.apiKey}:${token}`,
                'Content-Type': 'application/json',
              }
            });

            if (altResponse.ok) {
              const altResult = await altResponse.json();
              console.log(`Success with endpoint ${endpoint}:`, altResult);
              
              // Process the result similarly
              let holdings = [];
              if (altResult.data) {
                holdings = Array.isArray(altResult.data) ? altResult.data : [altResult.data];
              } else if (Array.isArray(altResult)) {
                holdings = altResult;
              } else if (altResult.holdings) {
                holdings = Array.isArray(altResult.holdings) ? altResult.holdings : [altResult.holdings];
              } else if (altResult.net) {
                holdings = Array.isArray(altResult.net) ? altResult.net : [altResult.net];
              }

              const transformedHoldings = holdings.map((holding, index) => ({
                symbol: holding.symbol || holding.tradingsymbol || holding.trading_symbol || holding.instrument_key || holding.symbol_name || 'N/A',
                name: holding.name || holding.company_name || holding.instrument_name || holding.symbol || 'N/A',
                quantity: holding.quantity || holding.qty || holding.quantity_held || holding.netqty || 0,
                avgPrice: holding.avgPrice || holding.average_price || holding.buy_price || holding.price || holding.buyprice || 0,
                currentPrice: holding.currentPrice || holding.last_price || holding.ltp || holding.current_price || holding.lastprice || 0,
                currentValue: holding.currentValue || holding.current_value || holding.total_value || holding.marketvalue || 0,
                totalInvested: holding.totalInvested || holding.total_invested || holding.invested_amount || holding.buyvalue || 0,
                profitLoss: holding.profitLoss || holding.pnl || holding.profit_loss || holding.realisedpnl || 0,
                profitPercentage: holding.profitPercentage || holding.profit_percentage || holding.pnl_percentage || 0
              }));

              return transformedHoldings;
            }
          } catch (altError) {
            console.log(`Alternative endpoint ${endpoint} failed:`, altError);
            continue;
          }
        }

        // If all endpoints fail, throw the original error
        const errorText = await response.text();
        console.error('All endpoints failed. Original error:', errorText);
        throw new Error(`Failed to fetch broker holdings: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error in getBrokerHoldings:', error);
      throw error;
    }
  }

  // Helper method to calculate 20 DMA (simplified)
  calculateDMA20(currentPrice, changePercent = 0) {
    // Simple calculation: assume 20 DMA is slightly different from current price
    // In real implementation, this would be calculated from historical data
    const volatility = Math.abs(changePercent) / 100;
    const dma20 = currentPrice * (1 - (volatility * 0.5));
    return Math.round(dma20 * 100) / 100; // Round to 2 decimal places
  }

  // Manual price update method for testing
  updateManualPrice(symbol, newPrice, change = 0) {
    try {
      const changePercent = change > 0 ? (change / (newPrice - change)) * 100 : 0;
      
      return {
        symbol: symbol,
        lastPrice: newPrice,
        change: change,
        changePercent: changePercent,
        volume: 0,
        dma20: this.calculateDMA20(newPrice, changePercent),
        timestamp: new Date().toISOString(),
        source: 'Manual Update'
      };
    } catch (error) {
      console.error('Error updating manual price:', error);
      throw error;
    }
  }

  // Submit OTP for authentication
  async submitOTP(otp, sessionId) {
    try {
      if (DEMO_MODE) {
        // Simulate OTP verification in demo mode
        console.log('Demo mode: Simulating 3-digit OTP verification');
        return {
          success: true,
          message: '3-digit OTP verified successfully (Demo Mode)',
          sessionId: sessionId
        };
      }

      console.log('🔐 Submitting 3-digit OTP to MStocks API:', { otp, sessionId });

      const response = await fetch(`${MSTOCKS_API_BASE_URL}/connect/otp`, {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          otp: otp,
          sessionId: sessionId,
          userId: this.username
        })
      });

      console.log('📡 MStocks OTP Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ MStocks OTP Error Response:', errorData);
        throw new Error(errorData.message || `3-digit OTP verification failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ MStocks OTP Success Response:', data);
      
      return {
        success: true,
        message: '3-digit OTP verified successfully',
        data: data,
        sessionId: data.sessionId || sessionId
      };
    } catch (error) {
      console.error('❌ Error submitting 3-digit OTP to MStocks:', error);
      throw error;
    }
  }

  // Resend OTP
  async resendOTP(sessionId) {
    try {
      if (DEMO_MODE) {
        // Simulate OTP resend in demo mode
        console.log('Demo mode: Simulating 3-digit OTP resend');
        return {
          success: true,
          message: '3-digit OTP resent successfully (Demo Mode)',
          sessionId: sessionId
        };
      }

      console.log('📱 Resending 3-digit OTP to MStocks API:', { sessionId });

      const response = await fetch(`${MSTOCKS_API_BASE_URL}/connect/resend-otp`, {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          sessionId: sessionId,
          userId: this.username
        })
      });

      console.log('📡 MStocks Resend OTP Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ MStocks Resend OTP Error Response:', errorData);
        throw new Error(errorData.message || `3-digit OTP resend failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ MStocks Resend OTP Success Response:', data);
      
      return {
        success: true,
        message: '3-digit OTP resent successfully',
        data: data,
        sessionId: data.sessionId || sessionId
      };
    } catch (error) {
      console.error('❌ Error resending 3-digit OTP to MStocks:', error);
      throw error;
    }
  }

  // Helper method to get static price data as fallback
  getStaticPrice(symbol) {
    const sampleETFs = [
      { symbol: 'NIFTYBEES', lastPrice: 245.50, change: 1.2, changePercent: 0.49, volume: 1250000 },
      { symbol: 'BANKBEES', lastPrice: 456.78, change: -0.8, changePercent: -0.17, volume: 890000 },
      { symbol: 'ITBEES', lastPrice: 38.45, change: 2.1, changePercent: 5.77, volume: 2100000 },
      { symbol: 'GOLDBEES', lastPrice: 52.30, change: 0.5, changePercent: 0.96, volume: 450000 },
      { symbol: 'SILVERBEES', lastPrice: 75.20, change: -1.2, changePercent: -1.57, volume: 320000 },
      { symbol: 'JUNIORBEES', lastPrice: 485.60, change: 1.8, changePercent: 0.37, volume: 680000 },
      { symbol: 'PHARMABEES', lastPrice: 16.80, change: 0.9, changePercent: 5.66, volume: 1800000 },
      { symbol: 'CONSUMBEES', lastPrice: 95.40, change: 1.5, changePercent: 1.60, volume: 420000 },
      { symbol: 'MASPTOP50', lastPrice: 32.15, change: 0.7, changePercent: 2.22, volume: 150000 },
      { symbol: 'MON100', lastPrice: 125.80, change: 1.3, changePercent: 1.04, volume: 280000 },
      { symbol: 'HEALTHY', lastPrice: 10.25, change: 0.4, changePercent: 4.06, volume: 950000 },
      { symbol: 'MOM100', lastPrice: 42.60, change: 1.7, changePercent: 4.16, volume: 1100000 },
      { symbol: 'KOTAKNV20', lastPrice: 115.30, change: 0.8, changePercent: 0.70, volume: 180000 },
      { symbol: 'NSE:ESG', lastPrice: 34.75, change: 1.1, changePercent: 3.27, volume: 320000 },
      { symbol: 'NSE:MAFANG', lastPrice: 68.90, change: 2.3, changePercent: 3.45, volume: 120000 },
      { symbol: 'PSUBANKICI', lastPrice: 48.20, change: 0.6, changePercent: 1.26, volume: 850000 },
      { symbol: 'KOTAKPSUBK', lastPrice: 520.40, change: 1.4, changePercent: 0.27, volume: 95000 },
      { symbol: 'MID150BEES', lastPrice: 158.70, change: 1.9, changePercent: 1.21, volume: 380000 },
      { symbol: 'AUTOBEES', lastPrice: 178.90, change: 0.3, changePercent: 0.17, volume: 220000 },
      { symbol: 'ICICICONSU', lastPrice: 88.45, change: 1.6, changePercent: 1.84, volume: 180000 },
      { symbol: 'SETFGOLD', lastPrice: 53.80, change: 0.2, changePercent: 0.37, volume: 280000 },
      { symbol: 'ICICIPHARM', lastPrice: 108.60, change: 0.8, changePercent: 0.74, volume: 85000 },
      { symbol: 'UTINEXT50', lastPrice: 49.25, change: 1.2, changePercent: 2.50, volume: 420000 },
      { symbol: 'HDFCSILVER', lastPrice: 76.40, change: -0.5, changePercent: -0.65, volume: 180000 },
      { symbol: 'ICICINV20', lastPrice: 118.90, change: 0.9, changePercent: 0.76, volume: 120000 },
      { symbol: 'KOTAKLOVOL', lastPrice: 16.45, change: 0.7, changePercent: 4.44, volume: 650000 },
      { symbol: 'KOTAKGOLD', lastPrice: 54.20, change: 0.4, changePercent: 0.74, volume: 220000 },
      { symbol: 'DSPQ50ETF', lastPrice: 195.60, change: 1.8, changePercent: 0.93, volume: 65000 },
      { symbol: 'SETFNIFBK', lastPrice: 468.30, change: 0.5, changePercent: 0.11, volume: 320000 },
      { symbol: 'NSE:BFSI', lastPrice: 21.85, change: 1.1, changePercent: 5.30, volume: 580000 },
      { symbol: 'PSUBNKBEES', lastPrice: 58.90, change: 0.8, changePercent: 1.38, volume: 420000 },
      { symbol: 'ICICIBANKP', lastPrice: 248.70, change: 1.3, changePercent: 0.52, volume: 180000 },
      { symbol: 'KOTAKIT', lastPrice: 36.80, change: 2.2, changePercent: 6.36, volume: 850000 },
      { symbol: 'FMCGIETF', lastPrice: 580.40, change: 0.6, changePercent: 0.10, volume: 45000 },
      { symbol: 'MONQ50', lastPrice: 58.90, change: 1.4, changePercent: 2.44, volume: 95000 },
      { symbol: 'NSE:PHARMABEES', lastPrice: 17.25, change: 0.9, changePercent: 5.50, volume: 1200000 },
      { symbol: 'NSE:HEALTHY', lastPrice: 10.85, change: 0.5, changePercent: 4.83, volume: 750000 },
      { symbol: 'NSE:HEALTHIETF', lastPrice: 112.40, change: 0.7, changePercent: 0.63, volume: 65000 },
      { symbol: 'NSE:ITBEES', lastPrice: 39.60, change: 2.5, changePercent: 6.74, volume: 680000 },
      { symbol: 'NSE:KOTAKIT', lastPrice: 39.20, change: 2.1, changePercent: 5.66, volume: 420000 },
      { symbol: 'NSE:MON100', lastPrice: 138.50, change: 1.6, changePercent: 1.17, volume: 180000 },
      { symbol: 'NSE:MOMOMENTUM', lastPrice: 59.80, change: 1.9, changePercent: 3.28, volume: 220000 },
      { symbol: 'NSE:HDFCSML250', lastPrice: 152.40, change: 2.3, changePercent: 1.53, volume: 280000 },
      { symbol: 'NSE:CONSUMIETF', lastPrice: 96.80, change: 1.7, changePercent: 1.79, volume: 120000 },
      { symbol: 'NSE:CONSUMBEES', lastPrice: 104.60, change: 1.4, changePercent: 1.36, volume: 95000 },
      { symbol: 'NSE:GOLDBEES', lastPrice: 55.90, change: 0.3, changePercent: 0.54, volume: 380000 },
      { symbol: 'NSE:SETFGOLD', lastPrice: 57.80, change: 0.4, changePercent: 0.70, volume: 220000 },
      { symbol: 'NSE:KOTAKGOLD', lastPrice: 56.40, change: 0.2, changePercent: 0.36, volume: 180000 },
      { symbol: 'NSE:MONQ50', lastPrice: 61.50, change: 1.8, changePercent: 3.01, volume: 85000 },
      { symbol: 'NSE:GOLDIETF', lastPrice: 58.20, change: 0.6, changePercent: 1.04, volume: 150000 },
      { symbol: 'NSE:SILVERIETF', lastPrice: 77.90, change: -0.3, changePercent: -0.38, volume: 120000 },
      { symbol: 'NSE:CPSEETF', lastPrice: 89.65, change: 1.2, changePercent: 1.48, volume: 280000, dma20: 88.91 },
      { symbol: 'NSE:BSE500IETF', lastPrice: 34.80, change: 1.5, changePercent: 4.50, volume: 420000 },
      { symbol: 'NSE:PSUBANK', lastPrice: 725.60, change: 0.9, changePercent: 0.12, volume: 85000 },
      { symbol: 'NSE:ALPHA', lastPrice: 48.90, change: 1.3, changePercent: 2.73, volume: 180000 },
      { symbol: 'NSE:SETFNIFBK', lastPrice: 492.30, change: 0.7, changePercent: 0.14, volume: 220000 },
      { symbol: 'NSE:BANKBEES', lastPrice: 498.40, change: 0.8, changePercent: 0.16, volume: 180000 },
      { symbol: 'NSE:HDFCMID150', lastPrice: 18.90, change: 1.6, changePercent: 9.25, volume: 850000 },
      { symbol: 'NSE:HDFCSML250', lastPrice: 158.70, change: 2.1, changePercent: 1.34, volume: 220000 },
      { symbol: 'NSE:BFSI', lastPrice: 22.40, change: 1.2, changePercent: 5.66, volume: 480000 },
      { symbol: 'NSE:MIDSELIETF', lastPrice: 17.17, change: 0.12, changePercent: 0.70, volume: 180000 },
      { symbol: 'NSE:HNGSNGBEES', lastPrice: 278.90, change: 0.9, changePercent: 0.32, volume: 85000 },
      { symbol: 'NSE:MAHKTECH', lastPrice: 14.80, change: 1.1, changePercent: 8.03, volume: 280000 },
      { symbol: 'NSE:MIDQ50ADD', lastPrice: 228.40, change: 1.7, changePercent: 0.75, volume: 65000 },
      { symbol: 'NSE:MIDCAPIETF', lastPrice: 20.10, change: 1.9, changePercent: 10.44, volume: 680000 },
      { symbol: 'NSE:MOM100', lastPrice: 56.80, change: 2.2, changePercent: 4.03, volume: 420000 },
      { symbol: 'NSE:PSUBNKBEES', lastPrice: 81.20, change: 0.8, changePercent: 1.00, volume: 280000 },
      { symbol: 'NSE:PSUBANK', lastPrice: 740.80, change: 1.1, changePercent: 0.15, volume: 68000 },
      { symbol: 'NSE:SILVERBEES', lastPrice: 74.60, change: -0.2, changePercent: -0.27, volume: 220000 },
      { symbol: 'NSE:SILVERIETF', lastPrice: 78.40, change: 0.1, changePercent: 0.13, volume: 120000 }
    ];

    return sampleETFs.find(etf => etf.symbol === symbol);
  }
}

const mstocksApiService = new MStocksApiService();
export default mstocksApiService; 