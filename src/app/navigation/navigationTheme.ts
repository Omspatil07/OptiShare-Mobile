/**
 * OptiShare Navigation - Navigation Theme Adapter
 *
 * Adapts OptiShare design system themes to React Navigation's Theme format.
 */

import type { Theme as NavigationTheme } from '@react-navigation/native';

import type { Theme as OptiShareTheme } from '../../shared/theme';

export function getNavigationTheme(optishareTheme: OptiShareTheme): NavigationTheme {
  const { colors, mode } = optishareTheme;
  return {
    dark: mode === 'dark',
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.accent,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '800' },
    },
  };
}
