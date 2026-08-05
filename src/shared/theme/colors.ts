/**
 * OptiShare Design System - Color Palette
 *
 * Defines light and dark mode color tokens with HSL-tailored accents,
 * deep obsidian dark mode backgrounds, glassmorphism overlays, and semantic status colors.
 */

export interface ColorPalette {
  // Brand / Accent
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;

  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Surfaces & Glassmorphism
  surface: string;
  surfaceVariant: string;
  surfaceGlass: string;

  // Text / Content
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textInverse: string;

  // Borders & Dividers
  border: string;
  borderFocus: string;
  divider: string;

  // Semantic Status
  success: string;
  successBackground: string;
  error: string;
  errorBackground: string;
  warning: string;
  warningBackground: string;
  info: string;
  infoBackground: string;

  // Special Overlays
  overlay: string;
  scrim: string;
  shadow: string;
}

export const lightColors: ColorPalette = {
  // Brand / Accent (Vibrant Cyan/Indigo)
  primary: '#0D9488', // Teal/Cyan 600
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',
  secondary: '#6366F1', // Indigo 500
  secondaryLight: '#818CF8',
  secondaryDark: '#4F46E5',
  accent: '#F59E0B', // Amber 500

  // Backgrounds
  background: '#F8FAFC', // Slate 50
  backgroundSecondary: '#F1F5F9', // Slate 100
  backgroundTertiary: '#E2E8F0', // Slate 200

  // Surfaces & Glassmorphism
  surface: '#FFFFFF',
  surfaceVariant: '#F8FAFC',
  surfaceGlass: 'rgba(255, 255, 255, 0.75)',

  // Text / Content
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textTertiary: '#64748B', // Slate 500
  textDisabled: '#94A3B8', // Slate 400
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#CBD5E1', // Slate 300
  borderFocus: '#0D9488',
  divider: '#E2E8F0',

  // Semantic Status
  success: '#10B981', // Emerald 500
  successBackground: '#D1FAE5',
  error: '#EF4444', // Red 500
  errorBackground: '#FEE2E2',
  warning: '#F59E0B', // Amber 500
  warningBackground: '#FEF3C7',
  info: '#3B82F6', // Blue 500
  infoBackground: '#DBEAFE',

  // Special Overlays
  overlay: 'rgba(15, 23, 42, 0.4)',
  scrim: 'rgba(0, 0, 0, 0.6)',
  shadow: '#0F172A',
};

export const darkColors: ColorPalette = {
  // Brand / Accent (Neon Cyber Cyan/Indigo)
  primary: '#14B8A6', // Teal 500
  primaryLight: '#2DD4BF',
  primaryDark: '#0D9488',
  secondary: '#818CF8', // Indigo 400
  secondaryLight: '#A5B4FC',
  secondaryDark: '#6366F1',
  accent: '#FBBF24', // Amber 400

  // Backgrounds (Obsidian / Deep Space)
  background: '#0B0F19', // Deep Space 950
  backgroundSecondary: '#111827', // Slate 900
  backgroundTertiary: '#1E293B', // Slate 800

  // Surfaces & Glassmorphism
  surface: '#151D2A',
  surfaceVariant: '#1E293B',
  surfaceGlass: 'rgba(21, 29, 42, 0.75)',

  // Text / Content
  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textTertiary: '#64748B', // Slate 500
  textDisabled: '#475569', // Slate 600
  textInverse: '#0F172A',

  // Borders & Dividers
  border: '#334155', // Slate 700
  borderFocus: '#14B8A6',
  divider: '#1E293B',

  // Semantic Status
  success: '#34D399', // Emerald 400
  successBackground: 'rgba(16, 185, 129, 0.15)',
  error: '#F87171', // Red 400
  errorBackground: 'rgba(239, 68, 68, 0.15)',
  warning: '#FBBF24', // Amber 400
  warningBackground: 'rgba(245, 158, 11, 0.15)',
  info: '#60A5FA', // Blue 400
  infoBackground: 'rgba(59, 130, 246, 0.15)',

  // Special Overlays
  overlay: 'rgba(0, 0, 0, 0.65)',
  scrim: 'rgba(0, 0, 0, 0.85)',
  shadow: '#000000',
};
