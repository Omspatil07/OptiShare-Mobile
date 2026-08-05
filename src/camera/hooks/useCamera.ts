/**
 * OptiShare Camera Engine — useCamera Hook
 *
 * Primary convenience hook.
 * Aggregates CameraContext + CameraStore for component-level consumption.
 */

import { useCameraContext } from '../providers/CameraProvider';

export const useCamera = useCameraContext;
