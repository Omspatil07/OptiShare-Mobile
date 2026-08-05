/**
 * OptiShare Design System - Theme Context & Provider
 *
 * Provides theme state, light/dark mode toggling, and hook access.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useColorScheme as useRNColorScheme } from 'react-native';

import type { Theme, ThemeMode} from './theme';
import { darkTheme, lightTheme } from './theme';

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

export function ThemeProvider({
  children,
  initialMode = 'system',
}: ThemeProviderProps): React.JSX.Element {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialMode);

  const isDarkMode = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const theme = useMemo(() => {
    return isDarkMode ? darkTheme : lightTheme;
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDarkMode,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, isDarkMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return fallback lightTheme if used outside provider
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
