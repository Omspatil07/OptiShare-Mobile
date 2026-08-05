/**
 * OptiShare Navigation - Navigation Reference Helpers
 *
 * Provides global navigation helper functions without prop drilling.
 */

import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName],
): void {
  if (navigationRef.isReady()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigationRef.navigate(name as any, params as any);
  }
}

export function goBack(): void {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function reset(routeName: keyof RootStackParamList, params?: object): void {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      routes: [{ name: routeName as string, params: params as any }],
    });
  }
}
