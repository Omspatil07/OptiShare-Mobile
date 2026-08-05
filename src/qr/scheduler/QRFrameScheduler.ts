/**
 * OptiShare QR Engine — QRFrameScheduler
 *
 * Paced optical stream scheduler emitting QRFrames at a configurable frame rate (FPS).
 * Supports start, pause, resume, stop, loop, and step mode.
 */

import { DEFAULT_SCHEDULER_FPS } from '../constants/qrConstants';
import type { QRFrame } from '../models/QRFrame';
import type { QRSchedulerOptions } from '../types/qrTypes';

export type FrameCallback = (frame: QRFrame, index: number) => void;
export type StreamCompleteCallback = () => void;

export class QRFrameScheduler {
  private frames: QRFrame[] = [];
  private currentIndex = 0;
  private isRunning = false;
  private isPaused = false;
  private targetFps: number;
  private loop: boolean;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private onFrameCallback: FrameCallback | null = null;
  private onCompleteCallback: StreamCompleteCallback | null = null;

  constructor(options: QRSchedulerOptions = {}) {
    this.targetFps = options.targetFps ?? DEFAULT_SCHEDULER_FPS;
    this.loop = options.loop ?? true;
  }

  /** Set the queue of frames to schedule */
  public setFrames(frames: QRFrame[]): void {
    this.frames = frames;
    this.currentIndex = 0;
  }

  /** Set target frame rate (FPS) */
  public setFps(fps: number): void {
    if (fps <= 0) return;
    this.targetFps = fps;
    if (this.isRunning && !this.isPaused) {
      this.restartTimer();
    }
  }

  /** Register frame emission callback */
  public onFrame(cb: FrameCallback): void {
    this.onFrameCallback = cb;
  }

  /** Register completion callback */
  public onComplete(cb: StreamCompleteCallback): void {
    this.onCompleteCallback = cb;
  }

  /** Start emitting frames */
  public start(frames?: QRFrame[]): void {
    if (frames) {
      this.setFrames(frames);
    }
    if (this.frames.length === 0) {
      return;
    }
    this.isRunning = true;
    this.isPaused = false;
    this.emitCurrentFrame();
    this.restartTimer();
  }

  /** Pause the scheduler */
  public pause(): void {
    this.isPaused = true;
    this.clearTimer();
  }

  /** Resume emission from current frame index */
  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.restartTimer();
  }

  /** Stop emission and reset position */
  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.currentIndex = 0;
    this.clearTimer();
  }

  /** Advance to next frame manually */
  public nextStep(): QRFrame | null {
    if (this.frames.length === 0) return null;
    this.advance();
    this.emitCurrentFrame();
    return this.getCurrentFrame();
  }

  /** Get current active frame */
  public getCurrentFrame(): QRFrame | null {
    if (this.frames.length === 0) return null;
    return this.frames[this.currentIndex] ?? null;
  }

  /** Current frame index */
  public getIndex(): number {
    return this.currentIndex;
  }

  /** Total frame count */
  public getTotalFrames(): number {
    return this.frames.length;
  }

  /** Check if scheduler is active */
  public isActive(): boolean {
    return this.isRunning && !this.isPaused;
  }

  // ─── Private Internal Helpers ──────────────────────────────────────────────

  private emitCurrentFrame(): void {
    const frame = this.getCurrentFrame();
    if (frame && this.onFrameCallback) {
      this.onFrameCallback(frame, this.currentIndex);
    }
  }

  private advance(): void {
    if (this.frames.length === 0) return;
    if (this.currentIndex < this.frames.length - 1) {
      this.currentIndex++;
    } else if (this.loop) {
      this.currentIndex = 0;
    } else {
      this.stop();
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    }
  }

  private restartTimer(): void {
    this.clearTimer();
    const intervalMs = Math.max(16, Math.floor(1000 / this.targetFps));
    this.timerId = setInterval(() => {
      this.advance();
      if (this.isRunning && !this.isPaused) {
        this.emitCurrentFrame();
      }
    }, intervalMs);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
