/**
 * Handshake Packet Model
 */

import { PacketType, PROTOCOL_MAGIC, PROTOCOL_VERSION } from '../constants/protocolConstants';
import { PacketHeader } from '../models/PacketHeader';
import { ProtocolPacket } from '../models/ProtocolPacket';
import type { IHandshakePayload } from '../types/protocolTypes';
import { stringToUtf8, utf8ToString } from '../utils/protocolUtils';

export class HandshakePacket extends ProtocolPacket {
  public readonly handshakePayload: IHandshakePayload;

  constructor(
    header: PacketHeader,
    handshakePayload: IHandshakePayload,
    payloadBytes?: Uint8Array,
  ) {
    super(header, payloadBytes ?? HandshakePacket.serializePayload(handshakePayload));
    this.handshakePayload = handshakePayload;
  }

  public static serializePayload(data: IHandshakePayload): Uint8Array {
    const nameBytes = stringToUtf8(data.deviceName);
    const buffer = new Uint8Array(1 + 2 + 1 + nameBytes.length);
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);

    view.setUint8(0, data.protocolVersion);
    view.setUint16(1, data.capabilities, false);
    view.setUint8(3, nameBytes.length);
    buffer.set(nameBytes, 4);

    return buffer;
  }

  public static deserializePayload(payload: Uint8Array): IHandshakePayload {
    if (payload.length < 4) {
      throw new Error(`Invalid Handshake payload length: ${payload.length} < 4`);
    }

    const view = new DataView(payload.buffer, payload.byteOffset, payload.length);
    const protocolVersion = view.getUint8(0);
    const capabilities = view.getUint16(1, false);
    const nameLen = view.getUint8(3);

    const deviceName =
      payload.length >= 4 + nameLen ? utf8ToString(payload.subarray(4, 4 + nameLen)) : '';

    return {
      protocolVersion,
      capabilities,
      deviceName,
    };
  }

  public static create(
    sessionId: number,
    handshake: IHandshakePayload,
    sequenceNumber = 0,
    totalSequences = 1,
  ): HandshakePacket {
    const payloadBytes = HandshakePacket.serializePayload(handshake);
    const header = new PacketHeader({
      magic: PROTOCOL_MAGIC,
      version: PROTOCOL_VERSION,
      packetType: PacketType.HANDSHAKE,
      sessionId,
      sequenceNumber,
      totalSequences,
      payloadLength: payloadBytes.length,
      reserved: 0,
      checksum: 0,
    });

    return new HandshakePacket(header, handshake, payloadBytes);
  }
}
