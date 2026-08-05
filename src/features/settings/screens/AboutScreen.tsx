/**
 * OptiShare - About Screen Placeholder
 */

import React from 'react';

import { StyleSheet, View } from 'react-native';

import type { RootStackScreenProps } from '../../../app/navigation/types';
import { Button, Card, Icon, ScreenContainer, Text } from '../../../shared';

export function AboutScreen({ navigation }: RootStackScreenProps<'About'>): React.JSX.Element {
  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h2">
          About OptiShare
        </Text>
      </View>

      <Card style={styles.card} variant="elevated">
        <Icon name="info" size={36} />
        <Text style={styles.title} variant="h3">
          OptiShare v0.1.0
        </Text>
        <Text color="secondary" style={styles.body} variant="body2">
          Production-quality offline optical file transfer application. Built with React Native,
          TypeScript, Clean Architecture, and zero network dependencies.
        </Text>
        <Text color="tertiary" variant="caption">
          License: MIT
        </Text>
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
    marginVertical: 16,
    alignItems: 'center',
  },
  title: {
    marginVertical: 8,
  },
  body: {
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
});
