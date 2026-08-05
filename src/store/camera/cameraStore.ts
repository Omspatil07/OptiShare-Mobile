/**
 * OptiShare Camera State Store
 *
 * Tracks camera active status, exposure, zoom, flash, and alignment quality.
 */

import { create } from 'zustand';

export interface CameraState {
  isActive: boolean;
  zoomLevel: number;
  exposureValue: number;
  isFlashOn: boolean;
  isAligned: boolean;
  alignmentQualityScore: number;
  detectedFps: number;
}

export interface CameraActions {
  setCameraActive: (active: boolean) => void;
  setZoomLevel: (zoom: number) => void;
  setExposureValue: (exposure: number) => void;
  toggleFlash: () => void;
  setAlignment: (aligned: boolean, score: number) => void;
  setDetectedFps: (fps: number) => void;
  resetCameraState: () => void;
}

export type CameraStore = CameraState & CameraActions;

const initialCameraState: CameraState = {
  isActive: false,
  zoomLevel: 1.0,
  exposureValue: 0,
  isFlashOn: false,
  isAligned: false,
  alignmentQualityScore: 0,
  detectedFps: 0,
};

export const useCameraStore = create<CameraStore>((set) => ({
  ...initialCameraState,
  setCameraActive: (active) => set({ isActive: active }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setExposureValue: (exposure) => set({ exposureValue: exposure }),
  toggleFlash: () => set((state) => ({ isFlashOn: !state.isFlashOn })),
  setAlignment: (aligned, score) => set({ isAligned: aligned, alignmentQualityScore: score }),
  setDetectedFps: (fps) => set({ detectedFps: fps }),
  resetCameraState: () => set(initialCameraState),
}));
