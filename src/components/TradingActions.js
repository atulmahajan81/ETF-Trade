import React from 'react';
import { 
  Plus, 
  Minus, 
  Package, 
  TrendingUp, 
  Loader,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const TradingActions = ({ 
  bestBuy, 
  bestSell, 
  isPlacing, 
  onPlaceBestBuy, 
  onPlaceBestSell 
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Best Buy Card */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                 <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-green-100 rounded-lg">
               <Plus className="h-5 w-5 text-green-600" />
             </div>
             <div>
               <h3 className="text-lg font-semibold text-green-900">Best Buy Opportunity</h3>
               <p className="text-sm text-green-700">Recommended purchase based on DMA analysis</p>
             </div>
           </div>
         </div>
        
        <div className="p-6">
          {bestBuy ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-neutral-900 mb-1">{bestBuy.symbol}</h4>
                  <p className="text-sm text-neutral-600 leading-relaxed">{bestBuy.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-neutral-900 mb-1">
                    ₹{bestBuy.cmp?.toFixed(2)}
                  </div>
                                     <div className={`flex items-center gap-1 text-sm font-medium ${
                     bestBuy.percentDiff < 0 ? 'text-green-600' : 'text-red-600'
                   }`}>
                     {bestBuy.percentDiff < 0 ? (
                       <ArrowDownRight className="h-4 w-4" />
                     ) : (
                       <ArrowUpRight className="h-4 w-4" />
                     )}
                     {formatPercentage(bestBuy.percentDiff)}
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-4 bg-neutral-50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-neutral-500 mb-1">20 DMA</div>
                  <div className="text-lg font-semibold text-neutral-900">
                    ₹{bestBuy.dma20?.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-neutral-500 mb-1">Sector</div>
                  <div className="text-lg font-semibold text-neutral-900">
                    {bestBuy.sector}
                  </div>
                </div>
              </div>
              
                             <button
                 onClick={onPlaceBestBuy}
                 disabled={isPlacing}
                 className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
               >
                {isPlacing ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                Buy {bestBuy.symbol}
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-neutral-400" />
              </div>
              <h4 className="text-lg font-semibold text-neutral-900 mb-2">No Buy Opportunities</h4>
              <p className="text-neutral-500">All ETFs are currently above their 20-day moving average</p>
            </div>
          )}
        </div>
      </div>

      {/* Best Sell Card */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                 <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-red-200">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-red-100 rounded-lg">
               <Minus className="h-5 w-5 text-red-600" />
             </div>
             <div>
               <h3 className="text-lg font-semibold text-red-900">Best Sell Opportunity</h3>
               <p className="text-sm text-red-700">Recommended sale based on profit targets</p>
             </div>
           </div>
         </div>
        
        <div className="p-6">
          {bestSell ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-neutral-900 mb-1">{bestSell.symbol}</h4>
                  <p className="text-sm text-neutral-600 leading-relaxed">{bestSell.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-neutral-900 mb-1">
                    ₹{bestSell.currentPrice?.toFixed(2)}
                  </div>
                                     <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                     <ArrowUpRight className="h-4 w-4" />
                     {formatPercentage(bestSell.profitPercent)}
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 py-4 bg-neutral-50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-neutral-500 mb-1">Quantity</div>
                  <div className="text-lg font-semibold text-neutral-900">
                    {bestSell.quantity}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-neutral-500 mb-1">Avg Price</div>
                  <div className="text-lg font-semibold text-neutral-900">
                    ₹{bestSell.avgPrice?.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-neutral-500 mb-1">Profit</div>
                                     <div className="text-lg font-semibold text-green-600">
                     {formatCurrency(bestSell.absoluteProfit)}
                   </div>
                </div>
              </div>
              
                             <button
                 onClick={onPlaceBestSell}
                 disabled={isPlacing}
                 className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
               >
                {isPlacing ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Minus className="h-5 w-5" />
                )}
                Sell {bestSell.symbol}
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-neutral-400" />
              </div>
              <h4 className="text-lg font-semibold text-neutral-900 mb-2">No Sell Opportunities</h4>
              <p className="text-neutral-500">No holdings have reached the target profit percentage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingActions;
