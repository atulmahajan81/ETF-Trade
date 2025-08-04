const fs = require('fs');

// Read the holdings CSV file
const csvData = fs.readFileSync('Priya ETF shop with LIFO - Kharida hua maal.csv', 'utf8');
const lines = csvData.split('\n');

const holdings = [];
let idCounter = 1;

// Skip header lines and process data
for (let i = 8; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Split by comma, handling quoted values
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim()); // Add the last value

  // Extract relevant fields
  const buyDate = values[0];
  const etfCode = values[1];
  const underlyingAsset = values[2];
  const buyPrice = parseFloat(values[3]);
  const actualBuyQty = parseInt(values[4].replace(/,/g, '')); // Remove commas from quantity
  const investedAmount = values[6];
  const totalQty = parseInt(values[7].replace(/,/g, '')); // Total quantity
  const totalInvested = values[8];
  const avgPrice = parseFloat(values[9]) || buyPrice; // Use buyPrice if avgPrice is missing
  const cmp = parseFloat(values[10]) || buyPrice; // Use buyPrice if CMP is missing

  // Check if this is a valid holding entry (more lenient validation)
  if (buyDate && etfCode && buyPrice && actualBuyQty && 
      buyPrice > 0 && actualBuyQty > 0) {
    
    // Determine sector based on underlying asset
    let sector = 'Other';
    const asset = underlyingAsset.toLowerCase();
    
    if (asset.includes('nifty') && asset.includes('it')) {
      sector = 'Technology';
    } else if (asset.includes('nifty') && asset.includes('bank')) {
      sector = 'Banking';
    } else if (asset.includes('nifty') && asset.includes('psu')) {
      sector = 'PSU Banking';
    } else if (asset.includes('nifty') && asset.includes('auto')) {
      sector = 'Automotive';
    } else if (asset.includes('nifty') && asset.includes('pharma')) {
      sector = 'Pharmaceuticals';
    } else if (asset.includes('nifty') && asset.includes('healthcare')) {
      sector = 'Healthcare';
    } else if (asset.includes('nifty') && asset.includes('fmcg')) {
      sector = 'FMCG';
    } else if (asset.includes('nifty') && asset.includes('consumption')) {
      sector = 'Consumption';
    } else if (asset.includes('nifty') && asset.includes('midcap')) {
      sector = 'Midcap';
    } else if (asset.includes('nifty') && asset.includes('next')) {
      sector = 'Large Cap';
    } else if (asset.includes('nifty') && asset.includes('50')) {
      sector = 'Large Cap';
    } else if (asset.includes('nifty') && asset.includes('100')) {
      sector = 'Large Cap';
    } else if (asset.includes('nifty') && asset.includes('200')) {
      sector = 'Large Cap';
    } else if (asset.includes('nifty') && asset.includes('500')) {
      sector = 'Large Cap';
    } else if (asset.includes('nifty') && asset.includes('smallcap')) {
      sector = 'Smallcap';
    } else if (asset.includes('nifty') && asset.includes('value')) {
      sector = 'Value';
    } else if (asset.includes('nifty') && asset.includes('momentum')) {
      sector = 'Momentum';
    } else if (asset.includes('nifty') && asset.includes('alpha')) {
      sector = 'Alpha';
    } else if (asset.includes('nifty') && asset.includes('low')) {
      sector = 'Low Volatility';
    } else if (asset.includes('nifty') && asset.includes('esg')) {
      sector = 'ESG';
    } else if (asset.includes('nifty') && asset.includes('digital')) {
      sector = 'Digital';
    } else if (asset.includes('nifty') && asset.includes('manufacturing')) {
      sector = 'Manufacturing';
    } else if (asset.includes('nifty') && asset.includes('dividend')) {
      sector = 'Dividend';
    } else if (asset.includes('nifty') && asset.includes('equal')) {
      sector = 'Equal Weight';
    } else if (asset.includes('nifty') && asset.includes('quality')) {
      sector = 'Quality';
    } else if (asset.includes('nasdaq')) {
      sector = 'US Technology';
    } else if (asset.includes('s&p')) {
      sector = 'US Large Cap';
    } else if (asset.includes('hang seng')) {
      sector = 'Hong Kong';
    } else if (asset.includes('gold')) {
      sector = 'Commodities';
    } else if (asset.includes('silver')) {
      sector = 'Commodities';
    } else if (asset.includes('cpse')) {
      sector = 'PSU';
    }

    // Convert date format from DD-MM-YY to YYYY-MM-DD
    const convertDate = (dateStr) => {
      if (!dateStr || dateStr.trim() === '') return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    };

    // Clean invested amount (remove commas)
    const investedAmountNum = parseInt(investedAmount.replace(/,/g, '')) || (buyPrice * actualBuyQty);
    const totalInvestedNum = parseInt(totalInvested.replace(/,/g, '')) || investedAmountNum;
    
    // Calculate current value and profit/loss
    const currentValue = cmp * totalQty;
    const profitLoss = currentValue - totalInvestedNum;
    const profitPercentage = totalInvestedNum > 0 ? (profitLoss / totalInvestedNum) * 100 : 0;

    holdings.push({
      id: `holding_${idCounter.toString().padStart(3, '0')}`,
      symbol: etfCode,
      name: underlyingAsset,
      sector: sector,
      buyDate: convertDate(buyDate),
      buyPrice: buyPrice,
      quantity: totalQty, // Use total quantity for holdings
      totalInvested: totalInvestedNum,
      avgPrice: avgPrice,
      currentPrice: cmp,
      currentValue: currentValue,
      profitLoss: profitLoss,
      profitPercentage: profitPercentage,
      lastBuyPrice: buyPrice, // For LIFO calculations
      lastBuyDate: convertDate(buyDate)
    });

    idCounter++;
  }
}

// Sort holdings by buy date (newest first)
holdings.sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate));

// Write to file
const outputData = `const sampleHoldings = ${JSON.stringify(holdings, null, 2)};

module.exports = { sampleHoldings };
`;

fs.writeFileSync('holdings_data_complete.js', outputData);

console.log(`Successfully extracted ${holdings.length} holdings from CSV`);
console.log('Holdings data written to holdings_data_complete.js');

// Display some sample holdings
console.log('\nSample Holdings:');
holdings.slice(0, 5).forEach(holding => {
  console.log(`${holding.symbol} - ${holding.name} (${holding.sector}) - Qty: ${holding.quantity} @ ₹${holding.avgPrice} - CMP: ₹${holding.currentPrice} - P&L: ₹${holding.profitLoss.toLocaleString()} (${holding.profitPercentage.toFixed(2)}%)`);
});

// Summary statistics
const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
const totalProfitLoss = holdings.reduce((sum, h) => sum + h.profitLoss, 0);
const profitableHoldings = holdings.filter(h => h.profitLoss > 0).length;

console.log(`\nHoldings Summary:`);
console.log(`Total Holdings: ${holdings.length}`);
console.log(`Total Invested: ₹${totalInvested.toLocaleString()}`);
console.log(`Current Value: ₹${totalCurrentValue.toLocaleString()}`);
console.log(`Total P&L: ₹${totalProfitLoss.toLocaleString()}`);
console.log(`Profitable Holdings: ${profitableHoldings}/${holdings.length}`);

// Check for specific missing entries
const missingEntries = ['NSE:PSUBNKIETF', 'NSE:PSUBANK', 'NSE:PSUBNKBEES'];
missingEntries.forEach(symbol => {
  const found = holdings.find(h => h.symbol === symbol);
  if (found) {
    console.log(`✓ Found: ${symbol}`);
  } else {
    console.log(`✗ Missing: ${symbol}`);
  }
}); 