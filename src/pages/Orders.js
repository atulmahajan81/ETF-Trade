import React, { useState } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, Download } from 'lucide-react';

const Orders = () => {
  const { 
    pendingOrders, 
    orderHistory, 
    checkOrderStatus, 
    cancelOrder,
    fetchOrderHistory,
    fetchBrokerHoldings,
    tradingStatus,
    tradingMessage
  } = useETFTrading();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isFetchingHoldings, setIsFetchingHoldings] = useState(false);
  const [brokerHoldings, setBrokerHoldings] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'history', or 'broker-holdings'

  const handleRefreshOrders = async () => {
    setIsRefreshing(true);
    try {
      // If there are pendings, refresh each; otherwise, fetch broker order book and reconcile
      if (pendingOrders && pendingOrders.length > 0) {
        for (const order of pendingOrders) {
          if (order.orderId) await checkOrderStatus(order.orderId);
        }
      } else {
        await fetchOrderHistory();
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFetchOrderHistory = async () => {
    setIsFetchingHistory(true);
    try {
      await fetchOrderHistory();
      alert('Order history fetched successfully from MStocks!');
    } catch (error) {
      console.error('Error fetching order history:', error);
      alert(`Error fetching order history: ${error.message}`);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleFetchBrokerHoldings = async () => {
    setIsFetchingHoldings(true);
    try {
      const holdings = await fetchBrokerHoldings();
      setBrokerHoldings(holdings);
      alert('Broker holdings fetched successfully from MStocks!');
    } catch (error) {
      console.error('Error fetching broker holdings:', error);
      alert(`Error fetching broker holdings: ${error.message}`);
    } finally {
      setIsFetchingHoldings(false);
    }
  };



  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await cancelOrder(orderId);
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert(`Error cancelling order: ${error.message}`);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETE':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'CANCELLED':
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETE':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 bg-upstox-primary text-upstox-primary min-h-screen p-6 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-upstox-primary">Orders</h1>
          <p className="text-upstox-secondary">Track your pending orders and order history</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefreshOrders}
            disabled={isRefreshing}
            className="btn-upstox-secondary disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Orders
          </button>
          <button
            onClick={handleFetchOrderHistory}
            disabled={isFetchingHistory}
            className="btn-upstox-secondary disabled:opacity-50"
          >
            <Download className={`w-4 h-4 mr-2 ${isFetchingHistory ? 'animate-spin' : ''}`} />
            Fetch History
          </button>
          <button
            onClick={handleFetchBrokerHoldings}
            disabled={isFetchingHoldings}
            className="btn-upstox-secondary disabled:opacity-50"
          >
            <Download className={`w-4 h-4 mr-2 ${isFetchingHoldings ? 'animate-spin' : ''}`} />
            Fetch Holdings
          </button>
        </div>
      </div>

      {/* Trading Status Banner */}
      {tradingStatus !== 'idle' && (
        <div className="card-upstox p-4">
          <div className="flex items-center">
            {tradingStatus === 'success' && <CheckCircle className="w-5 h-5 text-positive mr-2" />}
            {tradingStatus === 'error' && <XCircle className="w-5 h-5 text-negative mr-2" />}
            {tradingStatus === 'loading' && <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mr-2"></div>}
            <div>
              <h3 className={`text-sm font-medium ${
                tradingStatus === 'success' ? 'text-positive' :
                tradingStatus === 'error' ? 'text-negative' :
                tradingStatus === 'loading' ? 'text-upstox-primary' :
                'text-upstox-secondary'
              }`}>
                {tradingStatus === 'success' ? 'Order Placed Successfully' :
                 tradingStatus === 'error' ? 'Order Failed' :
                 tradingStatus === 'loading' ? 'Processing Order' :
                 'Trading Status'}
              </h3>
              <p className="text-sm text-upstox-secondary">
                {typeof tradingMessage === 'string' ? tradingMessage : JSON.stringify(tradingMessage)}
              </p>
            </div>
          </div>
        </div>
      )}

             {/* Live API Status Notice */}
       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
         <div className="flex items-center">
           <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
           <div>
             <h3 className="text-sm font-medium text-blue-800">🔄 Live API Mode Active</h3>
             <p className="text-sm text-blue-700">
               Using username/password/OTP authentication for MStocks API. 
               Please configure your credentials in src/services/mstocksApi.js
             </p>
             <p className="text-sm text-blue-600 mt-1">
               If API endpoints are not responding, orders will be simulated for testing.
             </p>
           </div>
         </div>
       </div>

      {/* Tab Navigation */}
      <div className="border-b border-upstox-primary">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-upstox-accent text-upstox-primary bg-upstox-tertiary rounded-t-lg'
                : 'border-transparent text-upstox-secondary hover:text-upstox-primary hover:border-upstox-primary'
            }`}
          >
            Pending Orders ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-upstox-accent text-upstox-primary bg-upstox-tertiary rounded-t-lg'
                : 'border-transparent text-upstox-secondary hover:text-upstox-primary hover:border-upstox-primary'
            }`}
          >
            Order History ({orderHistory.length})
          </button>
          {brokerHoldings.length > 0 && (
            <button
              onClick={() => setActiveTab('broker-holdings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'broker-holdings'
                  ? 'border-upstox-accent text-upstox-primary bg-upstox-tertiary rounded-t-lg'
                  : 'border-transparent text-upstox-secondary hover:text-upstox-primary hover:border-upstox-primary'
              }`}
            >
              Broker Holdings ({brokerHoldings.length})
            </button>
          )}
        </nav>
      </div>

      {/* Pending Orders */}
      {activeTab === 'pending' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending orders</h3>
              <p className="mt-1 text-sm text-gray-500">All your orders have been processed.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {pendingOrders.map((order) => (
                <li key={order.orderId} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(order.status)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {order.type} {order.symbol}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <p>Quantity: {order.quantity}</p>
                          <span className="mx-2">•</span>
                          <p>Price: ₹{order.price || 'Market'}</p>
                          <span className="mx-2">•</span>
                          <p>Order ID: {order.orderId}</p>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Placed: {new Date(order.timestamp).toLocaleString()}
                        </div>
                        {order.message && (
                          <div className="mt-1 text-xs text-gray-400">
                            {order.message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => checkOrderStatus(order.orderId)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Check Status
                      </button>
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelOrder(order.orderId)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-white hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Order History */}
      {activeTab === 'history' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {orderHistory.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No order history</h3>
              <p className="mt-1 text-sm text-gray-500">Completed orders will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {orderHistory.map((order) => (
                <li key={order.orderId} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(order.status)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {order.type} {order.symbol}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <p>Quantity: {order.quantity}</p>
                          <span className="mx-2">•</span>
                          <p>Price: ₹{order.price || 'Market'}</p>
                          <span className="mx-2">•</span>
                          <p>Order ID: {order.orderId}</p>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Completed: {new Date(order.timestamp).toLocaleString()}
                        </div>
                        {order.message && (
                          <div className="mt-1 text-xs text-gray-400">
                            {order.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
                 </div>
       )}

      {/* Broker Holdings */}
      {activeTab === 'broker-holdings' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {brokerHoldings.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No broker holdings</h3>
              <p className="mt-1 text-sm text-gray-500">Your broker holdings will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {brokerHoldings.map((holding) => (
                <li key={holding.symbol} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {holding.symbol}
                          </p>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {holding.quantity}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <p>Quantity: {holding.quantity}</p>
                          <span className="mx-2">•</span>
                          <p>Avg Price: ₹{holding.averagePrice}</p>
                          <span className="mx-2">•</span>
                          <p>Current Price: ₹{holding.currentPrice}</p>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Total Value: ₹{holding.value?.toLocaleString() || 'N/A'}
                        </div>
                        {holding.message && (
                          <div className="mt-1 text-xs text-gray-400">
                            {holding.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

 
     </div>
   );
 };

export default Orders; 