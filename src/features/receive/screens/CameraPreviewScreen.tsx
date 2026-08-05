/**
 * OptiShare - Camera Preview Screen Placeholder
 */

import React from 'react';

import { StyleSheet, View } from 'react-native';

import { ROUTES } from '../../../app/navigation/routes';
import type { RootStackScreenProps } from '../../../app/navigation/types';
import { Button, Card, Icon, ScreenContainer, Text, useTheme } from '../../../shared';

export function CameraPreviewScreen({
  navigation,
}: RootStackScreenProps<'CameraPreview'>): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h2">
          Camera Preview
        </Text>
      </View>

      <Card style={styles.card} variant="elevated">
        <View style={[styles.cameraMock, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Icon color={theme.colors.primary} name="search" size={48} />
          <Text color="secondary" style={styles.mockText} variant="caption">
            Camera Feed Mock - Aligning Optical Stream...
          </Text>
        </View>
      </Card>

      <Button
        fullWidth={true}
        leftIcon={<Icon color="#FFFFFF" name="check" size={18} />}
        onPress={() => navigation.navigate(ROUTES.TRANSFER_PROGRESS, { role: 'receiver' })}
        style={styles.button}
        title="Simulate Stream Locked"
        variant="primary"
      />
      <Button
        fullWidth={true}
        onPress={() => navigation.goBack()}
        style={styles.buttonMargin}
        title="Close Camera"
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
  cameraMock: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  mockText: {
    marginTop: 12,
  },
  button: {
    marginTop: 16,
  },
  buttonMargin: {
    marginTop: 8,
  },
});
