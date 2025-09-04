const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, 'Priya ETF shop with LIFO - Bika hua maal.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV lines
const lines = csvContent.split('\n').filter(line => line.trim());

console.log('Regenerating sold items with correct profit values...');
console.log('==================================================');

let soldItems = [];
let totalProfit = 0;

// Process each line
lines.forEach((line, index) => {
  // Skip header lines and empty lines
  if (index < 3) return;
  
  // Parse CSV line properly, handling quoted values
  const columns = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      columns.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  columns.push(current.trim()); // Add the last column
  
  if (columns.length < 15) return;
  
  // Check if this is a data row (has buy date and sell date)
  const buyDate = columns[0]?.trim();
  const sellDate = columns[8]?.trim();
  const etfCode = columns[1]?.trim();
  const underlyingAsset = columns[2]?.trim();
  const buyPrice = parseFloat(columns[3]?.trim() || 0);
  const quantity = parseInt(columns[4]?.trim() || 0);
  const sellPrice = parseFloat(columns[7]?.trim() || 0);
  const profitAmount = parseFloat(columns[11]?.trim() || 0);
  const profitPercentage = parseFloat(columns[12]?.trim().replace('%', '') || 0);
  
  if (buyDate && sellDate && etfCode && profitAmount > 0) {
    const totalInvested = buyPrice * quantity;
    const sellReason = profitAmount > 0 ? 'Target Profit Achieved' : 'Stop Loss';
    
    const soldItem = {
      id: `sold_${soldItems.length + 1}`,
      symbol: etfCode,
      name: underlyingAsset,
      sector: 'ETF', // Default sector
      buyDate: buyDate,
      sellDate: sellDate,
      buyPrice: buyPrice,
      sellPrice: sellPrice,
      quantity: quantity,
      totalInvested: totalInvested,
      profit: profitAmount,
      profitPercentage: profitPercentage,
      sellReason: sellReason
    };
    
    soldItems.push(soldItem);
    totalProfit += profitAmount;
    
    console.log(`Item ${soldItems.length}: ${etfCode} - Profit: ${profitAmount}`);
  }
});

// Sort by sell date (newest first)
soldItems.sort((a, b) => new Date(b.sellDate) - new Date(a.sellDate));

// Generate the JavaScript file content
const jsContent = `// Auto-generated sold items data from CSV with correct profit values
export const sampleSoldItems = ${JSON.stringify(soldItems, null, 2)};
`;

// Write to file
const outputPath = path.join(__dirname, 'src/data/complete_sold_items.js');
fs.writeFileSync(outputPath, jsContent, 'utf8');

console.log('\nSummary:');
console.log('========');
console.log(`Total sold items: ${soldItems.length}`);
console.log(`Total profit: ${totalProfit.toLocaleString()}`);
console.log(`Expected from CSV summary: 195,087`);
console.log(`Difference: ${195087 - totalProfit}`);
console.log(`\nFile generated: ${outputPath}`); 