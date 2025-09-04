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

const StrategyScreen = ({ navigation }) => {
  const { etfs, holdings, loading, fetchETFs, updatePrices } = useETFTrading();
  const [refreshing, setRefreshing] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState('momentum');

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

  const strategies = [
    {
      id: 'momentum',
      name: 'Momentum Strategy',
      description: 'Buy ETFs that are trending upward with strong momentum',
      icon: '📈',
      color: '#10b981',
    },
    {
      id: 'value',
      name: 'Value Strategy',
      description: 'Buy ETFs that are undervalued relative to their fundamentals',
      icon: '💰',
      color: '#3b82f6',
    },
    {
      id: 'contrarian',
      name: 'Contrarian Strategy',
      description: 'Buy ETFs that have fallen but show potential for recovery',
      icon: '🔄',
      color: '#f59e0b',
    },
    {
      id: 'diversification',
      name: 'Diversification Strategy',
      description: 'Spread investments across different sectors and asset classes',
      icon: '🎯',
      color: '#8b5cf6',
    },
  ];

  const getRecommendations = () => {
    if (!etfs || etfs.length === 0) return [];

    switch (activeStrategy) {
      case 'momentum':
        return etfs
          .filter(etf => (etf.changePercent || 0) > 2)
          .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
          .slice(0, 5);
      
      case 'value':
        return etfs
          .filter(etf => (etf.changePercent || 0) < -5)
          .sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))
          .slice(0, 5);
      
      case 'contrarian':
        return etfs
          .filter(etf => (etf.changePercent || 0) < -10)
          .sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))
          .slice(0, 5);
      
      case 'diversification':
        // Simple diversification based on different sectors
        const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer'];
        return sectors.map(sector => {
          const sectorETF = etfs.find(etf => 
            etf.name?.toLowerCase().includes(sector.toLowerCase())
          );
          return sectorETF || etfs[0];
        }).filter(Boolean).slice(0, 5);
      
      default:
        return etfs.slice(0, 5);
    }
  };

  const recommendations = getRecommendations();

  const handleStrategyPress = (strategy) => {
    setActiveStrategy(strategy.id);
  };

  const handleBuyRecommendation = (etf) => {
    Alert.alert(
      'Buy Recommendation',
      `Buy ${etf.name} based on ${strategies.find(s => s.id === activeStrategy)?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy', onPress: () => console.log('Buy order placed') }
      ]
    );
  };

  const handleStrategyDetails = (strategy) => {
    Alert.alert(
      strategy.name,
      strategy.description + '\n\nThis strategy will be implemented soon with advanced algorithms and real-time market data.',
      [{ text: 'OK' }]
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
            <Text style={styles.title}>Trading Strategies</Text>
            <Text style={styles.subtitle}>AI-powered recommendations</Text>
          </View>

          {/* Strategy Selection */}
          <View style={styles.strategiesContainer}>
            <Text style={styles.sectionTitle}>Choose Strategy</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {strategies.map((strategy) => (
                <TouchableOpacity
                  key={strategy.id}
                  style={[
                    styles.strategyCard,
                    activeStrategy === strategy.id && styles.strategyCardActive,
                    { borderColor: strategy.color }
                  ]}
                  onPress={() => handleStrategyPress(strategy)}
                >
                  <Text style={styles.strategyIcon}>{strategy.icon}</Text>
                  <Text style={[
                    styles.strategyName,
                    activeStrategy === strategy.id && styles.strategyNameActive
                  ]}>
                    {strategy.name}
                  </Text>
                  <Text style={styles.strategyDescription}>
                    {strategy.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Active Strategy Info */}
          <View style={styles.activeStrategyCard}>
            <Text style={styles.activeStrategyTitle}>
              {strategies.find(s => s.id === activeStrategy)?.name}
            </Text>
            <Text style={styles.activeStrategyDescription}>
              {strategies.find(s => s.id === activeStrategy)?.description}
            </Text>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => handleStrategyDetails(strategies.find(s => s.id === activeStrategy))}
            >
              <Text style={styles.detailsButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>

          {/* Recommendations */}
          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>Top Recommendations</Text>
            {recommendations.length > 0 ? (
              recommendations.map((etf, index) => {
                const isGainer = (etf.changePercent || 0) > 0;
                const isLoser = (etf.changePercent || 0) < 0;

                return (
                  <View key={index} style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                      <View style={styles.recommendationInfo}>
                        <Text style={styles.recommendationSymbol}>{etf.symbol}</Text>
                        <Text style={styles.recommendationName}>{etf.name}</Text>
                      </View>
                      <View style={styles.recommendationPrice}>
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
                    
                    <View style={styles.recommendationDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Signal:</Text>
                        <Text style={[
                          styles.detailValue,
                          { color: strategies.find(s => s.id === activeStrategy)?.color }
                        ]}>
                          {activeStrategy === 'momentum' ? 'Strong Buy' :
                           activeStrategy === 'value' ? 'Value Buy' :
                           activeStrategy === 'contrarian' ? 'Recovery Buy' :
                           'Diversify'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Confidence:</Text>
                        <Text style={styles.detailValue}>
                          {Math.floor(Math.random() * 30) + 70}%
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.buyButton,
                        { backgroundColor: strategies.find(s => s.id === activeStrategy)?.color }
                      ]}
                      onPress={() => handleBuyRecommendation(etf)}
                    >
                      <Text style={styles.buyButtonText}>Buy Now</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyTitle}>No Recommendations</Text>
                <Text style={styles.emptySubtitle}>
                  No ETFs match the current strategy criteria
                </Text>
              </View>
            )}
          </View>

          {/* Strategy Performance */}
          <View style={styles.performanceCard}>
            <Text style={styles.sectionTitle}>Strategy Performance</Text>
            <View style={styles.performanceStats}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Success Rate</Text>
                <Text style={styles.performanceValue}>78%</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Avg Return</Text>
                <Text style={[styles.performanceValue, { color: '#10b981' }]}>+12.5%</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Risk Level</Text>
                <Text style={styles.performanceValue}>Medium</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Hold Period</Text>
                <Text style={styles.performanceValue}>3-6 months</Text>
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
  strategiesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  strategyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 200,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  strategyCardActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  strategyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  strategyNameActive: {
    color: '#3b82f6',
  },
  strategyDescription: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
  activeStrategyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeStrategyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  activeStrategyDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailsButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  detailsButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  recommendationsContainer: {
    padding: 16,
  },
  recommendationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  recommendationName: {
    fontSize: 14,
    color: '#9ca3af',
  },
  recommendationPrice: {
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
  recommendationDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
  buyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
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
  performanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  performanceStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default StrategyScreen;
