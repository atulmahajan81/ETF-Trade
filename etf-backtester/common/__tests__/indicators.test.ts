// Unit tests for indicators module
import { 
  calculateSMA, 
  calculatePctDiffFromSMA, 
  calculateIndicators,
  getIndicatorsForDate,
  rankSymbolsByPctDiff,
  getTopKSymbols,
  validateIndicatorData,
  calculateRollingStats,
  isValidTradingDate,
  getNextTradingDate,
  getPreviousTradingDate
} from '../indicators';
import { OHLCV, IndicatorData } from '../types';

describe('Indicators', () => {
  describe('calculateSMA', () => {
    it('should calculate SMA correctly for valid data', () => {
      const prices = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50];
      const sma = calculateSMA(prices, 5);
      
      // First 4 values should be NaN
      expect(sma[0]).toBeNaN();
      expect(sma[1]).toBeNaN();
      expect(sma[2]).toBeNaN();
      expect(sma[3]).toBeNaN();
      
      // 5th value should be average of first 5 prices
      expect(sma[4]).toBe(14); // (10+12+14+16+18)/5
      
      // 6th value should be average of prices 2-6
      expect(sma[5]).toBe(16); // (12+14+16+18+20)/5
    });

    it('should return NaN array for insufficient data', () => {
      const prices = [10, 12, 14];
      const sma = calculateSMA(prices, 5);
      
      expect(sma).toEqual([NaN, NaN, NaN]);
    });

    it('should handle empty array', () => {
      const prices: number[] = [];
      const sma = calculateSMA(prices, 5);
      
      expect(sma).toEqual([]);
    });
  });

  describe('calculatePctDiffFromSMA', () => {
    it('should calculate percentage difference correctly', () => {
      const close = 110;
      const sma = 100;
      const pctDiff = calculatePctDiffFromSMA(close, sma);
      
      expect(pctDiff).toBe(10); // (110-100)/100 * 100 = 10%
    });

    it('should handle negative difference', () => {
      const close = 90;
      const sma = 100;
      const pctDiff = calculatePctDiffFromSMA(close, sma);
      
      expect(pctDiff).toBe(-10); // (90-100)/100 * 100 = -10%
    });

    it('should return NaN for invalid SMA', () => {
      const close = 100;
      const sma = NaN;
      const pctDiff = calculatePctDiffFromSMA(close, sma);
      
      expect(pctDiff).toBeNaN();
    });

    it('should return NaN for zero SMA', () => {
      const close = 100;
      const sma = 0;
      const pctDiff = calculatePctDiffFromSMA(close, sma);
      
      expect(pctDiff).toBeNaN();
    });
  });

  describe('calculateIndicators', () => {
    const sampleData: OHLCV[] = [
      { date: '2024-01-01', symbol: 'ETF1', open: 100, high: 105, low: 95, close: 102, volume: 1000, sector: 'Tech' },
      { date: '2024-01-02', symbol: 'ETF1', open: 102, high: 108, low: 100, close: 106, volume: 1100, sector: 'Tech' },
      { date: '2024-01-03', symbol: 'ETF1', open: 106, high: 112, low: 104, close: 110, volume: 1200, sector: 'Tech' },
      { date: '2024-01-04', symbol: 'ETF1', open: 110, high: 115, low: 108, close: 113, volume: 1300, sector: 'Tech' },
      { date: '2024-01-05', symbol: 'ETF1', open: 113, high: 118, low: 111, close: 116, volume: 1400, sector: 'Tech' },
      { date: '2024-01-01', symbol: 'ETF2', open: 50, high: 55, low: 45, close: 52, volume: 2000, sector: 'Finance' },
      { date: '2024-01-02', symbol: 'ETF2', open: 52, high: 58, low: 50, close: 56, volume: 2100, sector: 'Finance' },
      { date: '2024-01-03', symbol: 'ETF2', open: 56, high: 62, low: 54, close: 60, volume: 2200, sector: 'Finance' },
      { date: '2024-01-04', symbol: 'ETF2', open: 60, high: 65, low: 58, close: 63, volume: 2300, sector: 'Finance' },
      { date: '2024-01-05', symbol: 'ETF2', open: 63, high: 68, low: 61, close: 66, volume: 2400, sector: 'Finance' }
    ];

    it('should calculate indicators for multiple symbols', () => {
      const indicators = calculateIndicators(sampleData, 3);
      
      expect(indicators.size).toBe(2);
      expect(indicators.has('ETF1')).toBe(true);
      expect(indicators.has('ETF2')).toBe(true);
      
      const etf1Indicators = indicators.get('ETF1')!;
      expect(etf1Indicators).toHaveLength(5);
      
      // First 2 values should have NaN SMA
      expect(etf1Indicators[0].sma20).toBeNaN();
      expect(etf1Indicators[1].sma20).toBeNaN();
      
      // 3rd value should have valid SMA
      expect(etf1Indicators[2].sma20).toBe(106); // (102+106+110)/3
    });

    it('should sort data by date', () => {
      const unsortedData: OHLCV[] = [
        { date: '2024-01-03', symbol: 'ETF1', open: 100, high: 105, low: 95, close: 102, volume: 1000, sector: 'Tech' },
        { date: '2024-01-01', symbol: 'ETF1', open: 100, high: 105, low: 95, close: 102, volume: 1000, sector: 'Tech' },
        { date: '2024-01-02', symbol: 'ETF1', open: 100, high: 105, low: 95, close: 102, volume: 1000, sector: 'Tech' }
      ];
      
      const indicators = calculateIndicators(unsortedData, 2);
      const etf1Indicators = indicators.get('ETF1')!;
      
      expect(etf1Indicators[0].date).toBe('2024-01-01');
      expect(etf1Indicators[1].date).toBe('2024-01-02');
      expect(etf1Indicators[2].date).toBe('2024-01-03');
    });
  });

  describe('getIndicatorsForDate', () => {
    const indicators = new Map<string, IndicatorData[]>([
      ['ETF1', [
        { symbol: 'ETF1', date: '2024-01-01', sma20: 100, pct_diff_20: -2, close: 98 },
        { symbol: 'ETF1', date: '2024-01-02', sma20: 102, pct_diff_20: 1, close: 103 }
      ]],
      ['ETF2', [
        { symbol: 'ETF2', date: '2024-01-01', sma20: 50, pct_diff_20: -5, close: 47.5 },
        { symbol: 'ETF2', date: '2024-01-02', sma20: 52, pct_diff_20: 2, close: 53 }
      ]]
    ]);

    it('should return indicators for specific date', () => {
      const dayIndicators = getIndicatorsForDate(indicators, '2024-01-01');
      
      expect(dayIndicators).toHaveLength(2);
      expect(dayIndicators[0].symbol).toBe('ETF1');
      expect(dayIndicators[1].symbol).toBe('ETF2');
    });

    it('should filter out invalid indicators', () => {
      const indicatorsWithInvalid = new Map<string, IndicatorData[]>([
        ['ETF1', [
          { symbol: 'ETF1', date: '2024-01-01', sma20: NaN, pct_diff_20: NaN, close: 98 },
          { symbol: 'ETF1', date: '2024-01-02', sma20: 102, pct_diff_20: 1, close: 103 }
        ]]
      ]);
      
      const dayIndicators = getIndicatorsForDate(indicatorsWithInvalid, '2024-01-01');
      
      expect(dayIndicators).toHaveLength(0);
    });
  });

  describe('rankSymbolsByPctDiff', () => {
    const indicators: IndicatorData[] = [
      { symbol: 'ETF1', date: '2024-01-01', sma20: 100, pct_diff_20: -2, close: 98 },
      { symbol: 'ETF2', date: '2024-01-01', sma20: 50, pct_diff_20: -5, close: 47.5 },
      { symbol: 'ETF3', date: '2024-01-01', sma20: 200, pct_diff_20: 1, close: 202 },
      { symbol: 'ETF4', date: '2024-01-01', sma20: 150, pct_diff_20: -1, close: 148.5 }
    ];

    it('should rank symbols by percentage difference ascending', () => {
      const ranked = rankSymbolsByPctDiff(indicators);
      
      expect(ranked[0].symbol).toBe('ETF2'); // -5%
      expect(ranked[1].symbol).toBe('ETF1'); // -2%
      expect(ranked[2].symbol).toBe('ETF4'); // -1%
      expect(ranked[3].symbol).toBe('ETF3'); // 1%
    });

    it('should filter out invalid indicators', () => {
      const indicatorsWithInvalid: IndicatorData[] = [
        { symbol: 'ETF1', date: '2024-01-01', sma20: 100, pct_diff_20: -2, close: 98 },
        { symbol: 'ETF2', date: '2024-01-01', sma20: 50, pct_diff_20: NaN, close: 47.5 }
      ];
      
      const ranked = rankSymbolsByPctDiff(indicatorsWithInvalid);
      
      expect(ranked).toHaveLength(1);
      expect(ranked[0].symbol).toBe('ETF1');
    });
  });

  describe('getTopKSymbols', () => {
    const indicators = new Map<string, IndicatorData[]>([
      ['ETF1', [{ symbol: 'ETF1', date: '2024-01-01', sma20: 100, pct_diff_20: -2, close: 98 }]],
      ['ETF2', [{ symbol: 'ETF2', date: '2024-01-01', sma20: 50, pct_diff_20: -5, close: 47.5 }]],
      ['ETF3', [{ symbol: 'ETF3', date: '2024-01-01', sma20: 200, pct_diff_20: 1, close: 202 }]],
      ['ETF4', [{ symbol: 'ETF4', date: '2024-01-01', sma20: 150, pct_diff_20: -1, close: 148.5 }]]
    ]);

    it('should return top K symbols', () => {
      const topK = getTopKSymbols(indicators, '2024-01-01', 3);
      
      expect(topK).toHaveLength(3);
      expect(topK[0].symbol).toBe('ETF2'); // -5%
      expect(topK[1].symbol).toBe('ETF1'); // -2%
      expect(topK[2].symbol).toBe('ETF4'); // -1%
    });

    it('should return all symbols if K is larger than available', () => {
      const topK = getTopKSymbols(indicators, '2024-01-01', 10);
      
      expect(topK).toHaveLength(4);
    });
  });

  describe('validateIndicatorData', () => {
    it('should validate correct indicator data', () => {
      const indicators: IndicatorData[] = [
        { symbol: 'ETF1', date: '2024-01-01', sma20: 100, pct_diff_20: -2, close: 98 },
        { symbol: 'ETF2', date: '2024-01-01', sma20: 50, pct_diff_20: -5, close: 47.5 }
      ];
      
      const validation = validateIndicatorData(indicators);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid indicator data', () => {
      const indicators: IndicatorData[] = [
        { symbol: 'ETF1', date: '2024-01-01', sma20: NaN, pct_diff_20: -2, close: 98 },
        { symbol: 'ETF2', date: '2024-01-01', sma20: 50, pct_diff_20: NaN, close: 47.5 },
        { symbol: 'ETF3', date: '2024-01-01', sma20: 100, pct_diff_20: -2, close: 0 }
      ];
      
      const validation = validateIndicatorData(indicators);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(3);
    });
  });

  describe('calculateRollingStats', () => {
    it('should calculate rolling statistics correctly', () => {
      const trades = [
        { profit: 100, loss: 0 },
        { profit: 0, loss: 50 },
        { profit: 150, loss: 0 },
        { profit: 0, loss: 30 },
        { profit: 200, loss: 0 }
      ];
      
      const stats = calculateRollingStats(trades, 5);
      
      expect(stats.winRate).toBe(0.6); // 3 wins out of 5 trades
      expect(stats.avgWin).toBe(150); // (100+150+200)/3
      expect(stats.avgLoss).toBe(40); // (50+30)/2
      expect(stats.kellyFraction).toBeGreaterThan(0);
    });

    it('should handle empty trades array', () => {
      const stats = calculateRollingStats([], 30);
      
      expect(stats.winRate).toBe(0);
      expect(stats.avgWin).toBe(0);
      expect(stats.avgLoss).toBe(0);
      expect(stats.kellyFraction).toBe(0);
    });
  });

  describe('Trading date utilities', () => {
    it('should identify valid trading dates', () => {
      expect(isValidTradingDate('2024-01-01')).toBe(true); // Monday
      expect(isValidTradingDate('2024-01-02')).toBe(true); // Tuesday
      expect(isValidTradingDate('2024-01-03')).toBe(true); // Wednesday
      expect(isValidTradingDate('2024-01-04')).toBe(true); // Thursday
      expect(isValidTradingDate('2024-01-05')).toBe(true); // Friday
      expect(isValidTradingDate('2024-01-06')).toBe(false); // Saturday
      expect(isValidTradingDate('2024-01-07')).toBe(false); // Sunday
    });

    it('should get next trading date', () => {
      expect(getNextTradingDate('2024-01-05')).toBe('2024-01-08'); // Friday to Monday
      expect(getNextTradingDate('2024-01-01')).toBe('2024-01-02'); // Monday to Tuesday
    });

    it('should get previous trading date', () => {
      expect(getPreviousTradingDate('2024-01-08')).toBe('2024-01-05'); // Monday to Friday
      expect(getPreviousTradingDate('2024-01-02')).toBe('2024-01-01'); // Tuesday to Monday
    });
  });
});
