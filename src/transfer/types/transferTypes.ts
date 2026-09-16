/**
 * OptiShare Transfer Engine Types
 */

import type { FileMetadata, ProtocolPacket } from '../../protocol';
import type {
  TransferEngineState,
  TransferErrorCode,
  TransferMode,
  TransferRole,
} from '../constants/transferConstants';

export interface TransferMetricsSnapshot {
  readonly bytesTransferred: number;
  readonly totalBytes: number;
  readonly progressPercentage: number;
  readonly instantSpeedBps: number;
  readonly smoothedSpeedBps: number;
  readonly speedKbps: number;
  readonly speedMbps: number;
  readonly etaSeconds: number;
  readonly elapsedSeconds: number;
  readonly framesDispatched: number;
  readonly framesReceived: number;
  readonly duplicateFrames: number;
  readonly corruptFrames: number;
  readonly fpsAchieved: number;
}

export interface TransferSenderOptions {
  readonly fileData?: Uint8Array | undefined;
  readonly filePath?: string | undefined;
  readonly fileName: string;
  readonly mimeType?: string | undefined;
  readonly chunkSize?: number | undefined;
  readonly mode?: TransferMode | undefined;
  readonly fps?: number | undefined;
  readonly sessionId?: number | undefined;
  readonly fountainSeed?: number | undefined;
  readonly redundancyFactor?: number | undefined;
  readonly onFrameDispatched?:
    | ((frame: Uint8Array, frameIndex: number, totalFrames: number) => void)
    | undefined;
  readonly onProgress?: ((metrics: TransferMetricsSnapshot) => void) | undefined;
  readonly onStateChange?: ((state: TransferEngineState) => void) | undefined;
  readonly onComplete?: ((metadata: FileMetadata) => void) | undefined;
  readonly onError?: ((error: Error, code: TransferErrorCode) => void) | undefined;
}

export interface TransferReceiverOptions {
  readonly sessionId?: number | undefined;
  readonly mode?: TransferMode | undefined;
  readonly timeoutMs?: number | undefined;
  readonly saveDirectory?: string | undefined;
  readonly saveFileName?: string | undefined;
  readonly onFrameReceived?: ((packet: ProtocolPacket, frameIndex: number) => void) | undefined;
  readonly onProgress?: ((metrics: TransferMetricsSnapshot) => void) | undefined;
  readonly onStateChange?: ((state: TransferEngineState) => void) | undefined;
  readonly onComplete?:
    | ((fileBytes: Uint8Array, metadata: FileMetadata, savedPath?: string | undefined) => void)
    | undefined;
  readonly onError?: ((error: Error, code: TransferErrorCode) => void) | undefined;
}

export interface TransferSessionInfo {
  readonly sessionId: number;
  readonly role: TransferRole;
  readonly state: TransferEngineState;
  readonly mode: TransferMode;
  readonly fileName: string | null;
  readonly fileSizeBytes: number;
  readonly totalFrames: number;
  readonly currentFrame: number;
  readonly startTimeMs: number;
  readonly endTimeMs: number | null;
}

export interface ITransferStateMachineListener {
  onStateChange: (from: TransferEngineState, to: TransferEngineState, reason?: string) => void;
}

export interface TransferEngineOptions {
  readonly autoSyncStore?: boolean | undefined;
  readonly defaultChunkSize?: number | undefined;
  readonly defaultFps?: number | undefined;
  readonly defaultTimeoutMs?: number | undefined;
}
