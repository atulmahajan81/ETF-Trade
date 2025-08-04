import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ETFRanking from './pages/ETFRanking';
import Holdings from './pages/Holdings';
import BrokerHoldings from './pages/BrokerHoldings';
import SoldItems from './pages/SoldItems';
import Strategy from './pages/Strategy';
import Orders from './pages/Orders';
import { ETFTradingProvider } from './context/ETFTradingContext';

function App() {
  return (
    <ETFTradingProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ranking" element={<ETFRanking />} />
              <Route path="/holdings" element={<Holdings />} />
              <Route path="/broker-holdings" element={<BrokerHoldings />} />
              <Route path="/sold" element={<SoldItems />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/strategy" element={<Strategy />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ETFTradingProvider>
  );
}

export default App; 