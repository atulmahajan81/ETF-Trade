# ETF Trading Application

A comprehensive ETF trading application with real-time price fetching, 20-Day Moving Average (DMA) calculations, and multi-broker support.

## 🚀 Features

- **Real-time Price Fetching**: Live prices from MStocks API with session persistence
- **Multi-Broker Support**: Integration with Shoonya and MStocks APIs
- **20-Day Moving Average**: Automated DMA calculations for ETFs
- **Session Management**: 24-hour session persistence for seamless trading
- **React Frontend**: Modern, responsive UI with Tailwind CSS
- **Python Backend**: Flask API server for reliable data processing
- **Auto-refresh**: 5-minute automatic price and DMA updates

## 📋 Prerequisites

- Node.js (v14 or higher)
- Python 3.6+
- Git

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/atulmahajan81/ETF-Trade.git
cd ETF-Trade
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

## 🔧 Configuration

### MStocks API Setup
1. Get your MStocks credentials:
   - Username: Your MStocks username
   - Password: Your MStocks password
   - API Key: Your MStocks API key

2. Update credentials in the application:
   - Frontend: Update in `src/components/SimpleLoginForm.js`
   - Backend: Update in `price_fetcher.py` (optional)

### Shoonya API Setup
1. Get your Shoonya credentials:
   - User ID: Your Shoonya user ID
   - Password: Your Shoonya password
   - API Key: Your Shoonya API key

## 🚀 Running the Application

### 1. Start the Python Backend
```bash
python price_api_server.py
```
The backend will be available at: http://localhost:5000

### 2. Start the React Frontend
```bash
npm start
```
The frontend will be available at: http://localhost:3000

## 📊 API Endpoints

### Backend API (Flask)
- `GET /api/health` - Health check
- `POST /api/login` - MStocks login
- `POST /api/session` - Generate session
- `GET /api/price/<symbol>` - Get live price
- `POST /api/prices` - Get multiple prices
- `GET /api/dma20/<symbol>` - Get DMA20
- `POST /api/dma20/batch` - Get multiple DMA20
- `GET /api/session/status` - Session status
- `POST /api/session/refresh` - Refresh session
- `POST /api/session/clear` - Clear session

## 🔐 Authentication Flow

### MStocks Login Process
1. **Step 1**: Username/Password login
2. **Step 2**: OTP verification (3-digit)
3. **Session Generation**: 24-hour session persistence

### Session Management
- Automatic session validation
- Auto-refresh capability
- Session persistence across restarts

## 📈 Features

### Real-time Price Fetching
- Multiple symbol format support
- Fallback mechanisms
- Error handling and retry logic

### DMA Calculations
- 20-Day Moving Average
- Historical data fetching
- Batch processing support

### User Interface
- Holdings management
- ETF rankings
- Real-time price updates
- Session status monitoring

## 🏗️ Project Structure

```
ETF-Trade/
├── src/                    # React frontend
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── context/          # React context
│   └── ...
├── price_fetcher.py      # MStocks API integration
├── dma_calculator.py     # DMA calculations
├── price_api_server.py   # Flask API server
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies
└── README.md            # This file
```

## 🔧 Development

### Testing
```bash
# Test Python API
python test_python_login.py

# Test React components
npm test
```

### Debugging
- Check Python server logs for API issues
- Monitor browser console for frontend errors
- Use session status endpoints for authentication debugging

## 🚀 Deployment

### Frontend Deployment
- Vercel: `vercel --prod`
- Netlify: `netlify deploy --prod`
- AWS S3 + CloudFront

### Backend Deployment
- Railway: `railway up`
- Heroku: `heroku create && git push heroku main`
- AWS EC2
- Google Cloud Run

## 📝 Environment Variables

### Frontend (.env)
```
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_MSTOCKS_API_URL=https://api.mstock.trade
```

### Backend (.env)
```
FLASK_ENV=development
FLASK_DEBUG=1
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

## 🔄 Updates

### Recent Updates
- ✅ Fixed MStocks API integration
- ✅ Implemented session persistence
- ✅ Added DMA calculations
- ✅ Enhanced error handling
- ✅ Improved UI/UX

### Planned Features
- [ ] Additional broker integrations
- [ ] Advanced charting
- [ ] Portfolio analytics
- [ ] Mobile app
- [ ] WebSocket support

---

**Note**: This application is for educational and personal use. Please ensure compliance with your broker's terms of service and local regulations. 