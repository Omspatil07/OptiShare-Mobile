/**
 * OptiShare - Receive Screen Placeholder
 */

import React from 'react';

import { StyleSheet, View } from 'react-native';

import { ROUTES } from '../../../app/navigation/routes';
import type { TabScreenProps } from '../../../app/navigation/types';
import { Button, Card, Icon, ScreenContainer, Text } from '../../../shared';

export function ReceiveScreen({ navigation }: TabScreenProps<'ReceiveTab'>): React.JSX.Element {
  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h2">
          Receive Files
        </Text>
        <Text color="secondary" variant="body1">
          Scan optical transmission stream with camera
        </Text>
      </View>

      <Card style={styles.card} variant="glass">
        <Icon name="search" size={32} />
        <Text style={styles.cardTitle} variant="h3">
          Ready to Receive
        </Text>
        <Text color="secondary" style={styles.cardSub} variant="body2">
          Point camera at sender's optical screen code
        </Text>
        <Button
          fullWidth={true}
          leftIcon={<Icon color="#FFFFFF" name="search" size={18} />}
          onPress={() => navigation.navigate(ROUTES.CAMERA_PREVIEW)}
          title="Open Camera Scanner"
          variant="primary"
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
    marginVertical: 16,
    alignItems: 'center',
  },
  cardTitle: {
    marginVertical: 8,
  },
  cardSub: {
    marginBottom: 16,
    textAlign: 'center',
  },
});
