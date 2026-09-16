/* eslint-disable no-bitwise */
/**
 * OptiShare Optical Transfer Protocol (OTP) Chunk Tracker
 *
 * Tracks received and missing chunks using an efficient Uint8Array bitmask.
 * Handles out-of-order delivery, deduplication, missing range calculation,
 * and completion verification with minimal memory footprint.
 */

import type { ChunkTrackingStats } from '../types/protocolTypes';

export class ChunkTracker {
  public readonly totalChunks: number;
  private readonly bitmask: Uint8Array;
  private _receivedCount: number;
  private _receivedBytes: number;

  constructor(totalChunks: number) {
    if (totalChunks <= 0) {
      throw new Error(`Total chunks must be greater than 0: ${totalChunks}`);
    }

    this.totalChunks = totalChunks;
    // 1 bit per chunk: ceil(totalChunks / 8) bytes
    this.bitmask = new Uint8Array(Math.ceil(totalChunks / 8));
    this._receivedCount = 0;
    this._receivedBytes = 0;
  }

  /**
   * Number of unique chunks received so far.
   */
  public get receivedCount(): number {
    return this._receivedCount;
  }

  /**
   * Total bytes received across all unique chunks.
   */
  public get receivedBytes(): number {
    return this._receivedBytes;
  }

  /**
   * Number of chunks still missing.
   */
  public get missingCount(): number {
    return Math.max(0, this.totalChunks - this._receivedCount);
  }

  /**
   * True if all chunks from 0 to totalChunks - 1 have been received.
   */
  public get isComplete(): boolean {
    return this._receivedCount === this.totalChunks;
  }

  /**
   * Transfer progress percentage (0.0 to 100.0).
   */
  public get percentComplete(): number {
    if (this.totalChunks === 0) return 100;
    return Math.min(100, Math.round((this._receivedCount / this.totalChunks) * 10000) / 100);
  }

  /**
   * Checks if a specific sequence index has already been received.
   *
   * @param seq Zero-indexed chunk sequence number.
   */
  public hasChunk(seq: number): boolean {
    if (seq < 0 || seq >= this.totalChunks) {
      return false;
    }
    const byteIndex = seq >>> 3; // seq / 8
    const bitIndex = seq & 7; // seq % 8
    const byte = this.bitmask[byteIndex];
    if (byte === undefined) return false;
    return (byte & (1 << bitIndex)) !== 0;
  }

  /**
   * Marks a sequence index as received.
   *
   * @param seq Zero-indexed chunk sequence number.
   * @param byteLength Size of chunk payload in bytes.
   * @returns `true` if this chunk was newly received, `false` if it was a duplicate.
   */
  public markReceived(seq: number, byteLength = 0): boolean {
    if (seq < 0 || seq >= this.totalChunks) {
      return false; // Out of bounds
    }

    const byteIndex = seq >>> 3;
    const bitIndex = seq & 7;
    const currentByte = this.bitmask[byteIndex];
    if (currentByte === undefined) return false;

    // Check if bit is already set (duplicate frame)
    if ((currentByte & (1 << bitIndex)) !== 0) {
      return false; // Duplicate
    }

    // Set bit
    this.bitmask[byteIndex] = currentByte | (1 << bitIndex);
    this._receivedCount++;
    this._receivedBytes += byteLength;
    return true;
  }

  /**
   * Returns highest sequence index up to which all chunks [0..k] are contiguously received.
   * Returns -1 if chunk 0 has not been received.
   */
  public getLastContiguousSeq(): number {
    for (let i = 0; i < this.totalChunks; i++) {
      if (!this.hasChunk(i)) {
        return i - 1;
      }
    }
    return this.totalChunks - 1;
  }

  /**
   * Identifies contiguous missing sequence ranges [[start, end], ...].
   * Useful for encoding compact ACK packets back to the transmitter.
   *
   * @param maxRanges Maximum number of ranges to return.
   */
  public getMissingRanges(maxRanges = 64): [number, number][] {
    const ranges: [number, number][] = [];
    let inMissing = false;
    let rangeStart = 0;

    for (let i = 0; i < this.totalChunks; i++) {
      const has = this.hasChunk(i);
      if (!has && !inMissing) {
        inMissing = true;
        rangeStart = i;
      } else if (has && inMissing) {
        ranges.push([rangeStart, i - 1]);
        inMissing = false;
        if (ranges.length >= maxRanges) {
          return ranges;
        }
      }
    }

    if (inMissing && ranges.length < maxRanges) {
      ranges.push([rangeStart, this.totalChunks - 1]);
    }

    return ranges;
  }

  /**
   * Returns a list of all missing sequence numbers up to a maximum limit.
   */
  public getMissingChunks(limit = 1000): number[] {
    const missing: number[] = [];
    for (let i = 0; i < this.totalChunks; i++) {
      if (!this.hasChunk(i)) {
        missing.push(i);
        if (missing.length >= limit) break;
      }
    }
    return missing;
  }

  /**
   * Returns a snapshot of tracking statistics.
   */
  public getStats(): ChunkTrackingStats {
    return {
      totalChunks: this.totalChunks,
      receivedChunksCount: this._receivedCount,
      receivedBytes: this._receivedBytes,
      missingChunksCount: this.missingCount,
      percentComplete: this.percentComplete,
      isComplete: this.isComplete,
    };
  }

  /**
   * Resets all bitmask tracking data.
   */
  public reset(): void {
    this.bitmask.fill(0);
    this._receivedCount = 0;
    this._receivedBytes = 0;
  }
}
