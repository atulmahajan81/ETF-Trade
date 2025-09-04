import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useETFTrading } from '../context/ETFTradingContext';

const HoldingsScreen = ({ navigation }) => {
  const { etfs, loading, fetchETFs, updatePrices } = useETFTrading();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedETF, setSelectedETF] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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
    setSelectedETF(etf);
    setShowDetails(true);
  };

  const handleAddHolding = () => {
    Alert.alert('Add Holding', 'This feature will be available soon!');
  };

  const handleEditHolding = (etf) => {
    Alert.alert('Edit Holding', `Edit ${etf.name}? This feature will be available soon!`);
  };

  const handleSellHolding = (etf) => {
    Alert.alert(
      'Sell Holding',
      `Sell ${etf.name} at ₹${etf.currentPrice}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sell', onPress: () => console.log('Sell order placed') }
      ]
    );
  };

  const calculateTotalValue = () => {
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

  const totalValue = calculateTotalValue();
  const totalProfit = calculateTotalProfit();
  const profitPercentage = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

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
            <Text style={styles.title}>My Holdings</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddHolding}>
              <Text style={styles.addButtonText}>➕ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Portfolio Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Value</Text>
                <Text style={styles.summaryValue}>
                  ₹{totalValue.toLocaleString()}
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
            </View>
            <View style={styles.summaryRow}>
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
                <Text style={styles.summaryLabel}>Holdings</Text>
                <Text style={styles.summaryValue}>{etfs?.length || 0}</Text>
              </View>
            </View>
          </View>

          {/* Holdings List */}
          <View style={styles.holdingsContainer}>
            <Text style={styles.sectionTitle}>Your Holdings</Text>
            {etfs && etfs.length > 0 ? (
              etfs.map((etf, index) => {
                const profit = (etf.currentPrice - etf.averagePrice) * etf.quantity;
                const profitPercent = etf.averagePrice > 0 ? 
                  ((etf.currentPrice - etf.averagePrice) / etf.averagePrice) * 100 : 0;
                const isProfit = profit >= 0;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.holdingCard}
                    onPress={() => handleETFPress(etf)}
                  >
                    <View style={styles.holdingHeader}>
                      <View style={styles.holdingInfo}>
                        <Text style={styles.holdingSymbol}>{etf.symbol}</Text>
                        <Text style={styles.holdingName}>{etf.name}</Text>
                      </View>
                      <View style={styles.holdingPrice}>
                        <Text style={styles.currentPrice}>
                          ₹{etf.currentPrice?.toFixed(2) || '0.00'}
                        </Text>
                        <Text style={[
                          styles.priceChange,
                          { color: isProfit ? '#10b981' : '#ef4444' }
                        ]}>
                          {isProfit ? '↗' : '↘'} {profitPercent.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.holdingDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Quantity:</Text>
                        <Text style={styles.detailValue}>{etf.quantity || 0}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Avg Price:</Text>
                        <Text style={styles.detailValue}>
                          ₹{etf.averagePrice?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Value:</Text>
                        <Text style={styles.detailValue}>
                          ₹{((etf.currentPrice || 0) * (etf.quantity || 0)).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Profit:</Text>
                        <Text style={[
                          styles.detailValue,
                          { color: isProfit ? '#10b981' : '#ef4444' }
                        ]}>
                          ₹{profit.toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.holdingActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditHolding(etf)}
                      >
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.sellButton]}
                        onPress={() => handleSellHolding(etf)}
                      >
                        <Text style={styles.sellButtonText}>Sell</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyTitle}>No Holdings Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start building your ETF portfolio by adding your first holding
                </Text>
                <TouchableOpacity style={styles.emptyButton} onPress={handleAddHolding}>
                  <Text style={styles.emptyButtonText}>Add Your First Holding</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* ETF Details Modal */}
        <Modal
          visible={showDetails}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDetails(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedETF && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedETF.name}</Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setShowDetails(false)}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.modalBody}>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Basic Info</Text>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailItemLabel}>Symbol:</Text>
                        <Text style={styles.detailItemValue}>{selectedETF.symbol}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailItemLabel}>Current Price:</Text>
                        <Text style={styles.detailItemValue}>
                          ₹{selectedETF.currentPrice?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailItemLabel}>Quantity:</Text>
                        <Text style={styles.detailItemValue}>{selectedETF.quantity || 0}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailItemLabel}>Average Price:</Text>
                        <Text style={styles.detailItemValue}>
                          ₹{selectedETF.averagePrice?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Performance</Text>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailItemLabel}>Total Value:</Text>
                        <Text style={styles.detailItemValue}>
                          ₹{((selectedETF.currentPrice || 0) * (selectedETF.quantity || 0)).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailItemLabel}>Total Profit:</Text>
                        <Text style={[
                          styles.detailItemValue,
                          { color: ((selectedETF.currentPrice || 0) - (selectedETF.averagePrice || 0)) >= 0 ? '#10b981' : '#ef4444' }
                        ]}>
                          ₹{((selectedETF.currentPrice || 0) - (selectedETF.averagePrice || 0)) * (selectedETF.quantity || 0)}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        setShowDetails(false);
                        handleEditHolding(selectedETF);
                      }}
                    >
                      <Text style={styles.modalButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalSellButton]}
                      onPress={() => {
                        setShowDetails(false);
                        handleSellHolding(selectedETF);
                      }}
                    >
                      <Text style={styles.modalSellButtonText}>Sell</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
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
  holdingsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  holdingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  holdingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  holdingInfo: {
    flex: 1,
  },
  holdingSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  holdingName: {
    fontSize: 14,
    color: '#9ca3af',
  },
  holdingPrice: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  priceChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  holdingDetails: {
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
  holdingActions: {
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
  sellButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  sellButtonText: {
    color: '#ef4444',
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
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#9ca3af',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItemLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  detailItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  modalButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalSellButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  modalSellButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },
});

export default HoldingsScreen;
