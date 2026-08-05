/**
 * OptiShare Camera Engine — CameraService
 *
 * Pure service class — no React, no hooks.
 * Handles device resolution, config validation, and error normalisation.
 */

import { CAMERA_ERROR_CODES, DEFAULT_CAMERA_CONFIG } from '../constants/cameraConstants';
import type { CameraConfig, CameraError, CameraPosition } from '../types/cameraTypes';
import { formatCameraError } from '../utils/cameraUtils';

export class CameraService {
  private static instance: CameraService | null = null;

  private constructor() {}

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Validate and merge camera config with defaults.
   */
  buildConfig(overrides: Partial<CameraConfig> = {}): CameraConfig {
    return { ...DEFAULT_CAMERA_CONFIG, ...overrides };
  }

  /**
   * Validate camera position.
   */
  isValidPosition(position: string): position is CameraPosition {
    return position === 'back' || position === 'front';
  }

  /**
   * Format an error thrown during camera initialisation.
   */
  formatInitError(err: unknown): CameraError {
    const base = formatCameraError(err);
    if (base.code === CAMERA_ERROR_CODES.UNKNOWN) {
      return { ...base, code: CAMERA_ERROR_CODES.INITIALIZATION_FAILED };
    }
    return base;
  }

  /**
   * Format an error thrown during camera focus.
   */
  formatFocusError(err: unknown): CameraError {
    return {
      code: CAMERA_ERROR_CODES.FOCUS_FAILED,
      message: 'Auto-focus failed.',
      cause: err,
    };
  }

  /**
   * Return a permission-denied error.
   */
  permissionDeniedError(): CameraError {
    return {
      code: CAMERA_ERROR_CODES.PERMISSION_DENIED,
      message: 'Camera permission has not been granted.',
    };
  }

  /**
   * Return a device-not-available error.
   */
  deviceNotAvailableError(): CameraError {
    return {
      code: CAMERA_ERROR_CODES.DEVICE_NOT_AVAILABLE,
      message: 'No camera device found for the requested position.',
    };
  }
}

export const cameraService = CameraService.getInstance();
