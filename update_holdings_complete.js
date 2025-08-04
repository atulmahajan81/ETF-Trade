const fs = require('fs');

// Read the complete holdings data
const holdingsData = fs.readFileSync('holdings_data_complete.js', 'utf8');
const holdingsMatch = holdingsData.match(/const sampleHoldings = (\[[\s\S]*\]);/);
const holdings = JSON.parse(holdingsMatch[1]);

// Read the current context file
const contextData = fs.readFileSync('src/context/ETFTradingContext.js', 'utf8');

// Replace the holdings array in the context
const updatedContext = contextData.replace(
  /const sampleHoldings = \[[\s\S]*?\];/,
  `const sampleHoldings = ${JSON.stringify(holdings, null, 2)};`
);

// Write the updated context back to the file
fs.writeFileSync('src/context/ETFTradingContext.js', updatedContext);

console.log(`Successfully updated context with ${holdings.length} holdings`);

// Display summary
const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
const totalProfitLoss = holdings.reduce((sum, h) => sum + h.profitLoss, 0);

console.log(`\nHoldings Summary:`);
console.log(`Total Holdings: ${holdings.length}`);
console.log(`Total Invested: ₹${totalInvested.toLocaleString()}`);
console.log(`Current Value: ₹${totalCurrentValue.toLocaleString()}`);
console.log(`Total P&L: ₹${totalProfitLoss.toLocaleString()}`);

// Check for specific entries
const checkEntries = ['NSE:PSUBNKIETF', 'NSE:PSUBANK', 'NSE:PSUBNKBEES'];
checkEntries.forEach(symbol => {
  const found = holdings.filter(h => h.symbol === symbol);
  console.log(`✓ Found ${found.length} entries for ${symbol}`);
}); 