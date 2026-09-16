/**
 * OptiShare Receiver Decryption Pipeline Stage
 *
 * Unpacks the contiguous IV and ciphertext buffer and verifies AES-256-GCM authentication
 * tag against Authenticated Associated Data (AAD), returning the authentic plaintext.
 */

import { AesGcmCipher } from '../../../security';
import { PipelineErrorCode, PipelineStageId } from '../../constants/pipelineConstants';
import type { IPipelineStage } from '../../types/pipelineTypes';

export interface ReceiverDecryptionInput {
  readonly data: Uint8Array;
  readonly isEncrypted?: boolean | undefined;
  readonly key?: CryptoKey | null | undefined;
  readonly aad?: Uint8Array | undefined;
}

export interface ReceiverDecryptionOutput {
  readonly plaintext: Uint8Array;
  readonly wasEncrypted: boolean;
}

export class ReceiverDecryptionStage
  implements IPipelineStage<ReceiverDecryptionInput, ReceiverDecryptionOutput>
{
  public readonly id = PipelineStageId.DECRYPTION;
  public readonly name = 'ReceiverDecryptionStage';

  public async process(input: ReceiverDecryptionInput): Promise<ReceiverDecryptionOutput> {
    const { data, key, isEncrypted, aad } = input;

    if (!key) {
      if (isEncrypted) {
        throw new Error(
          `[${PipelineErrorCode.DECRYPTION_FAILED}] Payload is encrypted but no decryption key was supplied.`,
        );
      }
      return {
        plaintext: data,
        wasEncrypted: false,
      };
    }

    try {
      const unpacked = AesGcmCipher.unpack(data, aad);
      const plaintext = await AesGcmCipher.decrypt(unpacked, key);

      return {
        plaintext,
        wasEncrypted: true,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `[${PipelineErrorCode.DECRYPTION_FAILED}] Decryption or AEAD authentication tag failed: ${msg}`,
      );
    }
  }

  public reset(): void {
    // Stateless
  }
}
