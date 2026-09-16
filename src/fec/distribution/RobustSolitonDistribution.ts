/* eslint-disable no-bitwise */
/**
 * Robust Soliton Distribution for Fountain Codes (LT Codes)
 *
 * Combines the Ideal Soliton Distribution with a robust correction factor
 * to ensure degree-1 ripple symbols continue arriving throughout reception,
 * preventing belief-propagation peeling decoders from stalling.
 */

import { DEFAULT_SOLITON_C, DEFAULT_SOLITON_DELTA } from '../constants/fecConstants';
import type { XorShiftPRNG } from '../prng/XorShiftPRNG';

export class RobustSolitonDistribution {
  public readonly k: number;
  public readonly c: number;
  public readonly delta: number;
  private readonly cdf: Float64Array;

  constructor(k: number, c = DEFAULT_SOLITON_C, delta = DEFAULT_SOLITON_DELTA) {
    if (k <= 0) {
      throw new Error(`K must be greater than 0: ${k}`);
    }

    this.k = k;
    this.c = c;
    this.delta = delta;
    this.cdf = this.computeCDF();
  }

  private computeCDF(): Float64Array {
    const k = this.k;
    const cdf = new Float64Array(k + 1); // 1-indexed [1..k]

    if (k === 1) {
      cdf[1] = 1.0;
      return cdf;
    }

    // 1. Compute Ideal Soliton rho(d)
    const rho = new Float64Array(k + 1);
    rho[1] = 1.0 / k;
    for (let d = 2; d <= k; d++) {
      rho[d] = 1.0 / (d * (d - 1));
    }

    // 2. Compute Robust adjustment tau(d)
    const tau = new Float64Array(k + 1);
    const r = this.c * Math.log(k / this.delta) * Math.sqrt(k);
    const pivot = r > 0 ? Math.floor(k / r) : k;

    for (let d = 1; d <= k; d++) {
      if (d < pivot) {
        tau[d] = r / (d * k);
      } else if (d === pivot) {
        tau[d] = (r * Math.log(r / this.delta)) / k;
      } else {
        tau[d] = 0;
      }
    }

    // 3. Compute normalization factor beta
    let beta = 0;
    for (let d = 1; d <= k; d++) {
      beta += (rho[d] ?? 0) + (tau[d] ?? 0);
    }

    if (beta === 0) beta = 1;

    // 4. Compute Cumulative Distribution Function (CDF)
    let cumulative = 0;
    for (let d = 1; d <= k; d++) {
      const mu = ((rho[d] ?? 0) + (tau[d] ?? 0)) / beta;
      cumulative += mu;
      cdf[d] = cumulative;
    }

    cdf[k] = 1.0; // Ensure final entry is exactly 1.0
    return cdf;
  }

  /**
   * Samples a degree d in range [1, K] from the distribution using a PRNG.
   *
   * @param prng XorShiftPRNG instance.
   * @returns Sampled degree d (1 <= d <= K).
   */
  public sampleDegree(prng: XorShiftPRNG): number {
    if (this.k === 1) return 1;

    const u = prng.nextFloat();

    // Binary search in CDF
    let low = 1;
    let high = this.k;

    while (low < high) {
      const mid = (low + high) >>> 1;
      const val = this.cdf[mid] ?? 0;
      if (val < u) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return Math.max(1, Math.min(low, this.k));
  }

  /**
   * Samples degree d and then samples d distinct source indices.
   *
   * @param prng XorShiftPRNG instance.
   * @returns Object with degree and sorted sourceIndices.
   */
  public sampleDroplet(prng: XorShiftPRNG): {
    readonly degree: number;
    readonly sourceIndices: number[];
  } {
    const degree = this.sampleDegree(prng);
    const sourceIndices = prng.sampleDistinctIndices(this.k, degree);
    return { degree, sourceIndices };
  }
}
