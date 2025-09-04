import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useETFTrading } from '../context/ETFTradingContext';

const DashboardScreen = ({ navigation }) => {
  const { auth, etfs, loading, fetchETFs, updatePrices } = useETFTrading();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchETFs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchETFs(), updatePrices()]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'addHolding':
        navigation.navigate('Holdings');
        break;
      case 'viewRankings':
        navigation.navigate('ETFRanking');
        break;
      case 'checkSold':
        navigation.navigate('SoldItems');
        break;
      case 'strategy':
        navigation.navigate('Strategy');
        break;
      default:
        Alert.alert('Coming Soon', 'This feature will be available soon!');
    }
  };

  const calculatePortfolioValue = () => {
    if (!etfs || etfs.length === 0) return 0;
    return etfs.reduce((total, etf) => total + (etf.currentPrice * etf.quantity), 0);
  };

  const calculateTotalProfit = () => {
    if (!etfs || etfs.length === 0) return 0;
    return etfs.reduce((total, etf) => {
      const profit = (etf.currentPrice - etf.averagePrice) * etf.quantity;
      return total + profit;
    }, 0);
  };

  const portfolioValue = calculatePortfolioValue();
  const totalProfit = calculateTotalProfit();
  const profitPercentage = portfolioValue > 0 ? (totalProfit / portfolioValue) * 100 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>
              Welcome back, {auth.currentUser?.username || 'User'}!
            </Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Portfolio Overview Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Portfolio Overview</Text>
            <View style={styles.portfolioStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Value</Text>
                <Text style={styles.statValue}>
                  ₹{portfolioValue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Profit</Text>
                <Text style={[
                  styles.statValue,
                  { color: totalProfit >= 0 ? '#10b981' : '#ef4444' }
                ]}>
                  ₹{totalProfit.toLocaleString()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Profit %</Text>
                <Text style={[
                  styles.statValue,
                  { color: profitPercentage >= 0 ? '#10b981' : '#ef4444' }
                ]}>
                  {profitPercentage.toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('addHolding')}
              >
                <Text style={styles.actionIcon}>➕</Text>
                <Text style={styles.actionText}>Add Holding</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('viewRankings')}
              >
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionText}>View Rankings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('checkSold')}
              >
                <Text style={styles.actionIcon}>💰</Text>
                <Text style={styles.actionText}>Check Sold</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('strategy')}
              >
                <Text style={styles.actionIcon}>🎯</Text>
                <Text style={styles.actionText}>Strategy</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            {etfs && etfs.length > 0 ? (
              <View style={styles.activityList}>
                {etfs.slice(0, 3).map((etf, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activitySymbol}>{etf.symbol}</Text>
                      <Text style={styles.activityName}>{etf.name}</Text>
                    </View>
                    <View style={styles.activityPrice}>
                      <Text style={styles.currentPrice}>
                        ₹{etf.currentPrice?.toFixed(2) || '0.00'}
                      </Text>
                      <Text style={[
                        styles.priceChange,
                        { color: etf.currentPrice >= etf.averagePrice ? '#10b981' : '#ef4444' }
                      ]}>
                        {etf.currentPrice >= etf.averagePrice ? '↗' : '↘'} 
                        {((etf.currentPrice - etf.averagePrice) / etf.averagePrice * 100).toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No holdings yet. Add your first ETF!</Text>
            )}
          </View>

          {/* Market Status */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Market Status</Text>
            <View style={styles.marketStatus}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Market Open</Text>
                <Text style={styles.statusValue}>🟢 Active</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Last Updated</Text>
                <Text style={styles.statusValue}>
                  {new Date().toLocaleTimeString()}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  portfolioStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityInfo: {
    flex: 1,
  },
  activitySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  activityName: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityPrice: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  priceChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  marketStatus: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default DashboardScreen;
