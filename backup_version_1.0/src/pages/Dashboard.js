import React, { useMemo, useState } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { TrendingUp, TrendingDown, DollarSign, Package, Target, Settings } from 'lucide-react';
import MstocksLogin from '../components/MstocksLogin';

const Dashboard = () => {
  const [showMstocksLogin, setShowMstocksLogin] = useState(false);
  
  const { 
    holdings, 
    soldItems,
    etfs,
    totalInvested, 
    totalProfit, 
    targetProfit
  } = useETFTrading();

  // Calculate current portfolio value (use currentPrice if available, otherwise use buyPrice for stability)
  const currentValue = useMemo(() => {
    return holdings.reduce((total, holding) => {
      const price = holding.currentPrice || holding.buyPrice || 0;
      return total + (price * (holding.quantity || 0));
    }, 0);
  }, [holdings]);

  // Calculate current profit/loss
  const currentProfitLoss = useMemo(() => {
    return currentValue - (totalInvested || 0);
  }, [currentValue, totalInvested]);

  const totalProfitLoss = useMemo(() => {
    return currentProfitLoss + (totalProfit || 0);
  }, [currentProfitLoss, totalProfit]);

  // Calculate profit percentage
  const profitPercentage = useMemo(() => {
    return (totalInvested || 0) > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
  }, [totalProfitLoss, totalInvested]);

  // Get ETFs ready for selling (above target profit)
  const readyToSell = holdings.filter(holding => {
    if (!holding.currentPrice || !holding.avgPrice || !targetProfit) return false;
    const profitPercent = ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
    return profitPercent >= targetProfit;
  });

  // Get ETFs ready for averaging (fallen below threshold)
  const readyForAveraging = holdings.filter(holding => {
    if (!holding.currentPrice || !holding.avgPrice) return false;
    const fallPercent = ((holding.avgPrice - holding.currentPrice) / holding.avgPrice) * 100;
    return fallPercent >= 2.5;
  });

  const stats = [
    {
      title: 'Total Invested',
      value: `₹${(totalInvested || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Current Value',
      value: `₹${currentValue.toLocaleString()}`,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total P&L',
      value: `₹${totalProfitLoss.toLocaleString()}`,
      icon: totalProfitLoss >= 0 ? TrendingUp : TrendingDown,
      color: totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: totalProfitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Profit %',
      value: `${profitPercentage.toFixed(2)}%`,
      icon: Target,
      color: profitPercentage >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: profitPercentage >= 0 ? 'bg-green-50' : 'bg-red-50'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
            <br />
            <span className="text-xs text-green-600">🎮 Demo Mode - Safe testing environment</span>
          </div>

          <button
            onClick={() => setShowMstocksLogin(true)}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200"
          >
            <Settings className="w-4 h-4" />
            <span>MStocks Login</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} rounded-lg p-6 border`}>
              <div className="flex items-center">
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holdings Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Holdings</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Holdings:</span>
              <span className="font-semibold">{holdings.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ready to Sell:</span>
              <span className="font-semibold text-green-600">{readyToSell.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ready for Averaging:</span>
              <span className="font-semibold text-orange-600">{readyForAveraging.length}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Sold:</span>
              <span className="font-semibold">{soldItems.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Realized Profit:</span>
              <span className="font-semibold text-green-600">₹{(totalProfit || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Target Profit:</span>
              <span className="font-semibold">{targetProfit}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ETF Market Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">ETF Market Overview</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {etfs.slice(0, 5).map((etf, index) => {
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{etf.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{etf.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{etf.currentPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{etf.sector}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      etf.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {etf.change >= 0 ? '+' : ''}{etf.change}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        etf.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {etf.change >= 0 ? 'Up' : 'Down'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MStocks Login Modal */}
      {showMstocksLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowMstocksLogin(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <MstocksLogin
              onLoginSuccess={(session) => {
                console.log('MStocks login successful:', session);
                setShowMstocksLogin(false);
              }}
              onLoginError={(error) => {
                console.error('MStocks login failed:', error);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 