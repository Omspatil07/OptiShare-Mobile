/**
 * OptiShare Design System - Loader Component
 *
 * Production-ready loading indicator supporting small/medium/large sizes,
 * theme colors, and full-screen overlay mode.
 */

import React from 'react';

import type {
  ViewStyle} from 'react-native';
import {
  ActivityIndicator,
  StyleSheet,
  View
} from 'react-native';

import { useTheme } from '../../theme';
import { Text } from '../Text/Text';

export type LoaderSize = 'sm' | 'md' | 'lg';

export interface LoaderProps {
  size?: LoaderSize;
  color?: string;
  overlay?: boolean;
  message?: string;
  style?: ViewStyle;
}

export function Loader({
  size = 'md',
  color,
  overlay = false,
  message,
  style,
}: LoaderProps): React.JSX.Element {
  const { theme } = useTheme();

  const getIndicatorSize = (): 'small' | 'large' | number => {
    switch (size) {
      case 'sm':
        return 'small';
      case 'lg':
        return 'large';
      case 'md':
      default:
        return 'small';
    }
  };

  const loaderColor = color || theme.colors.primary;

  const content = (
    <View style={[styles.container, style]}>
      <ActivityIndicator color={loaderColor} size={getIndicatorSize()} />
      {message && (
        <Text color="secondary" style={styles.messageMargin} variant="caption">
          {message}
        </Text>
      )}
    </View>
  );

  if (overlay) {
    return (
      <View style={[styles.overlayContainer, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.overlayBox, { backgroundColor: theme.colors.surface }]}>
          {content}
        </View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  messageMargin: {
    marginTop: 8,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
  },
});
