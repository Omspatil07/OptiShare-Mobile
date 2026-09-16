/**
 * File Info Packet Model
 */

import { PacketType, PROTOCOL_MAGIC, PROTOCOL_VERSION } from '../constants/protocolConstants';
import type { FileMetadata } from '../models/FileMetadata';
import { PacketHeader } from '../models/PacketHeader';
import { ProtocolPacket } from '../models/ProtocolPacket';

export class FileInfoPacket extends ProtocolPacket {
  public readonly metadata: FileMetadata;

  constructor(header: PacketHeader, metadata: FileMetadata, payloadBytes?: Uint8Array) {
    super(header, payloadBytes ?? metadata.serialize());
    this.metadata = metadata;
  }

  public static create(
    sessionId: number,
    metadata: FileMetadata,
    sequenceNumber = 0,
    totalSequences = 1,
  ): FileInfoPacket {
    const payloadBytes = metadata.serialize();
    const header = new PacketHeader({
      magic: PROTOCOL_MAGIC,
      version: PROTOCOL_VERSION,
      packetType: PacketType.FILE_INFO,
      sessionId,
      sequenceNumber,
      totalSequences,
      payloadLength: payloadBytes.length,
      reserved: 0,
      checksum: 0,
    });

    return new FileInfoPacket(header, metadata, payloadBytes);
  }
}
