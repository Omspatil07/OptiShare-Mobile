/**
 * Root application component.
 *
 * This is a minimal placeholder for the repository setup phase.
 * Application providers, navigation, and theme will be added
 * in subsequent phases per docs/05-architecture.md.
 */
import React from 'react';

import { StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';

export function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>OptiShare</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Offline Optical File Transfer
        </Text>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  titleDark: {
    color: '#E0E0E0',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    color: '#6B7280',
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
});
