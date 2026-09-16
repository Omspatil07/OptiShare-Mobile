/* eslint-disable no-bitwise */
/**
 * OptiShare Streaming Authenticated Cipher
 *
 * Implements chunk-level AES-256-GCM authenticated encryption for large files.
 * Cryptographically binds chunk indices, total chunks, finality flags, and session IDs
 * into the GCM Authenticated Associated Data (AAD) to prevent chunk reordering,
 * truncation, substitution, and cross-session replay attacks.
 */

import { AesGcmCipher } from './AesGcmCipher';
import { SecurityErrorCode } from '../constants/securityConstants';
import type { EncryptedChunk } from '../types/securityTypes';

export class StreamingCipher {
  /**
   * Constructs an Authenticated Associated Data (AAD) buffer for a specific chunk.
   *
   * Layout:
   * [0..3]  Session ID (uint32)
   * [4..7]  Chunk Index (uint32)
   * [8..11] Total Chunks (uint32)
   * [12]    isFinal flag (uint8: 1 or 0)
   */
  public static buildChunkAad(
    chunkIndex: number,
    totalChunks: number,
    isFinal: boolean,
    sessionId = 0,
  ): Uint8Array {
    const aad = new Uint8Array(13);
    const view = new DataView(aad.buffer, aad.byteOffset, aad.byteLength);

    view.setUint32(0, sessionId >>> 0, false);
    view.setUint32(4, chunkIndex >>> 0, false);
    view.setUint32(8, totalChunks >>> 0, false);
    view.setUint8(12, isFinal ? 1 : 0);

    return aad;
  }

  /**
   * Encrypts a single streaming chunk with AAD binding.
   */
  public static async encryptChunk(
    chunkData: Uint8Array,
    key: CryptoKey,
    chunkIndex: number,
    totalChunks: number,
    isFinal: boolean,
    sessionId = 0,
  ): Promise<EncryptedChunk> {
    const aad = this.buildChunkAad(chunkIndex, totalChunks, isFinal, sessionId);
    const encrypted = await AesGcmCipher.encrypt(chunkData, key, aad);

    return {
      chunkIndex,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      isFinal,
    };
  }

  /**
   * Decrypts and authenticates a single streaming chunk against its expected AAD.
   * Throws if chunk index, total chunks, or data has been modified.
   */
  public static async decryptChunk(
    chunk: EncryptedChunk,
    key: CryptoKey,
    totalChunks: number,
    sessionId = 0,
  ): Promise<Uint8Array> {
    const aad = this.buildChunkAad(chunk.chunkIndex, totalChunks, chunk.isFinal, sessionId);

    try {
      return await AesGcmCipher.decrypt(
        {
          ciphertext: chunk.ciphertext,
          iv: chunk.iv,
          aad,
        },
        key,
      );
    } catch {
      throw new Error(
        `Streaming chunk ${chunk.chunkIndex} failed authentication: data or sequence tampered (${SecurityErrorCode.AUTHENTICATION_FAILED})`,
      );
    }
  }

  /**
   * Encrypts an array of contiguous file chunks sequentially.
   */
  public static async encryptStream(
    chunks: Uint8Array[],
    key: CryptoKey,
    sessionId = 0,
  ): Promise<EncryptedChunk[]> {
    const total = chunks.length;
    const encrypted: EncryptedChunk[] = new Array(total);

    for (let i = 0; i < total; i++) {
      const isFinal = i === total - 1;
      encrypted[i] = await this.encryptChunk(chunks[i]!, key, i, total, isFinal, sessionId);
    }

    return encrypted;
  }

  /**
   * Decrypts an array of encrypted chunks and verifies ordering and completeness.
   */
  public static async decryptStream(
    encryptedChunks: EncryptedChunk[],
    key: CryptoKey,
    sessionId = 0,
  ): Promise<Uint8Array[]> {
    const total = encryptedChunks.length;
    const decrypted: Uint8Array[] = new Array(total);

    for (let i = 0; i < total; i++) {
      const chunk = encryptedChunks[i]!;
      if (chunk.chunkIndex !== i) {
        throw new Error(
          `Chunk out of order: expected index ${i}, got ${chunk.chunkIndex} (${SecurityErrorCode.TAMPERED_DATA})`,
        );
      }
      decrypted[i] = await this.decryptChunk(chunk, key, total, sessionId);
    }

    return decrypted;
  }
}
