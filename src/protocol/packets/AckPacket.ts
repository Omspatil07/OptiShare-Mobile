/**
 * ACK Packet Model
 */

import { PacketType, PROTOCOL_MAGIC, PROTOCOL_VERSION } from '../constants/protocolConstants';
import { PacketHeader } from '../models/PacketHeader';
import { ProtocolPacket } from '../models/ProtocolPacket';
import type { IAckPayload } from '../types/protocolTypes';

export class AckPacket extends ProtocolPacket {
  public readonly ackPayload: IAckPayload;

  constructor(header: PacketHeader, ackPayload: IAckPayload, payloadBytes?: Uint8Array) {
    super(header, payloadBytes ?? AckPacket.serializePayload(ackPayload));
    this.ackPayload = ackPayload;
  }

  public static serializePayload(data: IAckPayload): Uint8Array {
    const rangeCount = data.missingRanges.length;
    const buffer = new Uint8Array(4 + 2 + rangeCount * 8);
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);

    view.setUint32(0, data.lastContiguousSeq, false);
    view.setUint16(4, rangeCount, false);

    let offset = 6;
    for (const [start, end] of data.missingRanges) {
      view.setUint32(offset, start, false);
      view.setUint32(offset + 4, end, false);
      offset += 8;
    }

    return buffer;
  }

  public static deserializePayload(payload: Uint8Array): IAckPayload {
    if (payload.length < 6) {
      throw new Error(`Invalid ACK payload length: ${payload.length} < 6`);
    }

    const view = new DataView(payload.buffer, payload.byteOffset, payload.length);
    const lastContiguousSeq = view.getUint32(0, false);
    const rangeCount = view.getUint16(4, false);

    const missingRanges: [number, number][] = [];
    let offset = 6;
    for (let i = 0; i < rangeCount && offset + 8 <= payload.length; i++) {
      const start = view.getUint32(offset, false);
      const end = view.getUint32(offset + 4, false);
      missingRanges.push([start, end]);
      offset += 8;
    }

    return {
      lastContiguousSeq,
      missingRanges,
    };
  }

  public static create(
    sessionId: number,
    ack: IAckPayload,
    sequenceNumber = 0,
    totalSequences = 1,
  ): AckPacket {
    const payloadBytes = AckPacket.serializePayload(ack);
    const header = new PacketHeader({
      magic: PROTOCOL_MAGIC,
      version: PROTOCOL_VERSION,
      packetType: PacketType.ACK,
      sessionId,
      sequenceNumber,
      totalSequences,
      payloadLength: payloadBytes.length,
      reserved: 0,
      checksum: 0,
    });

    return new AckPacket(header, ack, payloadBytes);
  }
}
