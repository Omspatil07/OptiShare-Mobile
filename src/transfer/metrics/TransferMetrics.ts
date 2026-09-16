/**
 * OptiShare Transfer Metrics & Speed Calculator
 *
 * Provides real-time, windowed, and exponentially smoothed (EMA)
 * metrics calculation for optical frame transfer sessions.
 */

import { TRANSFER_CONFIG } from '../constants/transferConstants';
import type { TransferMetricsSnapshot } from '../types/transferTypes';

export class TransferMetrics {
  private totalBytes: number = 0;
  private bytesTransferred: number = 0;
  private framesDispatched: number = 0;
  private framesReceived: number = 0;
  private duplicateFrames: number = 0;
  private corruptFrames: number = 0;

  private startTimeMs: number = 0;
  private lastUpdateTimeMs: number = 0;
  private lastBytesTransferred: number = 0;

  private instantSpeedBps: number = 0;
  private smoothedSpeedBps: number = 0;
  private readonly emaAlpha: number;

  constructor(totalBytes = 0, emaAlpha = TRANSFER_CONFIG.METRICS_EMA_ALPHA) {
    this.totalBytes = totalBytes;
    this.emaAlpha = emaAlpha;
    this.reset(totalBytes);
  }

  public setTotalBytes(total: number): void {
    this.totalBytes = Math.max(0, total);
  }

  public start(): void {
    const now = Date.now();
    this.startTimeMs = now;
    this.lastUpdateTimeMs = now;
    this.lastBytesTransferred = this.bytesTransferred;
  }

  public recordBytes(bytes: number): void {
    this.bytesTransferred += bytes;
    if (this.totalBytes > 0 && this.bytesTransferred > this.totalBytes) {
      this.bytesTransferred = this.totalBytes;
    }
    this.updateSpeed();
  }

  public setBytesTransferred(bytes: number): void {
    this.bytesTransferred = Math.max(0, bytes);
    if (this.totalBytes > 0 && this.bytesTransferred > this.totalBytes) {
      this.bytesTransferred = this.totalBytes;
    }
    this.updateSpeed();
  }

  public recordFrameDispatched(): void {
    this.framesDispatched++;
  }

  public recordFrameReceived(isDuplicate = false, isCorrupt = false): void {
    this.framesReceived++;
    if (isDuplicate) {
      this.duplicateFrames++;
    }
    if (isCorrupt) {
      this.corruptFrames++;
    }
  }

  private updateSpeed(): void {
    const now = Date.now();
    if (this.startTimeMs === 0) {
      this.startTimeMs = now;
      this.lastUpdateTimeMs = now;
      this.lastBytesTransferred = this.bytesTransferred;
      return;
    }

    const elapsedDeltaMs = now - this.lastUpdateTimeMs;
    // Update instantaneous speed if window has passed
    if (elapsedDeltaMs >= 100) {
      const bytesDelta = this.bytesTransferred - this.lastBytesTransferred;
      const currentInstantSpeed = (bytesDelta / elapsedDeltaMs) * 1000;

      this.instantSpeedBps = Math.max(0, currentInstantSpeed);

      if (this.smoothedSpeedBps === 0) {
        this.smoothedSpeedBps = this.instantSpeedBps;
      } else {
        this.smoothedSpeedBps =
          this.emaAlpha * this.instantSpeedBps + (1 - this.emaAlpha) * this.smoothedSpeedBps;
      }

      this.lastUpdateTimeMs = now;
      this.lastBytesTransferred = this.bytesTransferred;
    }
  }

  public getSnapshot(): TransferMetricsSnapshot {
    this.updateSpeed();

    const now = Date.now();
    const elapsedMs = this.startTimeMs > 0 ? Math.max(0, now - this.startTimeMs) : 0;
    const elapsedSeconds = Math.round((elapsedMs / 1000) * 10) / 10;

    const progressPercentage =
      this.totalBytes > 0
        ? Math.min(100, Math.round((this.bytesTransferred / this.totalBytes) * 1000) / 10)
        : 0;

    const speedKbps = Math.round((this.smoothedSpeedBps / 1024) * 10) / 10;
    const speedMbps = Math.round((this.smoothedSpeedBps / (1024 * 1024)) * 100) / 100;

    const remainingBytes = Math.max(0, this.totalBytes - this.bytesTransferred);
    const etaSeconds =
      this.smoothedSpeedBps > 0 && remainingBytes > 0
        ? Math.round(remainingBytes / this.smoothedSpeedBps)
        : 0;

    const totalFrames = Math.max(this.framesDispatched, this.framesReceived);
    const fpsAchieved =
      elapsedSeconds > 0 ? Math.round((totalFrames / elapsedSeconds) * 10) / 10 : 0;

    return {
      bytesTransferred: this.bytesTransferred,
      totalBytes: this.totalBytes,
      progressPercentage,
      instantSpeedBps: Math.round(this.instantSpeedBps),
      smoothedSpeedBps: Math.round(this.smoothedSpeedBps),
      speedKbps,
      speedMbps,
      etaSeconds,
      elapsedSeconds,
      framesDispatched: this.framesDispatched,
      framesReceived: this.framesReceived,
      duplicateFrames: this.duplicateFrames,
      corruptFrames: this.corruptFrames,
      fpsAchieved,
    };
  }

  public reset(totalBytes = 0): void {
    this.totalBytes = totalBytes;
    this.bytesTransferred = 0;
    this.framesDispatched = 0;
    this.framesReceived = 0;
    this.duplicateFrames = 0;
    this.corruptFrames = 0;
    this.startTimeMs = 0;
    this.lastUpdateTimeMs = 0;
    this.lastBytesTransferred = 0;
    this.instantSpeedBps = 0;
    this.smoothedSpeedBps = 0;
  }
}
