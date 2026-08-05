/**
 * OptiShare - Settings Screen Placeholder
 */

import React from 'react';

import { StyleSheet, View } from 'react-native';

import { ROUTES } from '../../../app/navigation/routes';
import type { TabScreenProps } from '../../../app/navigation/types';
import { Button, Card, Icon, ScreenContainer, Text, useTheme } from '../../../shared';

export function SettingsScreen({ navigation }: TabScreenProps<'SettingsTab'>): React.JSX.Element {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h2">
          Settings
        </Text>
        <Text color="secondary" variant="body1">
          Preferences & Application Info
        </Text>
      </View>

      <Card style={styles.card} variant="glass">
        <View style={styles.row}>
          <Text variant="h4">Appearance</Text>
          <Icon name={isDarkMode ? 'moon' : 'sun'} size={20} />
        </View>
        <Text color="secondary" style={styles.sub} variant="body2">
          Current Theme: {isDarkMode ? 'Dark Mode' : 'Light Mode'}
        </Text>
        <Button
          fullWidth={true}
          onPress={toggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          variant="outline"
        />
      </Card>

      <Card style={styles.card} variant="elevated">
        <Text style={styles.title} variant="h4">
          Permissions & Security
        </Text>
        <Button
          fullWidth={true}
          onPress={() => navigation.navigate(ROUTES.PERMISSIONS)}
          style={styles.button}
          title="App Permissions"
          variant="ghost"
        />
        <Button
          fullWidth={true}
          onPress={() => navigation.navigate(ROUTES.ABOUT)}
          style={styles.button}
          title="About OptiShare"
          variant="ghost"
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginVertical: 16,
  },
  card: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
  },
  sub: {
    marginVertical: 8,
  },
  button: {
    marginVertical: 4,
  },
});
