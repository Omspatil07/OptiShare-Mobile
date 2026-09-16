/**
 * OptiShare Optical Transfer Protocol (OTP) Transfer Session
 *
 * Manages transfer state lifecycle, incoming optical frame processing,
 * inactivity timeout detection, chunk reassembly, and data integrity verification.
 */

import { ChunkTracker } from './ChunkTracker';
import { CRC32 } from '../checksum/CRC32';
import {
  CancelReasonCode,
  DEFAULT_SESSION_TIMEOUT_MS,
  PacketType,
  ProtocolErrorCode,
  SessionState,
} from '../constants/protocolConstants';
import type { FileMetadata } from '../models/FileMetadata';
import type { ProtocolPacket } from '../models/ProtocolPacket';
import type { CancelPacket } from '../packets/CancelPacket';
import type { DataPacket } from '../packets/DataPacket';
import type { ErrorPacket } from '../packets/ErrorPacket';
import type { FileInfoPacket } from '../packets/FileInfoPacket';
import type { ChunkTrackingStats, SessionEvents, SessionRole } from '../types/protocolTypes';

export class TransferSession {
  public readonly sessionId: number;
  public readonly role: SessionRole;
  private _state: SessionState;
  private _metadata: FileMetadata | null = null;
  private _tracker: ChunkTracker | null = null;
  private _chunks: (Uint8Array | undefined)[] = [];
  private readonly timeoutMs: number;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly events: SessionEvents;

  constructor(
    sessionId: number,
    role: SessionRole,
    events: SessionEvents = {},
    timeoutMs = DEFAULT_SESSION_TIMEOUT_MS,
  ) {
    this.sessionId = sessionId;
    this.role = role;
    this.events = events;
    this.timeoutMs = timeoutMs;
    this._state = SessionState.IDLE;
  }

  public get state(): SessionState {
    return this._state;
  }

  public get metadata(): FileMetadata | null {
    return this._metadata;
  }

  public get tracker(): ChunkTracker | null {
    return this._tracker;
  }

  /**
   * Starts the session and arms the inactivity timeout watchdog.
   */
  public start(): void {
    if (this._state !== SessionState.IDLE) {
      return;
    }
    this.setState(SessionState.HANDSHAKING);
    this.resetTimeout();
  }

  /**
   * Sets initial file metadata (used primarily when initializing a Sender session).
   */
  public setMetadata(metadata: FileMetadata): void {
    this._metadata = metadata;
    this._tracker = new ChunkTracker(metadata.totalChunks);
    this._chunks = new Array(metadata.totalChunks);
  }

  /**
   * Ingests and processes an incoming decoded protocol packet.
   *
   * @param packet The incoming decoded ProtocolPacket.
   * @returns `true` if packet was successfully processed and accepted.
   */
  public processPacket(packet: ProtocolPacket): boolean {
    // 1. Session ID validation (ignore packets from other active sessions)
    if (packet.sessionId !== this.sessionId) {
      return false;
    }

    // 2. Refresh inactivity timeout watchdog on valid frame
    this.resetTimeout();

    // 3. Handle cancel / error packets in any state
    if (packet.packetType === PacketType.CANCEL) {
      const cancelPacket = packet as CancelPacket;
      const reason = cancelPacket.cancelPayload.reasonCode;
      const msg = cancelPacket.cancelPayload.message;
      this.cancel(reason, msg, false);
      return true;
    }

    if (packet.packetType === PacketType.ERROR) {
      const errPacket = packet as ErrorPacket;
      const code = errPacket.errorPayload.errorCode;
      const msg = errPacket.errorPayload.message;
      this.fail(code, msg);
      return true;
    }

    // 4. Role-specific packet handling
    if (this.role === 'receiver') {
      return this.handleReceiverPacket(packet);
    } else {
      return this.handleSenderPacket(packet);
    }
  }

  private handleReceiverPacket(packet: ProtocolPacket): boolean {
    switch (packet.packetType) {
      case PacketType.HANDSHAKE: {
        if (this._state === SessionState.IDLE || this._state === SessionState.HANDSHAKING) {
          this.setState(SessionState.HANDSHAKING);
          return true;
        }
        return false;
      }

      case PacketType.FILE_INFO: {
        const fileInfo = packet as FileInfoPacket;
        this.setMetadata(fileInfo.metadata);
        this.setState(SessionState.TRANSFERRING);
        return true;
      }

      case PacketType.DATA: {
        if (!this._metadata || !this._tracker) {
          return false; // Received DATA before FILE_INFO
        }

        const dataPacket = packet as DataPacket;
        const seq = dataPacket.chunkIndex;

        // Sequence bounds check
        if (seq < 0 || seq >= this._metadata.totalChunks) {
          this.events.onError?.(
            ProtocolErrorCode.SEQUENCE_OUT_OF_BOUNDS,
            `Sequence ${seq} out of bounds (total ${this._metadata.totalChunks})`,
          );
          return false;
        }

        // Check if duplicate frame
        const isNew = this._tracker.markReceived(seq, dataPacket.chunkData.length);
        if (isNew) {
          this._chunks[seq] = dataPacket.chunkData;
          this.events.onChunkReceived?.(seq, dataPacket.chunkData);

          const stats = this._tracker.getStats();
          this.events.onProgress?.(stats);

          // Check if transfer is complete
          if (this._tracker.isComplete) {
            this.handleTransferComplete();
          }
        }

        return true;
      }

      case PacketType.COMPLETE: {
        // If sender sends COMPLETE and receiver already has all chunks, finalize
        if (this._tracker?.isComplete) {
          this.handleTransferComplete();
        }
        return true;
      }

      default:
        return false;
    }
  }

  private handleSenderPacket(packet: ProtocolPacket): boolean {
    if (packet.packetType === PacketType.ACK) {
      // In sender mode, ACK can be used to re-transmit missing ranges
      if (this.events.onProgress && this._tracker) {
        this.events.onProgress(this._tracker.getStats());
      }
      return true;
    }
    return false;
  }

  /**
   * Assembles all stored chunks into a single contiguous byte array
   * and verifies CRC-32 against declared file checksum.
   */
  public assembleFile(): Uint8Array {
    if (!this._metadata) {
      throw new Error('Cannot assemble file: metadata is missing');
    }
    if (!this._tracker?.isComplete) {
      throw new Error('Cannot assemble file: chunks are missing');
    }

    const assembled = new Uint8Array(this._metadata.fileSizeBytes);
    let offset = 0;

    for (let i = 0; i < this._metadata.totalChunks; i++) {
      const chunk = this._chunks[i];
      if (!chunk) {
        throw new Error(`Missing chunk at index ${i}`);
      }
      assembled.set(chunk, offset);
      offset += chunk.length;
    }

    // Verify file CRC-32
    const calculatedCrc = CRC32.calculate(assembled);
    if (calculatedCrc !== this._metadata.fileChecksum) {
      throw new Error(
        `File integrity check failed: expected CRC 0x${this._metadata.fileChecksum.toString(
          16,
        )}, got 0x${calculatedCrc.toString(16)}`,
      );
    }

    return assembled;
  }

  private handleTransferComplete(): void {
    if (this._state === SessionState.COMPLETED) {
      return;
    }

    try {
      const fileBytes = this.assembleFile();
      this.clearTimeout();
      this.setState(SessionState.COMPLETED);

      if (this._metadata) {
        this.events.onComplete?.(fileBytes, this._metadata);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.fail(ProtocolErrorCode.FILE_INTEGRITY_FAILED, message);
    }
  }

  /**
   * Cancels the active transfer session.
   */
  public cancel(reason = CancelReasonCode.USER_CANCELLED, message = '', notify = true): void {
    if (
      this._state === SessionState.COMPLETED ||
      this._state === SessionState.CANCELLED ||
      this._state === SessionState.FAILED
    ) {
      return;
    }

    this.clearTimeout();
    this.setState(SessionState.CANCELLED);

    if (notify) {
      this.events.onCancelled?.(reason, message);
    }
  }

  /**
   * Fails the transfer session with a protocol error.
   */
  public fail(errorCode: ProtocolErrorCode, message = ''): void {
    this.clearTimeout();
    this.setState(SessionState.FAILED);
    this.events.onError?.(errorCode, message);
  }

  /**
   * Returns current chunk tracking statistics.
   */
  public getProgress(): ChunkTrackingStats | null {
    return this._tracker ? this._tracker.getStats() : null;
  }

  private setState(newState: SessionState): void {
    this._state = newState;
    this.events.onStateChange?.(newState);
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
    if (this._state === SessionState.TRANSFERRING || this._state === SessionState.HANDSHAKING) {
      this.setState(SessionState.TIMED_OUT);
      this.events.onTimeout?.();
      this.events.onError?.(
        ProtocolErrorCode.MALFORMED_PACKET,
        'Optical transfer timed out due to camera inactivity',
      );
    }
  }

  /**
   * Cleans up all timers and in-memory chunk buffers.
   */
  public destroy(): void {
    this.clearTimeout();
    this._chunks = [];
    if (this._tracker) {
      this._tracker.reset();
    }
  }
}
