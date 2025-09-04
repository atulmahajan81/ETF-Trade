import React, { useMemo, useState } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { TrendingUp, TrendingDown, CheckCircle, AlertCircle, Loader, ArrowRightCircle, Clock, RefreshCw, Trash2, XCircle } from 'lucide-react';
import TradingModal from '../components/TradingModal';

const Eligible = () => {
  const {
    etfs,
    holdings,
    averagingThreshold,
    targetProfit,
    isTradingEnabled,
    tradingStatus,
    tradingMessage,
    pendingOrders,
    orderHistory,
    checkOrderStatus,
    cancelOrder
  } = useETFTrading();

  const [isPlacing] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [tradingMode, setTradingMode] = useState('buy');
  const [selectedItem, setSelectedItem] = useState(null);

  // Best Buy: Top-ranked ETF (not already in holdings) by % below 20 DMA
  const bestBuy = useMemo(() => {
    if (!etfs || etfs.length === 0) return null;

    // Keep only ETFs with valid cmp and dma20
    const validETFs = etfs.filter(e => Number(e.cmp) > 0 && Number(e.dma20) > 0);

    // Mark holdings and compute percent difference
    const ranked = validETFs
      .map(etf => {
        const isHolding = holdings?.some(h => h.symbol === etf.symbol);
        const percentDiff = ((etf.cmp - etf.dma20) / etf.dma20) * 100;
        return { ...etf, isHolding, percentDiff };
      })
      // Exclude ETFs already in holdings for buy candidates
      .filter(etf => !etf.isHolding)
      // Sort by most below DMA first
      .sort((a, b) => a.percentDiff - b.percentDiff);

    return ranked[0] || null;
  }, [etfs, holdings]);

  // Best Sell: Holding with highest absolute profit that meets target profit percent
  const bestSell = useMemo(() => {
    if (!holdings || holdings.length === 0) return null;
    const withProfit = holdings
      .map(h => {
        const buy = h.avgPrice || h.buyPrice || 0;
        const cmp = h.currentPrice || buy;
        const profitPercent = buy > 0 ? ((cmp - buy) / buy) * 100 : 0;
        const absoluteProfit = (cmp - buy) * (h.quantity || 0);
        return { ...h, profitPercent, absoluteProfit };
      })
      .filter(h => h.profitPercent >= targetProfit)
      .sort((a, b) => b.absoluteProfit - a.absoluteProfit);
    return withProfit[0] || null;
  }, [holdings, targetProfit]);

  const handlePlaceBestBuy = async () => {
    if (!bestBuy) return;
    // Open modal to allow quantity and order type selection
    setSelectedItem({ symbol: bestBuy.symbol, currentPrice: bestBuy.cmp, cmp: bestBuy.cmp });
    setTradingMode('buy');
    setShowTradingModal(true);
  };

  const handlePlaceBestSell = async () => {
    if (!bestSell) return;
    // Open modal to allow quantity and order type selection for sell
    setSelectedItem({ ...bestSell, currentPrice: bestSell.currentPrice });
    setTradingMode('sell');
    setShowTradingModal(true);
  };

  const handleRefreshOrders = async () => {
    try {
      for (const o of pendingOrders || []) {
        if (o.orderId) await checkOrderStatus(o.orderId);
      }
    } catch (e) {}
  };

  const StatusBanner = () => (
    <div className={`mb-4 p-3 rounded-md flex items-center gap-2 ${
      tradingStatus === 'success' ? 'bg-green-50 text-green-800' :
      tradingStatus === 'error' ? 'bg-red-50 text-red-800' :
      tradingStatus === 'loading' ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-800'
    }`}>
      {tradingStatus === 'success' && <CheckCircle className="w-4 h-4" />}
      {tradingStatus === 'error' && <AlertCircle className="w-4 h-4" />}
      {tradingStatus === 'loading' && <Loader className="w-4 h-4 animate-spin" />}
      <span className="text-sm font-medium">{typeof tradingMessage === 'string' ? tradingMessage : JSON.stringify(tradingMessage)}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Eligible Actions</h1>
        <p className="text-gray-600 mb-6">One-click best buy and sell based on your strategy.</p>

        <StatusBanner />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Buy Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Best Buy</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${isTradingEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isTradingEnabled ? 'Trading Enabled' : 'Trading Disabled'}
              </span>
            </div>

            {bestBuy ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Symbol</span>
                  <span className="text-sm font-medium">{bestBuy.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">CMP</span>
                  <span className="text-sm font-medium">₹{bestBuy.cmp?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">DMA20</span>
                  <span className="text-sm font-medium">₹{bestBuy.dma20?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Below DMA20</span>
                  <span className="text-sm font-medium">{(((bestBuy.cmp - bestBuy.dma20) / bestBuy.dma20) * 100).toFixed(2)}%</span>
                </div>
                <button
                  onClick={handlePlaceBestBuy}
                  disabled={isPlacing}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                >
                  {isPlacing ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRightCircle className="w-4 h-4" />}
                  Buy Now
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No eligible ETF found.</p>
            )}
          </div>

          {/* Best Sell Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Best Sell</h3>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">Target ≥ {targetProfit}%</span>
            </div>

            {bestSell ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Symbol</span>
                  <span className="text-sm font-medium">{bestSell.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Qty</span>
                  <span className="text-sm font-medium">{bestSell.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Price</span>
                  <span className="text-sm font-medium">₹{(bestSell.avgPrice || bestSell.buyPrice)?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">CMP</span>
                  <span className="text-sm font-medium">₹{bestSell.currentPrice?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Profit %</span>
                  <span className="text-sm font-medium text-green-600">{bestSell.profitPercent.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Absolute Profit</span>
                  <span className="text-sm font-medium text-green-600">₹{bestSell.absoluteProfit.toFixed(2)}</span>
                </div>
                <button
                  onClick={handlePlaceBestSell}
                  disabled={isPlacing}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                >
                  {isPlacing ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRightCircle className="w-4 h-4" />}
                  Sell Now
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No holdings eligible for sell at target.</p>
            )}
          </div>
        </div>
      </div>

      {/* Orders Overview */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Pending Orders</h3>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{pendingOrders?.length || 0}</span>
            </div>
            <button
              onClick={handleRefreshOrders}
              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              disabled={!pendingOrders || pendingOrders.length === 0}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${(!pendingOrders || pendingOrders.length===0) ? '' : ''}`} /> Refresh
            </button>
          </div>
          {(!pendingOrders || pendingOrders.length === 0) ? (
            <p className="text-sm text-gray-500">No pending orders.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {pendingOrders.map((o) => (
                <li key={o.orderId || o.timestamp} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{o.type} {o.symbol}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">{(o.status || 'PENDING').toString()}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Qty: {o.quantity} • Price: {o.price ? `₹${o.price}` : 'Market'} • ID: {o.orderId || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">{o.timestamp ? new Date(o.timestamp).toLocaleString() : ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => o.orderId && checkOrderStatus(o.orderId)} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                        <RefreshCw className="w-3 h-3 mr-1" /> Status
                      </button>
                      {(o.status || 'PENDING') === 'PENDING' && o.orderId && (
                        <button onClick={() => cancelOrder(o.orderId)} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100">
                          <Trash2 className="w-3 h-3 mr-1" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{orderHistory?.length || 0}</span>
            </div>
          </div>
          {(!orderHistory || orderHistory.length === 0) ? (
            <p className="text-sm text-gray-500">No completed orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {orderHistory.slice(-10).reverse().map((o) => (
                <li key={(o.orderId || o.timestamp) + '_hist'} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{o.type} {o.symbol}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          (o.status || '').toUpperCase() === 'SUCCESS' || (o.status || '').toUpperCase() === 'COMPLETE'
                            ? 'bg-green-100 text-green-800'
                            : (o.status || '').toUpperCase() === 'REJECTED' || (o.status || '').toUpperCase() === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>{o.status || 'SUCCESS'}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Qty: {o.quantity} • Price: {o.price ? `₹${o.price}` : 'Market'} • ID: {o.orderId || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">{o.timestamp ? new Date(o.timestamp).toLocaleString() : ''}</div>
                      {o.message && <div className="text-xs text-gray-400">{o.message}</div>}
                    </div>
                    {(o.status || '').toUpperCase() === 'REJECTED' && (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    {/* Central trading modal for selecting quantity/order type */}
    <TradingModal
      isOpen={showTradingModal}
      onClose={() => setShowTradingModal(false)}
      mode={tradingMode}
      selectedItem={selectedItem}
    />
    </div>
  );
};

export default Eligible;
