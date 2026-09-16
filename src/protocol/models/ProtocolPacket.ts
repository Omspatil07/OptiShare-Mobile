/**
 * Base Protocol Packet Model
 */

import type { PacketHeader } from './PacketHeader';
import type { PacketType } from '../constants/protocolConstants';

export class ProtocolPacket {
  public readonly header: PacketHeader;
  public readonly payload: Uint8Array;

  constructor(header: PacketHeader, payload?: Uint8Array) {
    this.header = header;
    this.payload = payload ?? new Uint8Array(0);
  }

  public get packetType(): PacketType {
    return this.header.packetType;
  }

  public get sessionId(): number {
    return this.header.sessionId;
  }

  public get sequenceNumber(): number {
    return this.header.sequenceNumber;
  }

  public get totalSequences(): number {
    return this.header.totalSequences;
  }

  public get payloadLength(): number {
    return this.header.payloadLength;
  }

  public get checksum(): number {
    return this.header.checksum;
  }
}
