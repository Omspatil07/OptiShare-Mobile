/**
 * OptiShare Camera Engine — CameraControls Component
 *
 * Renders torch toggle, camera switch, and zoom controls.
 */

import React from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import type { CameraPosition, CameraTorchMode } from '../../types/cameraTypes';

export interface CameraControlsProps {
  position: CameraPosition;
  torch: CameraTorchMode;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  onSwitchCamera: () => void;
  onToggleTorch: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  disabled?: boolean;
}

export function CameraControls({
  position,
  torch,
  zoom,
  minZoom = 1.0,
  maxZoom = 10.0,
  onSwitchCamera,
  onToggleTorch,
  onZoomIn,
  onZoomOut,
  disabled = false,
}: CameraControlsProps): React.JSX.Element {
  const canZoomIn = zoom < maxZoom;
  const canZoomOut = zoom > minZoom;

  return (
    <View style={styles.container} testID="camera-controls">
      {/* Torch toggle */}
      <TouchableOpacity
        accessibilityLabel={torch === 'on' ? 'Turn torch off' : 'Turn torch on'}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onToggleTorch}
        style={[styles.button, torch === 'on' && styles.buttonActive]}
        testID="torch-toggle"
      >
        <View style={styles.iconPlaceholder} />
      </TouchableOpacity>

      {/* Zoom out */}
      <TouchableOpacity
        accessibilityLabel="Zoom out"
        accessibilityRole="button"
        disabled={disabled || !canZoomOut}
        onPress={onZoomOut}
        style={[styles.button, (!canZoomOut || disabled) && styles.buttonDisabled]}
        testID="zoom-out"
      >
        <View style={styles.iconPlaceholder} />
      </TouchableOpacity>

      {/* Zoom in */}
      <TouchableOpacity
        accessibilityLabel="Zoom in"
        accessibilityRole="button"
        disabled={disabled || !canZoomIn}
        onPress={onZoomIn}
        style={[styles.button, (!canZoomIn || disabled) && styles.buttonDisabled]}
        testID="zoom-in"
      >
        <View style={styles.iconPlaceholder} />
      </TouchableOpacity>

      {/* Switch camera */}
      <TouchableOpacity
        accessibilityLabel={`Switch to ${position === 'back' ? 'front' : 'rear'} camera`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onSwitchCamera}
        style={styles.button}
        testID="switch-camera"
      >
        <View style={styles.iconPlaceholder} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: 'rgba(255,220,0,0.5)',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#FFF',
  },
});
