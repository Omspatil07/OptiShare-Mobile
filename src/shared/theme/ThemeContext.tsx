/**
 * OptiShare Design System - Theme Context & Provider
 *
 * Provides theme state, light/dark mode toggling, and persistent Zustand theme store access.
 */

import React, { createContext, useCallback, useContext, useMemo } from 'react';

import { useColorScheme as useRNColorScheme } from 'react-native';

import type { Theme, ThemeMode } from './theme';
import { darkTheme, lightTheme } from './theme';
import { useThemeStore } from '../../store/theme/themeStore';

export interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const systemColorScheme = useRNColorScheme();
  const themeMode = useThemeStore((state) => state.mode);
  const storeSetThemeMode = useThemeStore((state) => state.setThemeMode);
  const storeToggleTheme = useThemeStore((state) => state.toggleThemeMode);

  const isDarkMode = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const theme = useMemo(() => {
    return isDarkMode ? darkTheme : lightTheme;
  }, [isDarkMode]);

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      storeSetThemeMode(mode);
    },
    [storeSetThemeMode],
  );

  const toggleTheme = useCallback(() => {
    storeToggleTheme();
  }, [storeToggleTheme]);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDarkMode,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, isDarkMode, setThemeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: lightTheme,
      themeMode: 'light',
      isDarkMode: false,
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
