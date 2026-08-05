/**
 * Permission Management Unit Test Suite
 *
 * Verifies PermissionService, PermissionManager, permissionUtils, and usePermissions hook.
 */

import React from 'react';

import { Platform } from 'react-native';

import ReactTestRenderer, { act } from 'react-test-renderer';

import {
  PermissionManager,
  PermissionService,
  getPlatformPermissionKey,
  isPermissionBlocked,
  isPermissionDenied,
  isPermissionGranted,
  navigateToAppSettings,
  usePermissions,
} from '../../src/permissions';
import { usePermissionStore } from '../../src/store';

function TestHookConsumer({
  onMount,
}: {
  onMount: (hookData: ReturnType<typeof usePermissions>) => void;
}): React.JSX.Element | null {
  const hookData = usePermissions();
  React.useEffect(() => {
    onMount(hookData);
  }, [hookData, onMount]);
  return null;
}

describe('OptiShare Permission Management System', () => {
  beforeEach(() => {
    usePermissionStore.getState().resetPermissions();
  });

  describe('1. Permission Utilities & Constants', () => {
    it('evaluates permission statuses correctly', () => {
      expect(isPermissionGranted('granted')).toBe(true);
      expect(isPermissionGranted('limited')).toBe(true);
      expect(isPermissionGranted('denied')).toBe(false);

      expect(isPermissionBlocked('blocked')).toBe(true);
      expect(isPermissionBlocked('granted')).toBe(false);

      expect(isPermissionDenied('denied')).toBe(true);
    });

    it('retrieves platform permission keys for Android and iOS', () => {
      const origOS = Platform.OS;

      Platform.OS = 'android';
      expect(getPlatformPermissionKey('camera')).toBeTruthy();
      expect(getPlatformPermissionKey('storage')).toBeTruthy();
      expect(getPlatformPermissionKey('photos')).toBeTruthy();
      expect(getPlatformPermissionKey('notifications')).toBeTruthy();

      Platform.OS = 'ios';
      expect(getPlatformPermissionKey('camera')).toBeTruthy();
      expect(getPlatformPermissionKey('photos')).toBeTruthy();
      expect(getPlatformPermissionKey('storage')).toBeTruthy();

      Platform.OS = origOS;
    });

    it('navigates to system settings safely', async () => {
      const result = await navigateToAppSettings();
      expect(result).toBe(true);
    });
  });

  describe('2. PermissionService', () => {
    it('checks and requests single permission via native wrapper', async () => {
      const status = await PermissionService.check('camera');
      expect(status).toBe('granted');

      const requested = await PermissionService.request('camera');
      expect(requested).toBe('granted');
    });
  });

  describe('3. PermissionManager & Zustand Integration', () => {
    it('checks camera permission and syncs status with permissionStore', async () => {
      expect(usePermissionStore.getState().cameraPermission).toBe('undetermined');

      const status = await PermissionManager.checkCameraPermission();
      expect(status).toBe('granted');
      expect(usePermissionStore.getState().cameraPermission).toBe('granted');

      const req = await PermissionManager.requestCameraPermission();
      expect(req).toBe('granted');
    });

    it('checks and requests storage permission and syncs status with permissionStore', async () => {
      expect(usePermissionStore.getState().storagePermission).toBe('undetermined');

      const checkStatus = await PermissionManager.checkStoragePermission();
      expect(checkStatus).toBe('granted');

      const reqStatus = await PermissionManager.requestStoragePermission();
      expect(reqStatus).toBe('granted');
      expect(usePermissionStore.getState().storagePermission).toBe('granted');
    });

    it('checks all app permissions in bulk', async () => {
      const all = await PermissionManager.checkAllPermissions();
      expect(all.camera).toBe('granted');
      expect(all.storage).toBe('granted');
    });
  });

  describe('4. usePermissions React Hook', () => {
    it('executes hook callbacks cleanly', async () => {
      let hookResult: ReturnType<typeof usePermissions> | null = null;

      await act(async () => {
        ReactTestRenderer.create(
          <TestHookConsumer
            onMount={(data) => {
              hookResult = data;
            }}
          />
        );
      });

      expect(hookResult).not.toBeNull();
      await act(async () => {
        await hookResult?.checkPermissions();
        await hookResult?.requestCamera();
        await hookResult?.requestStorage();
      });

      expect(hookResult?.cameraStatus).toBe('granted');
      expect(hookResult?.storageStatus).toBe('granted');
    });
  });
});
