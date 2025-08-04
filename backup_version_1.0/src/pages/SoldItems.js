import React, { useState, useMemo } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const SoldItems = () => {
  const { soldItems, totalProfit } = useETFTrading();
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [profitFilter, setProfitFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('sellDate');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Simple analytics calculation
  const analytics = useMemo(() => {
    if (!soldItems || soldItems.length === 0) {
      return {
        totalSold: 0,
        totalProfit: 0,
        profitableTrades: 0,
        lossTrades: 0,
        profitPercentage: 0
      };
    }

    const totalSold = soldItems.length;
    const profitableTrades = soldItems.filter(item => item.profit > 0).length;
    const lossTrades = soldItems.filter(item => item.profit < 0).length;
    const profitPercentage = totalSold > 0 ? (profitableTrades / totalSold) * 100 : 0;

    return {
      totalSold,
      totalProfit,
      profitableTrades,
      lossTrades,
      profitPercentage
    };
  }, [soldItems, totalProfit]);

  // Apply filters with performance optimization
  const filteredSoldItems = useMemo(() => {
    if (!soldItems || !Array.isArray(soldItems)) return [];
    
    // Limit processing to prevent hanging
    const maxItems = 1000;
    const itemsToProcess = soldItems.slice(0, maxItems);
    
    let filtered = [...itemsToProcess];

    // Month filter
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(item => {
        if (!item.sellDate) return false;
        try {
          const itemMonth = new Date(item.sellDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          return itemMonth === selectedMonth;
        } catch (error) {
          return false;
        }
      });
    }

    // Year filter
    if (selectedYear !== 'all') {
      filtered = filtered.filter(item => {
        if (!item.sellDate) return false;
        try {
          const itemYear = new Date(item.sellDate).getFullYear().toString();
          return itemYear === selectedYear;
        } catch (error) {
          return false;
        }
      });
    }

    // Sector filter
    if (selectedSector !== 'all') {
      filtered = filtered.filter(item => (item.sector || 'Unknown') === selectedSector);
    }

    // Profit filter
    if (profitFilter === 'profit') {
      filtered = filtered.filter(item => (item.profit || 0) > 0);
    } else if (profitFilter === 'loss') {
      filtered = filtered.filter(item => (item.profit || 0) < 0);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.symbol || '').toLowerCase().includes(searchLower) ||
        (item.name || '').toLowerCase().includes(searchLower) ||
        (item.sector || '').toLowerCase().includes(searchLower)
      );
    }

    // Sort with performance optimization
    if (filtered.length > 0) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'sellDate':
            try {
              aValue = new Date(a.sellDate || 0);
              bValue = new Date(b.sellDate || 0);
            } catch (error) {
              aValue = new Date(0);
              bValue = new Date(0);
            }
            break;
          case 'profit':
            aValue = a.profit || 0;
            bValue = b.profit || 0;
            break;
          case 'profitPercentage':
            aValue = a.buyPrice && a.sellPrice ? ((a.sellPrice - a.buyPrice) / a.buyPrice) * 100 : 0;
            bValue = b.buyPrice && b.sellPrice ? ((b.sellPrice - b.buyPrice) / b.buyPrice) * 100 : 0;
            break;
          case 'symbol':
            aValue = a.symbol || '';
            bValue = b.symbol || '';
            break;
          default:
            try {
              aValue = new Date(a.sellDate || 0);
              bValue = new Date(b.sellDate || 0);
            } catch (error) {
              aValue = new Date(0);
              bValue = new Date(0);
            }
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return filtered;
  }, [soldItems, selectedMonth, selectedYear, selectedSector, profitFilter, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredSoldItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredSoldItems.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, selectedSector, profitFilter, searchTerm, sortBy, sortOrder]);

  // Get unique values for filters with performance optimization
  const months = useMemo(() => {
    if (!soldItems || !Array.isArray(soldItems)) return ['all'];
    
    const monthSet = new Set();
    const maxItems = Math.min(soldItems.length, 500); // Limit processing
    
    for (let i = 0; i < maxItems; i++) {
      const item = soldItems[i];
      if (item && item.sellDate) {
        try {
          const month = new Date(item.sellDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          monthSet.add(month);
        } catch (error) {
          // Skip invalid dates
        }
      }
    }
    return ['all', ...Array.from(monthSet).sort()];
  }, [soldItems]);

  const years = useMemo(() => {
    if (!soldItems || !Array.isArray(soldItems)) return ['all'];
    
    const yearSet = new Set();
    const maxItems = Math.min(soldItems.length, 500); // Limit processing
    
    for (let i = 0; i < maxItems; i++) {
      const item = soldItems[i];
      if (item && item.sellDate) {
        try {
          const year = new Date(item.sellDate).getFullYear().toString();
          yearSet.add(year);
        } catch (error) {
          // Skip invalid dates
        }
      }
    }
    return ['all', ...Array.from(yearSet).sort()];
  }, [soldItems]);

    const sectors = useMemo(() => {
    if (!soldItems || !Array.isArray(soldItems)) return ['all'];
    
    const sectorSet = new Set();
    const maxItems = Math.min(soldItems.length, 500); // Limit processing
    
    for (let i = 0; i < maxItems; i++) {
      const item = soldItems[i];
      if (item) {
        sectorSet.add(item.sector || 'Unknown');
      }
    }
    return ['all', ...Array.from(sectorSet).sort()];
  }, [soldItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sold Items Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive analysis of your ETF trading performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-500">
            {filteredSoldItems.length} of {soldItems?.length || 0} items
          </span>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Symbol, Name, or Sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map(month => (
                <option key={month} value={month}>
                  {month === 'all' ? 'All Months' : month}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year === 'all' ? 'All Years' : year}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sectors.map(sector => (
                <option key={sector} value={sector}>
                  {sector === 'all' ? 'All Sectors' : sector}
                </option>
              ))}
            </select>
          </div>

          {/* Profit Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profit/Loss</label>
            <select
              value={profitFilter}
              onChange={(e) => setProfitFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Trades</option>
              <option value="profit">Profitable Only</option>
              <option value="loss">Loss Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sellDate">Sell Date</option>
              <option value="profit">Profit</option>
              <option value="profitPercentage">Profit %</option>
              <option value="symbol">Symbol</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-green-600">₹{analytics.totalProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Trades</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.totalSold}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100">
              <TrendingDown className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.profitPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-100">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Profitable Trades</p>
              <p className="text-2xl font-bold text-orange-600">{analytics.profitableTrades}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sold Items Table with Pagination */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Sold Items History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {currentItems.length} of {filteredSoldItems.length} items (Page {currentPage} of {totalPages})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((item) => {
                const profitPercentage = ((item.sellPrice - item.buyPrice) / item.buyPrice) * 100;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sector}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.buyPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.sellPrice}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      item.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.profit >= 0 ? '+' : ''}₹{item.profit.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.sellDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.sellReason === 'Target Profit Achieved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.sellReason}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredSoldItems.length)} of {filteredSoldItems.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredSoldItems.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sold items found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters to see more results.
          </p>
        </div>
      )}
    </div>
  );
};

export default SoldItems; 