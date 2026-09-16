/**
 * OptiShare Sender Fountain Stage
 *
 * Configures the rateless Luby Transform (LT) Fountain encoder with Robust Soliton distribution,
 * enabling continuous droplet generation for loss-tolerant optical transfer.
 */

import { FountainEncoder } from '../../../fec';
import { PipelineStageId } from '../../constants/pipelineConstants';
import type { IPipelineStage } from '../../types/pipelineTypes';

export interface SenderFountainInput {
  readonly data: Uint8Array;
  readonly symbolSize: number;
  readonly seed?: number | undefined;
}

export interface SenderFountainOutput {
  readonly encoder: FountainEncoder;
  readonly k: number;
  readonly seed: number;
  readonly symbolSize: number;
  readonly originalLength: number;
}

export class SenderFountainStage
  implements IPipelineStage<SenderFountainInput, SenderFountainOutput>
{
  public readonly id = PipelineStageId.FOUNTAIN_ENCODE;
  public readonly name = 'SenderFountainStage';

  public process(input: SenderFountainInput): SenderFountainOutput {
    const { data, symbolSize, seed } = input;

    const encoder = new FountainEncoder(data, {
      symbolSize,
      systematic: true,
      seed: seed ?? 0,
    });

    return {
      encoder,
      k: encoder.k,
      seed: encoder.seed,
      symbolSize: encoder.symbolSize,
      originalLength: encoder.originalLength,
    };
  }

  public reset(): void {
    // Stateless
  }
}
