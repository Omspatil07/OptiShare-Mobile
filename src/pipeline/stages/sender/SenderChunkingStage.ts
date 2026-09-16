/**
 * OptiShare Sender Chunking Pipeline Stage
 *
 * Slices the incoming binary payload into uniform symbol blocks
 * with zero-padding alignment for downstream Forward Error Correction (FEC).
 */

import { PipelineStageId } from '../../constants/pipelineConstants';
import type { IPipelineStage } from '../../types/pipelineTypes';

export interface SenderChunkingInput {
  readonly data: Uint8Array;
  readonly symbolSize: number;
}

export interface SenderChunkingOutput {
  readonly chunks: Uint8Array[];
  readonly totalChunks: number;
  readonly symbolSize: number;
  readonly originalLength: number;
}

export class SenderChunkingStage
  implements IPipelineStage<SenderChunkingInput, SenderChunkingOutput>
{
  public readonly id = PipelineStageId.CHUNKING;
  public readonly name = 'SenderChunkingStage';

  public process(input: SenderChunkingInput): SenderChunkingOutput {
    const { data, symbolSize } = input;

    if (symbolSize <= 0) {
      throw new Error(`Symbol size must be greater than zero: got ${symbolSize}`);
    }

    const originalLength = data.length;
    const totalChunks = Math.max(1, Math.ceil(originalLength / symbolSize));
    const chunks: Uint8Array[] = new Array(totalChunks);

    for (let i = 0; i < totalChunks; i++) {
      const block = new Uint8Array(symbolSize);
      const start = i * symbolSize;
      if (start < originalLength) {
        const end = Math.min(start + symbolSize, originalLength);
        block.set(data.subarray(start, end), 0);
      }
      chunks[i] = block;
    }

    return {
      chunks,
      totalChunks,
      symbolSize,
      originalLength,
    };
  }

  public reset(): void {
    // Stateless
  }
}
