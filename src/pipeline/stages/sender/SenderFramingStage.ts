/**
 * OptiShare Sender Framing Pipeline Stage
 *
 * Encapsulates Fountain droplets and file metadata into Phase 10 Optical Transfer Protocol
 * binary packets with CRC-32 checksums and version headers.
 */

import type { SenderFountainOutput } from './SenderFountainStage';
import { FountainProtocolBridge } from '../../../fec';
import { type FileMetadata, PacketEncoder } from '../../../protocol';
import { PIPELINE_CONFIG, PipelineStageId } from '../../constants/pipelineConstants';
import type { IPipelineStage } from '../../types/pipelineTypes';

export interface SenderFramingInput {
  readonly sessionId: number;
  readonly metadata: FileMetadata;
  readonly fountainOutput: SenderFountainOutput;
  readonly metadataInterval?: number;
}

export interface SenderFramingOutput {
  readonly fileInfoFrame: Uint8Array;
  readonly getFrame: (frameIndex: number) => Uint8Array;
  readonly createDropletFrame: (seq: number) => Uint8Array;
}

export class SenderFramingStage implements IPipelineStage<SenderFramingInput, SenderFramingOutput> {
  public readonly id = PipelineStageId.FRAMING;
  public readonly name = 'SenderFramingStage';

  public process(input: SenderFramingInput): SenderFramingOutput {
    const { sessionId, metadata, fountainOutput } = input;
    const interval = input.metadataInterval ?? PIPELINE_CONFIG.METADATA_ANNOUNCE_INTERVAL_FRAMES;

    const fileInfoFrame = PacketEncoder.encodeFileInfo(sessionId, metadata);
    const { encoder, k } = fountainOutput;

    const createDropletFrame = (seq: number): Uint8Array => {
      const droplet = encoder.getDroplet(seq);
      return FountainProtocolBridge.encodeDropletToPacket(sessionId, k, droplet);
    };

    let dropletSeqCounter = 0;

    const getFrame = (frameIndex: number): Uint8Array => {
      // Announce metadata at start and periodically every interval frames
      if (frameIndex === 0 || frameIndex % interval === 0) {
        return fileInfoFrame;
      }
      const frame = createDropletFrame(dropletSeqCounter);
      dropletSeqCounter++;
      return frame;
    };

    return {
      fileInfoFrame,
      getFrame,
      createDropletFrame,
    };
  }

  public reset(): void {
    // Stateless
  }
}
