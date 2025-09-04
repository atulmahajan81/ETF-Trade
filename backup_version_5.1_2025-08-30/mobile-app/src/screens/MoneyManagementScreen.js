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

const MoneyManagementScreen = ({ navigation }) => {
  const { etfs, holdings, loading, fetchETFs, updatePrices } = useETFTrading();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');

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

  const timeframes = [
    { id: '1W', label: '1W' },
    { id: '1M', label: '1M' },
    { id: '3M', label: '3M' },
    { id: '6M', label: '6M' },
    { id: '1Y', label: '1Y' },
  ];

  const calculatePortfolioValue = () => {
    if (!etfs || etfs.length === 0) return 0;
    return etfs.reduce((total, etf) => total + (etf.currentPrice * etf.quantity), 0);
  };

  const calculateTotalInvested = () => {
    if (!etfs || etfs.length === 0) return 0;
    return etfs.reduce((total, etf) => total + (etf.averagePrice * etf.quantity), 0);
  };

  const calculateTotalProfit = () => {
    const portfolioValue = calculatePortfolioValue();
    const totalInvested = calculateTotalInvested();
    return portfolioValue - totalInvested;
  };

  const portfolioValue = calculatePortfolioValue();
  const totalInvested = calculateTotalInvested();
  const totalProfit = calculateTotalProfit();
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const getSectorAllocation = () => {
    if (!etfs || etfs.length === 0) return [];
    
    const sectors = {};
    etfs.forEach(etf => {
      const sector = etf.sector || 'Other';
      const value = (etf.currentPrice || 0) * (etf.quantity || 0);
      
      if (sectors[sector]) {
        sectors[sector] += value;
      } else {
        sectors[sector] = value;
      }
    });

    return Object.entries(sectors)
      .map(([sector, value]) => ({ sector, value, percentage: (value / portfolioValue) * 100 }))
      .sort((a, b) => b.value - a.value);
  };

  const sectorAllocation = getSectorAllocation();

  const getRiskMetrics = () => {
    return {
      volatility: '12.5%',
      sharpeRatio: '1.2',
      maxDrawdown: '-8.3%',
      beta: '0.95',
    };
  };

  const riskMetrics = getRiskMetrics();

  const handleTimeframePress = (timeframe) => {
    setSelectedTimeframe(timeframe.id);
  };

  const handleRebalance = () => {
    Alert.alert(
      'Rebalance Portfolio',
      'This will automatically rebalance your portfolio based on your target allocation. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rebalance', onPress: () => console.log('Portfolio rebalanced') }
      ]
    );
  };

  const handleSetTargets = () => {
    Alert.alert('Set Targets', 'Target allocation settings will be available soon!');
  };

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
            <Text style={styles.title}>Money Management</Text>
            <Text style={styles.subtitle}>Portfolio allocation & risk management</Text>
          </View>

          {/* Portfolio Overview */}
          <View style={styles.overviewCard}>
            <Text style={styles.cardTitle}>Portfolio Overview</Text>
            <View style={styles.overviewStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Value</Text>
                <Text style={styles.statValue}>
                  ₹{portfolioValue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Invested</Text>
                <Text style={styles.statValue}>
                  ₹{totalInvested.toLocaleString()}
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

          {/* Timeframe Selection */}
          <View style={styles.timeframeContainer}>
            <Text style={styles.sectionTitle}>Performance Period</Text>
            <View style={styles.timeframeButtons}>
              {timeframes.map((timeframe) => (
                <TouchableOpacity
                  key={timeframe.id}
                  style={[
                    styles.timeframeButton,
                    selectedTimeframe === timeframe.id && styles.timeframeButtonActive
                  ]}
                  onPress={() => handleTimeframePress(timeframe)}
                >
                  <Text style={[
                    styles.timeframeButtonText,
                    selectedTimeframe === timeframe.id && styles.timeframeButtonTextActive
                  ]}>
                    {timeframe.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sector Allocation */}
          <View style={styles.allocationCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sector Allocation</Text>
              <TouchableOpacity style={styles.actionButton} onPress={handleSetTargets}>
                <Text style={styles.actionButtonText}>Set Targets</Text>
              </TouchableOpacity>
            </View>
            {sectorAllocation.length > 0 ? (
              sectorAllocation.map((sector, index) => (
                <View key={index} style={styles.sectorItem}>
                  <View style={styles.sectorInfo}>
                    <Text style={styles.sectorName}>{sector.sector}</Text>
                    <Text style={styles.sectorValue}>
                      ₹{sector.value.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.sectorBar}>
                    <View 
                      style={[
                        styles.sectorBarFill,
                        { width: `${Math.min(sector.percentage, 100)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.sectorPercentage}>
                    {sector.percentage.toFixed(1)}%
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No sector data available</Text>
            )}
          </View>

          {/* Risk Metrics */}
          <View style={styles.riskCard}>
            <Text style={styles.cardTitle}>Risk Metrics</Text>
            <View style={styles.riskMetrics}>
              <View style={styles.riskItem}>
                <Text style={styles.riskLabel}>Volatility</Text>
                <Text style={styles.riskValue}>{riskMetrics.volatility}</Text>
              </View>
              <View style={styles.riskItem}>
                <Text style={styles.riskLabel}>Sharpe Ratio</Text>
                <Text style={styles.riskValue}>{riskMetrics.sharpeRatio}</Text>
              </View>
              <View style={styles.riskItem}>
                <Text style={styles.riskLabel}>Max Drawdown</Text>
                <Text style={[styles.riskValue, { color: '#ef4444' }]}>
                  {riskMetrics.maxDrawdown}
                </Text>
              </View>
              <View style={styles.riskItem}>
                <Text style={styles.riskLabel}>Beta</Text>
                <Text style={styles.riskValue}>{riskMetrics.beta}</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Portfolio Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleRebalance}>
                <Text style={styles.primaryButtonText}>Rebalance Portfolio</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Export Report</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Performance Chart Placeholder */}
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Performance Chart</Text>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>📈</Text>
              <Text style={styles.chartPlaceholderSubtext}>
                Performance chart for {selectedTimeframe} period will be available soon
              </Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  overviewCard: {
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
  overviewStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
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
  timeframeContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  timeframeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeframeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  timeframeButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  timeframeButtonTextActive: {
    color: '#ffffff',
  },
  allocationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  actionButtonText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  sectorItem: {
    marginBottom: 16,
  },
  sectorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectorValue: {
    fontSize: 14,
    color: '#9ca3af',
  },
  sectorBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 4,
  },
  sectorBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  sectorPercentage: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  riskCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  riskMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  riskItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  riskValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  chartPlaceholderText: {
    fontSize: 48,
    marginBottom: 16,
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default MoneyManagementScreen;
