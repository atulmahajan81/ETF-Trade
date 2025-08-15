# MStocks API Setup Guide

## Overview
This application now includes live price fetching from MStocks API. To enable this feature, you need to configure your MStocks API credentials.

## Setup Instructions

### 1. Get MStocks API Credentials
- Sign up for MStocks API access at their official website
- Obtain your API key, client ID, and client secret
- Ensure you have the necessary permissions for market data access

### 2. Configure Environment Variables
Create a `.env` file in the root directory of your project with the following variables:

```env
# MStocks API Configuration
REACT_APP_MSTOCKS_API_BASE_URL=https://api.mstocks.in
REACT_APP_MSTOCKS_API_KEY=your_api_key_here
REACT_APP_MSTOCKS_CLIENT_ID=your_client_id_here
REACT_APP_MSTOCKS_CLIENT_SECRET=your_client_secret_here
```

### 3. Update API Endpoints (if needed)
If MStocks uses different API endpoints, you can customize them:

```env
REACT_APP_MSTOCKS_AUTH_ENDPOINT=/auth/token
REACT_APP_MSTOCKS_QUOTE_ENDPOINT=/market/quote
REACT_APP_MSTOCKS_STATUS_ENDPOINT=/market/status
REACT_APP_MSTOCKS_ORDER_ENDPOINT=/orders/place
```

### 4. Restart the Application
After adding the environment variables, restart your React application:

```bash
npm start
```

## Features Enabled

### Live Price Updates
- Automatic price updates every 30 seconds during market hours
- Manual refresh button on the Holdings page
- Real-time market status indicator

### Smart Selling Logic
- Prioritizes ETFs with highest absolute profit amount
- Daily sell limit of 1 ETF per day
- Visual indicators for recommended selling

### Enhanced Holdings Display
- Sortable by LIFO P&L percentage or absolute profit
- Live price integration with fallback to stored prices
- Market status and last update timestamps

## Troubleshooting

### API Connection Issues
1. Verify your API credentials are correct
2. Check if your MStocks account has the necessary permissions
3. Ensure the API base URL is correct
4. Check browser console for error messages

### Price Update Issues
- If live prices fail to load, the application will fall back to stored prices
- Check the "Last Update" timestamp on the Holdings page
- Use the "Refresh Prices" button to manually update

### Daily Sell Limit
- The application tracks daily selling limits
- Limits reset automatically each day
- You can only sell one ETF per day

## Security Notes
- Never commit your `.env` file to version control
- Keep your API credentials secure
- Consider using environment-specific configurations for production

## Support
If you encounter issues with MStocks API integration:
1. Check MStocks API documentation
2. Verify your account status and permissions
3. Contact MStocks support for API-related issues 