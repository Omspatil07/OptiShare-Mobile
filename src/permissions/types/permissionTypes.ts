/**
 * OptiShare Permission Management - Type Definitions
 */

export type AppPermissionType = 'camera' | 'storage' | 'photos' | 'notifications';

export type AppPermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable'
  | 'limited'
  | 'undetermined';

export interface PermissionCheckResult {
  permission: AppPermissionType;
  status: AppPermissionStatus;
}

export interface MultiplePermissionsResult {
  [key: string]: AppPermissionStatus;
}
