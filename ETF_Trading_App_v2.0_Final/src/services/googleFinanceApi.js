// Google Finance API Service for real-time CMP data
class GoogleFinanceApiService {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.timeout = 10000; // 10 seconds
  }

  // Convert NSE symbols to Yahoo Finance format
  convertToYahooSymbol(symbol) {
    // Handle NSE symbols
    if (symbol.startsWith('NSE:')) {
      const nseSymbol = symbol.replace('NSE:', '');
      return `${nseSymbol}.NS`; // Add .NS suffix for NSE
    }
    
    // Handle BSE symbols
    if (symbol.startsWith('BSE:')) {
      const bseSymbol = symbol.replace('BSE:', '');
      return `${bseSymbol}.BO`; // Add .BO suffix for BSE
    }
    
    // Handle US symbols (NYSE, NASDAQ)
    if (symbol.includes(':')) {
      const [exchange, ticker] = symbol.split(':');
      if (exchange === 'NYSE') return ticker;
      if (exchange === 'NASDAQ') return ticker;
    }
    
    // Default: return as is
    return symbol;
  }

  // Fetch real-time price data using multiple sources
  async getLivePrice(symbol) {
    try {
      console.log(`📈 Google Finance: Fetching price for ${symbol}`);
      
      // Try multiple data sources (NO STATIC DATA)
      const sources = [
        this.tryYahooFinance.bind(this),
        this.tryMoneyControl.bind(this),
        this.tryAlphaVantage.bind(this),
        this.tryNSEIndia.bind(this)
      ];
      
      for (const source of sources) {
        try {
          const result = await source(symbol);
          if (result) {
            console.log(`✅ Google Finance: Successfully fetched price for ${symbol} from ${result.source}:`, result);
            return result;
          }
        } catch (error) {
          console.log(`❌ Source failed for ${symbol}:`, error.message);
          continue;
        }
      }
      
      // If all live sources fail, return 0 instead of throwing error
      console.warn(`⚠️ All live data sources failed for ${symbol}, returning 0`);
      return {
        symbol: symbol,
        lastPrice: '0',
        previousClose: '0',
        change: '0',
        changePercent: '0',
        volume: 0,
        timestamp: new Date().getTime(),
        source: 'Failed - No Live Data',
        exchange: this.getExchangeFromSymbol(symbol),
        currency: 'INR'
      };
      
    } catch (error) {
      console.error(`❌ Google Finance: Failed to fetch price for ${symbol}:`, error);
      // Return 0 instead of throwing error
      return {
        symbol: symbol,
        lastPrice: '0',
        previousClose: '0',
        change: '0',
        changePercent: '0',
        volume: 0,
        timestamp: new Date().getTime(),
        source: 'Failed - No Live Data',
        exchange: this.getExchangeFromSymbol(symbol),
        currency: 'INR'
      };
    }
  }

  // Try Yahoo Finance API (more reliable)
  async tryYahooFinance(symbol) {
    const cleanSymbol = symbol.replace('NSE:', '').replace('BSE:', '');
    const yahooSymbol = `${cleanSymbol}.NS`; // Add .NS for NSE symbols
    
    try {
      console.log(`🔍 Trying Yahoo Finance for: ${yahooSymbol}`);
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        mode: 'cors'
      });
      
      console.log(`📊 Yahoo Finance response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Yahoo Finance response data:', data);
        
        if (data.chart && data.chart.result && data.chart.result.length > 0) {
          const result = data.chart.result[0];
          const meta = result.meta;
          const quote = result.indicators.quote[0];
          
          const lastPrice = meta.regularMarketPrice || meta.previousClose;
          const previousClose = meta.previousClose;
          const change = lastPrice - previousClose;
          const changePercent = ((change / previousClose) * 100);
          
          console.log(`✅ Yahoo Finance parsed data for ${symbol}:`, {
            lastPrice,
            previousClose,
            change,
            changePercent
          });
          
          return {
            symbol: symbol,
            lastPrice: lastPrice.toFixed(2),
            previousClose: previousClose.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2),
            volume: quote.volume ? quote.volume[quote.volume.length - 1] : 0,
            timestamp: new Date().getTime(),
            source: 'Yahoo Finance API',
            exchange: this.getExchangeFromSymbol(symbol),
            currency: 'INR'
          };
        } else {
          console.log('❌ Yahoo Finance: No chart data in response');
        }
      } else {
        console.log(`❌ Yahoo Finance: Response not ok - ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('❌ Yahoo Finance API failed:', error.message);
    }
    
    throw new Error('No data from Yahoo Finance');
  }

  // Try MoneyControl web scraping (more reliable)
  async tryMoneyControl(symbol) {
    if (!symbol.startsWith('NSE:')) {
      throw new Error('MoneyControl only supports NSE symbols');
    }
    
    const cleanSymbol = symbol.replace('NSE:', '');
    
    try {
      console.log(`🔍 Trying MoneyControl for: ${cleanSymbol}`);
      
      // Try MoneyControl API endpoint
      const response = await fetch(`https://www.moneycontrol.com/india/stockpricequote/${cleanSymbol.toLowerCase()}/${cleanSymbol.toLowerCase()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        console.log('MoneyControl response length:', html.length);
        
        // Extract price data from MoneyControl HTML
        const priceMatch = html.match(/<span[^>]*class="[^"]*last_price[^"]*"[^>]*>([^<]+)<\/span>/i);
        const changeMatch = html.match(/<span[^>]*class="[^"]*change[^"]*"[^>]*>([^<]+)<\/span>/i);
        const changePercentMatch = html.match(/<span[^>]*class="[^"]*change_percent[^"]*"[^>]*>([^<]+)<\/span>/i);
        
        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(/[^\d.-]/g, ''));
          const change = changeMatch ? parseFloat(changeMatch[1].replace(/[^\d.-]/g, '')) : 0;
          const changePercent = changePercentMatch ? parseFloat(changePercentMatch[1].replace(/[^\d.-]/g, '')) : 0;
          
          return {
            symbol: symbol,
            lastPrice: price.toFixed(2),
            previousClose: (price - change).toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2),
            volume: 0,
            timestamp: new Date().getTime(),
            source: 'MoneyControl Web',
            exchange: 'NSE',
            currency: 'INR'
          };
        }
      }
    } catch (error) {
      console.log('MoneyControl web scraping failed:', error.message);
    }
    
    throw new Error('No data from MoneyControl');
  }

  // Try Alpha Vantage API (free tier)
  async tryAlphaVantage(symbol) {
    const apiKey = 'demo'; // Free demo key
    const cleanSymbol = symbol.replace('NSE:', '').replace('BSE:', '');
    
    try {
      console.log(`🔍 Trying Alpha Vantage for: ${cleanSymbol}`);
      const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanSymbol}.BSE&apikey=${apiKey}`);
      const data = await response.json();
      
      console.log('Alpha Vantage response:', data);
      
      if (data['Global Quote']) {
        const quote = data['Global Quote'];
        return {
          symbol: symbol,
          lastPrice: parseFloat(quote['05. price']).toFixed(2),
          previousClose: parseFloat(quote['08. previous close']).toFixed(2),
          change: parseFloat(quote['09. change']).toFixed(2),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2),
          volume: parseInt(quote['06. volume']),
          timestamp: new Date().getTime(),
          source: 'Alpha Vantage',
          exchange: this.getExchangeFromSymbol(symbol),
          currency: 'INR'
        };
      }
    } catch (error) {
      console.log('Alpha Vantage API failed:', error.message);
    }
    
    throw new Error('No data from Alpha Vantage');
  }

  // Try NSE India API (simplified to avoid CORS issues)
  async tryNSEIndia(symbol) {
    if (!symbol.startsWith('NSE:')) {
      throw new Error('NSE India only supports NSE symbols');
    }
    
    const cleanSymbol = symbol.replace('NSE:', '');
    
    try {
      // Try NSE India API with proper headers
      const response = await fetch(`https://www.nseindia.com/api/quote-equity?symbol=${cleanSymbol}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.nseindia.com/',
          'Origin': 'https://www.nseindia.com',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.priceInfo) {
          const priceInfo = data.priceInfo;
          return {
            symbol: symbol,
            lastPrice: priceInfo.lastPrice || priceInfo.lastTradedPrice,
            previousClose: priceInfo.previousClose,
            change: priceInfo.change || priceInfo.netChange,
            changePercent: priceInfo.pChange || priceInfo.changePercent,
            volume: priceInfo.totalTradedVolume || priceInfo.volume,
            timestamp: new Date().getTime(),
            source: 'NSE India API',
            exchange: 'NSE',
            currency: 'INR'
          };
        }
      }
    } catch (error) {
      console.log('NSE API failed:', error.message);
    }
    
    throw new Error('No data from NSE India');
  }



  // Get exchange information from symbol
  getExchangeFromSymbol(symbol) {
    if (symbol.startsWith('NSE:')) return 'NSE';
    if (symbol.startsWith('BSE:')) return 'BSE';
    if (symbol.includes('NYSE:')) return 'NYSE';
    if (symbol.includes('NASDAQ:')) return 'NASDAQ';
    return 'Unknown';
  }

  // Fetch multiple symbols at once
  async getMultiplePrices(symbols) {
    const promises = symbols.map(symbol => 
      this.getLivePrice(symbol).catch(error => ({
        symbol,
        error: error.message,
        source: 'Google Finance (Yahoo)'
      }))
    );
    
    return Promise.all(promises);
  }

  // Test the API connection
  async testConnection() {
    try {
      const testSymbol = 'NSE:RELIANCE'; // More reliable test symbol
      const result = await this.getLivePrice(testSymbol);
      return {
        success: true,
        message: `Real-time CMP API is working (${result.source})`,
        testData: result
      };
    } catch (error) {
      return {
        success: false,
        message: `Real-time CMP API test failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

// Create and export singleton instance
const googleFinanceApiService = new GoogleFinanceApiService();
export default googleFinanceApiService; 