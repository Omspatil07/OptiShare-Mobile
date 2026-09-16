/**
 * OptiShare Sender Pipeline Orchestrator
 *
 * Coordinates the full sending sequence:
 * File Read -> AES-256-GCM Encryption -> Chunking -> Fountain Coding -> Optical Protocol Framing.
 *
 * Provides lifecycle management (start, pause, resume, cancel, step),
 * paced frame dispatching, and real-time metrics (progress, speed, ETA).
 */

import { FileSystemService } from '../../filesystem';
import { FileMetadata, generateSessionId, stringToUtf8 } from '../../protocol';
import {
  PIPELINE_CONFIG,
  PipelineErrorCode,
  PipelineStageId,
  PipelineStatus,
} from '../constants/pipelineConstants';
import { SenderChunkingStage } from '../stages/sender/SenderChunkingStage';
import { SenderEncryptionStage } from '../stages/sender/SenderEncryptionStage';
import {
  SenderFountainStage,
  type SenderFountainOutput,
} from '../stages/sender/SenderFountainStage';
import { SenderFramingStage, type SenderFramingOutput } from '../stages/sender/SenderFramingStage';
import type {
  PipelineFileMetadata,
  PipelineProgress,
  SenderPipelineConfig,
} from '../types/pipelineTypes';

export class SenderPipeline {
  private readonly config: SenderPipelineConfig;
  private status: PipelineStatus = PipelineStatus.IDLE;

  // Stages
  private readonly encryptionStage = new SenderEncryptionStage();
  private readonly chunkingStage = new SenderChunkingStage();
  private readonly fountainStage = new SenderFountainStage();
  private readonly framingStage = new SenderFramingStage();

  // Execution state
  private sessionId = 0;
  private metadata: FileMetadata | null = null;
  private framingOutput: SenderFramingOutput | null = null;
  private fountainOutput: SenderFountainOutput | null = null;
  private totalFrames = 0;
  private currentFrameIndex = 0;
  private startTimeMs = 0;
  private bytesTransferred = 0;
  private totalPayloadBytes = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  constructor(config: SenderPipelineConfig) {
    this.config = config;
  }

  public get currentStatus(): PipelineStatus {
    return this.status;
  }

  public get sessionMetadata(): PipelineFileMetadata | null {
    if (!this.metadata) return null;
    return {
      fileName: this.metadata.fileName,
      fileSizeBytes: this.metadata.fileSizeBytes,
      mimeType: this.metadata.mimeType,
      fileChecksum: this.metadata.fileChecksum,
      isEncrypted: Boolean(this.config.cryptoKey),
      sessionId: this.sessionId,
      totalChunks: this.metadata.totalChunks,
      chunkSize: this.metadata.chunkSize,
    };
  }

  public get framesTotal(): number {
    return this.totalFrames;
  }

  public get frameIndex(): number {
    return this.currentFrameIndex;
  }

  /**
   * Initializes the pipeline: reads file, performs encryption, creates symbols,
   * configures Fountain encoder, and prepares binary framing.
   */
  public async initialize(): Promise<void> {
    if (this.status !== PipelineStatus.IDLE) {
      throw new Error(`Cannot initialize pipeline in state: ${this.status}`);
    }

    this.transitionStatus(PipelineStatus.INITIALIZING);

    try {
      // 1. Resolve raw file bytes
      let rawBytes: Uint8Array;
      if (this.config.fileData) {
        rawBytes = this.config.fileData;
      } else if (this.config.filePath) {
        const fileContentBase64 = await FileSystemService.readFile(this.config.filePath, {
          encoding: 'base64',
        });
        rawBytes = stringToUtf8(fileContentBase64);
      } else {
        throw new Error('Neither fileData nor filePath was provided.');
      }

      this.sessionId = this.config.sessionId ?? generateSessionId();
      const symbolSize = this.config.symbolSize ?? PIPELINE_CONFIG.DEFAULT_SYMBOL_SIZE;

      // 2. Stage: Encryption
      const encryptionOutput = await this.encryptionStage.process({
        plaintext: rawBytes,
        key: this.config.cryptoKey,
        aad: this.config.aad,
      });

      const payloadData = encryptionOutput.data;
      this.totalPayloadBytes = payloadData.length;

      // 3. Stage: Chunking
      const chunkingOutput = this.chunkingStage.process({
        data: payloadData,
        symbolSize,
      });

      // 4. Stage: Fountain Coding
      this.fountainOutput = this.fountainStage.process({
        data: payloadData,
        symbolSize,
        seed: this.config.fountainSeed,
      });

      // 5. Build FileMetadata
      this.metadata = new FileMetadata({
        fileName: this.config.fileName,
        fileSizeBytes: payloadData.length,
        mimeType: this.config.mimeType ?? 'application/octet-stream',
        fileChecksum: encryptionOutput.originalChecksum,
        chunkSize: symbolSize,
        totalChunks: chunkingOutput.totalChunks,
      });

      // 6. Stage: Framing
      this.framingOutput = this.framingStage.process({
        sessionId: this.sessionId,
        metadata: this.metadata,
        fountainOutput: this.fountainOutput,
      });

      const redundancy = this.config.redundancyFactor ?? PIPELINE_CONFIG.DEFAULT_REDUNDANCY_FACTOR;
      this.totalFrames = Math.ceil(this.fountainOutput.k * redundancy) + 1;

      this.isInitialized = true;
      this.transitionStatus(PipelineStatus.IDLE);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.transitionStatus(PipelineStatus.ERROR);
      this.config.onError?.(error, PipelineErrorCode.INITIALIZATION_FAILED);
      throw error;
    }
  }

  /**
   * Starts timed automatic frame transmission loop.
   */
  public start(): void {
    if (!this.isInitialized) {
      throw new Error('SenderPipeline must be initialized before starting.');
    }

    if (
      this.status === PipelineStatus.RUNNING ||
      this.status === PipelineStatus.COMPLETED ||
      this.status === PipelineStatus.CANCELLED
    ) {
      return;
    }

    this.transitionStatus(PipelineStatus.RUNNING);
    this.startTimeMs = Date.now();

    const fps = this.config.fps ?? PIPELINE_CONFIG.DEFAULT_FPS;
    const intervalMs = Math.max(1, Math.floor(1000 / fps));

    this.timer = setInterval(() => {
      const frame = this.step();
      if (!frame || this.currentFrameIndex >= this.totalFrames) {
        this.complete();
      }
    }, intervalMs);
  }

  /**
   * Manually steps the pipeline by 1 frame. Returns serialized frame or null if finished.
   */
  public step(): Uint8Array | null {
    if (!this.isInitialized || !this.framingOutput) {
      return null;
    }

    if (this.status === PipelineStatus.IDLE) {
      this.transitionStatus(PipelineStatus.RUNNING);
      this.startTimeMs = Date.now();
    }

    if (this.status !== PipelineStatus.RUNNING) {
      return null;
    }

    const frame = this.framingOutput.getFrame(this.currentFrameIndex);
    const frameIndex = this.currentFrameIndex;
    this.currentFrameIndex++;

    const symbolSize = this.config.symbolSize ?? PIPELINE_CONFIG.DEFAULT_SYMBOL_SIZE;
    this.bytesTransferred = Math.min(this.totalPayloadBytes, this.currentFrameIndex * symbolSize);

    this.config.onFrame?.(frame, frameIndex, this.totalFrames);
    this.emitProgress(PipelineStageId.FRAMING);

    return frame;
  }

  public pause(): void {
    if (this.status !== PipelineStatus.RUNNING) return;
    this.stopTimer();
    this.transitionStatus(PipelineStatus.PAUSED);
  }

  public resume(): void {
    if (this.status !== PipelineStatus.PAUSED) return;
    this.start();
  }

  public cancel(reason = 'Cancelled by sender'): void {
    if (this.status === PipelineStatus.COMPLETED || this.status === PipelineStatus.CANCELLED) {
      return;
    }
    this.stopTimer();
    this.transitionStatus(PipelineStatus.CANCELLED);
    this.config.onError?.(new Error(reason), PipelineErrorCode.CANCELLED);
  }

  public complete(): void {
    if (this.status === PipelineStatus.COMPLETED) return;
    this.stopTimer();
    this.bytesTransferred = this.totalPayloadBytes;
    this.transitionStatus(PipelineStatus.COMPLETED);
    this.emitProgress(PipelineStageId.FRAMING);
    this.config.onComplete?.();
  }

  public reset(): void {
    this.stopTimer();
    this.encryptionStage.reset();
    this.chunkingStage.reset();
    this.fountainStage.reset();
    this.framingStage.reset();

    this.status = PipelineStatus.IDLE;
    this.metadata = null;
    this.framingOutput = null;
    this.fountainOutput = null;
    this.totalFrames = 0;
    this.currentFrameIndex = 0;
    this.bytesTransferred = 0;
    this.totalPayloadBytes = 0;
    this.isInitialized = false;
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private transitionStatus(next: PipelineStatus): void {
    const prev = this.status;
    if (prev !== next) {
      this.status = next;
      this.config.onStatusChange?.(next, prev);
    }
  }

  private emitProgress(stage: PipelineStageId): void {
    if (!this.config.onProgress) return;

    const elapsedMs = Math.max(1, Date.now() - this.startTimeMs);
    const elapsedSec = elapsedMs / 1000;
    const speedBytesPerSec = Math.round(this.bytesTransferred / elapsedSec);

    const remainingBytes = Math.max(0, this.totalPayloadBytes - this.bytesTransferred);
    const etaSeconds = speedBytesPerSec > 0 ? Math.round(remainingBytes / speedBytesPerSec) : null;

    const percentage =
      this.totalFrames > 0
        ? Math.min(100, Math.round((this.currentFrameIndex / this.totalFrames) * 100))
        : 0;

    const progress: PipelineProgress = {
      bytesProcessed: this.bytesTransferred,
      totalBytes: this.totalPayloadBytes,
      percentage,
      framesCount: this.currentFrameIndex,
      speedBytesPerSec,
      etaSeconds,
      currentStage: stage,
    };

    this.config.onProgress(progress);
  }
}
