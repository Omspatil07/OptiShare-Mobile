/**
 * OptiShare QR Engine — QREngineService
 *
 * High-level unified facade singleton for generator, decoder, scheduler,
 * and performance benchmark diagnostics.
 */

import { QRDecoder } from '../decoder/QRDecoder';
import { QRGenerator } from '../generator/QRGenerator';
import type { QRFrame } from '../models/QRFrame';
import { QRFrameScheduler } from '../scheduler/QRFrameScheduler';
import type {
  QRBenchmarkResult,
  QRDecodeResult,
  QRErrorCorrectionLevel,
  QRGeneratorOptions,
  QRSchedulerOptions,
  QRVersion,
} from '../types/qrTypes';
import { calculateOptimalVersion } from '../utils/qrUtils';

export class QREngineService {
  private static instance: QREngineService | null = null;

  private constructor() {}

  public static getInstance(): QREngineService {
    if (!QREngineService.instance) {
      QREngineService.instance = new QREngineService();
    }
    return QREngineService.instance;
  }

  /**
   * Convert binary payload into encoded QRFrames.
   */
  public prepareFrames(payload: Uint8Array, chunkSize: number = 150): QRFrame[] {
    return QRGenerator.createFramesFromPayload(payload, chunkSize);
  }

  /**
   * Generate Data URL for a given string or Uint8Array.
   */
  public async generateDataURL(
    data: string | Uint8Array,
    options?: QRGeneratorOptions,
  ): Promise<string> {
    return QRGenerator.generateDataURL(data, options);
  }

  /**
   * Generate SVG string for a given string or Uint8Array.
   */
  public async generateSVG(
    data: string | Uint8Array,
    options?: QRGeneratorOptions,
  ): Promise<string> {
    return QRGenerator.generateSVG(data, options);
  }

  /**
   * Decode raw RGBA pixel data.
   */
  public decodeRGBA(
    rgbaData: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
  ): QRDecodeResult | null {
    return QRDecoder.decodeRGBA(rgbaData, width, height);
  }

  /**
   * Decode raw QR string into QRFrame model instance.
   */
  public decodeFrame(rawString: string): QRFrame | null {
    return QRDecoder.decodeRawString(rawString);
  }

  /**
   * Create a new QRFrameScheduler instance.
   */
  public createScheduler(options?: QRSchedulerOptions): QRFrameScheduler {
    return new QRFrameScheduler(options);
  }

  /**
   * Compute optimal QR version for given payload size.
   */
  public getOptimalVersion(payloadLength: number, ecLevel?: QRErrorCorrectionLevel): QRVersion {
    return calculateOptimalVersion(payloadLength, ecLevel);
  }

  /**
   * Run performance benchmarks measuring generation throughput.
   */
  public async runBenchmark(
    frameCount: number = 20,
    chunkSize: number = 150,
  ): Promise<QRBenchmarkResult> {
    const dummyPayload = new Uint8Array(chunkSize * frameCount);
    for (let i = 0; i < dummyPayload.length; i++) {
      dummyPayload[i] = i % 256;
    }

    const start = performance.now();
    const frames = this.prepareFrames(dummyPayload, chunkSize);

    for (const frame of frames) {
      await QRGenerator.generateDataURL(frame.serialize());
    }

    const elapsedMs = performance.now() - start;
    const avgMs = elapsedMs / frameCount;
    const fps = (frameCount / elapsedMs) * 1000;

    return {
      totalFramesGenerated: frameCount,
      totalTimeMs: elapsedMs,
      avgGenTimePerFrameMs: avgMs,
      framesPerSecond: fps,
    };
  }
}

export const qrEngineService = QREngineService.getInstance();
