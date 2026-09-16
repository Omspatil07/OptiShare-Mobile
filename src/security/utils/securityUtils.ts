/* eslint-disable no-bitwise */
/**
 * OptiShare Security & Cryptographic Utilities
 *
 * Provides constant-time byte comparisons, CSPRNG random generation,
 * buffer zeroization for secure memory sanitization, and encoding helpers.
 */

/**
 * Constant-time comparison between two byte arrays to mitigate timing side-channel attacks.
 *
 * @param a First byte array.
 * @param b Second byte array.
 * @returns `true` if identical, `false` otherwise.
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    const byteA = a[i] ?? 0;
    const byteB = b[i] ?? 0;
    diff |= byteA ^ byteB;
  }

  return diff === 0;
}

/**
 * Zeroizes a byte buffer in place to purge sensitive cryptographic secrets from memory.
 *
 * @param buffer Buffer to wipe with zeros.
 */
export function wipeBuffer(buffer: Uint8Array): void {
  buffer.fill(0);
}

/**
 * Generates cryptographically secure random bytes using platform CSPRNG.
 *
 * @param length Number of random bytes to generate.
 * @returns Fresh Uint8Array containing secure random bytes.
 */
export function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Converts a Uint8Array (including slices/views) into a pure ArrayBuffer
 * compatible with platform WebCrypto BufferSource requirements.
 */
export function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

/**
 * Converts a byte array to a lowercase hexadecimal string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Converts a hexadecimal string to a Uint8Array byte array.
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim().replace(/^0x/i, '');
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Invalid hexadecimal string: length must be even');
  }

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = parseInt(cleanHex.substring(i, i + 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hexadecimal character at index ${i}`);
    }
    bytes[i / 2] = byte;
  }

  return bytes;
}

/**
 * Converts a Uint8Array to a Base64 string.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  throw new Error('No Base64 encoder available in current environment');
}

/**
 * Converts a Base64 string to a Uint8Array.
 */
export function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  throw new Error('No Base64 decoder available in current environment');
}
