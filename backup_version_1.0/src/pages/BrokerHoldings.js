import React, { useState, useCallback } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { Package, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const BrokerHoldings = () => {
  const { 
    fetchBrokerHoldings,
    tradingStatus,
    tradingMessage
  } = useETFTrading();
  
  const [brokerHoldings, setBrokerHoldings] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [sortBy, setSortBy] = useState('currentValue');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFetchBrokerHoldings = useCallback(async () => {
    setIsFetching(true);
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - API call took too long')), 60000) // Increased timeout for live price fetching
      );
      
      console.log('🔄 Starting broker holdings fetch...');
      const holdingsPromise = fetchBrokerHoldings();
      const holdings = await Promise.race([holdingsPromise, timeoutPromise]);
      
      // Ensure holdings is always an array
      const holdingsArray = Array.isArray(holdings) ? holdings : [];
      setBrokerHoldings(holdingsArray);
      console.log('✅ Broker holdings fetched successfully:', holdingsArray.length, 'holdings');
      
      // Show success message
      if (holdingsArray.length > 0) {
        console.log('📊 Holdings with live CMP data loaded successfully');
      } else {
        console.log('⚠️ No holdings found or API returned empty data');
      }
    } catch (error) {
      console.error('❌ Error fetching broker holdings:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message.includes('timeout') 
        ? 'Request timed out. The API call took too long. Please try again.'
        : `Error fetching broker holdings: ${error.message}`;
      
      alert(errorMessage);
      // Set empty array on error
      setBrokerHoldings([]);
    } finally {
      setIsFetching(false);
    }
  }, [fetchBrokerHoldings]);

  // Don't auto-fetch on mount to prevent hanging
  // User can manually click "Refresh Holdings" button

  // Ensure brokerHoldings is always an array with performance optimization
  const safeBrokerHoldings = React.useMemo(() => {
    return Array.isArray(brokerHoldings) ? brokerHoldings : [];
  }, [brokerHoldings]);

  // Filter and sort holdings with performance optimization
  const filteredAndSortedHoldings = React.useMemo(() => {
    if (!safeBrokerHoldings || safeBrokerHoldings.length === 0) {
      return [];
    }

    // Limit processing to prevent hanging
    const maxItems = Math.min(safeBrokerHoldings.length, 1000);
    const itemsToProcess = safeBrokerHoldings.slice(0, maxItems);

    let filtered = itemsToProcess.filter(holding => {
      if (!holding || typeof holding !== 'object') return false;
      
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        (holding.symbol && holding.symbol.toLowerCase().includes(searchLower)) ||
        (holding.name && holding.name.toLowerCase().includes(searchLower))
      );
    });

    // Sort with safety checks
    if (filtered.length > 0) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'currentValue':
            aValue = a.currentValue || 0;
            bValue = b.currentValue || 0;
            break;
          case 'profitLoss':
            aValue = a.profitLoss || 0;
            bValue = b.profitLoss || 0;
            break;
          case 'profitPercentage':
            aValue = a.profitPercentage || 0;
            bValue = b.profitPercentage || 0;
            break;
          case 'quantity':
            aValue = a.quantity || 0;
            bValue = b.quantity || 0;
            break;
          case 'symbol':
            aValue = a.symbol || '';
            bValue = b.symbol || '';
            break;
          default:
            aValue = a.currentValue || 0;
            bValue = b.currentValue || 0;
        }

        if (sortOrder === 'desc') {
          return bValue - aValue;
        } else {
          return aValue - bValue;
        }
      });
    }

    return filtered;
  }, [safeBrokerHoldings, searchTerm, sortBy, sortOrder]);

  // Calculate portfolio totals with performance optimization
  const portfolioTotals = React.useMemo(() => {
    if (!safeBrokerHoldings || safeBrokerHoldings.length === 0) {
      return {
        totalPortfolioValue: 0,
        totalInvested: 0,
        totalProfitLoss: 0,
        totalProfitPercentage: 0
      };
    }

    // Limit processing to prevent hanging
    const maxItems = Math.min(safeBrokerHoldings.length, 1000);
    const itemsToProcess = safeBrokerHoldings.slice(0, maxItems);

    const totalPortfolioValue = itemsToProcess.reduce((sum, holding) => {
      if (!holding || typeof holding !== 'object') return sum;
      return sum + (holding.currentValue || 0);
    }, 0);

    const totalInvested = itemsToProcess.reduce((sum, holding) => {
      if (!holding || typeof holding !== 'object') return sum;
      return sum + (holding.totalInvested || 0);
    }, 0);

    const totalProfitLoss = totalPortfolioValue - totalInvested;
    const totalProfitPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    return {
      totalPortfolioValue,
      totalInvested,
      totalProfitLoss,
      totalProfitPercentage
    };
  }, [safeBrokerHoldings]);

  const { totalPortfolioValue, totalProfitLoss, totalProfitPercentage } = portfolioTotals;



  // Show loading state if component is still initializing
  if (isFetching && safeBrokerHoldings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Broker Holdings</h1>
            <p className="text-gray-600">Your holdings from MStocks broker</p>
          </div>
        </div>
        <div className="text-center py-12">
          <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading Broker Holdings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please wait while we initialize the page...
          </p>
        </div>
      </div>
    );
  }

  // Show simple loading state if component is taking too long to render
  if (!safeBrokerHoldings || safeBrokerHoldings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Broker Holdings</h1>
            <p className="text-gray-600">Your holdings from MStocks broker</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleFetchBrokerHoldings}
              disabled={isFetching}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh Holdings
            </button>
          </div>
        </div>

                 {/* MStocks Portfolio API Status */}
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
           <div className="flex items-center">
             <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
             <div>
               <h3 className="text-sm font-medium text-blue-800">MStocks Portfolio API Integration</h3>
               <p className="text-sm text-blue-700 mt-1">
                 Using official MStocks Portfolio API based on 
                 <a href="https://tradingapi.mstock.com/docs/v1/typeA/Portfolio/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline ml-1">
                   Portfolio API docs
                 </a> for fetching broker holdings with live CMP data. 
                 Click "Refresh Holdings" to fetch your broker data with real-time prices.
               </p>
             </div>
           </div>
         </div>

        {/* Trading Status */}
        {tradingStatus && (
          <div className={`p-4 rounded-md ${
            tradingStatus === 'success' ? 'bg-green-50 border border-green-200' :
            tradingStatus === 'error' ? 'bg-red-50 border border-red-200' :
            tradingStatus === 'loading' ? 'bg-blue-50 border border-blue-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center">
              {tradingStatus === 'success' && <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>}
              {tradingStatus === 'error' && <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>}
              {tradingStatus === 'loading' && <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse mr-2"></div>}
              <p className={`text-sm font-medium ${
                tradingStatus === 'success' ? 'text-green-800' :
                tradingStatus === 'error' ? 'text-red-800' :
                tradingStatus === 'loading' ? 'text-blue-800' :
                'text-gray-800'
              }`}>
                {typeof tradingMessage === 'string' ? tradingMessage : JSON.stringify(tradingMessage)}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Ready to fetch broker holdings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click the button below to fetch your holdings from MStocks broker.
          </p>
          <button
            onClick={handleFetchBrokerHoldings}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Fetch Holdings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broker Holdings</h1>
          <p className="text-gray-600">Your holdings from MStocks broker</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleFetchBrokerHoldings}
            disabled={isFetching}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Holdings
          </button>
        </div>
      </div>

      {/* Trading Status */}
      {tradingStatus && (
        <div className={`p-4 rounded-md ${
          tradingStatus === 'success' ? 'bg-green-50 border border-green-200' :
          tradingStatus === 'error' ? 'bg-red-50 border border-red-200' :
          tradingStatus === 'loading' ? 'bg-blue-50 border border-blue-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center">
            {tradingStatus === 'success' && <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>}
            {tradingStatus === 'error' && <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>}
            {tradingStatus === 'loading' && <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse mr-2"></div>}
            <p className={`text-sm font-medium ${
              tradingStatus === 'success' ? 'text-green-800' :
              tradingStatus === 'error' ? 'text-red-800' :
              tradingStatus === 'loading' ? 'text-blue-800' :
              'text-gray-800'
            }`}>
              {typeof tradingMessage === 'string' ? tradingMessage : JSON.stringify(tradingMessage)}
            </p>
          </div>
        </div>
      )}

                    {/* MStocks Portfolio API Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">MStocks Portfolio API Integration</h3>
              <p className="text-sm text-blue-700 mt-1">
                Using official MStocks Portfolio API based on 
                <a href="https://tradingapi.mstock.com/docs/v1/typeA/Portfolio/" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-blue-600 hover:text-blue-800 underline ml-1">
                  Portfolio API docs
                </a> for fetching broker holdings with live CMP data. 
                Click "Refresh Holdings" to fetch your broker data with real-time prices.
              </p>
            </div>
          </div>
        </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Holdings</p>
              <p className="text-2xl font-bold text-blue-600">{safeBrokerHoldings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-bold text-green-600">₹{totalPortfolioValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${totalProfitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {totalProfitLoss >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total P&L</p>
              <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{totalProfitLoss.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${totalProfitPercentage >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {totalProfitPercentage >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">P&L %</p>
              <p className={`text-2xl font-bold ${totalProfitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfitPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by symbol or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="currentValue">Portfolio Value</option>
              <option value="profitLoss">P&L</option>
              <option value="profitPercentage">P&L %</option>
              <option value="quantity">Quantity</option>
              <option value="symbol">Symbol</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Broker Holdings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredAndSortedHoldings.length} of {safeBrokerHoldings.length} holdings
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedHoldings.map((holding) => (
                <tr key={holding.symbol || holding.id || Math.random()} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{holding.symbol || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{holding.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{holding.quantity || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{holding.avgPrice?.toFixed(2) || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{holding.currentPrice?.toFixed(2) || 'N/A'}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    (holding.profitPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(holding.profitPercentage || 0) >= 0 ? '+' : ''}{(holding.profitPercentage || 0).toFixed(2)}%
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    (holding.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(holding.profitLoss || 0) >= 0 ? '+' : ''}₹{(holding.profitLoss || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(holding.currentValue || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading State */}
        {isFetching && (
          <div className="text-center py-12">
            <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Fetching Broker Holdings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Connecting to MStocks API and retrieving your holdings...
            </p>
          </div>
        )}

                 {/* Empty State */}
         {!isFetching && filteredAndSortedHoldings.length === 0 && (
           <div className="text-center py-12">
             <Package className="mx-auto h-12 w-12 text-gray-400" />
             <h3 className="mt-2 text-sm font-medium text-gray-900">
               {safeBrokerHoldings.length === 0 
                 ? 'Ready to fetch broker holdings'
                 : 'No holdings match your search'
               }
             </h3>
             <p className="mt-1 text-sm text-gray-500">
               {safeBrokerHoldings.length === 0 
                 ? 'Click the button below to fetch your holdings from MStocks broker.'
                 : 'Try adjusting your search to see more results.'
               }
             </p>
             {safeBrokerHoldings.length === 0 && (
               <button
                 onClick={handleFetchBrokerHoldings}
                 className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
               >
                 <RefreshCw className="w-4 h-4 mr-2" />
                 Fetch Holdings
               </button>
             )}
           </div>
         )}
      </div>
    </div>
  );
};

export default BrokerHoldings; 