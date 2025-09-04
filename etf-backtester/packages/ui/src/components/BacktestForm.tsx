import React, { useState } from 'react';
import { BacktestParams } from '../../../common/types';

interface BacktestFormProps {
  onSubmit: (params: BacktestParams) => void;
  isLoading: boolean;
}

const BacktestForm: React.FC<BacktestFormProps> = ({ onSubmit, isLoading }) => {
  const [params, setParams] = useState<BacktestParams>({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialCapital: 1000000,
    profitTarget: 6,
    averagingThreshold: 2.5,
    maxETFsPerSector: 3,
    topK: 5,
    executionPrice: 'close',
    capitalMode: 'chunk_global_pool',
    compoundingMode: 'fixed_chunk_progression',
    chunkConfig: {
      numberOfChunks: 50,
      baseChunkSize: 20000,
      progressionFactor: 1.06
    },
    fractionalConfig: {
      fraction: 0.02,
      maxTradeCap: 50000
    },
    kellyConfig: {
      lookbackPeriod: 30,
      maxFraction: 0.05
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(params);
  };

  const handleInputChange = (field: string, value: any) => {
    setParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setParams(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof BacktestParams],
        [field]: value
      }
    }));
  };

  return (
    <div className="backtest-form">
      <h2>Create New Backtest</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={params.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              value={params.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="initialCapital">Initial Capital (₹)</label>
            <input
              type="number"
              id="initialCapital"
              value={params.initialCapital}
              onChange={(e) => handleInputChange('initialCapital', parseFloat(e.target.value))}
              min="10000"
              step="10000"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="profitTarget">Profit Target (%)</label>
            <input
              type="number"
              id="profitTarget"
              value={params.profitTarget}
              onChange={(e) => handleInputChange('profitTarget', parseFloat(e.target.value))}
              min="1"
              max="50"
              step="0.5"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="averagingThreshold">Averaging Threshold (%)</label>
            <input
              type="number"
              id="averagingThreshold"
              value={params.averagingThreshold}
              onChange={(e) => handleInputChange('averagingThreshold', parseFloat(e.target.value))}
              min="1"
              max="20"
              step="0.5"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxETFsPerSector">Max ETFs per Sector</label>
            <input
              type="number"
              id="maxETFsPerSector"
              value={params.maxETFsPerSector}
              onChange={(e) => handleInputChange('maxETFsPerSector', parseInt(e.target.value))}
              min="1"
              max="10"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="topK">Top K Symbols</label>
            <input
              type="number"
              id="topK"
              value={params.topK}
              onChange={(e) => handleInputChange('topK', parseInt(e.target.value))}
              min="1"
              max="20"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="executionPrice">Execution Price</label>
            <select
              id="executionPrice"
              value={params.executionPrice}
              onChange={(e) => handleInputChange('executionPrice', e.target.value)}
            >
              <option value="open">Open</option>
              <option value="close">Close</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="capitalMode">Capital Mode</label>
            <select
              id="capitalMode"
              value={params.capitalMode}
              onChange={(e) => handleInputChange('capitalMode', e.target.value)}
            >
              <option value="chunk_global_pool">Chunk Global Pool</option>
              <option value="chunk_independent">Chunk Independent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="compoundingMode">Compounding Mode</label>
            <select
              id="compoundingMode"
              value={params.compoundingMode}
              onChange={(e) => handleInputChange('compoundingMode', e.target.value)}
            >
              <option value="fixed_chunk_progression">Fixed Chunk Progression</option>
              <option value="fixed_fractional">Fixed Fractional</option>
              <option value="kelly_fractional">Kelly Fractional</option>
            </select>
          </div>
        </div>

        {params.compoundingMode === 'fixed_chunk_progression' && (
          <div className="form-section">
            <h3>Chunk Configuration</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="numberOfChunks">Number of Chunks</label>
                <input
                  type="number"
                  id="numberOfChunks"
                  value={params.chunkConfig?.numberOfChunks || 50}
                  onChange={(e) => handleNestedInputChange('chunkConfig', 'numberOfChunks', parseInt(e.target.value))}
                  min="10"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="baseChunkSize">Base Chunk Size (₹)</label>
                <input
                  type="number"
                  id="baseChunkSize"
                  value={params.chunkConfig?.baseChunkSize || 20000}
                  onChange={(e) => handleNestedInputChange('chunkConfig', 'baseChunkSize', parseFloat(e.target.value))}
                  min="5000"
                  step="5000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="progressionFactor">Progression Factor</label>
                <input
                  type="number"
                  id="progressionFactor"
                  value={params.chunkConfig?.progressionFactor || 1.06}
                  onChange={(e) => handleNestedInputChange('chunkConfig', 'progressionFactor', parseFloat(e.target.value))}
                  min="1.01"
                  max="1.20"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        )}

        {params.compoundingMode === 'fixed_fractional' && (
          <div className="form-section">
            <h3>Fractional Configuration</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fraction">Fraction (%)</label>
                <input
                  type="number"
                  id="fraction"
                  value={(params.fractionalConfig?.fraction || 0.02) * 100}
                  onChange={(e) => handleNestedInputChange('fractionalConfig', 'fraction', parseFloat(e.target.value) / 100)}
                  min="1"
                  max="10"
                  step="0.5"
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxTradeCap">Max Trade Cap (₹)</label>
                <input
                  type="number"
                  id="maxTradeCap"
                  value={params.fractionalConfig?.maxTradeCap || 50000}
                  onChange={(e) => handleNestedInputChange('fractionalConfig', 'maxTradeCap', parseFloat(e.target.value))}
                  min="10000"
                  step="10000"
                />
              </div>
            </div>
          </div>
        )}

        {params.compoundingMode === 'kelly_fractional' && (
          <div className="form-section">
            <h3>Kelly Configuration</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="lookbackPeriod">Lookback Period (days)</label>
                <input
                  type="number"
                  id="lookbackPeriod"
                  value={params.kellyConfig?.lookbackPeriod || 30}
                  onChange={(e) => handleNestedInputChange('kellyConfig', 'lookbackPeriod', parseInt(e.target.value))}
                  min="10"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxFraction">Max Fraction (%)</label>
                <input
                  type="number"
                  id="maxFraction"
                  value={(params.kellyConfig?.maxFraction || 0.05) * 100}
                  onChange={(e) => handleNestedInputChange('kellyConfig', 'maxFraction', parseFloat(e.target.value) / 100)}
                  min="1"
                  max="20"
                  step="1"
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Start Backtest'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BacktestForm;
