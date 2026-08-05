/**
 * OptiShare Design System - Elevation & Shadows Tokens
 *
 * Provides cross-platform elevation support for iOS and Android.
 */

import type { ViewStyle } from 'react-native';

import { lightColors } from './colors';

export interface ShadowStyle extends ViewStyle {
  elevation?: number;
}

export type ShadowToken = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export const shadows: Record<ShadowToken, ShadowStyle> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
};
