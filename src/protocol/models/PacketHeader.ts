/* eslint-disable no-bitwise */
/**
 * OptiShare Optical Transfer Protocol (OTP) Packet Header Model
 */

import {
  HEADER_SIZE,
  MAX_PAYLOAD_SIZE,
  PacketType,
  PROTOCOL_MAGIC,
  PROTOCOL_VERSION,
} from '../constants/protocolConstants';
import type { IPacketHeader } from '../types/protocolTypes';

export class PacketHeader implements IPacketHeader {
  public readonly magic: number;
  public readonly version: number;
  public readonly packetType: PacketType;
  public readonly sessionId: number;
  public readonly sequenceNumber: number;
  public readonly totalSequences: number;
  public readonly payloadLength: number;
  public readonly reserved: number;
  public readonly checksum: number;

  constructor(header: IPacketHeader) {
    this.magic = header.magic;
    this.version = header.version;
    this.packetType = header.packetType;
    this.sessionId = header.sessionId >>> 0;
    this.sequenceNumber = header.sequenceNumber >>> 0;
    this.totalSequences = header.totalSequences >>> 0;
    this.payloadLength = header.payloadLength;
    this.reserved = header.reserved;
    this.checksum = header.checksum >>> 0;
  }

  /**
   * Checks if magic matches the OTP magic bytes ('OP' = 0x4F50).
   */
  public get isValidMagic(): boolean {
    return this.magic === PROTOCOL_MAGIC;
  }

  /**
   * Checks if protocol version is supported.
   */
  public get isValidVersion(): boolean {
    return this.version === PROTOCOL_VERSION;
  }

  /**
   * Checks if packet type is a recognized enum value.
   */
  public get isValidType(): boolean {
    return this.packetType >= PacketType.HANDSHAKE && this.packetType <= PacketType.ERROR;
  }

  /**
   * Checks if payload length does not exceed maximum allowable bounds.
   */
  public get isValidPayloadLength(): boolean {
    return this.payloadLength >= 0 && this.payloadLength <= MAX_PAYLOAD_SIZE;
  }

  /**
   * Serializes header fields into a 24-byte binary slice.
   *
   * @param target Optional target buffer (must have at least offset + 24 bytes).
   * @param offset Starting byte offset.
   * @returns The Uint8Array buffer containing the serialized header.
   */
  public serialize(target?: Uint8Array, offset = 0): Uint8Array {
    const buffer = target ?? new Uint8Array(HEADER_SIZE);
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset, HEADER_SIZE);

    view.setUint16(0, this.magic, false); // Big-endian
    view.setUint8(2, this.version);
    view.setUint8(3, this.packetType);
    view.setUint32(4, this.sessionId, false);
    view.setUint32(8, this.sequenceNumber, false);
    view.setUint32(12, this.totalSequences, false);
    view.setUint16(16, this.payloadLength, false);
    view.setUint16(18, this.reserved, false);
    view.setUint32(20, this.checksum, false);

    return buffer;
  }

  /**
   * Deserializes binary header bytes into a PacketHeader instance.
   *
   * @param buffer Input byte buffer.
   * @param offset Starting byte offset.
   * @returns Deserialized PacketHeader.
   */
  public static deserialize(buffer: Uint8Array, offset = 0): PacketHeader {
    if (buffer.length - offset < HEADER_SIZE) {
      throw new Error(
        `Buffer too small for OTP header: ${buffer.length - offset} < ${HEADER_SIZE}`,
      );
    }

    const view = new DataView(buffer.buffer, buffer.byteOffset + offset, HEADER_SIZE);

    const magic = view.getUint16(0, false);
    const version = view.getUint8(2);
    const packetType = view.getUint8(3) as PacketType;
    const sessionId = view.getUint32(4, false);
    const sequenceNumber = view.getUint32(8, false);
    const totalSequences = view.getUint32(12, false);
    const payloadLength = view.getUint16(16, false);
    const reserved = view.getUint16(18, false);
    const checksum = view.getUint32(20, false);

    return new PacketHeader({
      magic,
      version,
      packetType,
      sessionId,
      sequenceNumber,
      totalSequences,
      payloadLength,
      reserved,
      checksum,
    });
  }
}
