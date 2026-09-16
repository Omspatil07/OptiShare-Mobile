/* eslint-disable no-bitwise */
/**
 * OptiShare Optical Transfer Protocol (OTP) Main Facade
 *
 * Provides a unified, high-performance API for binary packet serialization,
 * deserialization, chunk tracking, CRC32 checksums, and session orchestration.
 */

import { CRC32 } from '../checksum/CRC32';
import { DEFAULT_CHUNK_SIZE, HEADER_SIZE } from '../constants/protocolConstants';
import { PacketDecoder } from '../decoder/PacketDecoder';
import { PacketEncoder } from '../encoder/PacketEncoder';
import { FileMetadata } from '../models/FileMetadata';
import type { ProtocolPacket } from '../models/ProtocolPacket';
import { sessionManager } from '../session/SessionManager';
import type { TransferSession } from '../session/TransferSession';
import type { DecodeResult, ProtocolBenchmarkResult, SessionEvents } from '../types/protocolTypes';
import { generateSessionId } from '../utils/protocolUtils';

export class OpticalTransferProtocol {
  private static instance: OpticalTransferProtocol | null = null;

  public static getInstance(): OpticalTransferProtocol {
    if (!OpticalTransferProtocol.instance) {
      OpticalTransferProtocol.instance = new OpticalTransferProtocol();
    }
    return OpticalTransferProtocol.instance;
  }

  /**
   * Prepares a file for optical transfer by calculating metadata, checksum,
   * creating a FILE_INFO packet, and slicing the file into DATA packet binary buffers.
   *
   * @param fileBytes Full file binary payload.
   * @param fileName Human-readable file name.
   * @param mimeType Optional MIME type (default: application/octet-stream).
   * @param chunkSize Size of each chunk payload in bytes (default: 256).
   * @param sessionId Optional session ID (auto-generated if omitted).
   * @returns Object containing sessionId, metadata, fileInfoPacket, and array of dataPackets.
   */
  public prepareTransfer(
    fileBytes: Uint8Array,
    fileName: string,
    mimeType = 'application/octet-stream',
    chunkSize = DEFAULT_CHUNK_SIZE,
    sessionId?: number,
  ): {
    readonly sessionId: number;
    readonly metadata: FileMetadata;
    readonly fileInfoBuffer: Uint8Array;
    readonly dataBuffers: Uint8Array[];
    readonly completeBuffer: Uint8Array;
  } {
    const sid = sessionId ?? generateSessionId();
    const fileChecksum = CRC32.calculate(fileBytes);
    const totalChunks = FileMetadata.calculateTotalChunks(fileBytes.length, chunkSize);

    const metadata = new FileMetadata({
      fileName,
      fileSizeBytes: fileBytes.length,
      mimeType,
      fileChecksum,
      chunkSize,
      totalChunks,
    });

    const fileInfoBuffer = PacketEncoder.encodeFileInfo(sid, metadata);
    const dataBuffers = PacketEncoder.sliceFileIntoDataPackets(sid, fileBytes, chunkSize);
    const completeBuffer = PacketEncoder.encodeComplete(sid, fileChecksum, fileBytes.length);

    return {
      sessionId: sid,
      metadata,
      fileInfoBuffer,
      dataBuffers,
      completeBuffer,
    };
  }

  /**
   * Decodes an incoming optical transmission byte buffer with full integrity validation.
   */
  public decodePacket(buffer: Uint8Array): DecodeResult<ProtocolPacket> {
    return PacketDecoder.decode(buffer);
  }

  /**
   * Encodes a protocol packet to a binary buffer.
   */
  public encodePacket(packet: ProtocolPacket): Uint8Array {
    return PacketEncoder.encode(packet);
  }

  /**
   * Creates a new sender session.
   */
  public createSenderSession(metadata: FileMetadata, events?: SessionEvents): TransferSession {
    return sessionManager.createSenderSession(metadata, events);
  }

  /**
   * Creates a new receiver session.
   */
  public createReceiverSession(sessionId = 0, events?: SessionEvents): TransferSession {
    return sessionManager.createReceiverSession(sessionId, events);
  }

  /**
   * Runs an in-memory performance benchmark testing encoding and decoding throughput.
   *
   * @param packetsCount Number of packets to encode and decode (default: 500).
   * @param payloadSize Payload byte length per packet (default: 256).
   * @returns ProtocolBenchmarkResult metrics.
   */
  public runBenchmark(packetsCount = 500, payloadSize = 256): ProtocolBenchmarkResult {
    const sessionId = 0x12345678;
    const testPayload = new Uint8Array(payloadSize);
    for (let i = 0; i < payloadSize; i++) {
      testPayload[i] = (i * 17) & 0xff;
    }

    // 1. Benchmark Encoding
    const encodedBuffers: Uint8Array[] = new Array(packetsCount);
    const encodeStart = performance.now();
    for (let i = 0; i < packetsCount; i++) {
      encodedBuffers[i] = PacketEncoder.encodeData(sessionId, i, packetsCount, testPayload);
    }
    const encodeEnd = performance.now();
    const encodeTimeMs = Math.max(0.001, encodeEnd - encodeStart);

    // 2. Benchmark Decoding
    const decodeStart = performance.now();
    for (let i = 0; i < packetsCount; i++) {
      const buf = encodedBuffers[i];
      if (buf) {
        PacketDecoder.decode(buf);
      }
    }
    const decodeEnd = performance.now();
    const decodeTimeMs = Math.max(0.001, decodeEnd - decodeStart);

    const totalBytes = packetsCount * (HEADER_SIZE + payloadSize);
    const encodePacketsPerSec = Math.round((packetsCount / encodeTimeMs) * 1000);
    const decodePacketsPerSec = Math.round((packetsCount / decodeTimeMs) * 1000);
    const encodeThroughputMBps =
      Math.round((totalBytes / 1024 / 1024 / (encodeTimeMs / 1000)) * 100) / 100;
    const decodeThroughputMBps =
      Math.round((totalBytes / 1024 / 1024 / (decodeTimeMs / 1000)) * 100) / 100;
    const headerOverheadPercent =
      Math.round((HEADER_SIZE / (HEADER_SIZE + payloadSize)) * 10000) / 100;

    return {
      packetsCount,
      totalBytes,
      encodeTimeMs,
      decodeTimeMs,
      encodePacketsPerSec,
      decodePacketsPerSec,
      encodeThroughputMBps,
      decodeThroughputMBps,
      headerOverheadPercent,
    };
  }
}

export const opticalTransferProtocol = OpticalTransferProtocol.getInstance();
