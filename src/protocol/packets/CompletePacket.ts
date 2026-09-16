/**
 * Complete Packet Model
 */

import { PacketType, PROTOCOL_MAGIC, PROTOCOL_VERSION } from '../constants/protocolConstants';
import { PacketHeader } from '../models/PacketHeader';
import { ProtocolPacket } from '../models/ProtocolPacket';

export interface ICompletePayload {
  readonly fileChecksum: number;
  readonly totalBytes: number;
}

export class CompletePacket extends ProtocolPacket {
  public readonly completePayload: ICompletePayload;

  constructor(header: PacketHeader, completePayload: ICompletePayload, payloadBytes?: Uint8Array) {
    super(header, payloadBytes ?? CompletePacket.serializePayload(completePayload));
    this.completePayload = completePayload;
  }

  public static serializePayload(data: ICompletePayload): Uint8Array {
    const buffer = new Uint8Array(8);
    const view = new DataView(buffer.buffer, buffer.byteOffset, 8);
    view.setUint32(0, data.fileChecksum, false);
    view.setUint32(4, data.totalBytes, false);
    return buffer;
  }

  public static deserializePayload(payload: Uint8Array): ICompletePayload {
    if (payload.length < 8) {
      throw new Error(`Invalid COMPLETE payload length: ${payload.length} < 8`);
    }
    const view = new DataView(payload.buffer, payload.byteOffset, payload.length);
    const fileChecksum = view.getUint32(0, false);
    const totalBytes = view.getUint32(4, false);
    return { fileChecksum, totalBytes };
  }

  public static create(
    sessionId: number,
    fileChecksum: number,
    totalBytes: number,
    sequenceNumber = 0,
    totalSequences = 1,
  ): CompletePacket {
    const payload = { fileChecksum, totalBytes };
    const payloadBytes = CompletePacket.serializePayload(payload);
    const header = new PacketHeader({
      magic: PROTOCOL_MAGIC,
      version: PROTOCOL_VERSION,
      packetType: PacketType.COMPLETE,
      sessionId,
      sequenceNumber,
      totalSequences,
      payloadLength: payloadBytes.length,
      reserved: 0,
      checksum: 0,
    });

    return new CompletePacket(header, payload, payloadBytes);
  }
}
