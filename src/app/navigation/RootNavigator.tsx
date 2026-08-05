/**
 * OptiShare Navigation - Root Native Stack Navigator
 */

import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from './routes';
import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';
import { PermissionsScreen } from '../../features/home/screens/PermissionsScreen';
import { SplashScreen } from '../../features/home/screens/SplashScreen';
import { CameraPreviewScreen } from '../../features/receive/screens/CameraPreviewScreen';
import { FilePreviewScreen } from '../../features/send/screens/FilePreviewScreen';
import { TransferProgressScreen } from '../../features/send/screens/TransferProgressScreen';
import { AboutScreen } from '../../features/settings/screens/AboutScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.SPLASH}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen component={SplashScreen} name={ROUTES.SPLASH} />
      <Stack.Screen component={TabNavigator} name={ROUTES.MAIN_TABS} />
      <Stack.Screen
        component={TransferProgressScreen}
        name={ROUTES.TRANSFER_PROGRESS}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen component={AboutScreen} name={ROUTES.ABOUT} />
      <Stack.Screen component={PermissionsScreen} name={ROUTES.PERMISSIONS} />
      <Stack.Screen component={CameraPreviewScreen} name={ROUTES.CAMERA_PREVIEW} />
      <Stack.Screen component={FilePreviewScreen} name={ROUTES.FILE_PREVIEW} />
    </Stack.Navigator>
  );
}
