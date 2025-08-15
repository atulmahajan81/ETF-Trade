# MStocks API Setup Guide

## Overview
This guide will help you connect your MStocks broker account to the ETF Trading application for real-time CMP (Current Market Price) data fetching.

## Prerequisites
- Active MStocks trading account
- MStocks username and password
- API access enabled on your MStocks account

## Step-by-Step Setup

### 1. Access MStocks API Management
1. Log in to your MStocks account at [https://mstock.trade](https://mstock.trade)
2. Navigate to **Settings** → **API Management**
3. Ensure API access is enabled for your account

### 2. Generate API Credentials
1. **API Key**: Generate a new API key from the MStocks dashboard
2. **Request Token**: Generate a request token for API authentication
3. **Note down** both credentials securely

### 3. Configure ETF Trading App
1. Open the ETF Trading application
2. Navigate to **Profile** → **Broker Connection** tab
3. Enter your MStocks credentials:
   - **Username**: Your MStocks login username
   - **Password**: Your MStocks login password
   - **API Key**: The API key generated in step 2
   - **Request Token**: The request token generated in step 2

### 4. OTP Authentication
1. Click **"Connect to MStocks"** button
2. **Enter OTP**: You will receive an OTP on your registered mobile number
3. **Verify OTP**: Enter the 6-digit OTP in the authentication interface
4. **Resend if needed**: Use "Resend OTP" if you don't receive the code
5. Wait for OTP verification to complete

### 5. Test Connection
1. After successful OTP verification, click **"Test Connection"**
2. Verify real-time data fetching works
3. Check the test results for successful connection

### 6. Verify Real-time CMP Data
1. Go to **ETF Ranking** page
2. Click **"Update ETFs with Live Prices"**
3. Verify that CMP values match your trading terminal
4. Check the data source shows "MStocks API"

## Troubleshooting

### Connection Issues
- **Invalid Credentials**: Double-check username, password, API key, and request token
- **API Access Disabled**: Ensure API access is enabled in your MStocks account
- **Network Issues**: Check your internet connection and firewall settings
- **OTP Issues**: Ensure your mobile number is registered and active for OTP delivery

### Data Mismatch
- **CMP Differences**: Real-time data may have slight delays compared to trading terminal
- **Symbol Format**: Ensure ETF symbols match MStocks format (e.g., "NSE:CPSEETF")
- **Market Hours**: Data may not be available outside market hours

### Demo Mode
- The application includes a demo mode for testing
- Demo mode provides simulated data when real API is not available
- To use real data, ensure `DEMO_MODE = false` in the configuration

## Security Notes
- Never share your API credentials
- Use secure connections only
- Regularly rotate your API keys
- Monitor your API usage
- **OTP Security**: OTP is sent to your registered mobile number for each session
- **Session Management**: Each login requires fresh OTP authentication
- **Mobile Number**: Ensure your mobile number is correctly registered with MStocks

## API Endpoints Used
- **Login**: `/connect/login`
- **Session Generation**: `/connect/session`
- **OTP Verification**: `/connect/otp`
- **OTP Resend**: `/connect/resend-otp`
- **Market Quotes**: `/market/quotes`
- **Account Details**: `/account/details`

## Support
For MStocks API issues:
- Contact MStocks support at support@mstock.trade
- Check MStocks API documentation
- Verify your account has API access enabled

## Benefits of MStocks Integration
- ✅ Real-time CMP data
- ✅ Accurate market prices
- ✅ Live trading capabilities
- ✅ Portfolio synchronization
- ✅ Order placement and management

## Next Steps
After successful connection:
1. Test real-time price fetching
2. Verify portfolio data synchronization
3. Test order placement (if enabled)
4. Monitor connection stability
5. Set up automated trading strategies

---

**Note**: This integration provides the most accurate and reliable CMP data for your ETF trading decisions. 