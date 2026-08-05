/**
 * OptiShare Design System - Button Component
 *
 * Production-ready button component with variants, sizes, loading state,
 * icon support, and guaranteed minimum 48dp touch target for accessibility.
 */

import React from 'react';

import type {
  PressableProps,
  ViewStyle} from 'react-native';
import {
  Pressable,
  StyleSheet,
  View
} from 'react-native';

import { UI_CONSTANTS } from '../../constants';
import { useTheme } from '../../theme';
import { Loader } from '../Loader/Loader';
import { Text } from '../Text/Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  onPress,
  ...props
}: ButtonProps): React.JSX.Element {
  const { theme } = useTheme();

  const isDisabled = disabled || loading;

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    let backgroundColor: string;
    let borderColor = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        backgroundColor = pressed
          ? theme.colors.primaryDark
          : theme.colors.primary;
        break;
      case 'secondary':
        backgroundColor = pressed
          ? theme.colors.secondaryDark
          : theme.colors.secondary;
        break;
      case 'outline':
        backgroundColor = pressed
          ? theme.colors.backgroundSecondary
          : 'transparent';
        borderColor = theme.colors.borderFocus;
        borderWidth = UI_CONSTANTS.BORDER_THICKNESS;
        break;
      case 'ghost':
        backgroundColor = pressed
          ? theme.colors.backgroundSecondary
          : 'transparent';
        break;
      case 'danger':
        backgroundColor = pressed
          ? theme.colors.error
          : theme.colors.error;
        break;
    }

    if (isDisabled) {
      backgroundColor =
        variant === 'outline' || variant === 'ghost'
          ? 'transparent'
          : theme.colors.backgroundTertiary;
      borderColor =
        variant === 'outline' ? theme.colors.border : 'transparent';
    }

    // Size padding mapping
    let height: number;
    let paddingHorizontal: number;

    switch (size) {
      case 'sm':
        height = Math.max(36, UI_CONSTANTS.MIN_TOUCH_TARGET);
        paddingHorizontal = theme.spacing.md;
        break;
      case 'lg':
        height = 56;
        paddingHorizontal = theme.spacing.xl;
        break;
      case 'md':
      default:
        height = Math.max(48, UI_CONSTANTS.MIN_TOUCH_TARGET);
        paddingHorizontal = theme.spacing.lg;
        break;
    }

    return {
      height,
      minHeight: UI_CONSTANTS.MIN_TOUCH_TARGET,
      paddingHorizontal,
      borderRadius: theme.borderRadius.md,
      backgroundColor,
      borderColor,
      borderWidth,
      opacity: pressed && !isDisabled ? 0.9 : isDisabled ? 0.6 : 1,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
    };
  };

  const getTextColor = (): string => {
    if (isDisabled) {
      return theme.colors.textDisabled;
    }
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
    }
  };

  const textColor = getTextColor();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.baseContainer,
        getContainerStyle(pressed),
        style,
      ]}
      {...props}
    >
      <View style={styles.contentRow}>
        {loading ? (
          <Loader size="sm" color={textColor} />
        ) : (
          <>
            {leftIcon && <View style={styles.iconMarginRight}>{leftIcon}</View>}
            <Text
              style={{ color: textColor }}
              variant={size === 'sm' ? 'body2' : 'button'}
              weight="semibold"
            >
              {title}
            </Text>
            {rightIcon && <View style={styles.iconMarginLeft}>{rightIcon}</View>}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMarginRight: {
    marginRight: 8,
  },
  iconMarginLeft: {
    marginLeft: 8,
  },
});
