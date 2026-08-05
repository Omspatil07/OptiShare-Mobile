/**
 * OptiShare Permission Constants & Platform Mappings
 */

import { Platform } from 'react-native';

import { PERMISSIONS } from 'react-native-permissions';

import type { AppPermissionType } from '../types/permissionTypes';

// Provide a typed index-accessible reference for Android permissions
// that only exist in newer API levels (READ_MEDIA_IMAGES, POST_NOTIFICATIONS).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ANDROID_EXT_PERMS = PERMISSIONS.ANDROID as any;

export function getPlatformPermissionKey(type: AppPermissionType): string | null {
  if (Platform.OS === 'android') {
    switch (type) {
      case 'camera':
        return PERMISSIONS.ANDROID.CAMERA || 'android.permission.CAMERA';
      case 'storage':
        return (
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE || 'android.permission.READ_EXTERNAL_STORAGE'
        );

      case 'photos':
        return (
          (ANDROID_EXT_PERMS.READ_MEDIA_IMAGES as string | undefined) ||
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE ||
          'android.permission.READ_MEDIA_IMAGES'
        );
      case 'notifications':
        return (
          (ANDROID_EXT_PERMS.POST_NOTIFICATIONS as string | undefined) ||
          'android.permission.POST_NOTIFICATIONS'
        );
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
