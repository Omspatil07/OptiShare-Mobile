/**
 * OptiShare Optical Frame Processor
 *
 * Ingests raw optical camera/scanner byte frames, validates CRC-32 integrity,
 * decodes protocol packets, and detects Fountain Code droplet headers.
 */

import { FountainProtocolBridge } from '../../fec';
import { PacketDecoder, PacketType, type ProtocolPacket } from '../../protocol';

export interface ProcessedFrame {
  readonly success: boolean;
  readonly packet?: ProtocolPacket;
  readonly isFountain?: boolean;
  readonly isCorrupt?: boolean;
  readonly error?: string;
}

export class FrameProcessor {
  /**
   * Ingests a raw byte buffer or a pre-decoded ProtocolPacket.
   *
   * @param frame Raw Uint8Array from optical scanner, or decoded ProtocolPacket.
   * @param expectedSessionId Optional session ID filter. If > 0, ignores other sessions.
   * @returns ProcessedFrame result with validation status.
   */
  public static processFrame(
    frame: Uint8Array | ProtocolPacket,
    expectedSessionId = 0,
  ): ProcessedFrame {
    let packet: ProtocolPacket;

    if (frame instanceof Uint8Array) {
      const decodeResult = PacketDecoder.decode(frame);
      if (!decodeResult.success || !decodeResult.packet) {
        return {
          success: false,
          isCorrupt: true,
          error: decodeResult.error ?? 'Frame failed protocol decoding',
        };
      }
      packet = decodeResult.packet;
    } else {
      packet = frame;
    }

    // Filter by expected session ID if one has been bound
    if (expectedSessionId !== 0 && packet.sessionId !== expectedSessionId) {
      return {
        success: false,
        isCorrupt: false,
        error: `Mismatched session ID: expected ${expectedSessionId}, got ${packet.sessionId}`,
      };
    }

    const isFountain =
      packet.packetType === PacketType.DATA && FountainProtocolBridge.isFountainPacket(packet);

    return {
      success: true,
      packet,
      isFountain,
      isCorrupt: false,
    };
  }
}
