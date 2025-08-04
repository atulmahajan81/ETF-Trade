import React, { useState, useEffect } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { Plus, TrendingDown, Filter, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const ETFRanking = () => {
  const { 
    etfs, 
    holdings, 
    targetProfit, 
    averagingThreshold,
    placeBuyOrder,
    placeBuyOrderWithLifecycle,
    checkTradingEnabled,
    isTradingEnabled,
    tradingStatus,
    tradingMessage
  } = useETFTrading();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedETF, setSelectedETF] = useState(null);
  const [filterSector, setFilterSector] = useState('all');
  const [orderType, setOrderType] = useState('MARKET'); // MARKET, LIMIT
  const [limitPrice, setLimitPrice] = useState('');

  // Check trading enabled on mount
  useEffect(() => {
    checkTradingEnabled();
  }, [checkTradingEnabled]);

  // Calculate percentage difference and rank ETFs
  const rankedETFs = etfs
    .map(etf => {
      const percentDiff = ((etf.cmp - etf.dma20) / etf.dma20) * 100;
      const isHolding = holdings.some(h => h.symbol === etf.symbol);
      return {
        ...etf,
        percentDiff,
        isHolding,
        rank: 0
      };
    })
    .sort((a, b) => a.percentDiff - b.percentDiff) // Sort by lowest to highest (most fallen first)
    .map((etf, index) => ({
      ...etf,
      rank: index + 1
    }));

  // Filter ETFs by sector
  const filteredETFs = filterSector === 'all' 
    ? rankedETFs 
    : rankedETFs.filter(etf => etf.sector === filterSector);

  // Get unique sectors
  const sectors = ['all', ...new Set(etfs.map(etf => etf.sector))];

  // Get new ETFs (not currently holding)
  const newETFs = filteredETFs.filter(etf => !etf.isHolding);

  // Get existing ETFs ready for averaging
  const existingETFsForAveraging = filteredETFs.filter(etf => {
    if (!etf.isHolding) return false;
    const holding = holdings.find(h => h.symbol === etf.symbol);
    if (!holding) return false;
    const fallPercent = ((holding.lastPurchasePrice - etf.cmp) / holding.lastPurchasePrice) * 100;
    return fallPercent >= averagingThreshold;
  });

  const handleBuyClick = (etf) => {
    setSelectedETF(etf);
    setShowBuyModal(true);
  };

  const handleBuy = async (quantity, price) => {
    try {
      if (!isTradingEnabled) {
        alert('Trading is not enabled. Please configure your MStocks API credentials.');
        return;
      }

      const orderData = {
        symbol: selectedETF.symbol,
        quantity: parseInt(quantity),
        price: orderType === 'MARKET' ? 0 : parseFloat(price),
        orderType: orderType,
        productType: 'CNC', // Cash and Carry
        validity: 'DAY'
      };

      await placeBuyOrderWithLifecycle(orderData);
      setShowBuyModal(false);
      setSelectedETF(null);
      setOrderType('MARKET');
      setLimitPrice('');
    } catch (error) {
      console.error('Error placing buy order:', error);
      alert(`Error placing order: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">ETF Ranking</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {sectors.map(sector => (
                <option key={sector} value={sector}>
                  {sector === 'all' ? 'All Sectors' : sector}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Trading Status Banner */}
      {tradingStatus !== 'idle' && (
        <div className={`rounded-lg p-4 ${
          tradingStatus === 'success' ? 'bg-green-50 border border-green-200' :
          tradingStatus === 'error' ? 'bg-red-50 border border-red-200' :
          tradingStatus === 'loading' ? 'bg-blue-50 border border-blue-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center">
            {tradingStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mr-2" />}
            {tradingStatus === 'error' && <XCircle className="w-5 h-5 text-red-600 mr-2" />}
            {tradingStatus === 'loading' && <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>}
            <div>
              <h3 className={`text-sm font-medium ${
                tradingStatus === 'success' ? 'text-green-800' :
                tradingStatus === 'error' ? 'text-red-800' :
                tradingStatus === 'loading' ? 'text-blue-800' :
                'text-gray-800'
              }`}>
                {tradingStatus === 'success' ? 'Order Placed Successfully' :
                 tradingStatus === 'error' ? 'Order Failed' :
                 tradingStatus === 'loading' ? 'Processing Order' :
                 'Trading Status'}
              </h3>
              <p className={`text-sm ${
                tradingStatus === 'success' ? 'text-green-700' :
                tradingStatus === 'error' ? 'text-red-700' :
                tradingStatus === 'loading' ? 'text-blue-700' :
                'text-gray-700'
              }`}>
                {typeof tradingMessage === 'string' ? tradingMessage : JSON.stringify(tradingMessage)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trading API Status */}
      <div className={`rounded-lg p-4 ${
        isTradingEnabled ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center">
          {isTradingEnabled ? (
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          )}
          <div>
            <h3 className={`text-sm font-medium ${
              isTradingEnabled ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {isTradingEnabled ? 'Trading Enabled' : 'Trading Disabled'}
            </h3>
            <p className={`text-sm ${
              isTradingEnabled ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {isTradingEnabled 
                ? 'MStocks API is configured. You can place real orders.'
                : 'MStocks API is not configured. Please set up your API credentials to enable trading.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Live API Status Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">🔄 Live API Mode Active</h3>
            <p className="text-sm text-blue-700">
              Using username/password/OTP authentication for MStocks API. 
              Please configure your credentials in src/services/mstocksApi.js
            </p>
            <p className="text-sm text-blue-600 mt-1">
              If API endpoints are not responding, prices will be simulated for testing.
            </p>
          </div>
        </div>
      </div>

      {/* Strategy Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Strategy Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Target Profit:</span> {targetProfit}%
          </div>
          <div>
            <span className="font-medium">Averaging Threshold:</span> {averagingThreshold}%
          </div>
          <div>
            <span className="font-medium">Ranking Method:</span> % below 20 DMA
          </div>
        </div>
      </div>

      {/* New ETFs Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">New ETFs to Buy</h2>
          <p className="text-sm text-gray-600 mt-1">ETFs not currently in your portfolio, ranked by % below 20 DMA</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CMP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">20 DMA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Below DMA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {newETFs.slice(0, 5).map((etf) => (
                <tr key={etf.symbol} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      #{etf.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{etf.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{etf.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{etf.cmp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{etf.dma20}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    <TrendingDown className="inline w-4 h-4 mr-1" />
                    {Math.abs(etf.percentDiff).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{etf.volume.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleBuyClick(etf)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Buy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Existing ETFs for Averaging */}
      {existingETFsForAveraging.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Existing ETFs for Averaging</h2>
            <p className="text-sm text-gray-600 mt-1">ETFs that have fallen more than {averagingThreshold}% from last purchase price</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CMP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchase</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Fall</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {existingETFsForAveraging.map((etf) => {
                  const holding = holdings.find(h => h.symbol === etf.symbol);
                  const fallPercent = ((holding.lastPurchasePrice - etf.cmp) / holding.lastPurchasePrice) * 100;
                  
                  return (
                    <tr key={etf.symbol} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{etf.symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{etf.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{etf.cmp}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{holding.lastPurchasePrice}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        <TrendingDown className="inline w-4 h-4 mr-1" />
                        {fallPercent.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleBuyClick(etf)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Average
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && selectedETF && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Buy {selectedETF.symbol}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Type</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="MARKET">Market Order</option>
                    <option value="LIMIT">Limit Order</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    id="quantity"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter quantity"
                    min="1"
                  />
                </div>
                {orderType === 'LIMIT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Limit Price</label>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter limit price"
                      step="0.01"
                      defaultValue={selectedETF.cmp}
                    />
                  </div>
                )}
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Current Price:</strong> ₹{selectedETF.cmp}<br/>
                    <strong>Order Type:</strong> {orderType}<br/>
                    {orderType === 'LIMIT' && limitPrice && (
                      <span className="text-blue-600">
                        <strong>Limit Price:</strong> ₹{limitPrice}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowBuyModal(false);
                      setOrderType('MARKET');
                      setLimitPrice('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const quantity = document.getElementById('quantity').value;
                      if (quantity) {
                        const price = orderType === 'LIMIT' ? limitPrice : selectedETF.cmp;
                        handleBuy(quantity, price);
                      } else {
                        alert('Please enter quantity');
                      }
                    }}
                    disabled={!isTradingEnabled}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      isTradingEnabled 
                        ? 'text-white bg-green-600 hover:bg-green-700' 
                        : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {isTradingEnabled ? 'Place Buy Order' : 'Trading Disabled'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ETFRanking; 