/**
 * OptiShare Navigation - Type Definitions
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ROUTES } from './routes';

export type TabParamList = {
  [ROUTES.HOME_TAB]: undefined;
  [ROUTES.SEND_TAB]: undefined;
  [ROUTES.RECEIVE_TAB]: undefined;
  [ROUTES.HISTORY_TAB]: undefined;
  [ROUTES.SETTINGS_TAB]: undefined;
};

export type RootStackParamList = {
  [ROUTES.SPLASH]: undefined;
  [ROUTES.MAIN_TABS]: NavigatorScreenParams<TabParamList> | undefined;
  [ROUTES.TRANSFER_PROGRESS]: { transferId?: string; role?: 'sender' | 'receiver' } | undefined;
  [ROUTES.ABOUT]: undefined;
  [ROUTES.PERMISSIONS]: undefined;
  [ROUTES.CAMERA_PREVIEW]: undefined;
  [ROUTES.FILE_PREVIEW]: { fileName?: string; fileSize?: number } | undefined;
};

// Root Stack Screen Props
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

// Bottom Tab Screen Props (composite with RootStack)
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-object-type */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
/* eslint-enable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-object-type */
