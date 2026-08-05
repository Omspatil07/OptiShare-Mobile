/**
 * OptiShare Navigation - Route Name Constants
 */

export const ROUTES = {
  // Stack Screens
  SPLASH: 'Splash',
  MAIN_TABS: 'MainTabs',
  TRANSFER_PROGRESS: 'TransferProgress',
  ABOUT: 'About',
  PERMISSIONS: 'Permissions',
  CAMERA_PREVIEW: 'CameraPreview',
  FILE_PREVIEW: 'FilePreview',

  // Bottom Tabs
  HOME_TAB: 'HomeTab',
  SEND_TAB: 'SendTab',
  RECEIVE_TAB: 'ReceiveTab',
  HISTORY_TAB: 'HistoryTab',
  SETTINGS_TAB: 'SettingsTab',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = (typeof ROUTES)[RouteKey];
