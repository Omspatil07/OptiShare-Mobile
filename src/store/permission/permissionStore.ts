/**
 * OptiShare Permission State Store
 *
 * Persistent store tracking Camera, Storage, and Notification permissions.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '../storage/storage';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionState {
  cameraPermission: PermissionStatus;
  storagePermission: PermissionStatus;
  notificationPermission: PermissionStatus;
}

export interface PermissionActions {
  setCameraPermission: (status: PermissionStatus) => void;
  setStoragePermission: (status: PermissionStatus) => void;
  setNotificationPermission: (status: PermissionStatus) => void;
  resetPermissions: () => void;
}

export type PermissionStore = PermissionState & PermissionActions;

const initialPermissionState: PermissionState = {
  cameraPermission: 'undetermined',
  storagePermission: 'undetermined',
  notificationPermission: 'undetermined',
};

export const usePermissionStore = create<PermissionStore>()(
  persist(
    (set) => ({
      ...initialPermissionState,
      setCameraPermission: (status) => set({ cameraPermission: status }),
      setStoragePermission: (status) => set({ storagePermission: status }),
      setNotificationPermission: (status) => set({ notificationPermission: status }),
      resetPermissions: () => set(initialPermissionState),
    }),
    {
      name: 'optishare-permission-store',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
