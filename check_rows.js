const fs = require('fs');

const html = fs.readFileSync('Bika hua maal.html', 'utf8');
const allRows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g);
console.log('Total rows found:', allRows ? allRows.length : 0);

const dataRows = allRows.filter(row => row.includes('class="s1"'));
console.log('Data rows found:', dataRows.length);

const dateRows = allRows.filter(row => row.match(/([0-9]{2}-[A-Za-z]{3}-[0-9]{2})/g));
console.log('Rows with dates found:', dateRows.length); 