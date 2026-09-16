/**
 * OptiShare Optical Frame Dispatcher
 *
 * Paces binary frame emission at a controlled frame-rate (FPS)
 * for optical transmission (e.g. screen rendering).
 * Supports finite frame arrays and continuous Fountain droplet generators.
 */

import { TRANSFER_CONFIG } from '../constants/transferConstants';

export type FrameSupplier = (index: number) => Uint8Array | null;

export class FrameDispatcher {
  private fps: number;
  private intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frameSupplier: FrameSupplier | null = null;
  private frames: Uint8Array[] = [];
  private loopFrames = false;

  private _currentIndex = 0;
  private _isRunning = false;
  private _isPaused = false;
  private onFrameCallback: ((frame: Uint8Array, frameIndex: number) => void) | null = null;

  constructor(fps: number = TRANSFER_CONFIG.DEFAULT_FRAME_RATE_FPS) {
    this.fps = Math.max(
      TRANSFER_CONFIG.MIN_FRAME_RATE_FPS,
      Math.min(TRANSFER_CONFIG.MAX_FRAME_RATE_FPS, fps),
    );
    this.intervalMs = Math.round(1000 / this.fps);
  }

  public get currentIndex(): number {
    return this._currentIndex;
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public get isPaused(): boolean {
    return this._isPaused;
  }

  public setFps(fps: number): void {
    this.fps = Math.max(
      TRANSFER_CONFIG.MIN_FRAME_RATE_FPS,
      Math.min(TRANSFER_CONFIG.MAX_FRAME_RATE_FPS, fps),
    );
    this.intervalMs = Math.round(1000 / this.fps);

    if (this._isRunning && !this._isPaused) {
      this.restartTimer();
    }
  }

  /**
   * Sets a static array of frames to dispatch.
   */
  public setFrames(frames: Uint8Array[], loop = false): void {
    this.frames = frames;
    this.frameSupplier = null;
    this.loopFrames = loop;
    this._currentIndex = 0;
  }

  /**
   * Sets a continuous frame supplier function (e.g. for rateless Fountain codes).
   */
  public setSupplier(supplier: FrameSupplier): void {
    this.frameSupplier = supplier;
    this.frames = [];
    this.loopFrames = false;
    this._currentIndex = 0;
  }

  /**
   * Starts frame emission loop.
   */
  public start(onFrame: (frame: Uint8Array, frameIndex: number) => void): void {
    this.stop();
    this.onFrameCallback = onFrame;
    this._isRunning = true;
    this._isPaused = false;
    this._currentIndex = 0;

    // Emit first frame immediately
    this.tick();
    this.startTimer();
  }

  /**
   * Emits the next single frame manually (useful for step-by-step test execution).
   */
  public step(): Uint8Array | null {
    const frame = this.getNextFrame();
    if (frame && this.onFrameCallback) {
      this.onFrameCallback(frame, this._currentIndex);
    }
    if (frame) {
      this._currentIndex++;
    }
    return frame;
  }

  public pause(): void {
    if (!this._isRunning || this._isPaused) return;
    this._isPaused = true;
    this.clearTimer();
  }

  public resume(): void {
    if (!this._isRunning || !this._isPaused) return;
    this._isPaused = false;
    this.startTimer();
  }

  public stop(): void {
    this._isRunning = false;
    this._isPaused = false;
    this.clearTimer();
    this.onFrameCallback = null;
  }

  private tick(): void {
    if (!this._isRunning || this._isPaused) return;

    const frame = this.getNextFrame();
    if (!frame) {
      // Reached the end of non-looping static frames
      this.stop();
      return;
    }

    if (this.onFrameCallback) {
      this.onFrameCallback(frame, this._currentIndex);
    }
    this._currentIndex++;
  }

  private getNextFrame(): Uint8Array | null {
    if (this.frameSupplier) {
      return this.frameSupplier(this._currentIndex);
    }

    if (this.frames.length === 0) {
      return null;
    }

    if (this._currentIndex >= this.frames.length) {
      if (this.loopFrames) {
        this._currentIndex = 0;
      } else {
        return null;
      }
    }

    return this.frames[this._currentIndex] ?? null;
  }

  private startTimer(): void {
    this.clearTimer();
    this.timer = setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private restartTimer(): void {
    this.clearTimer();
    this.startTimer();
  }
}
