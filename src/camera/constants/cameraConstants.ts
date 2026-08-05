/**
 * OptiShare Camera Engine — Constants
 */

import type { CameraConfig, ZoomRange } from '../types/cameraTypes';

/** Default zoom constraints */
export const CAMERA_ZOOM_RANGE: ZoomRange = {
  min: 1.0,
  max: 10.0,
  default: 1.0,
};

/** Default frame processor resolution target (px) */
export const FRAME_PROCESSOR_RESOLUTION = {
  width: 1280,
  height: 720,
} as const;

/** Default camera initialisation config */
export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  position: 'back',
  torch: 'off',
  flash: 'off',
  zoom: CAMERA_ZOOM_RANGE.default,
  enableFrameProcessor: false,
};

/** Camera error codes */
export const CAMERA_ERROR_CODES = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DEVICE_NOT_AVAILABLE: 'DEVICE_NOT_AVAILABLE',
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  FOCUS_FAILED: 'FOCUS_FAILED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type CameraErrorCode = (typeof CAMERA_ERROR_CODES)[keyof typeof CAMERA_ERROR_CODES];
