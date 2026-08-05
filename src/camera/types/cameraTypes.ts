/**
 * OptiShare Camera Engine — Type Definitions
 */

/** Camera facing position */
export type CameraPosition = 'back' | 'front';

/** Flash mode for photo capture */
export type CameraFlashMode = 'off' | 'on' | 'auto';

/** Torch (continuous light) mode */
export type CameraTorchMode = 'off' | 'on';

/** Camera orientation */
export type CameraOrientation =
  | 'portrait'
  | 'landscape-left'
  | 'landscape-right'
  | 'portrait-upside-down';

/** Structured camera error */
export interface CameraError {
  code: string;
  message: string;
  cause?: unknown;
}

/** Normalised camera device info */
export interface CameraDeviceInfo {
  id: string;
  name: string;
  position: CameraPosition;
  hasFlash: boolean;
  hasTorch: boolean;
  minZoom: number;
  maxZoom: number;
  neutralZoom: number;
  supportsRawCapture: boolean;
}

/** Camera initialisation config */
export interface CameraConfig {
  position: CameraPosition;
  torch: CameraTorchMode;
  flash: CameraFlashMode;
  zoom: number;
  enableFrameProcessor: boolean;
}

/** 2-D focus / tap point, normalised 0..1 */
export interface FocusPoint {
  x: number;
  y: number;
}

/** Zoom boundaries */
export interface ZoomRange {
  min: number;
  max: number;
  default: number;
}

/** Camera state snapshot */
export interface CameraSnapshot {
  position: CameraPosition;
  isActive: boolean;
  zoom: number;
  torch: CameraTorchMode;
  flash: CameraFlashMode;
  orientation: CameraOrientation;
}
