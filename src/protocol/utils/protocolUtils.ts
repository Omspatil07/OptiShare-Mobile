/* eslint-disable no-bitwise */
/**
 * OptiShare Optical Transfer Protocol (OTP) Utility Functions
 */

/**
 * Encodes a string to a Uint8Array using UTF-8 encoding.
 */
export function stringToUtf8(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  // Fallback UTF-8 encoder
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) {
      utf8.push(charcode);
    } else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      // surrogate pair
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f),
      );
    }
  }
  return new Uint8Array(utf8);
}

/**
 * Decodes a Uint8Array to a UTF-8 string.
 */
export function utf8ToString(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(bytes);
  }
  // Fallback UTF-8 decoder
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const c1 = bytes[i++];
    if (c1 === undefined) break;

    if (c1 < 128) {
      out += String.fromCharCode(c1);
    } else if (c1 > 191 && c1 < 224) {
      const c2 = bytes[i++];
      if (c2 !== undefined) {
        out += String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      }
    } else if (c1 > 223 && c1 < 240) {
      const c2 = bytes[i++];
      const c3 = bytes[i++];
      if (c2 !== undefined && c3 !== undefined) {
        out += String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
    } else {
      const c2 = bytes[i++];
      const c3 = bytes[i++];
      const c4 = bytes[i++];
      if (c2 !== undefined && c3 !== undefined && c4 !== undefined) {
        const u = (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) - 0x10000;
        out += String.fromCharCode(0xd800 + (u >> 10), 0xdc00 + (u & 1023));
      }
    }
  }
  return out;
}

/**
 * Generates a random 32-bit session ID.
 */
export function generateSessionId(): number {
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

/**
 * Formats byte sizes into human readable strings (e.g. 1.25 MB).
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);
  const val = sizes[safeIndex];
  return `${parseFloat((bytes / Math.pow(k, safeIndex)).toFixed(dm))} ${val}`;
}
