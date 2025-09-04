// Money management and position sizing strategies
import { BacktestParams, ChunkState, Trade } from './types';

/**
 * Base money manager interface
 */
export interface MoneyManager {
  calculatePositionSize(
    symbol: string,
    currentPrice: number,
    availableCash: number,
    equity: number,
    params: BacktestParams
  ): number;
  
  updateAfterTrade(
    trade: Trade,
    availableCash: number,
    equity: number
  ): void;
  
  getAvailableCapital(equity: number, params: BacktestParams): number;
}

/**
 * Fixed chunk progression money manager
 * Implements the 1.06^n progression system with drawdown protection
 */
export class FixedChunkProgressionManager implements MoneyManager {
  private chunkStates: ChunkState[];
  private currentChunkIndex: number = 0;
  private lastEquityHigh: number = 0;
  private drawdownThreshold: number = 0.1; // 10% drawdown threshold

  constructor(
    initialCapital: number,
    numberOfChunks: number = 50,
    baseChunkSize: number = 20000,
    progressionFactor: number = 1.06
  ) {
    this.chunkStates = this.initializeChunks(initialCapital, numberOfChunks, baseChunkSize, progressionFactor);
    this.lastEquityHigh = initialCapital;
  }

  private initializeChunks(
    initialCapital: number,
    numberOfChunks: number,
    baseChunkSize: number,
    progressionFactor: number
  ): ChunkState[] {
    const chunks: ChunkState[] = [];
    const chunkSize = initialCapital / numberOfChunks;

    for (let i = 0; i < numberOfChunks; i++) {
      chunks.push({
        id: i,
        capital: chunkSize,
        isActive: false,
        currentLevel: 0,
        lastEquityHigh: initialCapital
      });
    }

    return chunks;
  }

  calculatePositionSize(
    symbol: string,
    currentPrice: number,
    availableCash: number,
    equity: number,
    params: BacktestParams
  ): number {
    // Update equity high and check for drawdown
    this.updateEquityHigh(equity);

    // Find next available chunk
    const chunk = this.getNextAvailableChunk();
    if (!chunk) {
      return 0; // No available chunks
    }

    // Calculate position size based on chunk level
    const baseChunkSize = params.chunkConfig?.baseChunkSize || 20000;
    const progressionFactor = params.chunkConfig?.progressionFactor || 1.06;
    
    let positionSize = baseChunkSize;
    for (let i = 0; i < chunk.currentLevel; i++) {
      positionSize *= progressionFactor;
    }

    // Cap position size
    const maxTradeCap = params.fractionalConfig?.maxTradeCap || 50000;
    positionSize = Math.min(positionSize, maxTradeCap, availableCash);

    return Math.max(0, positionSize);
  }

  updateAfterTrade(trade: Trade, availableCash: number, equity: number): void {
    if (trade.action === 'BUY') {
      // Mark chunk as active
      const chunk = this.chunkStates[this.currentChunkIndex];
      if (chunk) {
        chunk.isActive = true;
        chunk.capital -= trade.amount;
      }
      
      // Move to next chunk
      this.currentChunkIndex = (this.currentChunkIndex + 1) % this.chunkStates.length;
    }
    
    this.updateEquityHigh(equity);
  }

  getAvailableCapital(equity: number, params: BacktestParams): number {
    return this.chunkStates
      .filter(chunk => !chunk.isActive || chunk.capital > 1000)
      .reduce((sum, chunk) => sum + chunk.capital, 0);
  }

  private updateEquityHigh(equity: number): void {
    if (equity > this.lastEquityHigh) {
      this.lastEquityHigh = equity;
      // Increase chunk levels on new equity high
      this.increaseChunkLevels();
    } else {
      // Check for drawdown
      const drawdown = (this.lastEquityHigh - equity) / this.lastEquityHigh;
      if (drawdown >= this.drawdownThreshold) {
        this.decreaseChunkLevels();
      }
    }
  }

  private increaseChunkLevels(): void {
    for (const chunk of this.chunkStates) {
      if (chunk.currentLevel < 10) { // Cap at level 10
        chunk.currentLevel++;
      }
    }
  }

  private decreaseChunkLevels(): void {
    for (const chunk of this.chunkStates) {
      if (chunk.currentLevel > 0) {
        chunk.currentLevel--;
      }
    }
  }

  private getNextAvailableChunk(): ChunkState | null {
    for (let i = 0; i < this.chunkStates.length; i++) {
      const chunk = this.chunkStates[this.currentChunkIndex];
      if (!chunk.isActive || chunk.capital > 1000) {
        return chunk;
      }
      this.currentChunkIndex = (this.currentChunkIndex + 1) % this.chunkStates.length;
    }
    return null;
  }

  getChunkStates(): ChunkState[] {
    return [...this.chunkStates];
  }
}

/**
 * Fixed fractional money manager
 * Allocates a fixed fraction of equity to each trade
 */
export class FixedFractionalManager implements MoneyManager {
  private fraction: number;
  private maxTradeCap: number;

  constructor(fraction: number = 0.02, maxTradeCap: number = 50000) {
    this.fraction = Math.max(0.01, Math.min(0.05, fraction)); // Clamp between 1% and 5%
    this.maxTradeCap = maxTradeCap;
  }

  calculatePositionSize(
    symbol: string,
    currentPrice: number,
    availableCash: number,
    equity: number,
    params: BacktestParams
  ): number {
    const fraction = params.fractionalConfig?.fraction || this.fraction;
    const maxTradeCap = params.fractionalConfig?.maxTradeCap || this.maxTradeCap;
    
    const positionSize = equity * fraction;
    return Math.min(positionSize, maxTradeCap, availableCash);
  }

  updateAfterTrade(trade: Trade, availableCash: number, equity: number): void {
    // No state updates needed for fixed fractional
  }

  getAvailableCapital(equity: number, params: BacktestParams): number {
    return equity; // All equity is available
  }
}

/**
 * Kelly Criterion money manager
 * Uses Kelly formula: K = W - (1-W)/R
 * Where W = win rate, R = avgWin/avgLoss
 */
export class KellyFractionalManager implements MoneyManager {
  private recentTrades: Array<{ profit: number; loss: number }> = [];
  private lookbackPeriod: number = 30;
  private maxFraction: number = 0.05; // 5% max
  private kellyMultiplier: number = 0.5; // Use half-Kelly for safety

  constructor(lookbackPeriod: number = 30, maxFraction: number = 0.05) {
    this.lookbackPeriod = lookbackPeriod;
    this.maxFraction = maxFraction;
  }

  calculatePositionSize(
    symbol: string,
    currentPrice: number,
    availableCash: number,
    equity: number,
    params: BacktestParams
  ): number {
    const kellyConfig = params.kellyConfig;
    const lookbackPeriod = kellyConfig?.lookbackPeriod || this.lookbackPeriod;
    const maxFraction = kellyConfig?.maxFraction || this.maxFraction;

    const kellyFraction = this.calculateKellyFraction(lookbackPeriod);
    const positionSize = equity * kellyFraction;
    
    const maxTradeCap = params.fractionalConfig?.maxTradeCap || 50000;
    return Math.min(positionSize, maxTradeCap, availableCash);
  }

  updateAfterTrade(trade: Trade, availableCash: number, equity: number): void {
    // Record trade for Kelly calculation
    if (trade.action === 'SELL') {
      // This is a simplified approach - in reality, you'd need to track
      // the profit/loss from the specific lot that was sold
      const profit = trade.amount > 0 ? trade.amount : 0;
      const loss = trade.amount < 0 ? Math.abs(trade.amount) : 0;
      
      this.recentTrades.push({ profit, loss });
      
      // Keep only recent trades
      if (this.recentTrades.length > this.lookbackPeriod) {
        this.recentTrades.shift();
      }
    }
  }

  getAvailableCapital(equity: number, params: BacktestParams): number {
    return equity; // All equity is available
  }

  private calculateKellyFraction(lookbackPeriod: number): number {
    if (this.recentTrades.length < 10) {
      return 0.02; // Default 2% if not enough data
    }

    const recentTrades = this.recentTrades.slice(-lookbackPeriod);
    const winningTrades = recentTrades.filter(t => t.profit > 0);
    const losingTrades = recentTrades.filter(t => t.loss > 0);

    if (winningTrades.length === 0 || losingTrades.length === 0) {
      return 0.02; // Default if no wins or losses
    }

    const winRate = winningTrades.length / recentTrades.length;
    const avgWin = winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length;
    const avgLoss = losingTrades.reduce((sum, t) => sum + t.loss, 0) / losingTrades.length;

    if (avgLoss === 0) {
      return 0.02; // Default if no losses
    }

    // Kelly Criterion: K = W - (1-W)/R
    const kellyFraction = winRate - (1 - winRate) / (avgWin / avgLoss);
    
    // Apply safety multiplier and clamp
    const safeKellyFraction = kellyFraction * this.kellyMultiplier;
    return Math.max(0, Math.min(safeKellyFraction, this.maxFraction));
  }

  getRecentTrades(): Array<{ profit: number; loss: number }> {
    return [...this.recentTrades];
  }
}

/**
 * Money manager factory
 */
export function createMoneyManager(
  mode: 'fixed_chunk_progression' | 'fixed_fractional' | 'kelly_fractional',
  params: BacktestParams
): MoneyManager {
  switch (mode) {
    case 'fixed_chunk_progression':
      return new FixedChunkProgressionManager(
        params.initialCapital,
        params.chunkConfig?.numberOfChunks || 50,
        params.chunkConfig?.baseChunkSize || 20000,
        params.chunkConfig?.progressionFactor || 1.06
      );
    
    case 'fixed_fractional':
      return new FixedFractionalManager(
        params.fractionalConfig?.fraction || 0.02,
        params.fractionalConfig?.maxTradeCap || 50000
      );
    
    case 'kelly_fractional':
      return new KellyFractionalManager(
        params.kellyConfig?.lookbackPeriod || 30,
        params.kellyConfig?.maxFraction || 0.05
      );
    
    default:
      throw new Error(`Unknown money management mode: ${mode}`);
  }
}

/**
 * Utility functions for position sizing
 */
export class PositionSizingUtils {
  /**
   * Calculate quantity from position size and price
   */
  static calculateQuantity(positionSize: number, price: number): number {
    if (price <= 0) return 0;
    return Math.floor(positionSize / price);
  }

  /**
   * Calculate actual investment amount from quantity and price
   */
  static calculateInvestment(quantity: number, price: number): number {
    return quantity * price;
  }

  /**
   * Validate position size constraints
   */
  static validatePositionSize(
    positionSize: number,
    availableCash: number,
    maxTradeCap: number,
    minTradeSize: number = 1000
  ): { isValid: boolean; adjustedSize: number; reason?: string } {
    if (positionSize < minTradeSize) {
      return {
        isValid: false,
        adjustedSize: 0,
        reason: `Position size ${positionSize} below minimum ${minTradeSize}`
      };
    }

    if (positionSize > availableCash) {
      return {
        isValid: false,
        adjustedSize: availableCash,
        reason: `Position size ${positionSize} exceeds available cash ${availableCash}`
      };
    }

    if (positionSize > maxTradeCap) {
      return {
        isValid: true,
        adjustedSize: maxTradeCap,
        reason: `Position size capped at ${maxTradeCap}`
      };
    }

    return {
      isValid: true,
      adjustedSize: positionSize
    };
  }

  /**
   * Calculate portfolio metrics
   */
  static calculatePortfolioMetrics(
    positions: Array<{ symbol: string; quantity: number; price: number; cost: number }>,
    currentPrices: Map<string, number>
  ): {
    totalValue: number;
    totalCost: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
  } {
    let totalValue = 0;
    let totalCost = 0;

    for (const position of positions) {
      const currentPrice = currentPrices.get(position.symbol) || position.price;
      totalValue += position.quantity * currentPrice;
      totalCost += position.cost;
    }

    const unrealizedPnL = totalValue - totalCost;
    const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      unrealizedPnL,
      unrealizedPnLPercent
    };
  }
}
