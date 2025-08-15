import React, { useState, useEffect } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { X, Save, Trash2, AlertTriangle } from 'lucide-react';

const EditSoldItemModal = ({ isOpen, onClose, soldItem, mode = 'edit' }) => {
  const { dispatch } = useETFTrading();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    sector: '',
    buyDate: '',
    sellDate: '',
    buyPrice: '',
    sellPrice: '',
    quantity: '',
    sellReason: '',
    notes: ''
  });

  useEffect(() => {
    if (soldItem) {
      // Convert custom date format (e.g., "02-Jun-25") to YYYY-MM-DD for input fields
      const convertDate = (dateStr) => {
        if (!dateStr) return '';
        try {
          // Handle format like "02-Jun-25"
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1];
            const year = parts[2];
            
            // Convert month name to number
            const monthMap = {
              'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
              'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
              'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            };
            
            const monthNum = monthMap[month];
            if (monthNum) {
              // Assume 20xx for years like "25"
              const fullYear = year.length === 2 ? `20${year}` : year;
              return `${fullYear}-${monthNum}-${day}`;
            }
          }
        } catch (error) {
          console.error('Error converting date:', error);
        }
        return '';
      };

      setFormData({
        symbol: soldItem.symbol || '',
        name: soldItem.name || '',
        sector: soldItem.sector || '',
        buyDate: convertDate(soldItem.buyDate) || '',
        sellDate: convertDate(soldItem.sellDate) || '',
        buyPrice: soldItem.buyPrice?.toString() || '',
        sellPrice: soldItem.sellPrice?.toString() || '',
        quantity: soldItem.quantity?.toString() || '',
        sellReason: soldItem.sellReason || '',
        notes: soldItem.notes || ''
      });
    }
  }, [soldItem]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.symbol.trim()) newErrors.symbol = 'Symbol is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.sector.trim()) newErrors.sector = 'Sector is required';
    if (!formData.buyDate) newErrors.buyDate = 'Buy date is required';
    if (!formData.sellDate) newErrors.sellDate = 'Sell date is required';
    if (!formData.buyPrice || parseFloat(formData.buyPrice) <= 0) newErrors.buyPrice = 'Valid buy price is required';
    if (!formData.sellPrice || parseFloat(formData.sellPrice) <= 0) newErrors.sellPrice = 'Valid sell price is required';
    if (!formData.quantity || parseInt(formData.quantity) <= 0) newErrors.quantity = 'Valid quantity is required';

    // Validate dates
    if (formData.buyDate && formData.sellDate) {
      const buyDate = new Date(formData.buyDate);
      const sellDate = new Date(formData.sellDate);
      if (sellDate < buyDate) {
        newErrors.sellDate = 'Sell date cannot be before buy date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateProfit = () => {
    const buyPrice = parseFloat(formData.buyPrice) || 0;
    const sellPrice = parseFloat(formData.sellPrice) || 0;
    const quantity = parseInt(formData.quantity) || 0;
    
    const totalInvested = buyPrice * quantity;
    const totalSold = sellPrice * quantity;
    const profit = totalSold - totalInvested;
    const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
    
    return { profit, profitPercentage, totalInvested, totalSold };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !soldItem) return;

    setIsSubmitting(true);
    try {
      const { profit, profitPercentage, totalInvested } = calculateProfit();
      
      // Convert YYYY-MM-DD back to custom format (e.g., "02-Jun-25")
      const convertToCustomDate = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          const day = date.getDate().toString().padStart(2, '0');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = monthNames[date.getMonth()];
          const year = date.getFullYear().toString().slice(-2); // Get last 2 digits
          return `${day}-${month}-${year}`;
        } catch (error) {
          console.error('Error converting date back:', error);
          return dateStr;
        }
      };
      
      const updatedSoldItem = {
        ...soldItem,
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        sector: formData.sector,
        buyDate: convertToCustomDate(formData.buyDate),
        sellDate: convertToCustomDate(formData.sellDate),
        buyPrice: parseFloat(formData.buyPrice),
        sellPrice: parseFloat(formData.sellPrice),
        quantity: parseInt(formData.quantity),
        totalInvested: totalInvested,
        profit: profit,
        profitPercentage: profitPercentage,
        sellReason: formData.sellReason,
        notes: formData.notes
      };

      dispatch({ type: 'UPDATE_SOLD_ITEM', payload: updatedSoldItem });
      onClose();
    } catch (error) {
      console.error('Error updating sold item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!soldItem) return;
    dispatch({ type: 'REMOVE_SOLD_ITEM', payload: soldItem.id });
    onClose();
  };

  const { profit, profitPercentage, totalInvested, totalSold } = calculateProfit();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'view' ? 'View Sold Item' : 'Edit Sold Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol *
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.symbol ? 'border-red-500' : 'border-gray-300'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
                placeholder="e.g., NSE:MAHKTECH"
              />
              {errors.symbol && <p className="text-red-500 text-xs mt-1">{errors.symbol}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
                placeholder="ETF Name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector *
              </label>
              <input
                type="text"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sector ? 'border-red-500' : 'border-gray-300'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
                placeholder="e.g., ETF, Technology"
              />
              {errors.sector && <p className="text-red-500 text-xs mt-1">{errors.sector}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
                placeholder="Number of shares"
                min="1"
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buy Date *
              </label>
              <input
                type="date"
                value={formData.buyDate}
                onChange={(e) => setFormData({ ...formData, buyDate: e.target.value })}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.buyDate ? 'border-red-500' : 'border-gray-300'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
              />
              {errors.buyDate && <p className="text-red-500 text-xs mt-1">{errors.buyDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sell Date *
              </label>
              <input
                type="date"
                value={formData.sellDate}
                onChange={(e) => setFormData({ ...formData, sellDate: e.target.value })}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sellDate ? 'border-red-500' : 'border-gray-300'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
              />
              {errors.sellDate && <p className="text-red-500 text-xs mt-1">{errors.sellDate}</p>}
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buy Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.buyPrice}
                onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.buyPrice ? 'border-red-500' : 'border-gray-300'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
                placeholder="0.00"
                min="0"
              />
              {errors.buyPrice && <p className="text-red-500 text-xs mt-1">{errors.buyPrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sell Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.sellPrice}
                onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sellPrice ? 'border-red-500' : 'border-gray-300'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
                placeholder="0.00"
                min="0"
              />
              {errors.sellPrice && <p className="text-red-500 text-xs mt-1">{errors.sellPrice}</p>}
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sell Reason
              </label>
              <select
                value={formData.sellReason}
                onChange={(e) => setFormData({ ...formData, sellReason: e.target.value })}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  mode === 'view' ? 'bg-gray-100' : 'border-gray-300'
                }`}
              >
                <option value="">Select reason</option>
                <option value="Target Profit Achieved">Target Profit Achieved</option>
                <option value="Stop Loss Hit">Stop Loss Hit</option>
                <option value="Portfolio Rebalancing">Portfolio Rebalancing</option>
                <option value="Market Conditions">Market Conditions</option>
                <option value="Personal Decision">Personal Decision</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  mode === 'view' ? 'bg-gray-100' : 'border-gray-300'
                }`}
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* Profit/Loss Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Trade Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Invested</p>
                <p className="text-lg font-semibold text-gray-900">₹{totalInvested.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sold</p>
                <p className="text-lg font-semibold text-gray-900">₹{totalSold.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profit/Loss</p>
                <p className={`text-lg font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{profit.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profit %</p>
                <p className={`text-lg font-semibold ${profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-3">
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              {mode === 'edit' && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Sold Item</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this sold item? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditSoldItemModal; 