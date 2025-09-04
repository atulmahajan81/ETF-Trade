// Jest setup file for ETF backtester tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up test environment variables
process.env.NODE_ENV = 'test';

// Mock Date.now for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
global.Date.now = jest.fn(() => mockDate.getTime());

// Add custom matchers for financial calculations
expect.extend({
  toBeCloseToCurrency(received, expected, precision = 2) {
    const pass = Math.abs(received - expected) < Math.pow(10, -precision) / 2;
    if (pass) {
      return {
        message: () => `expected ${received} not to be close to ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be close to ${expected}`,
        pass: false,
      };
    }
  },
});

// Global test utilities
global.testUtils = {
  createSampleOHLCV: (symbol, date, close, volume = 1000, sector = 'Test') => ({
    date,
    symbol,
    open: close * 0.99,
    high: close * 1.02,
    low: close * 0.98,
    close,
    volume,
    sector
  }),
  
  createSampleIndicator: (symbol, date, close, sma20, pctDiff20) => ({
    symbol,
    date,
    sma20,
    pct_diff_20: pctDiff20,
    close
  }),
  
  createSampleLot: (symbol, quantity, price, date, sector = 'Test') => ({
    id: `${symbol}_${date}_${Math.random().toString(36).substr(2, 9)}`,
    symbol,
    quantity,
    price,
    date,
    sector
  })
};
