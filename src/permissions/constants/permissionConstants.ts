/**
 * OptiShare Permission Constants & Platform Mappings
 */

import { Platform } from 'react-native';

import { PERMISSIONS } from 'react-native-permissions';

import type { AppPermissionType } from '../types/permissionTypes';

export function getPlatformPermissionKey(type: AppPermissionType): string | null {
  if (Platform.OS === 'android') {
    const androidPermissions = PERMISSIONS.ANDROID as Record<string, string>;
    switch (type) {
      case 'camera':
        return PERMISSIONS.ANDROID.CAMERA || 'android.permission.CAMERA';
      case 'storage':
        return (
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE || 'android.permission.READ_EXTERNAL_STORAGE'
        );
      case 'photos':
        return (
          androidPermissions.READ_MEDIA_IMAGES ||
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE ||
          'android.permission.READ_MEDIA_IMAGES'
        );
      case 'notifications':
        return androidPermissions.POST_NOTIFICATIONS || 'android.permission.POST_NOTIFICATIONS';
      default:
        return null;
    }
  } else if (Platform.OS === 'ios') {
    switch (type) {
      case 'camera':
        return PERMISSIONS.IOS.CAMERA || 'ios.permission.CAMERA';
      case 'photos':
      case 'storage':
        return PERMISSIONS.IOS.PHOTO_LIBRARY || 'ios.permission.PHOTO_LIBRARY';
      default:
        return null;
    }
  }
  return null;
}
