import React, { useState, useEffect } from 'react';
import { Play, Pause, Download, Settings, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { BacktestParams, BacktestStatus, BacktestArtifacts } from '../../common/types';
import BacktestForm from './components/BacktestForm';
import BacktestStatus as BacktestStatusComponent from './components/BacktestStatus';
import BacktestResults from './components/BacktestResults';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8787';

interface Backtest {
  id: string;
  status: BacktestStatus;
  params: BacktestParams;
  artifacts?: BacktestArtifacts;
}

function App() {
  const [backtests, setBacktests] = useState<Backtest[]>([]);
  const [activeBacktest, setActiveBacktest] = useState<Backtest | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Create new backtest
  const createBacktest = async (params: BacktestParams) => {
    setIsCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/backtests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          params,
          dataSource: 'http',
          dataUrl: 'https://example.com/etf-data.csv' // Replace with actual data URL
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create backtest');
      }

      const result = await response.json();
      
      const newBacktest: Backtest = {
        id: result.id,
        status: {
          id: result.id,
          status: 'running',
          progress: 0,
          currentDate: params.startDate,
          equity: params.initialCapital,
          cash: params.initialCapital,
          totalTrades: 0
        },
        params
      };

      setBacktests(prev => [newBacktest, ...prev]);
      setActiveBacktest(newBacktest);
      setIsRunning(true);
    } catch (error) {
      console.error('Error creating backtest:', error);
      alert('Failed to create backtest');
    } finally {
      setIsCreating(false);
    }
  };

  // Step backtest forward
  const stepBacktest = async (backtestId: string, days: number = 1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/backtests/${backtestId}/step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days }),
      });

      if (!response.ok) {
        throw new Error('Failed to step backtest');
      }

      const result = await response.json();
      
      setBacktests(prev => prev.map(bt => 
        bt.id === backtestId 
          ? { ...bt, status: { ...bt.status, ...result } }
          : bt
      ));

      if (activeBacktest?.id === backtestId) {
        setActiveBacktest(prev => prev ? { ...prev, status: { ...prev.status, ...result } } : null);
      }

      // Check if backtest is completed
      if (result.status === 'completed') {
        setIsRunning(false);
        await loadBacktestArtifacts(backtestId);
      }
    } catch (error) {
      console.error('Error stepping backtest:', error);
    }
  };

  // Load backtest artifacts
  const loadBacktestArtifacts = async (backtestId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/backtests/${backtestId}/artifacts`);
      if (!response.ok) {
        throw new Error('Failed to load artifacts');
      }

      const artifacts = await response.json();
      
      setBacktests(prev => prev.map(bt => 
        bt.id === backtestId 
          ? { ...bt, artifacts }
          : bt
      ));

      if (activeBacktest?.id === backtestId) {
        setActiveBacktest(prev => prev ? { ...prev, artifacts } : null);
      }
    } catch (error) {
      console.error('Error loading artifacts:', error);
    }
  };

  // Auto-step running backtests
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const runningBacktests = backtests.filter(bt => bt.status.status === 'running');
      
      runningBacktests.forEach(backtest => {
        stepBacktest(backtest.id, 1);
      });

      // Check if all backtests are completed
      const allCompleted = backtests.every(bt => bt.status.status !== 'running');
      if (allCompleted) {
        setIsRunning(false);
      }
    }, 2000); // Step every 2 seconds

    return () => clearInterval(interval);
  }, [isRunning, backtests]);

  // Download CSV
  const downloadCSV = async (backtestId: string, filename: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/backtests/${backtestId}/artifacts/${filename}`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <BarChart3 className="header-icon" />
            <h1>ETF Backtester</h1>
          </div>
          <div className="header-right">
            <div className="status-indicator">
              {isRunning ? (
                <>
                  <Play className="status-icon running" />
                  <span>Running</span>
                </>
              ) : (
                <>
                  <Pause className="status-icon stopped" />
                  <span>Stopped</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          <div className="sidebar">
            <div className="sidebar-section">
              <h3>Backtests</h3>
              <div className="backtest-list">
                {backtests.map(backtest => (
                  <div
                    key={backtest.id}
                    className={`backtest-item ${activeBacktest?.id === backtest.id ? 'active' : ''}`}
                    onClick={() => setActiveBacktest(backtest)}
                  >
                    <div className="backtest-info">
                      <div className="backtest-name">
                        {backtest.params.startDate} - {backtest.params.endDate}
                      </div>
                      <div className="backtest-status">
                        <span className={`status-badge ${backtest.status.status}`}>
                          {backtest.status.status}
                        </span>
                        <span className="progress">
                          {backtest.status.progress.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="backtest-metrics">
                      <div className="metric">
                        <DollarSign className="metric-icon" />
                        <span>₹{backtest.status.equity.toLocaleString()}</span>
                      </div>
                      <div className="metric">
                        <TrendingUp className="metric-icon" />
                        <span>{backtest.status.totalTrades} trades</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Actions</h3>
              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={() => document.getElementById('backtest-form')?.scrollIntoView()}
                  disabled={isCreating}
                >
                  <Play className="btn-icon" />
                  New Backtest
                </button>
                
                {activeBacktest && (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={() => stepBacktest(activeBacktest.id, 1)}
                      disabled={activeBacktest.status.status !== 'running'}
                    >
                      Step 1 Day
                    </button>
                    
                    <button
                      className="btn btn-secondary"
                      onClick={() => stepBacktest(activeBacktest.id, 30)}
                      disabled={activeBacktest.status.status !== 'running'}
                    >
                      Step 30 Days
                    </button>
                  </>
                )}
              </div>
            </div>

            {activeBacktest?.artifacts && (
              <div className="sidebar-section">
                <h3>Downloads</h3>
                <div className="download-buttons">
                  <button
                    className="btn btn-outline"
                    onClick={() => downloadCSV(activeBacktest.id, 'trades.csv')}
                  >
                    <Download className="btn-icon" />
                    Trades CSV
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => downloadCSV(activeBacktest.id, 'equity.csv')}
                  >
                    <Download className="btn-icon" />
                    Equity CSV
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => downloadCSV(activeBacktest.id, 'holdings.csv')}
                  >
                    <Download className="btn-icon" />
                    Holdings CSV
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="content-area">
            <div id="backtest-form">
              <BacktestForm onSubmit={createBacktest} isLoading={isCreating} />
            </div>

            {activeBacktest && (
              <>
                <BacktestStatusComponent backtest={activeBacktest} />
                {activeBacktest.artifacts && (
                  <BacktestResults artifacts={activeBacktest.artifacts} />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
