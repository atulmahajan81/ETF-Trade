const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, 'Priya ETF shop with LIFO - Bika hua maal.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV lines
const lines = csvContent.split('\n').filter(line => line.trim());

console.log('CSV Analysis:');
console.log('=============');

// Let me check the first few lines to understand the structure better
console.log('\nFirst few lines structure:');
lines.slice(0, 5).forEach((line, index) => {
  const columns = line.split(',');
  console.log(`Line ${index}: ${columns.length} columns`);
  if (index === 3) { // First data row
    console.log('Column headers (first 15):', columns.slice(0, 15).map((col, i) => `${i}:${col}`));
  }
});

let totalProfitFromCSV = 0;
let soldItemsCount = 0;

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
  
  if (columns.length < 12) return;
  
  // Check if this is a data row (has buy date and sell date)
  const buyDate = columns[0]?.trim();
  const sellDate = columns[8]?.trim();
  
  // The profit amount should be in column 11 (index 11) - "Profit Amount"
  const profitAmount = columns[11]?.trim();
  
  if (buyDate && sellDate && profitAmount && !isNaN(parseFloat(profitAmount))) {
    const profit = parseFloat(profitAmount);
    totalProfitFromCSV += profit;
    soldItemsCount++;
    
    // Debug first few items
    if (soldItemsCount <= 5) {
      console.log(`Item ${soldItemsCount}: ${columns[1]} (${columns[2]}) - Raw profit: "${profitAmount}", Parsed: ${profit}`);
      console.log(`  Columns 9-13: "${columns[9]}" | "${columns[10]}" | "${columns[11]}" | "${columns[12]}" | "${columns[13]}"`);
    } else if (soldItemsCount <= 10) {
      console.log(`Item ${soldItemsCount}: ${columns[1]} (${columns[2]}) - Profit: ${profit}`);
    }
  }
});

console.log('\nSummary:');
console.log('========');
console.log(`Total sold items from CSV: ${soldItemsCount}`);
console.log(`Total profit from CSV: ${totalProfitFromCSV}`);

// Now check the current data
const { sampleSoldItems } = require('./src/data/complete_sold_items.js');
const totalProfitFromJS = sampleSoldItems.reduce((sum, item) => sum + item.profit, 0);

console.log(`\nCurrent data from complete_sold_items.js:`);
console.log(`Total sold items: ${sampleSoldItems.length}`);
console.log(`Total profit: ${totalProfitFromJS}`);

console.log(`\nDiscrepancy:`);
console.log(`Difference: ${totalProfitFromCSV - totalProfitFromJS}`);
console.log(`Missing profit: ${totalProfitFromCSV - totalProfitFromJS}`);

// Check if we have the right number of items
if (sampleSoldItems.length !== soldItemsCount) {
  console.log(`\n⚠️ Item count mismatch: CSV has ${soldItemsCount} items, JS has ${sampleSoldItems.length} items`);
}

// Let me also check what the expected total should be from the summary row
const summaryLine = lines.find(line => line.includes('Grand Total'));
if (summaryLine) {
  console.log('\nSummary line found:', summaryLine);
  const summaryColumns = summaryLine.split(',');
  console.log('Summary columns:', summaryColumns.slice(0, 20));
} 