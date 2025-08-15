# MStocks API Configuration Guide

## Authentication Method
The application now uses **username/password/OTP** authentication instead of API key authentication.

## Setup Instructions

1. **Open the MStocks API configuration file:**
   ```
   src/services/mstocksApi.js
   ```

2. **Update the credentials at the top of the file:**
   ```javascript
   const MSTOCKS_USERNAME = 'MA24923'; // Your MStocks username
   const MSTOCKS_PASSWORD = 'YOUR_PASSWORD_HERE'; // Add your MStocks password
   const MSTOCKS_OTP = 'YOUR_OTP_HERE'; // Add your MStocks OTP
   ```

3. **Get your OTP:**
   - Log into your MStocks account
   - Go to API settings or generate OTP
   - Copy the OTP and paste it in the configuration

## Important Notes

- **OTP Expiry:** OTPs typically expire after a few minutes, so you may need to regenerate them
- **Session Duration:** Login sessions last for 2 hours
- **Security:** Never commit your password/OTP to version control
- **Demo Mode:** If you can't get the API working, set `DEMO_MODE = true` for testing

## Troubleshooting

### Orders Not Placing
- Check if your credentials are correct
- Verify that your account has sufficient funds
- Ensure the market is open
- Check if the symbol format is correct (remove 'NSE:' prefix)

### CMP (Current Market Price) Issues
- The API tries multiple endpoints to fetch live prices
- If all endpoints fail, it falls back to demo prices
- Check your internet connection
- Verify that the MStocks API is accessible

### API Endpoints
The application tries these endpoints in order:
1. `/api/v1/quote/{symbol}`
2. `/quote/{symbol}`
3. `/api/quote/{symbol}`
4. `/market/quote/{symbol}`

If none work, the app will use simulated data.

## Testing
1. Set `DEMO_MODE = true` to test without real API calls
2. Set `DEMO_MODE = false` to use live API
3. Check the browser console for API error messages 