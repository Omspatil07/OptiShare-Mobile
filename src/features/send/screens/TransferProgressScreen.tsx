/**
 * OptiShare - Transfer Progress Screen Placeholder
 */

import React from 'react';

import { StyleSheet, View } from 'react-native';

import { ROUTES } from '../../../app/navigation/routes';
import type { RootStackScreenProps } from '../../../app/navigation/types';
import { Button, Card, Loader, ScreenContainer, Text } from '../../../shared';

export function TransferProgressScreen({
  route,
  navigation,
}: RootStackScreenProps<'TransferProgress'>): React.JSX.Element {
  const role = route.params?.role || 'sender';

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h2">
          Transfer Progress
        </Text>
        <Text color="secondary" variant="body1">
          Role: {role.toUpperCase()}
        </Text>
      </View>

      <Card style={styles.card} variant="glass">
        <Loader message="Streaming optical frames..." size="lg" />
        <Text style={styles.progressText} variant="h3">
          65% Complete
        </Text>
        <Text color="secondary" variant="body2">
          Frame Rate: 60 FPS | Speed: 1.2 MB/s
        </Text>
      </Card>

      <Button
        fullWidth={true}
        onPress={() => navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.HISTORY_TAB })}
        style={styles.button}
        title="View in History"
        variant="primary"
      />
      <Button
        fullWidth={true}
        onPress={() => navigation.goBack()}
        style={styles.buttonMargin}
        title="Cancel Transfer"
        variant="danger"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginVertical: 16,
  },
  card: {
    marginVertical: 16,
    alignItems: 'center',
  },
  progressText: {
    marginVertical: 12,
  },
  button: {
    marginTop: 16,
  },
  buttonMargin: {
    marginTop: 8,
  },
});
