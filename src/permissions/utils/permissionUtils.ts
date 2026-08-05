/**
 * OptiShare Permission Utilities
 */

import { openSettings as RNPopenSettings } from 'react-native-permissions';

import type { AppPermissionStatus } from '../types/permissionTypes';

export function isPermissionGranted(status: AppPermissionStatus): boolean {
  return status === 'granted' || status === 'limited';
}

export function isPermissionBlocked(status: AppPermissionStatus): boolean {
  return status === 'blocked';
}

export function isPermissionDenied(status: AppPermissionStatus): boolean {
  return status === 'denied';
}

export async function navigateToAppSettings(): Promise<boolean> {
  try {
    await RNPopenSettings();
    return true;
  } catch {
    return false;
  }
}
