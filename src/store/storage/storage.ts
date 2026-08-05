/**
 * OptiShare Storage Adapter for Zustand Persistence
 *
 * Uses MMKV for high-performance synchronous native storage on devices,
 * with an in-memory fallback adapter for Jest unit testing environments.
 */

import type { StateStorage } from 'zustand/middleware';

let mmkvStorage: StateStorage | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MMKV } = require('react-native-mmkv');
  const storageInstance = new MMKV({ id: 'optishare-app-storage' });
  mmkvStorage = {
    getItem: (name: string): string | null => storageInstance.getString(name) ?? null,
    setItem: (name: string, value: string): void => storageInstance.set(name, value),
    removeItem: (name: string): void => storageInstance.delete(name),
  };
} catch {
  // Fallback to in-memory storage engine for Jest / non-native environments
  const memoryStorage = new Map<string, string>();
  mmkvStorage = {
    getItem: (name: string): string | null => memoryStorage.get(name) ?? null,
    setItem: (name: string, value: string): void => {
      memoryStorage.set(name, value);
    },
    removeItem: (name: string): void => {
      memoryStorage.delete(name);
    },
  };
}

export const zustandStorage: StateStorage = mmkvStorage;
