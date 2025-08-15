import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calculator, Target, RefreshCw, BarChart3, Cpu } from 'lucide-react';
import { useETFTrading } from '../context/ETFTradingContext';
import ChunkMoneyManagement from './ChunkMoneyManagement';
import RealChunkManager from './RealChunkManager';

const MoneyManagement = () => {
  const { soldItems, moneyManagement } = useETFTrading();
  const [recentProfits, setRecentProfits] = useState([]);
  const [activeTab, setActiveTab] = useState('real'); // 'real', 'chunk', or 'simple'

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

  // Use context values for money management
  const availableCapital = moneyManagement?.availableCapital || 0;
  const nextBuyAmount = moneyManagement?.nextBuyAmount || 0;
  const compoundingEffect = moneyManagement?.compoundingEffect || 0;

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
    
    if (compoundingEffect > 50) {
      return {
        type: 'success',
        message: 'Excellent compounding effect! Your profits are significantly boosting your buying power.',
        action: 'Continue strategy'
      };
    }
    
    if (compoundingEffect > 20) {
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
    <div className="space-y-6 text-upstox-primary">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-upstox-primary">Money Management</h2>
        <div className="flex items-center space-x-2 text-sm text-upstox-secondary">
          <RefreshCw className="w-4 h-4" />
          <span>Auto-updating</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card-upstox p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('real')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'real'
                ? 'bg-accent-blue text-white'
                : 'text-upstox-secondary hover:text-upstox-primary hover:bg-upstox-tertiary'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Real Chunk Trading</span>
          </button>
          <button
            onClick={() => setActiveTab('chunk')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'chunk'
                ? 'bg-accent-blue text-white'
                : 'text-upstox-secondary hover:text-upstox-primary hover:bg-upstox-tertiary'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>50-Chunk Simulation</span>
          </button>
          <button
            onClick={() => setActiveTab('simple')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'simple'
                ? 'bg-accent-blue text-white'
                : 'text-upstox-secondary hover:text-upstox-primary hover:bg-upstox-tertiary'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Simple Compounding</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'real' ? (
        <RealChunkManager />
      ) : activeTab === 'chunk' ? (
        <ChunkMoneyManagement />
      ) : (
        <div className="space-y-6">

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-upstox p-6">
          <div className="flex items-center">
            <div className="p-2 bg-upstox-tertiary rounded-lg">
              <DollarSign className="w-6 h-6 text-positive" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-upstox-secondary">Available Capital</p>
              <p className="text-2xl font-bold text-upstox-primary">₹{availableCapital.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card-upstox p-6">
          <div className="flex items-center">
            <div className="p-2 bg-upstox-tertiary rounded-lg">
              <Calculator className="w-6 h-6 text-accent-blue" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-upstox-secondary">Next Buy Amount</p>
              <p className="text-2xl font-bold text-upstox-primary">₹{nextBuyAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card-upstox p-6">
          <div className="flex items-center">
            <div className="p-2 bg-upstox-tertiary rounded-lg">
              <TrendingUp className="w-6 h-6 text-positive" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-upstox-secondary">Compounding Effect</p>
              <p className="text-2xl font-bold text-positive">+{compoundingEffect.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compounding Strategy */}
      <div className="card-upstox p-6">
        <h3 className="text-lg font-semibold text-upstox-primary mb-4">Compounding Strategy</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-upstox-primary mb-3">Strategy Overview</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-upstox-secondary">Base trading amount: ₹20,000 (Initial Capital ÷ 50)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-upstox-secondary">Recent profits automatically added to next buy</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-upstox-secondary">1 buy and 1 sell per day maximum</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-upstox-secondary">Compounding effect increases buying power over time</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-upstox-secondary">Profit from sales reinvested in next purchase</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-upstox-primary mb-3">Recent Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Recent trades:</span>
                <span className="text-sm font-medium">{recentProfits.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Total profits:</span>
                <span className="text-sm font-medium text-green-600">₹{moneyManagement?.totalProfits?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Reinvested amount:</span>
                <span className="text-sm font-medium text-blue-600">₹{moneyManagement?.reinvestedAmount?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Profit trend:</span>
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
      <div className={`card-upstox p-6 border-l-4 ${
        recommendation.type === 'success' ? 'border-green-500' :
        recommendation.type === 'warning' ? 'border-yellow-500' :
        'border-blue-500'
      }`}>
        <div className="flex items-start">
          <div className="p-2 bg-upstox-tertiary rounded-lg">
            <Target className="w-5 h-5 text-accent-blue" />
          </div>
          <div className="ml-4">
            <h4 className="font-medium text-upstox-primary mb-2">Recommendation</h4>
            <p className="text-upstox-secondary mb-3">{recommendation.message}</p>
            <button className={`px-4 py-2 rounded-md text-sm font-medium ${
              recommendation.type === 'success' ? 'btn-upstox-success' :
              recommendation.type === 'warning' ? 'btn-upstox-primary' :
              'btn-upstox-secondary'
            } transition-colors`}>
              {recommendation.action}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Profits Table */}
      {recentProfits.length > 0 && (
        <div className="card-upstox p-6">
          <h3 className="text-lg font-semibold text-upstox-primary mb-4">Recent Profits (Last 30 Days)</h3>
          <div className="overflow-x-auto">
            <table className="table-upstox">
              <thead className="bg-upstox-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Sell Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Buy Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Sell Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-upstox-secondary uppercase tracking-wider">Profit</th>
                </tr>
              </thead>
              <tbody className="bg-upstox-secondary divide-y divide-upstox-primary">
                {recentProfits.slice(0, 10).map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-upstox-primary">{item.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-upstox-secondary">{item.sellDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-upstox-primary">₹{item.buyPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-upstox-primary">₹{item.sellPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-upstox-secondary">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-positive">₹{item.profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compounding Calculator */}
      <div className="card-upstox p-6">
        <h3 className="text-lg font-semibold text-upstox-primary mb-4">Compounding Calculator</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-upstox-primary mb-3">Current Status</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Initial Capital:</span>
                <span className="text-sm font-medium">₹1,000,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Base Trading Amount:</span>
                <span className="text-sm font-medium text-accent-blue">₹20,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">With compounding (30 days):</span>
                <span className="text-sm font-medium text-accent-blue">+{compoundingEffect.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-upstox-secondary">Next Buy Amount:</span>
                <span className="text-sm font-medium text-positive">₹{nextBuyAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-upstox-primary mb-3">Compounding Benefits</h4>
            <div className="space-y-2 text-sm text-upstox-secondary">
              <div>• Profits automatically reinvested</div>
              <div>• Growing buying power over time</div>
              <div>• Compound effect on returns</div>
              <div>• Risk management through fixed base amount</div>
            </div>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default MoneyManagement; 