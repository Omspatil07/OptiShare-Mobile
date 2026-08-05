/**
 * OptiShare Design System - Divider Component
 *
 * Production-ready divider for separating content sections horizontally or vertically.
 */

import React from 'react';

import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { UI_CONSTANTS } from '../../constants';
import type { SpacingToken} from '../../theme';
import { useTheme } from '../../theme';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  spacing?: SpacingToken;
  style?: ViewStyle;
}

export function Divider({
  orientation = 'horizontal',
  thickness = UI_CONSTANTS.BORDER_THICKNESS,
  color,
  spacing = 'md',
  style,
}: DividerProps): React.JSX.Element {
  const { theme } = useTheme();

  const dividerColor = color || theme.colors.divider;
  const marginSize = theme.spacing[spacing];

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          {
            width: thickness,
            backgroundColor: dividerColor,
            marginHorizontal: marginSize,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        {
          height: thickness,
          backgroundColor: dividerColor,
          marginVertical: marginSize,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
});
