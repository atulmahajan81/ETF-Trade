// ETF trading strategy implementation
import { 
  BacktestParams, 
  IndicatorData, 
  Position, 
  Trade, 
  OHLCV 
} from './types';
import { PortfolioLotManager } from './lots';
import { MoneyManager, createMoneyManager } from './money';
import { getTopKSymbols } from './indicators';

/**
 * Trading decision result
 */
export interface TradingDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  symbol?: string;
  quantity?: number;
  price?: number;
  reason: string;
  lotId?: string; // For SELL actions
}

/**
 * Strategy execution context
 */
export interface StrategyContext {
  date: string;
  indicators: Map<string, IndicatorData[]>;
  currentPrices: Map<string, number>;
  lotManager: PortfolioLotManager;
  moneyManager: MoneyManager;
  params: BacktestParams;
  availableCash: number;
  equity: number;
  dailyActions: {
    hasBought: boolean;
    hasSold: boolean;
  };
}

/**
 * Main strategy executor
 */
export class ETFStrategy {
  private params: BacktestParams;
  private lotManager: PortfolioLotManager;
  private moneyManager: MoneyManager;

  constructor(params: BacktestParams) {
    this.params = params;
    this.lotManager = new PortfolioLotManager();
    this.moneyManager = createMoneyManager(params.compoundingMode, params);
  }

  /**
   * Execute strategy for a single day
   */
  executeDay(context: StrategyContext): TradingDecision[] {
    const decisions: TradingDecision[] = [];

    // SELL phase first (if not already sold today)
    if (!context.dailyActions.hasSold) {
      const sellDecision = this.executeSellPhase(context);
      if (sellDecision.action === 'SELL') {
        decisions.push(sellDecision);
        context.dailyActions.hasSold = true;
      }
    }

    // BUY phase next (if not already bought today)
    if (!context.dailyActions.hasBought) {
      const buyDecision = this.executeBuyPhase(context);
      if (buyDecision.action === 'BUY') {
        decisions.push(buyDecision);
        context.dailyActions.hasBought = true;
      }
    }

    return decisions;
  }

  /**
   * Execute SELL phase
   */
  private executeSellPhase(context: StrategyContext): TradingDecision {
    const eligiblePositions = this.lotManager.getEligiblePositionsForSelling(
      context.currentPrices,
      this.params.profitTarget
    );

    if (eligiblePositions.length === 0) {
      return {
        action: 'HOLD',
        reason: 'No positions eligible for selling (below profit target)'
      };
    }

    // Select position with highest absolute profit
    const bestPosition = eligiblePositions[0];
    const bestLot = bestPosition.eligibleLots[0];

    // Calculate quantity to sell (sell the entire lot)
    const quantity = bestLot.quantity;

    return {
      action: 'SELL',
      symbol: bestPosition.symbol,
      quantity,
      price: context.currentPrices.get(bestPosition.symbol) || 0,
      reason: `Selling ${bestPosition.symbol} - ${bestLot.profitPercent.toFixed(2)}% profit (₹${bestLot.absoluteProfit.toFixed(2)})`,
      lotId: bestLot.lot.id
    };
  }

  /**
   * Execute BUY phase
   */
  private executeBuyPhase(context: StrategyContext): TradingDecision {
    // Get top K symbols for today
    const topKSymbols = getTopKSymbols(
      context.indicators,
      context.date,
      this.params.topK
    );

    if (topKSymbols.length === 0) {
      return {
        action: 'HOLD',
        reason: 'No symbols available for trading today'
      };
    }

    // Rule A: Check for new symbols in top K
    const newSymbolDecision = this.checkNewSymbols(topKSymbols, context);
    if (newSymbolDecision.action === 'BUY') {
      return newSymbolDecision;
    }

    // Rule B: Check for diversification opportunity
    const diversificationDecision = this.checkDiversification(topKSymbols, context);
    if (diversificationDecision.action === 'BUY') {
      return diversificationDecision;
    }

    // Rule C: Check for averaging down
    const averagingDecision = this.checkAveragingDown(context);
    if (averagingDecision.action === 'BUY') {
      return averagingDecision;
    }

    return {
      action: 'HOLD',
      reason: 'No buying opportunities found'
    };
  }

  /**
   * Rule A: Check for new symbols in top K
   */
  private checkNewSymbols(topKSymbols: IndicatorData[], context: StrategyContext): TradingDecision {
    const heldSymbols = this.lotManager.getHeldSymbols();
    
    for (const symbolData of topKSymbols) {
      if (!heldSymbols.includes(symbolData.symbol)) {
        // Check sector capacity
        const sector = this.getSectorForSymbol(symbolData.symbol, context);
        if (this.lotManager.canAddToSector(sector, this.params.maxETFsPerSector)) {
          return this.createBuyDecision(symbolData, context, 'New symbol in top K');
        }
      }
    }

    return { action: 'HOLD', reason: 'No new symbols in top K' };
  }

  /**
   * Rule B: Check for diversification opportunity
   */
  private checkDiversification(topKSymbols: IndicatorData[], context: StrategyContext): TradingDecision {
    const heldSymbols = this.lotManager.getHeldSymbols();
    
    // If rank 1 is already held, look for lowest-ranked not-held symbol
    if (heldSymbols.includes(topKSymbols[0].symbol)) {
      for (let i = topKSymbols.length - 1; i >= 1; i--) {
        const symbolData = topKSymbols[i];
        if (!heldSymbols.includes(symbolData.symbol)) {
          const sector = this.getSectorForSymbol(symbolData.symbol, context);
          if (this.lotManager.canAddToSector(sector, this.params.maxETFsPerSector)) {
            return this.createBuyDecision(symbolData, context, 'Diversification opportunity');
          }
        }
      }
    }

    return { action: 'HOLD', reason: 'No diversification opportunities' };
  }

  /**
   * Rule C: Check for averaging down
   */
  private checkAveragingDown(context: StrategyContext): TradingDecision {
    const eligiblePositions = this.lotManager.getEligiblePositionsForAveraging(
      context.currentPrices,
      this.params.averagingThreshold
    );

    if (eligiblePositions.length === 0) {
      return {
        action: 'HOLD',
        reason: 'No positions eligible for averaging down'
      };
    }

    // Select position with highest fall percentage
    const bestPosition = eligiblePositions[0];
    const currentPrice = context.currentPrices.get(bestPosition.symbol) || 0;

    return this.createBuyDecision(
      {
        symbol: bestPosition.symbol,
        date: context.date,
        sma20: 0, // Not needed for averaging
        pct_diff_20: 0, // Not needed for averaging
        close: currentPrice
      },
      context,
      `Averaging down ${bestPosition.symbol} - ${bestPosition.fallPercent.toFixed(2)}% below reference price`
    );
  }

  /**
   * Create a buy decision
   */
  private createBuyDecision(
    symbolData: IndicatorData,
    context: StrategyContext,
    reason: string
  ): TradingDecision {
    const currentPrice = context.currentPrices.get(symbolData.symbol) || symbolData.close;
    
    // Calculate position size
    const positionSize = this.moneyManager.calculatePositionSize(
      symbolData.symbol,
      currentPrice,
      context.availableCash,
      context.equity,
      this.params
    );

    if (positionSize <= 0) {
      return {
        action: 'HOLD',
        reason: 'Insufficient capital for position sizing'
      };
    }

    // Calculate quantity
    const quantity = Math.floor(positionSize / currentPrice);
    
    if (quantity <= 0) {
      return {
        action: 'HOLD',
        reason: 'Position size too small for minimum quantity'
      };
    }

    return {
      action: 'BUY',
      symbol: symbolData.symbol,
      quantity,
      price: currentPrice,
      reason
    };
  }

  /**
   * Get sector for a symbol (placeholder - would need actual sector mapping)
   */
  private getSectorForSymbol(symbol: string, context: StrategyContext): string {
    // This is a simplified implementation
    // In reality, you'd have a mapping of symbols to sectors
    const sectorMap: Record<string, string> = {
      'NSE:GOLDBEES': 'Gold',
      'NSE:SILVERBEES': 'Silver',
      'NSE:CPSEETF': 'PSU',
      'NSE:PSUBANK': 'Banking',
      'NSE:ITBEES': 'Technology',
      'NSE:PHARMA': 'Pharmaceuticals',
      'NSE:AUTOBEES': 'Automotive',
      'NSE:ENERGY': 'Energy',
      'NSE:FMCG': 'FMCG',
      'NSE:METAL': 'Metals'
    };

    return sectorMap[symbol] || 'Other';
  }

  /**
   * Execute a trade decision
   */
  executeTrade(decision: TradingDecision, context: StrategyContext): Trade | null {
    if (decision.action === 'HOLD') {
      return null;
    }

    const trade: Trade = {
      id: `${decision.symbol}_${context.date}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: context.date,
      symbol: decision.symbol!,
      action: decision.action,
      quantity: decision.quantity!,
      price: decision.price!,
      amount: decision.quantity! * decision.price!,
      reason: decision.reason,
      sector: this.getSectorForSymbol(decision.symbol!, context)
    };

    if (decision.action === 'BUY') {
      // Add lot to portfolio
      this.lotManager.addLot(
        decision.symbol!,
        trade.sector,
        decision.quantity!,
        decision.price!,
        context.date
      );
    } else if (decision.action === 'SELL') {
      // Sell lots from portfolio
      const sellResult = this.lotManager.sellLots(
        decision.symbol!,
        decision.quantity!,
        decision.price!,
        context.date
      );

      // Update trade with lot information
      if (sellResult.soldLots.length > 0) {
        trade.lotId = sellResult.soldLots[0].lot.id;
      }
    }

    // Update money manager
    this.moneyManager.updateAfterTrade(trade, context.availableCash, context.equity);

    return trade;
  }

  /**
   * Get current portfolio positions
   */
  getPositions(currentPrices: Map<string, number>): Position[] {
    return this.lotManager.getAllPositions(currentPrices);
  }

  /**
   * Get lot manager
   */
  getLotManager(): PortfolioLotManager {
    return this.lotManager;
  }

  /**
   * Get money manager
   */
  getMoneyManager(): MoneyManager {
    return this.moneyManager;
  }

  /**
   * Reset strategy state (for testing)
   */
  reset(): void {
    this.lotManager.clear();
    // Note: Money manager state would need to be reset based on implementation
  }
}

/**
 * Strategy factory
 */
export function createStrategy(params: BacktestParams): ETFStrategy {
  return new ETFStrategy(params);
}

/**
 * Strategy validation utilities
 */
export class StrategyValidator {
  /**
   * Validate strategy parameters
   */
  static validateParams(params: BacktestParams): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.profitTarget <= 0 || params.profitTarget > 50) {
      errors.push('Profit target must be between 0 and 50%');
    }

    if (params.averagingThreshold <= 0 || params.averagingThreshold > 20) {
      errors.push('Averaging threshold must be between 0 and 20%');
    }

    if (params.maxETFsPerSector <= 0 || params.maxETFsPerSector > 10) {
      errors.push('Max ETFs per sector must be between 1 and 10');
    }

    if (params.topK <= 0 || params.topK > 20) {
      errors.push('Top K must be between 1 and 20');
    }

    if (params.initialCapital <= 0) {
      errors.push('Initial capital must be positive');
    }

    if (new Date(params.startDate) >= new Date(params.endDate)) {
      errors.push('Start date must be before end date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate trading decision
   */
  static validateDecision(decision: TradingDecision, context: StrategyContext): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (decision.action === 'BUY' || decision.action === 'SELL') {
      if (!decision.symbol) {
        errors.push('Symbol is required for BUY/SELL actions');
      }

      if (!decision.quantity || decision.quantity <= 0) {
        errors.push('Quantity must be positive');
      }

      if (!decision.price || decision.price <= 0) {
        errors.push('Price must be positive');
      }

      if (decision.action === 'BUY') {
        const requiredAmount = decision.quantity! * decision.price!;
        if (requiredAmount > context.availableCash) {
          errors.push('Insufficient cash for purchase');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
