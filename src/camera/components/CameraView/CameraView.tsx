/**
 * OptiShare Camera Engine — CameraView Component
 *
 * Wraps react-native-vision-camera's <Camera /> with permission-denied
 * and device-not-available fallback states.
 */

import React, { forwardRef } from 'react';

import { StyleSheet, View } from 'react-native';

import { Camera, type CameraDevice, type CameraRef } from 'react-native-vision-camera';

import type { CameraFlashMode, CameraTorchMode } from '../../types/cameraTypes';

export interface CameraViewProps {
  isActive: boolean;
  device: CameraDevice | undefined;
  torch?: CameraTorchMode;
  zoom?: number;
  flash?: CameraFlashMode;
  onError?: (err: Error) => void;
  onInitialized?: () => void;
  style?: object;
  hasPermission: boolean;
  /** Fallback UI when camera is unavailable */
  fallback?: React.ReactNode;
}

export type CameraViewRef = CameraRef;

/**
 * Reusable CameraView component.
 * Forwards the ref for imperative focus/capture calls.
 */
export const CameraView = forwardRef<CameraViewRef, CameraViewProps>(
  (
    {
      isActive,
      device,
      torch = 'off',
      zoom = 1.0,
      onError,
      onInitialized,
      style,
      hasPermission,
      fallback = null,
    },
    ref,
  ) => {
    if (!hasPermission) {
      return <View style={[styles.fallback, style as object]}>{fallback}</View>;
    }

    if (!device) {
      return <View style={[styles.fallback, style as object]}>{fallback}</View>;
    }

    return (
      <Camera
        ref={ref}
        style={[styles.camera, style as object]}
        device={device}
        isActive={isActive}
        torchMode={torch}
        zoom={zoom}
        {...(onError ? { onError } : {})}
        {...(onInitialized ? { onStarted: onInitialized } : {})}
      />
    );
  },
);

CameraView.displayName = 'CameraView';

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
