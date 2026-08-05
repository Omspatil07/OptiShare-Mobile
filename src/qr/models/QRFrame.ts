/**
 * OptiShare QR Engine — QRFrame Model
 *
 * Encapsulates optical transfer payload data, header metadata,
 * checksum validation, and serialization / parsing.
 */

import { FRAME_DELIMITER, FRAME_MAGIC_PREFIX } from '../constants/qrConstants';
import type { QRFrameData, QRFrameHeader } from '../types/qrTypes';
import { calculateCRC32, base64ToUint8Array, uint8ArrayToBase64 } from '../utils/qrUtils';

export class QRFrame {
  public readonly sequenceNumber: number;
  public readonly totalFrames: number;
  public readonly payload: Uint8Array;
  public readonly checksum: number;
  public readonly isValid: boolean;

  constructor(sequenceNumber: number, totalFrames: number, payload: Uint8Array, checksum?: number) {
    this.sequenceNumber = sequenceNumber;
    this.totalFrames = totalFrames;
    this.payload = payload;

    const computedCrc = calculateCRC32(payload);
    if (checksum !== undefined) {
      this.checksum = checksum;
      this.isValid = checksum === computedCrc;
    } else {
      this.checksum = computedCrc;
      this.isValid = true;
    }
  }

  /**
   * Serialize the frame into a delimited text payload suitable for QR encoding.
   * Format: `OP:<seq>:<total>:<checksum>:<base64Payload>`
   */
  serialize(): string {
    const b64 = uint8ArrayToBase64(this.payload);
    return [FRAME_MAGIC_PREFIX, this.sequenceNumber, this.totalFrames, this.checksum, b64].join(
      FRAME_DELIMITER,
    );
  }

  /**
   * Parse a raw QR payload string into a QRFrame instance.
   * Returns null if magic prefix or format is invalid.
   */
  static parse(rawData: string): QRFrame | null {
    if (!rawData || typeof rawData !== 'string') {
      return null;
    }

    const parts = rawData.split(FRAME_DELIMITER);
    if (parts.length < 5) {
      return null;
    }

    const [prefix, seqStr, totalStr, crcStr, ...payloadParts] = parts;
    if (prefix !== FRAME_MAGIC_PREFIX) {
      return null;
    }

    const sequenceNumber = parseInt(seqStr ?? '', 10);
    const totalFrames = parseInt(totalStr ?? '', 10);
    const checksum = parseInt(crcStr ?? '', 10);
    const b64Payload = payloadParts.join(FRAME_DELIMITER);

    if (
      isNaN(sequenceNumber) ||
      isNaN(totalFrames) ||
      isNaN(checksum) ||
      sequenceNumber < 0 ||
      totalFrames < 1 ||
      sequenceNumber >= totalFrames
    ) {
      return null;
    }

    try {
      const payload = base64ToUint8Array(b64Payload);
      return new QRFrame(sequenceNumber, totalFrames, payload, checksum);
    } catch {
      return null;
    }
  }

  /**
   * Convert to QRFrameData interface object.
   */
  toData(): QRFrameData {
    const header: QRFrameHeader = {
      sequenceNumber: this.sequenceNumber,
      totalFrames: this.totalFrames,
      payloadSize: this.payload.length,
      checksum: this.checksum,
    };
    return {
      header,
      payload: this.payload,
      rawData: this.serialize(),
      isValid: this.isValid,
    };
  }
}
