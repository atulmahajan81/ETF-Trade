const fs = require('fs');

// Read the HTML file
const html = fs.readFileSync('Bika hua maal.html', 'utf8');

// Extract all sold items data
const soldItems = [];

// Find all table rows that contain sold item data
const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/g;
const rows = html.match(rowPattern);

if (rows) {
  let itemId = 1;
  
  for (const row of rows) {
    // Look for rows that contain date patterns (buy and sell dates)
    const dateMatches = row.match(/([0-9]{2}-[A-Za-z]{3}-[0-9]{2})/g);
    
    if (dateMatches && dateMatches.length >= 2) {
      // Extract symbol and name using more specific patterns
      const symbolMatches = row.match(/<td[^>]*class="s19"[^>]*>([^<]+)<\/td>/g);
      const numericMatches = row.match(/<td[^>]*class="s1"[^>]*>([0-9.,]+)<\/td>/g);
      
      if (symbolMatches && numericMatches) {
        let symbol, name, buyPrice, quantity, investedAmount, sellPrice;
        
        if (symbolMatches.length >= 2 && numericMatches.length >= 4) {
          // Format 1: 2 symbol matches, 4+ numeric values
          symbol = symbolMatches[0].replace(/<[^>]*>/g, '').trim();
          name = symbolMatches[1].replace(/<[^>]*>/g, '').trim();
          
          const values = numericMatches.map(match => 
            parseFloat(match.replace(/<[^>]*>/g, '').replace(/,/g, ''))
          ).filter(val => !isNaN(val));
          
          if (values.length >= 4) {
            buyPrice = values[0];
            quantity = Math.round(values[1]);
            investedAmount = values[2];
            sellPrice = values[3];
          }
        } else if (symbolMatches.length === 1 && numericMatches.length >= 10) {
          // Format 2: 1 symbol match, 10+ numeric values
          symbol = symbolMatches[0].replace(/<[^>]*>/g, '').trim();
          name = symbol; // Use symbol as name for now
          
          const values = numericMatches.map(match => 
            parseFloat(match.replace(/<[^>]*>/g, '').replace(/,/g, ''))
          ).filter(val => !isNaN(val));
          
          if (values.length >= 4) {
            buyPrice = values[0];
            quantity = Math.round(values[1]);
            investedAmount = values[2];
            sellPrice = values[3];
          }
        }
        
        // Validate the data before adding - more strict validation
        if (buyPrice && sellPrice && quantity && buyPrice > 0 && sellPrice > 0 && quantity > 0) {
          // More realistic validation for ETF trading data
          if (quantity <= 5000 && buyPrice <= 1000 && sellPrice <= 1000 && 
              investedAmount > 0 && investedAmount <= 50000 &&
              buyPrice >= 1 && sellPrice >= 1) {
            
            const profit = (sellPrice - buyPrice) * quantity;
            const profitPercentage = ((sellPrice - buyPrice) / buyPrice) * 100;
            
            // Additional validation for profit percentage
            if (profitPercentage >= -50 && profitPercentage <= 100) {
              
              // Determine sector based on symbol/name
              let sector = 'Other';
              if (name.includes('Nifty 50') || name.includes('Nifty50')) sector = 'Nifty 50';
              else if (name.includes('Bank') || name.includes('Nifty Bank')) sector = 'Bank';
              else if (name.includes('IT') || name.includes('Technology')) sector = 'IT';
              else if (name.includes('Pharma') || name.includes('Healthcare')) sector = 'Healthcare';
              else if (name.includes('Gold')) sector = 'Gold';
              else if (name.includes('Silver')) sector = 'Silver';
              else if (name.includes('Midcap')) sector = 'Midcap';
              else if (name.includes('Smallcap')) sector = 'Smallcap';
              else if (name.includes('International') || name.includes('US') || name.includes('Nasdaq')) sector = 'International';
              else if (name.includes('Consumer') || name.includes('FMCG')) sector = 'Consumer';
              else if (name.includes('Financial') || name.includes('BFSI')) sector = 'Financial Services';
              else if (name.includes('PSU Bank')) sector = 'PSU Bank';
              else if (name.includes('Auto')) sector = 'Auto';
              else if (name.includes('ESG')) sector = 'ESG';
              else if (name.includes('Value')) sector = 'Value';
              else if (name.includes('Quality')) sector = 'Quality';
              else if (name.includes('Momentum')) sector = 'Momentum';
              else if (name.includes('Next 50')) sector = 'Next 50';
              else if (name.includes('CPSE')) sector = 'CPSE';
              else if (name.includes('Alpha')) sector = 'Alpha';
              else if (name.includes('BSE')) sector = 'BSE';
              
              soldItems.push({
                id: `sold_${itemId.toString().padStart(3, '0')}`,
                symbol: symbol,
                name: name,
                sector: sector,
                buyDate: `20${dateMatches[0].split('-')[2]}-${getMonthNumber(dateMatches[0].split('-')[1])}-${dateMatches[0].split('-')[0]}`,
                sellDate: `20${dateMatches[1].split('-')[2]}-${getMonthNumber(dateMatches[1].split('-')[1])}-${dateMatches[1].split('-')[0]}`,
                buyPrice: buyPrice,
                sellPrice: sellPrice,
                quantity: quantity,
                totalInvested: Math.round(investedAmount),
                profit: Math.round(profit),
                profitPercentage: Math.round(profitPercentage * 100) / 100,
                sellReason: 'Target Profit Achieved'
              });
              
              itemId++;
            }
          }
        }
      } else if (numericMatches && numericMatches.length >= 8) {
        // Format 3 & 4: No symbol matches but has numeric data (8+ numeric values)
        // These rows have the same data structure but symbol/name is in softmerge cells
        const values = numericMatches.map(match => 
          parseFloat(match.replace(/<[^>]*>/g, '').replace(/,/g, ''))
        ).filter(val => !isNaN(val));
        
        if (values.length >= 4) {
          const buyPrice = values[0];
          const quantity = Math.round(values[1]);
          const investedAmount = values[2];
          const sellPrice = values[3];
          
          // More strict validation for these rows
          if (buyPrice && sellPrice && quantity && buyPrice > 0 && sellPrice > 0 && quantity > 0) {
            // More realistic validation for ETF trading data
            if (quantity <= 5000 && buyPrice <= 1000 && sellPrice <= 1000 && 
                investedAmount > 0 && investedAmount <= 50000 &&
                buyPrice >= 1 && sellPrice >= 1) {
              
              const profit = (sellPrice - buyPrice) * quantity;
              const profitPercentage = ((sellPrice - buyPrice) / buyPrice) * 100;
              
              // Additional validation for profit percentage
              if (profitPercentage >= -50 && profitPercentage <= 100) {
                
                // Try to infer symbol/name from the data or use a placeholder
                const symbol = `ETF_${itemId}`;
                const name = `ETF ${itemId}`;
                
                soldItems.push({
                  id: `sold_${itemId.toString().padStart(3, '0')}`,
                  symbol: symbol,
                  name: name,
                  sector: 'Other',
                  buyDate: `20${dateMatches[0].split('-')[2]}-${getMonthNumber(dateMatches[0].split('-')[1])}-${dateMatches[0].split('-')[0]}`,
                  sellDate: `20${dateMatches[1].split('-')[2]}-${getMonthNumber(dateMatches[1].split('-')[1])}-${dateMatches[1].split('-')[0]}`,
                  buyPrice: buyPrice,
                  sellPrice: sellPrice,
                  quantity: quantity,
                  totalInvested: Math.round(investedAmount),
                  profit: Math.round(profit),
                  profitPercentage: Math.round(profitPercentage * 100) / 100,
                  sellReason: 'Target Profit Achieved'
                });
                
                itemId++;
              }
            }
          }
        }
      }
    }
  }
}

// Helper function to convert month names to numbers
function getMonthNumber(monthName) {
  const months = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  return months[monthName] || '01';
}

// Sort by sell date
soldItems.sort((a, b) => new Date(a.sellDate) - new Date(b.sellDate));

// Generate the JavaScript array
const jsArray = `const sampleSoldItems = ${JSON.stringify(soldItems, null, 2)};`;

// Write to file
fs.writeFileSync('complete_sold_items.js', jsArray);

console.log(`Extracted ${soldItems.length} sold items`);
console.log('Data written to complete_sold_items.js');

// Calculate total profit
const totalProfit = soldItems.reduce((sum, item) => sum + item.profit, 0);
console.log(`Total profit: ${totalProfit}`);

// Show sample entries
console.log('\nSample entries:');
soldItems.slice(0, 5).forEach(item => {
  console.log(`${item.id}: ${item.symbol} - ${item.name} (${item.sector})`);
  console.log(`  Buy: ${item.buyDate} @ ${item.buyPrice}, Sell: ${item.sellDate} @ ${item.sellPrice}`);
  console.log(`  Quantity: ${item.quantity}, Profit: ${item.profit} (${item.profitPercentage}%)`);
  console.log('');
});

// Show date range
if (soldItems.length > 0) {
  const firstDate = new Date(soldItems[0].buyDate);
  const lastDate = new Date(soldItems[soldItems.length - 1].sellDate);
  console.log(`Date range: ${firstDate.toDateString()} to ${lastDate.toDateString()}`);
}

// Show monthly breakdown
const monthlyBreakdown = {};
soldItems.forEach(item => {
  const month = item.sellDate.substring(0, 7); // YYYY-MM
  if (!monthlyBreakdown[month]) {
    monthlyBreakdown[month] = { count: 0, profit: 0 };
  }
  monthlyBreakdown[month].count++;
  monthlyBreakdown[month].profit += item.profit;
});

console.log('\nMonthly breakdown:');
Object.keys(monthlyBreakdown).sort().forEach(month => {
  const data = monthlyBreakdown[month];
  console.log(`${month}: ${data.count} items, ₹${data.profit.toLocaleString()} profit`);
}); 