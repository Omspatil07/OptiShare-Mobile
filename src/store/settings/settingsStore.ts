/**
 * OptiShare Settings State Store
 *
 * Persistent store for application preferences and optical parameters.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '../storage/storage';

export interface SettingsState {
  targetFps: number;
  screenBrightness: number;
  enableVibration: boolean;
  enableSoundEffects: boolean;
  saveFolderPath: string;
  maxChunkSizeKb: number;
}

export interface SettingsActions {
  setTargetFps: (fps: number) => void;
  setScreenBrightness: (brightness: number) => void;
  toggleVibration: () => void;
  toggleSoundEffects: () => void;
  setSaveFolderPath: (path: string) => void;
  setMaxChunkSizeKb: (sizeKb: number) => void;
  resetSettings: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

const initialSettingsState: SettingsState = {
  targetFps: 60,
  screenBrightness: 1.0,
  enableVibration: true,
  enableSoundEffects: true,
  saveFolderPath: '/storage/emulated/0/Download/OptiShare',
  maxChunkSizeKb: 64,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialSettingsState,
      setTargetFps: (fps) => set({ targetFps: fps }),
      setScreenBrightness: (brightness) => set({ screenBrightness: brightness }),
      toggleVibration: () => set((state) => ({ enableVibration: !state.enableVibration })),
      toggleSoundEffects: () => set((state) => ({ enableSoundEffects: !state.enableSoundEffects })),
      setSaveFolderPath: (path) => set({ saveFolderPath: path }),
      setMaxChunkSizeKb: (sizeKb) => set({ maxChunkSizeKb: sizeKb }),
      resetSettings: () => set(initialSettingsState),
    }),
    {
      name: 'optishare-settings-store',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
