/**
 * OptiShare - Permissions Screen Placeholder
 */

import React from 'react';

import { StyleSheet, View } from 'react-native';

import type { RootStackScreenProps } from '../../../app/navigation/types';
import { Button, Card, Icon, ScreenContainer, Text, useTheme } from '../../../shared';

export function PermissionsScreen({
  navigation,
}: RootStackScreenProps<'Permissions'>): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h2">
          App Permissions
        </Text>
        <Text color="secondary" variant="body1">
          OptiShare requires camera access for optical scanning.
        </Text>
      </View>

      <Card style={styles.card} variant="elevated">
        <View style={styles.row}>
          <Icon color={theme.colors.primary} name="search" size={28} />
          <View style={styles.textColumn}>
            <Text variant="h4">Camera Access</Text>
            <Text color="secondary" variant="body2">
              Used strictly for reading optical frame streams. Zero internet required.
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card} variant="elevated">
        <View style={styles.row}>
          <Icon color={theme.colors.secondary} name="copy" size={28} />
          <View style={styles.textColumn}>
            <Text variant="h4">File Storage</Text>
            <Text color="secondary" variant="body2">
              Used to save received files locally on your device.
            </Text>
          </View>
        </View>
      </Card>

      <Button
        fullWidth={true}
        onPress={() => navigation.goBack()}
        style={styles.button}
        title="Go Back"
        variant="primary"
      />
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
    alignItems: 'center',
  },
  textColumn: {
    marginLeft: 16,
    flex: 1,
  },
  button: {
    marginTop: 24,
  },
});
