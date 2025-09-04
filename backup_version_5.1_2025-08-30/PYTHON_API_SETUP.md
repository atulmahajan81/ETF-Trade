# Python API Server Setup Guide

This guide will help you set up a Python Flask API server to fetch live prices from MStocks API without CORS restrictions.

## 🚀 Quick Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Python API Server

```bash
python price_api_server.py
```

The server will start on `http://localhost:5000`

### 3. Test the API

```bash
# Test health check
curl http://localhost:5000/api/health

# Test price fetch (after login)
curl http://localhost:5000/api/price/MIDSELIETF
```

## 📁 Files Created

- `price_fetcher.py` - Core MStocks API client
- `price_api_server.py` - Flask API server
- `requirements.txt` - Python dependencies
- `src/services/pythonPriceApi.js` - React service to call Python API

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/login` | POST | Login to MStocks |
| `/api/session` | POST | Generate session |
| `/api/price/<symbol>` | GET | Get live price |
| `/api/prices` | POST | Get multiple prices |
| `/api/logout` | POST | Logout |
| `/api/status` | GET | Get login status |

## 🎯 Usage in React App

### 1. Import the Python API Service

```javascript
import pythonPriceApiService from '../services/pythonPriceApi';
```

### 2. Login to MStocks

```javascript
// Step 1: Login
const loginResult = await pythonPriceApiService.login(username, password);

// Step 2: Generate session
const sessionResult = await pythonPriceApiService.generateSession(apiKey, requestToken, otp);
```

### 3. Get Live Prices

```javascript
// Single price
const price = await pythonPriceApiService.getLivePrice('MIDSELIETF');

// Multiple prices
const prices = await pythonPriceApiService.getLivePrices(['MIDSELIETF', 'NIFTYBEES']);
```

## 🔍 Testing

### Test the Python Script Directly

```bash
python price_fetcher.py
```

This will prompt you for:
1. Username
2. Password  
3. API Key
4. Then test fetching prices for MIDSELIETF, NIFTYBEES, SETFNIF50

### Test the Flask API

```bash
# Start server
python price_api_server.py

# In another terminal, test endpoints
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port 5000 already in use**
   ```bash
   # Kill process using port 5000
   lsof -ti:5000 | xargs kill -9
   ```

2. **Python not found**
   ```bash
   # Use python3 instead
   python3 price_api_server.py
   ```

3. **Dependencies not installed**
   ```bash
   pip install flask flask-cors requests
   ```

4. **CORS issues in React**
   - The Flask server has CORS enabled
   - Make sure you're calling `http://localhost:5000/api/...`

### Debug Mode

The Flask server runs in debug mode by default. Check the console for detailed logs.

## 🔒 Security Notes

- The Python server stores credentials in memory only
- Credentials are cleared on logout
- No persistent storage of sensitive data
- Use HTTPS in production

## 📊 Performance

- No CORS restrictions
- Direct API calls to MStocks
- Faster response times
- Better error handling
- Multiple symbol format support

## 🎯 Next Steps

1. Start the Python server: `python price_api_server.py`
2. Update your React app to use `pythonPriceApiService`
3. Test with your MStocks credentials
4. Enjoy reliable live price fetching! 🚀 