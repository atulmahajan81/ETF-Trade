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

  // Google Sheets import states
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [sheetsImportStatus, setSheetsImportStatus] = useState('idle');
  const [sheetDetectionStatus, setSheetDetectionStatus] = useState('idle');

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

     const parseCSV = (csvText, sheetName = 'Unknown Sheet') => {
     const lines = csvText.split('\n').filter(line => line.trim() !== '');
     if (lines.length === 0) return [];
     
     console.log(`\n📋 Processing sheet: "${sheetName}"`);
     console.log(`   - Total lines in CSV: ${lines.length}`);
    
    // Find the actual data section by looking for the line that contains "ETF Code"
    let headerRowIndex = -1;
    let headers = [];
    
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];
      if (line.includes('ETF Code') || line.includes('Symbol') || line.includes('Code') || 
          line.includes('Buy Date') || line.includes('Underlying Asset')) {
        headers = line.split(',').map(h => h.trim().replace(/"/g, ''));
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      // Fallback: use Column_X headers
      const firstLine = lines[0];
      const fieldCount = firstLine.split(',').length;
      headers = Array.from({ length: fieldCount }, (_, i) => `Column_${i + 1}`);
      headerRowIndex = -1; // Start from first line
      console.log(`⚠️ [${sheetName}] No header row found, using Column_X fallback with ${fieldCount} columns`);
    }
    
    const data = [];
    const startIndex = headerRowIndex + 1;
    
               // Map header names to expected field names - Enhanced for your Google Sheets format
      const headerMapping = {
        // Primary field mappings for your format
        'Buy Date': 'buyDate',
        'ETF Code': 'symbol',
        'Underlying Asset': 'underlyingAsset', 
        'Buy Price': 'buyPrice',
        'Actual Buy Qty': 'actualBuyQty',
        'Suggested Qty': 'suggestedQty',
        'Invested amount': 'investedAmount',
        'Sell Price': 'sellPrice',
        'Sell Date': 'sellDate',
        
        // Alternative field names (common variations)
        'Symbol': 'symbol',
        'Code': 'symbol',
        'Name': 'underlyingAsset',
        'Asset': 'underlyingAsset',
        'Price': 'buyPrice',
        'Purchase Price': 'buyPrice',
        'Quantity': 'actualBuyQty',
        'Qty': 'actualBuyQty',
        'Sell Date - Year-Month': 'sellDate',
        'Date': 'buyDate',
        'Invested amt on this date': 'investedAmountOnDate',
        'Amount': 'investedAmount',
        
        // Column fallbacks for sheets without headers
        'Column_1': 'buyDate',
        'Column_2': 'symbol',
        'Column_3': 'underlyingAsset',
        'Column_4': 'buyPrice',
        'Column_5': 'actualBuyQty',
        'Column_6': 'suggestedQty',
        'Column_7': 'investedAmount',
        'Column_8': 'sellPrice',
        'Column_9': 'sellDate',
        
        // Additional common field variations
        'Purchase Date': 'buyDate',
        'Trade Date': 'buyDate',
        'Transaction Date': 'buyDate',
        'Stock Symbol': 'symbol',
        'Ticker': 'symbol',
        'Security': 'symbol',
        'Fund Name': 'underlyingAsset',
        'ETF Name': 'underlyingAsset',
        'Investment Name': 'underlyingAsset',
        'Cost Price': 'buyPrice',
        'Entry Price': 'buyPrice',
        'Units': 'actualBuyQty',
        'Shares': 'actualBuyQty',
        'No of Units': 'actualBuyQty',
        'Exit Price': 'sellPrice',
        'Sale Price': 'sellPrice',
        'Exit Date': 'sellDate',
        'Sale Date': 'sellDate',
        'Total Investment': 'investedAmount',
        'Total Cost': 'investedAmount',
        'Investment Value': 'investedAmount'
        // Note: We'll use the invested amount from the sheet if available, otherwise calculate automatically
      };
     
     // Debug: Log the header mapping process
     console.log(`🔍 [${sheetName}] Header mapping debug:`, {
       headers: headers,
       headerMapping: headerMapping
     });
    
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
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      
             // Skip empty lines and metadata/educational lines
       if (!line) {
         console.log(`⏭️ [${sheetName}] Row ${i + 1} skipped: Empty line`);
         continue;
       }
       
       // Only skip obvious non-data lines, but allow educational content mixed with data
       const skipPatterns = [
         'Row', 'formulas', 'hidden', 'Do not delete', 'Total Capital'
       ];
       
       if (skipPatterns.some(pattern => line.toLowerCase().includes(pattern.toLowerCase()))) {
         console.log(`⏭️ [${sheetName}] Row ${i + 1} skipped: Metadata line - "${line.substring(0, 50)}..."`);
         continue;
       }
      
      const values = parseCSVLine(line);
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
           
           // Debug logging for all field mappings
           console.log(`🔍 [${sheetName}] Row ${i + 1} - Field mapping:`, {
             header: header,
             originalValue: values[index],
             cleanedValue: value,
             mappedField: mappedField
           });
        } else {
          console.log(`⏭️ [${sheetName}] Row ${i + 1} - Skipping unmapped header: "${header}" with value: "${values[index]}"`);
        }
        // Skip 'Invested amount' and 'Invested Amount' columns - they will be calculated automatically
      });
      
                    // Enhanced data extraction is disabled to prevent overriding correctly mapped data
       // The header mapping should handle all the data correctly
               console.log(`🔍 [${sheetName}] Row ${i + 1} - Final mapped data:`, {
          symbol: row.symbol,
          buyPrice: row.buyPrice,
          sellPrice: row.sellPrice,
          actualBuyQty: row.actualBuyQty,
          buyDate: row.buyDate,
          sellDate: row.sellDate,
          underlyingAsset: row.underlyingAsset,
          investedAmount: row.investedAmount
        });
      
             // More lenient validation - allow rows with any meaningful data
       const hasSymbol = row.symbol && row.symbol.trim() !== '';
       const hasValidPrice = row.buyPrice && !isNaN(parseFloat(row.buyPrice)) && parseFloat(row.buyPrice) > 0;
       const hasValidQuantity = row.actualBuyQty && !isNaN(parseInt(row.actualBuyQty)) && parseInt(row.actualBuyQty) > 0;
       const hasDate = row.buyDate && row.buyDate.trim() !== '';
       const hasUnderlyingAsset = row.underlyingAsset && row.underlyingAsset.trim() !== '';
       
       // Check for ETF codes with or without NSE: prefix
       const hasETFCode = hasSymbol && (() => {
         const str = row.symbol.toString().toUpperCase();
         // Check for NSE: prefix OR common ETF suffixes
         return str.includes('NSE:') || 
                str.includes('BEES') || 
                str.includes('ETF') || 
                str.includes('IETF') ||
                // Common ETF symbols without NSE: prefix
                ['MAFANG', 'BFSI', 'ESG', 'PHARMABEES', 'HEALTHY', 'HEALTHIETF', 'ITBEES', 'KOTAKIT', 
                 'MON100', 'MOMOMENTUM', 'HDFCSML250', 'AUTOBEES', 'MASPTOP50', 'CONSUMIETF', 'CONSUMBEES',
                 'GOLDBEES', 'SETFGOLD', 'KOTAKGOLD', 'MONQ50', 'GOLDIETF', 'HDFCSILVER', 'SILVERBEES',
                 'SILVERIETF', 'CPSEETF', 'PSUBNKBEES', 'BSE500IETF', 'PSUBANK', 'ALPHA', 'SETFNIFBK',
                 'BANKBEES', 'HDFCMID150', 'MIDSELIETF', 'HNGSNGBEES', 'MAHKTECH', 'MIDQ50ADD', 'MIDCAPIETF',
                 'MOM100', 'MID150BEES', 'NIFTYQLITY', 'EQUAL50ADD', 'SETFNIF50', 'NIFTYBEES', 'FMCGIETF',
                 'HDFCPVTBAN', 'BANKIETF', 'UTINEXT50', 'TNIDETF', 'IT', 'NV20', 'NV20IETF', 'ITIETF',
                 'LOWVOL1', 'LOWVOLIETF', 'DIVOPPBEES', 'MAKEINDIA', 'PSUBNKIETF', 'JUNIORBEES'].includes(str);
       })();
       
       // Include rows with any meaningful trading data (be more permissive)
       const hasAnyTradingData = (hasSymbol && hasETFCode) || 
                                (hasValidPrice && hasValidQuantity) || 
                                (hasDate && (hasSymbol || hasUnderlyingAsset));
       
       if (hasAnyTradingData) {
          console.log(`✅ [${sheetName}] Row ${i + 1} mapped (valid data):`, {
            symbol: row.symbol,
            underlyingAsset: row.underlyingAsset,
            buyPrice: row.buyPrice,
            actualBuyQty: row.actualBuyQty,
            sellPrice: row.sellPrice,
            sellDate: row.sellDate,
            hasETFCode: hasETFCode
          });
          data.push(row);
        } else {
          console.log(`❌ [${sheetName}] Row ${i + 1} skipped (no meaningful data):`, {
            rowData: row,
            reason: 'Row is empty or contains only empty/whitespace values'
          });
        }
    }
    
         console.log(`📊 [${sheetName}] Parsing Summary:`);
     console.log(`   - Total rows processed: ${lines.length - startIndex}`);
     console.log(`   - Rows with valid data: ${data.length}`);
     console.log(`   - Rows filtered out: ${(lines.length - startIndex) - data.length}`);
     console.log(`   - Header row found at line: ${headerRowIndex + 1}`);
     console.log(`   - Data processing started from line: ${startIndex + 1}`);
     console.log(`📋 [${sheetName}] Parsed data with mapping:`, data);
     return data;
  };

     const validateHoldingsData = (data, sheetName = 'Unknown') => {
     const requiredFields = ['symbol']; // Only symbol is absolutely required
     const errors = [];
     const validData = [];
     
     console.log(`\n🔍 [${sheetName}] Validating ${data.length} holdings rows...`);

         data.forEach((row, index) => {
       const rowErrors = [];
       
       // Check for required fields
       requiredFields.forEach(field => {
         if (!row[field] || row[field].trim() === '') {
           rowErrors.push(`Missing ${field}`);
         }
       });

       // Check for required data fields
       if (!row.buyPrice || row.buyPrice.toString().trim() === '') {
         rowErrors.push('Missing buy price');
       }
       
       if (!row.actualBuyQty || row.actualBuyQty.toString().trim() === '') {
         rowErrors.push('Missing quantity');
       }
       
       if (!row.buyDate || row.buyDate.toString().trim() === '') {
         rowErrors.push('Missing buy date');
       }

       // Validate numeric fields
       if (row.buyPrice && isNaN(parseFloat(row.buyPrice))) {
         rowErrors.push('Invalid buy price');
       }

       if (row.actualBuyQty && isNaN(parseInt(row.actualBuyQty))) {
         rowErrors.push('Invalid quantity');
       }

       if (rowErrors.length > 0) {
         console.log(`❌ [${sheetName}] Row ${index + 1} validation failed:`, { errors: rowErrors, data: row });
         errors.push({ row: index + 2, errors: rowErrors, data: row });
              } else {
         // Use ONLY actual data from the sheet - no defaults
         const buyPrice = row.buyPrice && row.buyPrice.toString().trim() !== '' ? parseFloat(row.buyPrice) : null;
         const quantity = row.actualBuyQty && row.actualBuyQty.toString().trim() !== '' ? parseInt(row.actualBuyQty) : null;
         const buyDate = row.buyDate && row.buyDate.toString().trim() !== '' ? row.buyDate : null;
         
         // Use invested amount from sheet if available, otherwise calculate from actual data
         const totalInvested = row.investedAmount && row.investedAmount.toString().trim() !== '' ? parseFloat(row.investedAmount) : (buyPrice && quantity ? buyPrice * quantity : null);

         console.log(`✅ [${sheetName}] Row ${index + 1} validation passed:`, { 
           symbol: row.symbol, 
           buyPrice: buyPrice, 
           quantity: quantity,
           buyDate: buyDate,
           totalInvested: totalInvested,
           originalData: {
             buyPrice: row.buyPrice,
             actualBuyQty: row.actualBuyQty,
             buyDate: row.buyDate,
             investedAmount: row.investedAmount
           },
           dataStatus: {
             hasBuyPrice: buyPrice !== null,
             hasQuantity: quantity !== null,
             hasBuyDate: buyDate !== null,
             hasTotalInvested: totalInvested !== null
           }
         });

         validData.push({
           id: `holding_${Date.now()}_${index}`,
           symbol: row.symbol,
           name: row.underlyingAsset || row.symbol,
           sector: row.sector || 'ETF',
           buyDate: buyDate,
           buyPrice: buyPrice,
           quantity: quantity,
           totalInvested: totalInvested,
           avgPrice: buyPrice,
           currentPrice: buyPrice, // Will be updated with real-time data
           currentValue: totalInvested,
           profitLoss: 0,
           profitPercentage: 0,
           lastBuyPrice: buyPrice,
           lastBuyDate: buyDate
         });
       }
    });

    return { validData, errors };
  };

  const validateSoldItemsData = (data, sheetName = 'Unknown') => {
    const requiredFields = ['symbol']; // Only symbol is absolutely required
    const errors = [];
    const validData = [];
    
    console.log(`\n🔍 [${sheetName}] Validating ${data.length} sold items rows...`);

         data.forEach((row, index) => {
       const rowErrors = [];
       
       // Check for required fields
       requiredFields.forEach(field => {
         if (!row[field] || row[field].trim() === '') {
           rowErrors.push(`Missing ${field}`);
         }
       });

       // Check for required data fields for sold items
       if (!row.buyPrice || row.buyPrice.toString().trim() === '') {
         rowErrors.push('Missing buy price');
       }
       
       if (!row.sellPrice || row.sellPrice.toString().trim() === '') {
         rowErrors.push('Missing sell price');
       }
       
       if (!row.actualBuyQty || row.actualBuyQty.toString().trim() === '') {
         rowErrors.push('Missing quantity');
       }
       
       if (!row.buyDate || row.buyDate.toString().trim() === '') {
         rowErrors.push('Missing buy date');
       }
       
       if (!row.sellDate || row.sellDate.toString().trim() === '') {
         rowErrors.push('Missing sell date');
       }

       // Validate numeric fields
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
         console.log(`❌ [${sheetName}] Row ${index + 1} validation failed:`, { errors: rowErrors, data: row });
         errors.push({ row: index + 2, errors: rowErrors, data: row });
              } else {
         // Use ONLY actual data from the sheet - no defaults
         const buyPrice = row.buyPrice && row.buyPrice.toString().trim() !== '' ? parseFloat(row.buyPrice) : null;
         const sellPrice = row.sellPrice && row.sellPrice.toString().trim() !== '' ? parseFloat(row.sellPrice) : null;
         const quantity = row.actualBuyQty && row.actualBuyQty.toString().trim() !== '' ? parseInt(row.actualBuyQty) : null;
         const buyDate = row.buyDate && row.buyDate.toString().trim() !== '' ? row.buyDate : null;
         const sellDate = row.sellDate && row.sellDate.toString().trim() !== '' ? row.sellDate : null;
         
         // Use invested amount from sheet if available, otherwise calculate from actual data
         const investedAmount = row.investedAmount && row.investedAmount.toString().trim() !== '' ? parseFloat(row.investedAmount) : (buyPrice && quantity ? buyPrice * quantity : null);
         const profit = (sellPrice && buyPrice && quantity) ? (sellPrice - buyPrice) * quantity : null;

         console.log(`✅ [${sheetName}] Row ${index + 1} validation passed:`, { 
           symbol: row.symbol, 
           buyPrice: buyPrice, 
           sellPrice: sellPrice,
           quantity: quantity,
           buyDate: buyDate,
           sellDate: sellDate,
           profit: profit,
           originalData: {
             buyPrice: row.buyPrice,
             sellPrice: row.sellPrice,
             actualBuyQty: row.actualBuyQty,
             buyDate: row.buyDate,
             sellDate: row.sellDate,
             investedAmount: row.investedAmount
           },
           dataStatus: {
             hasBuyPrice: buyPrice !== null,
             hasSellPrice: sellPrice !== null,
             hasQuantity: quantity !== null,
             hasBuyDate: buyDate !== null,
             hasSellDate: sellDate !== null,
             hasProfit: profit !== null
           }
         });

         validData.push({
           id: `sold_${Date.now()}_${index}`,
           symbol: row.symbol,
           name: row.underlyingAsset || row.symbol,
           sector: row.sector || 'ETF',
           buyDate: buyDate,
           sellDate: sellDate,
           buyPrice: buyPrice,
           sellPrice: sellPrice,
           quantity: quantity,
           investedAmount: investedAmount,
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
        
                 const holdingsData = parseCSV(holdingsText, 'Holdings File');
        console.log('Parsed holdings data:', holdingsData);
        
                 const { validData: validHoldings, errors: holdingsErrors } = validateHoldingsData(holdingsData, 'Holdings File');
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
        
                 const soldItemsData = parseCSV(soldItemsText, 'Sold Items File');
        console.log('Parsed sold items data:', soldItemsData);
        
                 const { validData: validSoldItems, errors: soldItemsErrors } = validateSoldItemsData(soldItemsData, 'Sold Items File');
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
       // Template matching your Google Sheets holdings format exactly
       csvContent = 'Buy Date,ETF Code,Underlying Asset,Buy Price,Actual Buy Qty\n';
       csvContent += '06-Jun-24,NSE:PSUBANK,Nifty PSU Bank,721.00,20\n';
       csvContent += '07-Jun-24,NSE:PSUBNKBEES,Nifty PSU Bank,80.50,180\n';
       csvContent += '21-Jun-24,NSE:PSUBNKIETF,Nifty PSU Bank,74.75,203\n';
       csvContent += '01-Jul-24,NSE:PSUBNKIETF,Nifty PSU Bank,74.50,213\n';
     } else {
       // Template matching your Google Sheets sold items format exactly
       csvContent = 'Buy Date,ETF Code,Underlying Asset,Buy Price,Actual Buy Qty,Suggested Qty,Invested amount,Sell Price,Sell Date\n';
       csvContent += '28-Jul-23,ITBEES,NIFTY IT Index,31.07,390,,12117,33.03,01-Sep-23\n';
       csvContent += '26-Jul-23,ICICITECH,NIFTY IT Index,31.35,383,,12007,33.57,04-Sep-23\n';
       csvContent += '21-Aug-23,NSE:MAFANG,NYSE FANG+ Total Return Index,60.88,198,,12054,64.60,06-Sep-23\n';
       csvContent += '02-Aug-23,PSUBANKICI,Nifty PSU Bank,44.68,269,,12019,47.40,09-Sep-23\n';
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
    setGoogleSheetsUrl('');
    setAvailableSheets([]);
    setSelectedSheet('');
    setSheetsImportStatus('idle');
    setSheetDetectionStatus('idle');
    setImportStatus('idle');
    setImportResults({
      holdings: { total: 0, imported: 0, errors: [], data: [] },
      soldItems: { total: 0, imported: 0, errors: [], data: [] }
    });
  };

  // Google Sheets functions
  const extractSheetId = (url) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

    const detectAvailableSheets = async (url) => {
    try {
      setSheetDetectionStatus('loading');
      
      const sheetId = extractSheetId(url);
      if (!sheetId) {
        throw new Error('Invalid Google Sheets URL');
      }
      
      console.log(`🔍 Extracted Sheet ID: ${sheetId}`);
      
      // Look for specific sheet names that are likely to contain actual trading data
      const relevantSheetNames = [
        'Kharida hua maal',
        'Bika hua maal', 
        'Holdings',
        'Sold Items',
        'Portfolio',
        'Sheet1',
        'Sheet2',
        'Sheet3'
      ];
      
      console.log(`🔍 Testing ${relevantSheetNames.length} possible sheet names...`);
      
      const availableSheets = [];
      
      for (const sheetName of relevantSheetNames) {
        try {
          const testUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
          console.log(`🔍 Testing sheet: "${sheetName}"`);
          const testResponse = await fetch(testUrl);
          console.log(`📊 Response for "${sheetName}": Status ${testResponse.status}, OK: ${testResponse.ok}`);
          
          if (testResponse.ok) {
            availableSheets.push(sheetName);
            console.log(`✅ Found sheet: "${sheetName}"`);
          } else {
            console.log(`❌ Sheet "${sheetName}" returned status: ${testResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Sheet "${sheetName}" not found or not accessible:`, error.message);
        }
      }
      
      console.log(`📋 Available sheets found:`, availableSheets);
      console.log(`📊 Total sheets detected: ${availableSheets.length}`);
      
      // Filter out sheets that are likely to be educational/instructional
      const filteredSheets = [];
      for (const sheetName of availableSheets) {
        try {
          // Quick test to see if this sheet contains actual trading data
          const testUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
          const testResponse = await fetch(testUrl);
          if (testResponse.ok) {
            const testContent = await testResponse.text();
            const testLines = testContent.split('\n').slice(0, 10); // Check first 10 lines
            
            // Check if it contains actual ETF symbols or trading data
            const hasETFData = testLines.some(line => {
              const upperLine = line.toUpperCase();
              return upperLine.includes('NSE:') || upperLine.includes('BEES') || 
                     upperLine.includes('ITBEES') || upperLine.includes('PSUBANK') ||
                     upperLine.includes('ETF CODE') || upperLine.includes('BUY DATE') ||
                     /\d{2}-\w{3}-\d{2}/.test(line); // Date pattern like 06-Jun-24
            });
            
            // Be more permissive - include sheets with ETF data even if they have educational content
            if (hasETFData) {
              filteredSheets.push(sheetName);
              console.log(`✅ Valid data sheet: "${sheetName}" (contains ETF data)`);
            } else {
              console.log(`⏭️ Skipped sheet: "${sheetName}" (no ETF data found)`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Could not analyze sheet "${sheetName}":`, error.message);
          // If we can't analyze it, include it anyway
          filteredSheets.push(sheetName);
        }
      }
      
      console.log(`📋 Filtered sheets (actual data):`, filteredSheets);
      console.log(`📊 Valid data sheets: ${filteredSheets.length} out of ${availableSheets.length} total`);
      
      setAvailableSheets(filteredSheets);
      setSheetDetectionStatus('success');
      
      if (filteredSheets.length > 0) {
        setSelectedSheet(filteredSheets[0]);
        console.log(`🎯 Auto-selected first valid sheet: "${filteredSheets[0]}"`);
      } else {
        console.log(`⚠️ No valid data sheets found! This might indicate educational-only content or sharing permission issues.`);
      }
      
      return availableSheets;
      
    } catch (error) {
      console.error('Sheet detection error:', error);
      setSheetDetectionStatus('error');
      throw error;
    }
  };

  const convertToCSVUrl = (sheetsUrl, sheetName) => {
    const sheetId = extractSheetId(sheetsUrl);
    if (!sheetId) {
      throw new Error('Invalid Google Sheets URL');
    }
    const encodedSheetName = encodeURIComponent(sheetName);
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodedSheetName}`;
  };

  // Dynamic classification logic - independent of sheet names
  const classifyRowAsHoldingOrSold = (row, headers) => {
    // The row object now has mapped field names (sellPrice, sellDate) from parseCSV
    // So we can directly check these fields instead of looking for headers
    
    const sellPrice = row.sellPrice;
    const sellDate = row.sellDate;
    
    // Check if this row has both sell price AND sell date (non-empty)
    let isSold = false;
    
    // Check if both sell price and sell date are present and non-empty
    if (sellPrice && sellPrice.toString().trim() !== '' && 
        sellDate && sellDate.toString().trim() !== '' &&
        sellDate.toString().toLowerCase() !== 'grand total') {
      isSold = true;
    }
    
    // Add debug logging to see what's happening
    console.log(`🔍 [Classification] Row with symbol "${row.symbol}":`, {
      sellPrice: sellPrice,
      sellDate: sellDate,
      isSold: isSold,
      sellPriceType: typeof sellPrice,
      sellDateType: typeof sellDate,
      sellPriceLength: sellPrice ? sellPrice.toString().length : 0,
      sellDateLength: sellDate ? sellDate.toString().length : 0,
      sellPriceTrimmed: sellPrice ? sellPrice.toString().trim() : '',
      sellDateTrimmed: sellDate ? sellDate.toString().trim() : ''
    });
    
    return isSold ? 'sold' : 'holding';
  };

  const analyzeSheetType = (data, sheetName = 'Unknown') => {
    if (!data || data.length === 0) return 'unknown';
    
    // First, check if this is an educational sheet that should be ignored
    const educationalKeywords = [
      'disclaimer: this sheet is for educational purpose',
      'this sheet is for educational purpose',
      'how to use this sheet',
      'instructions for use',
      'step by step guide',
      'tutorial sheet',
      'total invested money and average buying price',
      'recording multiple buys of same etf when averaging is done',
      'it tracks the total quantity bought',
      'educational',
      'instruction',
      'guide',
      'tutorial',
      'example',
      'sample',
      'step',
      'we have a list of etfs',
      'we need to find',
      'on the first day',
      'we will purchase',
      'on next day',
      'if a new etf',
      'if an existing etf',
      'if you are holding',
      'if none of the etfs',
      'sell the etf lot',
      'lifo',
      'last in first out',
      'rank 1',
      'rank 2',
      'rank 3',
      'rank 4',
      'rank 5',
      '20 dma',
      'cmp',
      'profit',
      'target',
      'threshold',
      'features',
      'recording',
      'tracking',
      'notional profit',
      'pivot table',
      'monthly profits'
    ];
    
    // Check sheet name for educational content
    const sheetNameLower = sheetName.toLowerCase();
    if (educationalKeywords.some(keyword => sheetNameLower.includes(keyword)) || 
        sheetNameLower.includes('trading data') || 
        sheetNameLower.includes('educational') ||
        sheetNameLower.includes('guide') ||
        sheetNameLower.includes('tutorial')) {
      console.log(`📊 Detected as IGNORED sheet (sheet name indicates educational content: "${sheetName}")`);
      return 'ignored';
    }
    
    // Check for educational content in data - be more strict
    const rowsWithEducationalContent = data.filter(row => {
      const rowText = Object.values(row).join(' ').toLowerCase();
      return educationalKeywords.some(keyword => rowText.includes(keyword));
    });
    
    // Be more permissive - only ignore if there are NO valid ETF symbols at all
    const validETFRows = data.filter(row => {
      const symbol = row.symbol || '';
      const str = symbol.toString().toUpperCase();
      return str.includes('NSE:') || str.includes('BEES') || str.includes('ETF') || str.includes('IETF') ||
             ['MAFANG', 'BFSI', 'ESG', 'ITBEES', 'PSUBANK', 'BANKBEES', 'GOLDBEES'].some(etf => str.includes(etf));
    });
    
    // Only ignore if there are absolutely no valid ETF symbols
    if (validETFRows.length === 0) {
      console.log(`📊 Detected as IGNORED sheet (no valid ETF symbols found - ${validETFRows.length} valid ETF rows)`);
      return 'ignored';
    }
    
    console.log(`📊 Sheet has ${validETFRows.length} valid ETF rows out of ${data.length} total rows (${rowsWithEducationalContent.length} educational rows will be filtered during import)`);
    
    // Now determine if this is a holdings sheet or sold items sheet based on sheet name and content
    const sheetNameForHoldings = [
      'kharida hua maal',
      'holdings',
      'portfolio',
      'current holdings',
      'active holdings',
      'buy data',
      'purchase data'
    ];
    
    const sheetNameForSoldItems = [
      'bika hua maal',
      'sold items',
      'sold data',
      'sell data',
      'completed trades',
      'closed positions',
      'realized gains'
    ];
    
    // Check if sheet name indicates holdings
    if (sheetNameForHoldings.some(keyword => sheetNameLower.includes(keyword))) {
      console.log(`📊 Detected as HOLDINGS sheet (sheet name indicates holdings: "${sheetName}")`);
      return 'holdings';
    }
    
    // Check if sheet name indicates sold items
    if (sheetNameForSoldItems.some(keyword => sheetNameLower.includes(keyword))) {
      console.log(`📊 Detected as SOLD ITEMS sheet (sheet name indicates sold items: "${sheetName}")`);
      return 'soldItems';
    }
    
    // If sheet name doesn't clearly indicate, check the data content
    // Count rows with sell price/date vs rows without
    let rowsWithSellData = 0;
    let rowsWithoutSellData = 0;
    
    data.forEach(row => {
      const hasSellPrice = row.sellPrice && row.sellPrice.toString().trim() !== '';
      const hasSellDate = row.sellDate && row.sellDate.toString().trim() !== '';
      
      if (hasSellPrice && hasSellDate) {
        rowsWithSellData++;
      } else {
        rowsWithoutSellData++;
      }
    });
    
    console.log(`📊 [${sheetName}] Data analysis: ${rowsWithSellData} rows with sell data, ${rowsWithoutSellData} rows without sell data`);
    
    // If more than 70% of rows have sell data, it's a sold items sheet
    if (rowsWithSellData > rowsWithoutSellData && rowsWithSellData > 0) {
      console.log(`📊 Detected as SOLD ITEMS sheet (majority of rows have sell data)`);
      return 'soldItems';
    }
    
    // If more than 70% of rows don't have sell data, it's a holdings sheet
    if (rowsWithoutSellData > rowsWithSellData && rowsWithoutSellData > 0) {
      console.log(`📊 Detected as HOLDINGS sheet (majority of rows don't have sell data)`);
      return 'holdings';
    }
    
    // Default to holdings if we can't determine
    console.log(`📊 Detected as HOLDINGS sheet (default classification)`);
    return 'holdings';
  };

  const importFromGoogleSheets = async (url, sheetName) => {
    try {
      setSheetsImportStatus('loading');
      
      dispatch({ type: actionTypes.CLEAR_HOLDINGS });
      dispatch({ type: actionTypes.CLEAR_SOLD_ITEMS });
      
      let totalImportResults = {
        holdings: { total: 0, imported: 0, errors: [] },
        soldItems: { total: 0, imported: 0, errors: [] }
      };
      
      if (sheetName) {
        console.log(`Importing from specific sheet: ${sheetName}`);
        const sheetResults = await importFromSingleSheet(url, sheetName);
        totalImportResults = sheetResults;
             } else {
         console.log('Auto-importing from all available sheets...');
         const allSheets = await detectAvailableSheets(url);
         
         console.log(`📊 Starting import process for ${allSheets.length} sheets:`, allSheets);
         
         if (allSheets.length === 0) {
           console.log(`⚠️ No sheets found to import! Please check your Google Sheets URL and sharing permissions.`);
           alert('No sheets found to import. Please check your Google Sheets URL and make sure it\'s set to "Anyone with the link can view".');
           return;
         }
         
         for (const sheet of allSheets) {
           console.log(`\n🔄 Processing sheet: ${sheet}`);
           try {
             const sheetResults = await importFromSingleSheet(url, sheet);
             
             totalImportResults.holdings.total += sheetResults.holdings.total;
             totalImportResults.holdings.imported += sheetResults.holdings.imported;
             totalImportResults.holdings.errors.push(...sheetResults.holdings.errors);
             
             totalImportResults.soldItems.total += sheetResults.soldItems.total;
             totalImportResults.soldItems.imported += sheetResults.soldItems.imported;
             totalImportResults.soldItems.errors.push(...sheetResults.soldItems.errors);
             
             console.log(`✅ Sheet "${sheet}" processed:`, {
               holdings: { total: sheetResults.holdings.total, imported: sheetResults.holdings.imported },
               soldItems: { total: sheetResults.soldItems.total, imported: sheetResults.soldItems.imported }
             });
           } catch (error) {
             console.error(`❌ Error processing sheet "${sheet}":`, error);
           }
         }
       }
      
      setSheetsImportStatus('success');
      setImportResults(totalImportResults);
      
      const totalImported = totalImportResults.holdings.imported + totalImportResults.soldItems.imported;
      
      console.log(`✅ Successfully imported ${totalImported} items from Google Sheets`);
      console.log(`- Holdings: ${totalImportResults.holdings.imported}`);
      console.log(`- Sold Items: ${totalImportResults.soldItems.imported}`);
      
      let message = `✅ Successfully imported ${totalImported} items from Google Sheets!\n\n`;
      if (totalImportResults.holdings.imported > 0) {
        message += `📈 Holdings: ${totalImportResults.holdings.imported} items\n`;
      }
      if (totalImportResults.soldItems.imported > 0) {
        message += `💰 Sold Items: ${totalImportResults.soldItems.imported} items\n`;
      }
      message += `\nPlease check the Holdings and Sold Items pages to see your imported data.`;
      
      alert(message);
      
    } catch (error) {
      console.error('Google Sheets import error:', error);
      setSheetsImportStatus('error');
    }
  };

  const importFromSingleSheet = async (url, sheetName) => {
    console.log(`Importing from sheet: ${sheetName}`);
    
    const csvUrl = convertToCSVUrl(url, sheetName);
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data from sheet "${sheetName}": ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html>')) {
      throw new Error('Received HTML response instead of CSV data. Please check the Google Sheets URL and sharing settings.');
    }
    
         const parsedData = parseCSV(csvText, sheetName);
    
    if (parsedData.length === 0) {
      return {
        holdings: { total: 0, imported: 0, errors: [] },
        soldItems: { total: 0, imported: 0, errors: [] }
      };
    }
    
         const sheetType = analyzeSheetType(parsedData, sheetName);
     console.log(`🎯 Smart Detection: Sheet "${sheetName}" detected as: ${sheetType.toUpperCase()}`);
     
     let importResults = {
       holdings: { total: 0, imported: 0, errors: [] },
       soldItems: { total: 0, imported: 0, errors: [] }
     };
     
           if (sheetType === 'ignored') {
        console.log(`⏭️ Skipping "${sheetName}" - not a valid data sheet`);
        return {
          holdings: { total: 0, imported: 0, errors: [] },
          soldItems: { total: 0, imported: 0, errors: [] }
        };
      }
      
      // Simple classification based on sheet type
      if (sheetType === 'holdings') {
        console.log(`📈 Processing "${sheetName}" as HOLDINGS sheet...`);
        
        // Filter out educational content rows
        const filteredData = parsedData.filter(row => {
          if (!row.symbol || row.symbol.trim() === '') {
            return false;
          }
          
          const rowText = Object.values(row).join(' ').toLowerCase();
          const educationalKeywords = [
            'total invested money and average buying price',
            'recording multiple buys of same etf when averaging is done',
            'it tracks the total quantity bought',
            'educational',
            'instruction',
            'guide',
            'tutorial',
            'example',
            'sample'
          ];
          
          return !educationalKeywords.some(keyword => rowText.includes(keyword));
        });
        
        console.log(`📊 [${sheetName}] Filtered ${filteredData.length} valid holdings rows from ${parsedData.length} total rows`);
        
        if (filteredData.length > 0) {
          const { validData, errors } = validateHoldingsData(filteredData, sheetName);
          
          validData.forEach(holding => {
            dispatch({ type: actionTypes.ADD_HOLDING, payload: holding });
          });
          
          importResults.holdings = {
            total: filteredData.length,
            imported: validData.length,
            errors: errors
          };
          
          console.log(`✅ Processed ${validData.length} holdings from "${sheetName}"`);
        }
      }
      
      if (sheetType === 'soldItems') {
        console.log(`💰 Processing "${sheetName}" as SOLD ITEMS sheet...`);
        
        // Filter out educational content rows
        const filteredData = parsedData.filter(row => {
          if (!row.symbol || row.symbol.trim() === '') {
            return false;
          }
          
          const rowText = Object.values(row).join(' ').toLowerCase();
          const educationalKeywords = [
            'total invested money and average buying price',
            'recording multiple buys of same etf when averaging is done',
            'it tracks the total quantity bought',
            'educational',
            'instruction',
            'guide',
            'tutorial',
            'example',
            'sample'
          ];
          
          return !educationalKeywords.some(keyword => rowText.includes(keyword));
        });
        
        console.log(`📊 [${sheetName}] Filtered ${filteredData.length} valid sold items rows from ${parsedData.length} total rows`);
        
        if (filteredData.length > 0) {
          const { validData, errors } = validateSoldItemsData(filteredData, sheetName);
          
          validData.forEach(item => {
            dispatch({ type: actionTypes.ADD_SOLD_ITEM, payload: item });
          });
          
          importResults.soldItems = {
            total: filteredData.length,
            imported: validData.length,
            errors: errors
          };
          
          console.log(`✅ Processed ${validData.length} sold items from "${sheetName}"`);
        }
      }
    
    return importResults;
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
               <p><strong>Sample format:</strong> 06-Jun-24, NSE:PSUBANK, Nifty PSU Bank, 721.00, 20</p>
               <p>Invested amount will be calculated automatically if not provided</p>
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
               <p><strong>Sample format:</strong> 28-Jul-23, ITBEES, NIFTY IT Index, 31.07, 390, 33.03, 01-Sep-23</p>
               <p>Optional: Suggested Qty, Invested amount</p>
               <p>Profit will be calculated automatically</p>
               <p className="text-yellow-600 mt-1"><strong>Note:</strong> This will replace all existing sold items data</p>
             </div>
          </div>
        </div>
      </div>

      {/* Google Sheets Import Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-blue-800 mb-4">
          Import from Google Sheets
        </h3>
                                   <p className="text-sm text-blue-600 mb-6">
            Import your ETF data directly from Google Sheets. The app uses <strong>Smart Sheet Classification</strong>:
            <br />• <strong>Holdings Sheets:</strong> "Kharida hua maal", "Holdings", "Portfolio" (or sheets with mostly buy data)
            <br />• <strong>Sold Items Sheets:</strong> "Bika hua maal", "Sold Items", "Sold Data" (or sheets with mostly sell data)
            <br />• <strong>Automatic Detection:</strong> Sheets are classified based on name and data content
            <br />• <strong>Educational sheets:</strong> Will be automatically skipped
            <br />• <strong>Field Mapping:</strong> Automatically maps Buy Date, ETF Code, Underlying Asset, Buy Price, Actual Buy Qty, Sell Price, Sell Date
            <br />Each sheet is imported to the correct section based on its classification.
          </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Sheets URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={googleSheetsUrl}
                onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={() => detectAvailableSheets(googleSheetsUrl)}
                disabled={!googleSheetsUrl || sheetDetectionStatus === 'loading'}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
              >
                {sheetDetectionStatus === 'loading' ? '🔍 Detecting...' : '🔍 Detect Sheets'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Make sure your Google Sheet is set to "Anyone with the link can view"
            </p>
          </div>
          
          {sheetDetectionStatus === 'success' && availableSheets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Data Sheets ({availableSheets.length} found)
              </label>
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                ✅ Sheets with trading data are shown. Educational content will be filtered during import but sheets with mixed content are included.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableSheets.map(sheet => (
                  <button
                    key={sheet}
                    onClick={() => setSelectedSheet(sheet)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedSheet === sheet 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{sheet}</div>
                    <div className="text-sm text-gray-500">
                      {sheet.toLowerCase().includes('kharida') ? '📈 Holdings Data' : 
                       sheet.toLowerCase().includes('bika') ? '💰 Sold Items Data' : 
                       'Click to select this sheet'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {sheetDetectionStatus === 'success' && availableSheets.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center text-yellow-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>No valid data sheets found. The sheets may contain only educational content or have sharing restrictions.</span>
              </div>
            </div>
          )}
          
          {sheetDetectionStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>Failed to detect sheets. Please check your URL and sharing settings.</span>
              </div>
            </div>
          )}
          
          {selectedSheet && (
            <div className="flex space-x-2">
              <button
                onClick={() => importFromGoogleSheets(googleSheetsUrl, selectedSheet)}
                disabled={sheetsImportStatus === 'loading'}
                className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-green-600 transition-colors"
              >
                {sheetsImportStatus === 'loading' ? '⏳ Analyzing & Importing...' : '📥 Import Selected Sheet'}
              </button>
              
              <button
                onClick={() => importFromGoogleSheets(googleSheetsUrl, null)}
                disabled={sheetsImportStatus === 'loading'}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-blue-600 transition-colors"
              >
                {sheetsImportStatus === 'loading' ? '⏳ Importing All Sheets...' : '📥 Import All Sheets'}
              </button>
              
              {sheetsImportStatus === 'success' && (
                <span className="flex items-center text-green-600 font-medium">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Import completed!
                </span>
              )}
              
              {sheetsImportStatus === 'error' && (
                <span className="flex items-center text-red-600 font-medium">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Import failed
                </span>
              )}
            </div>
          )}
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