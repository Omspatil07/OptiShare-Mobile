/**
 * Data Packet Model (Optical Stream Payload Chunk)
 */

import { PacketType, PROTOCOL_MAGIC, PROTOCOL_VERSION } from '../constants/protocolConstants';
import { PacketHeader } from '../models/PacketHeader';
import { ProtocolPacket } from '../models/ProtocolPacket';

export class DataPacket extends ProtocolPacket {
  constructor(header: PacketHeader, chunkData: Uint8Array) {
    super(header, chunkData);
  }

  public get chunkIndex(): number {
    return this.sequenceNumber;
  }

  public get totalChunks(): number {
    return this.totalSequences;
  }

  public get chunkData(): Uint8Array {
    return this.payload;
  }

  public static create(
    sessionId: number,
    chunkIndex: number,
    totalChunks: number,
    chunkData: Uint8Array,
  ): DataPacket {
    const header = new PacketHeader({
      magic: PROTOCOL_MAGIC,
      version: PROTOCOL_VERSION,
      packetType: PacketType.DATA,
      sessionId,
      sequenceNumber: chunkIndex,
      totalSequences: totalChunks,
      payloadLength: chunkData.length,
      reserved: 0,
      checksum: 0,
    });

    return new DataPacket(header, chunkData);
  }
}
