import React, { useState, useMemo } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Download,
  Search
} from 'lucide-react';

const ChunkSimulationTable = ({ simulationData, chunks, config }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'day', direction: 'asc' });
  const [filterChunk, setFilterChunk] = useState('all');
  const [filterResult, setFilterResult] = useState('all'); // 'all', 'win', 'loss'
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!simulationData) return [];
    
    let filtered = simulationData.filter(trade => {
      // Filter by chunk
      if (filterChunk !== 'all' && trade.chunkId !== parseInt(filterChunk)) {
        return false;
      }
      
      // Filter by result - only apply to EXIT actions
      if (filterResult !== 'all' && trade.action === 'EXIT') {
        if (filterResult === 'win' && !trade.isWin) return false;
        if (filterResult === 'loss' && trade.isWin) return false;
      }
      
      // Search filter
      if (searchTerm && !trade.chunkId.toString().includes(searchTerm)) {
        return false;
      }
      
      return true;
    });

    // Sort data
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [simulationData, sortConfig, filterChunk, filterResult, searchTerm]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportToCSV = () => {
    if (!filteredData.length) return;
    
    const headers = ['Day', 'Chunk ID', 'Action', 'Starting Capital', 'Result', 'Profit/Loss', 'Ending Capital', 'Holding Days'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(trade => [
        trade.day,
        trade.chunkId,
        trade.action,
        trade.startingCapital.toFixed(2),
        trade.action === 'EXIT' ? (trade.isWin ? 'Win' : 'Loss') : 'N/A',
        trade.action === 'EXIT' ? trade.profit.toFixed(2) : 'N/A',
        trade.action === 'EXIT' ? trade.endingCapital.toFixed(2) : 'N/A',
        trade.holdingDays || 'N/A'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chunk_simulation_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const SortButton = ({ column, label }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center space-x-1 text-left font-medium text-upstox-primary hover:text-accent-blue"
    >
      <span>{label}</span>
      {sortConfig.key === column && (
        sortConfig.direction === 'asc' ? 
          <ArrowUp className="w-4 h-4" /> : 
          <ArrowDown className="w-4 h-4" />
      )}
    </button>
  );

  if (!simulationData || simulationData.length === 0) {
    return (
      <div className="card-upstox p-6">
        <h3 className="text-lg font-semibold text-upstox-primary mb-4">Simulation Results</h3>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-upstox-secondary mx-auto mb-4" />
          <p className="text-upstox-secondary">No simulation data available. Run a simulation to see results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-upstox p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-upstox-primary">Detailed Simulation Results</h3>
        <button
          onClick={exportToCSV}
          className="btn-upstox-success"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Filter by Chunk
          </label>
          <select
            value={filterChunk}
            onChange={(e) => setFilterChunk(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Chunks</option>
            {chunks && chunks.map(chunk => (
              <option key={chunk.id} value={chunk.id}>
                Chunk #{chunk.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Result
          </label>
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Results</option>
            <option value="win">Wins Only</option>
            <option value="loss">Losses Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Search className="w-4 h-4 inline mr-1" />
            Search Chunk
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter chunk number..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            Showing {filteredData.length} of {simulationData.length} trades
          </div>
        </div>
      </div>

      {/* Summary Stats for Filtered Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600">Total Trades</p>
              <p className="text-lg font-bold text-blue-900">{filteredData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm text-green-600">Winning Exits</p>
              <p className="text-lg font-bold text-green-900">
                {filteredData.filter(t => t.action === 'EXIT' && t.isWin).length} 
                <span className="text-sm text-green-600 ml-1">
                  ({filteredData.filter(t => t.action === 'EXIT').length > 0 ? 
                    ((filteredData.filter(t => t.action === 'EXIT' && t.isWin).length / filteredData.filter(t => t.action === 'EXIT').length) * 100).toFixed(1) : 0}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <p className="text-sm text-red-600">Losing Exits</p>
              <p className="text-lg font-bold text-red-900">
                {filteredData.filter(t => t.action === 'EXIT' && !t.isWin).length}
                <span className="text-sm text-red-600 ml-1">
                  ({filteredData.filter(t => t.action === 'EXIT').length > 0 ? 
                    ((filteredData.filter(t => t.action === 'EXIT' && !t.isWin).length / filteredData.filter(t => t.action === 'EXIT').length) * 100).toFixed(1) : 0}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p className="text-sm text-purple-600">Net Profit</p>
              <p className={`text-lg font-bold ${
                filteredData.filter(t => t.action === 'EXIT').reduce((sum, t) => sum + (t.profit || 0), 0) >= 0 ? 'text-green-900' : 'text-red-900'
              }`}>
                ₹{filteredData.filter(t => t.action === 'EXIT').reduce((sum, t) => sum + (t.profit || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton column="day" label="Day" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton column="chunkId" label="Chunk ID" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton column="action" label="Action" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton column="startingCapital" label="Capital" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton column="isWin" label="Result" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton column="profit" label="Profit/Loss" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton column="holdingDays" label="Hold Days" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((trade, index) => {
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {trade.day}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      #{trade.chunkId}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      trade.action === 'DEPLOY'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {trade.action === 'DEPLOY' ? '📈 Deploy' : '💰 Exit'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{trade.startingCapital.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trade.action === 'EXIT' ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trade.isWin
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.isWin ? (
                          <>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Win
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Loss
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {trade.action === 'EXIT' ? (
                      <span className={trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{trade.profit.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trade.holdingDays ? `${trade.holdingDays} days` : 
                     trade.expectedExitDate ? `~${trade.expectedExitDate - trade.day} days` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChunkSimulationTable;
