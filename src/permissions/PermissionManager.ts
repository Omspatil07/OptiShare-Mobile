/**
 * OptiShare PermissionManager
 *
 * High-level permission orchestrator integrating PermissionService with Zustand permissionStore.
 */

import { usePermissionStore } from '../store';
import { PermissionService } from './PermissionService';
import type { AppPermissionStatus, AppPermissionType } from './types/permissionTypes';

export class PermissionManager {
  public static async checkCameraPermission(): Promise<AppPermissionStatus> {
    const status = await PermissionService.check('camera');
    usePermissionStore
      .getState()
      .setCameraPermission(
        status === 'granted' ? 'granted' : status === 'blocked' ? 'denied' : 'undetermined',
      );
    return status;
  }

  public static async requestCameraPermission(): Promise<AppPermissionStatus> {
    const status = await PermissionService.request('camera');
    usePermissionStore
      .getState()
      .setCameraPermission(
        status === 'granted' ? 'granted' : status === 'blocked' ? 'denied' : 'undetermined',
      );
    return status;
  }

  public static async checkStoragePermission(): Promise<AppPermissionStatus> {
    const status = await PermissionService.check('storage');
    usePermissionStore
      .getState()
      .setStoragePermission(
        status === 'granted' ? 'granted' : status === 'blocked' ? 'denied' : 'undetermined',
      );
    return status;
  }

  public static async requestStoragePermission(): Promise<AppPermissionStatus> {
    const status = await PermissionService.request('storage');
    usePermissionStore
      .getState()
      .setStoragePermission(
        status === 'granted' ? 'granted' : status === 'blocked' ? 'denied' : 'undetermined',
      );
    return status;
  }

  public static async checkAllPermissions(): Promise<
    Record<AppPermissionType, AppPermissionStatus>
  > {
    const camera = await this.checkCameraPermission();
    const storage = await this.checkStoragePermission();
    const photos = await PermissionService.check('photos');
    const notifications = await PermissionService.check('notifications');

    return {
      camera,
      storage,
      photos,
      notifications,
    };
  }
}
