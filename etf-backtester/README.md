# ETF Backtester

A serverless ETF backtesting system built with Cloudflare Workers and Durable Objects. This system implements a sophisticated LIFO (Last In First Out) trading strategy based on percentage difference from 20-day moving average (DMA20) with configurable money management and position sizing.

## 🚀 Features

### Core Strategy
- **LIFO Tax-Lot Selling**: Last In First Out selling for optimal tax efficiency
- **DMA20 Ranking**: ETFs ranked by percentage difference from 20-day moving average
- **Sector Diversification**: Maximum 3 ETFs per sector to avoid over-concentration
- **Daily Trading Limits**: At most one BUY and one SELL per day globally
- **Averaging Down**: Systematic averaging when ETFs fall below threshold

### Money Management
- **Fixed Chunk Progression**: Base chunk with 1.06^n step-ups on equity highs
- **Fixed Fractional**: Allocate fixed percentage of equity per trade
- **Kelly Criterion**: Dynamic position sizing based on win rate and profit/loss ratios

### Technical Features
- **Real-time Backtesting**: Step-by-step execution with live progress tracking
- **Comprehensive Metrics**: Total return, drawdown, Sharpe ratio, win rate, and more
- **Data Export**: CSV exports for trades, equity curve, and holdings
- **RESTful API**: Full HTTP API for programmatic access
- **React Dashboard**: Modern web interface for backtesting management

## 📁 Project Structure

```
etf-backtester/
├── packages/
│   ├── worker/           # Cloudflare Worker (API routes)
│   ├── do/              # Durable Object (BacktestController)
│   └── ui/              # React dashboard
├── common/              # Shared TypeScript modules
│   ├── types.ts         # Type definitions
│   ├── indicators.ts    # Technical indicators (SMA20, % diff)
│   ├── strategy.ts      # Trading strategy logic
│   ├── money.ts         # Money management systems
│   ├── lots.ts          # LIFO lot management
│   └── __tests__/       # Unit tests
├── wrangler.toml        # Cloudflare Workers configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Setup

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd etf-backtester
npm install
```

2. **Install Wrangler CLI**:
```bash
npm install -g wrangler
```

3. **Authenticate with Cloudflare**:
```bash
wrangler login
```

4. **Configure environment**:
```bash
# Copy and edit configuration
cp wrangler.toml.example wrangler.toml
```

5. **Deploy to Cloudflare**:
```bash
npm run deploy
```

## 📊 Usage

### API Endpoints

#### Create Backtest
```bash
POST /backtests
Content-Type: application/json

{
  "params": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "initialCapital": 1000000,
    "profitTarget": 6,
    "averagingThreshold": 2.5,
    "maxETFsPerSector": 3,
    "topK": 5,
    "executionPrice": "close",
    "capitalMode": "chunk_global_pool",
    "compoundingMode": "fixed_chunk_progression",
    "chunkConfig": {
      "numberOfChunks": 50,
      "baseChunkSize": 20000,
      "progressionFactor": 1.06
    }
  },
  "dataSource": "http",
  "dataUrl": "https://example.com/etf-data.csv"
}
```

#### Step Backtest
```bash
POST /backtests/{id}/step
Content-Type: application/json

{
  "days": 1
}
```

#### Get Status
```bash
GET /backtests/{id}/status
```

#### Export Results
```bash
GET /backtests/{id}/artifacts/trades.csv
GET /backtests/{id}/artifacts/equity.csv
GET /backtests/{id}/artifacts/holdings.csv
GET /backtests/{id}/artifacts/metrics.json
```

### Web Dashboard

1. **Start the UI**:
```bash
cd packages/ui
npm install
npm start
```

2. **Access the dashboard** at `http://localhost:3000`

3. **Create a new backtest** with your parameters

4. **Monitor progress** in real-time

5. **Download results** as CSV files

## 📈 Strategy Details

### Buying Rules

1. **New ETF at Top Rank**: Buy highest-ranked ETF not currently held
2. **Diversification**: If rank 1 is held, buy lowest-ranked not-held ETF from top K
3. **Averaging Down**: If all top K are held, average down ETF fallen > threshold
4. **Sector Limits**: Maximum 3 ETFs per sector
5. **Daily Limits**: Maximum 1 BUY per day

### Selling Rules

1. **Profit Target**: Sell when profit >= target percentage (default 6%)
2. **LIFO Method**: Sell most recently purchased lot first
3. **Absolute Profit Priority**: Among eligible lots, sell highest absolute profit
4. **Daily Limits**: Maximum 1 SELL per day

### Money Management

#### Fixed Chunk Progression
- Base chunk size: ₹20,000
- Progression factor: 1.06 (6% increase per level)
- Levels increase on new equity highs
- Levels decrease on drawdown threshold

#### Fixed Fractional
- Allocate fixed percentage of equity per trade
- Default: 2% of equity
- Maximum trade cap: ₹50,000

#### Kelly Criterion
- Dynamic position sizing based on historical performance
- Formula: K = W - (1-W)/R
- Where W = win rate, R = avgWin/avgLoss
- Uses half-Kelly for safety

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Test Coverage
- Indicators calculation (SMA20, percentage differences)
- LIFO lot management
- Strategy execution rules
- Money management systems
- Date utilities and validation

### Test Examples
```bash
# Run specific test suite
npm test -- --testNamePattern="LIFOLotManager"

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## 📊 Data Format

### Input Data (CSV)
```csv
date,symbol,open,high,low,close,volume,sector
2024-01-01,NSE:GOLDBEES,100.50,102.30,99.80,101.20,150000,Gold
2024-01-01,NSE:SILVERBEES,75.25,76.80,74.50,75.90,200000,Silver
```

### Output Data

#### Trades CSV
```csv
id,date,symbol,action,quantity,price,amount,reason,sector
trade_001,2024-01-01,NSE:GOLDBEES,BUY,100,101.20,10120,New symbol in top K,Gold
```

#### Equity CSV
```csv
date,equity,cash
2024-01-01,1000000,1000000
2024-01-02,1005000,998880
```

#### Holdings CSV
```csv
date,positions
2024-01-01,"[{""symbol"":""NSE:GOLDBEES"",""quantity"":100,""avgPrice"":101.20}]"
```

## 🔧 Configuration

### Environment Variables
```bash
# Cloudflare Workers
DEFAULT_CHUNK_SIZE=20000
DEFAULT_NUMBER_OF_CHUNKS=50
MAX_CONCURRENT_BACKTESTS=10

# R2 Bucket (optional)
R2_BUCKET_NAME=etf-data
```

### Wrangler Configuration
```toml
[env.production]
name = "etf-backtester-prod"

[[durable_objects.bindings]]
name = "BACKTEST_DO"
class_name = "BacktestController"

[[r2_buckets.bindings]]
bucket_name = "etf-data"
binding = "R2_BUCKET"
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run deploy:prod
```

### Environment-specific
```bash
npm run deploy:dev    # Development environment
npm run deploy:prod   # Production environment
```

## 📈 Performance

### Benchmarks
- **Backtest Speed**: ~1000 days/second
- **Memory Usage**: <128MB per backtest
- **Concurrent Backtests**: Up to 10 simultaneous
- **Data Processing**: Handles 1000+ ETFs efficiently

### Optimization
- **Durable Objects**: Persistent state with hibernation
- **Batch Processing**: Process multiple days in single step
- **Efficient Algorithms**: O(n) complexity for most operations
- **Memory Management**: Automatic cleanup of completed backtests

## 🔍 Monitoring

### Health Check
```bash
GET /health
```

### Debug Information
```bash
# Check API configuration
curl https://your-worker.workers.dev/ | jq

# Monitor backtest progress
curl https://your-worker.workers.dev/backtests/{id}/status | jq
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive unit tests
- Document all public APIs
- Use semantic versioning
- Maintain backward compatibility

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

### Common Issues

**Q: Backtest fails to start**
A: Check data format and ensure all required parameters are provided

**Q: Performance is slow**
A: Reduce the number of concurrent backtests or optimize data size

**Q: Memory errors**
A: Increase Durable Object memory limits in wrangler.toml

### Getting Help
- Check the [Issues](https://github.com/your-repo/issues) page
- Review the [API Documentation](https://your-worker.workers.dev/)
- Contact the development team

## 🔮 Roadmap

### Version 2.0
- [ ] Real-time data integration
- [ ] Advanced technical indicators
- [ ] Portfolio optimization
- [ ] Risk management tools
- [ ] Multi-timeframe analysis

### Version 3.0
- [ ] Machine learning integration
- [ ] Alternative data sources
- [ ] Advanced backtesting features
- [ ] Performance attribution
- [ ] Risk-adjusted metrics

---

**Built with ❤️ using Cloudflare Workers and Durable Objects**
