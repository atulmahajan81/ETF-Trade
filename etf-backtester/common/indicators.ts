// Technical indicators for ETF backtesting
import { OHLCV, IndicatorData } from './types';

/**
 * Calculate Simple Moving Average (SMA) for a given period
 */
export function calculateSMA(prices: number[], period: number): number[] {
  if (prices.length < period) {
    return new Array(prices.length).fill(NaN);
  }

  const sma: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
      sma.push(sum / period);
    }
  }
  
  return sma;
}

/**
 * Calculate percentage difference from SMA
 */
export function calculatePctDiffFromSMA(close: number, sma: number): number {
  if (isNaN(sma) || sma === 0) {
    return NaN;
  }
  return ((close - sma) / sma) * 100;
}

/**
 * Process OHLCV data to calculate indicators for all symbols
 */
export function calculateIndicators(
  data: OHLCV[],
  smaPeriod: number = 20
): Map<string, IndicatorData[]> {
  const symbolData = new Map<string, OHLCV[]>();
  const indicators = new Map<string, IndicatorData[]>();

  // Group data by symbol
  for (const bar of data) {
    if (!symbolData.has(bar.symbol)) {
      symbolData.set(bar.symbol, []);
    }
    symbolData.get(bar.symbol)!.push(bar);
  }

  // Calculate indicators for each symbol
  for (const [symbol, bars] of symbolData) {
    // Sort by date to ensure proper order
    bars.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const closes = bars.map(bar => bar.close);
    const sma20 = calculateSMA(closes, smaPeriod);
    
    const symbolIndicators: IndicatorData[] = bars.map((bar, index) => ({
      symbol: bar.symbol,
      date: bar.date,
      sma20: sma20[index],
      pct_diff_20: calculatePctDiffFromSMA(bar.close, sma20[index]),
      close: bar.close
    }));

    indicators.set(symbol, symbolIndicators);
  }

  return indicators;
}

/**
 * Get indicators for a specific date across all symbols
 */
export function getIndicatorsForDate(
  indicators: Map<string, IndicatorData[]>,
  date: string
): IndicatorData[] {
  const result: IndicatorData[] = [];

  for (const [symbol, symbolIndicators] of indicators) {
    const dayData = symbolIndicators.find(ind => ind.date === date);
    if (dayData && !isNaN(dayData.sma20) && !isNaN(dayData.pct_diff_20)) {
      result.push(dayData);
    }
  }

  return result;
}

/**
 * Rank symbols by percentage difference from SMA20 (ascending - most fallen first)
 */
export function rankSymbolsByPctDiff(indicators: IndicatorData[]): IndicatorData[] {
  return indicators
    .filter(ind => !isNaN(ind.pct_diff_20))
    .sort((a, b) => a.pct_diff_20 - b.pct_diff_20);
}

/**
 * Get top K symbols by ranking
 */
export function getTopKSymbols(
  indicators: Map<string, IndicatorData[]>,
  date: string,
  topK: number = 5
): IndicatorData[] {
  const dayIndicators = getIndicatorsForDate(indicators, date);
  const ranked = rankSymbolsByPctDiff(dayIndicators);
  return ranked.slice(0, topK);
}

/**
 * Validate indicator data quality
 */
export function validateIndicatorData(indicators: IndicatorData[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const ind of indicators) {
    if (isNaN(ind.sma20)) {
      errors.push(`Invalid SMA20 for ${ind.symbol} on ${ind.date}`);
    }
    if (isNaN(ind.pct_diff_20)) {
      errors.push(`Invalid pct_diff_20 for ${ind.symbol} on ${ind.date}`);
    }
    if (ind.close <= 0) {
      errors.push(`Invalid close price for ${ind.symbol} on ${ind.date}: ${ind.close}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate rolling statistics for Kelly Criterion
 */
export function calculateRollingStats(
  trades: Array<{ profit: number; loss: number }>,
  lookbackPeriod: number = 30
): { winRate: number; avgWin: number; avgLoss: number; kellyFraction: number } {
  if (trades.length === 0) {
    return { winRate: 0, avgWin: 0, avgLoss: 0, kellyFraction: 0 };
  }

  const recentTrades = trades.slice(-lookbackPeriod);
  const winningTrades = recentTrades.filter(t => t.profit > 0);
  const losingTrades = recentTrades.filter(t => t.loss > 0);

  const winRate = winningTrades.length / recentTrades.length;
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length 
    : 0;
  const avgLoss = losingTrades.length > 0 
    ? losingTrades.reduce((sum, t) => sum + t.loss, 0) / losingTrades.length 
    : 0;

  // Kelly Criterion: K = W - (1-W)/R
  // Where W = win rate, R = avgWin/avgLoss
  const kellyFraction = avgLoss > 0 && avgWin > 0 
    ? winRate - (1 - winRate) / (avgWin / avgLoss)
    : 0;

  return {
    winRate,
    avgWin,
    avgLoss,
    kellyFraction: Math.max(0, Math.min(kellyFraction, 0.25)) // Cap at 25%
  };
}

/**
 * Utility function to check if a date is a valid trading day
 */
export function isValidTradingDate(date: string): boolean {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  // Exclude weekends (0 = Sunday, 6 = Saturday)
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

/**
 * Get next trading date
 */
export function getNextTradingDate(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  
  while (!isValidTradingDate(d.toISOString().split('T')[0])) {
    d.setDate(d.getDate() + 1);
  }
  
  return d.toISOString().split('T')[0];
}

/**
 * Get previous trading date
 */
export function getPreviousTradingDate(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  
  while (!isValidTradingDate(d.toISOString().split('T')[0])) {
    d.setDate(d.getDate() - 1);
  }
  
  return d.toISOString().split('T')[0];
}
