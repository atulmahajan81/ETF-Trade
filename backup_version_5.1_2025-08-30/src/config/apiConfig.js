// API Configuration - Easy to modify for different environments
// This file controls all API endpoints and proxy settings

const IS_BROWSER = typeof window !== 'undefined';
const IS_LOCAL_DEV = IS_BROWSER && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const IS_PRODUCTION = IS_BROWSER && window.location.hostname.includes('vercel.app');

// Detect if we're running on the Express server (port 3000) or React dev server (port 3000)
const IS_EXPRESS_SERVER = IS_BROWSER && window.location.port === '3000';
const IS_REACT_DEV_SERVER = IS_BROWSER && window.location.port === '3000' && !IS_EXPRESS_SERVER;

// ============================================================================
// PROXY CONFIGURATION - EASILY MODIFIABLE
// ============================================================================

// Load configuration from localStorage or use defaults
const getStoredConfig = () => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('proxyConfig');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load proxy config from localStorage:', error);
    }
  }
  
  // Default configuration - prefer Vercel proxy for reliability
  return {
    USE_LOCAL_PROXY: false,
    USE_VERCEL_PROXY: true,
    USE_DIRECT_API: false
  };
};

const storedConfig = getStoredConfig();

// Option 1: Use local proxy (requires local server)
const USE_LOCAL_PROXY = storedConfig.USE_LOCAL_PROXY;

// Option 2: Use Vercel proxy (works without local server)
const USE_VERCEL_PROXY = storedConfig.USE_VERCEL_PROXY;

// Option 3: Direct API calls (may have CORS issues)
const USE_DIRECT_API = storedConfig.USE_DIRECT_API;

// ============================================================================
// PROXY URLS - CONFIGURE AS NEEDED
// ============================================================================

const PROXY_URLS = {
  // Local development proxy (when running local server)
  LOCAL: {
    TYPEA: 'http://localhost:3000/api/mstocks-typea-proxy',
    TYPEB: 'http://localhost:3000/api/mstocks-typeb-proxy'
  },
  
  // Vercel deployment proxy
  VERCEL: {
    TYPEA: 'https://etf-trading-app.vercel.app/api/mstocks-typea-proxy',
    TYPEB: 'https://etf-trading-app.vercel.app/api/mstocks-typeb-proxy'
  },
  
  // Direct API endpoints (no proxy)
  DIRECT: {
    TYPEA: 'https://api.mstock.trade/openapi/typea',
    TYPEB: 'https://api.mstock.trade/openapi/typeb'
  }
};

// ============================================================================
// AUTOMATIC CONFIGURATION
// ============================================================================

let MSTOCKS_API_BASE_URL;
let MSTOCKS_TYPEB_API_BASE_URL;
let ORDERS_BASE_URL;

if (USE_DIRECT_API) {
  // Direct API calls (may have CORS issues)
  MSTOCKS_API_BASE_URL = PROXY_URLS.DIRECT.TYPEA;
  MSTOCKS_TYPEB_API_BASE_URL = PROXY_URLS.DIRECT.TYPEB;
  ORDERS_BASE_URL = PROXY_URLS.DIRECT.TYPEA;
} else if (USE_LOCAL_PROXY && IS_LOCAL_DEV) {
  // Local proxy for development
  MSTOCKS_API_BASE_URL = PROXY_URLS.LOCAL.TYPEA;
  MSTOCKS_TYPEB_API_BASE_URL = PROXY_URLS.LOCAL.TYPEB;
  ORDERS_BASE_URL = PROXY_URLS.DIRECT.TYPEA; // Orders still go direct
} else {
  // Vercel proxy for production or fallback
  MSTOCKS_API_BASE_URL = PROXY_URLS.VERCEL.TYPEA;
  MSTOCKS_TYPEB_API_BASE_URL = PROXY_URLS.VERCEL.TYPEB;
  ORDERS_BASE_URL = PROXY_URLS.DIRECT.TYPEA; // Orders still go direct
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to build proxy URLs
const buildProxyUrl = (baseUrl, endpoint) => {
  if (baseUrl.includes('proxy')) {
    // Proxy call - pass the endpoint as a query parameter
    const encodedPath = encodeURIComponent(endpoint);
    return `${baseUrl}?path=${encodedPath}`;
  } else {
    // Direct API call (for server-side or direct API mode)
    return `${baseUrl}/${endpoint}`;
  }
};

// Function to get current configuration info
const getConfigInfo = () => ({
  IS_LOCAL_DEV,
  IS_PRODUCTION,
  IS_EXPRESS_SERVER,
  IS_REACT_DEV_SERVER,
  USE_LOCAL_PROXY,
  USE_VERCEL_PROXY,
  USE_DIRECT_API,
  MSTOCKS_API_BASE_URL,
  MSTOCKS_TYPEB_API_BASE_URL,
  ORDERS_BASE_URL
});

// Function to update proxy configuration
const updateProxyConfig = (config) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('proxyConfig', JSON.stringify(config));
      console.log('🔄 Proxy configuration updated:', config);
      // Reload the page to apply new configuration
      window.location.reload();
    } catch (error) {
      console.error('Failed to update proxy config:', error);
    }
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MSTOCKS_API_BASE_URL,
  MSTOCKS_TYPEB_API_BASE_URL,
  ORDERS_BASE_URL,
  buildProxyUrl,
  getConfigInfo,
  updateProxyConfig,
  PROXY_URLS,
  IS_LOCAL_DEV,
  IS_PRODUCTION,
  IS_EXPRESS_SERVER,
  IS_REACT_DEV_SERVER
};

// Log configuration on load
if (IS_BROWSER) {
  console.log('🔧 API Configuration Loaded:', getConfigInfo());
}
