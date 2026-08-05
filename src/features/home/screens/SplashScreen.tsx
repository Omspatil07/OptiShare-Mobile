/**
 * OptiShare - Splash Screen Placeholder
 */

import React, { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { ROUTES } from '../../../app/navigation/routes';
import type { RootStackScreenProps } from '../../../app/navigation/types';
import { Button, Icon, ScreenContainer, Text, useTheme } from '../../../shared';

export function SplashScreen({ navigation }: RootStackScreenProps<'Splash'>): React.JSX.Element {
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace(ROUTES.MAIN_TABS);
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <ScreenContainer padding="xl" style={styles.centerContent}>
      <View style={[styles.logoContainer, { backgroundColor: theme.colors.surface }]}>
        <Icon color={theme.colors.primary} name="refresh" size={48} />
      </View>
      <Text color="brand" style={styles.title} variant="h1">
        OptiShare
      </Text>
      <Text color="secondary" style={styles.subtitle} variant="body1">
        Offline Optical File Transfer
      </Text>
      <Button
        onPress={() => navigation.replace(ROUTES.MAIN_TABS)}
        style={styles.skipButton}
        title="Continue to App"
        variant="outline"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    padding: 24,
    borderRadius: 32,
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
  },
  skipButton: {
    marginTop: 16,
  },
});
