/**
 * Root application component.
 *
 * Demonstrates the OptiShare Design System with ThemeProvider and reusable UI components.
 */
import React from 'react';

import { StyleSheet, View } from 'react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  Divider,
  Icon,
  ScreenContainer,
  Text,
  ThemeProvider,
  useTheme,
} from '../shared';

function MainScreen(): React.JSX.Element {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h1">
          OptiShare
        </Text>
        <Text color="secondary" variant="body1">
          Offline Optical File Transfer
        </Text>
      </View>

      <Card style={styles.cardMargin} variant="glass">
        <View style={styles.cardHeader}>
          <Text variant="h3">Theme Mode</Text>
          <Icon name={isDarkMode ? 'moon' : 'sun'} size={24} />
        </View>
        <Text color="secondary" style={styles.cardText} variant="body2">
          Currently active: {isDarkMode ? 'Dark Mode' : 'Light Mode'}
        </Text>
        <Button
          fullWidth={true}
          leftIcon={<Icon color="#FFFFFF" name={isDarkMode ? 'sun' : 'moon'} size={18} />}
          onPress={toggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          variant="primary"
        />
      </Card>

      <Divider spacing="lg" />

      <Text style={styles.sectionTitle} variant="h4">
        Design System Components
      </Text>

      <Card style={styles.cardMargin} variant="elevated">
        <Text variant="label">Elevated Card</Text>
        <Text color="secondary" variant="caption">
          Supports shadows, elevation, and surface styling.
        </Text>
      </Card>

      <View style={styles.buttonRow}>
        <Button
          leftIcon={<Icon color="#FFFFFF" name="check" size={16} />}
          onPress={() => {}}
          title="Primary"
          variant="primary"
        />
        <Button
          leftIcon={<Icon color="#FFFFFF" name="info" size={16} />}
          onPress={() => {}}
          title="Secondary"
          variant="secondary"
        />
      </View>
    </ScreenContainer>
  );
}

export function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="system">
        <MainScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    marginVertical: 16,
    alignItems: 'center',
  },
  cardMargin: {
    marginVertical: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardText: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
});
