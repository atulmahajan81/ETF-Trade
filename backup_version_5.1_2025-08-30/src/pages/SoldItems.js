import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useETFTrading } from '../context/ETFTradingContext';
import { 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Loader,
  TrendingUp
} from 'lucide-react';
import EditSoldItemModal from '../components/EditSoldItemModal';

// Virtualized row component for better performance
const VirtualizedRow = React.memo(({ index, style, data }) => {
  const { items, onEditItem } = data;
  const item = items[index];
  
  if (!item) return null;

  // Compute derived profit and profit % if missing
  const qty = Number(item.quantity || 0);
  const buy = Number(item.buyPrice || 0);
  const sell = Number(item.sellPrice || 0);
  let derivedProfit = typeof item.profit === 'number' ? item.profit : (sell - buy) * qty;
  if (!Number.isFinite(derivedProfit)) derivedProfit = 0;
  const invested = qty * buy;
  let derivedProfitPct = typeof item.profitPercentage === 'number'
    ? item.profitPercentage
    : (invested > 0 ? (derivedProfit / invested) * 100 : 0);
  if (!Number.isFinite(derivedProfitPct)) derivedProfitPct = 0;

  return (
    <div style={style} className="grid holdings-grid gap-4 px-6 py-3 border-b border-upstox-primary hover:bg-upstox-tertiary items-center transition-colors duration-200">
      <div className="text-sm font-medium text-upstox-primary">
        {item.symbol}
      </div>
      <div className="text-sm text-upstox-secondary">
        {item.name}
      </div>
      <div className="text-sm text-upstox-secondary">
        {item.sector}
      </div>
      <div className="text-sm text-upstox-secondary">
        {item.buyDate}
      </div>
      <div className="text-sm text-upstox-secondary">
        {item.sellDate}
      </div>
      <div className="text-sm font-medium text-upstox-primary">
        {item.quantity}
      </div>
      <div className="text-sm font-medium text-upstox-primary">
        ₹{item.buyPrice?.toFixed(2)}
      </div>
      <div className="text-sm font-medium text-upstox-primary">
        ₹{(Number(item.sellPrice) > 0 ? item.sellPrice : ((Number(item.profit) + (Number(item.buyPrice)||0) * (Number(item.quantity)||0)) / Math.max(1, Number(item.quantity)||0)))?.toFixed(2)}
      </div>
      <div className="text-sm font-semibold">
        <span className={derivedProfit >= 0 ? 'text-positive' : 'text-negative'}>
          ₹{derivedProfit.toFixed(2)}
        </span>
      </div>
      <div className="text-sm font-semibold">
        <span className={derivedProfitPct >= 0 ? 'text-positive' : 'text-negative'}>
          {derivedProfitPct.toFixed(2)}%
        </span>
      </div>
      <div className="text-sm font-medium">
        <div className="flex gap-1">
          <button
            onClick={() => onEditItem(item, 'view')}
            className="p-1.5 text-upstox-secondary hover:text-upstox-primary hover:bg-upstox-tertiary rounded-md transition-colors"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onEditItem(item, 'edit')}
            className="p-1.5 text-accent-blue hover:text-accent-blue-hover hover:bg-upstox-tertiary rounded-md transition-colors"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onEditItem(item, 'delete')}
            className="p-1.5 text-negative hover:text-negative-hover hover:bg-upstox-tertiary rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});

// Custom hook for optimized search and filtering
const useOptimizedFiltering = (items, searchTerm, sortBy, sortOrder) => {
  return useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    
    let filtered = [...items];

    // Optimized search filter with early exit
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          (item.symbol || '').toLowerCase().includes(searchLower) ||
          (item.name || '').toLowerCase().includes(searchLower) ||
          (item.sector || '').toLowerCase().includes(searchLower)
        );
      });
    }

    // Optimized sorting with stable sort
    if (filtered.length > 0) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'sellDate':
            aValue = a.sellDate || '';
            bValue = b.sellDate || '';
            break;
          case 'profit':
            aValue = a.profit || 0;
            bValue = b.profit || 0;
            break;
          case 'profitPercentage':
            aValue = a.profitPercentage || 0;
            bValue = b.profitPercentage || 0;
            break;
          case 'symbol':
            aValue = a.symbol || '';
            bValue = b.symbol || '';
            break;
          default:
            aValue = a.sellDate || '';
            bValue = b.sellDate || '';
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return filtered;
  }, [items, searchTerm, sortBy, sortOrder]);
};

// Custom hook for optimized analytics
const useOptimizedAnalytics = (items, totalProfit) => {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return {
        totalSold: 0,
        totalProfit: 0,
        profitableTrades: 0,
        lossTrades: 0,
        profitPercentage: 0
      };
    }

    // Use a more efficient calculation for large datasets
    const totalSold = items.length;
    const sampleSize = Math.min(100, totalSold); // Sample size for performance
    const sampleItems = items.slice(0, sampleSize);
    
    let profitableTrades = 0;
    let lossTrades = 0;
    
    // Single pass through sample items
    for (let i = 0; i < sampleItems.length; i++) {
      const profit = sampleItems[i].profit || 0;
      if (profit > 0) {
        profitableTrades++;
      } else if (profit < 0) {
        lossTrades++;
      }
    }
    
    const profitPercentage = sampleItems.length > 0 ? (profitableTrades / sampleItems.length) * 100 : 0;

    return {
      totalSold,
      totalProfit: totalProfit || 0,
      profitableTrades,
      lossTrades,
      profitPercentage
    };
  }, [items, totalProfit]);
};

const SoldItems = () => {
  const { soldItems, totalProfit, dispatch, fixSellPricesForSoldItems } = useETFTrading();
  
  // Optimized state management
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('sellDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSoldItem, setSelectedSoldItem] = useState(null);
  const [editMode, setEditMode] = useState('view');
  const [isLoading, setIsLoading] = useState(false);
  
  // Virtualization refs
  const listRef = useRef();
  const searchInputRef = useRef();

  // Debounced search with optimized timing
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Force refresh hook to update after reconciliation
  const [, forceRerender] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150); // Reduced to 150ms for faster response
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // If any sold item has sellPrice 0, schedule a gentle rerender; reconciliation will update it
  useEffect(() => {
    if (soldItems && soldItems.some(s => Number(s.sellPrice) === 0 && Number(s.quantity) > 0)) {
      const t = setTimeout(() => forceRerender(x => x + 1), 2000);
      return () => clearTimeout(t);
    }
  }, [soldItems]);

  // Use custom hooks for optimized operations
  const filteredSoldItems = useOptimizedFiltering(soldItems, debouncedSearchTerm, sortBy, sortOrder);
  const analytics = useOptimizedAnalytics(soldItems, totalProfit);

  // Optimized handlers with useCallback
  const handleEditSoldItem = useCallback((item, mode = 'view') => {
    if (mode === 'delete') {
      // Handle delete directly
      if (window.confirm(`Are you sure you want to delete ${item.symbol}? This action cannot be undone.`)) {
        dispatch({ type: 'REMOVE_SOLD_ITEM', payload: item.id });
      }
      return;
    }
    
    setSelectedSoldItem(item);
    setEditMode(mode);
    setShowEditModal(true);
  }, [dispatch]);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedSoldItem(null);
    setEditMode('view');
  }, []);

  const handleSortChange = useCallback((field, order) => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  // Clear search with focus
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  }, []);

  // Loading state for initial load
  useEffect(() => {
    // Remove loading state for empty data - show empty state immediately
    if (soldItems && soldItems.length > 0) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 50); // Reduced loading time
      return () => clearTimeout(timer);
    } else {
      // Don't show loading for empty data
      setIsLoading(false);
    }
  }, [soldItems]);

  // Virtualization data
  const virtualizedData = useMemo(() => ({
    items: filteredSoldItems,
    onEditItem: handleEditSoldItem
  }), [filteredSoldItems, handleEditSoldItem]);

  // Don't show loading state for empty data
  if (isLoading && soldItems && soldItems.length > 0) {
    return (
      <div className="min-h-screen bg-upstox-primary text-upstox-primary flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-accent-blue mx-auto mb-4" />
          <p className="text-upstox-secondary">Loading sold items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-upstox-primary text-upstox-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-blue-light rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-upstox-primary">Sold Items</h1>
                <p className="text-upstox-secondary">Track your completed trades and performance</p>
              </div>
            </div>
            
            {/* Fix Sell Prices Button */}
            <button
              onClick={async () => {
                const itemsWithZeroPrice = soldItems.filter(item => 
                  !Number.isFinite(item.sellPrice) || item.sellPrice <= 0
                );
                
                if (itemsWithZeroPrice.length === 0) {
                  alert('No sold items need sell price fixes!');
                  return;
                }
                
                console.log('🔧 Starting sell price fix...');
                alert(`Found ${itemsWithZeroPrice.length} items with sell price issues. Starting fix... Check console for progress.`);
                
                try {
                  const result = await fixSellPricesForSoldItems();
                  alert(`Sell price fix completed! ${result.message}`);
                } catch (error) {
                  console.error('❌ Error during sell price fix:', error);
                  alert('Error during sell price fix. Check console for details.');
                }
              }}
              className="btn-upstox-primary text-sm"
              title="Fix sell prices showing ₹0.00"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Fix Sell Prices
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary-50 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500 mb-1">Total Sold</p>
                <p className="text-2xl font-bold text-neutral-900">{analytics.totalSold}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-success-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-success-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500 mb-1">Total Profit</p>
                <p className="text-2xl font-bold text-neutral-900">₹{analytics.totalProfit.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-success-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-success-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500 mb-1">Profitable Trades</p>
                <p className="text-2xl font-bold text-neutral-900">{analytics.profitableTrades}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-error-50 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-error-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500 mb-1">Loss Trades</p>
                <p className="text-2xl font-bold text-neutral-900">{analytics.lossTrades}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-neutral-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500 mb-1">Success Rate</p>
                <p className="text-2xl font-bold text-neutral-900">{analytics.profitPercentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by symbol, name, or sector..."
                    className="input pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-600">Sort by:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    handleSortChange(field, order);
                  }}
                  className="input text-sm"
                >
                  <option value="sellDate-desc">Sell Date (Newest)</option>
                  <option value="sellDate-asc">Sell Date (Oldest)</option>
                  <option value="profit-desc">Profit (High to Low)</option>
                  <option value="profit-asc">Profit (Low to High)</option>
                  <option value="profitPercentage-desc">Profit % (High to Low)</option>
                  <option value="profitPercentage-asc">Profit % (Low to High)</option>
                  <option value="symbol-asc">Symbol (A-Z)</option>
                  <option value="symbol-desc">Symbol (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Showing {filteredSoldItems.length} sold items
          </p>
        </div>

        {/* Virtualized Sold Items Table */}
        <div className="card-upstox overflow-x-auto">
          {/* Table Header */}
          <div className="bg-upstox-tertiary px-6 py-3 border-b border-upstox-primary">
            <div className="grid holdings-grid gap-4 text-xs font-medium text-upstox-secondary uppercase tracking-wider" style={{minWidth:1750}}>
              <div>Symbol</div>
              <div>Name</div>
              <div>Sector</div>
              <div>Buy Date</div>
              <div>Sell Date</div>
              <div>Quantity</div>
              <div>Buy Price</div>
              <div>Sell Price</div>
              <div>Profit</div>
              <div>Profit %</div>
              <div>Actions</div>
            </div>
          </div>

          {/* Virtualized List */}
          {filteredSoldItems.length > 0 ? (
            <div style={{ height: '600px', minWidth: 1750 }}>
              <List
                ref={listRef}
                height={600}
                width={1750}
                itemCount={filteredSoldItems.length}
                itemSize={60}
                itemData={virtualizedData}
                overscanCount={5}
              >
                {VirtualizedRow}
              </List>
            </div>
          ) : (
            <div className="p-6 text-center text-upstox-secondary">
              No sold items found.
            </div>
          )}
        </div>
      
        {/* Edit Sold Item Modal */}
        <EditSoldItemModal
          isOpen={showEditModal}
          onClose={closeEditModal}
          soldItem={selectedSoldItem}
          mode={editMode}
        />
      </div>
    </div>
  );
};

export default SoldItems; 