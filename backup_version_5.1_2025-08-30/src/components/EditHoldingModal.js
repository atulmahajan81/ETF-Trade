import React, { useState, useEffect } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { X, Save, Trash2, AlertTriangle } from 'lucide-react';

const EditHoldingModal = ({ isOpen, onClose, holding, mode = 'edit' }) => {
  const { dispatch, saveCriticalData } = useETFTrading();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    sector: '',
    buyDate: '',
    buyPrice: '',
    quantity: '',
    currentPrice: '',
    notes: ''
  });

  useEffect(() => {
    if (holding) {
      setFormData({
        symbol: holding.symbol || '',
        name: holding.name || '',
        sector: holding.sector || '',
        buyDate: holding.buyDate || '',
        buyPrice: holding.buyPrice?.toString() || '',
        quantity: holding.quantity?.toString() || '',
        currentPrice: holding.currentPrice?.toString() || '',
        notes: holding.notes || ''
      });
    }
  }, [holding]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.symbol.trim()) newErrors.symbol = 'Symbol is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.sector.trim()) newErrors.sector = 'Sector is required';
    if (!formData.buyDate) newErrors.buyDate = 'Buy date is required';
    if (!formData.buyPrice || parseFloat(formData.buyPrice) <= 0) newErrors.buyPrice = 'Valid buy price is required';
    if (!formData.quantity || parseInt(formData.quantity) <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.currentPrice || parseFloat(formData.currentPrice) <= 0) newErrors.currentPrice = 'Valid current price is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateValues = () => {
    const buyPrice = parseFloat(formData.buyPrice) || 0;
    const currentPrice = parseFloat(formData.currentPrice) || 0;
    const quantity = parseInt(formData.quantity) || 0;
    
    const totalInvested = buyPrice * quantity;
    const currentValue = currentPrice * quantity;
    const profitLoss = currentValue - totalInvested;
    const profitPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
    
    return { totalInvested, currentValue, profitLoss, profitPercentage };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !holding) return;

    setIsSubmitting(true);
    try {
      const { totalInvested, currentValue, profitLoss, profitPercentage } = calculateValues();
      
      const updatedHolding = {
        ...holding,
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        sector: formData.sector,
        buyDate: formData.buyDate,
        buyPrice: parseFloat(formData.buyPrice),
        quantity: parseInt(formData.quantity),
        currentPrice: parseFloat(formData.currentPrice),
        totalInvested: totalInvested,
        currentValue: currentValue,
        profitLoss: profitLoss,
        profitPercentage: profitPercentage,
        avgPrice: parseFloat(formData.buyPrice),
        notes: formData.notes
      };

      dispatch({ type: 'UPDATE_HOLDING', payload: updatedHolding });
      // Immediate save after manual edit
      if (saveCriticalData) {
        setTimeout(() => saveCriticalData('manual holding edit'), 100);
      }
      onClose();
    } catch (error) {
      console.error('Error updating holding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!holding) return;
    dispatch({ type: 'REMOVE_HOLDING', payload: holding.id });
    // Immediate save after manual delete
    if (saveCriticalData) {
      setTimeout(() => saveCriticalData('manual holding delete'), 100);
    }
    onClose();
  };

  const { totalInvested, currentValue, profitLoss, profitPercentage } = calculateValues();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'view' ? 'View Holding' : 'Edit Holding'}
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
                Current Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.currentPrice}
                onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.currentPrice ? 'border-red-500' : 'border-gray-300'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
                placeholder="0.00"
                min="0"
              />
              {errors.currentPrice && <p className="text-red-500 text-xs mt-1">{errors.currentPrice}</p>}
            </div>
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

          {/* Profit/Loss Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Position Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Invested</p>
                <p className="text-lg font-semibold text-gray-900">₹{totalInvested.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Value</p>
                <p className="text-lg font-semibold text-gray-900">₹{currentValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profit/Loss</p>
                <p className={`text-lg font-semibold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{profitLoss.toFixed(2)}
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
              <h3 className="text-lg font-semibold text-gray-900">Delete Holding</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this holding? This action cannot be undone.
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

export default EditHoldingModal; 