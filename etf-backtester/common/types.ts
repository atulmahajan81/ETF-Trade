// Core types for ETF backtesting system

export interface OHLCV {
  date: string; // ISO date string
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sector: string;
}

export interface IndicatorData {
  symbol: string;
  date: string;
  sma20: number;
  pct_diff_20: number;
  close: number;
}

export interface Lot {
  id: string;
  symbol: string;
  quantity: number;
  price: number;
  date: string;
  sector: string;
}

export interface Position {
  symbol: string;
  totalQuantity: number;
  totalCost: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  lots: Lot[];
  sector: string;
}

export interface Trade {
  id: string;
  date: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  lotId?: string; // For SELL trades, which lot was sold
  reason: string; // Why this trade was executed
  sector: string;
}

export interface BacktestParams {
  startDate: string;
  endDate: string;
  initialCapital: number;
  profitTarget: number; // Default 6%
  averagingThreshold: number; // Default 2.5%
  maxETFsPerSector: number; // Default 3
  topK: number; // Default 5
  executionPrice: 'open' | 'close'; // Default 'close'
  capitalMode: 'chunk_global_pool' | 'chunk_independent';
  compoundingMode: 'fixed_chunk_progression' | 'fixed_fractional' | 'kelly_fractional';
  chunkConfig?: {
    numberOfChunks: number; // Default 50
    baseChunkSize: number; // Default 20000
    progressionFactor: number; // Default 1.06
  };
  fractionalConfig?: {
    fraction: number; // Default 0.02 (2%)
    maxTradeCap: number; // Default 50000
  };
  kellyConfig?: {
    lookbackPeriod: number; // Default 30 days
    maxFraction: number; // Default 0.05 (5%)
  };
}

export interface BacktestState {
  currentDate: string;
  cash: number;
  equity: number;
  positions: Map<string, Position>;
  sectorCounts: Map<string, number>;
  dailyActions: {
    hasBought: boolean;
    hasSold: boolean;
  };
  trades: Trade[];
  realizedPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  maxDrawdown: number;
  peakEquity: number;
  chunkStates?: ChunkState[];
}

export interface ChunkState {
  id: number;
  capital: number;
  isActive: boolean;
  currentLevel: number;
  lastEquityHigh: number;
}

export interface BacktestMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  totalTrades: number;
  totalDays: number;
}

export interface BacktestStatus {
  id: string;
  status: 'running' | 'completed' | 'error' | 'paused';
  progress: number; // 0-100
  currentDate: string;
  equity: number;
  cash: number;
  totalTrades: number;
  error?: string;
}

export interface BacktestArtifacts {
  trades: Trade[];
  equity: Array<{ date: string; equity: number; cash: number }>;
  holdings: Array<{ date: string; positions: Position[] }>;
  metrics: BacktestMetrics;
}

// API Request/Response types
export interface CreateBacktestRequest {
  params: BacktestParams;
  dataSource?: 'r2' | 'http';
  dataUrl?: string;
}

export interface CreateBacktestResponse {
  id: string;
  status: string;
}

export interface StepBacktestRequest {
  days?: number; // Number of days to step forward
}

export interface StepBacktestResponse {
  status: string;
  currentDate: string;
  equity: number;
  trades: Trade[];
}

export interface GetStatusResponse extends BacktestStatus {}

export interface GetArtifactsResponse {
  trades?: Trade[];
  equity?: Array<{ date: string; equity: number; cash: number }>;
  holdings?: Array<{ date: string; positions: Position[] }>;
  metrics?: BacktestMetrics;
}

// Error types
export interface BacktestError {
  code: string;
  message: string;
  details?: any;
}

// Configuration types
export interface WorkerConfig {
  r2Bucket?: string;
  defaultDataSource: 'r2' | 'http';
  maxConcurrentBacktests: number;
  defaultChunkSize: number;
  defaultNumberOfChunks: number;
}

export interface DurableObjectConfig {
  maxStateSize: number;
  alarmInterval: number;
  hibernationTimeout: number;
}
