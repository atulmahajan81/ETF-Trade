import React, { useState } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import ChunkMoneyManagement from './ChunkMoneyManagement';
import RealChunkManager from './RealChunkManager';
import BacktestingSystem from './BacktestingSystem';
import { BarChart3, Target, TrendingUp, History } from 'lucide-react';

const MoneyManagement = () => {
  const { chunkManagement } = useETFTrading();
  const [activeTab, setActiveTab] = useState('backtest'); // Changed default to backtest

  const tabs = [
    { id: 'backtest', name: 'Backtesting System', icon: History },
    { id: 'real', name: 'Real Chunk Trading', icon: TrendingUp },
    { id: 'simulation', name: '50-Chunk Strategy', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-upstox-primary text-upstox-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-upstox-primary">Money Management</h1>
          <p className="text-upstox-secondary mt-2">Advanced trading strategies and capital management</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-upstox-primary mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-upstox-accent text-upstox-primary bg-upstox-tertiary rounded-t-lg'
                      : 'border-transparent text-upstox-secondary hover:text-upstox-primary hover:border-upstox-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'backtest' && <BacktestingSystem />}
        {activeTab === 'real' && <RealChunkManager />}
        {activeTab === 'simulation' && <ChunkMoneyManagement />}
      </div>
    </div>
  );
};

export default MoneyManagement; 