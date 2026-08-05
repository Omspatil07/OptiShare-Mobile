/* eslint-disable no-bitwise */
/**
 * OptiShare QR Engine — Utilities
 */

import {
  DEFAULT_EC_LEVEL,
  DEFAULT_QR_VERSION,
  QR_VERSION_CAPACITIES_M,
} from '../constants/qrConstants';
import type { QRErrorCorrectionLevel, QRVersion } from '../types/qrTypes';

/** Pre-computed CRC32 lookup table */
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c >>> 0;
}

/**
 * Calculate 32-bit CRC checksum for a byte array or string.
 */
export function calculateCRC32(data: Uint8Array | string): number {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i] ?? 0;
    const tableIndex = (crc ^ byte) & 0xff;
    const tableValue = CRC32_TABLE[tableIndex] ?? 0;
    crc = (crc >>> 8) ^ tableValue;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Convert a Uint8Array into a Base64 string.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

/**
 * Convert a Base64 string into a Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Calculate optimal QR version (1–40) required for a given payload size in bytes.
 */
export function calculateOptimalVersion(
  payloadLength: number,
  _ecLevel: QRErrorCorrectionLevel = DEFAULT_EC_LEVEL,
): QRVersion {
  const versions = Object.keys(QR_VERSION_CAPACITIES_M)
    .map(Number)
    .sort((a, b) => a - b);

  for (const v of versions) {
    const cap = QR_VERSION_CAPACITIES_M[v] ?? 0;
    if (payloadLength <= cap) {
      return v as QRVersion;
    }
  }

  return 40;
}

/**
 * Validates if a string is a valid QR version (1..40).
 */
export function isValidQRVersion(v: number): v is QRVersion {
  return Number.isInteger(v) && v >= 1 && v <= 40;
}

/**
 * Validates if a string is a valid EC level.
 */
export function isValidECLevel(l: string): l is QRErrorCorrectionLevel {
  return l === 'L' || l === 'M' || l === 'Q' || l === 'H';
}

/**
 * Safe fallback default version getter.
 */
export function getSafeVersion(v?: number): QRVersion {
  if (v && isValidQRVersion(v)) {
    return v;
  }
  return DEFAULT_QR_VERSION;
}
