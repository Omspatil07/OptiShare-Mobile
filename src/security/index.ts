/**
 * OptiShare Security & Encryption — Public API
 */

// Constants
export {
  CRYPTO_ALGORITHMS,
  SECURITY_CONFIG,
  SecurityErrorCode,
} from './constants/securityConstants';

// Types
export type {
  EcdhKeyPair,
  EncryptedChunk,
  EncryptedPayload,
  ISecurityErrorDetails,
  KeyExchangeResult,
  SecuritySessionContext,
  StreamingChunkMetadata,
} from './types/securityTypes';

// Utilities
export {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  generateRandomBytes,
  hexToBytes,
  timingSafeEqual,
  wipeBuffer,
} from './utils/securityUtils';

// Replay Protection
export { ReplayProtector } from './replay/ReplayProtector';

// Key Management & Key Exchange
export { KeyExchange } from './key/KeyExchange';
export { KeyManager } from './key/KeyManager';

// Authenticated Ciphers
export { AesGcmCipher } from './cipher/AesGcmCipher';
export { StreamingCipher } from './cipher/StreamingCipher';

// High-Level Core Facade
export { SecurityEngine, securityEngine } from './core/SecurityEngine';
