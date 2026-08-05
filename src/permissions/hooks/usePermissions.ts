/**
 * OptiShare usePermissions Custom React Hooks
 *
 * Reusable hooks for UI components to check, request, and monitor runtime permissions.
 */

import { useCallback, useState } from 'react';

import { PermissionManager } from '../PermissionManager';
import type { AppPermissionStatus } from '../types/permissionTypes';
import { navigateToAppSettings } from '../utils/permissionUtils';

export function usePermissions() {
  const [cameraStatus, setCameraStatus] = useState<AppPermissionStatus>('undetermined');
  const [storageStatus, setStorageStatus] = useState<AppPermissionStatus>('undetermined');
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkPermissions = useCallback(async () => {
    setIsChecking(true);
    const cam = await PermissionManager.checkCameraPermission();
    const store = await PermissionManager.checkStoragePermission();
    setCameraStatus(cam);
    setStorageStatus(store);
    setIsChecking(false);
  }, []);

  const requestCamera = useCallback(async (): Promise<AppPermissionStatus> => {
    const status = await PermissionManager.requestCameraPermission();
    setCameraStatus(status);
    return status;
  }, []);

  const requestStorage = useCallback(async (): Promise<AppPermissionStatus> => {
    const status = await PermissionManager.requestStoragePermission();
    setStorageStatus(status);
    return status;
  }, []);

  return {
    cameraStatus,
    storageStatus,
    isChecking,
    checkPermissions,
    requestCamera,
    requestStorage,
    openSettings: navigateToAppSettings,
  };
}
