/**
 * OptiShare Replay Protection
 *
 * Implements an RFC 4303 / RFC 6479 style sliding-window anti-replay filter.
 * Prevents replay attacks and duplicate packet re-injections over optical channels.
 */

import { SECURITY_CONFIG } from '../constants/securityConstants';

export class ReplayProtector {
  private readonly windowSize: number;
  private highestSeq: number = -1;
  private readonly windowBitmap: Set<number> = new Set();
  private replayedCount = 0;
  private acceptedCount = 0;

  constructor(windowSize: number = SECURITY_CONFIG.DEFAULT_REPLAY_WINDOW_SIZE) {
    if (windowSize <= 0) {
      throw new Error(`Window size must be positive: got ${windowSize}`);
    }
    this.windowSize = windowSize;
  }

  public get highestSequenceSeen(): number {
    return this.highestSeq;
  }

  public get replayedPacketsCount(): number {
    return this.replayedCount;
  }

  public get acceptedPacketsCount(): number {
    return this.acceptedCount;
  }

  /**
   * Checks whether a sequence number would be accepted without mutating window state.
   *
   * @param seq The sequence number to check.
   * @returns `true` if packet is valid and fresh, `false` if replayed or too old.
   */
  public check(seq: number): boolean {
    if (seq < 0) {
      return false;
    }

    // First packet seen
    if (this.highestSeq === -1) {
      return true;
    }

    // Newer packet ahead of window
    if (seq > this.highestSeq) {
      return true;
    }

    // Packet older than the trailing edge of window
    if (this.highestSeq - seq >= this.windowSize) {
      return false;
    }

    // Within window: check if already seen
    return !this.windowBitmap.has(seq);
  }

  /**
   * Validates sequence number and commits it to the anti-replay window state.
   *
   * @param seq The sequence number of the incoming packet.
   * @returns `true` if accepted as fresh, `false` if rejected as a replay or stale.
   */
  public update(seq: number): boolean {
    if (!this.check(seq)) {
      this.replayedCount++;
      return false;
    }

    if (seq > this.highestSeq) {
      this.highestSeq = seq;
      // Prune bitmap entries that fell outside the sliding window
      const cutoff = this.highestSeq - this.windowSize;
      for (const oldSeq of Array.from(this.windowBitmap)) {
        if (oldSeq <= cutoff) {
          this.windowBitmap.delete(oldSeq);
        }
      }
    }

    this.windowBitmap.add(seq);
    this.acceptedCount++;
    return true;
  }

  /**
   * Resets replay protector window state.
   */
  public reset(): void {
    this.highestSeq = -1;
    this.windowBitmap.clear();
    this.replayedCount = 0;
    this.acceptedCount = 0;
  }
}
