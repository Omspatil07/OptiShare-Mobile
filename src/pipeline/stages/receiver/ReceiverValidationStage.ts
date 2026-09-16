/**
 * OptiShare Receiver Validation Pipeline Stage
 *
 * Decodes raw binary frames into ProtocolPackets, verifies CRC-32 checksum integrity,
 * checks session consistency, and filters packets through a sliding-window ReplayProtector.
 */

import { type ProtocolPacket, PacketDecoder, PacketType } from '../../../protocol';
import { ReplayProtector } from '../../../security';
import { PIPELINE_CONFIG, PipelineStageId } from '../../constants/pipelineConstants';
import type { IPipelineStage } from '../../types/pipelineTypes';

export interface ReceiverValidationConfig {
  readonly expectedSessionId?: number | undefined;
  readonly replayWindowSize?: number | undefined;
}

export interface ValidationOutput {
  readonly valid: boolean;
  readonly packet: ProtocolPacket | null;
  readonly isReplayed: boolean;
  readonly isCorrupted: boolean;
  readonly reason?: string | undefined;
}

export class ReceiverValidationStage implements IPipelineStage<Uint8Array, ValidationOutput> {
  public readonly id = PipelineStageId.VALIDATION;
  public readonly name = 'ReceiverValidationStage';

  private expectedSessionId: number;
  private readonly replayProtector: ReplayProtector;

  constructor(config: ReceiverValidationConfig = {}) {
    this.expectedSessionId = config.expectedSessionId ?? 0;
    this.replayProtector = new ReplayProtector(
      config.replayWindowSize ?? PIPELINE_CONFIG.DEFAULT_REPLAY_WINDOW_SIZE,
    );
  }

  public setExpectedSessionId(sessionId: number): void {
    this.expectedSessionId = sessionId;
  }

  public process(rawFrame: Uint8Array): ValidationOutput {
    const result = PacketDecoder.decode(rawFrame);
    if (!result.success || !result.packet) {
      return {
        valid: false,
        packet: null,
        isReplayed: false,
        isCorrupted: true,
        reason: result.error ?? 'Packet decoding or checksum failed',
      };
    }

    const packet = result.packet;

    // Session validation
    if (this.expectedSessionId !== 0 && packet.sessionId !== 0) {
      if (packet.sessionId !== this.expectedSessionId) {
        return {
          valid: false,
          packet,
          isReplayed: false,
          isCorrupted: false,
          reason: `Session mismatch: expected ${this.expectedSessionId}, got ${packet.sessionId}`,
        };
      }
    }

    // Anti-replay protection for DATA packets
    if (packet.packetType === PacketType.DATA) {
      const isFresh = this.replayProtector.update(packet.sequenceNumber);
      if (!isFresh) {
        return {
          valid: false,
          packet,
          isReplayed: true,
          isCorrupted: false,
          reason: `Replayed or stale packet sequence ${packet.sequenceNumber}`,
        };
      }
    }

    return {
      valid: true,
      packet,
      isReplayed: false,
      isCorrupted: false,
    };
  }

  public reset(): void {
    this.replayProtector.reset();
  }
}
