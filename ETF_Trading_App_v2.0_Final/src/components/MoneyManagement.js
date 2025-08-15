import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calculator, Target, RefreshCw } from 'lucide-react';
import { useETFTrading } from '../context/ETFTradingContext';

const MoneyManagement = () => {
  const { soldItems } = useETFTrading();
  const [recentProfits, setRecentProfits] = useState([]);
  const [availableCapital, setAvailableCapital] = useState(0);
  const [nextBuyAmount, setNextBuyAmount] = useState(0);
  const [compoundingStats, setCompoundingStats] = useState({
    totalProfits: 0,
    reinvestedAmount: 0,
    compoundingEffect: 0
  });

  // Calculate recent profits (last 30 days)
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recent = soldItems.filter(item => {
      const sellDate = new Date(item.sellDate);
      return sellDate >= thirtyDaysAgo && item.profit > 0;
    });
    
    setRecentProfits(recent);
  }, [soldItems]);

  // Calculate available capital and next buy amount
  useEffect(() => {
    const totalRecentProfits = recentProfits.reduce((sum, item) => sum + item.profit, 0);
    const baseTradingAmount = 20000; // This should come from user setup
    const nextBuy = baseTradingAmount + totalRecentProfits;
    
    setAvailableCapital(totalRecentProfits);
    setNextBuyAmount(nextBuy);
    
    setCompoundingStats({
      totalProfits: totalRecentProfits,
      reinvestedAmount: totalRecentProfits,
      compoundingEffect: ((nextBuy - baseTradingAmount) / baseTradingAmount) * 100
    });
  }, [recentProfits]);

  const getProfitTrend = () => {
    if (recentProfits.length === 0) return 'neutral';
    const avgProfit = recentProfits.reduce((sum, item) => sum + item.profit, 0) / recentProfits.length;
    return avgProfit > 1000 ? 'increasing' : avgProfit < 500 ? 'decreasing' : 'stable';
  };

  const getCompoundingRecommendation = () => {
    if (recentProfits.length === 0) {
      return {
        type: 'info',
        message: 'No recent profits to compound. Start trading to see compounding effects.',
        action: 'Start trading'
      };
    }
    
    if (compoundingStats.compoundingEffect > 20) {
      return {
        type: 'success',
        message: 'Excellent compounding effect! Your profits are significantly boosting your buying power.',
        action: 'Continue strategy'
      };
    }
    
    if (compoundingStats.compoundingEffect > 10) {
      return {
        type: 'warning',
        message: 'Good compounding effect. Consider optimizing your selling strategy for better profits.',
        action: 'Optimize strategy'
      };
    }
    
    return {
      type: 'info',
      message: 'Moderate compounding effect. Focus on consistent profitable trades.',
      action: 'Focus on consistency'
    };
  };

  const recommendation = getCompoundingRecommendation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Money Management</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4" />
          <span>Auto-updating</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Capital</p>
              <p className="text-2xl font-bold text-green-600">₹{availableCapital.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Next Buy Amount</p>
              <p className="text-2xl font-bold text-blue-600">₹{nextBuyAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compounding Effect</p>
              <p className="text-2xl font-bold text-purple-600">+{compoundingStats.compoundingEffect.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compounding Strategy */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compounding Strategy</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Strategy Overview</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Base trading amount: ₹20,000</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Recent profits automatically added</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">1 buy and 1 sell per day maximum</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Compounding effect increases buying power</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recent Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Recent trades:</span>
                <span className="text-sm font-medium">{recentProfits.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total profits:</span>
                <span className="text-sm font-medium text-green-600">₹{compoundingStats.totalProfits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reinvested amount:</span>
                <span className="text-sm font-medium text-blue-600">₹{compoundingStats.reinvestedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Profit trend:</span>
                <span className={`text-sm font-medium ${
                  getProfitTrend() === 'increasing' ? 'text-green-600' : 
                  getProfitTrend() === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {getProfitTrend() === 'increasing' ? '↗ Increasing' : 
                   getProfitTrend() === 'decreasing' ? '↘ Decreasing' : '→ Stable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
        recommendation.type === 'success' ? 'border-green-500' :
        recommendation.type === 'warning' ? 'border-yellow-500' :
        'border-blue-500'
      }`}>
        <div className="flex items-start">
          <div className={`p-2 rounded-lg ${
            recommendation.type === 'success' ? 'bg-green-100' :
            recommendation.type === 'warning' ? 'bg-yellow-100' :
            'bg-blue-100'
          }`}>
            <Target className={`w-5 h-5 ${
              recommendation.type === 'success' ? 'text-green-600' :
              recommendation.type === 'warning' ? 'text-yellow-600' :
              'text-blue-600'
            }`} />
          </div>
          <div className="ml-4">
            <h4 className="font-medium text-gray-900 mb-2">Recommendation</h4>
            <p className="text-gray-600 mb-3">{recommendation.message}</p>
            <button className={`px-4 py-2 rounded-md text-sm font-medium ${
              recommendation.type === 'success' ? 'bg-green-500 text-white hover:bg-green-600' :
              recommendation.type === 'warning' ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
              'bg-blue-500 text-white hover:bg-blue-600'
            } transition-colors`}>
              {recommendation.action}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Profits Table */}
      {recentProfits.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Profits (Last 30 Days)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentProfits.slice(0, 10).map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sellDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.buyPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.sellPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">₹{item.profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compounding Calculator */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compounding Calculator</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Projected Growth</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current base amount:</span>
                <span className="text-sm font-medium">₹20,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">With compounding (30 days):</span>
                <span className="text-sm font-medium text-green-600">₹{nextBuyAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Growth percentage:</span>
                <span className="text-sm font-medium text-blue-600">+{compoundingStats.compoundingEffect.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Strategy Benefits</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• Automatic profit reinvestment</div>
              <div>• Increased buying power over time</div>
              <div>• Compounding effect on returns</div>
              <div>• Risk management through daily limits</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyManagement; 