import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { BacktestArtifacts } from '../../../common/types';

interface BacktestResultsProps {
  artifacts: BacktestArtifacts;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ artifacts }) => {
  const { trades, equity, holdings, metrics } = artifacts;

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

  // Prepare equity curve data
  const equityData = equity.map(point => ({
    date: formatDate(point.date),
    equity: point.equity,
    cash: point.cash
  }));

  // Calculate trade statistics
  const buyTrades = trades.filter(t => t.action === 'BUY');
  const sellTrades = trades.filter(t => t.action === 'SELL');
  
  const tradesBySymbol = trades.reduce((acc, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = { buys: 0, sells: 0, totalAmount: 0 };
    }
    acc[trade.symbol][trade.action === 'BUY' ? 'buys' : 'sells']++;
    acc[trade.symbol].totalAmount += trade.amount;
    return acc;
  }, {} as Record<string, { buys: number; sells: number; totalAmount: number }>);

  const symbolData = Object.entries(tradesBySymbol).map(([symbol, data]) => ({
    symbol,
    trades: data.buys + data.sells,
    amount: data.totalAmount
  }));

  // Calculate monthly performance
  const monthlyData = trades.reduce((acc, trade) => {
    const month = new Date(trade.date).toISOString().slice(0, 7);
    if (!acc[month]) {
      acc[month] = { month, profit: 0, trades: 0 };
    }
    if (trade.action === 'SELL') {
      acc[month].profit += trade.amount;
    }
    acc[month].trades++;
    return acc;
  }, {} as Record<string, { month: string; profit: number; trades: number }>);

  const monthlyChartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  // Color palette for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="backtest-results">
      <h2>Backtest Results</h2>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <TrendingUp />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Return</div>
            <div className="metric-value">
              {formatCurrency(metrics.totalReturn)}
              <span className="metric-percentage">
                ({metrics.totalReturnPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <DollarSign />
          </div>
          <div className="metric-content">
            <div className="metric-label">Annualized Return</div>
            <div className="metric-value">
              {metrics.annualizedReturn.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <AlertTriangle />
          </div>
          <div className="metric-content">
            <div className="metric-label">Max Drawdown</div>
            <div className="metric-value">
              {metrics.maxDrawdownPercent.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Target />
          </div>
          <div className="metric-content">
            <div className="metric-label">Win Rate</div>
            <div className="metric-value">
              {metrics.winRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-label">Total Trades</div>
            <div className="metric-value">{metrics.totalTrades}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-label">Trading Days</div>
            <div className="metric-value">{metrics.totalDays}</div>
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="chart-section">
        <h3>Equity Curve</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={equityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Equity']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="equity" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trade Distribution */}
      <div className="chart-section">
        <h3>Trade Distribution by Symbol</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={symbolData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="symbol" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value, 'Trades']}
                labelFormatter={(label) => `Symbol: ${label}`}
              />
              <Bar dataKey="trades" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="chart-section">
        <h3>Monthly Performance</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Profit']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="profit" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="trades-section">
        <h3>Recent Trades</h3>
        <div className="trades-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Symbol</th>
                <th>Action</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(-20).reverse().map((trade) => (
                <tr key={trade.id}>
                  <td>{formatDate(trade.date)}</td>
                  <td>{trade.symbol}</td>
                  <td>
                    <span className={`action-badge ${trade.action.toLowerCase()}`}>
                      {trade.action}
                    </span>
                  </td>
                  <td>{trade.quantity}</td>
                  <td>{formatCurrency(trade.price)}</td>
                  <td>{formatCurrency(trade.amount)}</td>
                  <td className="reason-cell">{trade.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current Holdings */}
      {holdings.length > 0 && (
        <div className="holdings-section">
          <h3>Current Holdings</h3>
          <div className="holdings-table">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Avg Price</th>
                  <th>Current Price</th>
                  <th>Unrealized P&L</th>
                  <th>P&L %</th>
                </tr>
              </thead>
              <tbody>
                {holdings[0]?.positions.map((position) => (
                  <tr key={position.symbol}>
                    <td>{position.symbol}</td>
                    <td>{position.totalQuantity}</td>
                    <td>{formatCurrency(position.averagePrice)}</td>
                    <td>{formatCurrency(position.currentPrice)}</td>
                    <td className={position.unrealizedPnL >= 0 ? 'profit' : 'loss'}>
                      {formatCurrency(position.unrealizedPnL)}
                    </td>
                    <td className={position.unrealizedPnLPercent >= 0 ? 'profit' : 'loss'}>
                      {position.unrealizedPnLPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestResults;
