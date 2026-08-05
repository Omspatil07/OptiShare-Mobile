/**
 * OptiShare Camera Engine — Public API
 */

// Types
export type {
  CameraConfig,
  CameraDeviceInfo,
  CameraError,
  CameraFlashMode,
  CameraOrientation,
  CameraPosition,
  CameraSnapshot,
  CameraTorchMode,
  FocusPoint,
  ZoomRange,
} from './types/cameraTypes';

// Constants
export {
  CAMERA_ERROR_CODES,
  CAMERA_ZOOM_RANGE,
  DEFAULT_CAMERA_CONFIG,
  FRAME_PROCESSOR_RESOLUTION,
} from './constants/cameraConstants';
export type { CameraErrorCode } from './constants/cameraConstants';

// Utils
export {
  clampZoom,
  formatCameraError,
  getCameraPositionLabel,
  getOrientationFromDimensions,
  isValidFocusPoint,
} from './utils/cameraUtils';

// Services
export { CameraService, cameraService } from './services/CameraService';

// Managers
export { CameraManager } from './managers/CameraManager';
export type { CameraRef, CameraStoreSlice } from './managers/CameraManager';

// Providers
export { CameraProvider, useCameraContext } from './providers/CameraProvider';
export type { CameraContextValue, CameraProviderProps } from './providers/CameraProvider';

// Hooks
export { useCamera } from './hooks/useCamera';
export { useCameraDevices } from './hooks/useCameraDevices';
export type { UseCameraDevicesResult } from './hooks/useCameraDevices';
export { useCameraPermission } from './hooks/useCameraPermission';
export type {
  CameraPermissionStatus,
  UseCameraPermissionResult,
} from './hooks/useCameraPermission';

// Components
export { CameraControls } from './components/CameraControls/CameraControls';
export type { CameraControlsProps } from './components/CameraControls/CameraControls';
export { CameraView } from './components/CameraView/CameraView';
export type { CameraViewProps, CameraViewRef } from './components/CameraView/CameraView';
