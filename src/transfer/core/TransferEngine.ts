/**
 * OptiShare Transfer Engine (Main Facade)
 *
 * Coordinates sender and receiver sessions, manages real-time state synchronization
 * with Zustand global store, provides retry/recovery handling, and supports
 * both Standard Chunk and Fountain Rateless FEC transfer pipelines.
 */

import type { ProtocolPacket } from '../../protocol';
import { useTransferStore, type TransferRole as StoreRole } from '../../store';
import { TRANSFER_CONFIG, TransferEngineState } from '../constants/transferConstants';
import { TransferReceiver } from '../receiver/TransferReceiver';
import { TransferSender } from '../sender/TransferSender';
import type {
  TransferEngineOptions,
  TransferReceiverOptions,
  TransferSenderOptions,
  TransferSessionInfo,
} from '../types/transferTypes';

export class TransferEngine {
  private static instance: TransferEngine | null = null;
  private readonly options: TransferEngineOptions;

  private activeSender: TransferSender | null = null;
  private activeReceiver: TransferReceiver | null = null;
  private lastSenderOptions: TransferSenderOptions | null = null;
  private lastReceiverOptions: TransferReceiverOptions | null = null;
  private retryCount = 0;

  constructor(options: TransferEngineOptions = {}) {
    this.options = {
      autoSyncStore: true,
      defaultChunkSize: TRANSFER_CONFIG.DEFAULT_CHUNK_SIZE,
      defaultFps: TRANSFER_CONFIG.DEFAULT_FRAME_RATE_FPS,
      defaultTimeoutMs: TRANSFER_CONFIG.DEFAULT_INACTIVITY_TIMEOUT_MS,
      ...options,
    };
  }

  public static getInstance(options?: TransferEngineOptions): TransferEngine {
    if (!TransferEngine.instance) {
      TransferEngine.instance = new TransferEngine(options);
    }
    return TransferEngine.instance;
  }

  public getActiveSender(): TransferSender | null {
    return this.activeSender;
  }

  public getActiveReceiver(): TransferReceiver | null {
    return this.activeReceiver;
  }

  public getActiveSessionInfo(): TransferSessionInfo | null {
    if (this.activeSender) {
      return this.activeSender.sessionInfo;
    }
    if (this.activeReceiver) {
      return this.activeReceiver.sessionInfo;
    }
    return null;
  }

  /**
   * Initializes and starts an outgoing optical transfer sender session.
   *
   * @param options TransferSenderOptions configuration.
   * @returns Prepared and started TransferSender instance.
   */
  public async startSend(options: TransferSenderOptions): Promise<TransferSender> {
    this.reset();
    this.lastSenderOptions = options;
    this.retryCount = 0;

    const sender = new TransferSender({
      ...options,
      chunkSize: options.chunkSize ?? this.options.defaultChunkSize,
      fps: options.fps ?? this.options.defaultFps,
      onProgress: (metrics) => {
        if (this.options.autoSyncStore) {
          const store = useTransferStore.getState();
          store.updateProgress(metrics.framesDispatched, metrics.speedMbps, metrics.elapsedSeconds);
        }
        options.onProgress?.(metrics);
      },
      onStateChange: (state) => {
        if (this.options.autoSyncStore) {
          this.syncStoreState(state);
        }
        options.onStateChange?.(state);
      },
      onComplete: (metadata) => {
        if (this.options.autoSyncStore) {
          useTransferStore.getState().setTransferStatus('completed');
        }
        options.onComplete?.(metadata);
      },
      onError: (err, code) => {
        if (this.options.autoSyncStore) {
          useTransferStore.getState().setTransferError(err.message);
        }
        options.onError?.(err, code);
      },
    });

    this.activeSender = sender;

    await sender.prepare();

    if (this.options.autoSyncStore) {
      const storeRole: StoreRole = 'sender';
      useTransferStore
        .getState()
        .startTransfer(
          String(sender.sessionInfo.sessionId),
          storeRole,
          sender.sessionInfo.totalFrames,
        );
    }

    sender.start();
    return sender;
  }

  /**
   * Initializes and arms an incoming optical transfer receiver session.
   *
   * @param options TransferReceiverOptions configuration.
   * @returns Armed TransferReceiver instance listening for optical frames.
   */
  public startReceive(options: TransferReceiverOptions = {}): TransferReceiver {
    this.reset();
    this.lastReceiverOptions = options;
    this.retryCount = 0;

    const receiver = new TransferReceiver({
      ...options,
      timeoutMs: options.timeoutMs ?? this.options.defaultTimeoutMs,
      onProgress: (metrics) => {
        if (this.options.autoSyncStore) {
          const store = useTransferStore.getState();
          store.updateProgress(metrics.framesReceived, metrics.speedMbps, metrics.elapsedSeconds);
        }
        options.onProgress?.(metrics);
      },
      onStateChange: (state) => {
        if (this.options.autoSyncStore) {
          this.syncStoreState(state);
        }
        options.onStateChange?.(state);
      },
      onComplete: (fileBytes, metadata, savedPath) => {
        if (this.options.autoSyncStore) {
          useTransferStore.getState().setTransferStatus('completed');
        }
        options.onComplete?.(fileBytes, metadata, savedPath);
      },
      onError: (err, code) => {
        if (this.options.autoSyncStore) {
          useTransferStore.getState().setTransferError(err.message);
        }
        options.onError?.(err, code);
      },
    });

    this.activeReceiver = receiver;

    if (this.options.autoSyncStore) {
      const storeRole: StoreRole = 'receiver';
      useTransferStore
        .getState()
        .startTransfer(String(receiver.sessionInfo.sessionId), storeRole, 0);
    }

    receiver.start();
    return receiver;
  }

  /**
   * Ingests an incoming optical frame into the active receiver session.
   *
   * @param frame Raw Uint8Array from camera/scanner, or decoded ProtocolPacket.
   * @returns `true` if frame was successfully ingested.
   */
  public ingestFrame(frame: Uint8Array | ProtocolPacket): boolean {
    if (!this.activeReceiver) {
      return false;
    }
    return this.activeReceiver.ingestFrame(frame);
  }

  /**
   * Pauses active sender or receiver session.
   */
  public pause(): void {
    this.activeSender?.pause();
    this.activeReceiver?.pause();
    if (this.options.autoSyncStore) {
      useTransferStore.getState().setTransferStatus('paused');
    }
  }

  /**
   * Resumes paused sender or receiver session.
   */
  public resume(): void {
    this.activeSender?.resume();
    this.activeReceiver?.resume();
    if (this.options.autoSyncStore) {
      useTransferStore.getState().setTransferStatus('transferring');
    }
  }

  /**
   * Cancels active transfer session.
   */
  public cancel(reason = 'Cancelled by user'): void {
    this.activeSender?.cancel(reason);
    this.activeReceiver?.cancel(reason);
    if (this.options.autoSyncStore) {
      useTransferStore.getState().setTransferStatus('idle');
    }
  }

  /**
   * Retries the previous transfer operation if within retry limits.
   */
  public async retry(): Promise<boolean> {
    if (this.retryCount >= TRANSFER_CONFIG.DEFAULT_MAX_RETRIES) {
      return false;
    }

    this.retryCount++;

    if (this.lastSenderOptions) {
      await this.startSend(this.lastSenderOptions);
      return true;
    }

    if (this.lastReceiverOptions) {
      this.startReceive(this.lastReceiverOptions);
      return true;
    }

    return false;
  }

  /**
   * Resets active sessions and Zustand transfer store.
   */
  public reset(): void {
    if (this.activeSender) {
      this.activeSender.destroy();
      this.activeSender = null;
    }
    if (this.activeReceiver) {
      this.activeReceiver.destroy();
      this.activeReceiver = null;
    }
    if (this.options.autoSyncStore) {
      useTransferStore.getState().resetTransfer();
    }
  }

  public static resetInstance(): void {
    if (TransferEngine.instance) {
      TransferEngine.instance.reset();
      TransferEngine.instance = null;
    }
  }

  private syncStoreState(state: TransferEngineState): void {
    const store = useTransferStore.getState();
    switch (state) {
      case TransferEngineState.IDLE:
        store.setTransferStatus('idle');
        break;
      case TransferEngineState.PREPARING:
      case TransferEngineState.HANDSHAKING:
        store.setTransferStatus('preparing');
        break;
      case TransferEngineState.TRANSFERRING:
      case TransferEngineState.FINALIZING:
        store.setTransferStatus('transferring');
        break;
      case TransferEngineState.PAUSED:
        store.setTransferStatus('paused');
        break;
      case TransferEngineState.COMPLETED:
        store.setTransferStatus('completed');
        break;
      case TransferEngineState.CANCELLED:
      case TransferEngineState.FAILED:
        store.setTransferStatus('error');
        break;
      default:
        break;
    }
  }
}

export const transferEngine = TransferEngine.getInstance();
