/**
 * OptiShare QR Engine — Public API Barrel
 */

// Types
export type {
  QRBenchmarkResult,
  QRDecodeResult,
  QRErrorCorrectionLevel,
  QRFrameData,
  QRFrameHeader,
  QRGeneratorOptions,
  QRLocation,
  QRPoint,
  QRSchedulerOptions,
  QRVersion,
} from './types/qrTypes';

// Constants
export {
  DEFAULT_EC_LEVEL,
  DEFAULT_GENERATOR_OPTIONS,
  DEFAULT_QR_VERSION,
  DEFAULT_SCHEDULER_FPS,
  FRAME_DELIMITER,
  FRAME_MAGIC_PREFIX,
  QR_VERSION_CAPACITIES_M,
} from './constants/qrConstants';

// Utilities
export {
  base64ToUint8Array,
  calculateCRC32,
  calculateOptimalVersion,
  getSafeVersion,
  isValidECLevel,
  isValidQRVersion,
  uint8ArrayToBase64,
} from './utils/qrUtils';

// Models
export { QRFrame } from './models/QRFrame';

// Generator
export { QRGenerator } from './generator/QRGenerator';

// Decoder
export { QRDecoder } from './decoder/QRDecoder';

// Scheduler
export { QRFrameScheduler } from './scheduler/QRFrameScheduler';
export type { FrameCallback, StreamCompleteCallback } from './scheduler/QRFrameScheduler';

// Services
export { QREngineService, qrEngineService } from './services/QREngineService';
