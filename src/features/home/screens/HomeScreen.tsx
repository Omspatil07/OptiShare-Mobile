/**
 * OptiShare - Home Screen Placeholder
 */

import React from 'react';

import { StyleSheet, View } from 'react-native';

import { ROUTES } from '../../../app/navigation/routes';
import type { TabScreenProps } from '../../../app/navigation/types';
import { Button, Card, Icon, ScreenContainer, Text, useTheme } from '../../../shared';

export function HomeScreen({ navigation }: TabScreenProps<'HomeTab'>): React.JSX.Element {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h1">
          OptiShare Home
        </Text>
        <Text color="secondary" variant="body1">
          High-Speed Offline Optical Transfer
        </Text>
      </View>

      <Card style={styles.card} variant="glass">
        <View style={styles.cardRow}>
          <Text variant="h3">Theme Mode</Text>
          <Icon name={isDarkMode ? 'moon' : 'sun'} size={24} />
        </View>
        <Text color="secondary" style={styles.cardSub} variant="body2">
          Current Theme: {isDarkMode ? 'Dark Mode' : 'Light Mode'}
        </Text>
        <Button
          fullWidth={true}
          leftIcon={<Icon color="#FFFFFF" name={isDarkMode ? 'sun' : 'moon'} size={18} />}
          onPress={toggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          variant="primary"
        />
      </Card>

      <Card style={styles.card} variant="elevated">
        <Text style={styles.cardTitle} variant="h3">
          Quick Actions
        </Text>
        <View style={styles.actionRow}>
          <Button
            leftIcon={<Icon color="#FFFFFF" name="check" size={18} />}
            onPress={() => navigation.navigate(ROUTES.SEND_TAB)}
            title="Send Files"
            variant="primary"
          />
          <Button
            leftIcon={<Icon color="#FFFFFF" name="search" size={18} />}
            onPress={() => navigation.navigate(ROUTES.RECEIVE_TAB)}
            title="Receive Files"
            variant="secondary"
          />
        </View>
      </Card>

      <Card style={styles.card} variant="outlined">
        <Text style={styles.cardTitle} variant="h4">
          Permissions & Setup
        </Text>
        <Text color="secondary" style={styles.cardSub} variant="body2">
          Camera and Storage permissions required for transfer.
        </Text>
        <Button
          onPress={() => navigation.navigate(ROUTES.PERMISSIONS)}
          title="Check Permissions"
          variant="outline"
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginVertical: 16,
    alignItems: 'center',
  },
  card: {
    marginVertical: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardSub: {
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
