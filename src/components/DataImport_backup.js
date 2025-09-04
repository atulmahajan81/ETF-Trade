import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Download, X, ExternalLink } from 'lucide-react';
import { useETFTrading } from '../context/ETFTradingContext';
import { Link } from 'react-router-dom';

const DataImport = ({ onImportComplete }) => {
  const { dispatch, actionTypes } = useETFTrading();
  const [holdingsFile, setHoldingsFile] = useState(null);
  const [soldItemsFile, setSoldItemsFile] = useState(null);
  const [importStatus, setImportStatus] = useState('idle'); // idle, loading, success, error
  const [importResults, setImportResults] = useState({
    holdings: { total: 0, imported: 0, errors: [] },
    soldItems: { total: 0, imported: 0, errors: [] }
  });

  // Debug logging
  console.log('DataImport component rendered');
  console.log('Current state:', { holdingsFile, soldItemsFile, importStatus });

  const handleFileSelect = (file, type) => {
    console.log('File selected:', { file, type, fileName: file?.name, fileType: file?.type });
    
    if (file && file.type === 'text/csv') {
      console.log(`Setting ${type} file:`, file.name);
      if (type === 'holdings') {
        setHoldingsFile(file);
        console.log('Holdings file set successfully');
      } else if (type === 'soldItems') {
        setSoldItemsFile(file);
        console.log('Sold items file set successfully');
      }
    } else {
      console.error('Invalid file type:', file?.type);
      alert('Please select a valid CSV file');
    }
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    // Map header names to expected field names
    const headerMapping = {
      'Buy Date': 'buyDate',
      'ETF Code': 'symbol',
      'Underlying Asset': 'underlyingAsset',
      'Buy Price': 'buyPrice',
      'Actual Buy Qty': 'actualBuyQty',
      'Sell Price': 'sellPrice',
      'Sell Date': 'sellDate'
      // Note: 'Invested amount' and 'Invested Amount' are ignored since we calculate automatically
    };
    
    console.log('Original headers:', headers);
    
    // Helper function to parse CSV line with comma handling
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      // Add the last field
      result.push(current.trim());
      return result;
    };
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        
        headers.forEach((header, index) => {
          const mappedField = headerMapping[header];
          
          // Only process fields that are in our mapping (ignore invested amount)
          if (mappedField) {
            let value = values[index] || '';
            
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            
            // Remove commas from numbers
            if (mappedField === 'buyPrice' || mappedField === 'sellPrice') {
              value = value.replace(/,/g, '');
            }
            
            row[mappedField] = value;
          }
          // Skip 'Invested amount' and 'Invested Amount' columns - they will be calculated automatically
        });
        
        console.log(`Row ${i + 1} mapped:`, row);
        data.push(row);
      }
    }
    
    console.log('Parsed data with mapping:', data);
    return data;
  };

  const validateHoldingsData = (data) => {
    const requiredFields = ['buyDate', 'symbol', 'underlyingAsset', 'buyPrice', 'actualBuyQty'];
    const errors = [];
    const validData = [];

    data.forEach((row, index) => {
      const rowErrors = [];
      
      requiredFields.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          rowErrors.push(`Missing ${field}`);
        }
      });

      if (row.buyPrice && isNaN(parseFloat(row.buyPrice))) {
        rowErrors.push('Invalid buy price');
      }

      if (row.actualBuyQty && isNaN(parseInt(row.actualBuyQty))) {
        rowErrors.push('Invalid quantity');
      }

      if (rowErrors.length > 0) {
        errors.push({ row: index + 2, errors: rowErrors, data: row });
      } else {
        const buyPrice = parseFloat(row.buyPrice);
        const quantity = parseInt(row.actualBuyQty);
        const totalInvested = buyPrice * quantity;

        validData.push({
          id: `holding_${Date.now()}_${index}`,
          symbol: row.symbol,
          name: row.underlyingAsset || row.symbol,
          sector: row.sector || 'ETF',
          buyDate: row.buyDate,
          buyPrice: buyPrice,
          quantity: quantity,
          totalInvested: totalInvested,
          avgPrice: buyPrice,
          currentPrice: buyPrice, // Will be updated with real-time data
          currentValue: totalInvested,
          profitLoss: 0,
          profitPercentage: 0,
          lastBuyPrice: buyPrice,
          lastBuyDate: row.buyDate
        });
      }
    });

    return { validData, errors };
  };

  const validateSoldItemsData = (data) => {
    const requiredFields = ['buyDate', 'symbol', 'underlyingAsset', 'buyPrice', 'actualBuyQty', 'sellPrice', 'sellDate'];
    const errors = [];
    const validData = [];

    data.forEach((row, index) => {
      const rowErrors = [];
      
      requiredFields.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          rowErrors.push(`Missing ${field}`);
        }
      });

      if (row.buyPrice && isNaN(parseFloat(row.buyPrice))) {
        rowErrors.push('Invalid buy price');
      }

      if (row.sellPrice && isNaN(parseFloat(row.sellPrice))) {
        rowErrors.push('Invalid sell price');
      }

      if (row.actualBuyQty && isNaN(parseInt(row.actualBuyQty))) {
        rowErrors.push('Invalid quantity');
      }

      if (rowErrors.length > 0) {
        errors.push({ row: index + 2, errors: rowErrors, data: row });
      } else {
        const buyPrice = parseFloat(row.buyPrice);
        const sellPrice = parseFloat(row.sellPrice);
        const quantity = parseInt(row.actualBuyQty);
        const investedAmount = buyPrice * quantity; // Calculate automatically
        const profit = (sellPrice - buyPrice) * quantity; // Calculate profit correctly

        validData.push({
          id: `sold_${Date.now()}_${index}`,
          symbol: row.symbol,
          name: row.underlyingAsset || row.symbol,
          sector: row.sector || 'ETF',
          buyDate: row.buyDate,
          sellDate: row.sellDate,
          buyPrice: buyPrice,
          sellPrice: sellPrice,
          quantity: quantity,
          investedAmount: investedAmount, // Add calculated invested amount
          profit: profit,
          reason: row.reason || 'Target achieved'
        });
      }
    });

    return { validData, errors };
  };

  const handleImport = async () => {
    setImportStatus('loading');
    const results = {
      holdings: { total: 0, imported: 0, errors: [], data: [] },
      soldItems: { total: 0, imported: 0, errors: [], data: [] }
    };

    try {
      // Clear existing data first
      console.log('Clearing existing holdings and sold items...');
      dispatch({ type: actionTypes.CLEAR_HOLDINGS });
      dispatch({ type: actionTypes.CLEAR_SOLD_ITEMS });

      // Import holdings
      if (holdingsFile) {
        console.log('Processing holdings file:', holdingsFile.name);
        const holdingsText = await holdingsFile.text();
        console.log('Holdings CSV content:', holdingsText);
        
        const holdingsData = parseCSV(holdingsText);
        console.log('Parsed holdings data:', holdingsData);
        
        const { validData: validHoldings, errors: holdingsErrors } = validateHoldingsData(holdingsData);
        console.log('Valid holdings:', validHoldings);
        console.log('Holdings errors:', holdingsErrors);
        
        results.holdings.total = holdingsData.length;
        results.holdings.imported = validHoldings.length;
        results.holdings.errors = holdingsErrors;
        results.holdings.data = validHoldings;

        // Add valid holdings to state
        validHoldings.forEach(holding => {
          console.log('Adding holding to state:', holding);
          dispatch({ type: actionTypes.ADD_HOLDING, payload: holding });
        });
      }

      // Import sold items
      if (soldItemsFile) {
        console.log('Processing sold items file:', soldItemsFile.name);
        const soldItemsText = await soldItemsFile.text();
        console.log('Sold items CSV content:', soldItemsText);
        
        const soldItemsData = parseCSV(soldItemsText);
        console.log('Parsed sold items data:', soldItemsData);
        
        const { validData: validSoldItems, errors: soldItemsErrors } = validateSoldItemsData(soldItemsData);
        console.log('Valid sold items:', validSoldItems);
        console.log('Sold items errors:', soldItemsErrors);
        
        results.soldItems.total = soldItemsData.length;
        results.soldItems.imported = validSoldItems.length;
        results.soldItems.errors = soldItemsErrors;
        results.soldItems.data = validSoldItems;

        // Add valid sold items to state
        validSoldItems.forEach(item => {
          console.log('Adding sold item to state:', item);
          dispatch({ type: actionTypes.ADD_SOLD_ITEM, payload: item });
        });
      }

      console.log('Import completed successfully:', results);
      setImportResults(results);
      setImportStatus('success');
      
      if (onImportComplete) {
        onImportComplete(results);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
    }
  };

  const downloadTemplate = (type) => {
    let csvContent = '';
    
    if (type === 'holdings') {
      csvContent = 'Buy Date,ETF Code,Underlying Asset,Buy Price,Actual Buy Qty\n';
      csvContent += '06-Jun-24,NSE:PSUBANK,Nifty PSU Bank,721.00,20\n';
      csvContent += '07-Jun-24,NSE:PSUBNKBEES,PSU Bank ETF,80.50,180\n';
    } else {
      csvContent = 'Buy Date,ETF Code,Underlying Asset,Buy Price,Actual Buy Qty,Sell Price,Sell Date\n';
      csvContent += '06-Jun-24,NSE:PSUBANK,Nifty PSU Bank,721.00,20,750.00,15-Jun-24\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFiles = () => {
    setHoldingsFile(null);
    setSoldItemsFile(null);
    setImportStatus('idle');
    setImportResults({
      holdings: { total: 0, imported: 0, errors: [], data: [] },
      soldItems: { total: 0, imported: 0, errors: [], data: [] }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Import Your Data</h2>
        <button
          onClick={clearFiles}
          className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
          <span>Clear All</span>
        </button>
      </div>

      {/* File Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holdings Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Holdings Data</h3>
            <button
              onClick={() => downloadTemplate('holdings')}
              className="flex items-center space-x-2 text-blue-500 hover:text-blue-600"
            >
              <Download className="w-4 h-4" />
              <span>Template</span>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center relative bg-blue-50">
              {holdingsFile ? (
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{holdingsFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(holdingsFile.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-xs text-blue-600 font-medium">✓ Holdings file selected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-blue-400 mx-auto" />
                  <p className="text-sm text-gray-600 font-medium">Drop your holdings CSV file here</p>
                  <p className="text-xs text-gray-500">or click to browse</p>
                  <p className="text-xs text-blue-600">📁 Select holdings file</p>
                </div>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileSelect(e.target.files[0], 'holdings')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="holdings-file-input"
              />
            </div>
            
            <div className="text-xs text-gray-500">
              <p><strong>Required columns:</strong> Buy Date, ETF Code, Underlying Asset, Buy Price, Actual Buy Qty</p>
              <p>Other fields will be calculated automatically</p>
              <p className="text-yellow-600 mt-1"><strong>Note:</strong> This will replace all existing holdings data</p>
            </div>
          </div>
        </div>

        {/* Sold Items Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sold Items Data</h3>
            <button
              onClick={() => downloadTemplate('soldItems')}
              className="flex items-center space-x-2 text-green-500 hover:text-green-600"
            >
              <Download className="w-4 h-4" />
              <span>Template</span>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center relative bg-green-50">
              {soldItemsFile ? (
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{soldItemsFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(soldItemsFile.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-xs text-green-600 font-medium">✓ Sold items file selected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-green-400 mx-auto" />
                  <p className="text-sm text-gray-600 font-medium">Drop your sold items CSV file here</p>
                  <p className="text-xs text-gray-500">or click to browse</p>
                  <p className="text-xs text-green-600">📁 Select sold items file</p>
                </div>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileSelect(e.target.files[0], 'soldItems')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="sold-items-file-input"
              />
            </div>
            
            <div className="text-xs text-gray-500">
              <p><strong>Required columns:</strong> Buy Date, ETF Code, Underlying Asset, Buy Price, Actual Buy Qty, Sell Price, Sell Date</p>
              <p>Invested amount and profit will be calculated automatically</p>
              <p className="text-yellow-600 mt-1"><strong>Note:</strong> This will replace all existing sold items data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Button */}
      <div className="flex flex-col items-center space-y-4">
        {/* Warning about data replacement */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Importing will replace all existing holdings and sold items data.
            </p>
          </div>
        </div>
        
        <button
          onClick={handleImport}
          disabled={((!holdingsFile && !soldItemsFile) || importStatus === 'loading')}
          className={`px-8 py-3 rounded-md font-medium transition-colors ${
            ((!holdingsFile && !soldItemsFile) || importStatus === 'loading')
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {importStatus === 'loading' ? 'Importing...' : 'Import Data'}
        </button>
      </div>

      {/* Import Results */}
      {importStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
            <h3 className="text-lg font-medium text-green-900">Import Completed Successfully!</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-900 mb-2">Holdings</h4>
              <div className="space-y-1 text-sm text-green-700">
                <div>Total records: {importResults.holdings.total}</div>
                <div>Successfully imported: {importResults.holdings.imported}</div>
                <div>Errors: {importResults.holdings.errors.length}</div>
              </div>
              {importResults.holdings.data.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-green-800 mb-2">Imported Holdings:</h5>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResults.holdings.data.map((holding, index) => (
                      <div key={index} className="text-xs text-green-600 bg-green-100 p-2 rounded">
                        {holding.symbol} - {holding.name} (Qty: {holding.quantity})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-green-900 mb-2">Sold Items</h4>
              <div className="space-y-1 text-sm text-green-700">
                <div>Total records: {importResults.soldItems.total}</div>
                <div>Successfully imported: {importResults.soldItems.imported}</div>
                <div>Errors: {importResults.soldItems.errors.length}</div>
              </div>
              {importResults.soldItems.data.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-green-800 mb-2">Imported Sold Items:</h5>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResults.soldItems.data.map((item, index) => (
                      <div key={index} className="text-xs text-green-600 bg-green-100 p-2 rounded">
                        {item.symbol} - {item.name} (Profit: ₹{item.profit?.toFixed(2) || '0'})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700 mb-3">
              ✅ Data has been successfully imported and has replaced all existing data in the <strong>Holdings</strong> and <strong>Sold Items</strong> tabs.
            </p>
            <div className="flex space-x-3">
              {importResults.holdings.imported > 0 && (
                <Link
                  to="/holdings"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Holdings ({importResults.holdings.imported})</span>
                </Link>
              )}
              {importResults.soldItems.imported > 0 && (
                <Link
                  to="/sold-items"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Sold Items ({importResults.soldItems.imported})</span>
                </Link>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <Link
                to="/"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <span>Continue to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {importStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-red-900">Import Failed</h3>
          </div>
          <p className="text-red-700 mb-4">There was an error during import. Please check your file format and try again.</p>
          <div className="flex space-x-3">
            <button
              onClick={clearFiles}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Clear Files & Try Again
            </button>
            <button
              onClick={() => setImportStatus('idle')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Error Details */}
      {(importResults.holdings.errors.length > 0 || importResults.soldItems.errors.length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-900 mb-4">Import Errors</h3>
          
          {importResults.holdings.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-yellow-900 mb-2">Holdings Errors:</h4>
              <div className="space-y-2">
                {importResults.holdings.errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm text-yellow-700">
                    <strong>Row {error.row}:</strong> {error.errors.join(', ')}
                  </div>
                ))}
                {importResults.holdings.errors.length > 5 && (
                  <div className="text-sm text-yellow-600">
                    ... and {importResults.holdings.errors.length - 5} more errors
                  </div>
                )}
              </div>
            </div>
          )}
          
          {importResults.soldItems.errors.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">Sold Items Errors:</h4>
              <div className="space-y-2">
                {importResults.soldItems.errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm text-yellow-700">
                    <strong>Row {error.row}:</strong> {error.errors.join(', ')}
                  </div>
                ))}
                {importResults.soldItems.errors.length > 5 && (
                  <div className="text-sm text-yellow-600">
                    ... and {importResults.soldItems.errors.length - 5} more errors
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataImport; 