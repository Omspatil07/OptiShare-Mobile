/**
 * OptiShare — Camera Preview Screen
 *
 * Uses the Phase 8 Camera Engine to render a live camera feed
 * with torch, zoom, and camera switching controls.
 */

import React from 'react';

import { StyleSheet, Text as RNText, View } from 'react-native';

import type { CameraDevice } from 'react-native-vision-camera';

import { ROUTES } from '../../../app/navigation/routes';
import type { RootStackScreenProps } from '../../../app/navigation/types';
import {
  CameraControls,
  CameraProvider,
  CameraView,
  useCamera,
  useCameraDevices,
  useCameraPermission,
} from '../../../camera';
import { CAMERA_ZOOM_RANGE } from '../../../camera/constants/cameraConstants';
import { Button, ScreenContainer, Text, useTheme } from '../../../shared';

function CameraPreviewContent({
  navigation,
}: RootStackScreenProps<'CameraPreview'>): React.JSX.Element {
  const { theme } = useTheme();
  const { hasPermission, requestPermission, status } = useCameraPermission();
  const { isActive, position, zoom, torch, cameraRef, switchCamera, setZoom, setTorch } =
    useCamera();
  const { currentDevice } = useCameraDevices(position);

  if (status === 'loading') {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text variant="body1">Checking camera permission…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!hasPermission) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text color="secondary" style={styles.message} variant="body1">
            Camera access is required to receive files via optical transfer.
          </Text>
          <Button
            fullWidth={true}
            onPress={() => {
              requestPermission().catch(() => {});
            }}
            style={styles.permissionButton}
            title="Grant Camera Permission"
            variant="primary"
          />
          <Button
            fullWidth={true}
            onPress={() => navigation.goBack()}
            style={styles.marginTop}
            title="Go Back"
            variant="ghost"
          />
        </View>
      </ScreenContainer>
    );
  }

  // CameraDevice may be undefined if no device is found — handle gracefully
  const safeDevice: CameraDevice | undefined = currentDevice ?? undefined;

  return (
    <View style={styles.root}>
      {/* Camera feed */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          device={safeDevice}
          flash="off"
          hasPermission={hasPermission}
          isActive={isActive}
          style={styles.camera}
          torch={torch}
          zoom={zoom}
          fallback={
            <View style={[styles.noDevice, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <RNText style={[styles.noDeviceText, { color: theme.colors.textSecondary }]}>
                No camera device found
              </RNText>
            </View>
          }
          onError={(err) => console.warn('[CameraPreview] error:', err.message)}
        />
      </View>

      {/* Controls */}
      <CameraControls
        maxZoom={CAMERA_ZOOM_RANGE.max}
        minZoom={CAMERA_ZOOM_RANGE.min}
        position={position}
        torch={torch}
        zoom={zoom}
        onSwitchCamera={switchCamera}
        onToggleTorch={() => setTorch(torch === 'off' ? 'on' : 'off')}
        onZoomIn={() => setZoom(zoom + 0.5)}
        onZoomOut={() => setZoom(zoom - 0.5)}
      />

      {/* Action bar */}
      <View style={styles.actions}>
        <Button
          fullWidth={true}
          onPress={() => navigation.navigate(ROUTES.TRANSFER_PROGRESS, { role: 'receiver' })}
          title="Simulate Stream Locked"
          variant="primary"
        />
        <Button
          fullWidth={true}
          onPress={() => navigation.goBack()}
          style={styles.marginTop}
          title="Close Camera"
          variant="ghost"
        />
      </View>
    </View>
  );
}

export function CameraPreviewScreen(
  props: RootStackScreenProps<'CameraPreview'>,
): React.JSX.Element {
  return (
    <CameraProvider autoActivate={true}>
      <CameraPreviewContent {...props} />
    </CameraProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionButton: {
    marginTop: 8,
  },
  marginTop: {
    marginTop: 8,
  },
  noDevice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDeviceText: {
    fontSize: 14,
  },
  actions: {
    padding: 16,
    backgroundColor: '#000',
  },
});
