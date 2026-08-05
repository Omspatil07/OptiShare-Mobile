/**
 * OptiShare Store Selectors
 *
 * Provides granular selectors to minimize component re-renders.
 */

import type { AppStore } from '../app/appStore';
import type { CameraStore } from '../camera/cameraStore';
import type { FileStore } from '../file/fileStore';
import type { HistoryRecord, HistoryStore } from '../history/historyStore';
import type { PermissionStore } from '../permission/permissionStore';
import type { SettingsStore } from '../settings/settingsStore';
import type { ThemeStore } from '../theme/themeStore';
import type { TransferStore } from '../transfer/transferStore';

// App Selectors
export const selectIsAppReady = (state: AppStore): boolean => state.isReady;
export const selectActiveModal = (state: AppStore): string | null => state.activeModal;

// Settings Selectors
export const selectTargetFps = (state: SettingsStore): number => state.targetFps;
export const selectSaveFolderPath = (state: SettingsStore): string => state.saveFolderPath;

// Transfer Selectors
export const selectTransferProgress = (state: TransferStore): number => state.progressPercentage;
export const selectTransferStatus = (state: TransferStore): string => state.status;
export const selectIsTransferring = (state: TransferStore): boolean =>
  state.status === 'transferring';

// File Selectors
export const selectSelectedFiles = (state: FileStore) => state.selectedFiles;
export const selectTotalSizeBytes = (state: FileStore): number => state.totalSizeBytes;

// Permission Selectors
export const selectHasCameraPermission = (state: PermissionStore): boolean =>
  state.cameraPermission === 'granted';
export const selectHasStoragePermission = (state: PermissionStore): boolean =>
  state.storagePermission === 'granted';

// Camera Selectors
export const selectIsCameraActive = (state: CameraStore): boolean => state.isActive;
export const selectIsCameraAligned = (state: CameraStore): boolean => state.isAligned;

// History Selectors
export const selectFilteredHistory = (state: HistoryStore): HistoryRecord[] => {
  const { records, searchQuery, filterRole } = state;
  return records.filter((record) => {
    const matchesQuery = record.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || record.role === filterRole;
    return matchesQuery && matchesRole;
  });
};

// Theme Selectors
export const selectThemeMode = (state: ThemeStore) => state.mode;
