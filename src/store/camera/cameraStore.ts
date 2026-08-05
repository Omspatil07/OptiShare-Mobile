/**
 * OptiShare Camera State Store
 *
 * Tracks camera active status, position, exposure, zoom, flash, torch,
 * orientation, and alignment quality.
 */

import { create } from 'zustand';

import type {
  CameraFlashMode,
  CameraOrientation,
  CameraPosition,
  CameraTorchMode,
} from '../../camera/types/cameraTypes';

export interface CameraState {
  isActive: boolean;
  position: CameraPosition;
  zoomLevel: number;
  exposureValue: number;
  isFlashOn: boolean;
  flashMode: CameraFlashMode;
  torchMode: CameraTorchMode;
  orientation: CameraOrientation;
  isAligned: boolean;
  alignmentQualityScore: number;
  detectedFps: number;
}

export interface CameraActions {
  setCameraActive: (active: boolean) => void;
  setCameraPosition: (position: CameraPosition) => void;
  setZoomLevel: (zoom: number) => void;
  setExposureValue: (exposure: number) => void;
  toggleFlash: () => void;
  setFlashMode: (mode: CameraFlashMode) => void;
  setTorchMode: (mode: CameraTorchMode) => void;
  setOrientation: (orientation: CameraOrientation) => void;
  setAlignment: (aligned: boolean, score: number) => void;
  setDetectedFps: (fps: number) => void;
  resetCameraState: () => void;
}

export type CameraStore = CameraState & CameraActions;

const initialCameraState: CameraState = {
  isActive: false,
  position: 'back',
  zoomLevel: 1.0,
  exposureValue: 0,
  isFlashOn: false,
  flashMode: 'off',
  torchMode: 'off',
  orientation: 'portrait',
  isAligned: false,
  alignmentQualityScore: 0,
  detectedFps: 0,
};

export const useCameraStore = create<CameraStore>((set) => ({
  ...initialCameraState,
  setCameraActive: (active) => set({ isActive: active }),
  setCameraPosition: (position) => set({ position }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setExposureValue: (exposure) => set({ exposureValue: exposure }),
  toggleFlash: () =>
    set((state) => ({
      isFlashOn: !state.isFlashOn,
      flashMode: state.flashMode === 'off' ? 'on' : 'off',
    })),
  setFlashMode: (mode) => set({ flashMode: mode, isFlashOn: mode !== 'off' }),
  setTorchMode: (mode) => set({ torchMode: mode }),
  setOrientation: (orientation) => set({ orientation }),
  setAlignment: (aligned, score) => set({ isAligned: aligned, alignmentQualityScore: score }),
  setDetectedFps: (fps) => set({ detectedFps: fps }),
  resetCameraState: () => set(initialCameraState),
}));
