// LIFO (Last In First Out) lot management for tax-efficient trading
import { Lot, Position, Trade } from './types';

/**
 * LIFO lot manager for a single symbol
 */
export class LIFOLotManager {
  private lots: Lot[] = [];
  private symbol: string;
  private sector: string;

  constructor(symbol: string, sector: string) {
    this.symbol = symbol;
    this.sector = sector;
  }

  /**
   * Add a new lot (BUY)
   */
  addLot(quantity: number, price: number, date: string): Lot {
    const lot: Lot = {
      id: `${this.symbol}_${date}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: this.symbol,
      quantity,
      price,
      date,
      sector: this.sector
    };

    this.lots.push(lot);
    return lot;
  }

  /**
   * Sell lots using LIFO (Last In First Out) method
   */
  sellLots(quantity: number, currentPrice: number, date: string): {
    soldLots: Array<{ lot: Lot; quantity: number; profit: number }>;
    remainingQuantity: number;
  } {
    const soldLots: Array<{ lot: Lot; quantity: number; profit: number }> = [];
    let remainingQuantity = quantity;

    // Sort lots by date descending (most recent first) for LIFO
    const sortedLots = [...this.lots].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const lot of sortedLots) {
      if (remainingQuantity <= 0) break;

      const sellQuantity = Math.min(remainingQuantity, lot.quantity);
      const profit = (currentPrice - lot.price) * sellQuantity;

      soldLots.push({
        lot,
        quantity: sellQuantity,
        profit
      });

      // Update lot quantity
      lot.quantity -= sellQuantity;
      remainingQuantity -= sellQuantity;

      // Remove lot if fully sold
      if (lot.quantity <= 0) {
        const index = this.lots.findIndex(l => l.id === lot.id);
        if (index !== -1) {
          this.lots.splice(index, 1);
        }
      }
    }

    return { soldLots, remainingQuantity };
  }

  /**
   * Get current position summary
   */
  getPosition(currentPrice: number): Position {
    const totalQuantity = this.lots.reduce((sum, lot) => sum + lot.quantity, 0);
    const totalCost = this.lots.reduce((sum, lot) => sum + (lot.price * lot.quantity), 0);
    const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    const currentValue = totalQuantity * currentPrice;
    const unrealizedPnL = currentValue - totalCost;
    const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

    return {
      symbol: this.symbol,
      totalQuantity,
      totalCost,
      averagePrice,
      currentPrice,
      unrealizedPnL,
      unrealizedPnLPercent,
      lots: [...this.lots], // Copy to avoid mutation
      sector: this.sector
    };
  }

  /**
   * Get lots eligible for selling (above profit threshold)
   */
  getEligibleLotsForSelling(currentPrice: number, profitThreshold: number): Array<{
    lot: Lot;
    profitPercent: number;
    absoluteProfit: number;
  }> {
    return this.lots
      .map(lot => {
        const profitPercent = ((currentPrice - lot.price) / lot.price) * 100;
        const absoluteProfit = (currentPrice - lot.price) * lot.quantity;
        return { lot, profitPercent, absoluteProfit };
      })
      .filter(item => item.profitPercent >= profitThreshold)
      .sort((a, b) => b.absoluteProfit - a.absoluteProfit); // Sort by absolute profit descending
  }

  /**
   * Check if position is eligible for averaging down
   */
  isEligibleForAveraging(currentPrice: number, averagingThreshold: number): boolean {
    if (this.lots.length === 0) return false;

    // Get the most recent lot price
    const mostRecentLot = this.lots.reduce((latest, lot) => 
      new Date(lot.date) > new Date(latest.date) ? lot : latest
    );

    const fallPercent = ((mostRecentLot.price - currentPrice) / mostRecentLot.price) * 100;
    return fallPercent >= averagingThreshold;
  }

  /**
   * Get the reference price for averaging (most recent purchase price)
   */
  getReferencePriceForAveraging(): number {
    if (this.lots.length === 0) return 0;

    const mostRecentLot = this.lots.reduce((latest, lot) => 
      new Date(lot.date) > new Date(latest.date) ? lot : latest
    );

    return mostRecentLot.price;
  }

  /**
   * Get all lots
   */
  getAllLots(): Lot[] {
    return [...this.lots];
  }

  /**
   * Get lot count
   */
  getLotCount(): number {
    return this.lots.length;
  }

  /**
   * Check if position is empty
   */
  isEmpty(): boolean {
    return this.lots.length === 0;
  }

  /**
   * Get total quantity
   */
  getTotalQuantity(): number {
    return this.lots.reduce((sum, lot) => sum + lot.quantity, 0);
  }

  /**
   * Get total cost basis
   */
  getTotalCost(): number {
    return this.lots.reduce((sum, lot) => sum + (lot.price * lot.quantity), 0);
  }

  /**
   * Calculate average price
   */
  getAveragePrice(): number {
    const totalQuantity = this.getTotalQuantity();
    return totalQuantity > 0 ? this.getTotalCost() / totalQuantity : 0;
  }
}

/**
 * Portfolio-level lot manager
 */
export class PortfolioLotManager {
  private symbolManagers: Map<string, LIFOLotManager> = new Map();
  private sectorCounts: Map<string, number> = new Map();

  /**
   * Get or create lot manager for a symbol
   */
  private getLotManager(symbol: string, sector: string): LIFOLotManager {
    if (!this.symbolManagers.has(symbol)) {
      this.symbolManagers.set(symbol, new LIFOLotManager(symbol, sector));
    }
    return this.symbolManagers.get(symbol)!;
  }

  /**
   * Add a lot (BUY)
   */
  addLot(symbol: string, sector: string, quantity: number, price: number, date: string): Lot {
    const manager = this.getLotManager(symbol, sector);
    const lot = manager.addLot(quantity, price, date);
    
    // Update sector count
    this.sectorCounts.set(sector, (this.sectorCounts.get(sector) || 0) + 1);
    
    return lot;
  }

  /**
   * Sell lots (SELL)
   */
  sellLots(
    symbol: string, 
    quantity: number, 
    currentPrice: number, 
    date: string
  ): {
    soldLots: Array<{ lot: Lot; quantity: number; profit: number }>;
    remainingQuantity: number;
  } {
    const manager = this.symbolManagers.get(symbol);
    if (!manager) {
      return { soldLots: [], remainingQuantity: quantity };
    }

    const result = manager.sellLots(quantity, currentPrice, date);
    
    // Update sector count if position is now empty
    if (manager.isEmpty()) {
      const position = manager.getPosition(currentPrice);
      const currentCount = this.sectorCounts.get(position.sector) || 0;
      this.sectorCounts.set(position.sector, Math.max(0, currentCount - 1));
    }

    return result;
  }

  /**
   * Get all positions
   */
  getAllPositions(currentPrices: Map<string, number>): Position[] {
    const positions: Position[] = [];
    
    for (const [symbol, manager] of this.symbolManagers) {
      const currentPrice = currentPrices.get(symbol) || 0;
      if (currentPrice > 0) {
        positions.push(manager.getPosition(currentPrice));
      }
    }
    
    return positions;
  }

  /**
   * Get positions eligible for selling
   */
  getEligiblePositionsForSelling(
    currentPrices: Map<string, number>, 
    profitThreshold: number
  ): Array<{
    symbol: string;
    position: Position;
    eligibleLots: Array<{ lot: Lot; profitPercent: number; absoluteProfit: number }>;
    maxAbsoluteProfit: number;
  }> {
    const eligible: Array<{
      symbol: string;
      position: Position;
      eligibleLots: Array<{ lot: Lot; profitPercent: number; absoluteProfit: number }>;
      maxAbsoluteProfit: number;
    }> = [];

    for (const [symbol, manager] of this.symbolManagers) {
      const currentPrice = currentPrices.get(symbol) || 0;
      if (currentPrice <= 0) continue;

      const position = manager.getPosition(currentPrice);
      const eligibleLots = manager.getEligibleLotsForSelling(currentPrice, profitThreshold);
      
      if (eligibleLots.length > 0) {
        const maxAbsoluteProfit = Math.max(...eligibleLots.map(lot => lot.absoluteProfit));
        eligible.push({
          symbol,
          position,
          eligibleLots,
          maxAbsoluteProfit
        });
      }
    }

    // Sort by maximum absolute profit descending
    return eligible.sort((a, b) => b.maxAbsoluteProfit - a.maxAbsoluteProfit);
  }

  /**
   * Get positions eligible for averaging down
   */
  getEligiblePositionsForAveraging(
    currentPrices: Map<string, number>, 
    averagingThreshold: number
  ): Array<{
    symbol: string;
    position: Position;
    fallPercent: number;
    referencePrice: number;
  }> {
    const eligible: Array<{
      symbol: string;
      position: Position;
      fallPercent: number;
      referencePrice: number;
    }> = [];

    for (const [symbol, manager] of this.symbolManagers) {
      const currentPrice = currentPrices.get(symbol) || 0;
      if (currentPrice <= 0) continue;

      if (manager.isEligibleForAveraging(currentPrice, averagingThreshold)) {
        const position = manager.getPosition(currentPrice);
        const referencePrice = manager.getReferencePriceForAveraging();
        const fallPercent = ((referencePrice - currentPrice) / referencePrice) * 100;
        
        eligible.push({
          symbol,
          position,
          fallPercent,
          referencePrice
        });
      }
    }

    // Sort by fall percentage descending (most fallen first)
    return eligible.sort((a, b) => b.fallPercent - a.fallPercent);
  }

  /**
   * Check sector capacity
   */
  canAddToSector(sector: string, maxPerSector: number): boolean {
    const currentCount = this.sectorCounts.get(sector) || 0;
    return currentCount < maxPerSector;
  }

  /**
   * Get sector counts
   */
  getSectorCounts(): Map<string, number> {
    return new Map(this.sectorCounts);
  }

  /**
   * Get symbols currently held
   */
  getHeldSymbols(): string[] {
    return Array.from(this.symbolManagers.keys()).filter(symbol => 
      this.symbolManagers.get(symbol)!.getTotalQuantity() > 0
    );
  }

  /**
   * Get symbols not held
   */
  getNotHeldSymbols(allSymbols: string[]): string[] {
    const heldSymbols = this.getHeldSymbols();
    return allSymbols.filter(symbol => !heldSymbols.includes(symbol));
  }

  /**
   * Clear all positions (for testing)
   */
  clear(): void {
    this.symbolManagers.clear();
    this.sectorCounts.clear();
  }
}
