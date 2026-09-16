/**
 * OptiShare Elliptic Curve Diffie-Hellman (ECDH) Key Exchange
 *
 * Implements ephemeral ECDH over NIST P-256 (secp256r1) for establishing
 * authenticated, shared cryptographic session keys without pre-shared secrets.
 */

import { KeyManager } from './KeyManager';
import { CRYPTO_ALGORITHMS, SecurityErrorCode } from '../constants/securityConstants';
import type { EcdhKeyPair, KeyExchangeResult } from '../types/securityTypes';
import { bytesToHex, toArrayBuffer } from '../utils/securityUtils';

export class KeyExchange {
  /**
   * Generates a fresh ephemeral ECDH P-256 keypair for this peer.
   *
   * @returns EcdhKeyPair containing raw public key (65-byte uncompressed EC point) and CryptoKeys.
   */
  public static async generateKeyPair(): Promise<EcdhKeyPair> {
    const subtle = globalThis.crypto.subtle;
    const keyPair = (await subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: CRYPTO_ALGORITHMS.ECDH_CURVE,
      },
      true,
      ['deriveBits', 'deriveKey'],
    )) as { privateKey: CryptoKey; publicKey: CryptoKey };

    const rawPubBuffer = await subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyRaw = new Uint8Array(rawPubBuffer);
    const publicKeyHex = bytesToHex(publicKeyRaw);

    return {
      publicKeyRaw,
      publicKeyHex,
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
    };
  }

  /**
   * Computes the 256-bit raw shared secret with a peer's uncompressed public key.
   *
   * @param myPrivateKey This peer's ECDH private CryptoKey.
   * @param peerPublicKeyRaw Peer's 65-byte uncompressed raw public key point.
   * @returns 32-byte shared secret array.
   */
  public static async computeSharedSecret(
    myPrivateKey: CryptoKey,
    peerPublicKeyRaw: Uint8Array,
  ): Promise<Uint8Array> {
    const subtle = globalThis.crypto.subtle;

    try {
      const peerPublicKey = await subtle.importKey(
        'raw',
        toArrayBuffer(peerPublicKeyRaw),
        {
          name: 'ECDH',
          namedCurve: CRYPTO_ALGORITHMS.ECDH_CURVE,
        },
        false,
        [],
      );

      const derivedBuffer = await subtle.deriveBits(
        {
          name: 'ECDH',
          public: peerPublicKey,
        },
        myPrivateKey,
        256,
      );

      return new Uint8Array(derivedBuffer);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `ECDH key agreement failed: ${errorMsg} (${SecurityErrorCode.KEY_EXCHANGE_FAILED})`,
      );
    }
  }

  /**
   * Performs end-to-end key agreement and derives an AES-256-GCM session key using HKDF-SHA256.
   *
   * @param myPrivateKey This peer's ECDH private key.
   * @param peerPublicKeyRaw Peer's raw public key.
   * @param salt Optional salt for HKDF derivation.
   * @param info Context identifier for cryptographic domain separation.
   * @returns KeyExchangeResult with sharedSecret, derived sessionKey, and sessionKeyRaw.
   */
  public static async establishSessionKey(
    myPrivateKey: CryptoKey,
    peerPublicKeyRaw: Uint8Array,
    salt?: Uint8Array,
    info = 'OptiShare-Optical-Session-Key-v1',
  ): Promise<KeyExchangeResult> {
    const sharedSecret = await this.computeSharedSecret(myPrivateKey, peerPublicKeyRaw);

    const { sessionKey, sessionKeyRaw } = await KeyManager.deriveSessionKey(
      sharedSecret,
      salt,
      info,
    );

    return {
      sharedSecret,
      sessionKey,
      sessionKeyRaw,
    };
  }
}
