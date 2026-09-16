/* eslint-disable no-bitwise */
/**
 * Fountain Code <-> Optical Transfer Protocol Bridge
 *
 * Provides bidirectional integration between Fountain Code droplets
 * and Phase 10 binary ProtocolPacket / DataPacket frames.
 */

import {
  PacketEncoder,
  PacketHeader,
  PacketType,
  PROTOCOL_MAGIC,
  PROTOCOL_VERSION,
  type ProtocolPacket,
} from '../../protocol';
import { FOUNTAIN_PACKET_FLAG } from '../constants/fecConstants';
import { FountainSymbol } from '../models/FountainSymbol';

export class FountainProtocolBridge {
  /**
   * Encapsulates a FountainSymbol droplet into a Phase 10 binary DATA packet frame.
   *
   * @param sessionId Active transfer session ID.
   * @param k Total source symbols (K).
   * @param droplet FountainSymbol droplet instance.
   * @returns Serialized Phase 10 binary packet buffer.
   */
  public static encodeDropletToPacket(
    sessionId: number,
    k: number,
    droplet: FountainSymbol,
  ): Uint8Array {
    // Pack FOUNTAIN flag and degree into 16-bit reserved field
    const reserved = (FOUNTAIN_PACKET_FLAG | (droplet.degree & 0x0fff)) >>> 0;

    const header = new PacketHeader({
      magic: PROTOCOL_MAGIC,
      version: PROTOCOL_VERSION,
      packetType: PacketType.DATA,
      sessionId,
      sequenceNumber: droplet.sequenceNumber,
      totalSequences: k,
      payloadLength: droplet.data.length,
      reserved,
      checksum: 0,
    });

    const packet = {
      header,
      payload: droplet.data,
      packetType: PacketType.DATA,
      sessionId,
      sequenceNumber: droplet.sequenceNumber,
      totalSequences: k,
      payloadLength: droplet.data.length,
      checksum: 0,
    };

    return PacketEncoder.encode(packet);
  }

  /**
   * Extracts a FountainSymbol droplet from a Phase 10 ProtocolPacket.
   *
   * @param packet Decoded Phase 10 protocol packet.
   * @param seed Active session PRNG seed matching encoder.
   * @returns Reconstructed FountainSymbol, or null if not a valid DATA packet.
   */
  public static decodePacketToDroplet(packet: ProtocolPacket, seed: number): FountainSymbol | null {
    if (packet.packetType !== PacketType.DATA) {
      return null;
    }

    const degree = packet.header.reserved & 0x0fff || 1;
    const isSystematic = degree === 1 && packet.sequenceNumber < packet.totalSequences;

    return new FountainSymbol({
      sequenceNumber: packet.sequenceNumber,
      seed,
      degree,
      sourceIndices: isSystematic ? [packet.sequenceNumber] : [],
      data: packet.payload,
      isSystematic,
    });
  }

  /**
   * Checks if a ProtocolPacket contains Fountain Code droplet flags.
   */
  public static isFountainPacket(packet: ProtocolPacket): boolean {
    return (
      packet.packetType === PacketType.DATA && (packet.header.reserved & FOUNTAIN_PACKET_FLAG) !== 0
    );
  }
}
