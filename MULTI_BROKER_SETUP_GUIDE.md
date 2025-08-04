# Multi-Broker Setup Guide

## Overview

The ETF Trading App now supports multiple broker APIs for real-time market data and trading. Currently supported brokers:

- **MStocks** - MStocks Trading API
- **Shoonya** - Shoonya Fintech API

## Features

✅ **Multi-Broker Selection** - Choose your preferred broker from dropdown  
✅ **Unified Interface** - Single login component for all brokers  
✅ **Persistent Credentials** - Save and auto-load your credentials  
✅ **Demo Mode** - Test the interface without real API calls  
✅ **Real-time CMP** - Fetch live market prices from connected broker  
✅ **Error Handling** - Comprehensive error messages and debugging  

## Broker Comparison

| Feature | MStocks | Shoonya |
|---------|---------|---------|
| **Authentication** | 2-step (Login + OTP) | Single-step |
| **API Key Required** | ✅ | ✅ |
| **OTP Required** | ✅ (3-digit) | ❌ |
| **Vendor Code** | ❌ | ✅ |
| **API Secret** | ❌ | ✅ |
| **Real-time Quotes** | ✅ | ✅ |
| **Holdings** | ✅ | ✅ |
| **Order Placement** | ✅ | ✅ |

## Setup Instructions

### Step 1: Access Broker Connection

1. Navigate to **Profile** page
2. Click on **Broker Connection** tab
3. You'll see the multi-broker login interface

### Step 2: Select Your Broker

1. Use the **"Select Broker"** dropdown
2. Choose between:
   - **MStocks - MStocks Trading API**
   - **Shoonya - Shoonya Fintech API**

### Step 3: Configure Credentials

#### For MStocks:

1. **Username** - Your MStocks trading account username
2. **Password** - Your MStocks trading account password  
3. **API Key** - Your MStocks API key
4. **Request Token (OTP)** - 3-digit OTP sent to your mobile

#### For Shoonya:

1. **User ID** - Your Shoonya user ID
2. **Password** - Your Shoonya account password
3. **API Key** - Your Shoonya API key
4. **Vendor Code** - Your Shoonya vendor code
5. **IMEI** - Your Shoonya IMEI (required for authentication)

### Step 4: Connect

1. **For MStocks**: Click "Continue to Step 2" → Enter OTP → Click "Connect"
2. **For Shoonya**: Click "Connect to Shoonya"

### Step 5: Test Connection

1. Click **"Test Connection"** button
2. Verify that real-time CMP data is fetched successfully
3. Check the test results for confirmation

## Demo Mode

For testing purposes, you can enable **Demo Mode**:

1. Toggle the **"Demo Mode"** switch to **ON**
2. Enter any dummy credentials
3. The system will simulate successful connections
4. No real API calls will be made

## Credential Management

### Auto-Save
- Credentials are automatically saved to browser localStorage
- They persist across browser sessions
- No need to re-enter credentials each time

### Security
- Passwords and API secrets are stored locally only
- No credentials are sent to our servers
- Use Demo Mode for testing to avoid exposing real credentials

## Troubleshooting

### Common Issues

#### "Login failed" (MStocks)
- Verify username and password are correct
- Ensure API key is valid
- Check if OTP is entered correctly (3 digits)

#### "Login failed" (Shoonya)
- Verify all 5 credentials are correct
- Check API key and vendor code format
- Ensure IMEI is properly entered

#### "Network error"
- Check your internet connection
- Try enabling Demo Mode for testing
- Verify broker API endpoints are accessible

#### "Session expired"
- Re-authenticate with your broker
- Check if your API credentials are still valid
- Some brokers require periodic re-authentication

### Debug Information

The system provides detailed console logs:

1. Open **Browser Developer Tools** (F12)
2. Go to **Console** tab
3. Look for logs starting with:
   - `🔐 Shoonya: Attempting login...`
   - `📈 Shoonya: Fetching price for...`
   - `🔍 Trying Yahoo Finance for:...`

## API Endpoints

### MStocks API
- **Base URL**: `https://api.mstock.trade/openapi/typea`
- **Login**: `/connect/login`
- **Session**: `/connect/session`
- **Quotes**: `/quotes`

### Shoonya API
- **Base URL**: `https://api.shoonya.com`
- **Login**: `/login`
- **Quotes**: `/quotes`
- **Holdings**: `/holdings`

## Benefits

### For Users
- **Choice** - Select your preferred broker
- **Flexibility** - Switch between brokers easily
- **Reliability** - Multiple data sources for CMP
- **Security** - Local credential storage

### For Development
- **Modular** - Easy to add new brokers
- **Consistent** - Unified interface across brokers
- **Maintainable** - Clean separation of concerns
- **Extensible** - Simple to extend functionality

## Future Enhancements

Planned features for upcoming releases:

- [ ] **More Brokers** - Zerodha, Upstox, Angel One
- [ ] **Auto-Switch** - Automatic fallback between brokers
- [ ] **Advanced Trading** - Order placement, portfolio sync
- [ ] **Notifications** - Real-time alerts and updates
- [ ] **Analytics** - Trading performance tracking

## Support

If you encounter issues:

1. **Check Console Logs** - Look for error messages
2. **Enable Demo Mode** - Test interface functionality
3. **Verify Credentials** - Double-check all API details
4. **Contact Support** - Provide detailed error information

## Security Notes

- Never share your API credentials
- Use Demo Mode for testing
- Regularly rotate your API keys
- Monitor your broker account for unauthorized activity
- Keep your trading app updated

---

**Note**: This guide is based on the current implementation. API endpoints and authentication methods may change based on broker updates. Always refer to the official broker documentation for the most current information. 