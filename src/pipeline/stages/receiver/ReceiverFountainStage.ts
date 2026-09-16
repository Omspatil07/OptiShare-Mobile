/**
 * OptiShare Receiver Fountain Pipeline Stage
 *
 * Consumes validated protocol frames, initializes peeling belief-propagation decoder
 * on metadata arrival, and progressively reconstructs source symbols from rateless droplets.
 */

import { FountainDecoder, FountainProtocolBridge } from '../../../fec';
import {
  type FileInfoPacket,
  type FileMetadata,
  PacketType,
  type ProtocolPacket,
} from '../../../protocol';
import { PipelineStageId } from '../../constants/pipelineConstants';
import type { IPipelineStage } from '../../types/pipelineTypes';

export type FountainProgressStatus = 'METADATA_RECEIVED' | 'PROGRESS' | 'COMPLETE' | 'IGNORED';

export interface ReceiverFountainOutput {
  readonly status: FountainProgressStatus;
  readonly isComplete: boolean;
  readonly metadata: FileMetadata | null;
  readonly reconstructedData: Uint8Array | null;
  readonly decodedCount: number;
  readonly totalSymbols: number;
}

export class ReceiverFountainStage
  implements IPipelineStage<ProtocolPacket, ReceiverFountainOutput>
{
  public readonly id = PipelineStageId.FOUNTAIN_DECODE;
  public readonly name = 'ReceiverFountainStage';

  private metadata: FileMetadata | null = null;
  private decoder: FountainDecoder | null = null;
  private isFinished = false;
  private readonly seed: number;

  constructor(seed: number = 0) {
    this.seed = seed;
  }

  public get isComplete(): boolean {
    return this.isFinished;
  }

  public get currentMetadata(): FileMetadata | null {
    return this.metadata;
  }

  public get decodedCount(): number {
    return this.decoder?.decodedCount ?? 0;
  }

  public get totalSymbols(): number {
    return this.decoder?.k ?? 0;
  }

  public process(packet: ProtocolPacket): ReceiverFountainOutput {
    if (this.isFinished) {
      return {
        status: 'COMPLETE',
        isComplete: true,
        metadata: this.metadata,
        reconstructedData: null,
        decodedCount: this.decodedCount,
        totalSymbols: this.totalSymbols,
      };
    }

    if (packet.packetType === PacketType.FILE_INFO) {
      const fileInfoPacket = packet as FileInfoPacket;
      if (!this.metadata) {
        this.metadata = fileInfoPacket.metadata;
        this.decoder = new FountainDecoder({
          totalSymbols: this.metadata.totalChunks,
          symbolSize: this.metadata.chunkSize,
          originalLength: this.metadata.fileSizeBytes,
          seed: this.seed,
        });

        return {
          status: 'METADATA_RECEIVED',
          isComplete: false,
          metadata: this.metadata,
          reconstructedData: null,
          decodedCount: 0,
          totalSymbols: this.decoder.k,
        };
      }
      return {
        status: 'IGNORED',
        isComplete: false,
        metadata: this.metadata,
        reconstructedData: null,
        decodedCount: this.decodedCount,
        totalSymbols: this.totalSymbols,
      };
    }

    if (packet.packetType === PacketType.DATA) {
      if (!this.decoder || !this.metadata) {
        return {
          status: 'IGNORED',
          isComplete: false,
          metadata: null,
          reconstructedData: null,
          decodedCount: 0,
          totalSymbols: 0,
        };
      }

      const droplet = FountainProtocolBridge.decodePacketToDroplet(packet, this.seed);
      if (!droplet) {
        return {
          status: 'IGNORED',
          isComplete: false,
          metadata: this.metadata,
          reconstructedData: null,
          decodedCount: this.decoder.decodedCount,
          totalSymbols: this.decoder.k,
        };
      }

      this.decoder.addDroplet(droplet);

      if (this.decoder.isComplete) {
        this.isFinished = true;
        const reconstructedData = this.decoder.reconstructData();
        return {
          status: 'COMPLETE',
          isComplete: true,
          metadata: this.metadata,
          reconstructedData,
          decodedCount: this.decoder.decodedCount,
          totalSymbols: this.decoder.k,
        };
      }

      return {
        status: 'PROGRESS',
        isComplete: false,
        metadata: this.metadata,
        reconstructedData: null,
        decodedCount: this.decoder.decodedCount,
        totalSymbols: this.decoder.k,
      };
    }

    return {
      status: 'IGNORED',
      isComplete: false,
      metadata: this.metadata,
      reconstructedData: null,
      decodedCount: this.decodedCount,
      totalSymbols: this.totalSymbols,
    };
  }

  public reset(): void {
    this.metadata = null;
    this.decoder = null;
    this.isFinished = false;
  }
}
