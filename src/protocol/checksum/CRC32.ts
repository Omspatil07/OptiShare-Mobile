/* eslint-disable no-bitwise */
/**
 * IEEE 802.3 CRC-32 Checksum Calculator
 *
 * Implements standard CRC-32 using polynomial 0xEDB88320 with
 * a precomputed 256-entry lookup table for sub-microsecond throughput.
 */

// Precompute 256-entry CRC32 table
const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export class CRC32 {
  /**
   * Calculates the 32-bit CRC checksum of a Uint8Array.
   *
   * @param buffer Input byte buffer.
   * @param offset Starting byte offset (default: 0).
   * @param length Number of bytes to process (default: remaining).
   * @returns Unsigned 32-bit CRC checksum.
   */
  public static calculate(buffer: Uint8Array, offset = 0, length?: number): number {
    const end = length !== undefined ? Math.min(offset + length, buffer.length) : buffer.length;
    let crc = 0xffffffff;

    for (let i = offset; i < end; i++) {
      const byte = buffer[i];
      if (byte !== undefined) {
        const tableIndex = (crc ^ byte) & 0xff;
        const entry = CRC32_TABLE[tableIndex];
        if (entry !== undefined) {
          crc = (crc >>> 8) ^ entry;
        }
      }
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  /**
   * Updates an existing CRC-32 checksum with an additional slice of bytes.
   *
   * @param currentCrc Existing CRC value.
   * @param buffer Input byte buffer.
   * @param offset Starting byte offset (default: 0).
   * @param length Number of bytes to process (default: remaining).
   * @returns Updated unsigned 32-bit CRC checksum.
   */
  public static update(
    currentCrc: number,
    buffer: Uint8Array,
    offset = 0,
    length?: number,
  ): number {
    const end = length !== undefined ? Math.min(offset + length, buffer.length) : buffer.length;
    let crc = (currentCrc ^ 0xffffffff) >>> 0;

    for (let i = offset; i < end; i++) {
      const byte = buffer[i];
      if (byte !== undefined) {
        const tableIndex = (crc ^ byte) & 0xff;
        const entry = CRC32_TABLE[tableIndex];
        if (entry !== undefined) {
          crc = (crc >>> 8) ^ entry;
        }
      }
    }

    return (crc ^ 0xffffffff) >>> 0;
  }
}
