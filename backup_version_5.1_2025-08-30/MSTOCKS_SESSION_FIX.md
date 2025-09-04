# MStocks Session Generation 404 Error - Fix Guide

## 🚨 **Problem**: Session generation failed: 404

### **Root Cause**: 
The MStocks API endpoint `/session/token` was returning 404, indicating the endpoint doesn't exist or has changed.

## ✅ **Solution Applied**

### **1. Updated API Endpoint**
- **Changed from**: `/session/token` 
- **Changed to**: `/connect/session`
- **Updated in**: `src/services/mstocksApi.js`

### **2. Updated Request Format**
- **Changed from**: `application/x-www-form-urlencoded` with form data
- **Changed to**: `application/json` with JSON payload
- **Format**: 
```json
{
  "api_key": "your_api_key",
  "request_token": "your_request_token",
  "otp": "your_otp" // optional
}
```

### **3. Enhanced Error Handling**
- Added **30-second timeout** for API calls
- Added **network connectivity checks**
- Improved **error messages** with specific troubleshooting info
- Added **fallback mechanisms**

---

## 🔧 **Alternative Solutions**

### **Option 1: Use Demo Mode (Recommended for Testing)**
```javascript
// In src/services/mstocksApi.js
const DEMO_MODE = true; // Set to true for testing
```

### **Option 2: Try Different API Endpoints**
If `/connect/session` still doesn't work, try these alternatives:

1. **Type B API** (already implemented as fallback):
   ```
   https://api.mstock.trade/openapi/typeb/connect/login
   ```

2. **Alternative Type A endpoints**:
   ```
   https://api.mstock.trade/openapi/typea/connect/token
   https://api.mstock.trade/openapi/typea/session/generate
   ```

### **Option 3: Use Browser API Fallback**
The app automatically falls back to browser-based API if direct API fails.

---

## 🧪 **Testing Steps**

### **1. Test Network Connectivity**
```javascript
// Test if MStocks API is reachable
fetch('https://api.mstock.trade/openapi/typea/connect/login', {
  method: 'OPTIONS'
}).then(response => {
  console.log('API reachable:', response.ok);
}).catch(error => {
  console.log('API not reachable:', error);
});
```

### **2. Test Session Endpoint**
```javascript
// Test the session endpoint directly
fetch('https://api.mstock.trade/openapi/typea/connect/session', {
  method: 'POST',
  headers: {
    'X-Mirae-Version': '1',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    api_key: 'test',
    request_token: 'test'
  })
}).then(response => {
  console.log('Session endpoint status:', response.status);
}).catch(error => {
  console.log('Session endpoint error:', error);
});
```

---

## 📋 **Common Issues & Solutions**

### **404 Error Still Occurring**
1. **Check API Documentation**: MStocks may have updated their API endpoints
2. **Contact MStocks Support**: Verify the correct endpoint with their support team
3. **Use Demo Mode**: Set `DEMO_MODE = true` for testing without API calls

### **Network Connectivity Issues**
1. **Check Internet Connection**: Ensure stable internet connection
2. **Firewall/Antivirus**: Check if security software is blocking the connection
3. **Corporate Network**: Some corporate networks block API calls

### **Authentication Issues**
1. **API Key Format**: Ensure API key is in correct format
2. **Request Token**: Verify request token is valid and not expired
3. **OTP**: Ensure OTP is entered correctly and not expired

---

## 🎯 **Quick Fix Commands**

### **Enable Demo Mode**
```bash
# Edit the file and set DEMO_MODE = true
sed -i 's/const DEMO_MODE = false/const DEMO_MODE = true/' src/services/mstocksApi.js
```

### **Test API Connectivity**
```bash
# Test if MStocks API is reachable
curl -X OPTIONS https://api.mstock.trade/openapi/typea/connect/login
```

---

## 📞 **Support**

If the issue persists:
1. **Check MStocks API Status**: Visit MStocks status page
2. **Contact MStocks Support**: support@mstock.trade
3. **Use Demo Mode**: For immediate testing and development
4. **Check API Documentation**: Verify endpoint changes

---

## ✅ **Verification**

After applying the fix:
1. ✅ Session generation should work without 404 errors
2. ✅ Login flow should complete successfully
3. ✅ Real-time data should be available
4. ✅ No more "Failed to fetch" errors

If issues persist, use **Demo Mode** for testing and contact MStocks support for API endpoint verification.
