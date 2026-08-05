/**
 * OptiShare Design System - ScreenContainer Component
 *
 * Safe area screen container handling notch boundaries, scrolling,
 * theme backgrounds, and status bar coordination.
 */

import React from 'react';

import type {
  StatusBarStyle,
  ViewStyle} from 'react-native';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { SpacingToken} from '../../theme';
import { useTheme } from '../../theme';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: SpacingToken;
  backgroundColor?: string;
  statusBarStyle?: StatusBarStyle;
  style?: ViewStyle;
}

export function ScreenContainer({
  children,
  scrollable = false,
  padding = 'md',
  backgroundColor,
  statusBarStyle,
  style,
}: ScreenContainerProps): React.JSX.Element {
  const { theme, isDarkMode } = useTheme();

  const containerBg = backgroundColor || theme.colors.background;
  const barStyle: StatusBarStyle =
    statusBarStyle || (isDarkMode ? 'light-content' : 'dark-content');

  const paddingSize = theme.spacing[padding];

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { padding: paddingSize },
        style,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fixedContent, { padding: paddingSize }, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: containerBg }]}>
      <StatusBar backgroundColor={containerBg} barStyle={barStyle} />
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  fixedContent: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
