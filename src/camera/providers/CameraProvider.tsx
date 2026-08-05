/**
 * OptiShare Camera Engine — CameraProvider
 *
 * React context that provides a stable CameraManager instance
 * and handles camera activation/deactivation on mount/unmount.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { useCameraStore } from '../../store/camera/cameraStore';
import { CameraManager, type CameraRef } from '../managers/CameraManager';
import type {
  CameraFlashMode,
  CameraPosition,
  CameraTorchMode,
  FocusPoint,
} from '../types/cameraTypes';

export interface CameraContextValue {
  manager: CameraManager;
  cameraRef: React.MutableRefObject<CameraRef | null>;
  position: CameraPosition;
  isActive: boolean;
  zoom: number;
  torch: CameraTorchMode;
  flash: CameraFlashMode;
  switchCamera: () => void;
  setZoom: (level: number) => void;
  setTorch: (mode: CameraTorchMode) => void;
  setFlash: (mode: CameraFlashMode) => void;
  focus: (point: FocusPoint) => Promise<void>;
}

const CameraContext = createContext<CameraContextValue | null>(null);

export interface CameraProviderProps {
  children: React.ReactNode;
  autoActivate?: boolean;
}

export function CameraProvider({
  children,
  autoActivate = true,
}: CameraProviderProps): React.JSX.Element {
  const store = useCameraStore();
  const cameraRef = useRef<CameraRef | null>(null);

  const manager = useMemo(() => {
    const m = new CameraManager({
      setCameraActive: store.setCameraActive,
      setCameraPosition: store.setCameraPosition,
      setZoomLevel: store.setZoomLevel,
      setFlashMode: store.setFlashMode,
      setTorchMode: store.setTorchMode,
      resetCameraState: store.resetCameraState,
    });
    m.attachRef(cameraRef);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoActivate) {
      manager.activate();
    }
    return () => {
      manager.deactivate();
    };
  }, [manager, autoActivate]);

  const switchCamera = useCallback(() => {
    manager.switchCamera(store.position);
  }, [manager, store.position]);

  const setZoom = useCallback(
    (level: number) => {
      manager.setZoom(level);
    },
    [manager],
  );

  const setTorch = useCallback(
    (mode: CameraTorchMode) => {
      manager.setTorch(mode);
    },
    [manager],
  );

  const setFlash = useCallback(
    (mode: CameraFlashMode) => {
      manager.setFlash(mode);
    },
    [manager],
  );

  const focus = useCallback((point: FocusPoint) => manager.focus(point), [manager]);

  const value = useMemo<CameraContextValue>(
    () => ({
      manager,
      cameraRef,
      position: store.position,
      isActive: store.isActive,
      zoom: store.zoomLevel,
      torch: store.torchMode,
      flash: store.flashMode,
      switchCamera,
      setZoom,
      setTorch,
      setFlash,
      focus,
    }),
    [
      manager,
      cameraRef,
      store.position,
      store.isActive,
      store.zoomLevel,
      store.torchMode,
      store.flashMode,
      switchCamera,
      setZoom,
      setTorch,
      setFlash,
      focus,
    ],
  );

  return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>;
}

/** Hook to consume CameraContext — must be used inside CameraProvider */
export function useCameraContext(): CameraContextValue {
  const ctx = useContext(CameraContext);
  if (!ctx) {
    throw new Error('useCameraContext must be used within a <CameraProvider>');
  }
  return ctx;
}
