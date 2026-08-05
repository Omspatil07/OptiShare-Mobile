/**
 * OptiShare QR Engine — QRDecoder Service
 *
 * Decodes raw RGBA image pixel data into string/binary payloads using jsQR,
 * and parses raw optical transfer text streams into validated QRFrame instances.
 */

import jsQR from 'jsqr';

import { FRAME_MAGIC_PREFIX } from '../constants/qrConstants';
import { QRFrame } from '../models/QRFrame';
import type { QRDecodeResult } from '../types/qrTypes';

export class QRDecoder {
  /**
   * Decode raw RGBA pixel buffer into a QRDecodeResult.
   * `rgbaData` must be a Uint8ClampedArray / Uint8Array of length (width * height * 4).
   */
  public static decodeRGBA(
    rgbaData: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
  ): QRDecodeResult | null {
    if (!rgbaData || width <= 0 || height <= 0) {
      return null;
    }

    const clamped =
      rgbaData instanceof Uint8ClampedArray
        ? rgbaData
        : new Uint8ClampedArray(rgbaData.buffer, rgbaData.byteOffset, rgbaData.byteLength);

    const result = jsQR(clamped, width, height, {
      inversionAttempts: 'dontInvert',
    });

    if (!result) {
      return null;
    }

    return {
      data: result.data,
      binaryData: result.binaryData,
      location: {
        topLeft: result.location.topLeftCorner,
        topRight: result.location.topRightCorner,
        bottomLeft: result.location.bottomLeftCorner,
        bottomRight: result.location.bottomRightCorner,
      },
    };
  }

  /**
   * Parse a raw decoded string into a validated QRFrame model instance.
   * Returns null if string is malformed or CRC checksum fails.
   */
  public static decodeRawString(rawString: string): QRFrame | null {
    const frame = QRFrame.parse(rawString);
    if (!frame || !frame.isValid) {
      return null;
    }
    return frame;
  }

  /**
   * Quick check whether a string appears to be a valid OptiShare optical frame.
   */
  public static validateQRPayload(payload: string): boolean {
    if (!payload || typeof payload !== 'string') {
      return false;
    }
    return payload.startsWith(`${FRAME_MAGIC_PREFIX}:`);
  }
}
