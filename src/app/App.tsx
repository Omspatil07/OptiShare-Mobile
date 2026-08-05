/**
 * Root Application Component
 *
 * Bootstraps Safe Area Provider, Design System Theme Provider,
 * and React Navigation Container with Root Navigator.
 */

import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from '../shared';
import { linking } from './navigation/linking';
import { navigationRef } from './navigation/navigationRef';
import { getNavigationTheme } from './navigation/navigationTheme';
import { RootNavigator } from './navigation/RootNavigator';

function AppContent(): React.JSX.Element {
  const { theme } = useTheme();
  const navTheme = getNavigationTheme(theme);

  return (
    <NavigationContainer linking={linking} ref={navigationRef} theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="system">
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
