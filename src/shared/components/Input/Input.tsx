/**
 * OptiShare Design System - Input Component
 *
 * Production-ready text input with focus indicators, label, helper/error text,
 * clear button, and password visibility toggle.
 */

import React, { useState } from 'react';

import type {
  TextInputProps as RNTextInputProps,
  ViewStyle} from 'react-native';
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View
} from 'react-native';

import { UI_CONSTANTS } from '../../constants';
import { useTheme } from '../../theme';
import { Icon } from '../Icon/Icon';
import { Text } from '../Text/Text';

export interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showClearButton?: boolean;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  showClearButton = false,
  secureTextEntry,
  value,
  onChangeText,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps): React.JSX.Element {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isSecure = secureTextEntry && !isPasswordVisible;

  const getBorderColor = (): string => {
    if (error) {
      return theme.colors.error;
    }
    if (isFocused) {
      return theme.colors.borderFocus;
    }
    return theme.colors.border;
  };

  const handleFocus = (e: Parameters<NonNullable<RNTextInputProps['onFocus']>>[0]): void => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: Parameters<NonNullable<RNTextInputProps['onBlur']>>[0]): void => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleClear = (): void => {
    if (onChangeText) {
      onChangeText('');
    }
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={styles.labelMargin} variant="label">
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: getBorderColor(),
            borderWidth: isFocused || error ? UI_CONSTANTS.BORDER_THICKNESS_THICK : UI_CONSTANTS.BORDER_THICKNESS,
            borderRadius: theme.borderRadius.md,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <RNTextInput
          accessibilityLabel={label}
          onBlur={handleBlur}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={isSecure}
          style={[
            styles.textInput,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSizes.md,
            },
            style,
          ]}
          value={value}
          {...props}
        />

        {showClearButton && value && value.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear text"
            accessibilityRole="button"
            onPress={handleClear}
            style={styles.actionIconContainer}
          >
            <Icon color={theme.colors.textSecondary} name="close" size={18} />
          </Pressable>
        ) : null}

        {secureTextEntry ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            style={styles.actionIconContainer}
          >
            <Icon
              color={theme.colors.textSecondary}
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={18}
            />
          </Pressable>
        ) : null}

        {rightIcon && !secureTextEntry && !showClearButton ? (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text color="error" style={styles.helperMargin} variant="caption">
          {error}
        </Text>
      ) : helperText ? (
        <Text color="secondary" style={styles.helperMargin} variant="caption">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  labelMargin: {
    marginBottom: 6,
  },
  helperMargin: {
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Math.max(48, UI_CONSTANTS.MIN_TOUCH_TARGET),
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
  actionIconContainer: {
    padding: 8,
    marginLeft: 4,
  },
});
