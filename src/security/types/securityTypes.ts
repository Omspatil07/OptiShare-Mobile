/**
 * OptiShare Security & Encryption Types
 */

import type { SecurityErrorCode } from '../constants/securityConstants';

export interface EncryptedPayload {
  readonly ciphertext: Uint8Array;
  readonly iv: Uint8Array;
  readonly tag?: Uint8Array | undefined;
  readonly aad?: Uint8Array | undefined;
}

export interface EcdhKeyPair {
  readonly publicKeyRaw: Uint8Array;
  readonly publicKeyHex: string;
  readonly privateKey: CryptoKey;
  readonly publicKey: CryptoKey;
}

export interface KeyExchangeResult {
  readonly sharedSecret: Uint8Array;
  readonly sessionKey: CryptoKey;
  readonly sessionKeyRaw: Uint8Array;
}

export interface StreamingChunkMetadata {
  readonly chunkIndex: number;
  readonly totalChunks: number;
  readonly isFinal: boolean;
  readonly iv: Uint8Array;
}

export interface EncryptedChunk {
  readonly chunkIndex: number;
  readonly ciphertext: Uint8Array;
  readonly iv: Uint8Array;
  readonly isFinal: boolean;
}

export interface SecuritySessionContext {
  readonly sessionId: number;
  readonly sessionKey: CryptoKey;
  readonly salt: Uint8Array;
  readonly createdAtMs: number;
}

export interface ISecurityErrorDetails {
  readonly code: SecurityErrorCode;
  readonly message: string;
  readonly cause?: unknown | undefined;
}
