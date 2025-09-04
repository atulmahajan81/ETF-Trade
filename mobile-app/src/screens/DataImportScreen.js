import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useETFTrading } from '../context/ETFTradingContext';

const DataImportScreen = ({ navigation, onImportComplete }) => {
  const { importHoldings, importSoldItems } = useETFTrading();
  const [showInstructions, setShowInstructions] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleImportHoldings = () => {
    Alert.alert(
      'Import Holdings',
      'This will import your existing ETF holdings from CSV file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Import', 
          onPress: async () => {
            setImporting(true);
            try {
              // Mock import process
              await new Promise(resolve => setTimeout(resolve, 2000));
              console.log('Holdings imported successfully');
              Alert.alert('Success', 'Holdings imported successfully!');
            } catch (error) {
              console.error('Import error:', error);
              Alert.alert('Error', 'Failed to import holdings. Please try again.');
            } finally {
              setImporting(false);
            }
          }
        }
      ]
    );
  };

  const handleImportSoldItems = () => {
    Alert.alert(
      'Import Sold Items',
      'This will import your sold ETF history from CSV file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Import', 
          onPress: async () => {
            setImporting(true);
            try {
              // Mock import process
              await new Promise(resolve => setTimeout(resolve, 2000));
              console.log('Sold items imported successfully');
              Alert.alert('Success', 'Sold items imported successfully!');
            } catch (error) {
              console.error('Import error:', error);
              Alert.alert('Error', 'Failed to import sold items. Please try again.');
            } finally {
              setImporting(false);
            }
          }
        }
      ]
    );
  };

  const handleSkipImport = () => {
    Alert.alert(
      'Skip Import',
      'Are you sure you want to skip data import? You can always import data later from the settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => {
            if (onImportComplete) {
              onImportComplete();
            }
          }
        }
      ]
    );
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Import Your Data</Text>
            <Text style={styles.subtitle}>
              Import your existing ETF holdings and trading history
            </Text>
          </View>

          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeIcon}>📊</Text>
            <Text style={styles.welcomeTitle}>Welcome to ETF Trading Pro!</Text>
            <Text style={styles.welcomeText}>
              To get started quickly, you can import your existing ETF data from CSV files. 
              This will help us provide you with accurate portfolio analysis and recommendations.
            </Text>
          </View>

          {/* Import Options */}
          <View style={styles.importContainer}>
            <Text style={styles.sectionTitle}>What would you like to import?</Text>
            
            {/* Holdings Import */}
            <TouchableOpacity
              style={styles.importCard}
              onPress={handleImportHoldings}
              disabled={importing}
            >
              <View style={styles.importCardHeader}>
                <Text style={styles.importIcon}>📈</Text>
                <View style={styles.importInfo}>
                  <Text style={styles.importTitle}>Current Holdings</Text>
                  <Text style={styles.importDescription}>
                    Import your current ETF holdings with quantities and average prices
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.importButton}
                onPress={handleImportHoldings}
                disabled={importing}
              >
                <Text style={styles.importButtonText}>
                  {importing ? 'Importing...' : 'Import Holdings'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Sold Items Import */}
            <TouchableOpacity
              style={styles.importCard}
              onPress={handleImportSoldItems}
              disabled={importing}
            >
              <View style={styles.importCardHeader}>
                <Text style={styles.importIcon}>💰</Text>
                <View style={styles.importInfo}>
                  <Text style={styles.importTitle}>Trading History</Text>
                  <Text style={styles.importDescription}>
                    Import your sold ETF history for performance analysis
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.importButton}
                onPress={handleImportSoldItems}
                disabled={importing}
              >
                <Text style={styles.importButtonText}>
                  {importing ? 'Importing...' : 'Import History'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.sectionTitle}>How to prepare your CSV files</Text>
            <TouchableOpacity style={styles.instructionsButton} onPress={handleShowInstructions}>
              <Text style={styles.instructionsButtonText}>📋 View Instructions</Text>
            </TouchableOpacity>
          </View>

          {/* Skip Option */}
          <View style={styles.skipContainer}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkipImport}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
            <Text style={styles.skipNote}>
              You can always import data later from the settings menu
            </Text>
          </View>
        </ScrollView>

        {/* Instructions Modal */}
        <Modal
          visible={showInstructions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowInstructions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>CSV Import Instructions</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowInstructions(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody}>
                <View style={styles.instructionSection}>
                  <Text style={styles.instructionTitle}>Holdings CSV Format</Text>
                  <Text style={styles.instructionText}>
                    Your holdings CSV should include these columns:
                  </Text>
                  <Text style={styles.codeText}>
                    symbol,name,quantity,average_price,current_price
                  </Text>
                  <Text style={styles.instructionText}>
                    Example:
                  </Text>
                  <Text style={styles.codeText}>
                    NIFTYBEES,NIFTY BEES,100,150.25,152.50{'\n'}
                    BANKBEES,BANK BEES,50,320.75,318.25
                  </Text>
                </View>

                <View style={styles.instructionSection}>
                  <Text style={styles.instructionTitle}>Sold Items CSV Format</Text>
                  <Text style={styles.instructionText}>
                    Your sold items CSV should include these columns:
                  </Text>
                  <Text style={styles.codeText}>
                    symbol,name,quantity,buy_price,sell_price,sold_date
                  </Text>
                  <Text style={styles.instructionText}>
                    Example:
                  </Text>
                  <Text style={styles.codeText}>
                    NIFTYBEES,NIFTY BEES,50,150.25,155.75,2024-01-15{'\n'}
                    BANKBEES,BANK BEES,25,320.75,325.50,2024-01-20
                  </Text>
                </View>

                <View style={styles.instructionSection}>
                  <Text style={styles.instructionTitle}>Important Notes</Text>
                  <Text style={styles.instructionText}>
                    • Make sure your CSV file uses commas as separators{'\n'}
                    • Dates should be in YYYY-MM-DD format{'\n'}
                    • Prices should be numbers without currency symbols{'\n'}
                    • Symbol should match the exact ETF symbol{'\n'}
                    • You can export CSV files from most trading platforms
                  </Text>
                </View>
              </ScrollView>
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
  welcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  importContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  importCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  importCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  importIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  importInfo: {
    flex: 1,
  },
  importTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  importDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 18,
  },
  importButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionsButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  instructionsButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 16,
  },
  skipContainer: {
    padding: 16,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
  },
  skipButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 16,
  },
  skipNote: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
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
  instructionSection: {
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 12,
    color: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
});

export default DataImportScreen;
