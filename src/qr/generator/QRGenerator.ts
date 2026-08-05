/**
 * OptiShare QR Engine — QRGenerator Service
 *
 * Provides high-performance QR code matrix, DataURL, and SVG string generation
 * from binary chunks and QRFrame instances.
 */

import QRCode from 'qrcode';

import { DEFAULT_GENERATOR_OPTIONS } from '../constants/qrConstants';
import { QRFrame } from '../models/QRFrame';
import type { QRGeneratorOptions } from '../types/qrTypes';

export class QRGenerator {
  private static prepareInput(data: string | Uint8Array): string | QRCode.QRCodeSegment[] {
    if (typeof data === 'string') {
      return data;
    }
    return [{ data, mode: 'byte' }];
  }

  /**
   * Generate a 2D boolean matrix representing the QR code pixels.
   * `true` = dark module, `false` = light module.
   */
  public static async generateMatrix(
    data: string | Uint8Array,
    options: QRGeneratorOptions = {},
  ): Promise<boolean[][]> {
    const opts = { ...DEFAULT_GENERATOR_OPTIONS, ...options };
    const input = this.prepareInput(data);
    const qrData = QRCode.create(input, {
      version: opts.version,
      errorCorrectionLevel: opts.errorCorrectionLevel,
    });

    const size = qrData.modules.size;
    const matrix: boolean[][] = [];

    for (let row = 0; row < size; row++) {
      const rowArr: boolean[] = [];
      for (let col = 0; col < size; col++) {
        rowArr.push(Boolean(qrData.modules.get(row, col)));
      }
      matrix.push(rowArr);
    }

    return matrix;
  }

  /**
   * Generate a base64 Data URL (data:image/png;base64,...) for image preview.
   */
  public static async generateDataURL(
    data: string | Uint8Array,
    options: QRGeneratorOptions = {},
  ): Promise<string> {
    const opts = { ...DEFAULT_GENERATOR_OPTIONS, ...options };
    const input = this.prepareInput(data);
    const url: string = await QRCode.toDataURL(input, {
      version: opts.version,
      errorCorrectionLevel: opts.errorCorrectionLevel,
      margin: opts.margin,
      width: opts.width,
      color: {
        dark: opts.darkColor,
        light: opts.lightColor,
      },
    });
    return url;
  }

  /**
   * Generate an SVG XML string for scalable vector rendering.
   */
  public static async generateSVG(
    data: string | Uint8Array,
    options: QRGeneratorOptions = {},
  ): Promise<string> {
    const opts = { ...DEFAULT_GENERATOR_OPTIONS, ...options };
    const input = this.prepareInput(data);
    const svg: string = await QRCode.toString(input, {
      type: 'svg',
      version: opts.version,
      errorCorrectionLevel: opts.errorCorrectionLevel,
      margin: opts.margin,
      width: opts.width,
      color: {
        dark: opts.darkColor,
        light: opts.lightColor,
      },
    });
    return svg;
  }

  /**
   * Encode a single binary chunk into a QRFrame and generate its Data URL.
   */
  public static async encodeChunkToFrame(
    chunk: Uint8Array,
    sequenceNumber: number,
    totalFrames: number,
    options: QRGeneratorOptions = {},
  ): Promise<{ frame: QRFrame; dataUrl: string; serialized: string }> {
    const frame = new QRFrame(sequenceNumber, totalFrames, chunk);
    const serialized = frame.serialize();
    const dataUrl = await this.generateDataURL(serialized, options);
    return { frame, dataUrl, serialized };
  }

  /**
   * Split a large binary payload into chunks and generate QRFrames for each.
   */
  public static createFramesFromPayload(
    payload: Uint8Array,
    maxChunkSize: number = 150,
  ): QRFrame[] {
    const totalBytes = payload.length;
    const totalFrames = Math.max(1, Math.ceil(totalBytes / maxChunkSize));
    const frames: QRFrame[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const start = i * maxChunkSize;
      const end = Math.min(start + maxChunkSize, totalBytes);
      const chunk = payload.slice(start, end);
      frames.push(new QRFrame(i, totalFrames, chunk));
    }

    return frames;
  }
}
