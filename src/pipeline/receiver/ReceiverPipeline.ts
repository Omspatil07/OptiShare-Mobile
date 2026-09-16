/**
 * OptiShare Receiver Pipeline Orchestrator
 *
 * Coordinates the full receiving sequence:
 * Frame Ingest -> Validation & Anti-Replay -> Fountain Peeling Decoding ->
 * AES-256-GCM Decryption -> CRC-32 Verification & File Reconstruction.
 *
 * Provides lifecycle management (pause, resume, cancel), watchdog timeout recovery,
 * duplicate/corrupt frame handling, and real-time metrics.
 */

import { type FileMetadata, PacketType } from '../../protocol';
import {
  PIPELINE_CONFIG,
  PipelineErrorCode,
  PipelineStageId,
  PipelineStatus,
} from '../constants/pipelineConstants';
import { ReceiverDecryptionStage } from '../stages/receiver/ReceiverDecryptionStage';
import { ReceiverFountainStage } from '../stages/receiver/ReceiverFountainStage';
import { ReceiverReconstructionStage } from '../stages/receiver/ReceiverReconstructionStage';
import { ReceiverValidationStage } from '../stages/receiver/ReceiverValidationStage';
import type {
  PipelineFileMetadata,
  PipelineProgress,
  ReceiverPipelineConfig,
  ReceiverResult,
} from '../types/pipelineTypes';

export class ReceiverPipeline {
  private readonly config: ReceiverPipelineConfig;
  private status: PipelineStatus = PipelineStatus.IDLE;

  // Stages
  private readonly validationStage: ReceiverValidationStage;
  private readonly fountainStage: ReceiverFountainStage;
  private readonly decryptionStage = new ReceiverDecryptionStage();
  private readonly reconstructionStage = new ReceiverReconstructionStage();

  // State
  private sessionId = 0;
  private metadata: FileMetadata | null = null;
  private currentFrameIndex = 0;
  private corruptedFramesCount = 0;
  private replayedFramesCount = 0;
  private startTimeMs = 0;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly timeoutMs: number;
  private isFinalizing = false;

  constructor(config: ReceiverPipelineConfig = {}) {
    this.config = config;
    this.sessionId = config.sessionId ?? 0;
    this.timeoutMs = config.timeoutMs ?? PIPELINE_CONFIG.DEFAULT_WATCHDOG_TIMEOUT_MS;

    this.fountainStage = new ReceiverFountainStage(config.fountainSeed ?? 0);
    this.validationStage = new ReceiverValidationStage({
      expectedSessionId: this.sessionId,
      replayWindowSize: config.replayWindowSize,
    });
  }

  public get currentStatus(): PipelineStatus {
    return this.status;
  }

  public get currentSessionId(): number {
    return this.sessionId;
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

  public get metrics() {
    return {
      totalFrames: this.currentFrameIndex,
      corruptedFrames: this.corruptedFramesCount,
      replayedFrames: this.replayedFramesCount,
      decodedSymbols: this.fountainStage.decodedCount,
      totalSymbols: this.fountainStage.totalSymbols,
    };
  }

  /**
   * Starts receiver pipeline: transitions to RUNNING and arms the watchdog timeout.
   */
  public start(): void {
    if (this.status !== PipelineStatus.IDLE) return;
    this.transitionStatus(PipelineStatus.RUNNING);
    this.startTimeMs = Date.now();
    this.resetTimeout();
  }

  /**
   * Ingests an incoming raw binary frame from any transport medium (e.g. optical camera, mock stream).
   *
   * @param rawFrame Binary packet buffer.
   * @returns `true` if frame was valid and successfully consumed.
   */
  public async ingestFrame(rawFrame: Uint8Array): Promise<boolean> {
    if (
      this.status === PipelineStatus.COMPLETED ||
      this.status === PipelineStatus.CANCELLED ||
      this.status === PipelineStatus.ERROR ||
      this.isFinalizing
    ) {
      return false;
    }

    if (this.status === PipelineStatus.IDLE) {
      this.start();
    }

    // Refresh watchdog timer on frame arrival
    this.resetTimeout();

    // Stage 1: Validation & Anti-Replay
    const validationResult = this.validationStage.process(rawFrame);
    if (!validationResult.valid || !validationResult.packet) {
      if (validationResult.isCorrupted) {
        this.corruptedFramesCount++;
      }
      if (validationResult.isReplayed) {
        this.replayedFramesCount++;
      }
      return false;
    }

    const packet = validationResult.packet;
    this.currentFrameIndex++;

    // Bind session ID if starting fresh
    if (this.sessionId === 0 && packet.sessionId !== 0) {
      this.sessionId = packet.sessionId;
      this.validationStage.setExpectedSessionId(this.sessionId);
    }

    this.config.onFrameReceived?.(packet, this.currentFrameIndex);

    // Handle remote cancel or error packets
    if (packet.packetType === PacketType.CANCEL) {
      this.cancel('Cancelled by remote sender frame');
      return true;
    }

    // Stage 2: Fountain Decoding
    const fountainResult = this.fountainStage.process(packet);

    if (fountainResult.status === 'METADATA_RECEIVED') {
      this.metadata = fountainResult.metadata;
      this.emitProgress(PipelineStageId.FOUNTAIN_DECODE);
      return true;
    }

    if (fountainResult.status === 'PROGRESS') {
      this.emitProgress(PipelineStageId.FOUNTAIN_DECODE);
      return true;
    }

    if (fountainResult.status === 'COMPLETE' && fountainResult.reconstructedData) {
      // Fountain decoding complete! Trigger Stage 3 & 4
      await this.finalize(fountainResult.reconstructedData);
      return true;
    }

    return true;
  }

  /**
   * Finalizes the transfer: executes Decryption, CRC-32 verification,
   * optional filesystem persistence, and emits final result.
   */
  private async finalize(reconstructedPayload: Uint8Array): Promise<void> {
    if (this.isFinalizing || this.status === PipelineStatus.COMPLETED) {
      return;
    }

    this.isFinalizing = true;
    this.clearTimeout();
    this.transitionStatus(PipelineStatus.FINALIZING);

    try {
      if (!this.metadata) {
        throw new Error('Missing file metadata for finalization.');
      }

      // Stage 3: Decryption
      const decryptionOutput = await this.decryptionStage.process({
        data: reconstructedPayload,
        key: this.config.cryptoKey,
        isEncrypted: Boolean(this.config.cryptoKey),
        aad: this.config.aad,
      });

      // Stage 4: Reconstruction & CRC-32 Verification
      const reconstructionOutput = await this.reconstructionStage.process({
        plaintext: decryptionOutput.plaintext,
        metadata: this.metadata,
        expectedChecksum: this.metadata.fileChecksum,
        saveDirectory: this.config.saveDirectory,
        saveFileName: this.config.saveFileName,
        sessionId: this.sessionId,
      });

      const elapsedMs = Math.max(1, Date.now() - this.startTimeMs);

      const result: ReceiverResult = {
        data: reconstructionOutput.data,
        metadata: {
          fileName: this.metadata.fileName,
          fileSizeBytes: reconstructionOutput.data.length,
          mimeType: this.metadata.mimeType,
          fileChecksum: reconstructionOutput.checksum,
          isEncrypted: decryptionOutput.wasEncrypted,
          sessionId: this.sessionId,
          totalChunks: this.metadata.totalChunks,
          chunkSize: this.metadata.chunkSize,
        },
        savedFilePath: reconstructionOutput.savedFilePath,
        elapsedMs,
        totalFramesReceived: this.currentFrameIndex,
      };

      this.transitionStatus(PipelineStatus.COMPLETED);
      this.emitProgress(PipelineStageId.RECONSTRUCTION);
      this.config.onComplete?.(result);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.transitionStatus(PipelineStatus.ERROR);
      this.config.onError?.(error, PipelineErrorCode.STAGE_EXECUTION_FAILED);
    } finally {
      this.isFinalizing = false;
    }
  }

  public pause(): void {
    if (this.status !== PipelineStatus.RUNNING) return;
    this.clearTimeout();
    this.transitionStatus(PipelineStatus.PAUSED);
  }

  public resume(): void {
    if (this.status !== PipelineStatus.PAUSED) return;
    this.transitionStatus(PipelineStatus.RUNNING);
    this.resetTimeout();
  }

  public cancel(reason = 'Cancelled by receiver'): void {
    if (this.status === PipelineStatus.COMPLETED || this.status === PipelineStatus.CANCELLED) {
      return;
    }
    this.clearTimeout();
    this.transitionStatus(PipelineStatus.CANCELLED);
    this.config.onError?.(new Error(reason), PipelineErrorCode.CANCELLED);
  }

  public reset(): void {
    this.clearTimeout();
    this.validationStage.reset();
    this.fountainStage.reset();
    this.decryptionStage.reset();
    this.reconstructionStage.reset();

    this.status = PipelineStatus.IDLE;
    this.sessionId = this.config.sessionId ?? 0;
    this.metadata = null;
    this.currentFrameIndex = 0;
    this.corruptedFramesCount = 0;
    this.replayedFramesCount = 0;
    this.startTimeMs = 0;
    this.isFinalizing = false;
  }

  private resetTimeout(): void {
    this.clearTimeout();
    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout();
    }, this.timeoutMs);
  }

  private clearTimeout(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  private handleTimeout(): void {
    if (this.status === PipelineStatus.RUNNING || this.status === PipelineStatus.INITIALIZING) {
      this.clearTimeout();
      this.transitionStatus(PipelineStatus.ERROR);
      this.config.onError?.(
        new Error(`Receiver timed out after ${this.timeoutMs}ms of inactivity.`),
        PipelineErrorCode.TIMEOUT,
      );
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
    if (!this.config.onProgress || !this.metadata) return;

    const totalSymbols = this.fountainStage.totalSymbols || this.metadata.totalChunks;
    const decodedSymbols = this.fountainStage.decodedCount;
    const chunkSize = this.metadata.chunkSize;
    const totalBytes = this.metadata.fileSizeBytes;

    const bytesProcessed = Math.min(totalBytes, decodedSymbols * chunkSize);
    const percentage =
      totalSymbols > 0 ? Math.min(100, Math.round((decodedSymbols / totalSymbols) * 100)) : 0;

    const elapsedMs = Math.max(1, Date.now() - this.startTimeMs);
    const elapsedSec = elapsedMs / 1000;
    const speedBytesPerSec = Math.round(bytesProcessed / elapsedSec);

    const remainingBytes = Math.max(0, totalBytes - bytesProcessed);
    const etaSeconds = speedBytesPerSec > 0 ? Math.round(remainingBytes / speedBytesPerSec) : null;

    const progress: PipelineProgress = {
      bytesProcessed,
      totalBytes,
      percentage,
      framesCount: this.currentFrameIndex,
      speedBytesPerSec,
      etaSeconds,
      currentStage: stage,
    };

    this.config.onProgress(progress);
  }
}
