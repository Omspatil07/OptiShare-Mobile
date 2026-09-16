/**
 * OptiShare Transfer Pipeline Type Definitions
 */

import type { ProtocolPacket } from '../../protocol';
import type {
  PipelineErrorCode,
  PipelineStageId,
  PipelineStatus,
} from '../constants/pipelineConstants';

/**
 * Interface contract for an isolated pipeline processing stage.
 */
export interface IPipelineStage<TInput, TOutput> {
  readonly id: PipelineStageId;
  readonly name: string;
  process(input: TInput): Promise<TOutput> | TOutput;
  reset(): void;
}

/**
 * High-level file metadata processed through the pipeline.
 */
export interface PipelineFileMetadata {
  readonly fileName: string;
  readonly fileSizeBytes: number;
  readonly mimeType: string;
  readonly fileChecksum: number;
  readonly isEncrypted: boolean;
  readonly sessionId: number;
  readonly totalChunks: number;
  readonly chunkSize: number;
}

/**
 * Real-time progress snapshot emitted during pipeline execution.
 */
export interface PipelineProgress {
  readonly bytesProcessed: number;
  readonly totalBytes: number;
  readonly percentage: number;
  readonly framesCount: number;
  readonly speedBytesPerSec: number;
  readonly etaSeconds: number | null;
  readonly currentStage: PipelineStageId;
}

/**
 * Final result produced upon successful receiver pipeline completion.
 */
export interface ReceiverResult {
  readonly data: Uint8Array;
  readonly metadata: PipelineFileMetadata;
  readonly savedFilePath?: string | undefined;
  readonly elapsedMs: number;
  readonly totalFramesReceived: number;
}

/**
 * Configuration options for the Sender Pipeline.
 */
export interface SenderPipelineConfig {
  readonly fileName: string;
  readonly fileData?: Uint8Array | undefined;
  readonly filePath?: string | undefined;
  readonly mimeType?: string | undefined;
  readonly sessionId?: number | undefined;
  readonly cryptoKey?: CryptoKey | null | undefined;
  readonly aad?: Uint8Array | undefined;
  readonly symbolSize?: number | undefined;
  readonly fps?: number | undefined;
  readonly redundancyFactor?: number | undefined;
  readonly fountainSeed?: number | undefined;
  readonly onFrame?:
    | ((frame: Uint8Array, frameIndex: number, totalFrames: number) => void)
    | undefined;
  readonly onProgress?: ((progress: PipelineProgress) => void) | undefined;
  readonly onStatusChange?:
    | ((status: PipelineStatus, previousStatus: PipelineStatus) => void)
    | undefined;
  readonly onComplete?: (() => void) | undefined;
  readonly onError?: ((error: Error, code: PipelineErrorCode) => void) | undefined;
}

/**
 * Configuration options for the Receiver Pipeline.
 */
export interface ReceiverPipelineConfig {
  readonly sessionId?: number | undefined;
  readonly cryptoKey?: CryptoKey | null | undefined;
  readonly aad?: Uint8Array | undefined;
  readonly fountainSeed?: number | undefined;
  readonly timeoutMs?: number | undefined;
  readonly replayWindowSize?: number | undefined;
  readonly saveDirectory?: string | undefined;
  readonly saveFileName?: string | undefined;
  readonly onFrameReceived?: ((packet: ProtocolPacket, frameIndex: number) => void) | undefined;
  readonly onProgress?: ((progress: PipelineProgress) => void) | undefined;
  readonly onStatusChange?:
    | ((status: PipelineStatus, previousStatus: PipelineStatus) => void)
    | undefined;
  readonly onComplete?: ((result: ReceiverResult) => void) | undefined;
  readonly onError?: ((error: Error, code: PipelineErrorCode) => void) | undefined;
}
