/**
 * OptiShare - Send Screen Placeholder
 */

import React from 'react';

import { StyleSheet, View } from 'react-native';

import { ROUTES } from '../../../app/navigation/routes';
import type { TabScreenProps } from '../../../app/navigation/types';
import { Button, Card, Icon, ScreenContainer, Text } from '../../../shared';

export function SendScreen({ navigation }: TabScreenProps<'SendTab'>): React.JSX.Element {
  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h2">
          Send Files
        </Text>
        <Text color="secondary" variant="body1">
          Select files to stream optically to receiver
        </Text>
      </View>

      <Card style={styles.card} variant="glass">
        <Icon name="copy" size={32} />
        <Text style={styles.cardTitle} variant="h3">
          Select a File to Send
        </Text>
        <Text color="secondary" style={styles.cardSub} variant="body2">
          Supports any file format up to 500MB
        </Text>
        <Button
          fullWidth={true}
          leftIcon={<Icon color="#FFFFFF" name="check" size={18} />}
          onPress={() =>
            navigation.navigate(ROUTES.FILE_PREVIEW, {
              fileName: 'sample_document.pdf',
              fileSize: 2450000,
            })
          }
          title="Preview Selected File"
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
