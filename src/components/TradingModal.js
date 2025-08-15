import React, { useState, useEffect } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { X, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const TradingModal = ({ isOpen, onClose, mode = 'buy', selectedItem = null }) => {
  const { 
    placeBuyOrder, 
    placeSellOrder, 
    isTradingEnabled, 
    tradingStatus, 
    tradingMessage,
    checkTradingEnabled,
    userSetup,
    moneyManagement,
    chunkManagement,
    getNextChunkForBuy
  } = useETFTrading();

  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    price: '',
    orderType: 'MARKET',
    productType: 'CNC',
    validity: 'DAY',
    triggerPrice: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);
  const [suggestedQty, setSuggestedQty] = useState(0);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && selectedItem) {
      const defaultPrice = (selectedItem.currentPrice ?? selectedItem.cmp) ? (selectedItem.currentPrice ?? selectedItem.cmp).toString() : '';
      setFormData({
        symbol: selectedItem.symbol || '',
        quantity: mode === 'sell' ? (selectedItem.quantity || '').toString() : '',
        price: defaultPrice,
        orderType: 'MARKET',
        productType: 'CNC',
        validity: 'DAY',
        triggerPrice: ''
      });
      setErrors({});
      setOrderSummary(null);
    }
  }, [isOpen, selectedItem, mode]);

  // Check trading status on mount
  useEffect(() => {
    if (isOpen) {
      checkTradingEnabled();
    }
  }, [isOpen, checkTradingEnabled]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }

    if (formData.orderType === 'LIMIT' && (!formData.price || parseFloat(formData.price) <= 0)) {
      newErrors.price = 'Valid price is required for limit orders';
    }

    if (mode === 'sell' && selectedItem) {
      const availableQuantity = selectedItem.quantity || 0;
      const sellQuantity = parseInt(formData.quantity) || 0;
      if (sellQuantity > availableQuantity) {
        newErrors.quantity = `Cannot sell more than available quantity (${availableQuantity})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateOrderSummary = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const price = parseFloat(formData.price) || 0;
    const orderType = formData.orderType;

    if (quantity > 0) {
      const totalValue = quantity * price;
      const brokerage = orderType === 'MARKET' ? 0 : 20; // Approximate brokerage
      const taxes = totalValue * 0.001; // 0.1% STT
      const totalCost = totalValue + brokerage + taxes;

      setOrderSummary({
        quantity,
        price,
        totalValue,
        brokerage,
        taxes,
        totalCost,
        orderType
      });
    } else {
      setOrderSummary(null);
    }
  };

  useEffect(() => {
    calculateOrderSummary();
  }, [formData.quantity, formData.price, formData.orderType]);

  // Compute suggested quantity for BUY using chunk management or traditional money management
  useEffect(() => {
    if (mode !== 'buy') { setSuggestedQty(0); return; }
    
    let budget = 0;
    
    // Use chunk management if active
    if (chunkManagement.isActive && chunkManagement.chunks && chunkManagement.chunks.length > 0) {
      const nextChunk = getNextChunkForBuy();
      budget = nextChunk ? Math.min(nextChunk.currentCapital, 50000) : 0;
    } else {
      // Traditional money management
      const base = Math.max(0, Number(userSetup?.tradingAmount || 0));
      const available = Math.max(0, Number(moneyManagement?.availableCapital || 0));
      const nextBuyRaw = Number(moneyManagement?.nextBuyAmount || 0);
      const nextBuy = Math.max(0, Math.min(nextBuyRaw, base, available));
      budget = nextBuy > 0 ? nextBuy : Math.min(base, available);
    }
    
    const ltp = Math.max(0, parseFloat(formData.price) || 0);
    // Guard: quantities for ETFs should be reasonable; cap to 10,000 to avoid UI shock
    const qty = ltp > 0 && budget > 0 ? Math.min(10000, Math.max(1, Math.floor(budget / ltp))) : 0;
    setSuggestedQty(qty);
  }, [mode, userSetup?.tradingAmount, moneyManagement?.availableCapital, moneyManagement?.nextBuyAmount, formData.price, chunkManagement.isActive, chunkManagement.currentChunkIndex]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!isTradingEnabled) {
      alert('Trading is not enabled. Please login to MStocks first by going to the Profile page and completing the MStocks login form.');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const orderData = {
        symbol: formData.symbol,
        quantity: parseInt(formData.quantity),
        price: formData.orderType === 'LIMIT' ? parseFloat(formData.price) : null,
        orderType: formData.orderType,
        productType: formData.productType,
        validity: formData.validity,
        triggerPrice: formData.triggerPrice ? parseFloat(formData.triggerPrice) : null
      };

      let result;
      if (mode === 'buy') {
        result = await placeBuyOrder(orderData);
      } else {
        result = await placeSellOrder({
          ...orderData,
          holdingId: selectedItem?.id,
          originalBuyPrice: selectedItem?.avgPrice
        });
      }

      console.log(`${mode.toUpperCase()} order result:`, result);
      
      // Close modal after successful order
      setTimeout(() => {
        onClose();
        setIsSubmitting(false);
      }, 2000);

    } catch (error) {
      console.error(`Error placing ${mode} order:`, error);
      setErrors({ submit: error.message });
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    switch (tradingStatus) {
      case 'loading':
        return <Loader className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'buy' ? (
              <>
                <TrendingUp className="inline w-5 h-5 text-green-600 mr-2" />
                Buy {formData.symbol}
              </>
            ) : (
              <>
                <TrendingDown className="inline w-5 h-5 text-red-600 mr-2" />
                Sell {formData.symbol}
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Trading Status */}
        {tradingStatus && (
          <div className={`mb-4 p-3 rounded-md flex items-center gap-2 ${
            tradingStatus === 'success' ? 'bg-green-50 text-green-800' :
            tradingStatus === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{typeof tradingMessage === 'string' ? tradingMessage : JSON.stringify(tradingMessage)}</span>
          </div>
        )}

        {/* Trading enabled note intentionally removed to avoid blocking UX; buttons still respect status */}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symbol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => handleInputChange('symbol', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-sm ${
                errors.symbol ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter symbol (e.g., BANKBEES)"
              disabled={mode === 'sell' && selectedItem}
            />
            {errors.symbol && (
              <p className="text-red-500 text-xs mt-1">{errors.symbol}</p>
            )}
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Type
            </label>
            <select
              value={formData.orderType}
              onChange={(e) => handleInputChange('orderType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="MARKET">Market Order</option>
              <option value="LIMIT">Limit Order</option>
            </select>
          </div>

          {/* Price (for Limit Orders) */}
          {formData.orderType === 'LIMIT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limit Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter limit price"
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div>
          )}

          {/* Quantity with suggestion */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Quantity {mode === 'sell' && selectedItem && (<span className="text-gray-500 ml-2">(Available: {selectedItem.quantity})</span>)}
              </label>
              {mode === 'buy' && suggestedQty > 0 && (
                <button
                  type="button"
                  onClick={() => handleInputChange('quantity', String(suggestedQty))}
                  className="text-xs text-blue-600 hover:underline"
                  title={`Suggest based on compounding: initial capital, available capital, booked profits`}
                >
                  Use suggested: {suggestedQty}
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-sm ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type
            </label>
            <select
              value={formData.productType}
              onChange={(e) => handleInputChange('productType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="CNC">CNC (Cash & Carry)</option>
              <option value="MIS">MIS (Margin Intraday)</option>
            </select>
          </div>

          {/* Order Summary */}
          {orderSummary && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{orderSummary.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span>₹{orderSummary.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Value:</span>
                  <span>₹{orderSummary.totalValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Brokerage:</span>
                  <span>₹{orderSummary.brokerage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes:</span>
                  <span>₹{orderSummary.taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total Cost:</span>
                  <span>₹{orderSummary.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-red-800 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                mode === 'buy' 
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400' 
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
              } disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Placing Order...
                </div>
              ) : (
                `${mode === 'buy' ? 'Buy' : 'Sell'} ${formData.symbol}`
              )}
            </button>
          </div>
          {!isTradingEnabled && (
            <div className="text-xs text-yellow-700 mt-2">Trading appears disabled. You can still attempt to place the order; it will fail if the broker session isn’t active.</div>
          )}
          
          {!isTradingEnabled && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mt-4">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Trading Not Enabled</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please login to MStocks first by going to the Profile page and completing the MStocks login form.
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TradingModal;
