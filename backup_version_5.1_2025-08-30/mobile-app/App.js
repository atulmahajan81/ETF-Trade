import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Context
import { ETFTradingProvider, useETFTrading } from './src/context/ETFTradingContext';

// Screens
import UserAuthScreen from './src/screens/UserAuthScreen';
import UserSetupScreen from './src/screens/UserSetupScreen';
import DataImportScreen from './src/screens/DataImportScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HoldingsScreen from './src/screens/HoldingsScreen';
import SoldItemsScreen from './src/screens/SoldItemsScreen';
import ETFRankingScreen from './src/screens/ETFRankingScreen';
import StrategyScreen from './src/screens/StrategyScreen';
import MoneyManagementScreen from './src/screens/MoneyManagementScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Components
import CustomDrawerContent from './src/components/CustomDrawerContent';
import CustomTabBar from './src/components/CustomTabBar';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Main Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: 'home'
        }}
      />
      <Tab.Screen 
        name="Holdings" 
        component={HoldingsScreen}
        options={{
          tabBarLabel: 'Holdings',
          tabBarIcon: 'package'
        }}
      />
      <Tab.Screen 
        name="SoldItems" 
        component={SoldItemsScreen}
        options={{
          tabBarLabel: 'Sold',
          tabBarIcon: 'trending-up'
        }}
      />
      <Tab.Screen 
        name="ETFRanking" 
        component={ETFRankingScreen}
        options={{
          tabBarLabel: 'Ranking',
          tabBarIcon: 'bar-chart-2'
        }}
      />
    </Tab.Navigator>
  );
};

// Drawer Navigator for additional screens
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#1a1a1a',
          width: 280,
        },
        drawerLabelStyle: {
          color: '#ffffff',
        },
        drawerActiveTintColor: '#3b82f6',
        drawerInactiveTintColor: '#9ca3af',
      }}
    >
      <Drawer.Screen name="MainTabs" component={TabNavigator} />
      <Drawer.Screen name="Strategy" component={StrategyScreen} />
      <Drawer.Screen name="MoneyManagement" component={MoneyManagementScreen} />
      <Drawer.Screen name="DataImport" component={DataImportScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};

// Main App Content
const AppContent = () => {
  const { auth, userSetup, completeUserSetup } = useETFTrading();
  const [showDataImport, setShowDataImport] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  console.log('🔍 AppContent Debug:', {
    isAuthenticated: auth.isAuthenticated,
    currentUser: auth.currentUser,
    userSetupCompleted: userSetup.isCompleted,
    showDataImport
  });

  // Initialize theme and demo mode
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        const demoMode = await AsyncStorage.getItem('demoMode');
        
        const prefersDark = savedTheme === 'dark' || (!savedTheme && true); // Default to dark
        setIsDarkMode(prefersDark);
        setIsDemoMode(demoMode === 'true');
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  const handleUserSetupComplete = (userData) => {
    console.log('User setup completed:', userData);
    completeUserSetup(userData);
    
    // Show data import ONLY for new users with ETF experience
    if (userData.hasETFTradingExperience && !auth.currentUser?.isExistingUser) {
      console.log('📁 New user with ETF experience - showing data import');
      setShowDataImport(true);
    } else {
      console.log('🏠 User setup complete - going to dashboard');
      setShowDataImport(false);
    }
  };

  const handleDataImportComplete = () => {
    console.log('Data import completed - going to dashboard');
    setShowDataImport(false);
  };

  // Always show login/signup if not authenticated
  if (!auth.isAuthenticated) {
    console.log('🔐 Showing UserAuth - user not authenticated');
    return <UserAuthScreen />;
  }

  // Check if user is an existing user
  const isExistingUser = auth.currentUser && auth.currentUser.isExistingUser;
  
  // If authenticated but user setup not completed AND not an existing user, show user setup
  if (!userSetup.isCompleted && !isExistingUser) {
    console.log('🆕 Showing UserSetup component for new user');
    return <UserSetupScreen onComplete={handleUserSetupComplete} />;
  }

  // Show data import ONLY for new users with ETF experience (not existing users)
  if (showDataImport && !isExistingUser) {
    console.log('📁 Showing DataImport component for new user with ETF experience');
    return <DataImportScreen onImportComplete={handleDataImportComplete} />;
  }

  console.log('🏠 Showing main app - user is authenticated and setup is complete');
  return <DrawerNavigator />;
};

// Main App Component
const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <ETFTradingProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppContent />
          </NavigationContainer>
        </ETFTradingProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;
