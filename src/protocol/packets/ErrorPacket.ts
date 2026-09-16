/**
 * Error Packet Model
 */

import type { ProtocolErrorCode } from '../constants/protocolConstants';
import { PacketType, PROTOCOL_MAGIC, PROTOCOL_VERSION } from '../constants/protocolConstants';
import { PacketHeader } from '../models/PacketHeader';
import { ProtocolPacket } from '../models/ProtocolPacket';
import type { IErrorPayload } from '../types/protocolTypes';
import { stringToUtf8, utf8ToString } from '../utils/protocolUtils';

export class ErrorPacket extends ProtocolPacket {
  public readonly errorPayload: IErrorPayload;

  constructor(header: PacketHeader, errorPayload: IErrorPayload, payloadBytes?: Uint8Array) {
    super(header, payloadBytes ?? ErrorPacket.serializePayload(errorPayload));
    this.errorPayload = errorPayload;
  }

  public static serializePayload(data: IErrorPayload): Uint8Array {
    const msgBytes = stringToUtf8(data.message);
    const buffer = new Uint8Array(1 + 1 + msgBytes.length);
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);
    view.setUint8(0, data.errorCode);
    view.setUint8(1, msgBytes.length);
    buffer.set(msgBytes, 2);
    return buffer;
  }

  public static deserializePayload(payload: Uint8Array): IErrorPayload {
    if (payload.length < 2) {
      throw new Error(`Invalid ERROR payload length: ${payload.length} < 2`);
    }
    const errorCode = payload[0] as ProtocolErrorCode;
    const msgLen = payload[1] ?? 0;
    const message =
      payload.length >= 2 + msgLen ? utf8ToString(payload.subarray(2, 2 + msgLen)) : '';
    return { errorCode, message };
  }

  public static create(
    sessionId: number,
    errorCode: ProtocolErrorCode,
    message = '',
    sequenceNumber = 0,
    totalSequences = 1,
  ): ErrorPacket {
    const errorPayload = { errorCode, message };
    const payloadBytes = ErrorPacket.serializePayload(errorPayload);
    const header = new PacketHeader({
      magic: PROTOCOL_MAGIC,
      version: PROTOCOL_VERSION,
      packetType: PacketType.ERROR,
      sessionId,
      sequenceNumber,
      totalSequences,
      payloadLength: payloadBytes.length,
      reserved: 0,
      checksum: 0,
    });

    return new ErrorPacket(header, errorPayload, payloadBytes);
  }
}
