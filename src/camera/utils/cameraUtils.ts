/**
 * OptiShare Camera Engine — Utility Functions
 */

import { Dimensions } from 'react-native';

import { CAMERA_ERROR_CODES, CAMERA_ZOOM_RANGE } from '../constants/cameraConstants';
import type { CameraError, CameraOrientation, FocusPoint, ZoomRange } from '../types/cameraTypes';

/**
 * Clamp a zoom value within min/max boundaries.
 */
export function clampZoom(value: number, range: ZoomRange = CAMERA_ZOOM_RANGE): number {
  return Math.max(range.min, Math.min(range.max, value));
}

/**
 * Determine device orientation from current window dimensions.
 */
export function getOrientationFromDimensions(): CameraOrientation {
  const { width, height } = Dimensions.get('window');
  return width > height ? 'landscape-left' : 'portrait';
}

/**
 * Normalise any native camera error into a structured CameraError.
 */
export function formatCameraError(err: unknown): CameraError {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('permission')) {
      return {
        code: CAMERA_ERROR_CODES.PERMISSION_DENIED,
        message: 'Camera permission was denied.',
        cause: err,
      };
    }
    if (msg.includes('device') || msg.includes('unavailable')) {
      return {
        code: CAMERA_ERROR_CODES.DEVICE_NOT_AVAILABLE,
        message: 'No camera device is available.',
        cause: err,
      };
    }
    return {
      code: CAMERA_ERROR_CODES.UNKNOWN,
      message: err.message,
      cause: err,
    };
  }
  return {
    code: CAMERA_ERROR_CODES.UNKNOWN,
    message: 'An unknown camera error occurred.',
    cause: err,
  };
}

/**
 * Validate that a focus point is within the normalised 0..1 range.
 */
export function isValidFocusPoint(point: FocusPoint): boolean {
  return point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
}

/**
 * Get a human-readable label for a camera position.
 */
export function getCameraPositionLabel(position: 'back' | 'front'): string {
  return position === 'back' ? 'Rear Camera' : 'Front Camera';
}
