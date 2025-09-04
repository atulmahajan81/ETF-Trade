// Durable Object for ETF backtesting state management and orchestration
import { 
  BacktestParams, 
  BacktestState, 
  BacktestStatus, 
  BacktestMetrics, 
  BacktestArtifacts,
  Trade,
  Position,
  OHLCV,
  IndicatorData
} from '../../common/types';
import { ETFStrategy, StrategyContext } from '../../common/strategy';
import { calculateIndicators, getNextTradingDate, isValidTradingDate } from '../../common/indicators';

export class BacktestController {
  private state: DurableObjectState;
  private env: any;
  private backtestState: BacktestState | null = null;
  private strategy: ETFStrategy | null = null;
  private historicalData: Map<string, OHLCV[]> = new Map();
  private indicators: Map<string, IndicatorData[]> = new Map();
  private backtestParams: BacktestParams | null = null;
  private isRunning: boolean = false;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  /**
   * Initialize backtest with parameters
   */
  async startBacktest(params: BacktestParams, dataSource: 'r2' | 'http' = 'http', dataUrl?: string): Promise<BacktestStatus> {
    try {
      this.backtestParams = params;
      this.isRunning = true;

      // Load historical data
      await this.loadHistoricalData(dataSource, dataUrl);

      // Calculate indicators
      this.calculateIndicators();

      // Initialize backtest state
      this.backtestState = {
        currentDate: params.startDate,
        cash: params.initialCapital,
        equity: params.initialCapital,
        positions: new Map(),
        sectorCounts: new Map(),
        dailyActions: {
          hasBought: false,
          hasSold: false
        },
        trades: [],
        realizedPnL: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        maxDrawdown: 0,
        peakEquity: params.initialCapital
      };

      // Initialize strategy
      this.strategy = new ETFStrategy(params);

      // Persist initial state
      await this.persistState();

      return {
        id: this.state.id.toString(),
        status: 'running',
        progress: 0,
        currentDate: params.startDate,
        equity: params.initialCapital,
        cash: params.initialCapital,
        totalTrades: 0
      };

    } catch (error) {
      this.isRunning = false;
      return {
        id: this.state.id.toString(),
        status: 'error',
        progress: 0,
        currentDate: params.startDate,
        equity: params.initialCapital,
        cash: params.initialCapital,
        totalTrades: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Step forward one or more days
   */
  async stepDay(days: number = 1): Promise<BacktestStatus> {
    if (!this.backtestState || !this.strategy || !this.backtestParams) {
      throw new Error('Backtest not initialized');
    }

    try {
      for (let i = 0; i < days; i++) {
        await this.executeDay();
      }

      await this.persistState();

      return {
        id: this.state.id.toString(),
        status: this.isRunning ? 'running' : 'completed',
        progress: this.calculateProgress(),
        currentDate: this.backtestState.currentDate,
        equity: this.backtestState.equity,
        cash: this.backtestState.cash,
        totalTrades: this.backtestState.totalTrades
      };

    } catch (error) {
      return {
        id: this.state.id.toString(),
        status: 'error',
        progress: this.calculateProgress(),
        currentDate: this.backtestState.currentDate,
        equity: this.backtestState.equity,
        cash: this.backtestState.cash,
        totalTrades: this.backtestState.totalTrades,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute strategy for current day
   */
  private async executeDay(): Promise<void> {
    if (!this.backtestState || !this.strategy || !this.backtestParams) {
      throw new Error('Backtest not initialized');
    }

    const currentDate = this.backtestState.currentDate;

    // Check if we've reached the end date
    if (new Date(currentDate) >= new Date(this.backtestParams.endDate)) {
      this.isRunning = false;
      return;
    }

    // Skip non-trading days
    if (!isValidTradingDate(currentDate)) {
      this.backtestState.currentDate = getNextTradingDate(currentDate);
      return;
    }

    // Reset daily actions
    this.backtestState.dailyActions = {
      hasBought: false,
      hasSold: false
    };

    // Get current prices for all symbols
    const currentPrices = this.getCurrentPrices(currentDate);

    // Create strategy context
    const context: StrategyContext = {
      date: currentDate,
      indicators: this.indicators,
      currentPrices,
      lotManager: this.strategy.getLotManager(),
      moneyManager: this.strategy.getMoneyManager(),
      params: this.backtestParams,
      availableCash: this.backtestState.cash,
      equity: this.backtestState.equity,
      dailyActions: this.backtestState.dailyActions
    };

    // Execute strategy
    const decisions = this.strategy.executeDay(context);

    // Execute trades
    for (const decision of decisions) {
      const trade = this.strategy.executeTrade(decision, context);
      if (trade) {
        this.executeTrade(trade);
      }
    }

    // Update positions
    this.updatePositions(currentPrices);

    // Update equity and metrics
    this.updateEquityAndMetrics();

    // Move to next trading day
    this.backtestState.currentDate = getNextTradingDate(currentDate);
  }

  /**
   * Execute a trade and update state
   */
  private executeTrade(trade: Trade): void {
    if (!this.backtestState) return;

    if (trade.action === 'BUY') {
      this.backtestState.cash -= trade.amount;
      this.backtestState.dailyActions.hasBought = true;
    } else if (trade.action === 'SELL') {
      this.backtestState.cash += trade.amount;
      this.backtestState.dailyActions.hasSold = true;
      
      // Calculate realized P&L (simplified)
      const position = this.backtestState.positions.get(trade.symbol);
      if (position) {
        const costBasis = position.averagePrice * trade.quantity;
        const realizedPnL = trade.amount - costBasis;
        this.backtestState.realizedPnL += realizedPnL;
        
        if (realizedPnL > 0) {
          this.backtestState.winningTrades++;
        } else {
          this.backtestState.losingTrades++;
        }
      }
    }

    this.backtestState.trades.push(trade);
    this.backtestState.totalTrades++;
  }

  /**
   * Update positions with current prices
   */
  private updatePositions(currentPrices: Map<string, number>): void {
    if (!this.backtestState || !this.strategy) return;

    const positions = this.strategy.getPositions(currentPrices);
    this.backtestState.positions.clear();

    for (const position of positions) {
      this.backtestState.positions.set(position.symbol, position);
    }
  }

  /**
   * Update equity and calculate metrics
   */
  private updateEquityAndMetrics(): void {
    if (!this.backtestState) return;

    // Calculate total equity
    let totalPositionValue = 0;
    for (const position of this.backtestState.positions.values()) {
      totalPositionValue += position.currentPrice * position.totalQuantity;
    }

    this.backtestState.equity = this.backtestState.cash + totalPositionValue;

    // Update peak equity and drawdown
    if (this.backtestState.equity > this.backtestState.peakEquity) {
      this.backtestState.peakEquity = this.backtestState.equity;
    }

    const currentDrawdown = (this.backtestState.peakEquity - this.backtestState.equity) / this.backtestState.peakEquity;
    if (currentDrawdown > this.backtestState.maxDrawdown) {
      this.backtestState.maxDrawdown = currentDrawdown;
    }
  }

  /**
   * Get current prices for all symbols
   */
  private getCurrentPrices(date: string): Map<string, number> {
    const prices = new Map<string, number>();

    for (const [symbol, symbolData] of this.historicalData) {
      const dayData = symbolData.find(bar => bar.date === date);
      if (dayData) {
        prices.set(symbol, dayData.close);
      }
    }

    return prices;
  }

  /**
   * Load historical data from R2 or HTTP
   */
  private async loadHistoricalData(dataSource: 'r2' | 'http', dataUrl?: string): Promise<void> {
    if (dataSource === 'r2' && this.env.R2_BUCKET) {
      await this.loadFromR2();
    } else if (dataSource === 'http' && dataUrl) {
      await this.loadFromHttp(dataUrl);
    } else {
      // Load sample data for testing
      await this.loadSampleData();
    }
  }

  /**
   * Load data from R2 bucket
   */
  private async loadFromR2(): Promise<void> {
    try {
      const bucket = this.env.R2_BUCKET;
      const objects = await bucket.list();
      
      for (const object of objects.objects) {
        if (object.key.endsWith('.csv')) {
          const data = await bucket.get(object.key);
          if (data) {
            const csvText = await data.text();
            const parsedData = this.parseCSV(csvText);
            this.historicalData.set(object.key.replace('.csv', ''), parsedData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading from R2:', error);
      throw error;
    }
  }

  /**
   * Load data from HTTP URL
   */
  private async loadFromHttp(dataUrl: string): Promise<void> {
    try {
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const csvText = await response.text();
      const parsedData = this.parseCSV(csvText);
      
      // Assume single file with all symbols
      this.historicalData.set('all_symbols', parsedData);
    } catch (error) {
      console.error('Error loading from HTTP:', error);
      throw error;
    }
  }

  /**
   * Load sample data for testing
   */
  private async loadSampleData(): Promise<void> {
    // Generate sample data for testing
    const symbols = ['NSE:GOLDBEES', 'NSE:SILVERBEES', 'NSE:CPSEETF', 'NSE:PSUBANK', 'NSE:ITBEES'];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    
    for (const symbol of symbols) {
      const data: OHLCV[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        if (isValidTradingDate(currentDate.toISOString().split('T')[0])) {
          const basePrice = 100 + Math.random() * 50; // Random base price
          const open = basePrice + (Math.random() - 0.5) * 2;
          const close = open + (Math.random() - 0.5) * 4;
          const high = Math.max(open, close) + Math.random() * 2;
          const low = Math.min(open, close) - Math.random() * 2;
          
          data.push({
            date: currentDate.toISOString().split('T')[0],
            symbol,
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume: Math.floor(Math.random() * 1000000) + 100000,
            sector: this.getSectorForSymbol(symbol)
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      this.historicalData.set(symbol, data);
    }
  }

  /**
   * Parse CSV data
   */
  private parseCSV(csvText: string): OHLCV[] {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data: OHLCV[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= headers.length) {
        data.push({
          date: values[0],
          symbol: values[1],
          open: parseFloat(values[2]),
          high: parseFloat(values[3]),
          low: parseFloat(values[4]),
          close: parseFloat(values[5]),
          volume: parseInt(values[6]),
          sector: values[7] || 'Other'
        });
      }
    }

    return data;
  }

  /**
   * Calculate indicators for all symbols
   */
  private calculateIndicators(): void {
    const allData: OHLCV[] = [];
    
    for (const symbolData of this.historicalData.values()) {
      allData.push(...symbolData);
    }

    this.indicators = calculateIndicators(allData);
  }

  /**
   * Get sector for symbol
   */
  private getSectorForSymbol(symbol: string): string {
    const sectorMap: Record<string, string> = {
      'NSE:GOLDBEES': 'Gold',
      'NSE:SILVERBEES': 'Silver',
      'NSE:CPSEETF': 'PSU',
      'NSE:PSUBANK': 'Banking',
      'NSE:ITBEES': 'Technology'
    };
    return sectorMap[symbol] || 'Other';
  }

  /**
   * Calculate backtest progress
   */
  private calculateProgress(): number {
    if (!this.backtestState || !this.backtestParams) return 0;
    
    const startDate = new Date(this.backtestParams.startDate);
    const endDate = new Date(this.backtestParams.endDate);
    const currentDate = new Date(this.backtestState.currentDate);
    
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const completedDays = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.min(100, Math.max(0, (completedDays / totalDays) * 100));
  }

  /**
   * Get backtest status
   */
  async getStatus(): Promise<BacktestStatus> {
    if (!this.backtestState) {
      return {
        id: this.state.id.toString(),
        status: 'error',
        progress: 0,
        currentDate: '',
        equity: 0,
        cash: 0,
        totalTrades: 0,
        error: 'Backtest not initialized'
      };
    }

    return {
      id: this.state.id.toString(),
      status: this.isRunning ? 'running' : 'completed',
      progress: this.calculateProgress(),
      currentDate: this.backtestState.currentDate,
      equity: this.backtestState.equity,
      cash: this.backtestState.cash,
      totalTrades: this.backtestState.totalTrades
    };
  }

  /**
   * Export backtest artifacts
   */
  async export(): Promise<BacktestArtifacts> {
    if (!this.backtestState) {
      throw new Error('Backtest not initialized');
    }

    // Calculate metrics
    const metrics = this.calculateMetrics();

    // Prepare equity curve
    const equity = [{
      date: this.backtestParams!.startDate,
      equity: this.backtestParams!.initialCapital,
      cash: this.backtestParams!.initialCapital
    }];

    // Add daily equity points (simplified)
    for (const trade of this.backtestState.trades) {
      equity.push({
        date: trade.date,
        equity: this.backtestState.equity,
        cash: this.backtestState.cash
      });
    }

    // Prepare holdings
    const holdings = [{
      date: this.backtestState.currentDate,
      positions: Array.from(this.backtestState.positions.values())
    }];

    return {
      trades: this.backtestState.trades,
      equity,
      holdings,
      metrics
    };
  }

  /**
   * Calculate backtest metrics
   */
  private calculateMetrics(): BacktestMetrics {
    if (!this.backtestState || !this.backtestParams) {
      throw new Error('Backtest not initialized');
    }

    const totalReturn = this.backtestState.equity - this.backtestParams.initialCapital;
    const totalReturnPercent = (totalReturn / this.backtestParams.initialCapital) * 100;
    
    const startDate = new Date(this.backtestParams.startDate);
    const endDate = new Date(this.backtestState.currentDate);
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const annualizedReturn = Math.pow(1 + totalReturnPercent / 100, 365 / totalDays) - 1;

    const winRate = this.backtestState.totalTrades > 0 
      ? (this.backtestState.winningTrades / this.backtestState.totalTrades) * 100 
      : 0;

    return {
      totalReturn,
      totalReturnPercent,
      annualizedReturn: annualizedReturn * 100,
      maxDrawdown: this.backtestState.maxDrawdown * 100,
      maxDrawdownPercent: this.backtestState.maxDrawdown * 100,
      sharpeRatio: 0, // Would need risk-free rate to calculate
      winRate,
      averageWin: 0, // Would need to calculate from individual trades
      averageLoss: 0, // Would need to calculate from individual trades
      profitFactor: 0, // Would need to calculate from individual trades
      totalTrades: this.backtestState.totalTrades,
      totalDays: Math.floor(totalDays)
    };
  }

  /**
   * Persist state to Durable Object storage
   */
  private async persistState(): Promise<void> {
    if (this.backtestState) {
      await this.state.storage.put('backtestState', this.backtestState);
    }
    if (this.backtestParams) {
      await this.state.storage.put('backtestParams', this.backtestParams);
    }
    await this.state.storage.put('isRunning', this.isRunning);
  }

  /**
   * Restore state from Durable Object storage
   */
  private async restoreState(): Promise<void> {
    this.backtestState = await this.state.storage.get('backtestState');
    this.backtestParams = await this.state.storage.get('backtestParams');
    this.isRunning = await this.state.storage.get('isRunning') || false;
    
    if (this.backtestParams) {
      this.strategy = new ETFStrategy(this.backtestParams);
    }
  }

  /**
   * Handle HTTP requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (request.method) {
        case 'POST':
          if (path.endsWith('/start')) {
            const body = await request.json();
            const status = await this.startBacktest(body.params, body.dataSource, body.dataUrl);
            return new Response(JSON.stringify(status), {
              headers: { 'Content-Type': 'application/json' }
            });
          } else if (path.endsWith('/step')) {
            const body = await request.json();
            const status = await this.stepDay(body.days || 1);
            return new Response(JSON.stringify(status), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          break;

        case 'GET':
          if (path.endsWith('/status')) {
            const status = await this.getStatus();
            return new Response(JSON.stringify(status), {
              headers: { 'Content-Type': 'application/json' }
            });
          } else if (path.endsWith('/export')) {
            const artifacts = await this.export();
            return new Response(JSON.stringify(artifacts), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          break;
      }

      return new Response('Not Found', { status: 404 });

    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
