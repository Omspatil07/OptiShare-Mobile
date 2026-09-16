/**
 * OptiShare Transfer Sender Pipeline
 *
 * Prepares files, configures standard chunking or rateless Fountain codes,
 * paces frame dispatching, and tracks real-time sender transfer metrics.
 */

import { FrameDispatcher } from './FrameDispatcher';
import { FountainEngine, FountainProtocolBridge, type FountainEncoder } from '../../fec';
import { FileSystemService } from '../../filesystem';
import {
  CRC32,
  FileMetadata,
  PacketEncoder,
  generateSessionId,
  stringToUtf8,
} from '../../protocol';
import {
  TRANSFER_CONFIG,
  TransferEngineState,
  TransferErrorCode,
  TransferMode,
  TransferRole,
} from '../constants/transferConstants';
import { TransferMetrics } from '../metrics/TransferMetrics';
import { TransferStateMachine } from '../state/TransferStateMachine';
import type {
  TransferMetricsSnapshot,
  TransferSenderOptions,
  TransferSessionInfo,
} from '../types/transferTypes';

export class TransferSender {
  private readonly options: TransferSenderOptions;
  private readonly stateMachine: TransferStateMachine;
  private readonly metrics: TransferMetrics;
  private readonly dispatcher: FrameDispatcher;

  private sessionId: number = 0;
  private metadata: FileMetadata | null = null;
  private fileBytes: Uint8Array | null = null;
  private fountainEncoder: FountainEncoder | null = null;
  private totalFrames: number = 0;
  private fileInfoBuffer: Uint8Array | null = null;
  private completeBuffer: Uint8Array | null = null;
  private startTimeMs: number = 0;
  private endTimeMs: number | null = null;

  constructor(options: TransferSenderOptions) {
    this.options = options;
    this.stateMachine = new TransferStateMachine(TransferEngineState.IDLE);
    this.metrics = new TransferMetrics();
    this.dispatcher = new FrameDispatcher(options.fps ?? TRANSFER_CONFIG.DEFAULT_FRAME_RATE_FPS);

    this.stateMachine.addListener({
      onStateChange: (_from, to) => {
        this.options.onStateChange?.(to);
      },
    });
  }

  public get state(): TransferEngineState {
    return this.stateMachine.currentState;
  }

  public get sessionInfo(): TransferSessionInfo {
    return {
      sessionId: this.sessionId,
      role: TransferRole.SENDER,
      state: this.stateMachine.currentState,
      mode: this.options.mode ?? TransferMode.STANDARD,
      fileName: this.options.fileName,
      fileSizeBytes: this.fileBytes ? this.fileBytes.length : 0,
      totalFrames: this.totalFrames,
      currentFrame: this.dispatcher.currentIndex,
      startTimeMs: this.startTimeMs,
      endTimeMs: this.endTimeMs,
    };
  }

  public getMetrics(): TransferMetricsSnapshot {
    return this.metrics.getSnapshot();
  }

  /**
   * Prepares file bytes, metadata, and frames for transmission.
   */
  public async prepare(): Promise<void> {
    this.stateMachine.transition(TransferEngineState.PREPARING, 'Preparing file for transfer');

    try {
      // 1. Resolve file binary bytes
      if (this.options.fileData) {
        this.fileBytes = this.options.fileData;
      } else if (this.options.filePath) {
        // Read file via FileSystemService or throw if unavailable
        const fileContentBase64 = await FileSystemService.readFile(this.options.filePath, {
          encoding: 'base64',
        });
        this.fileBytes = stringToUtf8(fileContentBase64);
      } else {
        throw new Error('Neither fileData nor filePath was provided to TransferSender');
      }

      this.sessionId = this.options.sessionId ?? generateSessionId();
      const chunkSize = this.options.chunkSize ?? TRANSFER_CONFIG.DEFAULT_CHUNK_SIZE;
      const fileChecksum = CRC32.calculate(this.fileBytes);
      const totalChunks = FileMetadata.calculateTotalChunks(this.fileBytes.length, chunkSize);

      this.metadata = new FileMetadata({
        fileName: this.options.fileName,
        fileSizeBytes: this.fileBytes.length,
        mimeType: this.options.mimeType ?? 'application/octet-stream',
        fileChecksum,
        chunkSize,
        totalChunks,
      });

      this.metrics.reset(this.fileBytes.length);
      const mode = this.options.mode ?? TransferMode.STANDARD;

      // Encode FILE_INFO buffer
      this.fileInfoBuffer = PacketEncoder.encodeFileInfo(this.sessionId, this.metadata);
      this.completeBuffer = PacketEncoder.encodeComplete(
        this.sessionId,
        fileChecksum,
        this.fileBytes.length,
      );

      if (mode === TransferMode.STANDARD) {
        this.prepareStandardFrames(chunkSize);
      } else {
        this.prepareFountainFrames(chunkSize);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.stateMachine.transition(TransferEngineState.FAILED, error.message);
      this.options.onError?.(error, TransferErrorCode.FILE_READ_FAILED);
      throw error;
    }
  }

  private prepareStandardFrames(chunkSize: number): void {
    if (!this.fileBytes || !this.fileInfoBuffer || !this.completeBuffer) return;

    const dataBuffers = PacketEncoder.sliceFileIntoDataPackets(
      this.sessionId,
      this.fileBytes,
      chunkSize,
    );

    // Frame sequence: [FILE_INFO, ...DATA_PACKETS, COMPLETE]
    const allFrames = [this.fileInfoBuffer, ...dataBuffers, this.completeBuffer];
    this.totalFrames = allFrames.length;

    // By default, loop static frames in optical transmission until sender finishes
    this.dispatcher.setFrames(allFrames, true);
  }

  private prepareFountainFrames(symbolSize: number): void {
    if (!this.fileBytes || !this.fileInfoBuffer) return;

    const engine = FountainEngine.getInstance();
    const encoderOptions: { symbolSize: number; seed?: number } = { symbolSize };
    if (this.options.fountainSeed !== undefined) {
      encoderOptions.seed = this.options.fountainSeed;
    }
    this.fountainEncoder = engine.createEncoder(this.fileBytes, encoderOptions);

    const k = this.fountainEncoder.k;
    // Estimated frames based on redundancy factor (e.g. k * 1.3)
    const redundancy =
      this.options.redundancyFactor ?? TRANSFER_CONFIG.DEFAULT_FOUNTAIN_REDUNDANCY_FACTOR;
    this.totalFrames = Math.ceil(k * redundancy) + 1;

    const fileInfo = this.fileInfoBuffer;
    const encoder = this.fountainEncoder;
    const sid = this.sessionId;

    // Fountain frame supplier:
    // Frame 0, 1: FILE_INFO metadata frames to announce session
    // Frame 2+: Continuous rateless droplet packets
    this.dispatcher.setSupplier((index: number) => {
      if (index === 0 || index % Math.max(10, k) === 0) {
        return fileInfo;
      }
      const dropletIndex = index > 0 ? index - 1 : 0;
      const droplet = encoder.getDroplet(dropletIndex);
      return FountainProtocolBridge.encodeDropletToPacket(sid, k, droplet);
    });
  }

  /**
   * Starts optical transmission loop.
   */
  public start(): void {
    if (
      this.stateMachine.currentState !== TransferEngineState.PREPARING &&
      this.stateMachine.currentState !== TransferEngineState.PAUSED
    ) {
      if (this.stateMachine.currentState === TransferEngineState.IDLE) {
        throw new Error('Cannot start transfer: must call prepare() first');
      }
      return;
    }

    this.stateMachine.transition(
      TransferEngineState.TRANSFERRING,
      'Starting optical frame transmission',
    );
    this.startTimeMs = Date.now();
    this.metrics.start();

    const chunkSize = this.options.chunkSize ?? TRANSFER_CONFIG.DEFAULT_CHUNK_SIZE;

    this.dispatcher.start((frame: Uint8Array, frameIndex: number) => {
      this.metrics.recordFrameDispatched();
      // Record byte progress
      if (this.metadata && this.metadata.fileSizeBytes > 0) {
        this.metrics.recordBytes(chunkSize);
      }

      const snapshot = this.metrics.getSnapshot();
      this.options.onFrameDispatched?.(frame, frameIndex, this.totalFrames);
      this.options.onProgress?.(snapshot);
    });
  }

  /**
   * Manually steps the dispatcher by 1 frame (useful in test assertions).
   */
  public step(): Uint8Array | null {
    if (this.stateMachine.currentState === TransferEngineState.PREPARING) {
      this.stateMachine.transition(
        TransferEngineState.TRANSFERRING,
        'Stepping optical transmission',
      );
      this.startTimeMs = Date.now();
      this.metrics.start();
    }

    const frame = this.dispatcher.step();
    if (frame) {
      this.metrics.recordFrameDispatched();
      const chunkSize = this.options.chunkSize ?? TRANSFER_CONFIG.DEFAULT_CHUNK_SIZE;
      this.metrics.recordBytes(chunkSize);
      this.options.onFrameDispatched?.(frame, this.dispatcher.currentIndex - 1, this.totalFrames);
      this.options.onProgress?.(this.metrics.getSnapshot());
    }
    return frame;
  }

  public pause(): void {
    if (this.stateMachine.currentState !== TransferEngineState.TRANSFERRING) return;
    this.dispatcher.pause();
    this.stateMachine.transition(TransferEngineState.PAUSED, 'Transfer paused by sender');
  }

  public resume(): void {
    if (this.stateMachine.currentState !== TransferEngineState.PAUSED) return;
    this.stateMachine.transition(TransferEngineState.TRANSFERRING, 'Transfer resumed by sender');
    this.dispatcher.resume();
  }

  public complete(): void {
    if (this.stateMachine.isTerminal) return;
    this.dispatcher.stop();
    this.endTimeMs = Date.now();

    if (this.metadata) {
      this.metrics.setBytesTransferred(this.metadata.fileSizeBytes);
    }

    this.stateMachine.transition(TransferEngineState.COMPLETED, 'Transfer completed successfully');

    if (this.metadata) {
      this.options.onComplete?.(this.metadata);
    }
  }

  public cancel(reason = 'Cancelled by user'): void {
    if (this.stateMachine.isTerminal) return;
    this.dispatcher.stop();
    this.endTimeMs = Date.now();
    this.stateMachine.transition(TransferEngineState.CANCELLED, reason);
  }

  public destroy(): void {
    this.dispatcher.stop();
    this.stateMachine.reset();
    this.metrics.reset();
    this.fileBytes = null;
    this.fountainEncoder = null;
    this.metadata = null;
  }
}
