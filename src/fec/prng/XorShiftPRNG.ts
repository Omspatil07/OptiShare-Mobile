/* eslint-disable no-bitwise */
/**
 * 32-bit XorShift Pseudo-Random Number Generator (PRNG)
 *
 * Provides ultra-fast, deterministic pseudo-random sequences for
 * Fountain Code droplet degree and source symbol index generation.
 */

export class XorShiftPRNG {
  private state: number;

  constructor(seed: number) {
    // Non-zero 32-bit initial state
    const s = seed >>> 0;
    this.state = s === 0 ? 0x6d2b79f5 : s;
  }

  /**
   * Generates next pseudo-random 32-bit unsigned integer.
   */
  public nextUint32(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  /**
   * Generates next pseudo-random float in range [0, 1).
   */
  public nextFloat(): number {
    return (this.nextUint32() >>> 0) / 0x100000000;
  }

  /**
   * Generates next pseudo-random integer in range [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    if (min >= max) return min;
    const range = max - min + 1;
    return min + (this.nextUint32() % range);
  }

  /**
   * Selects `count` distinct indices uniformly sampled from [0, k - 1].
   * Uses partial Fisher-Yates shuffle for deterministic, unbiased selection.
   *
   * @param k Total available source indices (0 to k - 1).
   * @param count Number of distinct indices to sample (1 <= count <= k).
   * @returns Array of `count` sorted distinct indices.
   */
  public sampleDistinctIndices(k: number, count: number): number[] {
    if (count <= 0) return [];
    if (count >= k) {
      const all: number[] = new Array(k);
      for (let i = 0; i < k; i++) all[i] = i;
      return all;
    }
    if (count === 1) {
      return [this.nextInt(0, k - 1)];
    }

    // Partial Fisher-Yates shuffle using Map to avoid allocating full size-K array
    const pool = new Map<number, number>();
    const result: number[] = new Array(count);

    for (let i = 0; i < count; i++) {
      const j = this.nextInt(i, k - 1);
      const valI = pool.get(i) ?? i;
      const valJ = pool.get(j) ?? j;

      result[i] = valJ;
      pool.set(j, valI);
    }

    // Sort indices for deterministic canonical ordering
    return result.sort((a, b) => a - b);
  }
}
