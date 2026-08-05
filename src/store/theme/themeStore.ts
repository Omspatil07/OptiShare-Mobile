/**
 * OptiShare Theme State Store
 *
 * Persistent store managing application theme mode ('light', 'dark', 'system').
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '../storage/storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  mode: ThemeMode;
}

export interface ThemeActions {
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

export type ThemeStore = ThemeState & ThemeActions;

const initialThemeState: ThemeState = {
  mode: 'system',
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      ...initialThemeState,
      setThemeMode: (mode) => set({ mode }),
      toggleThemeMode: () =>
        set((state) => ({
          mode: state.mode === 'dark' ? 'light' : 'dark',
        })),
    }),
    {
      name: 'optishare-theme-store',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
