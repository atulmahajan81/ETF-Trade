const fs = require('fs');

const html = fs.readFileSync('Bika hua maal.html', 'utf8');
const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/g;
const rows = html.match(rowPattern);

console.log('Looking for rows with unrealistic sell prices...\n');

if (rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const dateMatches = row.match(/([0-9]{2}-[A-Za-z]{3}-[0-9]{2})/g);
    
    if (dateMatches && dateMatches.length >= 2) {
      const numericMatches = row.match(/<td[^>]*class="s1"[^>]*>([0-9.,]+)<\/td>/g);
      
      if (numericMatches) {
        const values = numericMatches.map(match => 
          parseFloat(match.replace(/<[^>]*>/g, '').replace(/,/g, ''))
        ).filter(val => !isNaN(val));
        
        // Look for unrealistic sell prices (values > 1000)
        if (values.length >= 4 && values[3] > 1000) {
          console.log(`Row ${i}: Unrealistic sell price detected`);
          console.log(`  Dates: ${dateMatches.join(', ')}`);
          console.log(`  Values: ${values.slice(0, 10).join(', ')}`);
          console.log(`  Sell price (4th value): ${values[3]}`);
          
          // Show the raw HTML for this row
          console.log(`  Raw HTML (first 200 chars): ${row.substring(0, 200)}...`);
          console.log('');
          
          if (i > 200) break; // Only show first few examples
        }
      }
    }
  }
} 