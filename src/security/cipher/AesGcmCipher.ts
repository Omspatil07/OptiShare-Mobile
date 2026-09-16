/**
 * OptiShare AES-256-GCM Authenticated Cipher
 *
 * Implements Authenticated Encryption with Associated Data (AEAD) via AES-GCM
 * using 256-bit keys, 96-bit random nonces (IVs), and 128-bit authentication tags.
 */

import {
  CRYPTO_ALGORITHMS,
  SECURITY_CONFIG,
  SecurityErrorCode,
} from '../constants/securityConstants';
import type { EncryptedPayload } from '../types/securityTypes';
import { generateRandomBytes, toArrayBuffer } from '../utils/securityUtils';

export class AesGcmCipher {
  /**
   * Encrypts plaintext bytes using AES-256-GCM with optional Authenticated Associated Data (AAD).
   *
   * @param plaintext Unencrypted data buffer.
   * @param key 256-bit AES-GCM CryptoKey.
   * @param aad Optional additional authenticated data bound to the authentication tag.
   * @param customIv Optional 12-byte IV (generated via CSPRNG if omitted).
   * @returns EncryptedPayload containing ciphertext (with 16-byte tag) and IV.
   */
  public static async encrypt(
    plaintext: Uint8Array,
    key: CryptoKey,
    aad?: Uint8Array,
    customIv?: Uint8Array,
  ): Promise<EncryptedPayload> {
    const iv = customIv ?? generateRandomBytes(SECURITY_CONFIG.GCM_IV_SIZE_BYTES);
    if (iv.length !== SECURITY_CONFIG.GCM_IV_SIZE_BYTES) {
      throw new Error(
        `Invalid IV length: expected ${SECURITY_CONFIG.GCM_IV_SIZE_BYTES} bytes, got ${iv.length} (${SecurityErrorCode.INVALID_IV_LENGTH})`,
      );
    }

    const subtle = globalThis.crypto.subtle;
    const algorithm = {
      name: CRYPTO_ALGORITHMS.CIPHER,
      iv: toArrayBuffer(iv),
      tagLength: 128, // 16 bytes
      ...(aad && aad.byteLength > 0 ? { additionalData: toArrayBuffer(aad) } : {}),
    };

    try {
      const encryptedBuffer = await subtle.encrypt(algorithm, key, toArrayBuffer(plaintext));
      const ciphertext = new Uint8Array(encryptedBuffer);

      // WebCrypto appends 16-byte GCM tag to end of ciphertext
      const tagOffset = ciphertext.length - SECURITY_CONFIG.GCM_TAG_SIZE_BYTES;
      const tag = ciphertext.subarray(tagOffset);

      return {
        ciphertext,
        iv,
        tag,
        aad,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Encryption failed: ${message} (${SecurityErrorCode.CRYPTO_OPERATION_FAILED})`,
      );
    }
  }

  /**
   * Decrypts an EncryptedPayload and cryptographically validates the 16-byte GCM authentication tag.
   * Throws if ciphertext, IV, tag, or AAD has been tampered with.
   *
   * @param payload EncryptedPayload containing ciphertext, IV, and optional AAD.
   * @param key 256-bit AES-GCM CryptoKey.
   * @returns Decrypted plaintext byte array.
   */
  public static async decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<Uint8Array> {
    if (payload.iv.length !== SECURITY_CONFIG.GCM_IV_SIZE_BYTES) {
      throw new Error(
        `Invalid IV length: expected ${SECURITY_CONFIG.GCM_IV_SIZE_BYTES} bytes, got ${payload.iv.length} (${SecurityErrorCode.INVALID_IV_LENGTH})`,
      );
    }

    if (payload.ciphertext.length < SECURITY_CONFIG.GCM_TAG_SIZE_BYTES) {
      throw new Error(
        `Ciphertext too short: must contain at least ${SECURITY_CONFIG.GCM_TAG_SIZE_BYTES} byte tag (${SecurityErrorCode.CORRUPTED_CIPHERTEXT})`,
      );
    }

    const subtle = globalThis.crypto.subtle;
    const algorithm = {
      name: CRYPTO_ALGORITHMS.CIPHER,
      iv: toArrayBuffer(payload.iv),
      tagLength: 128,
      ...(payload.aad && payload.aad.byteLength > 0
        ? { additionalData: toArrayBuffer(payload.aad) }
        : {}),
    };

    try {
      const decryptedBuffer = await subtle.decrypt(
        algorithm,
        key,
        toArrayBuffer(payload.ciphertext),
      );
      return new Uint8Array(decryptedBuffer);
    } catch {
      throw new Error(
        `Decryption failed: authentication tag verification failed or data tampered (${SecurityErrorCode.AUTHENTICATION_FAILED})`,
      );
    }
  }

  /**
   * Packs IV and ciphertext into a single contiguous binary buffer:
   * `[0..11]: 12-byte IV || [12..]: Ciphertext + 16-byte GCM tag`.
   */
  public static pack(payload: EncryptedPayload): Uint8Array {
    const packed = new Uint8Array(payload.iv.length + payload.ciphertext.length);
    packed.set(payload.iv, 0);
    packed.set(payload.ciphertext, payload.iv.length);
    return packed;
  }

  /**
   * Unpacks a contiguous binary buffer into an EncryptedPayload structure.
   */
  public static unpack(packed: Uint8Array, aad?: Uint8Array): EncryptedPayload {
    if (packed.length < SECURITY_CONFIG.GCM_IV_SIZE_BYTES + SECURITY_CONFIG.GCM_TAG_SIZE_BYTES) {
      throw new Error(
        `Packed buffer too small: ${packed.length} bytes (${SecurityErrorCode.CORRUPTED_CIPHERTEXT})`,
      );
    }

    const iv = packed.subarray(0, SECURITY_CONFIG.GCM_IV_SIZE_BYTES);
    const ciphertext = packed.subarray(SECURITY_CONFIG.GCM_IV_SIZE_BYTES);
    const tagOffset = ciphertext.length - SECURITY_CONFIG.GCM_TAG_SIZE_BYTES;
    const tag = ciphertext.subarray(tagOffset);

    return {
      iv,
      ciphertext,
      tag,
      aad,
    };
  }
}
