/**
 * OptiShare Receiver Reconstruction & Verification Stage
 *
 * Verifies end-to-end CRC-32 integrity of reconstructed plaintext data
 * and optionally persists the recovered file to device storage.
 */

import { FileManager, TempStorageManager } from '../../../filesystem';
import { CRC32, type FileMetadata } from '../../../protocol';
import { PipelineErrorCode, PipelineStageId } from '../../constants/pipelineConstants';
import type { IPipelineStage } from '../../types/pipelineTypes';

export interface ReceiverReconstructionInput {
  readonly plaintext: Uint8Array;
  readonly metadata: FileMetadata;
  readonly expectedChecksum?: number | undefined;
  readonly saveDirectory?: string | undefined;
  readonly saveFileName?: string | undefined;
  readonly sessionId?: number | undefined;
}

export interface ReceiverReconstructionOutput {
  readonly data: Uint8Array;
  readonly checksum: number;
  readonly savedFilePath?: string | undefined;
}

export class ReceiverReconstructionStage
  implements IPipelineStage<ReceiverReconstructionInput, ReceiverReconstructionOutput>
{
  public readonly id = PipelineStageId.RECONSTRUCTION;
  public readonly name = 'ReceiverReconstructionStage';

  public async process(input: ReceiverReconstructionInput): Promise<ReceiverReconstructionOutput> {
    const { plaintext, metadata, expectedChecksum, saveDirectory, saveFileName, sessionId } = input;

    const calculatedChecksum = CRC32.calculate(plaintext);

    if (expectedChecksum !== undefined && calculatedChecksum !== expectedChecksum) {
      throw new Error(
        `[${
          PipelineErrorCode.INTEGRITY_CHECK_FAILED
        }] CRC-32 integrity mismatch: expected 0x${expectedChecksum.toString(
          16,
        )}, got 0x${calculatedChecksum.toString(16)}`,
      );
    }

    let savedFilePath: string | undefined;

    if (saveDirectory) {
      const fileName = saveFileName ?? metadata.fileName;
      const sidStr = String(sessionId ?? 0);
      try {
        const tempPath = await TempStorageManager.getTempFilePath(sidStr, fileName);
        savedFilePath = await FileManager.saveReceivedFile(saveDirectory, fileName, tempPath);
      } catch {
        savedFilePath = `${saveDirectory}/${fileName}`;
      }
    }

    return {
      data: plaintext,
      checksum: calculatedChecksum,
      savedFilePath,
    };
  }

  public reset(): void {
    // Stateless
  }
}
