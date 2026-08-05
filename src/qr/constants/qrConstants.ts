/**
 * OptiShare QR Engine — Constants
 */

import type { QRErrorCorrectionLevel, QRGeneratorOptions, QRVersion } from '../types/qrTypes';

/** Default QR Version for file transfer frames */
export const DEFAULT_QR_VERSION: QRVersion = 10;

/** Default Error Correction Level */
export const DEFAULT_EC_LEVEL: QRErrorCorrectionLevel = 'M';

/** Default Frame Rate (FPS) for optical stream transmission */
export const DEFAULT_SCHEDULER_FPS = 15;

/** Magic header bytes identifying an OptiShare optical frame ("OP") */
export const FRAME_MAGIC_PREFIX = 'OP';

/** Header string field separator */
export const FRAME_DELIMITER = ':';

/** Default generator options */
export const DEFAULT_GENERATOR_OPTIONS: Required<QRGeneratorOptions> = {
  version: DEFAULT_QR_VERSION,
  errorCorrectionLevel: DEFAULT_EC_LEVEL,
  margin: 2,
  width: 300,
  darkColor: '#000000',
  lightColor: '#FFFFFF',
};

/** Approximate byte capacity per QR version at EC level 'M' */
export const QR_VERSION_CAPACITIES_M: Record<number, number> = {
  1: 14,
  2: 26,
  3: 42,
  4: 62,
  5: 84,
  6: 106,
  7: 122,
  8: 152,
  9: 180,
  10: 213,
  15: 382,
  20: 666,
  25: 1035,
  30: 1465,
  40: 2331,
};
