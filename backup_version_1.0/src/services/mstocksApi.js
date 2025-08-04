// MStocks API Service for live price fetching and trading
// Using official MStocks Trading API v1

// Removed demoDataService import

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

  // Check if credentials are set
  hasCredentials() {
    return this.userCredentials && 
           this.userCredentials.username && 
           this.userCredentials.password;
  }

  // Login to MStocks API using username/password
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
        }
      };
    }

    try {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Login failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error logging into MStocks API:', error);
      throw error;
    }
  }

  // Generate session token using API key and request token
  async generateSession(apiKey, requestToken) {
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
      // Based on official Python SDK: generate_session(api_key, request_token, checksum)
      // Note: We're not using checksum for now, but the SDK shows it's required
      const formData = new URLSearchParams();
      formData.append('api_key', apiKey);
      formData.append('request_token', requestToken);
      // formData.append('checksum', checksum); // Add if needed

      console.log('🔐 Generating session with official SDK format:');
      console.log('API Key:', apiKey);
      console.log('Request Token:', requestToken);

      const response = await fetch(`${MSTOCKS_API_BASE_URL}/session/token`, {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      console.log('Session generation response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Session generation failed:', errorData);
        throw new Error(errorData.message || `Session generation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Session generation successful:', result);
      
      // Store session data based on official SDK response structure
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
      console.error('Error generating MStocks session:', error);
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
      const token = await this.getAccessToken();
      
      const response = await fetch(`${MSTOCKS_API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${token}`,
          'Content-Type': 'application/json',
        }
      });

      this.clearCredentials();
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Logout failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error logging out from MStocks API:', error);
      this.clearCredentials(); // Clear credentials even if logout fails
      throw error;
    }
  }

  // Get live price for a symbol
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

      const token = await this.getAccessToken();
      
      const response = await fetch(`${MSTOCKS_API_BASE_URL}/market/quotes`, {
        method: 'POST',
        headers: {
          'X-Mirae-Version': '1',
          'Authorization': `token ${this.apiKey}:${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: [symbol]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch live price: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching live price:', error);
      throw error;
    }
  }

  // Fetch live prices for multiple symbols
  async getLivePrices(symbols) {
    try {
      const prices = [];
      for (const symbol of symbols) {
        try {
          const price = await this.getLivePrice(symbol);
          prices.push(price);
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
          prices.push({
            symbol: symbol,
            error: error.message
          });
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
}

const mstocksApiService = new MStocksApiService();
export default mstocksApiService; 