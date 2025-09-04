import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
        style={styles.gradient}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.tab, isFocused && styles.tabFocused]}
              onPress={onPress}
            >
              <View style={styles.tabContent}>
                <Text style={[styles.tabIcon, isFocused && styles.tabIconFocused]}>
                  {options.tabBarIcon}
                </Text>
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    backgroundColor: '#1a1a1a',
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabFocused: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabContent: {
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 20,
    color: '#9ca3af',
    marginBottom: 4,
  },
  tabIconFocused: {
    color: '#3b82f6',
  },
  tabLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default CustomTabBar;
