/**
 * OptiShare Optical Transfer Protocol (OTP) Types & Interfaces
 */

import type {
  CancelReasonCode,
  PacketType,
  ProtocolErrorCode,
  SessionState,
} from '../constants/protocolConstants';

/**
 * 24-byte binary packet header structure.
 */
export interface IPacketHeader {
  readonly magic: number;
  readonly version: number;
  readonly packetType: PacketType;
  readonly sessionId: number;
  readonly sequenceNumber: number;
  readonly totalSequences: number;
  readonly payloadLength: number;
  readonly reserved: number;
  readonly checksum: number;
}

/**
 * File metadata encapsulated in FILE_INFO packet.
 */
export interface IFileMetadata {
  readonly fileName: string;
  readonly fileSizeBytes: number;
  readonly mimeType: string;
  readonly fileChecksum: number;
  readonly chunkSize: number;
  readonly totalChunks: number;
}

/**
 * Handshake payload exchanged at session start.
 */
export interface IHandshakePayload {
  readonly protocolVersion: number;
  readonly capabilities: number;
  readonly deviceName: string;
}

/**
 * Acknowledgment payload for missing/received chunk feedback.
 */
export interface IAckPayload {
  readonly lastContiguousSeq: number;
  readonly missingRanges: readonly [number, number][];
}

/**
 * Cancellation payload with reason and optional message.
 */
export interface ICancelPayload {
  readonly reasonCode: CancelReasonCode;
  readonly message: string;
}

/**
 * Error payload with error code and description.
 */
export interface IErrorPayload {
  readonly errorCode: ProtocolErrorCode;
  readonly message: string;
}

/**
 * Generic result of packet decoding.
 */
export interface DecodeResult<T> {
  readonly success: boolean;
  readonly packet?: T;
  readonly error?: string;
  readonly errorCode?: ProtocolErrorCode;
}

/**
 * Real-time transfer and chunk tracking metrics.
 */
export interface ChunkTrackingStats {
  readonly totalChunks: number;
  readonly receivedChunksCount: number;
  readonly receivedBytes: number;
  readonly missingChunksCount: number;
  readonly percentComplete: number;
  readonly isComplete: boolean;
}

/**
 * Transfer session role.
 */
export type SessionRole = 'sender' | 'receiver';

/**
 * Transfer session event callback signatures.
 */
export interface SessionEvents {
  readonly onStateChange?: (state: SessionState) => void;
  readonly onProgress?: (stats: ChunkTrackingStats) => void;
  readonly onChunkReceived?: (seq: number, chunk: Uint8Array) => void;
  readonly onComplete?: (filePayload: Uint8Array, metadata: IFileMetadata) => void;
  readonly onError?: (errorCode: ProtocolErrorCode, message: string) => void;
  readonly onCancelled?: (reason: CancelReasonCode, message: string) => void;
  readonly onTimeout?: () => void;
}

/**
 * Performance benchmark results for protocol codec.
 */
export interface ProtocolBenchmarkResult {
  readonly packetsCount: number;
  readonly totalBytes: number;
  readonly encodeTimeMs: number;
  readonly decodeTimeMs: number;
  readonly encodePacketsPerSec: number;
  readonly decodePacketsPerSec: number;
  readonly encodeThroughputMBps: number;
  readonly decodeThroughputMBps: number;
  readonly headerOverheadPercent: number;
}
