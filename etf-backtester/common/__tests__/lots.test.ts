// Unit tests for LIFO lot management
import { LIFOLotManager, PortfolioLotManager } from '../lots';
import { Lot } from '../types';

describe('LIFOLotManager', () => {
  let lotManager: LIFOLotManager;

  beforeEach(() => {
    lotManager = new LIFOLotManager('NSE:TESTETF', 'Technology');
  });

  describe('addLot', () => {
    it('should add a new lot correctly', () => {
      const lot = lotManager.addLot(100, 50.0, '2024-01-01');
      
      expect(lot.symbol).toBe('NSE:TESTETF');
      expect(lot.quantity).toBe(100);
      expect(lot.price).toBe(50.0);
      expect(lot.date).toBe('2024-01-01');
      expect(lot.sector).toBe('Technology');
      expect(lot.id).toBeDefined();
    });

    it('should maintain lot order by date', () => {
      const lot1 = lotManager.addLot(100, 50.0, '2024-01-01');
      const lot2 = lotManager.addLot(200, 55.0, '2024-01-02');
      const lot3 = lotManager.addLot(150, 52.0, '2024-01-03');
      
      const lots = lotManager.getAllLots();
      expect(lots).toHaveLength(3);
      expect(lots[0].date).toBe('2024-01-01');
      expect(lots[1].date).toBe('2024-01-02');
      expect(lots[2].date).toBe('2024-01-03');
    });
  });

  describe('sellLots', () => {
    beforeEach(() => {
      lotManager.addLot(100, 50.0, '2024-01-01');
      lotManager.addLot(200, 55.0, '2024-01-02');
      lotManager.addLot(150, 52.0, '2024-01-03');
    });

    it('should sell lots in LIFO order', () => {
      const result = lotManager.sellLots(250, 60.0, '2024-01-04');
      
      expect(result.soldLots).toHaveLength(2);
      expect(result.remainingQuantity).toBe(0);
      
      // Should sell most recent lot first (2024-01-03)
      expect(result.soldLots[0].lot.date).toBe('2024-01-03');
      expect(result.soldLots[0].quantity).toBe(150);
      expect(result.soldLots[0].profit).toBe(1200); // (60-52) * 150
      
      // Then sell from second most recent lot (2024-01-02)
      expect(result.soldLots[1].lot.date).toBe('2024-01-02');
      expect(result.soldLots[1].quantity).toBe(100); // Remaining 100 from 200
      expect(result.soldLots[1].profit).toBe(500); // (60-55) * 100
    });

    it('should handle partial lot selling', () => {
      const result = lotManager.sellLots(50, 60.0, '2024-01-04');
      
      expect(result.soldLots).toHaveLength(1);
      expect(result.remainingQuantity).toBe(0);
      expect(result.soldLots[0].quantity).toBe(50);
      expect(result.soldLots[0].lot.date).toBe('2024-01-03');
      
      // Check that the lot quantity was updated
      const lots = lotManager.getAllLots();
      const remainingLot = lots.find(lot => lot.date === '2024-01-03');
      expect(remainingLot?.quantity).toBe(100); // 150 - 50
    });

    it('should handle insufficient quantity', () => {
      const result = lotManager.sellLots(500, 60.0, '2024-01-04');
      
      expect(result.soldLots).toHaveLength(3);
      expect(result.remainingQuantity).toBe(50); // 500 - 450 (total available)
    });

    it('should remove fully sold lots', () => {
      lotManager.sellLots(150, 60.0, '2024-01-04');
      
      const lots = lotManager.getAllLots();
      expect(lots).toHaveLength(2);
      expect(lots.find(lot => lot.date === '2024-01-03')).toBeUndefined();
    });
  });

  describe('getPosition', () => {
    beforeEach(() => {
      lotManager.addLot(100, 50.0, '2024-01-01');
      lotManager.addLot(200, 55.0, '2024-01-02');
    });

    it('should calculate position correctly', () => {
      const position = lotManager.getPosition(60.0);
      
      expect(position.symbol).toBe('NSE:TESTETF');
      expect(position.totalQuantity).toBe(300);
      expect(position.totalCost).toBe(16000); // (100*50) + (200*55)
      expect(position.averagePrice).toBeCloseTo(53.33, 2); // 16000/300
      expect(position.currentPrice).toBe(60.0);
      expect(position.unrealizedPnL).toBe(2000); // (60-53.33) * 300
      expect(position.unrealizedPnLPercent).toBeCloseTo(12.5, 1); // 2000/16000 * 100
    });

    it('should handle empty position', () => {
      const emptyManager = new LIFOLotManager('NSE:EMPTY', 'Test');
      const position = emptyManager.getPosition(60.0);
      
      expect(position.totalQuantity).toBe(0);
      expect(position.totalCost).toBe(0);
      expect(position.averagePrice).toBe(0);
      expect(position.unrealizedPnL).toBe(0);
      expect(position.unrealizedPnLPercent).toBe(0);
    });
  });

  describe('getEligibleLotsForSelling', () => {
    beforeEach(() => {
      lotManager.addLot(100, 50.0, '2024-01-01');
      lotManager.addLot(200, 55.0, '2024-01-02');
      lotManager.addLot(150, 52.0, '2024-01-03');
    });

    it('should return lots above profit threshold', () => {
      const eligibleLots = lotManager.getEligibleLotsForSelling(60.0, 10); // 10% profit threshold
      
      expect(eligibleLots).toHaveLength(2); // Lots with 20% and 9.09% profit
      expect(eligibleLots[0].profitPercent).toBeGreaterThan(10);
      expect(eligibleLots[1].profitPercent).toBeGreaterThan(10);
    });

    it('should sort by absolute profit descending', () => {
      const eligibleLots = lotManager.getEligibleLotsForSelling(60.0, 5);
      
      expect(eligibleLots[0].absoluteProfit).toBeGreaterThanOrEqual(eligibleLots[1].absoluteProfit);
    });

    it('should return empty array when no lots meet threshold', () => {
      const eligibleLots = lotManager.getEligibleLotsForSelling(45.0, 10);
      
      expect(eligibleLots).toHaveLength(0);
    });
  });

  describe('isEligibleForAveraging', () => {
    beforeEach(() => {
      lotManager.addLot(100, 50.0, '2024-01-01');
      lotManager.addLot(200, 55.0, '2024-01-02');
    });

    it('should identify averaging opportunities', () => {
      const isEligible = lotManager.isEligibleForAveraging(45.0, 10); // 10% threshold
      
      expect(isEligible).toBe(true); // 55 to 45 is 18.18% fall
    });

    it('should reject when fall is below threshold', () => {
      const isEligible = lotManager.isEligibleForAveraging(50.0, 10); // 10% threshold
      
      expect(isEligible).toBe(false); // 55 to 50 is 9.09% fall
    });

    it('should return false for empty position', () => {
      const emptyManager = new LIFOLotManager('NSE:EMPTY', 'Test');
      const isEligible = emptyManager.isEligibleForAveraging(45.0, 10);
      
      expect(isEligible).toBe(false);
    });
  });

  describe('getReferencePriceForAveraging', () => {
    it('should return most recent purchase price', () => {
      lotManager.addLot(100, 50.0, '2024-01-01');
      lotManager.addLot(200, 55.0, '2024-01-02');
      lotManager.addLot(150, 52.0, '2024-01-03');
      
      const referencePrice = lotManager.getReferencePriceForAveraging();
      
      expect(referencePrice).toBe(52.0); // Most recent lot price
    });

    it('should return 0 for empty position', () => {
      const referencePrice = lotManager.getReferencePriceForAveraging();
      
      expect(referencePrice).toBe(0);
    });
  });
});

describe('PortfolioLotManager', () => {
  let portfolioManager: PortfolioLotManager;

  beforeEach(() => {
    portfolioManager = new PortfolioLotManager();
  });

  describe('addLot', () => {
    it('should add lots for multiple symbols', () => {
      const lot1 = portfolioManager.addLot('NSE:ETF1', 'Technology', 100, 50.0, '2024-01-01');
      const lot2 = portfolioManager.addLot('NSE:ETF2', 'Finance', 200, 55.0, '2024-01-01');
      
      expect(lot1.symbol).toBe('NSE:ETF1');
      expect(lot2.symbol).toBe('NSE:ETF2');
      
      const sectorCounts = portfolioManager.getSectorCounts();
      expect(sectorCounts.get('Technology')).toBe(1);
      expect(sectorCounts.get('Finance')).toBe(1);
    });

    it('should track sector counts correctly', () => {
      portfolioManager.addLot('NSE:ETF1', 'Technology', 100, 50.0, '2024-01-01');
      portfolioManager.addLot('NSE:ETF2', 'Technology', 200, 55.0, '2024-01-02');
      portfolioManager.addLot('NSE:ETF3', 'Finance', 150, 52.0, '2024-01-01');
      
      const sectorCounts = portfolioManager.getSectorCounts();
      expect(sectorCounts.get('Technology')).toBe(2);
      expect(sectorCounts.get('Finance')).toBe(1);
    });
  });

  describe('sellLots', () => {
    beforeEach(() => {
      portfolioManager.addLot('NSE:ETF1', 'Technology', 100, 50.0, '2024-01-01');
      portfolioManager.addLot('NSE:ETF1', 'Technology', 200, 55.0, '2024-01-02');
    });

    it('should sell lots and update sector counts', () => {
      const result = portfolioManager.sellLots('NSE:ETF1', 300, 60.0, '2024-01-03');
      
      expect(result.soldLots).toHaveLength(2);
      expect(result.remainingQuantity).toBe(0);
      
      // Sector count should decrease when position is empty
      const sectorCounts = portfolioManager.getSectorCounts();
      expect(sectorCounts.get('Technology')).toBe(0);
    });

    it('should handle partial selling', () => {
      const result = portfolioManager.sellLots('NSE:ETF1', 150, 60.0, '2024-01-03');
      
      expect(result.soldLots).toHaveLength(1);
      expect(result.remainingQuantity).toBe(0);
      
      // Sector count should remain the same for partial selling
      const sectorCounts = portfolioManager.getSectorCounts();
      expect(sectorCounts.get('Technology')).toBe(1);
    });
  });

  describe('getAllPositions', () => {
    beforeEach(() => {
      portfolioManager.addLot('NSE:ETF1', 'Technology', 100, 50.0, '2024-01-01');
      portfolioManager.addLot('NSE:ETF2', 'Finance', 200, 55.0, '2024-01-01');
    });

    it('should return all positions with current prices', () => {
      const currentPrices = new Map([
        ['NSE:ETF1', 60.0],
        ['NSE:ETF2', 50.0]
      ]);
      
      const positions = portfolioManager.getAllPositions(currentPrices);
      
      expect(positions).toHaveLength(2);
      expect(positions[0].symbol).toBe('NSE:ETF1');
      expect(positions[0].currentPrice).toBe(60.0);
      expect(positions[1].symbol).toBe('NSE:ETF2');
      expect(positions[1].currentPrice).toBe(50.0);
    });

    it('should filter out positions without current prices', () => {
      const currentPrices = new Map([
        ['NSE:ETF1', 60.0]
        // NSE:ETF2 price missing
      ]);
      
      const positions = portfolioManager.getAllPositions(currentPrices);
      
      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('NSE:ETF1');
    });
  });

  describe('getEligiblePositionsForSelling', () => {
    beforeEach(() => {
      portfolioManager.addLot('NSE:ETF1', 'Technology', 100, 50.0, '2024-01-01');
      portfolioManager.addLot('NSE:ETF2', 'Finance', 200, 55.0, '2024-01-01');
    });

    it('should return positions eligible for selling', () => {
      const currentPrices = new Map([
        ['NSE:ETF1', 60.0], // 20% profit
        ['NSE:ETF2', 50.0]  // -9.09% loss
      ]);
      
      const eligiblePositions = portfolioManager.getEligiblePositionsForSelling(currentPrices, 10);
      
      expect(eligiblePositions).toHaveLength(1);
      expect(eligiblePositions[0].symbol).toBe('NSE:ETF1');
      expect(eligiblePositions[0].maxAbsoluteProfit).toBeGreaterThan(0);
    });

    it('should sort by maximum absolute profit', () => {
      portfolioManager.addLot('NSE:ETF3', 'Energy', 300, 40.0, '2024-01-01');
      
      const currentPrices = new Map([
        ['NSE:ETF1', 60.0], // 20% profit = 1000 absolute
        ['NSE:ETF3', 50.0]  // 25% profit = 3000 absolute
      ]);
      
      const eligiblePositions = portfolioManager.getEligiblePositionsForSelling(currentPrices, 10);
      
      expect(eligiblePositions[0].symbol).toBe('NSE:ETF3'); // Higher absolute profit
      expect(eligiblePositions[1].symbol).toBe('NSE:ETF1');
    });
  });

  describe('getEligiblePositionsForAveraging', () => {
    beforeEach(() => {
      portfolioManager.addLot('NSE:ETF1', 'Technology', 100, 50.0, '2024-01-01');
      portfolioManager.addLot('NSE:ETF2', 'Finance', 200, 55.0, '2024-01-01');
    });

    it('should return positions eligible for averaging', () => {
      const currentPrices = new Map([
        ['NSE:ETF1', 40.0], // 20% fall from 50
        ['NSE:ETF2', 50.0]  // 9.09% fall from 55
      ]);
      
      const eligiblePositions = portfolioManager.getEligiblePositionsForAveraging(currentPrices, 10);
      
      expect(eligiblePositions).toHaveLength(1);
      expect(eligiblePositions[0].symbol).toBe('NSE:ETF1');
      expect(eligiblePositions[0].fallPercent).toBeGreaterThan(10);
    });

    it('should sort by fall percentage descending', () => {
      portfolioManager.addLot('NSE:ETF3', 'Energy', 300, 60.0, '2024-01-01');
      
      const currentPrices = new Map([
        ['NSE:ETF1', 40.0], // 20% fall
        ['NSE:ETF3', 45.0]  // 25% fall
      ]);
      
      const eligiblePositions = portfolioManager.getEligiblePositionsForAveraging(currentPrices, 10);
      
      expect(eligiblePositions[0].symbol).toBe('NSE:ETF3'); // Higher fall percentage
      expect(eligiblePositions[1].symbol).toBe('NSE:ETF1');
    });
  });

  describe('canAddToSector', () => {
    beforeEach(() => {
      portfolioManager.addLot('NSE:ETF1', 'Technology', 100, 50.0, '2024-01-01');
      portfolioManager.addLot('NSE:ETF2', 'Technology', 200, 55.0, '2024-01-02');
    });

    it('should allow adding when under sector limit', () => {
      const canAdd = portfolioManager.canAddToSector('Technology', 3);
      
      expect(canAdd).toBe(true);
    });

    it('should prevent adding when at sector limit', () => {
      portfolioManager.addLot('NSE:ETF3', 'Technology', 150, 52.0, '2024-01-03');
      
      const canAdd = portfolioManager.canAddToSector('Technology', 3);
      
      expect(canAdd).toBe(false);
    });

    it('should allow adding to new sector', () => {
      const canAdd = portfolioManager.canAddToSector('Finance', 3);
      
      expect(canAdd).toBe(true);
    });
  });

  describe('getHeldSymbols and getNotHeldSymbols', () => {
    beforeEach(() => {
      portfolioManager.addLot('NSE:ETF1', 'Technology', 100, 50.0, '2024-01-01');
      portfolioManager.addLot('NSE:ETF2', 'Finance', 200, 55.0, '2024-01-01');
    });

    it('should return held symbols', () => {
      const heldSymbols = portfolioManager.getHeldSymbols();
      
      expect(heldSymbols).toHaveLength(2);
      expect(heldSymbols).toContain('NSE:ETF1');
      expect(heldSymbols).toContain('NSE:ETF2');
    });

    it('should return not held symbols', () => {
      const allSymbols = ['NSE:ETF1', 'NSE:ETF2', 'NSE:ETF3', 'NSE:ETF4'];
      const notHeldSymbols = portfolioManager.getNotHeldSymbols(allSymbols);
      
      expect(notHeldSymbols).toHaveLength(2);
      expect(notHeldSymbols).toContain('NSE:ETF3');
      expect(notHeldSymbols).toContain('NSE:ETF4');
    });
  });

  describe('clear', () => {
    it('should clear all positions and sector counts', () => {
      portfolioManager.addLot('NSE:ETF1', 'Technology', 100, 50.0, '2024-01-01');
      portfolioManager.addLot('NSE:ETF2', 'Finance', 200, 55.0, '2024-01-01');
      
      portfolioManager.clear();
      
      const heldSymbols = portfolioManager.getHeldSymbols();
      const sectorCounts = portfolioManager.getSectorCounts();
      
      expect(heldSymbols).toHaveLength(0);
      expect(sectorCounts.size).toBe(0);
    });
  });
});
