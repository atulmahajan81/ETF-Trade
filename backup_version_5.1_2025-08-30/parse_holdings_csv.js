const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvFilePath = path.join(__dirname, 'Priya ETF shop with LIFO - Kharida hua maal.csv');
const csvContent = fs.readFileSync(csvFilePath, 'utf8');

// Parse CSV content
const lines = csvContent.split('\n');

console.log('Total lines in CSV:', lines.length);

// Find the actual data section - line 7 has the headers we need
const dataStartLine = 7; // Line 7 contains the actual headers
console.log('Line 7 content:', lines[dataStartLine]);
const headers = lines[dataStartLine].split(',').map(h => h.trim().replace(/"/g, ''));

console.log('Headers found:', headers);

const holdings = [];

// Process each line starting from line 8 (data starts after headers)
for (let i = dataStartLine + 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  console.log(`Processing line ${i}:`, line.substring(0, 100) + '...');
  
  // Split by comma, but handle quoted values
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
  
  console.log(`Line ${i} values:`, values.slice(0, 5));
  
  if (values.length >= 5) { // We need at least Buy Date, ETF Code, Underlying Asset, Buy Price, Actual Buy Qty
    const holding = {};
    headers.forEach((header, index) => {
      holding[header] = values[index] || '';
    });
    
    console.log(`Line ${i} holding:`, {
      buyDate: holding['Buy Date'],
      etfCode: holding['ETF Code'],
      buyPrice: holding['Buy Price'],
      actualBuyQty: holding['Actual Buy Qty']
    });
    
    // Only add if we have valid data
    if (holding['Buy Date'] && holding['ETF Code'] && holding['Buy Price'] && holding['Actual Buy Qty']) {
      holdings.push(holding);
      console.log(`✅ Added holding from line ${i}`);
    } else {
      console.log(`❌ Skipped line ${i} - missing required fields`);
    }
  }
}

console.log(`Parsed ${holdings.length} holdings`);

// Transform to the format expected by the app
const transformedHoldings = holdings.map((holding, index) => {
  // Extract quantity and price from the data
  const quantityStr = holding['Actual Buy Qty'] || '0';
  const priceStr = holding['Buy Price'] || '0';
  
  // Remove commas and convert to numbers
  const quantity = parseFloat(quantityStr.replace(/,/g, '')) || 0;
  const price = parseFloat(priceStr.replace(/,/g, '')) || 0;
  const symbol = holding['ETF Code'] || `HOLDING_${index}`;
  const underlyingAsset = holding['Underlying Asset'] || '';
  
  return {
    id: `holding_${index + 1}`,
    symbol: symbol,
    quantity: quantity,
    avgPrice: price,
    currentPrice: price, // Start with same as buy price
    buyDate: holding['Buy Date'] || new Date().toISOString().split('T')[0],
    originalBuyPrice: price,
    holdingId: `holding_${index + 1}`,
    underlyingAsset: underlyingAsset
  };
}).filter(h => h.quantity > 0 && h.symbol && h.symbol !== 'ETF Code');

console.log(`Transformed ${transformedHoldings.length} valid holdings`);

// Generate the JavaScript file
const jsContent = `// Auto-generated holdings data from CSV
export const csvHoldings = ${JSON.stringify(transformedHoldings, null, 2)};

export default csvHoldings;
`;

// Write to src/data directory
const outputPath = path.join(__dirname, 'src', 'data', 'csv_holdings.js');
fs.writeFileSync(outputPath, jsContent);

console.log(`✅ Holdings data written to: ${outputPath}`);
console.log(`📊 Total holdings: ${transformedHoldings.length}`);
console.log(`📈 Sample holdings:`, transformedHoldings.slice(0, 3)); 