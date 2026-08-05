/**
 * OptiShare Design System - Text Component
 *
 * Production-ready text component with theme-aware typography variants.
 */

import React from 'react';

import type { TextProps as RNTextProps, TextStyle } from 'react-native';
import { Text as RNText } from 'react-native';

import type { TextVariant} from '../../theme';
import { useTheme } from '../../theme';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'error'
  | 'success'
  | 'warning'
  | 'inverse'
  | 'brand';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor | string;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}

export function Text({
  variant = 'body1',
  color = 'primary',
  align = 'left',
  weight,
  children,
  style,
  ...props
}: TextProps): React.JSX.Element {
  const { theme } = useTheme();

  const getTextColor = (): string => {
    switch (color) {
      case 'primary':
        return theme.colors.textPrimary;
      case 'secondary':
        return theme.colors.textSecondary;
      case 'tertiary':
        return theme.colors.textTertiary;
      case 'error':
        return theme.colors.error;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'inverse':
        return theme.colors.textInverse;
      case 'brand':
        return theme.colors.primary;
      default:
        return color;
    }
  };

  const variantStyle = theme.typography.textVariants[variant];
  const textColor = getTextColor();

  return (
    <RNText
      style={[
        variantStyle,
        { color: textColor, textAlign: align },
        weight ? { fontWeight: weight } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
