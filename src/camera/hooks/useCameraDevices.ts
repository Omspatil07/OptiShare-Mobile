/**
 * OptiShare Camera Engine — useCameraDevices Hook
 *
 * Wraps react-native-vision-camera's useCameraDevice to provide
 * front and back device references with safe null handling.
 */

import { useCameraDevice } from 'react-native-vision-camera';

import type { CameraPosition } from '../types/cameraTypes';

export interface UseCameraDevicesResult {
  backDevice: ReturnType<typeof useCameraDevice>;
  frontDevice: ReturnType<typeof useCameraDevice>;
  currentDevice: ReturnType<typeof useCameraDevice>;
}

export function useCameraDevices(position: CameraPosition = 'back'): UseCameraDevicesResult {
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const currentDevice = position === 'back' ? backDevice : frontDevice;

  return { backDevice, frontDevice, currentDevice };
}
