import React, { useMemo, useEffect, useState } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { 
  TrendingUp, 
  Package, 
  Target, 
  Calculator, 
  CheckCircle, 
  AlertCircle, 
  ArrowRightCircle, 
  Clock, 
  RefreshCw, 
  XCircle,
  BarChart3,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import mstocksApiService from '../services/mstocksApi';
import TradingModal from '../components/TradingModal';
import ProfessionalHeader from '../components/ProfessionalHeader';
import PortfolioOverview from '../components/PortfolioOverview';
import TradingActions from '../components/TradingActions';

const Dashboard = () => {
  const { 
    holdings, 
    etfs,
    totalInvested, 
    totalProfit, 
    targetProfit,
    userSetup,
    moneyManagement,
    userLogout,
    dispatch,
    actionTypes,
    isTradingEnabled,
    tradingMessage,
    pendingOrders,
    orderHistory,
    checkOrderStatus,
    manualReconcileOrder,
    cancelOrder,
    fetchOrderHistory
  } = useETFTrading();

  const [isPlacing] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [tradingMode, setTradingMode] = useState('buy');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showBalance, setShowBalance] = useState(true);

  // Best Buy: Top-ranked ETF (not already in holdings) by % below 20 DMA
  const bestBuy = useMemo(() => {
    if (!etfs || etfs.length === 0) return null;

    const validETFs = etfs.filter(e => Number(e.cmp) > 0 && Number(e.dma20) > 0);

    const ranked = validETFs
      .map(etf => {
        const isHolding = holdings?.some(h => h.symbol === etf.symbol);
        const percentDiff = ((etf.cmp - etf.dma20) / etf.dma20) * 100;
        return { ...etf, isHolding, percentDiff };
      })
      .filter(etf => !etf.isHolding)
      .sort((a, b) => a.percentDiff - b.percentDiff);

    return ranked[0] || null;
  }, [etfs, holdings]);

  // Best Sell: Holding with highest absolute profit that meets target profit percent
  const bestSell = useMemo(() => {
    if (!holdings || holdings.length === 0) return null;
    const withProfit = holdings
      .map(h => {
        const buy = h.avgPrice || h.buyPrice || 0;
        const cmp = h.currentPrice || buy;
        const profitPercent = buy > 0 ? ((cmp - buy) / buy) * 100 : 0;
        const absoluteProfit = (cmp - buy) * (h.quantity || 0);
        return { ...h, profitPercent, absoluteProfit };
      })
      .filter(h => h.profitPercent >= targetProfit)
      .sort((a, b) => b.absoluteProfit - a.absoluteProfit);
    return withProfit[0] || null;
  }, [holdings, targetProfit]);

  const handlePlaceBestBuy = async () => {
    if (!bestBuy) return;
    
    const selectedItemData = { 
      symbol: bestBuy.symbol, 
      currentPrice: bestBuy.cmp, 
      cmp: bestBuy.cmp,
      name: bestBuy.name,
      sector: bestBuy.sector
    };
    
    setSelectedItem(selectedItemData);
    setTradingMode('buy');
    setShowTradingModal(true);
  };

  const handlePlaceBestSell = async () => {
    if (!bestSell) return;
    setSelectedItem({ ...bestSell, currentPrice: bestSell.currentPrice });
    setTradingMode('sell');
    setShowTradingModal(true);
  };

  const handleRefreshOrders = async () => {
    try {
      if (pendingOrders && pendingOrders.length > 0) {
        for (const order of pendingOrders) {
          if (order?.orderId) await checkOrderStatus(order.orderId);
        }
      } else {
        await fetchOrderHistory();
      }
    } catch {}
  };

  const clearAllStorage = () => {
    if (window.confirm('Are you sure you want to clear all data? This will log you out and clear all saved data.')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const enableDemoMode = () => {
    if (window.confirm('Enable demo mode? This will create a virtual trading environment for testing.')) {
      // Backup existing data
      const existingData = localStorage.getItem('etfTradingData');
      const existingUser = localStorage.getItem('etfCurrentUser');
      if (existingData) {
        try {
          const parsedExistingData = JSON.parse(existingData);
          if (parsedExistingData.userSetup?.userData?.name && parsedExistingData.userSetup.userData.name !== 'Demo User') {
            parsedExistingData.userSetup.userData.originalName = parsedExistingData.userSetup.userData.name;
          }
          localStorage.setItem('etfTradingData_backup', JSON.stringify(parsedExistingData));
        } catch (error) {
          localStorage.setItem('etfTradingData_backup', existingData);
        }
      }

      // Create demo data
      const demoData = {
        holdings: [
          {
            symbol: 'NIFTYBEES',
            name: 'Nippon India ETF Nifty BeES',
            quantity: 100,
            avgPrice: 245.50,
            currentPrice: 248.75,
            sector: 'ETF',
            buyDate: '2024-01-15'
          },
          {
            symbol: 'BANKBEES',
            name: 'Nippon India ETF Bank BeES',
            quantity: 50,
            avgPrice: 432.80,
            currentPrice: 445.20,
            sector: 'Banking',
            buyDate: '2024-01-20'
          }
        ],
        soldItems: [
          {
            symbol: 'GOLDBEES',
            name: 'Nippon India ETF Gold BeES',
            quantity: 25,
            buyPrice: 52.30,
            sellPrice: 54.80,
            profit: 62.50,
            sellDate: '2024-01-25',
            sector: 'Gold'
          }
        ],
        userSetup: {
          isCompleted: true,
          userData: {
            name: 'Demo User',
            email: 'demo@example.com',
            phone: '1234567890',
            initialCapital: 100000,
            tradingAmount: 5000,
            hasETFTradingExperience: true
          },
          initialCapital: 100000,
          tradingAmount: 5000,
          hasETFTradingExperience: true
        },
        moneyManagement: {
          availableCapital: 85000,
          nextBuyAmount: 5000,
          compoundingEffect: 12.5,
          totalProfits: 62.50,
          reinvestedAmount: 62.50
        },
        strategy: {
          profitTarget: 6,
          averagingThreshold: 2.5,
          maxEtfsPerSector: 3,
          dailySellLimit: 1
        },
        totalInvested: 15000,
        totalProfit: 62.50,
        dailySellCount: 0,
        lastSellDate: null
      };

      // Save demo data
      localStorage.setItem('etfTradingData', JSON.stringify(demoData));
      localStorage.setItem('demoMode', 'true');

      // Create demo user
      const demoUser = {
        username: 'demo_user',
        email: 'demo@example.com',
        uid: 'demo-user-id',
        name: 'Demo User',
        isFirebaseUser: false,
        isExistingUser: true
      };

      localStorage.setItem('etfCurrentUser', JSON.stringify(demoUser));

      // Update etfUsers
      const savedUsers = localStorage.getItem('etfUsers');
      const users = savedUsers ? JSON.parse(savedUsers) : {};
      users[demoUser.uid] = {
        userData: demoData,
        userSetup: demoData.userSetup
      };
      localStorage.setItem('etfUsers', JSON.stringify(users));

      // Update context
      dispatch({ 
        type: actionTypes.USER_LOGIN, 
        payload: { 
          user: demoUser, 
          userData: demoData 
        } 
      });
      
      dispatch({ 
        type: actionTypes.COMPLETE_USER_SETUP, 
        payload: demoData.userSetup.userData 
      });
      
      console.log('🎮 Demo mode enabled');
      window.location.reload();
    }
  };

  const disableDemoMode = () => {
    if (window.confirm('Are you sure you want to disable demo mode? This will restore your original data.')) {
      const backupData = localStorage.getItem('etfTradingData_backup');
      console.log('Backup data found:', backupData);
      
      if (backupData) {
        try {
          const parsedData = JSON.parse(backupData);
          console.log('Parsed backup data:', parsedData);
          console.log('User setup in backup:', parsedData.userSetup);
          console.log('User data in backup:', parsedData.userSetup?.userData);
          
          if (!parsedData.userSetup) {
            parsedData.userSetup = {
              isCompleted: true,
              userData: {
                name: 'User',
                email: 'user@example.com',
                phone: '1234567890',
                initialCapital: 100000,
                tradingAmount: 5000,
                hasETFTradingExperience: true
              },
              initialCapital: 100000,
              tradingAmount: 5000,
              hasETFTradingExperience: true
            };
          } else {
            parsedData.userSetup.isCompleted = true;
          }
          
          if (parsedData.userSetup && parsedData.userSetup.userData) {
            console.log('Current user data name:', parsedData.userSetup.userData.name);
            console.log('Original name in backup:', parsedData.userSetup.userData.originalName);
            
            if (parsedData.userSetup.userData.name === 'Demo User') {
              const originalName = parsedData.userSetup.userData.originalName;
              if (originalName && originalName !== 'Demo User') {
                parsedData.userSetup.userData.name = originalName;
                console.log('Restored original name:', originalName);
              } else {
                const currentUser = localStorage.getItem('etfCurrentUser');
                if (currentUser) {
                  const user = JSON.parse(currentUser);
                  if (user.name && user.name !== 'Demo User') {
                    parsedData.userSetup.userData.name = user.name;
                    console.log('Restored name from current user:', user.name);
                  } else {
                    parsedData.userSetup.userData.name = 'User';
                    console.log('Using default name: User');
                  }
                } else {
                  parsedData.userSetup.userData.name = 'User';
                  console.log('Using default name: User (no current user)');
                }
              }
            }
            parsedData.userSetup.isCompleted = true;
          }
          
          const currentUser = localStorage.getItem('etfCurrentUser');
          if (currentUser) {
            const user = JSON.parse(currentUser);
            
            const updatedUser = {
              ...user,
              username: user.username === 'demo_user' ? (parsedData.userSetup?.userData?.name?.toLowerCase().replace(/\s+/g, '_') || 'user') : user.username,
              email: user.email === 'demo@example.com' ? (parsedData.userSetup?.userData?.email || 'user@example.com') : user.email,
              name: parsedData.userSetup?.userData?.name || user.name,
              isExistingUser: true
            };
            localStorage.setItem('etfCurrentUser', JSON.stringify(updatedUser));
            
            const savedUsers = localStorage.getItem('etfUsers');
            const users = savedUsers ? JSON.parse(savedUsers) : {};
            users[updatedUser.uid] = {
              ...parsedData,
              userSetup: parsedData.userSetup
            };
            localStorage.setItem('etfUsers', JSON.stringify(users));
          } else {
            const defaultUser = {
              username: 'user',
              email: 'user@example.com',
              uid: 'default-user-id',
              isFirebaseUser: false,
              isExistingUser: true
            };
            localStorage.setItem('etfCurrentUser', JSON.stringify(defaultUser));
            
            const savedUsers = localStorage.getItem('etfUsers');
            const users = savedUsers ? JSON.parse(savedUsers) : {};
            users[defaultUser.uid] = {
              ...parsedData,
              userSetup: parsedData.userSetup
            };
            localStorage.setItem('etfUsers', JSON.stringify(users));
          }
          
          localStorage.setItem('etfTradingData', JSON.stringify(parsedData));
          localStorage.removeItem('etfTradingData_backup');
          localStorage.removeItem('demoMode');
          
          mstocksApiService.disableDemoMode();
          
          console.log('✅ Original data restored');
          
          if (parsedData.userSetup && parsedData.userSetup.userData) {
            const updatedUser = JSON.parse(localStorage.getItem('etfCurrentUser'));
            
            console.log('Restoring user data:', {
              user: updatedUser,
              userData: parsedData,
              userSetup: parsedData.userSetup.userData
            });
            
            dispatch({ 
              type: actionTypes.USER_LOGIN, 
              payload: { 
                user: updatedUser, 
                userData: parsedData 
              } 
            });
            
            dispatch({ 
              type: actionTypes.COMPLETE_USER_SETUP, 
              payload: parsedData.userSetup.userData 
            });
          }
          
          window.location.reload();
        } catch (error) {
          console.error('Error parsing backup data:', error);
          localStorage.removeItem('etfTradingData');
          localStorage.removeItem('etfTradingData_backup');
          localStorage.removeItem('etfUsers');
          localStorage.removeItem('etfCurrentUser');
          localStorage.removeItem('demoMode');
        }
      } else {
        console.log('ℹ️ No backup found, creating basic user setup');
        
        const currentUser = localStorage.getItem('etfCurrentUser');
        let originalName = 'User';
        let originalEmail = 'user@example.com';
        
        if (currentUser) {
          try {
            const user = JSON.parse(currentUser);
            if (user.name && user.name !== 'Demo User') {
              originalName = user.name;
            }
            if (user.email && user.email !== 'demo@example.com') {
              originalEmail = user.email;
            }
          } catch (error) {
            console.error('Error parsing current user:', error);
          }
        }
        
        const basicUserData = {
          holdings: [],
          soldItems: [],
          userSetup: {
            isCompleted: true,
            userData: {
              name: originalName,
              email: originalEmail,
              phone: '1234567890',
              initialCapital: 100000,
              tradingAmount: 5000,
              hasETFTradingExperience: true
            },
            initialCapital: 100000,
            tradingAmount: 5000,
            hasETFTradingExperience: true
          },
          moneyManagement: {
            availableCapital: 100000,
            nextBuyAmount: 5000,
            compoundingEffect: 0,
            totalProfits: 0,
            reinvestedAmount: 0
          },
          strategy: {
            profitTarget: 6,
            averagingThreshold: 2.5,
            maxEtfsPerSector: 3,
            dailySellLimit: 1
          },
          totalInvested: 0,
          totalProfit: 0,
          dailySellCount: 0,
          lastSellDate: null
        };
        
        const basicUser = {
          username: originalName.toLowerCase().replace(/\s+/g, '_'),
          email: originalEmail,
          uid: 'basic-user-id',
          name: originalName,
          isFirebaseUser: false,
          isExistingUser: true
        };
        
        localStorage.setItem('etfTradingData', JSON.stringify(basicUserData));
        localStorage.setItem('etfCurrentUser', JSON.stringify(basicUser));
        localStorage.removeItem('demoMode');
        
        const savedUsers = localStorage.getItem('etfUsers');
        const users = savedUsers ? JSON.parse(savedUsers) : {};
        users[basicUser.uid] = {
          userData: basicUserData,
          userSetup: basicUserData.userSetup
        };
        localStorage.setItem('etfUsers', JSON.stringify(users));
        
        mstocksApiService.disableDemoMode();
        
        console.log('✅ Basic user setup created with name:', originalName);
        
        dispatch({ 
          type: actionTypes.USER_LOGIN, 
          payload: { 
            user: basicUser, 
            userData: basicUserData 
          } 
        });
        
        dispatch({ 
          type: actionTypes.COMPLETE_USER_SETUP, 
          payload: basicUserData.userSetup.userData 
        });
        
        window.location.reload();
      }
    }
  };

  const isDemoMode = useMemo(() => {
    return localStorage.getItem('demoMode') === 'true';
  }, []);

  useEffect(() => {
    // Ensure demo mode is properly initialized
    if (!localStorage.getItem('demoMode')) {
      localStorage.setItem('demoMode', 'false');
    }
  }, []);

  // Status Banner Component
  const StatusBanner = () => {
    if (!isTradingEnabled) {
  return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
        <div>
              <h3 className="text-sm font-medium text-yellow-800">Trading Disabled</h3>
              <p className="text-sm text-yellow-700 mt-1">{tradingMessage}</p>
          </div>
          </div>
        </div>
      );
    }
    return null;
  };

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
    <div className="min-h-screen bg-upstox-primary text-upstox-primary">
      {/* Professional Header */}
      <ProfessionalHeader
        userSetup={userSetup}
        moneyManagement={moneyManagement}
        userLogout={userLogout}
        isDemoMode={isDemoMode}
        onEnableDemo={enableDemoMode}
        onDisableDemo={disableDemoMode}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatusBanner />



        {/* Portfolio Overview */}
        <PortfolioOverview
          totalInvested={totalInvested}
          totalProfit={totalProfit}
          moneyManagement={moneyManagement}
        />

        {/* Money Management */}
        <div className="card-upstox mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-accent-blue to-accent-blue-light px-6 py-4 border-b border-upstox-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Money Management</h2>
                  <p className="text-sm text-white text-opacity-80">Track your capital allocation and compounding strategy</p>
                </div>
              </div>
              <Link 
                to="/money-management" 
                className="inline-flex items-center px-3 py-1.5 border border-white border-opacity-30 rounded-md text-sm font-medium text-white bg-white bg-opacity-10 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
              >
                <ArrowRightCircle className="h-4 w-4 mr-1" />
                View Details
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-3">
                  {formatCurrency(moneyManagement?.availableCapital || 0)}
              </div>
                <div className="text-sm font-medium text-neutral-500">Available Capital</div>
                <div className="text-xs text-neutral-400 mt-1">Ready for investment</div>
            </div>
            
            <div className="text-center">
                <div className="text-4xl font-bold text-yellow-600 mb-3">
                  {formatCurrency(moneyManagement?.nextBuyAmount || 0)}
              </div>
                <div className="text-sm font-medium text-neutral-500">Next Buy Amount</div>
                <div className="text-xs text-neutral-400 mt-1">Recommended allocation</div>
            </div>
            
            <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-3">
                  {formatPercentage(moneyManagement?.compoundingEffect || 0)}
                </div>
                <div className="text-sm font-medium text-neutral-500">Compounding Effect</div>
                <div className="text-xs text-neutral-400 mt-1">Profit reinvestment</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Actions */}
        <TradingActions
          bestBuy={bestBuy}
          bestSell={bestSell}
          isPlacing={isPlacing}
          onPlaceBestBuy={handlePlaceBestBuy}
          onPlaceBestSell={handlePlaceBestSell}
        />

        {/* Orders Overview */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <Activity className="h-5 w-5 text-neutral-600" />
            </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Orders Overview</h3>
                  <p className="text-sm text-neutral-600">Monitor your pending and completed orders</p>
          </div>
              </div>
              <button
                onClick={handleRefreshOrders}
                className="inline-flex items-center px-3 py-1.5 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Orders */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning-600" />
                  Pending Orders ({pendingOrders?.length || 0})
                </h4>
                {pendingOrders && pendingOrders.length > 0 ? (
                  <div className="space-y-3">
                    {pendingOrders.map((order, index) => (
                      <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-neutral-900">{order.symbol}</div>
                            <div className="text-sm text-neutral-500">{order.quantity} @ ₹{order.price}</div>
                            <div className="text-xs text-neutral-400 mt-1">Order ID: {String(order.orderId || order.id || '-')}</div>
                            {order.status && (
                              <div className="text-xs text-neutral-500 mt-1">Status: {order.status}</div>
                            )}
                            {order.message && (
                              <div className="text-xs text-neutral-500 mt-1 line-clamp-2" title={String(order.message)}>
                                Reason: {String(order.message)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {order.type}
                            </span>
                            {/* Show reconcile button for temporary orders OR all orders for testing */}
                            {(order.isTemporary || order.status === 'PENDING_RECONCILIATION' || String(order.orderId).startsWith('temp_')) && (
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🔧 Manual reconcile button clicked for:', order.orderId);
                                  console.log('🔧 Order details:', JSON.stringify(order, null, 2));
                                  console.log('🔧 manualReconcileOrder function available:', typeof manualReconcileOrder);
                                  console.log('🔧 All context functions:', {
                                    checkOrderStatus: typeof checkOrderStatus,
                                    manualReconcileOrder: typeof manualReconcileOrder,
                                    cancelOrder: typeof cancelOrder,
                                    fetchOrderHistory: typeof fetchOrderHistory
                                  });
                                  
                                  alert('Button clicked! Check console for debug info.');
                                  
                                  try {
                                    if (typeof manualReconcileOrder !== 'function') {
                                      console.error('❌ manualReconcileOrder is not a function:', manualReconcileOrder);
                                      alert('Reconcile function not available. Please check console.');
                                      return;
                                    }
                                    console.log('🔧 Calling manualReconcileOrder...');
                                    const result = await manualReconcileOrder(order.orderId);
                                    console.log('🔧 Reconciliation result:', result);
                                    if (result) {
                                      console.log('✅ Manual reconciliation successful');
                                      alert('Reconciliation successful! Order ID: ' + result);
                                    } else {
                                      console.log('❌ Manual reconciliation failed');
                                      alert('Reconciliation failed. Check console for details.');
                                    }
                                  } catch (error) {
                                    console.error('❌ Error during manual reconciliation:', error);
                                    alert('Error during reconciliation: ' + error.message);
                                  }
                                }}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded hover:bg-blue-200 transition-colors"
                                title="Try to find this order in broker system"
                              >
                                Reconcile
                              </button>
                            )}
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🔧 Check Status button clicked for order:', order.orderId);
                                console.log('🔧 checkOrderStatus function available:', typeof checkOrderStatus);
                                console.log('🔧 handleRefreshOrders function available:', typeof handleRefreshOrders);
                                try {
                                  if (order.orderId) {
                                    console.log('🔧 Calling checkOrderStatus for:', order.orderId);
                                    if (typeof checkOrderStatus !== 'function') {
                                      console.error('❌ checkOrderStatus is not a function:', checkOrderStatus);
                                      alert('Check Status function not available.');
                                      return;
                                    }
                                    const result = await checkOrderStatus(order.orderId);
                                    console.log('🔧 Check Status result:', result);
                                    alert('Status check completed. Check console for details.');
                                  } else {
                                    console.log('🔧 No order ID, calling handleRefreshOrders');
                                    await handleRefreshOrders();
                                    alert('Refresh completed.');
                                  }
                                } catch (error) {
                                  console.error('❌ Error during status check:', error);
                                  alert('Error during status check: ' + error.message);
                                }
                              }}
                              className="px-2 py-1 text-xs border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-100"
                              title="Check Status"
                            >
                              Check Status
                            </button>
                            <button
                              onClick={() => cancelOrder(order.orderId)}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              title="Cancel Order"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
          </div>
          </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-neutral-400" />
                    </div>
                    <h5 className="text-sm font-medium text-neutral-900 mb-1">No Pending Orders</h5>
                    <p className="text-xs text-neutral-500">All orders have been processed</p>
        </div>
      )}
              </div>

              {/* Recent Orders */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  Recent Orders ({orderHistory?.length || 0})
                </h4>
                {orderHistory && orderHistory.length > 0 ? (
          <div className="space-y-3">
                    {orderHistory.slice(0, 5).map((order, index) => (
                      <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-neutral-900">{order.symbol}</div>
                            <div className="text-sm text-neutral-500">{order.quantity} @ ₹{order.price}</div>
                            <div className="text-xs text-neutral-400 mt-1">Order ID: {String(order.orderId || order.id || '-')}</div>
                            {order.status && (
                              <div className="text-xs text-neutral-500 mt-1">Status: {order.status}</div>
                            )}
                            {order.message && (
                              <div className="text-xs text-neutral-500 mt-1 line-clamp-2" title={String(order.message)}>
                                Reason: {String(order.message)}
            </div>
                            )}
            </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {order.type}
                            </span>
                            <div className="text-xs text-neutral-500 mt-1">{new Date(order.timestamp).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-neutral-400" />
                    </div>
                    <h5 className="text-sm font-medium text-neutral-900 mb-1">No Recent Orders</h5>
                    <p className="text-xs text-neutral-500">Start trading to see your order history</p>
            </div>
                )}
            </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/etf-ranking" className="group">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group-hover:border-blue-300">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2 group-hover:text-blue-700 transition-colors">ETF Ranking</h3>
                <p className="text-sm text-neutral-500">View and analyze ETF opportunities</p>
      </div>
            </div>
          </Link>

          <Link to="/holdings" className="group">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group-hover:border-green-300">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2 group-hover:text-green-700 transition-colors">Holdings</h3>
                <p className="text-sm text-neutral-500">Manage your current positions</p>
          </div>
            </div>
          </Link>

          <Link to="/sold-items" className="group">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group-hover:border-yellow-300">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2 group-hover:text-yellow-700 transition-colors">Sold Items</h3>
                <p className="text-sm text-neutral-500">Track your trading history</p>
              </div>
            </div>
          </Link>

          <Link to="/strategy" className="group">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group-hover:border-red-300">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                  <Target className="h-6 w-6 text-red-600" />
          </div>
                <h3 className="font-semibold text-neutral-900 mb-2 group-hover:text-red-700 transition-colors">Strategy</h3>
                <p className="text-sm text-neutral-500">Configure trading parameters</p>
          </div>
        </div>
          </Link>
        </div>
      </main>

      {/* Trading Modal */}
      <TradingModal
        isOpen={showTradingModal}
        onClose={() => setShowTradingModal(false)}
        mode={tradingMode}
        selectedItem={selectedItem}
      />
    </div>
  );
};

export default Dashboard; 