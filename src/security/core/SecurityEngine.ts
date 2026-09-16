/**
 * OptiShare Security Engine (Main Facade)
 *
 * Coordinates end-to-end authenticated encryption, ephemeral ECDH key exchange,
 * HKDF session key derivation, replay protection, and large-file streaming encryption.
 */

import { AesGcmCipher } from '../cipher/AesGcmCipher';
import { StreamingCipher } from '../cipher/StreamingCipher';
import {
  CRYPTO_ALGORITHMS,
  SECURITY_CONFIG,
  SecurityErrorCode,
} from '../constants/securityConstants';
import { KeyExchange } from '../key/KeyExchange';
import { KeyManager } from '../key/KeyManager';
import { ReplayProtector } from '../replay/ReplayProtector';
import type {
  EcdhKeyPair,
  EncryptedChunk,
  EncryptedPayload,
  KeyExchangeResult,
  SecuritySessionContext,
} from '../types/securityTypes';
import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  generateRandomBytes,
  hexToBytes,
  timingSafeEqual,
  wipeBuffer,
} from '../utils/securityUtils';

export class SecurityEngine {
  private static instance: SecurityEngine | null = null;
  private readonly sessionContexts: Map<number, SecuritySessionContext> = new Map();
  private readonly replayProtectors: Map<number, ReplayProtector> = new Map();

  public static getInstance(): SecurityEngine {
    if (!SecurityEngine.instance) {
      SecurityEngine.instance = new SecurityEngine();
    }
    return SecurityEngine.instance;
  }

  // =========================================================================
  // Key Management & Exchange
  // =========================================================================

  public async generateKey(): Promise<CryptoKey> {
    return await KeyManager.generateKey();
  }

  public generateRawKey(): Uint8Array {
    return KeyManager.generateRawKey();
  }

  public async importRawKey(rawKey: Uint8Array): Promise<CryptoKey> {
    return await KeyManager.importRawKey(rawKey);
  }

  public async exportRawKey(key: CryptoKey): Promise<Uint8Array> {
    return await KeyManager.exportRawKey(key);
  }

  public async createKeyExchangePair(): Promise<EcdhKeyPair> {
    return await KeyExchange.generateKeyPair();
  }

  public async establishSessionKey(
    myPrivateKey: CryptoKey,
    peerPublicKeyRaw: Uint8Array,
    salt?: Uint8Array,
    info?: string,
  ): Promise<KeyExchangeResult> {
    return await KeyExchange.establishSessionKey(myPrivateKey, peerPublicKeyRaw, salt, info);
  }

  public registerSession(sessionId: number, sessionKey: CryptoKey, salt: Uint8Array): void {
    this.sessionContexts.set(sessionId, {
      sessionId,
      sessionKey,
      salt,
      createdAtMs: Date.now(),
    });
    this.replayProtectors.set(sessionId, new ReplayProtector());
  }

  public getSession(sessionId: number): SecuritySessionContext | null {
    return this.sessionContexts.get(sessionId) ?? null;
  }

  public clearSession(sessionId: number): void {
    this.sessionContexts.delete(sessionId);
    const protector = this.replayProtectors.get(sessionId);
    if (protector) {
      protector.reset();
      this.replayProtectors.delete(sessionId);
    }
  }

  // =========================================================================
  // Authenticated Encryption & Decryption
  // =========================================================================

  public async encrypt(
    plaintext: Uint8Array,
    key: CryptoKey,
    aad?: Uint8Array,
    customIv?: Uint8Array,
  ): Promise<EncryptedPayload> {
    return await AesGcmCipher.encrypt(plaintext, key, aad, customIv);
  }

  public async decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<Uint8Array> {
    return await AesGcmCipher.decrypt(payload, key);
  }

  public packPayload(payload: EncryptedPayload): Uint8Array {
    return AesGcmCipher.pack(payload);
  }

  public unpackPayload(packed: Uint8Array, aad?: Uint8Array): EncryptedPayload {
    return AesGcmCipher.unpack(packed, aad);
  }

  // =========================================================================
  // Streaming Chunk Encryption
  // =========================================================================

  public async encryptChunk(
    chunkData: Uint8Array,
    key: CryptoKey,
    chunkIndex: number,
    totalChunks: number,
    isFinal: boolean,
    sessionId = 0,
  ): Promise<EncryptedChunk> {
    return await StreamingCipher.encryptChunk(
      chunkData,
      key,
      chunkIndex,
      totalChunks,
      isFinal,
      sessionId,
    );
  }

  public async decryptChunk(
    chunk: EncryptedChunk,
    key: CryptoKey,
    totalChunks: number,
    sessionId = 0,
  ): Promise<Uint8Array> {
    return await StreamingCipher.decryptChunk(chunk, key, totalChunks, sessionId);
  }

  // =========================================================================
  // Replay Protection
  // =========================================================================

  public verifyReplay(sessionId: number, sequenceNumber: number): boolean {
    let protector = this.replayProtectors.get(sessionId);
    if (!protector) {
      protector = new ReplayProtector();
      this.replayProtectors.set(sessionId, protector);
    }
    return protector.update(sequenceNumber);
  }

  public createReplayProtector(
    windowSize: number = SECURITY_CONFIG.DEFAULT_REPLAY_WINDOW_SIZE,
  ): ReplayProtector {
    return new ReplayProtector(windowSize);
  }

  // =========================================================================
  // Utilities
  // =========================================================================

  public timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
    return timingSafeEqual(a, b);
  }

  public wipeBuffer(buffer: Uint8Array): void {
    wipeBuffer(buffer);
  }

  public generateRandomBytes(length: number): Uint8Array {
    return generateRandomBytes(length);
  }

  public bytesToHex(bytes: Uint8Array): string {
    return bytesToHex(bytes);
  }

  public hexToBytes(hex: string): Uint8Array {
    return hexToBytes(hex);
  }

  public bytesToBase64(bytes: Uint8Array): string {
    return bytesToBase64(bytes);
  }

  public base64ToBytes(base64: string): Uint8Array {
    return base64ToBytes(base64);
  }
}

export const securityEngine = SecurityEngine.getInstance();
export {
  AesGcmCipher,
  CRYPTO_ALGORITHMS,
  KeyExchange,
  KeyManager,
  ReplayProtector,
  SECURITY_CONFIG,
  SecurityErrorCode,
  StreamingCipher,
};
