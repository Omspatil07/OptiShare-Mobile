/**
 * Cancel Packet Model
 */

import type { CancelReasonCode } from '../constants/protocolConstants';
import { PacketType, PROTOCOL_MAGIC, PROTOCOL_VERSION } from '../constants/protocolConstants';
import { PacketHeader } from '../models/PacketHeader';
import { ProtocolPacket } from '../models/ProtocolPacket';
import type { ICancelPayload } from '../types/protocolTypes';
import { stringToUtf8, utf8ToString } from '../utils/protocolUtils';

export class CancelPacket extends ProtocolPacket {
  public readonly cancelPayload: ICancelPayload;

  constructor(header: PacketHeader, cancelPayload: ICancelPayload, payloadBytes?: Uint8Array) {
    super(header, payloadBytes ?? CancelPacket.serializePayload(cancelPayload));
    this.cancelPayload = cancelPayload;
  }

  public static serializePayload(data: ICancelPayload): Uint8Array {
    const msgBytes = stringToUtf8(data.message);
    const buffer = new Uint8Array(1 + 1 + msgBytes.length);
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);
    view.setUint8(0, data.reasonCode);
    view.setUint8(1, msgBytes.length);
    buffer.set(msgBytes, 2);
    return buffer;
  }

  public static deserializePayload(payload: Uint8Array): ICancelPayload {
    if (payload.length < 2) {
      throw new Error(`Invalid CANCEL payload length: ${payload.length} < 2`);
    }
    const reasonCode = payload[0] as CancelReasonCode;
    const msgLen = payload[1] ?? 0;
    const message =
      payload.length >= 2 + msgLen ? utf8ToString(payload.subarray(2, 2 + msgLen)) : '';
    return { reasonCode, message };
  }

  public static create(
    sessionId: number,
    reasonCode: CancelReasonCode,
    message = '',
    sequenceNumber = 0,
    totalSequences = 1,
  ): CancelPacket {
    const cancelPayload = { reasonCode, message };
    const payloadBytes = CancelPacket.serializePayload(cancelPayload);
    const header = new PacketHeader({
      magic: PROTOCOL_MAGIC,
      version: PROTOCOL_VERSION,
      packetType: PacketType.CANCEL,
      sessionId,
      sequenceNumber,
      totalSequences,
      payloadLength: payloadBytes.length,
      reserved: 0,
      checksum: 0,
    });

    return new CancelPacket(header, cancelPayload, payloadBytes);
  }
}
