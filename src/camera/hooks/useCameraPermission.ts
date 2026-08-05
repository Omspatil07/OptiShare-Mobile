/**
 * OptiShare Camera Engine — useCameraPermission Hook
 *
 * Delegates to the existing PermissionManager static methods for camera
 * permission checking and requesting.
 */

import { useCallback, useEffect, useState } from 'react';

import { PermissionManager } from '../../permissions/PermissionManager';

export type CameraPermissionStatus = 'granted' | 'denied' | 'blocked' | 'undetermined' | 'loading';

export interface UseCameraPermissionResult {
  status: CameraPermissionStatus;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useCameraPermission(): UseCameraPermissionResult {
  const [status, setStatus] = useState<CameraPermissionStatus>('loading');

  const checkPermission = useCallback(async () => {
    try {
      const result = await PermissionManager.checkCameraPermission();
      setStatus(result as CameraPermissionStatus);
    } catch {
      setStatus('denied');
    }
  }, []);

  useEffect(() => {
    checkPermission().catch(() => {});
  }, [checkPermission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await PermissionManager.requestCameraPermission();
      const granted = result === 'granted';
      setStatus(granted ? 'granted' : 'denied');
      return granted;
    } catch {
      setStatus('denied');
      return false;
    }
  }, []);

  return {
    status,
    hasPermission: status === 'granted',
    requestPermission,
  };
}
