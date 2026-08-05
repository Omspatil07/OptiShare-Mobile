/**
 * OptiShare Design System - Unified Theme Export
 */

import { borderRadius } from './borderRadius';
import type { ColorPalette} from './colors';
import { darkColors, lightColors } from './colors';
import { responsive } from './responsive';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { fontFamilies, fontSizes, fontWeights, lineHeights, textVariants } from './typography';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: 'light' | 'dark';
  colors: ColorPalette;
  typography: {
    fontFamilies: typeof fontFamilies;
    fontSizes: typeof fontSizes;
    fontWeights: typeof fontWeights;
    lineHeights: typeof lineHeights;
    textVariants: typeof textVariants;
  };
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  responsive: typeof responsive;
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  typography: {
    fontFamilies,
    fontSizes,
    fontWeights,
    lineHeights,
    textVariants,
  },
  spacing,
  borderRadius,
  shadows,
  responsive,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  typography: {
    fontFamilies,
    fontSizes,
    fontWeights,
    lineHeights,
    textVariants,
  },
  spacing,
  borderRadius,
  shadows,
  responsive,
};
