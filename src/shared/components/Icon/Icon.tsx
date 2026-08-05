/**
 * OptiShare Design System - Icon Component
 *
 * Provides vector UI icon glyphs without external native dependencies.
 */

import React from 'react';

import type { ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';

export type IconName =
  | 'sun'
  | 'moon'
  | 'search'
  | 'check'
  | 'close'
  | 'info'
  | 'alert'
  | 'eye'
  | 'eye-off'
  | 'chevron-right'
  | 'lock'
  | 'refresh'
  | 'copy';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const iconGlyphs: Record<IconName, string> = {
  sun: '☀️',
  moon: '🌙',
  search: '🔍',
  check: '✓',
  close: '✕',
  info: 'ℹ',
  alert: '⚠',
  eye: '👁',
  'eye-off': '🙈',
  'chevron-right': '›',
  lock: '🔒',
  refresh: '↻',
  copy: '📋',
};

export function Icon({ name, size = 20, color, style }: IconProps): React.JSX.Element {
  const { theme } = useTheme();
  const iconColor = color || theme.colors.textPrimary;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Text
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
        style={[
          styles.iconText,
          {
            fontSize: size * 0.8,
            lineHeight: size,
            color: iconColor,
          },
        ]}
      >
        {iconGlyphs[name] || '•'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    textAlign: 'center',
  },
});
