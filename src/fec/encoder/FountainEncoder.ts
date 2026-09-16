/* eslint-disable no-bitwise */
/**
 * OptiShare Fountain Code (Rateless LT) Encoder
 *
 * Segments input binary data into K source symbols and generates an endless
 * rateless stream of encoded droplet symbols using Robust Soliton distribution.
 */

import {
  DEFAULT_SOLITON_C,
  DEFAULT_SOLITON_DELTA,
  DEFAULT_SYMBOL_SIZE,
  MAX_SOURCE_SYMBOLS,
  MIN_SYMBOL_SIZE,
} from '../constants/fecConstants';
import { RobustSolitonDistribution } from '../distribution/RobustSolitonDistribution';
import { FountainSymbol } from '../models/FountainSymbol';
import { XorShiftPRNG } from '../prng/XorShiftPRNG';
import type { FountainEncoderOptions } from '../types/fecTypes';
import { generateFecSeed, xorBuffersInPlace } from '../utils/fecUtils';

export class FountainEncoder {
  public readonly symbolSize: number;
  public readonly originalLength: number;
  public readonly k: number;
  public readonly seed: number;
  public readonly systematic: boolean;
  private readonly sourceSymbols: Uint8Array[];
  private readonly distribution: RobustSolitonDistribution;

  constructor(sourceData: Uint8Array, options: FountainEncoderOptions = {}) {
    const symbolSize = options.symbolSize ?? DEFAULT_SYMBOL_SIZE;
    if (symbolSize < MIN_SYMBOL_SIZE) {
      throw new Error(`Symbol size must be >= ${MIN_SYMBOL_SIZE}: got ${symbolSize}`);
    }

    this.symbolSize = symbolSize;
    this.originalLength = sourceData.length;
    this.k = Math.max(1, Math.ceil(sourceData.length / symbolSize));

    if (this.k > MAX_SOURCE_SYMBOLS) {
      throw new Error(
        `Total source symbols K (${this.k}) exceeds MAX_SOURCE_SYMBOLS (${MAX_SOURCE_SYMBOLS})`,
      );
    }

    this.seed = options.seed ?? generateFecSeed();
    this.systematic = options.systematic ?? true;

    // Segment source data into K symbols of uniform size (zero-padded if necessary)
    this.sourceSymbols = this.segmentData(sourceData, this.k, symbolSize);

    // Initialize degree distribution
    const c = options.c ?? DEFAULT_SOLITON_C;
    const delta = options.delta ?? DEFAULT_SOLITON_DELTA;
    this.distribution = new RobustSolitonDistribution(this.k, c, delta);
  }

  private segmentData(data: Uint8Array, k: number, symbolSize: number): Uint8Array[] {
    const symbols: Uint8Array[] = new Array(k);

    for (let i = 0; i < k; i++) {
      const symbol = new Uint8Array(symbolSize);
      const start = i * symbolSize;
      if (start < data.length) {
        const end = Math.min(start + symbolSize, data.length);
        symbol.set(data.subarray(start, end), 0);
      }
      symbols[i] = symbol;
    }

    return symbols;
  }

  /**
   * Generates droplet symbol for a specific sequence number.
   *
   * @param sequenceNumber Zero-indexed droplet sequence number.
   * @returns FountainSymbol instance.
   */
  public getDroplet(sequenceNumber: number): FountainSymbol {
    const seq = sequenceNumber >>> 0;

    // Systematic Mode: Droplets [0 .. K - 1] are direct source symbols (degree 1)
    if (this.systematic && seq < this.k) {
      const sourceSymbol = this.sourceSymbols[seq]!;
      const dataCopy = new Uint8Array(this.symbolSize);
      dataCopy.set(sourceSymbol);

      return new FountainSymbol({
        sequenceNumber: seq,
        seed: this.seed,
        degree: 1,
        sourceIndices: [seq],
        data: dataCopy,
        isSystematic: true,
      });
    }

    // Rateless Mode: Combinatorial droplets
    // Multiplicative hash ensures independent PRNG seed for each sequence
    const dropletSeed = (this.seed + seq * 0x9e3779b9) >>> 0;
    const prng = new XorShiftPRNG(dropletSeed);

    const { degree, sourceIndices } = this.distribution.sampleDroplet(prng);

    const payload = new Uint8Array(this.symbolSize);
    for (const idx of sourceIndices) {
      const src = this.sourceSymbols[idx];
      if (src) {
        xorBuffersInPlace(payload, src);
      }
    }

    return new FountainSymbol({
      sequenceNumber: seq,
      seed: this.seed,
      degree,
      sourceIndices,
      data: payload,
      isSystematic: false,
    });
  }

  /**
   * Generates an array of `count` droplets starting from sequence 0.
   *
   * @param count Number of droplets to generate.
   */
  public generateDroplets(count: number): FountainSymbol[] {
    const droplets: FountainSymbol[] = new Array(count);
    for (let i = 0; i < count; i++) {
      droplets[i] = this.getDroplet(i);
    }
    return droplets;
  }

  /**
   * Generator emitting an endless stream of rateless droplet symbols.
   *
   * @param count Optional limit on number of droplets emitted.
   */
  public *dropletGenerator(count?: number): Generator<FountainSymbol, void, unknown> {
    let seq = 0;
    while (count === undefined || seq < count) {
      yield this.getDroplet(seq);
      seq++;
    }
  }
}
