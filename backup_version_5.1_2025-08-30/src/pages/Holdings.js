import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useETFTrading } from '../context/ETFTradingContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Package,
  AlertCircle,
  RefreshCw,
  Eye,
  Edit,
  Loader,
  Search,
  Trash2,
  BarChart3,
  Plus,
  Minus
} from 'lucide-react';
import EditHoldingModal from '../components/EditHoldingModal';
import mstocksApiService from '../services/mstocksApi';
// Removed unused alternate APIs to ensure single source of truth

// Virtualized row component for better performance
const VirtualizedHoldingRow = React.memo(({ index, style, data }) => {
  const { items, onEditHolding, onSell, onDelete } = data;
  const holding = items[index];
  
  if (!holding) return null;

  const calculateProfit = (holding) => {
    const avg = Number(holding.avgPrice ?? holding.buyPrice ?? 0);
    return (holding.quantity * holding.currentPrice) - (holding.quantity * avg);
  };

  const calculateProfitPercentage = (holding) => {
    const avg = Number(holding.avgPrice ?? holding.buyPrice ?? 0);
    const totalInvested = holding.quantity * avg;
    return totalInvested > 0 ? ((holding.quantity * holding.currentPrice) - totalInvested) / totalInvested * 100 : 0;
  };

  const profit = calculateProfit(holding);
  const profitPercentage = calculateProfitPercentage(holding);

  return (
    <div style={style} className="grid holdings-grid gap-4 px-6 py-3 border-b border-upstox-primary hover:bg-upstox-tertiary items-center transition-colors duration-200">
      <div className="text-sm font-medium text-upstox-primary">
        {holding.symbol}
      </div>
      <div className="text-sm text-upstox-secondary">
        {holding.name}
      </div>
      <div className="text-sm text-upstox-secondary">
        {holding.sector}
      </div>
      <div className="text-sm text-upstox-secondary">
        {holding.buyDate || 'N/A'}
      </div>
      <div className="text-sm font-medium text-upstox-primary">
        {holding.quantity}
      </div>
      <div className="text-sm font-medium text-upstox-primary">
        ₹{(Number(holding.buyPrice) > 0 ? holding.buyPrice : holding.avgPrice)?.toFixed(2)}
      </div>
      <div className="text-sm font-medium text-upstox-primary">
        ₹{holding.currentPrice?.toFixed(2)}
      </div>
      <div className="text-sm font-semibold">
        <span className={profit >= 0 ? 'text-positive' : 'text-negative'}>
          ₹{profit?.toFixed(2)}
        </span>
      </div>
      <div className="text-sm font-semibold">
        <span className={profitPercentage >= 0 ? 'text-positive' : 'text-negative'}>
          {profitPercentage?.toFixed(2) || '0.00'}%
        </span>
      </div>
      <div className="text-xs">
        {holding.chunkId ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-upstox-tertiary text-upstox-primary border border-upstox-primary">
            {holding.chunkInfo?.displayName || `#${holding.chunkId}`}
            {holding.chunkInfo?.compoundLevel > 0 && (
              <span className="ml-1 bg-positive text-white px-1 rounded">L{holding.chunkInfo.compoundLevel}</span>
            )}
            {holding.chunkInfo?.reconciled && <span className="ml-1">📋</span>}
          </span>
        ) : (
          <span className="text-upstox-secondary">-</span>
        )}
      </div>
      <div className="text-sm font-medium">
        <div className="flex gap-1">
          <button
            onClick={() => onEditHolding(holding, 'view')}
            className="p-1.5 text-upstox-secondary hover:text-upstox-primary hover:bg-upstox-tertiary rounded-md transition-colors"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onEditHolding(holding, 'edit')}
            className="p-1.5 text-accent-blue hover:text-accent-blue-hover hover:bg-upstox-tertiary rounded-md transition-colors"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onSell(holding)}
            className="px-2 py-1 text-xs bg-negative text-white rounded-md hover:bg-negative-hover transition-colors font-medium"
            title="Sell"
          >
            Sell
          </button>
          <button
            onClick={() => onDelete(holding)}
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
const useOptimizedHoldingFiltering = (items, searchTerm, sortBy, sortOrder) => {
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
          case 'symbol':
            aValue = a.symbol || '';
            bValue = b.symbol || '';
            break;
          case 'profit':
            aValue = (a.quantity * a.currentPrice) - (a.quantity * a.avgPrice);
            bValue = (b.quantity * b.currentPrice) - (b.quantity * b.avgPrice);
            break;
          case 'profitPercentage':
            const aTotalInvested = a.quantity * a.avgPrice;
            const bTotalInvested = b.quantity * b.avgPrice;
            aValue = aTotalInvested > 0 ? ((a.quantity * a.currentPrice) - aTotalInvested) / aTotalInvested * 100 : 0;
            bValue = bTotalInvested > 0 ? ((b.quantity * b.currentPrice) - bTotalInvested) / bTotalInvested * 100 : 0;
            break;
          case 'currentValue':
            aValue = a.quantity * a.currentPrice;
            bValue = b.quantity * b.currentPrice;
            break;
          default:
            aValue = a.symbol || '';
            bValue = b.symbol || '';
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
const useOptimizedHoldingAnalytics = (items) => {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return {
        totalInvested: 0,
        totalCurrentValue: 0,
        totalProfit: 0,
        totalProfitPercentage: 0
      };
    }

    // Use a more efficient calculation for large datasets
    const totalInvested = items.reduce((sum, holding) => {
      return sum + (holding.quantity * holding.avgPrice);
    }, 0);

    const totalCurrentValue = items.reduce((sum, holding) => {
      return sum + (holding.quantity * holding.currentPrice);
    }, 0);

    const totalProfit = totalCurrentValue - totalInvested;
    const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfit,
      totalProfitPercentage
    };
  }, [items]);
};

const Holdings = () => {
  const { 
    dispatch,
    holdings: contextHoldings,
    actionTypes,
    saveCriticalData
  } = useETFTrading();

  const [holdings, setHoldings] = useState([]);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [priceUpdateMessage, setPriceUpdateMessage] = useState('');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMode, setEditMode] = useState('edit');

  // Performance states
  const [isLoading, setIsLoading] = useState(false);

  // Search and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('symbol');
  const [sortOrder, setSortOrder] = useState('asc');

  // Virtualization refs
  const listRef = useRef();
  const searchInputRef = useRef();

  // Force refresh state
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh function
  const forceRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Function to check if market is open (NSE trading hours: 9:15 AM to 3:30 PM IST, Monday to Friday)
  const isMarketOpen = useCallback(() => {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
    const day = istTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    const currentTime = hour * 100 + minute; // Convert to HHMM format
    
    // Check if it's a weekday (Monday = 1 to Friday = 5)
    const isWeekday = day >= 1 && day <= 5;
    
    // Check if it's within market hours (9:15 AM to 3:30 PM IST)
    const isMarketHours = currentTime >= 915 && currentTime <= 1530;
    
    return isWeekday && isMarketHours;
  }, []);

  // Debounced search with optimized timing
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150); // Reduced to 150ms for faster response
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Use context holdings if available, otherwise use local state
  const currentHoldings = contextHoldings && contextHoldings.length > 0 ? contextHoldings : holdings;
  
  // Debug: Log current holdings data
  useEffect(() => {
    console.log('📊 Current holdings data:', currentHoldings.map(h => ({
      symbol: h.symbol,
      currentPrice: h.currentPrice,
      avgPrice: h.avgPrice
    })));
  }, [currentHoldings]);

  // Use custom hooks for optimized operations
  const filteredHoldings = useOptimizedHoldingFiltering(currentHoldings, debouncedSearchTerm, sortBy, sortOrder);
  const analytics = useOptimizedHoldingAnalytics(currentHoldings);

  // Function to fetch live prices for holdings using MStocks API
  const refreshLivePrices = useCallback(async () => {
    console.log('🔄 Refresh prices');
    
    if (currentHoldings.length === 0) {
      console.log('No holdings to refresh prices for');
      return;
    }
    
    setIsRefreshingPrices(true);
    
    try {
      let updatedHoldings = [...currentHoldings];
      let successCount = 0;
      let errorCount = 0;
      let dataSource = '';
      
      // Check MStocks connection
      const isMStocksConnected = mstocksApiService.isLoggedIn();
      console.log(`🔍 MStocks connected: ${isMStocksConnected}`);
      
      // Process each holding to fetch live price
      for (let i = 0; i < updatedHoldings.length; i++) {
        const holding = updatedHoldings[i];
        
        try {
          // Extract symbol without NSE: prefix if present
          const cleanSymbol = holding.symbol.replace('NSE:', '').replace('BSE:', '');
          
          let newPrice = null;
          if (isMStocksConnected) {
            try {
              console.log(`📈 Fetching price for ${cleanSymbol} from MStocks API...`);
              const priceData = await mstocksApiService.getLivePrice(holding.symbol);
              const ltp = Number(
                priceData?.data?.price ??
                priceData?.lastPrice ??
                priceData?.price ??
                priceData?.data?.ltp ??
                0
              );
              if (ltp > 0) {
                newPrice = ltp;
                dataSource = priceData?.data?.source || 'MStocks API';
                console.log(`✅ MStocks price for ${cleanSymbol}: ₹${newPrice}`);
              } else {
                console.warn(`⚠️ Browser MStocks API returned no valid price for ${cleanSymbol}:`, priceData);
              }
            } catch (mstocksError) {
              console.warn(`⚠️ Browser MStocks API failed for ${cleanSymbol}:`, mstocksError.message);
            }
          }
          
          // No valid price found
          if (!newPrice) {
            console.log(`⚠️ No valid price found for ${cleanSymbol} from any API`);
          }
          
          // Update holding if we got a valid price
          if (newPrice && !isNaN(newPrice) && newPrice > 0) {
            console.log(`📊 Before update - ${cleanSymbol}: avgPrice=₹${holding.avgPrice}, currentPrice=₹${holding.currentPrice}`);
            holding.currentPrice = newPrice;
            holding.currentValue = holding.quantity * holding.currentPrice;
            holding.profitLoss = holding.currentValue - (holding.quantity * holding.avgPrice);
            holding.profitPercentage = (holding.quantity * holding.avgPrice) > 0 ? 
              (holding.profitLoss / (holding.quantity * holding.avgPrice)) * 100 : 0;
            
            console.log(`✅ After update - ${cleanSymbol}: avgPrice=₹${holding.avgPrice}, currentPrice=₹${holding.currentPrice}, newPrice=₹${newPrice}`);
            console.log(`✅ Updated ${cleanSymbol}: ₹${newPrice} (${dataSource})`);
            successCount++;
          } else {
            console.warn(`⚠️ No valid price found for ${cleanSymbol} - newPrice: ${newPrice}`);
            errorCount++;
          }
          
          // Add small delay to avoid overwhelming the APIs
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`❌ Error fetching price for ${holding.symbol}:`, error);
          errorCount++;
        }
      }
      
      // Update context state if using context holdings, otherwise update local state
      if (contextHoldings && contextHoldings.length > 0) {
        console.log('🔄 Updating context holdings with new prices...');
        updatedHoldings.forEach(holding => {
          console.log(`📊 Dispatching update for ${holding.symbol}: ₹${holding.currentPrice}`);
          dispatch({ type: 'UPDATE_HOLDING', payload: holding });
        });
        // Force refresh to ensure UI updates
        forceRefresh();
      } else {
        console.log('🔄 Updating local holdings with new prices...');
        setHoldings(updatedHoldings);
      }
      
      const marketStatus = isMarketOpen() ? 'Live prices' : 'Latest available prices';
      const message = `${marketStatus} updated via MStocks API! (${successCount} success, ${errorCount} failed)`;
      setPriceUpdateMessage(message);
      setTimeout(() => setPriceUpdateMessage(''), 5000);
      
    } catch (error) {
      console.error('❌ Error updating prices:', error);
      setPriceUpdateMessage('Error updating prices. Please try again.');
      setTimeout(() => setPriceUpdateMessage(''), 3000);
    } finally {
      setIsRefreshingPrices(false);
    }
  }, [currentHoldings, isMarketOpen, contextHoldings, dispatch]);

  // Load holdings from CSV data with loading state (only if context doesn't have holdings)
  useEffect(() => {
    if (!contextHoldings || contextHoldings.length === 0) {
      setIsLoading(true);
      
      // Simulate loading delay for better UX
      const timer = setTimeout(() => {
        setHoldings([]); // Ensure new users see empty holdings
        setIsLoading(false);
      }, 50); // Reduced loading time
      
      return () => clearTimeout(timer);
    } else {
      // If context has holdings, use them and clear local state
      setHoldings([]);
      setIsLoading(false);
    }
  }, [contextHoldings]);

  const handleSell = useCallback((holding) => {
    setSelectedHolding(holding);
    setSellQuantity(holding.quantity.toString());
    setSellPrice(holding.currentPrice.toString());
    setShowSellModal(true);
  }, []);

  const handleEditHolding = useCallback((holding, mode = 'view') => {
    setSelectedHolding(holding);
    setEditMode(mode);
    setShowEditModal(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedHolding(null);
    setEditMode('edit');
  }, []);

  const closeSellModal = useCallback(() => {
    setShowSellModal(false);
    setSelectedHolding(null);
    setSellQuantity('');
    setSellPrice('');
  }, []);

  // Completely new simplified sell approach
  const confirmSell = useCallback(() => {
    console.log('🔍 confirmSell called - NEW APPROACH');
    
    if (!selectedHolding || !sellQuantity || !sellPrice) {
      alert('Please fill in all required fields');
      return;
    }

    const quantity = parseInt(sellQuantity);
    const sellPriceValue = parseFloat(sellPrice);
    const holdingToSell = selectedHolding; // Store reference before clearing
    
    if (quantity > holdingToSell.quantity) {
      alert('Sell quantity cannot exceed available quantity');
      return;
    }

    // Close modal FIRST - before any processing
    setShowSellModal(false);
    setSelectedHolding(null);
    setSellQuantity('');
    setSellPrice('');

    // Use a simple timeout to ensure modal is closed
    setTimeout(() => {
      try {
        // Calculate profit/loss
        const totalInvested = quantity * holdingToSell.avgPrice;
        const totalSold = quantity * sellPriceValue;
        const profit = totalSold - totalInvested;
        const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

        // Create sold item
        const soldItem = {
          id: `sold_${Date.now()}`,
          symbol: holdingToSell.symbol,
          name: holdingToSell.name,
          sector: holdingToSell.sector,
          buyDate: holdingToSell.buyDate,
          sellDate: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
          }),
          buyPrice: holdingToSell.avgPrice,
          sellPrice: sellPriceValue,
          quantity: quantity,
          totalInvested: totalInvested,
          profit: profit,
          profitPercentage: profitPercentage,
          sellReason: 'Manual sale',
          notes: `Sold ${quantity} shares at ₹${sellPriceValue}`
        };

        console.log('📦 Created sold item:', soldItem);

        // Simple dispatch calls
        dispatch({ type: 'ADD_SOLD_ITEM', payload: soldItem });

        if (quantity === holdingToSell.quantity) {
          console.log('🗑️ Removing holding completely...');
          dispatch({ type: 'REMOVE_HOLDING', payload: holdingToSell.id });
        } else {
          console.log('✏️ Updating holding for partial sale...');
          const updatedHolding = {
            ...holdingToSell,
            quantity: holdingToSell.quantity - quantity,
            totalInvested: (holdingToSell.quantity - quantity) * holdingToSell.avgPrice,
            currentValue: (holdingToSell.quantity - quantity) * holdingToSell.currentPrice
          };
          updatedHolding.profitLoss = updatedHolding.currentValue - updatedHolding.totalInvested;
          updatedHolding.profitPercentage = updatedHolding.totalInvested > 0 ? 
            (updatedHolding.profitLoss / updatedHolding.totalInvested) * 100 : 0;
          
          dispatch({ type: 'UPDATE_HOLDING', payload: updatedHolding });
        }

        // Force refresh the component instead of page reload
        forceRefresh();
        
        // Show success message
        alert(`Successfully sold ${quantity} shares of ${holdingToSell.symbol} at ₹${sellPriceValue}`);
        
      } catch (error) {
        console.error('❌ Error in sell processing:', error);
        alert('Error processing sale. Please try again.');
      }
    }, 200); // Longer delay to ensure modal is fully closed
    
  }, [selectedHolding, sellQuantity, sellPrice, dispatch, forceRefresh]);

  // Optimized handlers
  const handleSortChange = useCallback((field, order) => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  }, []);

  // Virtualization data
  const virtualizedData = useMemo(() => ({
    items: filteredHoldings,
    onEditHolding: handleEditHolding,
    onSell: handleSell,
    onDelete: (holding) => {
      if (window.confirm(`Are you sure you want to delete ${holding.symbol}? This action cannot be undone.`)) {
        dispatch({ type: actionTypes.REMOVE_HOLDING, payload: holding.id });
        // Immediate save after manual delete
        if (saveCriticalData) {
          setTimeout(() => saveCriticalData('manual holding delete'), 100);
        }
        forceRefresh();
        alert(`Holding for ${holding.symbol} deleted.`);
      }
    }
  }), [filteredHoldings, handleEditHolding, handleSell, dispatch, forceRefresh, actionTypes]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-upstox-primary text-upstox-primary flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-accent-blue mx-auto mb-4" />
          <p className="text-upstox-secondary">Loading holdings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-upstox-primary text-upstox-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-blue-light rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-upstox-primary">Holdings</h1>
              <p className="text-upstox-secondary">Track your current ETF investments and performance</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshLivePrices}
              disabled={isRefreshingPrices}
              className="btn-upstox-primary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingPrices ? 'animate-spin' : ''}`} />
              Refresh Prices
            </button>
          </div>
        </div>

        {/* Price Update Message */}
        {priceUpdateMessage && (
          <div className="mb-6 p-4 card-upstox">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-upstox-primary" />
              <span className="text-sm font-medium text-upstox-primary">{priceUpdateMessage}</span>
            </div>
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card-upstox">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-upstox-tertiary rounded-lg">
                  <DollarSign className="h-6 w-6 text-accent-blue" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-upstox-secondary mb-1">Total Invested</p>
                <p className="text-2xl font-bold text-upstox-primary">₹{analytics.totalInvested.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="card-upstox">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-upstox-tertiary rounded-lg">
                  <Package className="h-6 w-6 text-upstox-secondary" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-upstox-secondary mb-1">Current Value</p>
                <p className="text-2xl font-bold text-upstox-primary">₹{analytics.totalCurrentValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="card-upstox">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-upstox-tertiary">
                  {analytics.totalProfit >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-positive" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-negative" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-upstox-secondary mb-1">Total P&L</p>
                <p className={`text-2xl font-bold ${analytics.totalProfit >= 0 ? 'text-positive' : 'text-negative'}`}>
                  ₹{analytics.totalProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="card-upstox">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-upstox-tertiary">
                  <Calendar className={`h-6 w-6 ${analytics.totalProfitPercentage >= 0 ? 'text-positive' : 'text-negative'}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-upstox-secondary mb-1">P&L %</p>
                <p className={`text-2xl font-bold ${analytics.totalProfitPercentage >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {analytics.totalProfitPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="card-upstox mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium text-upstox-primary mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-upstox-secondary h-4 w-4" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by symbol, name, or sector..."
                    className="input-upstox pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-upstox-secondary hover:text-upstox-primary"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-upstox-secondary">Sort by:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    handleSortChange(field, order);
                  }}
                  className="input-upstox text-sm"
                >
                  <option value="symbol-asc">Symbol (A-Z)</option>
                  <option value="symbol-desc">Symbol (Z-A)</option>
                  <option value="profit-desc">Profit (High to Low)</option>
                  <option value="profit-asc">Profit (Low to High)</option>
                  <option value="profitPercentage-desc">Profit % (High to Low)</option>
                  <option value="profitPercentage-asc">Profit % (Low to High)</option>
                  <option value="currentValue-desc">Current Value (High to Low)</option>
                  <option value="currentValue-asc">Current Value (Low to High)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Add Holding Form */}
        <div className="card-upstox mb-8">
          <div className="px-6 py-4 border-b border-upstox-primary bg-upstox-tertiary">
            <h3 className="text-lg font-semibold text-upstox-primary">Add New Holding</h3>
          </div>
          <div className="p-6">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const symbol = formData.get('symbol');
              const name = formData.get('name');
              const quantity = formData.get('quantity');
              const buyPrice = formData.get('buyPrice');
              const currentPrice = formData.get('currentPrice');
              const sector = formData.get('sector') || 'General';
              const buyDate = formData.get('buyDate') || new Date().toISOString().split('T')[0];

              if (!symbol || !name || !quantity || !buyPrice || !currentPrice) {
                alert('Please fill in all required fields');
                return;
              }

              // Validate date
              if (buyDate && new Date(buyDate) > new Date()) {
                alert('Buy date cannot be in the future');
                return;
              }

              const totalInvested = parseFloat(buyPrice) * parseInt(quantity);
              const currentValue = parseFloat(currentPrice) * parseInt(quantity);
              const profitLoss = currentValue - totalInvested;
              const profitPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

              const newHolding = {
                id: `holding_${Date.now()}`,
                symbol: symbol.toUpperCase(),
                name: name,
                sector: sector,
                buyDate: buyDate,
                buyPrice: parseFloat(buyPrice),
                quantity: parseInt(quantity),
                currentPrice: parseFloat(currentPrice),
                totalInvested: totalInvested,
                currentValue: currentValue,
                profitLoss: profitLoss,
                profitPercentage: profitPercentage,
                avgPrice: parseFloat(buyPrice),
                lastBuyPrice: parseFloat(buyPrice),
                lastBuyDate: buyDate,
                notes: 'Added via form'
              };

              dispatch({ type: 'ADD_HOLDING', payload: newHolding });
              // Immediate save after manual add
              if (saveCriticalData) {
                setTimeout(() => saveCriticalData('manual holding add'), 100);
              }
              e.target.reset();
              alert('Holding added successfully!');
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-upstox-primary mb-1">Symbol *</label>
                  <input
                    name="symbol"
                    type="text"
                    placeholder="e.g., NSE:MAHKTECH"
                    className="input-upstox"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-upstox-primary mb-1">Name *</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="ETF Name"
                    className="input-upstox"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-upstox-primary mb-1">Quantity *</label>
                  <input
                    name="quantity"
                    type="number"
                    placeholder="100"
                    min="1"
                    className="input-upstox"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-upstox-primary mb-1">Buy Price (₹) *</label>
                  <input
                    name="buyPrice"
                    type="number"
                    placeholder="50.00"
                    step="0.01"
                    min="0"
                    className="input-upstox"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-upstox-primary mb-1">Current Price (₹) *</label>
                  <input
                    name="currentPrice"
                    type="number"
                    placeholder="55.00"
                    step="0.01"
                    min="0"
                    className="input-upstox"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-upstox-primary mb-1">Sector</label>
                  <input
                    name="sector"
                    type="text"
                    placeholder="Technology"
                    className="input-upstox"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-upstox-primary mb-1">Buy Date</label>
                  <input
                    name="buyDate"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    max={new Date().toISOString().split('T')[0]}
                    className="input-upstox"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="btn-upstox-primary w-full"
                  >
                    Add Holding
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-upstox-secondary">
            Showing {filteredHoldings.length} holdings
          </p>
        </div>

        {/* Virtualized Holdings Table */}
        <div className="card-upstox overflow-x-auto">
          <div style={{ minWidth: 1750 }}>
            {/* Table Header */}
            <div className="bg-upstox-tertiary px-6 py-3 border-b border-upstox-primary">
              <div className="grid holdings-grid gap-4 text-xs font-medium text-upstox-secondary uppercase tracking-wider">
                <div>Symbol</div>
                <div>Name</div>
                <div>Sector</div>
                <div>Buy Date</div>
                <div>Quantity</div>
                <div>Buy Price</div>
                <div>Current Price</div>
                <div>P&L</div>
                <div>P&L %</div>
                <div>Chunk</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Virtualized List */}
            {filteredHoldings.length > 0 ? (
              <div style={{ height: '600px' }}>
                <List
                  key={refreshKey} // Add key to force re-render
                  ref={listRef}
                  height={600}
                  width={1750}
                  itemCount={filteredHoldings.length}
                  itemSize={60}
                  itemData={virtualizedData}
                  overscanCount={5}
                >
                  {VirtualizedHoldingRow}
                </List>
              </div>
            ) : (
              <div className="p-6 text-center text-upstox-secondary">
                No holdings found.
              </div>
            )}
          </div>
        </div>

        {/* Sell Modal */}
        {showSellModal && selectedHolding && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeSellModal}
          >
            <div 
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Sell {selectedHolding.symbol}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                    className="input"
                    max={selectedHolding.quantity}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="input"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={confirmSell}
                  className="btn btn-danger flex-1"
                >
                  Confirm Sell
                </button>
                <button
                  onClick={closeSellModal}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Holding Modal */}
        <EditHoldingModal
          isOpen={showEditModal}
          onClose={closeEditModal}
          holding={selectedHolding}
          mode={editMode}
        />
      </div>
    </div>
  );
};

export default Holdings;