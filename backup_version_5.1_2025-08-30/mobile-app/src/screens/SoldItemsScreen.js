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

const SoldItemsScreen = ({ navigation }) => {
  const { soldItems, loading, fetchSoldItems } = useETFTrading();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSoldItems();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSoldItems();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateTotalProfit = () => {
    if (!soldItems || soldItems.length === 0) return 0;
    return soldItems.reduce((total, item) => total + (item.profit || 0), 0);
  };

  const calculateTotalInvested = () => {
    if (!soldItems || soldItems.length === 0) return 0;
    return soldItems.reduce((total, item) => total + (item.investedAmount || 0), 0);
  };

  const totalProfit = calculateTotalProfit();
  const totalInvested = calculateTotalInvested();
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleItemPress = (item) => {
    Alert.alert(
      'Sold Item Details',
      `${item.name} (${item.symbol})\n\n` +
      `Buy Price: ₹${item.buyPrice?.toFixed(2) || '0.00'}\n` +
      `Sell Price: ₹${item.sellPrice?.toFixed(2) || '0.00'}\n` +
      `Quantity: ${item.quantity || 0}\n` +
      `Profit: ₹${item.profit?.toLocaleString() || '0'}\n` +
      `Sold Date: ${formatDate(item.soldDate || new Date())}`
    );
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
            <Text style={styles.title}>Sold Items</Text>
            <Text style={styles.subtitle}>Your trading history</Text>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Trading Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Invested</Text>
                <Text style={styles.summaryValue}>
                  ₹{totalInvested.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Profit</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: totalProfit >= 0 ? '#10b981' : '#ef4444' }
                ]}>
                  ₹{totalProfit.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Profit %</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: profitPercentage >= 0 ? '#10b981' : '#ef4444' }
                ]}>
                  {profitPercentage.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Trades</Text>
                <Text style={styles.summaryValue}>{soldItems?.length || 0}</Text>
              </View>
            </View>
          </View>

          {/* Sold Items List */}
          <View style={styles.itemsContainer}>
            <Text style={styles.sectionTitle}>Sold Items</Text>
            {soldItems && soldItems.length > 0 ? (
              soldItems.map((item, index) => {
                const isProfit = (item.profit || 0) >= 0;
                const profitPercent = item.buyPrice > 0 ? 
                  ((item.sellPrice - item.buyPrice) / item.buyPrice) * 100 : 0;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.itemCard}
                    onPress={() => handleItemPress(item)}
                  >
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemSymbol}>{item.symbol}</Text>
                        <Text style={styles.itemName}>{item.name}</Text>
                      </View>
                      <View style={styles.itemProfit}>
                        <Text style={[
                          styles.profitAmount,
                          { color: isProfit ? '#10b981' : '#ef4444' }
                        ]}>
                          ₹{item.profit?.toLocaleString() || '0'}
                        </Text>
                        <Text style={[
                          styles.profitPercent,
                          { color: isProfit ? '#10b981' : '#ef4444' }
                        ]}>
                          {isProfit ? '↗' : '↘'} {profitPercent.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.itemDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Buy Price:</Text>
                        <Text style={styles.detailValue}>
                          ₹{item.buyPrice?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Sell Price:</Text>
                        <Text style={styles.detailValue}>
                          ₹{item.sellPrice?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Quantity:</Text>
                        <Text style={styles.detailValue}>{item.quantity || 0}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Sold Date:</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(item.soldDate || new Date())}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💰</Text>
                <Text style={styles.emptyTitle}>No Sold Items Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Your sold ETF holdings will appear here once you start trading
                </Text>
              </View>
            )}
          </View>

          {/* Performance Chart Placeholder */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Performance Over Time</Text>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>📈</Text>
              <Text style={styles.chartPlaceholderSubtext}>
                Performance chart will be available soon
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
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  itemsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  itemName: {
    fontSize: 14,
    color: '#9ca3af',
  },
  itemProfit: {
    alignItems: 'flex-end',
  },
  profitAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profitPercent: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
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

export default SoldItemsScreen;
