import React from 'react';
import { TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { Backtest } from '../../App';

interface BacktestStatusProps {
  backtest: Backtest;
}

const BacktestStatus: React.FC<BacktestStatusProps> = ({ backtest }) => {
  const { status, params } = backtest;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return '#10b981';
      case 'completed':
        return '#059669';
      case 'error':
        return '#ef4444';
      case 'paused':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return '#ef4444';
    if (progress < 70) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="backtest-status">
      <h2>Backtest Status</h2>
      
      <div className="status-overview">
        <div className="status-header">
          <div className="status-info">
            <span 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(status.status) }}
            >
              {status.status.toUpperCase()}
            </span>
            <span className="status-date">
              {formatDate(params.startDate)} - {formatDate(params.endDate)}
            </span>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${status.progress}%`,
                  backgroundColor: getProgressColor(status.progress)
                }}
              />
            </div>
            <span className="progress-text">{status.progress.toFixed(1)}%</span>
          </div>
        </div>

        <div className="status-metrics">
          <div className="metric-card">
            <div className="metric-icon">
              <Calendar />
            </div>
            <div className="metric-content">
              <div className="metric-label">Current Date</div>
              <div className="metric-value">{formatDate(status.currentDate)}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <DollarSign />
            </div>
            <div className="metric-content">
              <div className="metric-label">Total Equity</div>
              <div className="metric-value">{formatCurrency(status.equity)}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <TrendingUp />
            </div>
            <div className="metric-content">
              <div className="metric-label">Total Trades</div>
              <div className="metric-value">{status.totalTrades}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <BarChart3 />
            </div>
            <div className="metric-content">
              <div className="metric-label">Available Cash</div>
              <div className="metric-value">{formatCurrency(status.cash)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="strategy-params">
        <h3>Strategy Parameters</h3>
        <div className="params-grid">
          <div className="param-item">
            <span className="param-label">Initial Capital:</span>
            <span className="param-value">{formatCurrency(params.initialCapital)}</span>
          </div>
          <div className="param-item">
            <span className="param-label">Profit Target:</span>
            <span className="param-value">{params.profitTarget}%</span>
          </div>
          <div className="param-item">
            <span className="param-label">Averaging Threshold:</span>
            <span className="param-value">{params.averagingThreshold}%</span>
          </div>
          <div className="param-item">
            <span className="param-label">Max ETFs per Sector:</span>
            <span className="param-value">{params.maxETFsPerSector}</span>
          </div>
          <div className="param-item">
            <span className="param-label">Top K Symbols:</span>
            <span className="param-value">{params.topK}</span>
          </div>
          <div className="param-item">
            <span className="param-label">Execution Price:</span>
            <span className="param-value">{params.executionPrice}</span>
          </div>
          <div className="param-item">
            <span className="param-label">Capital Mode:</span>
            <span className="param-value">{params.capitalMode.replace('_', ' ')}</span>
          </div>
          <div className="param-item">
            <span className="param-label">Compounding Mode:</span>
            <span className="param-value">{params.compoundingMode.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {status.error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{status.error}</p>
        </div>
      )}
    </div>
  );
};

export default BacktestStatus;
