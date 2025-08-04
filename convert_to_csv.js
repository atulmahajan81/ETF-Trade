const fs = require('fs');

// Read the validated sold items data
const soldItemsData = fs.readFileSync('complete_sold_items.js', 'utf8');

// Extract the array from the JavaScript file
const arrayMatch = soldItemsData.match(/const sampleSoldItems = (\[[\s\S]*\]);/);
if (!arrayMatch) {
  console.error('Could not find sold items array in the file');
  process.exit(1);
}

// Parse the JSON array
const soldItems = JSON.parse(arrayMatch[1]);

// Convert to CSV
const csvHeaders = ['id', 'symbol', 'name', 'sector', 'buyDate', 'sellDate', 'buyPrice', 'sellPrice', 'quantity', 'totalInvested', 'profit', 'profitPercentage', 'sellReason'];

let csvContent = csvHeaders.join(',') + '\n';

soldItems.forEach(item => {
  const row = [
    item.id,
    `"${item.symbol}"`,
    `"${item.name}"`,
    `"${item.sector}"`,
    item.buyDate,
    item.sellDate,
    item.buyPrice,
    item.sellPrice,
    item.quantity,
    item.totalInvested,
    item.profit,
    item.profitPercentage,
    `"${item.sellReason}"`
  ];
  csvContent += row.join(',') + '\n';
});

// Write to CSV file
fs.writeFileSync('sold_items.csv', csvContent);

console.log(`Converted ${soldItems.length} sold items to CSV format`);
console.log('Data written to sold_items.csv');

// Show sample of the CSV
console.log('\nSample CSV content:');
console.log(csvContent.split('\n').slice(0, 5).join('\n')); 