/**
 * OptiShare Fountain Codes / FEC Layer Types & Interfaces
 */

import type { DecoderState, FecErrorCode } from '../constants/fecConstants';

/**
 * Represents a single encoded droplet symbol.
 */
export interface IFountainSymbol {
  readonly sequenceNumber: number;
  readonly seed: number;
  readonly degree: number;
  readonly sourceIndices: readonly number[];
  readonly data: Uint8Array;
  readonly isSystematic: boolean;
}

/**
 * Options for configuring a FountainEncoder instance.
 */
export interface FountainEncoderOptions {
  /** Size in bytes of each source/encoded symbol (default: 256). */
  readonly symbolSize?: number;
  /** Robust Soliton parameter c (default: 0.1). */
  readonly c?: number;
  /** Robust Soliton parameter delta (default: 0.05). */
  readonly delta?: number;
  /** If true, first K droplets emitted are systematic (direct source symbols). Default: true. */
  readonly systematic?: boolean;
  /** 32-bit random PRNG seed (default: auto-generated). */
  readonly seed?: number;
}

/**
 * Options for configuring a FountainDecoder instance.
 */
export interface FountainDecoderOptions {
  /** Number of source symbols (K) in the block. */
  readonly totalSymbols: number;
  /** Byte size of each symbol. */
  readonly symbolSize: number;
  /** Total unpadded byte length of original file/block. */
  readonly originalLength: number;
  /** 32-bit random PRNG seed matching the encoder. */
  readonly seed?: number;
  /** Robust Soliton parameter c (default: 0.1). */
  readonly c?: number;
  /** Robust Soliton parameter delta (default: 0.05). */
  readonly delta?: number;
}

/**
 * Real-time decoding performance and progress statistics.
 */
export interface DecodingStats {
  readonly state: DecoderState;
  readonly totalSymbols: number;
  readonly symbolsReceived: number;
  readonly symbolsDecoded: number;
  readonly redundantSymbols: number;
  readonly missingSymbolsCount: number;
  readonly percentComplete: number;
  readonly isComplete: boolean;
  readonly overheadRatio: number;
}

/**
 * Event callbacks emitted by FountainDecoder.
 */
export interface DecoderEvents {
  readonly onProgress?: (stats: DecodingStats) => void;
  readonly onComplete?: (decodedData: Uint8Array) => void;
  readonly onError?: (code: FecErrorCode, message: string) => void;
}

/**
 * Performance benchmark results for Fountain Code encoder and decoder.
 */
export interface FecBenchmarkResult {
  readonly dataSize: number;
  readonly symbolSize: number;
  readonly k: number;
  readonly encodedDroplets: number;
  readonly encodeTimeMs: number;
  readonly decodeTimeMs: number;
  readonly encodeThroughputMBps: number;
  readonly decodeThroughputMBps: number;
  readonly overheadPercent: number;
}
