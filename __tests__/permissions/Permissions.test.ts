/**
 * Permission Management Unit Test Suite
 *
 * Verifies PermissionService, PermissionManager, permissionUtils, and usePermissions hook.
 */

import {
  PermissionManager,
  PermissionService,
  getPlatformPermissionKey,
  isPermissionBlocked,
  isPermissionDenied,
  isPermissionGranted,
  navigateToAppSettings,
} from '../../src/permissions';
import { usePermissionStore } from '../../src/store';

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

    it('retrieves platform permission keys for camera and storage', () => {
      const cameraKey = getPlatformPermissionKey('camera');
      expect(cameraKey).toBeTruthy();

      const storageKey = getPlatformPermissionKey('storage');
      expect(storageKey).toBeTruthy();
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
    });

    it('requests storage permission and syncs status with permissionStore', async () => {
      expect(usePermissionStore.getState().storagePermission).toBe('undetermined');

      const status = await PermissionManager.requestStoragePermission();
      expect(status).toBe('granted');
      expect(usePermissionStore.getState().storagePermission).toBe('granted');
    });

    it('checks all app permissions in bulk', async () => {
      const all = await PermissionManager.checkAllPermissions();
      expect(all.camera).toBe('granted');
      expect(all.storage).toBe('granted');
    });
  });
});
