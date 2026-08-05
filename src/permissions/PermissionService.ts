/**
 * OptiShare PermissionService
 *
 * Low-level service interfacing with react-native-permissions native APIs.
 */

import { check, request, RESULTS } from 'react-native-permissions';

import { getPlatformPermissionKey } from './constants/permissionConstants';
import type { AppPermissionStatus, AppPermissionType } from './types/permissionTypes';

export class PermissionService {
  private static mapResultToAppStatus(result: string): AppPermissionStatus {
    switch (result) {
      case RESULTS.GRANTED:
        return 'granted';
      case RESULTS.LIMITED:
        return 'limited';
      case RESULTS.BLOCKED:
        return 'blocked';
      case RESULTS.DENIED:
        return 'denied';
      case RESULTS.UNAVAILABLE:
      default:
        return 'unavailable';
    }
  }

  public static async check(type: AppPermissionType): Promise<AppPermissionStatus> {
    const key = getPlatformPermissionKey(type);
    if (!key) {
      return 'granted'; // Fallback if no specific native key required
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await check(key as any);
      return this.mapResultToAppStatus(result);
    } catch {
      return 'unavailable';
    }
  }

  public static async request(type: AppPermissionType): Promise<AppPermissionStatus> {
    const key = getPlatformPermissionKey(type);
    if (!key) {
      return 'granted';
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await request(key as any);
      return this.mapResultToAppStatus(result);
    } catch {
      return 'unavailable';
    }
  }
}
