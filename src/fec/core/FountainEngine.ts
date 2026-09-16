/* eslint-disable no-bitwise */
/**
 * OptiShare Fountain Codes Engine (High-Level Facade)
 */

import { DEFAULT_SYMBOL_SIZE } from '../constants/fecConstants';
import { FountainDecoder } from '../decoder/FountainDecoder';
import { FountainEncoder } from '../encoder/FountainEncoder';
import type {
  DecoderEvents,
  FecBenchmarkResult,
  FountainDecoderOptions,
  FountainEncoderOptions,
} from '../types/fecTypes';

export class FountainEngine {
  private static instance: FountainEngine | null = null;

  public static getInstance(): FountainEngine {
    if (!FountainEngine.instance) {
      FountainEngine.instance = new FountainEngine();
    }
    return FountainEngine.instance;
  }

  /**
   * Creates a new FountainEncoder instance for the given source data.
   */
  public createEncoder(sourceData: Uint8Array, options?: FountainEncoderOptions): FountainEncoder {
    return new FountainEncoder(sourceData, options);
  }

  /**
   * Creates a new FountainDecoder instance.
   */
  public createDecoder(options: FountainDecoderOptions, events?: DecoderEvents): FountainDecoder {
    return new FountainDecoder(options, events);
  }

  /**
   * Runs an end-to-end performance and loss-tolerance benchmark.
   *
   * @param dataSize Size in bytes of synthetic test data (default: 64 KB).
   * @param symbolSize Size in bytes of each symbol (default: 256).
   * @param lossRate Simulated packet loss rate (e.g. 0.2 = 20% loss).
   * @returns FecBenchmarkResult metrics.
   */
  public runBenchmark(
    dataSize = 65536,
    symbolSize = DEFAULT_SYMBOL_SIZE,
    lossRate = 0.2,
  ): FecBenchmarkResult {
    // Generate deterministic test payload
    const testData = new Uint8Array(dataSize);
    for (let i = 0; i < dataSize; i++) {
      testData[i] = (i * 31) & 0xff;
    }

    const encoder = this.createEncoder(testData, { symbolSize });
    const k = encoder.k;

    const decoder = this.createDecoder({
      totalSymbols: k,
      symbolSize,
      originalLength: dataSize,
      seed: encoder.seed,
    });

    let dropletIndex = 0;
    let decodedData: Uint8Array | null = null;
    let encodeTimeMs = 0;
    let decodeTimeMs = 0;

    const maxDroplets = k * 4;
    while (!decoder.isComplete && dropletIndex < maxDroplets) {
      const eStart = performance.now();
      const droplet = encoder.getDroplet(dropletIndex++);
      encodeTimeMs += performance.now() - eStart;

      const dropRandom = ((dropletIndex * 13 + 7) % 100) / 100;
      if (dropRandom >= lossRate) {
        const dStart = performance.now();
        decoder.addDroplet(droplet);
        decodeTimeMs += performance.now() - dStart;

        if (decoder.isComplete) {
          decodedData = decoder.reconstructData();
          break;
        }
      }
    }

    encodeTimeMs = Math.max(0.001, encodeTimeMs);
    decodeTimeMs = Math.max(0.001, decodeTimeMs);

    if (!decodedData || decoder.decodedCount !== k) {
      throw new Error(
        `Benchmark failed: could not recover data with ${lossRate * 100}% loss. Decoded ${
          decoder.decodedCount
        }/${k}`,
      );
    }

    const encodeThroughputMBps =
      Math.round((dataSize / 1024 / 1024 / (encodeTimeMs / 1000)) * 100) / 100;
    const decodeThroughputMBps =
      Math.round((dataSize / 1024 / 1024 / (decodeTimeMs / 1000)) * 100) / 100;
    const overheadPercent = Math.round(((decoder.symbolsReceived - k) / k) * 10000) / 100;

    return {
      dataSize,
      symbolSize,
      k,
      encodedDroplets: decoder.symbolsReceived,
      encodeTimeMs,
      decodeTimeMs,
      encodeThroughputMBps,
      decodeThroughputMBps,
      overheadPercent,
    };
  }
}

export const fountainEngine = FountainEngine.getInstance();
