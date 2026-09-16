/**
 * OptiShare Optical Transfer Protocol (OTP) Packet Decoder
 */

import { CRC32 } from '../checksum/CRC32';
import {
  HEADER_SIZE,
  MAX_PAYLOAD_SIZE,
  PacketType,
  PROTOCOL_MAGIC,
  ProtocolErrorCode,
  SUPPORTED_PROTOCOL_VERSIONS,
} from '../constants/protocolConstants';
import { FileMetadata } from '../models/FileMetadata';
import { PacketHeader } from '../models/PacketHeader';
import { ProtocolPacket } from '../models/ProtocolPacket';
import { AckPacket } from '../packets/AckPacket';
import { CancelPacket } from '../packets/CancelPacket';
import { CompletePacket } from '../packets/CompletePacket';
import { DataPacket } from '../packets/DataPacket';
import { ErrorPacket } from '../packets/ErrorPacket';
import { FileInfoPacket } from '../packets/FileInfoPacket';
import { HandshakePacket } from '../packets/HandshakePacket';
import type { DecodeResult } from '../types/protocolTypes';

export class PacketDecoder {
  /**
   * Safely decodes a binary buffer into a strongly-typed ProtocolPacket with full integrity checks.
   *
   * @param buffer Raw binary packet buffer (header + payload).
   * @returns DecodeResult with verified packet or explicit failure reason.
   */
  public static decode(buffer: Uint8Array): DecodeResult<ProtocolPacket> {
    // 1. Minimum length check
    if (buffer.length < HEADER_SIZE) {
      return {
        success: false,
        error: `Packet buffer too small: ${buffer.length} bytes (minimum ${HEADER_SIZE})`,
        errorCode: ProtocolErrorCode.BUFFER_TOO_SMALL,
      };
    }

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);

    // 2. Magic bytes validation
    const magic = view.getUint16(0, false);
    if (magic !== PROTOCOL_MAGIC) {
      return {
        success: false,
        error: `Invalid protocol magic: 0x${magic
          .toString(16)
          .toUpperCase()} (expected 0x${PROTOCOL_MAGIC.toString(16).toUpperCase()})`,
        errorCode: ProtocolErrorCode.INVALID_MAGIC,
      };
    }

    // 3. Version validation
    const version = view.getUint8(2);
    if (!SUPPORTED_PROTOCOL_VERSIONS.includes(version)) {
      return {
        success: false,
        error: `Unsupported protocol version: ${version}`,
        errorCode: ProtocolErrorCode.VERSION_MISMATCH,
      };
    }

    // 4. Packet type validation
    const packetType = view.getUint8(3) as PacketType;
    if (packetType < PacketType.HANDSHAKE || packetType > PacketType.ERROR) {
      return {
        success: false,
        error: `Unknown packet type: ${packetType}`,
        errorCode: ProtocolErrorCode.MALFORMED_PACKET,
      };
    }

    // 5. Payload length and bounds check
    const payloadLength = view.getUint16(16, false);
    if (payloadLength > MAX_PAYLOAD_SIZE) {
      return {
        success: false,
        error: `Payload length (${payloadLength}) exceeds maximum allowable (${MAX_PAYLOAD_SIZE})`,
        errorCode: ProtocolErrorCode.PAYLOAD_OVERFLOW,
      };
    }

    if (buffer.length < HEADER_SIZE + payloadLength) {
      return {
        success: false,
        error: `Buffer truncated: expected ${HEADER_SIZE + payloadLength} bytes, got ${
          buffer.length
        }`,
        errorCode: ProtocolErrorCode.MALFORMED_PACKET,
      };
    }

    // 6. Checksum validation (CRC32 over header[0..19] and payload[24..24+payloadLength])
    const storedChecksum = view.getUint32(20, false);
    const headerCrc = CRC32.calculate(buffer, 0, 20);
    const computedChecksum =
      payloadLength > 0 ? CRC32.update(headerCrc, buffer, HEADER_SIZE, payloadLength) : headerCrc;

    if (computedChecksum !== storedChecksum) {
      return {
        success: false,
        error: `Checksum mismatch: expected 0x${storedChecksum.toString(
          16,
        )}, computed 0x${computedChecksum.toString(16)}`,
        errorCode: ProtocolErrorCode.CHECKSUM_FAILED,
      };
    }

    // 7. Parse header and extract payload without memory copying
    const header = PacketHeader.deserialize(buffer, 0);
    const payload = buffer.subarray(HEADER_SIZE, HEADER_SIZE + payloadLength);

    try {
      let packet: ProtocolPacket;

      switch (packetType) {
        case PacketType.HANDSHAKE: {
          const handshake = HandshakePacket.deserializePayload(payload);
          packet = new HandshakePacket(header, handshake, payload);
          break;
        }

        case PacketType.FILE_INFO: {
          const metadata = FileMetadata.deserialize(payload);
          packet = new FileInfoPacket(header, metadata, payload);
          break;
        }

        case PacketType.DATA: {
          packet = new DataPacket(header, payload);
          break;
        }

        case PacketType.ACK: {
          const ack = AckPacket.deserializePayload(payload);
          packet = new AckPacket(header, ack, payload);
          break;
        }

        case PacketType.COMPLETE: {
          const complete = CompletePacket.deserializePayload(payload);
          packet = new CompletePacket(header, complete, payload);
          break;
        }

        case PacketType.CANCEL: {
          const cancel = CancelPacket.deserializePayload(payload);
          packet = new CancelPacket(header, cancel, payload);
          break;
        }

        case PacketType.ERROR: {
          const err = ErrorPacket.deserializePayload(payload);
          packet = new ErrorPacket(header, err, payload);
          break;
        }

        default:
          packet = new ProtocolPacket(header, payload);
      }

      return {
        success: true,
        packet,
      };
    } catch (parseErr: unknown) {
      return {
        success: false,
        error: `Payload parsing error: ${
          parseErr instanceof Error ? parseErr.message : String(parseErr)
        }`,
        errorCode: ProtocolErrorCode.MALFORMED_PACKET,
      };
    }
  }

  /**
   * Decodes a buffer and throws an error if decoding or validation fails.
   */
  public static decodeOrThrow(buffer: Uint8Array): ProtocolPacket {
    const result = PacketDecoder.decode(buffer);
    if (!result.success || !result.packet) {
      throw new Error(result.error ?? 'Failed to decode protocol packet');
    }
    return result.packet;
  }
}
