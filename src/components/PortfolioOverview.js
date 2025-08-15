import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Target,
  TrendingUpIcon,
  TrendingDownIcon
} from 'lucide-react';

const PortfolioOverview = ({ 
  totalInvested, 
  totalProfit, 
  moneyManagement 
}) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Calculate profit percentage
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const metrics = [
    {
      title: 'Total Invested',
      value: formatCurrency(totalInvested),
      icon: Package,
      iconBg: 'bg-upstox-tertiary',
      iconColor: 'text-accent-blue',
      trend: null
    },
    {
      title: 'Total Profit',
      value: formatCurrency(totalProfit),
      icon: TrendingUp,
      iconBg: 'bg-upstox-tertiary',
      iconColor: totalProfit >= 0 ? 'text-positive' : 'text-negative',
      trend: profitPercentage,
      trendColor: totalProfit >= 0 ? 'text-positive' : 'text-negative'
    },
    {
      title: 'Available Capital',
      value: formatCurrency(moneyManagement?.availableCapital || 0),
      icon: DollarSign,
      iconBg: 'bg-upstox-tertiary',
      iconColor: 'text-upstox-secondary',
      trend: null
    },
    {
      title: 'Next Buy Amount',
      value: formatCurrency(moneyManagement?.nextBuyAmount || 0),
      icon: Target,
      iconBg: 'bg-upstox-tertiary',
      iconColor: 'text-accent-blue',
      trend: null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <div key={index} className="card-upstox overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.iconBg}`}>
                <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
              </div>
              {metric.trend !== null && (
                <div className={`flex items-center gap-1 text-sm font-medium ${metric.trendColor}`}>
                  {metric.trend >= 0 ? (
                    <TrendingUpIcon className="h-4 w-4" />
                  ) : (
                    <TrendingDownIcon className="h-4 w-4" />
                  )}
                  {formatPercentage(metric.trend)}
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-upstox-secondary mb-1">
                {metric.title}
              </p>
              <p className="text-2xl font-bold text-upstox-primary">
                {metric.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PortfolioOverview;
