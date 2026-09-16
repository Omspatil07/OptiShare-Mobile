/**
 * OptiShare Cryptographic Key Manager
 *
 * Handles CSPRNG key generation, import/export, HKDF-SHA256 key derivation,
 * and secure key zeroization.
 */

import { CRYPTO_ALGORITHMS, SECURITY_CONFIG } from '../constants/securityConstants';
import { generateRandomBytes, toArrayBuffer, wipeBuffer } from '../utils/securityUtils';

export class KeyManager {
  /**
   * Generates a fresh 256-bit AES-GCM CryptoKey using platform CSPRNG.
   */
  public static async generateKey(): Promise<CryptoKey> {
    return await globalThis.crypto.subtle.generateKey(
      {
        name: CRYPTO_ALGORITHMS.CIPHER,
        length: SECURITY_CONFIG.AES_KEY_SIZE_BITS,
      },
      true, // extractable for export if needed
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Generates a 32-byte (256-bit) raw symmetric key buffer.
   */
  public static generateRawKey(): Uint8Array {
    return generateRandomBytes(SECURITY_CONFIG.AES_KEY_SIZE_BYTES);
  }

  /**
   * Imports a raw 32-byte symmetric key buffer into a WebCrypto AES-GCM CryptoKey.
   */
  public static async importRawKey(rawKey: Uint8Array): Promise<CryptoKey> {
    if (rawKey.length !== SECURITY_CONFIG.AES_KEY_SIZE_BYTES) {
      throw new Error(
        `Invalid key length: expected ${SECURITY_CONFIG.AES_KEY_SIZE_BYTES} bytes, got ${rawKey.length}`,
      );
    }

    return await globalThis.crypto.subtle.importKey(
      'raw',
      toArrayBuffer(rawKey),
      { name: CRYPTO_ALGORITHMS.CIPHER },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Exports an AES-GCM CryptoKey to its raw 32-byte representation.
   */
  public static async exportRawKey(key: CryptoKey): Promise<Uint8Array> {
    const rawBuffer = await globalThis.crypto.subtle.exportKey('raw', key);
    return new Uint8Array(rawBuffer);
  }

  /**
   * Derives a dedicated 256-bit AES-GCM session key using HKDF-SHA256 (RFC 5869).
   *
   * @param masterSecret Base input keying material (IKM) or shared secret.
   * @param salt Optional or generated cryptographic salt (recommended: 16 bytes).
   * @param info Context and application-specific information string.
   * @returns Derived session CryptoKey and its raw byte representation.
   */
  public static async deriveSessionKey(
    masterSecret: Uint8Array,
    salt: Uint8Array = generateRandomBytes(SECURITY_CONFIG.SALT_SIZE_BYTES),
    info: string | Uint8Array = 'OptiShare-Transfer-Session-v1',
  ): Promise<{ sessionKey: CryptoKey; sessionKeyRaw: Uint8Array; salt: Uint8Array }> {
    const subtle = globalThis.crypto.subtle;
    const baseKey = await subtle.importKey('raw', toArrayBuffer(masterSecret), 'HKDF', false, [
      'deriveKey',
    ]);

    const infoBytes = typeof info === 'string' ? new TextEncoder().encode(info) : info;

    const sessionKey = await subtle.deriveKey(
      {
        name: 'HKDF',
        hash: CRYPTO_ALGORITHMS.HKDF_HASH,
        salt: toArrayBuffer(salt),
        info: toArrayBuffer(infoBytes),
      },
      baseKey,
      {
        name: CRYPTO_ALGORITHMS.CIPHER,
        length: SECURITY_CONFIG.AES_KEY_SIZE_BITS,
      },
      true,
      ['encrypt', 'decrypt'],
    );

    const sessionKeyRaw = await this.exportRawKey(sessionKey);

    return {
      sessionKey,
      sessionKeyRaw,
      salt,
    };
  }

  /**
   * Securely purges a secret key buffer from memory by zeroizing its contents.
   */
  public static wipe(rawKey: Uint8Array): void {
    wipeBuffer(rawKey);
  }
}
