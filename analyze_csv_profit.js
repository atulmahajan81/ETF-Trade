const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, 'Priya ETF shop with LIFO - Bika hua maal.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV lines
const lines = csvContent.split('\n').filter(line => line.trim());

console.log('Detailed CSV Profit Analysis');
console.log('============================');

let totalProfit = 0;
let soldItems = [];
let rowCount = 0;

// Process each line
lines.forEach((line, index) => {
  // Skip header lines
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
  
  if (columns.length < 12) return;
  
  // Check if this is a data row (has buy date and sell date)
  const buyDate = columns[0]?.trim();
  const sellDate = columns[8]?.trim();
  const etfCode = columns[1]?.trim();
  const profitAmount = parseFloat(columns[11]?.trim() || 0);
  
  if (buyDate && sellDate && etfCode && profitAmount > 0) {
    rowCount++;
    totalProfit += profitAmount;
    
    soldItems.push({
      row: index + 1,
      etfCode,
      buyDate,
      sellDate,
      profit: profitAmount
    });
    
    // Show first 10 and last 10 items
    if (rowCount <= 10 || rowCount > soldItems.length - 10) {
      console.log(`Row ${index + 1}: ${etfCode} - Profit: ${profitAmount}`);
    }
  }
});

console.log('\nSummary:');
console.log('========');
console.log(`Total rows processed: ${rowCount}`);
console.log(`Total profit: ${totalProfit.toLocaleString()}`);
console.log(`Expected from CSV summary: 195,087`);
console.log(`Difference: ${195087 - totalProfit}`);

// Check if there are any rows with very high profit values that might be missing
console.log('\nTop 10 profit items:');
soldItems
  .sort((a, b) => b.profit - a.profit)
  .slice(0, 10)
  .forEach((item, index) => {
    console.log(`${index + 1}. ${item.etfCode} - Profit: ${item.profit}`);
  });

// Check if there are any rows with profit > 1000
const highProfitItems = soldItems.filter(item => item.profit > 1000);
console.log(`\nItems with profit > 1000: ${highProfitItems.length}`);
highProfitItems.forEach(item => {
  console.log(`${item.etfCode} - Profit: ${item.profit}`);
});

// Let me also check the summary line more carefully
const summaryLine = lines.find(line => line.includes('Grand Total'));
if (summaryLine) {
  console.log('\nSummary line analysis:');
  const summaryColumns = summaryLine.split(',');
  console.log('Summary columns:', summaryColumns.map((col, i) => `${i}:${col}`).slice(0, 30));
} 