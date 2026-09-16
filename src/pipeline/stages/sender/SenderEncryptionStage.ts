/**
 * OptiShare Sender Encryption Pipeline Stage
 *
 * Encrypts raw plaintext using AES-256-GCM with Authenticated Associated Data (AAD),
 * packing IV, ciphertext, and authentication tag into a contiguous binary payload.
 */

import { CRC32 } from '../../../protocol';
import { AesGcmCipher } from '../../../security';
import { PipelineErrorCode, PipelineStageId } from '../../constants/pipelineConstants';
import type { IPipelineStage } from '../../types/pipelineTypes';

export interface SenderEncryptionInput {
  readonly plaintext: Uint8Array;
  readonly key?: CryptoKey | null | undefined;
  readonly aad?: Uint8Array | undefined;
}

export interface SenderEncryptionOutput {
  readonly data: Uint8Array;
  readonly isEncrypted: boolean;
  readonly originalChecksum: number;
  readonly originalSize: number;
}

export class SenderEncryptionStage
  implements IPipelineStage<SenderEncryptionInput, SenderEncryptionOutput>
{
  public readonly id = PipelineStageId.ENCRYPTION;
  public readonly name = 'SenderEncryptionStage';

  public async process(input: SenderEncryptionInput): Promise<SenderEncryptionOutput> {
    const { plaintext, key, aad } = input;
    const originalSize = plaintext.length;
    const originalChecksum = CRC32.calculate(plaintext);

    if (!key) {
      return {
        data: plaintext,
        isEncrypted: false,
        originalChecksum,
        originalSize,
      };
    }

    try {
      const encrypted = await AesGcmCipher.encrypt(plaintext, key, aad);
      const packed = AesGcmCipher.pack(encrypted);

      return {
        data: packed,
        isEncrypted: true,
        originalChecksum,
        originalSize,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[${PipelineErrorCode.ENCRYPTION_FAILED}] Sender encryption failed: ${msg}`);
    }
  }

  public reset(): void {
    // Stateless per execution
  }
}
