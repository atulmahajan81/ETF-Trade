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

const ETFRankingScreen = ({ navigation }) => {
  const { etfs, loading, fetchETFs, updatePrices } = useETFTrading();
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('rank'); // 'rank', 'name', 'price', 'change'

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

  const handleETFPress = (etf) => {
    Alert.alert(
      'ETF Details',
      `${etf.name} (${etf.symbol})\n\n` +
      `Current Price: ₹${etf.currentPrice?.toFixed(2) || '0.00'}\n` +
      `Change: ${etf.changePercent?.toFixed(2) || '0.00'}%\n` +
      `Volume: ${etf.volume?.toLocaleString() || '0'}\n` +
      `Market Cap: ₹${etf.marketCap?.toLocaleString() || '0'}`
    );
  };

  const handleBuyPress = (etf) => {
    Alert.alert(
      'Buy ETF',
      `Buy ${etf.name} at ₹${etf.currentPrice}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy', onPress: () => console.log('Buy order placed') }
      ]
    );
  };

  const getSortedETFs = () => {
    if (!etfs || etfs.length === 0) return [];
    
    const sortedETFs = [...etfs];
    
    switch (sortBy) {
      case 'name':
        return sortedETFs.sort((a, b) => a.name.localeCompare(b.name));
      case 'price':
        return sortedETFs.sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
      case 'change':
        return sortedETFs.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
      case 'rank':
      default:
        return sortedETFs.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    }
  };

  const sortedETFs = getSortedETFs();

  const getSortButtonStyle = (type) => {
    return [
      styles.sortButton,
      sortBy === type && styles.sortButtonActive
    ];
  };

  const getSortButtonTextStyle = (type) => {
    return [
      styles.sortButtonText,
      sortBy === type && styles.sortButtonTextActive
    ];
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
            <Text style={styles.title}>ETF Rankings</Text>
            <Text style={styles.subtitle}>Top performing ETFs</Text>
          </View>

          {/* Market Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Market Overview</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total ETFs</Text>
                <Text style={styles.summaryValue}>{etfs?.length || 0}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Gainers</Text>
                <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                  {etfs?.filter(etf => (etf.changePercent || 0) > 0).length || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Losers</Text>
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                  {etfs?.filter(etf => (etf.changePercent || 0) < 0).length || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Unchanged</Text>
                <Text style={styles.summaryValue}>
                  {etfs?.filter(etf => (etf.changePercent || 0) === 0).length || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={getSortButtonStyle('rank')}
                onPress={() => setSortBy('rank')}
              >
                <Text style={getSortButtonTextStyle('rank')}>Rank</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={getSortButtonStyle('name')}
                onPress={() => setSortBy('name')}
              >
                <Text style={getSortButtonTextStyle('name')}>Name</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={getSortButtonStyle('price')}
                onPress={() => setSortBy('price')}
              >
                <Text style={getSortButtonTextStyle('price')}>Price</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={getSortButtonStyle('change')}
                onPress={() => setSortBy('change')}
              >
                <Text style={getSortButtonTextStyle('change')}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ETF Rankings List */}
          <View style={styles.rankingsContainer}>
            <Text style={styles.sectionTitle}>ETF Rankings</Text>
            {sortedETFs.length > 0 ? (
              sortedETFs.map((etf, index) => {
                const isGainer = (etf.changePercent || 0) > 0;
                const isLoser = (etf.changePercent || 0) < 0;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.etfCard}
                    onPress={() => handleETFPress(etf)}
                  >
                    <View style={styles.etfHeader}>
                      <View style={styles.etfInfo}>
                        <View style={styles.rankContainer}>
                          <Text style={styles.rankText}>#{etf.rank || index + 1}</Text>
                        </View>
                        <View style={styles.etfDetails}>
                          <Text style={styles.etfSymbol}>{etf.symbol}</Text>
                          <Text style={styles.etfName}>{etf.name}</Text>
                        </View>
                      </View>
                      <View style={styles.etfPrice}>
                        <Text style={styles.currentPrice}>
                          ₹{etf.currentPrice?.toFixed(2) || '0.00'}
                        </Text>
                        <Text style={[
                          styles.changeText,
                          { color: isGainer ? '#10b981' : isLoser ? '#ef4444' : '#9ca3af' }
                        ]}>
                          {isGainer ? '↗' : isLoser ? '↘' : '→'} {etf.changePercent?.toFixed(2) || '0.00'}%
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.etfDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Volume:</Text>
                        <Text style={styles.detailValue}>
                          {etf.volume?.toLocaleString() || '0'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Market Cap:</Text>
                        <Text style={styles.detailValue}>
                          ₹{etf.marketCap?.toLocaleString() || '0'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>52W High:</Text>
                        <Text style={styles.detailValue}>
                          ₹{etf.high52Week?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>52W Low:</Text>
                        <Text style={styles.detailValue}>
                          ₹{etf.low52Week?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.etfActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleBuyPress(etf)}
                      >
                        <Text style={styles.actionButtonText}>Buy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleETFPress(etf)}
                      >
                        <Text style={styles.actionButtonText}>Details</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyTitle}>No ETFs Available</Text>
                <Text style={styles.emptySubtitle}>
                  ETF rankings will appear here once data is loaded
                </Text>
              </View>
            )}
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
  sortContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sortButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },
  rankingsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  etfCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  etfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  etfInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankContainer: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  etfDetails: {
    flex: 1,
  },
  etfSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  etfName: {
    fontSize: 14,
    color: '#9ca3af',
  },
  etfPrice: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  etfDetails: {
    gap: 4,
    marginBottom: 12,
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
  etfActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  actionButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
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
});

export default ETFRankingScreen;
