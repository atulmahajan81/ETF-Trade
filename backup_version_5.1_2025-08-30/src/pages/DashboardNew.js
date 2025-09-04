import React, { useMemo, useEffect, useState } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Target, 
  Calculator, 
  Upload, 
  Play, 
  Database, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  ArrowRightCircle, 
  Clock, 
  RefreshCw, 
  Trash2, 
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Settings,
  LogOut,
  Plus,
  Minus,
  Eye,
  EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import mstocksApiService from '../services/mstocksApi';
import TradingModal from '../components/TradingModal';

const Dashboard = () => {
  const { 
    holdings, 
    soldItems,
    etfs,
    totalInvested, 
    totalProfit, 
    targetProfit,
    userSetup,
    moneyManagement,
    userLogout,
    dispatch,
    actionTypes,
    averagingThreshold,
    isTradingEnabled,
    tradingStatus,
    tradingMessage,
    pendingOrders,
    orderHistory,
    checkOrderStatus,
    cancelOrder
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
    if (pendingOrders && pendingOrders.length > 0) {
      for (const order of pendingOrders) {
        await checkOrderStatus(order.orderId);
      }
    }
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
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning-600" />
            <div>
              <h3 className="text-sm font-medium text-warning-800">Trading Disabled</h3>
              <p className="text-sm text-warning-700 mt-1">{tradingMessage}</p>
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-neutral-900">ETF Trading Pro</h1>
              </div>
              {isDemoMode && (
                <span className="badge badge-warning">
                  <Play className="h-3 w-3 mr-1" />
                  Demo Mode
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-neutral-500" />
                <span className="text-sm font-medium text-neutral-700">
                  {userSetup?.userData?.name || 'User'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                
                <div className="text-right">
                  <div className="text-xs text-neutral-500">Available Capital</div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {showBalance ? formatCurrency(moneyManagement?.availableCapital || 0) : '••••••'}
                  </div>
                </div>
              </div>
              
              <div className="h-6 w-px bg-neutral-300"></div>
              
              <Link to="/profile" className="p-2 text-neutral-500 hover:text-neutral-700 transition-colors">
                <Settings className="h-4 w-4" />
              </Link>
              
              <button
                onClick={userLogout}
                className="p-2 text-neutral-500 hover:text-error-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <StatusBanner />

        {/* Demo Mode Controls */}
        <div className="mb-6">
          {!isDemoMode ? (
            <button
              onClick={enableDemoMode}
              className="btn btn-secondary"
            >
              <Play className="h-4 w-4 mr-2" />
              Enable Demo Mode
            </button>
          ) : (
            <button
              onClick={disableDemoMode}
              className="btn btn-danger"
            >
              <Square className="h-4 w-4 mr-2" />
              Disable Demo Mode
            </button>
          )}
          
          <button
            onClick={clearAllStorage}
            className="btn btn-outline ml-3"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Data
          </button>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Total Invested</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {formatCurrency(totalInvested)}
                  </p>
                </div>
                <div className="p-3 bg-primary-50 rounded-lg">
                  <Package className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Total Profit</p>
                  <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                    {formatCurrency(totalProfit)}
                  </p>
                </div>
                <div className="p-3 bg-success-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Available Capital</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {formatCurrency(moneyManagement?.availableCapital || 0)}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-neutral-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Next Buy Amount</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {formatCurrency(moneyManagement?.nextBuyAmount || 0)}
                  </p>
                </div>
                <div className="p-3 bg-warning-50 rounded-lg">
                  <Target className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Money Management */}
        <div className="card mb-8">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-neutral-900">Money Management</h2>
              </div>
              <Link to="/money-management" className="btn btn-outline btn-sm">
                <ArrowRightCircle className="h-4 w-4 mr-1" />
                View Details
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {formatCurrency(moneyManagement?.availableCapital || 0)}
                </div>
                <div className="text-sm text-neutral-500">Available Capital</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-warning-600 mb-2">
                  {formatCurrency(moneyManagement?.nextBuyAmount || 0)}
                </div>
                <div className="text-sm text-neutral-500">Next Buy Amount</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-success-600 mb-2">
                  {formatPercentage(moneyManagement?.compoundingEffect || 0)}
                </div>
                <div className="text-sm text-neutral-500">Compounding Effect</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Best Buy Card */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5 text-success-600" />
                <h3 className="text-lg font-semibold text-neutral-900">Best Buy Opportunity</h3>
              </div>
            </div>
            <div className="card-body">
              {bestBuy ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-neutral-900">{bestBuy.symbol}</h4>
                      <p className="text-sm text-neutral-500">{bestBuy.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-neutral-900">
                        ₹{bestBuy.cmp?.toFixed(2)}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {formatPercentage(bestBuy.percentDiff)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <span>20 DMA: ₹{bestBuy.dma20?.toFixed(2)}</span>
                    <span>•</span>
                    <span>Sector: {bestBuy.sector}</span>
                  </div>
                  
                  <button
                    onClick={handlePlaceBestBuy}
                    disabled={isPlacing}
                    className="btn btn-success w-full"
                  >
                    {isPlacing ? (
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Buy {bestBuy.symbol}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500">No buy opportunities available</p>
                </div>
              )}
            </div>
          </div>

          {/* Best Sell Card */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <Minus className="h-5 w-5 text-error-600" />
                <h3 className="text-lg font-semibold text-neutral-900">Best Sell Opportunity</h3>
              </div>
            </div>
            <div className="card-body">
              {bestSell ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-neutral-900">{bestSell.symbol}</h4>
                      <p className="text-sm text-neutral-500">{bestSell.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-neutral-900">
                        ₹{bestSell.currentPrice?.toFixed(2)}
                      </div>
                      <div className="text-sm text-success-600">
                        {formatPercentage(bestSell.profitPercent)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <span>Qty: {bestSell.quantity}</span>
                    <span>•</span>
                    <span>Avg: ₹{bestSell.avgPrice?.toFixed(2)}</span>
                    <span>•</span>
                    <span>Profit: {formatCurrency(bestSell.absoluteProfit)}</span>
                  </div>
                  
                  <button
                    onClick={handlePlaceBestSell}
                    disabled={isPlacing}
                    className="btn btn-danger w-full"
                  >
                    {isPlacing ? (
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Minus className="h-4 w-4 mr-2" />
                    )}
                    Sell {bestSell.symbol}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500">No sell opportunities available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Orders Overview */}
        <div className="card mb-8">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-neutral-900">Orders Overview</h3>
              </div>
              <button
                onClick={handleRefreshOrders}
                className="btn btn-outline btn-sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Orders */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning-600" />
                  Pending Orders ({pendingOrders?.length || 0})
                </h4>
                {pendingOrders && pendingOrders.length > 0 ? (
                  <div className="space-y-3">
                    {pendingOrders.map((order, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div>
                          <div className="font-medium text-neutral-900">{order.symbol}</div>
                          <div className="text-sm text-neutral-500">
                            {order.quantity} @ ₹{order.price}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${order.type === 'BUY' ? 'badge-success' : 'badge-error'}`}>
                            {order.type}
                          </span>
                          <button
                            onClick={() => cancelOrder(order.orderId)}
                            className="p-1 text-error-600 hover:text-error-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-neutral-500">No pending orders</p>
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
                      <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div>
                          <div className="font-medium text-neutral-900">{order.symbol}</div>
                          <div className="text-sm text-neutral-500">
                            {order.quantity} @ ₹{order.price}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`badge ${order.type === 'BUY' ? 'badge-success' : 'badge-error'}`}>
                            {order.type}
                          </span>
                          <div className="text-xs text-neutral-500 mt-1">
                            {new Date(order.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-neutral-500">No recent orders</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/etf-ranking" className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <BarChart3 className="h-8 w-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-900 mb-1">ETF Ranking</h3>
              <p className="text-sm text-neutral-500">View and analyze ETF opportunities</p>
            </div>
          </Link>

          <Link to="/holdings" className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <Package className="h-8 w-8 text-success-600 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-900 mb-1">Holdings</h3>
              <p className="text-sm text-neutral-500">Manage your current positions</p>
            </div>
          </Link>

          <Link to="/sold-items" className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <TrendingUp className="h-8 w-8 text-warning-600 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-900 mb-1">Sold Items</h3>
              <p className="text-sm text-neutral-500">Track your trading history</p>
            </div>
          </Link>

          <Link to="/strategy" className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <Target className="h-8 w-8 text-error-600 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-900 mb-1">Strategy</h3>
              <p className="text-sm text-neutral-500">Configure trading parameters</p>
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
