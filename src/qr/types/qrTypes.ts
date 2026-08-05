/**
 * OptiShare QR Engine — Type Definitions
 */

/** QR Code Error Correction Level */
export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/** QR Code Version number (1 to 40) */
export type QRVersion =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40;

/** Header metadata packed into every QR transfer frame */
export interface QRFrameHeader {
  sequenceNumber: number;
  totalFrames: number;
  payloadSize: number;
  checksum: number;
}

/** Deserialized QR frame structure */
export interface QRFrameData {
  header: QRFrameHeader;
  payload: Uint8Array;
  rawData: string;
  isValid: boolean;
}

/** Options for QR Generation */
export interface QRGeneratorOptions {
  version?: QRVersion;
  errorCorrectionLevel?: QRErrorCorrectionLevel;
  margin?: number;
  width?: number;
  darkColor?: string;
  lightColor?: string;
}

/** 2-D point coordinate */
export interface QRPoint {
  x: number;
  y: number;
}

/** Bounding box of a decoded QR code */
export interface QRLocation {
  topLeft: QRPoint;
  topRight: QRPoint;
  bottomLeft: QRPoint;
  bottomRight: QRPoint;
}

/** Result of decoding a QR frame */
export interface QRDecodeResult {
  data: string;
  binaryData: number[];
  location: QRLocation;
}

/** Scheduler configuration options */
export interface QRSchedulerOptions {
  targetFps?: number;
  loop?: boolean;
}

/** Performance benchmark diagnostic result */
export interface QRBenchmarkResult {
  totalFramesGenerated: number;
  totalTimeMs: number;
  avgGenTimePerFrameMs: number;
  framesPerSecond: number;
}
