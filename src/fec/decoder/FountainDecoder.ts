/* eslint-disable no-bitwise */
/**
 * OptiShare Fountain Code (Rateless LT) Peeling Decoder
 *
 * Implements belief-propagation peeling graph decoding. Recovers K original source
 * symbols from any K * (1 + epsilon) droplets arriving in arbitrary order over lossy channels.
 */

import { DEFAULT_SOLITON_C, DEFAULT_SOLITON_DELTA, DecoderState } from '../constants/fecConstants';
import { RobustSolitonDistribution } from '../distribution/RobustSolitonDistribution';
import type { FountainSymbol } from '../models/FountainSymbol';
import { XorShiftPRNG } from '../prng/XorShiftPRNG';
import type { DecoderEvents, DecodingStats, FountainDecoderOptions } from '../types/fecTypes';
import { xorBuffersInPlace } from '../utils/fecUtils';

interface Equation {
  indices: Set<number>;
  data: Uint8Array;
}

export class FountainDecoder {
  public readonly k: number;
  public readonly symbolSize: number;
  public readonly originalLength: number;
  public readonly seed: number;
  private _state: DecoderState;
  private readonly decodedSymbols: (Uint8Array | null)[];
  private _decodedCount: number;
  private _symbolsReceived: number;
  private _redundantSymbols: number;
  private readonly rippleQueue: number[] = [];
  private readonly symbolToEquations: Map<number, Set<Equation>> = new Map();
  private readonly distribution: RobustSolitonDistribution;
  private readonly events: DecoderEvents;

  constructor(options: FountainDecoderOptions, events: DecoderEvents = {}) {
    if (options.totalSymbols <= 0) {
      throw new Error(`Total symbols K must be greater than 0: ${options.totalSymbols}`);
    }
    if (options.symbolSize <= 0) {
      throw new Error(`Symbol size must be greater than 0: ${options.symbolSize}`);
    }

    this.k = options.totalSymbols;
    this.symbolSize = options.symbolSize;
    this.originalLength = options.originalLength;
    this.seed = options.seed ?? 0;
    this.events = events;

    this._state = DecoderState.INITIALIZING;
    this.decodedSymbols = new Array(this.k).fill(null);
    this._decodedCount = 0;
    this._symbolsReceived = 0;
    this._redundantSymbols = 0;

    const c = options.c ?? DEFAULT_SOLITON_C;
    const delta = options.delta ?? DEFAULT_SOLITON_DELTA;
    this.distribution = new RobustSolitonDistribution(this.k, c, delta);
  }

  public get state(): DecoderState {
    return this._state;
  }

  public get isComplete(): boolean {
    return this._decodedCount === this.k;
  }

  public get decodedCount(): number {
    return this._decodedCount;
  }

  public get symbolsReceived(): number {
    return this._symbolsReceived;
  }

  public get percentComplete(): number {
    if (this.k === 0) return 100;
    return Math.min(100, Math.round((this._decodedCount / this.k) * 10000) / 100);
  }

  /**
   * Ingests a new encoded droplet into the peeling decoder graph.
   *
   * @param symbol The incoming FountainSymbol droplet.
   * @returns `true` if this droplet led to new progress, `false` if redundant or duplicate.
   */
  public addDroplet(symbol: FountainSymbol): boolean {
    if (this._state === DecoderState.COMPLETE) {
      return false; // Already finished
    }

    if (this._state === DecoderState.INITIALIZING) {
      this._state = DecoderState.DECODING;
    }

    this._symbolsReceived++;

    // 1. Resolve source indices
    let sourceIndices: readonly number[];
    if (symbol.sourceIndices && symbol.sourceIndices.length > 0) {
      sourceIndices = symbol.sourceIndices;
    } else if (symbol.isSystematic && symbol.sequenceNumber < this.k) {
      sourceIndices = [symbol.sequenceNumber];
    } else {
      // Deterministically regenerate source indices from PRNG
      const dropletSeed = (this.seed + symbol.sequenceNumber * 0x9e3779b9) >>> 0;
      const prng = new XorShiftPRNG(dropletSeed);
      const sampled = this.distribution.sampleDroplet(prng);
      sourceIndices = sampled.sourceIndices;
    }

    // 2. Reduce droplet by all known (already-decoded) source symbols
    const reducedData = new Uint8Array(this.symbolSize);
    reducedData.set(symbol.data);

    const unresolvedIndices = new Set<number>();
    for (const idx of sourceIndices) {
      if (idx >= this.k) continue;

      const decoded = this.decodedSymbols[idx];
      if (decoded) {
        xorBuffersInPlace(reducedData, decoded);
      } else {
        unresolvedIndices.add(idx);
      }
    }

    // 3. Process based on reduced degree
    if (unresolvedIndices.size === 0) {
      // Redundant symbol
      this._redundantSymbols++;
      this.emitProgress();
      return false;
    }

    if (unresolvedIndices.size === 1) {
      // Newly resolved source symbol!
      const [resolvedIdx] = Array.from(unresolvedIndices);
      if (resolvedIdx !== undefined && !this.decodedSymbols[resolvedIdx]) {
        this.decodedSymbols[resolvedIdx] = reducedData;
        this._decodedCount++;
        this.rippleQueue.push(resolvedIdx);

        // Run Peeling Cascade
        this.processRippleQueue();
        this.checkCompletion();
        this.emitProgress();
        return true;
      }
      this._redundantSymbols++;
      this.emitProgress();
      return false;
    }

    // Unresolved degree > 1: Add to equation graph pool
    const equation: Equation = {
      indices: unresolvedIndices,
      data: reducedData,
    };

    for (const idx of unresolvedIndices) {
      let set = this.symbolToEquations.get(idx);
      if (!set) {
        set = new Set();
        this.symbolToEquations.set(idx, set);
      }
      set.add(equation);
    }

    this.emitProgress();
    return true;
  }

  /**
   * Peels the ripple queue: propagates newly decoded symbols to all dependent equations.
   */
  private processRippleQueue(): void {
    while (this.rippleQueue.length > 0) {
      const newlyResolved = this.rippleQueue.shift()!;
      const newlyResolvedData = this.decodedSymbols[newlyResolved]!;

      const affectedEquations = this.symbolToEquations.get(newlyResolved);
      if (affectedEquations) {
        for (const eq of Array.from(affectedEquations)) {
          // XOR newly resolved symbol into equation payload
          xorBuffersInPlace(eq.data, newlyResolvedData);
          eq.indices.delete(newlyResolved);

          if (eq.indices.size === 1) {
            const [nextResolved] = Array.from(eq.indices);
            if (nextResolved !== undefined && !this.decodedSymbols[nextResolved]) {
              this.decodedSymbols[nextResolved] = eq.data;
              this._decodedCount++;
              this.rippleQueue.push(nextResolved);
            }
            this.removeEquation(eq);
          } else if (eq.indices.size === 0) {
            this.removeEquation(eq);
          }
        }
        this.symbolToEquations.delete(newlyResolved);
      }
    }
  }

  private removeEquation(eq: Equation): void {
    for (const idx of eq.indices) {
      const set = this.symbolToEquations.get(idx);
      if (set) {
        set.delete(eq);
        if (set.size === 0) {
          this.symbolToEquations.delete(idx);
        }
      }
    }
  }

  private checkCompletion(): void {
    if (this._decodedCount === this.k && this._state !== DecoderState.COMPLETE) {
      this._state = DecoderState.COMPLETE;
      const reconstructed = this.reconstructData();
      this.events.onComplete?.(reconstructed);
    }
  }

  /**
   * Reconstructs the complete original data buffer from all K recovered symbols,
   * cleanly stripping any zero-padding on the trailing symbol.
   */
  public reconstructData(): Uint8Array {
    if (!this.isComplete) {
      throw new Error(
        `Cannot reconstruct data: only ${this._decodedCount}/${this.k} symbols decoded`,
      );
    }

    const result = new Uint8Array(this.originalLength);
    let offset = 0;

    for (let i = 0; i < this.k; i++) {
      const sym = this.decodedSymbols[i];
      if (!sym) {
        throw new Error(`Symbol ${i} is unexpectedly missing during reconstruction`);
      }

      const copyLen = Math.min(sym.length, this.originalLength - offset);
      if (copyLen > 0) {
        result.set(sym.subarray(0, copyLen), offset);
        offset += copyLen;
      }
    }

    return result;
  }

  public getStats(): DecodingStats {
    const overheadRatio = this.k > 0 ? Math.round((this._symbolsReceived / this.k) * 100) / 100 : 1;
    return {
      state: this._state,
      totalSymbols: this.k,
      symbolsReceived: this._symbolsReceived,
      symbolsDecoded: this._decodedCount,
      redundantSymbols: this._redundantSymbols,
      missingSymbolsCount: Math.max(0, this.k - this._decodedCount),
      percentComplete: this.percentComplete,
      isComplete: this.isComplete,
      overheadRatio,
    };
  }

  private emitProgress(): void {
    if (this.events.onProgress) {
      this.events.onProgress(this.getStats());
    }
  }
}
