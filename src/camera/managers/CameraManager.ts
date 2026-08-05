/**
 * OptiShare Camera Engine — CameraManager
 *
 * Orchestrates the CameraService and CameraStore.
 * Provides activation, switching, zoom, flash, torch, focus, and orientation handling.
 */

import type { MutableRefObject } from 'react';

import type { CameraRef } from 'react-native-vision-camera';

import { CAMERA_ZOOM_RANGE } from '../constants/cameraConstants';
import { cameraService } from '../services/CameraService';
import type {
  CameraError,
  CameraFlashMode,
  CameraTorchMode,
  FocusPoint,
} from '../types/cameraTypes';
import { clampZoom, formatCameraError, isValidFocusPoint } from '../utils/cameraUtils';

export type { CameraRef };

/** Store slice CameraManager depends on */
export interface CameraStoreSlice {
  setCameraActive: (active: boolean) => void;
  setCameraPosition: (position: 'back' | 'front') => void;
  setZoomLevel: (zoom: number) => void;
  setFlashMode: (mode: CameraFlashMode) => void;
  setTorchMode: (mode: CameraTorchMode) => void;
  resetCameraState: () => void;
}

export class CameraManager {
  private readonly store: CameraStoreSlice;
  private cameraRef: MutableRefObject<CameraRef | null> | null = null;
  private lastError: CameraError | null = null;

  constructor(store: CameraStoreSlice) {
    this.store = store;
  }

  /** Attach the imperative camera ref from the CameraView component */
  attachRef(ref: MutableRefObject<CameraRef | null>): void {
    this.cameraRef = ref;
  }

  /** Activate the camera */
  activate(): void {
    this.store.setCameraActive(true);
  }

  /** Deactivate and reset the camera */
  deactivate(): void {
    this.store.setCameraActive(false);
  }

  /** Toggle between front and back camera */
  switchCamera(currentPosition: 'back' | 'front'): void {
    const next = currentPosition === 'back' ? 'front' : 'back';
    this.store.setCameraPosition(next);
  }

  /** Set zoom within bounds */
  setZoom(value: number): void {
    const clamped = clampZoom(value, CAMERA_ZOOM_RANGE);
    this.store.setZoomLevel(clamped);
  }

  /** Increment zoom by a delta */
  adjustZoom(delta: number, current: number): void {
    this.setZoom(current + delta);
  }

  /** Set flash mode */
  setFlash(mode: CameraFlashMode): void {
    this.store.setFlashMode(mode);
  }

  /** Set torch mode */
  setTorch(mode: CameraTorchMode): void {
    this.store.setTorchMode(mode);
  }

  /** Toggle torch on/off */
  toggleTorch(current: CameraTorchMode): void {
    this.setTorch(current === 'off' ? 'on' : 'off');
  }

  /** Trigger auto-focus at a normalised point */
  async focus(point: FocusPoint): Promise<void> {
    if (!isValidFocusPoint(point)) {
      this.lastError = { code: 'FOCUS_FAILED', message: 'Invalid focus point coordinates.' };
      return;
    }
    const ref = this.cameraRef?.current;
    if (!ref) {
      this.lastError = { code: 'FOCUS_FAILED', message: 'Camera ref is not attached.' };
      return;
    }
    try {
      if ('focusTo' in ref && typeof ref.focusTo === 'function') {
        await ref.focusTo({ x: point.x, y: point.y });
      } else if (
        'focus' in (ref as unknown as Record<string, unknown>) &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (ref as any).focus === 'function'
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (ref as any).focus({ x: point.x, y: point.y });
      }
      this.lastError = null;
    } catch (err) {
      this.lastError = cameraService.formatFocusError(err);
    }
  }

  /** Handle a native camera error */
  handleError(err: unknown): CameraError {
    const formatted = formatCameraError(err);
    this.lastError = formatted;
    return formatted;
  }

  /** Return the last recorded error */
  getLastError(): CameraError | null {
    return this.lastError;
  }

  /** Reset camera state fully */
  reset(): void {
    this.lastError = null;
    this.store.resetCameraState();
  }
}
