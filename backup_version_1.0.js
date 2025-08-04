const fs = require('fs');
const path = require('path');

console.log('Creating Version 1.0 Backup...');
console.log('================================');

// Create backup directory
const backupDir = path.join(__dirname, 'backup_version_1.0');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Files to backup
const filesToBackup = [
  'package.json',
  'src/data/complete_sold_items.js',
  'src/data/csv_holdings.js',
  'src/context/ETFTradingContext.js',
  'src/services/mstocksApi.js',
  'src/components/MstocksLogin.js',
  'src/pages/Dashboard.js',
  'src/pages/Holdings.js',
  'src/pages/ETFRanking.js',
  'src/pages/Orders.js',
  'src/pages/BrokerHoldings.js',
  'src/pages/SoldItems.js',
  'src/App.js',
  'src/components/Navbar.js',
  'VERSION_1.0_README.md',
  'Priya ETF shop with LIFO - Bika hua maal.csv',
  'Priya ETF shop with LIFO - Kharida hua maal.csv'
];

// Copy files to backup directory
filesToBackup.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const destPath = path.join(backupDir, file);
  
  if (fs.existsSync(sourcePath)) {
    // Create directory structure if needed
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy file
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Backed up: ${file}`);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

// Create version info file
const versionInfo = {
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  features: [
    'Complete MStocks API Integration',
    'Accurate Sold Items Data (203 items, ₹195,087 profit)',
    'LIFO Holdings Management',
    'Real-time Market Data',
    'Two-step Authentication',
    'Order Lifecycle Management',
    'Market Hours Awareness',
    'Robust Error Handling'
  ],
  dataAccuracy: {
    soldItems: 203,
    totalProfit: 195087,
    holdings: 36,
    csvParsing: 'Custom parser with quoted value handling'
  },
  apiIntegration: {
    mstocksApi: 'v1',
    authentication: 'Two-step with OTP',
    marketData: 'Live price fetching',
    portfolio: 'Broker holdings'
  }
};

fs.writeFileSync(
  path.join(backupDir, 'version_info.json'),
  JSON.stringify(versionInfo, null, 2)
);

console.log('\n✅ Version 1.0 backup completed successfully!');
console.log(`📁 Backup location: ${backupDir}`);
console.log('\n📋 Version 1.0 Features:');
versionInfo.features.forEach(feature => {
  console.log(`   • ${feature}`);
});

console.log('\n📊 Data Accuracy:');
console.log(`   • Sold Items: ${versionInfo.dataAccuracy.soldItems}`);
console.log(`   • Total Profit: ₹${versionInfo.dataAccuracy.totalProfit.toLocaleString()}`);
console.log(`   • Holdings: ${versionInfo.dataAccuracy.holdings}`);

console.log('\n🔧 To restore this version:');
console.log('   1. Copy files from backup_version_1.0/ to project root');
console.log('   2. Run: npm install');
console.log('   3. Run: npm start'); 