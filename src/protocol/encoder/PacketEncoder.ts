/**
 * OptiShare Optical Transfer Protocol (OTP) Packet Encoder
 */

import { CRC32 } from '../checksum/CRC32';
import type { CancelReasonCode, ProtocolErrorCode } from '../constants/protocolConstants';
import {
  DEFAULT_CHUNK_SIZE,
  HEADER_SIZE,
  MAX_PAYLOAD_SIZE,
  PacketType,
  PROTOCOL_MAGIC,
  PROTOCOL_VERSION,
} from '../constants/protocolConstants';
import { FileMetadata } from '../models/FileMetadata';
import { PacketHeader } from '../models/PacketHeader';
import type { ProtocolPacket } from '../models/ProtocolPacket';
import { AckPacket } from '../packets/AckPacket';
import { CancelPacket } from '../packets/CancelPacket';
import { CompletePacket } from '../packets/CompletePacket';
import { DataPacket } from '../packets/DataPacket';
import { ErrorPacket } from '../packets/ErrorPacket';
import { FileInfoPacket } from '../packets/FileInfoPacket';
import { HandshakePacket } from '../packets/HandshakePacket';
import type { IAckPayload, IHandshakePayload } from '../types/protocolTypes';

export class PacketEncoder {
  /**
   * Serializes any ProtocolPacket into a binary buffer with CRC32 integrity checksum.
   *
   * @param packet The protocol packet to serialize.
   * @returns Complete serialized binary packet (24 bytes header + payload).
   */
  public static encode(packet: ProtocolPacket): Uint8Array {
    const payload = packet.payload;
    if (payload.length > MAX_PAYLOAD_SIZE) {
      throw new Error(
        `Payload size (${payload.length}) exceeds MAX_PAYLOAD_SIZE (${MAX_PAYLOAD_SIZE})`,
      );
    }

    const totalLength = HEADER_SIZE + payload.length;
    const buffer = new Uint8Array(totalLength);
    const view = new DataView(buffer.buffer, buffer.byteOffset, totalLength);

    // 1. Write Header fields [0..19]
    view.setUint16(0, packet.header.magic, false);
    view.setUint8(2, packet.header.version);
    view.setUint8(3, packet.header.packetType);
    view.setUint32(4, packet.header.sessionId, false);
    view.setUint32(8, packet.header.sequenceNumber, false);
    view.setUint32(12, packet.header.totalSequences, false);
    view.setUint16(16, payload.length, false);
    view.setUint16(18, packet.header.reserved, false);

    // 2. Copy Payload bytes [24..totalLength]
    if (payload.length > 0) {
      buffer.set(payload, HEADER_SIZE);
    }

    // 3. Compute CRC32 across header fields [0..19] and payload [24..totalLength]
    const headerCrc = CRC32.calculate(buffer, 0, 20);
    const totalCrc =
      payload.length > 0 ? CRC32.update(headerCrc, buffer, HEADER_SIZE, payload.length) : headerCrc;

    // 4. Write Checksum at [20..23]
    view.setUint32(20, totalCrc, false);

    return buffer;
  }

  /**
   * Encodes a HANDSHAKE packet.
   */
  public static encodeHandshake(sessionId: number, handshake: IHandshakePayload): Uint8Array {
    const packet = HandshakePacket.create(sessionId, handshake);
    return PacketEncoder.encode(packet);
  }

  /**
   * Encodes a FILE_INFO packet containing file metadata.
   */
  public static encodeFileInfo(sessionId: number, metadata: FileMetadata): Uint8Array {
    const packet = FileInfoPacket.create(sessionId, metadata);
    return PacketEncoder.encode(packet);
  }

  /**
   * Encodes a DATA chunk packet.
   */
  public static encodeData(
    sessionId: number,
    chunkIndex: number,
    totalChunks: number,
    chunkData: Uint8Array,
  ): Uint8Array {
    const packet = DataPacket.create(sessionId, chunkIndex, totalChunks, chunkData);
    return PacketEncoder.encode(packet);
  }

  /**
   * Encodes an ACK packet with received / missing chunk feedback.
   */
  public static encodeAck(sessionId: number, ack: IAckPayload): Uint8Array {
    const packet = AckPacket.create(sessionId, ack);
    return PacketEncoder.encode(packet);
  }

  /**
   * Encodes a COMPLETE packet.
   */
  public static encodeComplete(
    sessionId: number,
    fileChecksum: number,
    totalBytes: number,
  ): Uint8Array {
    const packet = CompletePacket.create(sessionId, fileChecksum, totalBytes);
    return PacketEncoder.encode(packet);
  }

  /**
   * Encodes a CANCEL packet.
   */
  public static encodeCancel(
    sessionId: number,
    reasonCode: CancelReasonCode,
    message = '',
  ): Uint8Array {
    const packet = CancelPacket.create(sessionId, reasonCode, message);
    return PacketEncoder.encode(packet);
  }

  /**
   * Encodes an ERROR packet.
   */
  public static encodeError(
    sessionId: number,
    errorCode: ProtocolErrorCode,
    message = '',
  ): Uint8Array {
    const packet = ErrorPacket.create(sessionId, errorCode, message);
    return PacketEncoder.encode(packet);
  }

  /**
   * Slices a complete file byte buffer into serialized binary DATA packets.
   *
   * @param sessionId Active session ID.
   * @param fileBytes Raw file bytes.
   * @param chunkSize Size in bytes of each chunk payload (default: 256).
   * @returns Array of serialized binary DATA packet frames ready for optical transmission.
   */
  public static sliceFileIntoDataPackets(
    sessionId: number,
    fileBytes: Uint8Array,
    chunkSize = DEFAULT_CHUNK_SIZE,
  ): Uint8Array[] {
    const totalChunks = FileMetadata.calculateTotalChunks(fileBytes.length, chunkSize);
    const packets: Uint8Array[] = new Array(totalChunks);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileBytes.length);
      const chunkData = fileBytes.subarray(start, end);

      const packet = new DataPacket(
        new PacketHeader({
          magic: PROTOCOL_MAGIC,
          version: PROTOCOL_VERSION,
          packetType: PacketType.DATA,
          sessionId,
          sequenceNumber: i,
          totalSequences: totalChunks,
          payloadLength: chunkData.length,
          reserved: 0,
          checksum: 0,
        }),
        chunkData,
      );

      packets[i] = PacketEncoder.encode(packet);
    }

    return packets;
  }
}
