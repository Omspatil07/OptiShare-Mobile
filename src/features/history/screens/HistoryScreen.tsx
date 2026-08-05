/**
 * OptiShare - History Screen Placeholder
 */

import React from 'react';

import { StyleSheet, View } from 'react-native';

import type { TabScreenProps } from '../../../app/navigation/types';
import { Card, Icon, ScreenContainer, Text, useTheme } from '../../../shared';

export function HistoryScreen({}: TabScreenProps<'HistoryTab'>): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h2">
          Transfer History
        </Text>
        <Text color="secondary" variant="body1">
          Recent offline file transfers
        </Text>
      </View>

      <Card style={styles.card} variant="elevated">
        <View style={styles.row}>
          <Icon color={theme.colors.success} name="check" size={24} />
          <View style={styles.details}>
            <Text variant="h4">presentation.pdf</Text>
            <Text color="secondary" variant="caption">
              Received | 14.2 MB | Today, 2:15 PM
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card} variant="elevated">
        <View style={styles.row}>
          <Icon color={theme.colors.primary} name="copy" size={24} />
          <View style={styles.details}>
            <Text variant="h4">archive_data.zip</Text>
            <Text color="secondary" variant="caption">
              Sent | 45.8 MB | Yesterday, 6:40 PM
            </Text>
          </View>
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginVertical: 16,
  },
  card: {
    marginVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  details: {
    marginLeft: 12,
  },
});
