/**
 * OptiShare Navigation - Deep Linking Configuration
 *
 * Configures future-ready deep linking for optishare:// scheme.
 */

import type { LinkingOptions } from '@react-navigation/native';

import { ROUTES } from './routes';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['optishare://', 'https://optishare.app'],
  config: {
    screens: {
      [ROUTES.SPLASH]: 'splash',
      [ROUTES.MAIN_TABS]: {
        screens: {
          [ROUTES.HOME_TAB]: 'home',
          [ROUTES.SEND_TAB]: 'send',
          [ROUTES.RECEIVE_TAB]: 'receive',
          [ROUTES.HISTORY_TAB]: 'history',
          [ROUTES.SETTINGS_TAB]: 'settings',
        },
      },
      [ROUTES.TRANSFER_PROGRESS]: 'transfer/:transferId',
      [ROUTES.ABOUT]: 'about',
      [ROUTES.PERMISSIONS]: 'permissions',
      [ROUTES.CAMERA_PREVIEW]: 'camera-preview',
      [ROUTES.FILE_PREVIEW]: 'file-preview',
    },
  },
};
