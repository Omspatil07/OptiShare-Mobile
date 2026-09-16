/* eslint-disable no-bitwise */
/**
 * OptiShare Fountain Codes / FEC Utility Functions
 */

/**
 * In-place vectorized XOR of two Uint8Array buffers: target ^= source.
 * Operates in 32-bit words for 4x CPU instruction acceleration.
 *
 * @param target Destination buffer modified in-place.
 * @param source Source buffer to XOR with.
 */
export function xorBuffersInPlace(target: Uint8Array, source: Uint8Array): void {
  const len = Math.min(target.length, source.length);

  // Check alignment for Uint32Array acceleration
  if (target.byteOffset % 4 === 0 && source.byteOffset % 4 === 0 && len >= 4) {
    const words = len >>> 2;
    const target32 = new Uint32Array(target.buffer, target.byteOffset, words);
    const source32 = new Uint32Array(source.buffer, source.byteOffset, words);

    for (let i = 0; i < words; i++) {
      const t = target32[i];
      const s = source32[i];
      if (t !== undefined && s !== undefined) {
        target32[i] = t ^ s;
      }
    }

    // Trailing bytes (len % 4)
    for (let i = words << 2; i < len; i++) {
      const t = target[i];
      const s = source[i];
      if (t !== undefined && s !== undefined) {
        target[i] = t ^ s;
      }
    }
  } else {
    // Byte-by-byte fallback
    for (let i = 0; i < len; i++) {
      const t = target[i];
      const s = source[i];
      if (t !== undefined && s !== undefined) {
        target[i] = t ^ s;
      }
    }
  }
}

/**
 * Creates a new buffer containing the bitwise XOR of two buffers (a ^ b).
 */
export function xorBuffers(a: Uint8Array, b: Uint8Array): Uint8Array {
  const len = Math.max(a.length, b.length);
  const result = new Uint8Array(len);

  // Copy 'a' into result
  result.set(a.subarray(0, Math.min(len, a.length)), 0);

  // XOR 'b' in-place
  xorBuffersInPlace(result, b);

  return result;
}

/**
 * Generates a random 32-bit unsigned PRNG seed for Fountain encoding.
 */
export function generateFecSeed(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const val = arr[0];
    if (val !== undefined && val !== 0) {
      return val >>> 0;
    }
  }
  return Math.floor(Math.random() * 0xffffffff + 1) >>> 0;
}
