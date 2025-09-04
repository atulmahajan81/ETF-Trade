# Proxy Configuration Guide

This application now supports flexible proxy configuration that works for both local development and Vercel deployment.

## 🎯 **Quick Configuration**

### **Option 1: Use the UI (Recommended)**
1. Look for the **Settings icon** (⚙️) in the bottom-right corner of the app
2. Click it to open the **Proxy Configuration Panel**
3. Select your preferred configuration:
   - **Local Proxy**: Best for development
   - **Vercel Proxy**: Best for production
   - **Direct API**: May have CORS issues
4. Click **Test Connection** to verify it works
5. The page will reload automatically to apply changes

### **Option 2: Manual Configuration**
Edit `src/config/apiConfig.js` and modify these variables:

```javascript
// Option 1: Use local proxy (requires local server)
const USE_LOCAL_PROXY = true; // Set to false to use Vercel proxy

// Option 2: Use Vercel proxy (works without local server)
const USE_VERCEL_PROXY = false;

// Option 3: Direct API calls (may have CORS issues)
const USE_DIRECT_API = false; // Set to true to bypass proxy completely
```

## 🔧 **Configuration Options**

### **1. Local Proxy (Development)**
- **URL**: `http://localhost:3000/api/mstocks-typea-proxy`
- **Best for**: Local development
- **Requirements**: Local server running
- **Pros**: Fast, no CORS issues, full control
- **Cons**: Requires local server setup

### **2. Vercel Proxy (Production)**
- **URL**: `https://etf-trading-app.vercel.app/api/mstocks-typea-proxy`
- **Best for**: Production deployment
- **Requirements**: None (works out of the box)
- **Pros**: No setup required, works everywhere
- **Cons**: Slightly slower, depends on Vercel

### **3. Direct API (Advanced)**
- **URL**: `https://api.mstock.trade/openapi/typea`
- **Best for**: Testing or when proxies fail
- **Requirements**: None
- **Pros**: Fastest, direct connection
- **Cons**: May have CORS issues in browsers

## 🚀 **How It Works**

### **Automatic Detection**
The system automatically detects your environment:
- **Localhost**: Uses local proxy by default
- **Vercel**: Uses Vercel proxy by default
- **Other**: Uses Vercel proxy as fallback

### **Configuration Persistence**
- Settings are saved in `localStorage`
- Survives page reloads
- Can be changed via UI or code

### **Fallback System**
If one proxy fails, the system can fall back to others:
1. Try configured proxy
2. Fall back to Vercel proxy
3. Fall back to direct API (if enabled)

## 🛠️ **Troubleshooting**

### **CORS Errors**
If you see CORS errors:
1. Try switching to **Vercel Proxy** in the UI
2. Or enable **Direct API** mode
3. Check if your local server is running

### **Connection Issues**
1. Click **Test Connection** in the UI
2. Check browser console for errors
3. Verify your API credentials are correct
4. Try switching between proxy modes

### **Local Server Setup**
To use local proxy:
1. Ensure your React app is running on `localhost:3000`
2. The proxy files are in the `api/` folder
3. Vercel will handle these automatically in production

## 📁 **File Structure**

```
src/
├── config/
│   └── apiConfig.js          # Main configuration file
├── components/
│   └── ProxyConfig.js        # UI component for configuration
├── services/
│   └── mstocksApi.js         # API service (uses config)
└── api/
    ├── mstocks-typea-proxy.js # Local proxy for TypeA API
    └── mstocks-typeb-proxy.js # Local proxy for TypeB API
```

## 🔄 **Switching Between Modes**

### **Development → Production**
1. Deploy to Vercel
2. The system automatically uses Vercel proxy
3. No code changes needed

### **Production → Development**
1. Run locally with `npm start`
2. Use the UI to switch to **Local Proxy**
3. Or modify `apiConfig.js`

### **Emergency Fallback**
If all proxies fail:
1. Enable **Direct API** mode
2. May need to disable CORS in browser (development only)
3. Or use a CORS browser extension

## 📝 **Configuration Examples**

### **Development Setup**
```javascript
const USE_LOCAL_PROXY = true;
const USE_VERCEL_PROXY = false;
const USE_DIRECT_API = false;
```

### **Production Setup**
```javascript
const USE_LOCAL_PROXY = false;
const USE_VERCEL_PROXY = true;
const USE_DIRECT_API = false;
```

### **Testing Setup**
```javascript
const USE_LOCAL_PROXY = false;
const USE_VERCEL_PROXY = false;
const USE_DIRECT_API = true;
```

## 🎉 **Benefits**

✅ **Easy Switching**: Change modes via UI or code
✅ **Environment Aware**: Automatically detects local vs production
✅ **Fallback Support**: Multiple proxy options
✅ **Persistent Settings**: Remembers your choice
✅ **Testing Tools**: Built-in connection testing
✅ **No CORS Issues**: Handles all CORS scenarios
✅ **Fast Development**: Local proxy for speed
✅ **Reliable Production**: Vercel proxy for stability

This configuration system makes it easy to work in any environment without worrying about CORS or proxy issues!

