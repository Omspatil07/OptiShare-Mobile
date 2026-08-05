/**
 * Camera Engine Unit Tests — Phase 8
 *
 * Tests pure utility functions, CameraService, CameraManager,
 * useCameraPermission hook, and CameraView / CameraControls components.
 */

import React from 'react';

import ReactTestRenderer, { act } from 'react-test-renderer';

import { CameraControls } from '../../src/camera/components/CameraControls/CameraControls';
import { CameraView } from '../../src/camera/components/CameraView/CameraView';
import { CAMERA_ERROR_CODES, CAMERA_ZOOM_RANGE } from '../../src/camera/constants/cameraConstants';
import { useCameraPermission } from '../../src/camera/hooks/useCameraPermission';
import { CameraManager } from '../../src/camera/managers/CameraManager';
import { cameraService } from '../../src/camera/services/CameraService';
import type { CameraFlashMode, CameraTorchMode } from '../../src/camera/types/cameraTypes';
import {
  clampZoom,
  formatCameraError,
  getCameraPositionLabel,
  isValidFocusPoint,
} from '../../src/camera/utils/cameraUtils';

// ─── cameraUtils ────────────────────────────────────────────────────────────

describe('clampZoom', () => {
  it('returns the value when within range', () => {
    expect(clampZoom(3.0, CAMERA_ZOOM_RANGE)).toBe(3.0);
  });

  it('clamps to min when below range', () => {
    expect(clampZoom(0.1, CAMERA_ZOOM_RANGE)).toBe(CAMERA_ZOOM_RANGE.min);
  });

  it('clamps to max when above range', () => {
    expect(clampZoom(99, CAMERA_ZOOM_RANGE)).toBe(CAMERA_ZOOM_RANGE.max);
  });

  it('uses default CAMERA_ZOOM_RANGE when no range is passed', () => {
    expect(clampZoom(1.5)).toBe(1.5);
  });
});

describe('formatCameraError', () => {
  it('maps permission error', () => {
    const err = new Error('Camera permission denied');
    const result = formatCameraError(err);
    expect(result.code).toBe(CAMERA_ERROR_CODES.PERMISSION_DENIED);
  });

  it('maps device unavailable error', () => {
    const err = new Error('device unavailable');
    const result = formatCameraError(err);
    expect(result.code).toBe(CAMERA_ERROR_CODES.DEVICE_NOT_AVAILABLE);
  });

  it('returns UNKNOWN for generic error', () => {
    const err = new Error('something went wrong');
    const result = formatCameraError(err);
    expect(result.code).toBe(CAMERA_ERROR_CODES.UNKNOWN);
    expect(result.message).toBe('something went wrong');
  });

  it('handles non-Error values', () => {
    const result = formatCameraError('string error');
    expect(result.code).toBe(CAMERA_ERROR_CODES.UNKNOWN);
    expect(result.message).toBe('An unknown camera error occurred.');
  });
});

describe('isValidFocusPoint', () => {
  it('accepts valid points', () => {
    expect(isValidFocusPoint({ x: 0.5, y: 0.5 })).toBe(true);
    expect(isValidFocusPoint({ x: 0, y: 0 })).toBe(true);
    expect(isValidFocusPoint({ x: 1, y: 1 })).toBe(true);
  });

  it('rejects out-of-range points', () => {
    expect(isValidFocusPoint({ x: -0.1, y: 0.5 })).toBe(false);
    expect(isValidFocusPoint({ x: 0.5, y: 1.1 })).toBe(false);
  });
});

describe('getCameraPositionLabel', () => {
  it('returns correct labels', () => {
    expect(getCameraPositionLabel('back')).toBe('Rear Camera');
    expect(getCameraPositionLabel('front')).toBe('Front Camera');
  });
});

// ─── CameraService ───────────────────────────────────────────────────────────

describe('CameraService', () => {
  it('is a singleton', () => {
    const a = cameraService;
    const b = cameraService;
    expect(a).toBe(b);
  });

  it('buildConfig merges with defaults', () => {
    const cfg = cameraService.buildConfig({ position: 'front' });
    expect(cfg.position).toBe('front');
    expect(cfg.torch).toBe('off');
  });

  it('isValidPosition returns true for valid positions', () => {
    expect(cameraService.isValidPosition('back')).toBe(true);
    expect(cameraService.isValidPosition('front')).toBe(true);
    expect(cameraService.isValidPosition('side')).toBe(false);
  });

  it('permissionDeniedError returns correct code', () => {
    const err = cameraService.permissionDeniedError();
    expect(err.code).toBe(CAMERA_ERROR_CODES.PERMISSION_DENIED);
  });

  it('deviceNotAvailableError returns correct code', () => {
    const err = cameraService.deviceNotAvailableError();
    expect(err.code).toBe(CAMERA_ERROR_CODES.DEVICE_NOT_AVAILABLE);
  });

  it('formatFocusError returns FOCUS_FAILED', () => {
    const err = cameraService.formatFocusError(new Error('focus miss'));
    expect(err.code).toBe(CAMERA_ERROR_CODES.FOCUS_FAILED);
  });
});

// ─── CameraManager ───────────────────────────────────────────────────────────

describe('CameraManager', () => {
  const makeStore = () => ({
    setCameraActive: jest.fn(),
    setCameraPosition: jest.fn(),
    setZoomLevel: jest.fn(),
    setFlashMode: jest.fn(),
    setTorchMode: jest.fn(),
    resetCameraState: jest.fn(),
  });

  it('activate calls store.setCameraActive(true)', () => {
    const store = makeStore();
    const manager = new CameraManager(store);
    manager.activate();
    expect(store.setCameraActive).toHaveBeenCalledWith(true);
  });

  it('deactivate calls store.setCameraActive(false)', () => {
    const store = makeStore();
    const manager = new CameraManager(store);
    manager.deactivate();
    expect(store.setCameraActive).toHaveBeenCalledWith(false);
  });

  it('switchCamera toggles position', () => {
    const store = makeStore();
    const manager = new CameraManager(store);
    manager.switchCamera('back');
    expect(store.setCameraPosition).toHaveBeenCalledWith('front');
    manager.switchCamera('front');
    expect(store.setCameraPosition).toHaveBeenCalledWith('back');
  });

  it('setZoom clamps value', () => {
    const store = makeStore();
    const manager = new CameraManager(store);
    manager.setZoom(999);
    expect(store.setZoomLevel).toHaveBeenCalledWith(CAMERA_ZOOM_RANGE.max);
  });

  it('toggleTorch switches mode', () => {
    const store = makeStore();
    const manager = new CameraManager(store);
    manager.toggleTorch('off');
    expect(store.setTorchMode).toHaveBeenCalledWith('on');
    manager.toggleTorch('on');
    expect(store.setTorchMode).toHaveBeenCalledWith('off');
  });

  it('focus records error when ref is missing', async () => {
    const store = makeStore();
    const manager = new CameraManager(store);
    await manager.focus({ x: 0.5, y: 0.5 });
    expect(manager.getLastError()?.code).toBe('FOCUS_FAILED');
  });

  it('focus records error for invalid point', async () => {
    const store = makeStore();
    const manager = new CameraManager(store);
    await manager.focus({ x: -1, y: 0 });
    expect(manager.getLastError()?.code).toBe('FOCUS_FAILED');
  });

  it('focus succeeds with valid ref', async () => {
    const store = makeStore();
    const manager = new CameraManager(store);
    const mockFocus = jest.fn(() => Promise.resolve());
    const ref = { current: { focusTo: mockFocus } };
    manager.attachRef(ref as never);
    await manager.focus({ x: 0.5, y: 0.5 });
    expect(mockFocus).toHaveBeenCalledWith({ x: 0.5, y: 0.5 });
    expect(manager.getLastError()).toBeNull();
  });

  it('reset clears error and calls store.resetCameraState', () => {
    const store = makeStore();
    const manager = new CameraManager(store);
    manager.handleError(new Error('test'));
    manager.reset();
    expect(manager.getLastError()).toBeNull();
    expect(store.resetCameraState).toHaveBeenCalled();
  });
});

// ─── useCameraPermission ────────────────────────────────────────────────────

function PermissionHookConsumer({
  onMount,
}: {
  onMount: (res: ReturnType<typeof useCameraPermission>) => void;
}) {
  const res = useCameraPermission();
  React.useEffect(() => {
    onMount(res);
  }, [res, onMount]);
  return null;
}

describe('useCameraPermission', () => {
  it('returns permission status and methods', async () => {
    let hookData: ReturnType<typeof useCameraPermission> | null = null;
    await act(async () => {
      ReactTestRenderer.create(
        <PermissionHookConsumer
          onMount={(data) => {
            hookData = data;
          }}
        />,
      );
    });
    expect(hookData).not.toBeNull();
    expect(typeof hookData?.requestPermission).toBe('function');
  });
});

// ─── CameraControls Component ────────────────────────────────────────────────

describe('CameraControls', () => {
  const baseProps = {
    position: 'back' as const,
    torch: 'off' as CameraTorchMode,
    zoom: 1.0,
    onSwitchCamera: jest.fn(),
    onToggleTorch: jest.fn(),
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
  };

  it('renders all control buttons', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = ReactTestRenderer.create(<CameraControls {...baseProps} />);
    });
    expect(tree?.root.findByProps({ testID: 'camera-controls' })).toBeTruthy();
    expect(tree?.root.findByProps({ testID: 'torch-toggle' })).toBeTruthy();
    expect(tree?.root.findByProps({ testID: 'switch-camera' })).toBeTruthy();
    expect(tree?.root.findByProps({ testID: 'zoom-in' })).toBeTruthy();
    expect(tree?.root.findByProps({ testID: 'zoom-out' })).toBeTruthy();
  });

  it('zoom-out is disabled at min zoom', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = ReactTestRenderer.create(<CameraControls {...baseProps} minZoom={1.0} zoom={1.0} />);
    });
    const zoomOut = tree?.root.findByProps({ testID: 'zoom-out' });
    expect(zoomOut?.props.disabled).toBe(true);
  });

  it('zoom-in is disabled at max zoom', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = ReactTestRenderer.create(<CameraControls {...baseProps} maxZoom={10.0} zoom={10.0} />);
    });
    const zoomIn = tree?.root.findByProps({ testID: 'zoom-in' });
    expect(zoomIn?.props.disabled).toBe(true);
  });
});

// ─── CameraView Component ────────────────────────────────────────────────────

describe('CameraView', () => {
  const mockDevice = {
    id: 'mock-back-camera',
    name: 'Mock Back Camera',
    position: 'back' as const,
    hasFlash: true,
    hasTorch: true,
    minZoom: 1.0,
    maxZoom: 10.0,
    neutralZoom: 1.0,
    formats: [],
    supportsRawCapture: false,
    hardwareLevel: 'full' as const,
    sensorOrientation: 'landscape-left' as const,
  };

  it('renders camera when hasPermission=true and device is available', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <CameraView
          device={mockDevice as never}
          flash={'off' as CameraFlashMode}
          hasPermission={true}
          isActive={true}
          torch={'off' as CameraTorchMode}
          zoom={1.0}
        />,
      );
    });
    expect(tree?.root.findByProps({ testID: 'mock-camera' })).toBeTruthy();
  });

  it('renders fallback container when hasPermission=false', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <CameraView device={mockDevice as never} hasPermission={false} isActive={false} />,
      );
    });
    expect(tree?.root).toBeTruthy();
  });

  it('renders fallback container when device is undefined', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <CameraView device={undefined} hasPermission={true} isActive={false} />,
      );
    });
    expect(tree?.root).toBeTruthy();
  });
});
