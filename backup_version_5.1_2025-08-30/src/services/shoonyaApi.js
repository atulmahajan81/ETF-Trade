// Shoonya API Service for broker connection and live price fetching
class ShoonyaApiService {
  constructor() {
    this.baseUrl = 'https://api.shoonya.com/NorenWClientTP';
    this.accessToken = null;
    this.tokenExpiry = null;
    this.userCredentials = null;
    this.loggedIn = false;
  }

  // SHA256 hash function
  async sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  // Login to Shoonya API
  async login(userId, password, apiKey, vendorCode, imei) {
    try {
      console.log('🔐 Shoonya: Attempting login...');
      console.log('🔐 Shoonya: Using credentials:', { userId, apiKey, vendorCode, imei, hasPassword: !!password });
      
      // Create appkey as SHA256 of uid|api_key
      const appkeyData = `${userId}|${apiKey}`;
      const appkey = await this.sha256(appkeyData);
      
      const jData = {
        apkversion: '1.0.0',
        uid: userId,
        pwd: password,
        factor2: '', // OTP or TOTP if required
        imei: imei,
        source: 'API',
        vc: vendorCode,
        appkey: appkey
      };

      console.log('🔐 Shoonya: Login payload:', { ...jData, pwd: '***' });

      const response = await fetch(`${this.baseUrl}/QuickAuth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: new URLSearchParams({
          jData: JSON.stringify(jData)
        })
      });

      console.log('Shoonya login response status:', response.status);

      if (response.ok) {
        let responseText;
        try {
          responseText = await response.text();
          console.log('Shoonya login response text:', responseText);
        } catch (textError) {
          console.error('Failed to read Shoonya login response:', textError);
          throw new Error('Invalid response from Shoonya API');
        }
        
        // Shoonya returns a simple string token on success
        if (responseText && responseText.length > 10 && !responseText.includes('error')) {
          this.accessToken = responseText;
          this.tokenExpiry = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
          this.userCredentials = { userId, password, apiKey, vendorCode, imei };
          this.loggedIn = true;
          
          // Store credentials in localStorage
          localStorage.setItem('shoonya_credentials', JSON.stringify({
            userId, password, apiKey, vendorCode, imei
          }));
          
          return {
            success: true,
            message: 'Successfully logged into Shoonya',
            token: this.accessToken,
            userData: { userId, vendorCode }
          };
        } else {
          // Try to parse as JSON for error messages
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || errorData.error || 'Login failed');
          } catch (jsonError) {
            throw new Error(responseText || 'Login failed');
          }
        }
      } else {
        let errorMessage = `Login failed: ${response.status}`;
        try {
          const responseText = await response.text();
          console.log('Shoonya error response:', responseText);
          
          // Try to parse error response
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (jsonError) {
            errorMessage = responseText || errorMessage;
          }
        } catch (textError) {
          console.error('Failed to read Shoonya error response:', textError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Shoonya login error:', error);
      throw new Error(`Shoonya login failed: ${error.message}`);
    }
  }



  // Get live price for a symbol
  async getLivePrice(symbol) {
    if (!this.isLoggedIn()) {
      throw new Error('Not logged into Shoonya');
    }

    try {
      console.log(`📈 Shoonya: Fetching price for ${symbol}`);
      
      const cleanSymbol = symbol.replace('NSE:', '').replace('BSE:', '');
      const exchange = symbol.startsWith('NSE:') ? 'NSE' : 'BSE';
      
      const payload = {
        uid: this.userCredentials.userId,
        exch: exchange,
        token: cleanSymbol
      };

      const response = await fetch(`${this.baseUrl}/GetQuotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: new URLSearchParams(payload)
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log('Shoonya quote response:', responseText);
        
        try {
          const data = JSON.parse(responseText);
          
          if (data && data.length > 0) {
            const quote = data[0]; // Shoonya returns array of quotes
            return {
              symbol: symbol,
              lastPrice: quote.ltp || quote.lastPrice || '0',
              previousClose: quote.previousClose || quote.prevClose || '0',
              change: quote.change || quote.netChange || '0',
              changePercent: quote.changePercent || quote.pChange || '0',
              volume: quote.volume || quote.totalTradedVolume || 0,
              timestamp: new Date().getTime(),
              source: 'Shoonya API',
              exchange: exchange,
              currency: 'INR'
            };
          }
        } catch (jsonError) {
          console.error('Failed to parse Shoonya quote response:', jsonError);
          throw new Error('Invalid quote response from Shoonya');
        }
      }
      
      throw new Error('Failed to fetch quote from Shoonya');
    } catch (error) {
      console.error('Shoonya getLivePrice error:', error);
      throw new Error(`Shoonya API error: ${error.message}`);
    }
  }

  // Get user profile/holdings
  async getHoldings() {
    if (!this.isLoggedIn) {
      throw new Error('Not logged into Shoonya');
    }

    try {
      const response = await fetch(`${this.baseUrl}/holdings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      
      throw new Error('Failed to fetch holdings from Shoonya');
    } catch (error) {
      console.error('Shoonya getHoldings error:', error);
      throw new Error(`Shoonya holdings error: ${error.message}`);
    }
  }

  // Place order
  async placeOrder(orderData) {
    if (!this.isLoggedIn) {
      throw new Error('Not logged into Shoonya');
    }

    try {
      const response = await fetch(`${this.baseUrl}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      throw new Error('Failed to place order with Shoonya');
    } catch (error) {
      console.error('Shoonya placeOrder error:', error);
      throw new Error(`Shoonya order error: ${error.message}`);
    }
  }

  // Logout
  logout() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.userCredentials = null;
    this.loggedIn = false;
    localStorage.removeItem('shoonya_credentials');
  }

  // Check if logged in
  isLoggedIn() {
    return this.loggedIn && this.accessToken && this.tokenExpiry > new Date();
  }

  // Load saved credentials
  loadSavedCredentials() {
    try {
      const saved = localStorage.getItem('shoonya_credentials');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading saved Shoonya credentials:', error);
    }
    return null;
  }

  // Test connection
  async testConnection() {
    try {
      if (!this.isLoggedIn()) {
        return {
          success: false,
          message: 'Not logged into Shoonya'
        };
      }

      const testSymbol = 'NSE:RELIANCE';
      const result = await this.getLivePrice(testSymbol);
      
      return {
        success: true,
        message: 'Shoonya API connection is working',
        testData: result
      };
    } catch (error) {
      return {
        success: false,
        message: `Shoonya API test failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

// Create and export singleton instance
const shoonyaApiService = new ShoonyaApiService();
export default shoonyaApiService; 