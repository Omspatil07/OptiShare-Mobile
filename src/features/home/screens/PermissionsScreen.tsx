/**
 * OptiShare - Permissions Screen with Runtime Permission Manager Integration
 */

import React, { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import type { RootStackScreenProps } from '../../../app/navigation/types';
import { usePermissions } from '../../../permissions';
import { Button, Card, Icon, ScreenContainer, Text, useTheme } from '../../../shared';

export function PermissionsScreen({
  navigation,
}: RootStackScreenProps<'Permissions'>): React.JSX.Element {
  const { theme } = useTheme();
  const {
    cameraStatus,
    storageStatus,
    checkPermissions,
    requestCamera,
    requestStorage,
    openSettings,
  } = usePermissions();

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h2">
          App Permissions
        </Text>
        <Text color="secondary" variant="body1">
          OptiShare requires camera & storage access for offline optical transfer.
        </Text>
      </View>

      <Card style={styles.card} variant="elevated">
        <View style={styles.row}>
          <Icon color={theme.colors.primary} name="search" size={28} />
          <View style={styles.textColumn}>
            <Text variant="h4">Camera Access ({cameraStatus.toUpperCase()})</Text>
            <Text color="secondary" variant="body2">
              Used strictly for reading optical frame streams. Zero internet required.
            </Text>
          </View>
        </View>
        <Button
          fullWidth={true}
          onPress={requestCamera}
          style={styles.cardButton}
          title={cameraStatus === 'granted' ? 'Camera Granted ✓' : 'Grant Camera Access'}
          variant={cameraStatus === 'granted' ? 'secondary' : 'primary'}
        />
      </Card>

      <Card style={styles.card} variant="elevated">
        <View style={styles.row}>
          <Icon color={theme.colors.secondary} name="copy" size={28} />
          <View style={styles.textColumn}>
            <Text variant="h4">File Storage ({storageStatus.toUpperCase()})</Text>
            <Text color="secondary" variant="body2">
              Used to save received files locally on your device.
            </Text>
          </View>
        </View>
        <Button
          fullWidth={true}
          onPress={requestStorage}
          style={styles.cardButton}
          title={storageStatus === 'granted' ? 'Storage Granted ✓' : 'Grant Storage Access'}
          variant={storageStatus === 'granted' ? 'secondary' : 'primary'}
        />
      </Card>

      <Button
        fullWidth={true}
        onPress={openSettings}
        style={styles.button}
        title="Open System Settings"
        variant="outline"
      />

      <Button
        fullWidth={true}
        onPress={() => navigation.goBack()}
        style={styles.buttonMargin}
        title="Go Back"
        variant="ghost"
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
  cardButton: {
    marginTop: 12,
  },
  button: {
    marginTop: 24,
  },
  buttonMargin: {
    marginTop: 8,
  },
});
