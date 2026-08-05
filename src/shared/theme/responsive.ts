/**
 * OptiShare Design System - Responsive Utilities
 *
 * Screen dimension helpers and scale functions for mobile layouts.
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Baseline guideline dimensions based on standard mobile viewport (375x812)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

export const responsive = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,

  // Scale based on screen width
  scale: (size: number): number => {
    const scaleFactor = SCREEN_WIDTH / GUIDELINE_BASE_WIDTH;
    const newSize = size * scaleFactor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },

  // Vertical scale based on screen height
  verticalScale: (size: number): number => {
    const scaleFactor = SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT;
    const newSize = size * scaleFactor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },

  // Moderated scale for balanced scaling across tablets/large screens
  moderateScale: (size: number, factor = 0.5): number => {
    const scaleFactor = SCREEN_WIDTH / GUIDELINE_BASE_WIDTH;
    const newSize = size + (size * scaleFactor - size) * factor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },

  // Breakpoints
  isSmallDevice: SCREEN_WIDTH < 360,
  isTablet: SCREEN_WIDTH >= 768,
};
