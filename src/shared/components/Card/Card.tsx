/**
 * OptiShare Design System - Card Component
 *
 * Production-ready card component supporting elevated, outlined, filled,
 * and glassmorphism visual styles.
 */

import React from 'react';

import type { ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';

import { UI_CONSTANTS } from '../../constants';
import type { SpacingToken } from '../../theme';
import { useTheme } from '../../theme';

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'glass';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: SpacingToken;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  style,
}: CardProps): React.JSX.Element {
  const { theme } = useTheme();

  const getCardStyle = (pressed: boolean): ViewStyle => {
    let backgroundColor: string;
    let borderColor = 'transparent';
    let borderWidth = 0;
    let shadowStyle = theme.shadows.none;

    switch (variant) {
      case 'elevated':
        backgroundColor = theme.colors.surface;
        shadowStyle = theme.shadows.sm;
        break;
      case 'outlined':
        backgroundColor = theme.colors.surface;
        borderColor = theme.colors.border;
        borderWidth = UI_CONSTANTS.BORDER_THICKNESS;
        break;
      case 'filled':
        backgroundColor = theme.colors.backgroundSecondary;
        break;
      case 'glass':
        backgroundColor = theme.colors.surfaceGlass;
        borderColor = theme.colors.border;
        borderWidth = UI_CONSTANTS.BORDER_THICKNESS;
        break;
    }

    return {
      backgroundColor,
      borderColor,
      borderWidth,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing[padding],
      opacity: pressed ? 0.95 : 1,
      ...shadowStyle,
    };
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [getCardStyle(pressed), style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[getCardStyle(false), style]}>{children}</View>;
}
