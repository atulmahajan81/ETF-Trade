# MStocks Login Troubleshooting Guide

## 🚨 "Failed to fetch" Error - Solutions

### **Problem**: Login fails with "Failed to fetch" error

### **Root Cause**: 
The app was trying to connect to a Python API server on `localhost:5000` which isn't running.

### **✅ Solution Applied**:
The app has been updated to use **direct MStocks API calls** instead of the Python server.

---

## 🔧 **Quick Fixes**

### **1. Use Demo Mode (Recommended for Testing)**
- Toggle "Demo Mode" to ON in the login form
- This bypasses all API calls and lets you test the app
- Perfect for exploring features without real credentials

### **2. Test Network Connectivity**
- Click "Test Connection" button in the login form
- This will check if MStocks API is reachable
- Provides detailed error information

### **3. Check Your Credentials**
- Ensure username and password are correct
- Verify API key is valid
- Check if your MStocks account is active

---

## 🌐 **Network Issues**

### **Common Network Problems**:
1. **Internet Connection**: Check your internet connection
2. **Firewall/Antivirus**: May be blocking API calls
3. **Corporate Network**: Some networks block external APIs
4. **MStocks API Status**: API might be temporarily down

### **Solutions**:
- Try from a different network (mobile hotspot)
- Temporarily disable firewall/antivirus
- Check MStocks website for API status
- Use demo mode as fallback

---

## 🔐 **Login Flow**

### **Updated Login Process**:
1. **Step 1**: Enter username and password
2. **Step 2**: Enter API key and request token (if required)
3. **Direct API**: Calls MStocks API directly from browser
4. **No Python Server**: No need for localhost:5000

### **Benefits**:
- ✅ No server setup required
- ✅ Works immediately
- ✅ Better error handling
- ✅ Network diagnostics included

---

## 🧪 **Testing Steps**

### **1. Test Network Connection**
```
Click "Test Connection" → Check if MStocks API is reachable
```

### **2. Try Demo Mode**
```
Toggle "Demo Mode" → Test app features without real API
```

### **3. Check Browser Console**
```
F12 → Console → Look for detailed error messages
```

### **4. Verify Credentials**
```
- Username: Your MStocks username
- Password: Your MStocks password  
- API Key: Your MStocks API key
```

---

## 📱 **Alternative Solutions**

### **If Direct API Still Fails**:

1. **Use Demo Mode**: Test all features without real data
2. **Try Different Browser**: Chrome, Firefox, Edge
3. **Clear Browser Cache**: Clear cookies and cache
4. **Check MStocks Account**: Ensure account is active
5. **Contact Support**: If issues persist

---

## 🎯 **Success Indicators**

### **When Login Works**:
- ✅ "Successfully connected to MStocks!" message
- ✅ Session status shows "Active"
- ✅ Can fetch live prices
- ✅ Can view holdings and sold items

### **When Using Demo Mode**:
- ✅ "(Demo Mode)" indicator visible
- ✅ All features work with sample data
- ✅ No API calls made
- ✅ Perfect for testing

---

## 📞 **Support**

### **If Problems Persist**:
1. Check browser console for detailed errors
2. Try demo mode to isolate the issue
3. Test network connectivity
4. Verify MStocks credentials
5. Contact MStocks support for API issues

### **App Features Available in Demo Mode**:
- ✅ All trading features
- ✅ Price calculations
- ✅ Portfolio management
- ✅ Strategy testing
- ✅ Data import/export

---

## 🚀 **Next Steps**

1. **Try Demo Mode** first to explore features
2. **Test Network Connection** to diagnose issues
3. **Use Real Credentials** when ready
4. **Enjoy the app!** 🎉

---

**Note**: The app now uses direct MStocks API calls and no longer requires the Python server on localhost:5000.
