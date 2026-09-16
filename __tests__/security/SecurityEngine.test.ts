/* eslint-disable no-bitwise */
/**
 * OptiShare Security Engine Test Suite
 *
 * Comprehensive unit and security tests covering AES-256-GCM AEAD encryption,
 * authentication tag verification, bit-flip tamper detection, AAD binding,
 * ECDH P-256 key agreement, HKDF key derivation, sliding-window replay protection,
 * streaming chunk encryption, and memory zeroization.
 */

import {
  AesGcmCipher,
  KeyExchange,
  KeyManager,
  ReplayProtector,
  SECURITY_CONFIG,
  StreamingCipher,
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  hexToBytes,
  securityEngine,
  timingSafeEqual,
  wipeBuffer,
} from '../../src/security';

describe('Security Engine — Phase 13', () => {
  // =========================================================================
  // 1. AES-256-GCM Authenticated Encryption
  // =========================================================================
  describe('AES-256-GCM AEAD Cipher', () => {
    it('should encrypt and decrypt plaintext data successfully', async () => {
      const key = await KeyManager.generateKey();
      const plaintext = new TextEncoder().encode('Confidential Optical Payload 2026');

      const encrypted = await AesGcmCipher.encrypt(plaintext, key);
      expect(encrypted.ciphertext.length).toBe(
        plaintext.length + SECURITY_CONFIG.GCM_TAG_SIZE_BYTES,
      );
      expect(encrypted.iv.length).toBe(SECURITY_CONFIG.GCM_IV_SIZE_BYTES);

      const decrypted = await AesGcmCipher.decrypt(encrypted, key);
      expect(decrypted).toEqual(plaintext);
      expect(new TextDecoder().decode(decrypted)).toBe('Confidential Optical Payload 2026');
    });

    it('should generate distinct random IVs for subsequent encryptions', async () => {
      const key = await KeyManager.generateKey();
      const plaintext = new Uint8Array([1, 2, 3, 4]);

      const enc1 = await AesGcmCipher.encrypt(plaintext, key);
      const enc2 = await AesGcmCipher.encrypt(plaintext, key);

      expect(timingSafeEqual(enc1.iv, enc2.iv)).toBe(false);
      expect(timingSafeEqual(enc1.ciphertext, enc2.ciphertext)).toBe(false);
    });

    it('should pack and unpack IV and ciphertext contiguously', async () => {
      const key = await KeyManager.generateKey();
      const plaintext = new Uint8Array([10, 20, 30, 40, 50]);

      const encrypted = await AesGcmCipher.encrypt(plaintext, key);
      const packed = AesGcmCipher.pack(encrypted);

      expect(packed.length).toBe(
        SECURITY_CONFIG.GCM_IV_SIZE_BYTES +
          plaintext.length +
          SECURITY_CONFIG.GCM_TAG_SIZE_BYTES,
      );

      const unpacked = AesGcmCipher.unpack(packed);
      expect(unpacked.iv).toEqual(encrypted.iv);
      expect(unpacked.ciphertext).toEqual(encrypted.ciphertext);

      const decrypted = await AesGcmCipher.decrypt(unpacked, key);
      expect(decrypted).toEqual(plaintext);
    });
  });

  // =========================================================================
  // 2. Tamper Detection & Authentication Tag Verification
  // =========================================================================
  describe('Tamper Detection & Integrity Verification', () => {
    it('should fail decryption if a single bit of ciphertext is flipped', async () => {
      const key = await KeyManager.generateKey();
      const plaintext = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]);
      const encrypted = await AesGcmCipher.encrypt(plaintext, key);

      // Tamper with first byte of ciphertext
      const tamperedCiphertext = new Uint8Array(encrypted.ciphertext);
      tamperedCiphertext[0] = (tamperedCiphertext[0] ?? 0) ^ 0x01;

      await expect(
        AesGcmCipher.decrypt(
          {
            ciphertext: tamperedCiphertext,
            iv: encrypted.iv,
          },
          key,
        ),
      ).rejects.toThrow(/authentication tag verification failed/i);
    });

    it('should fail decryption if a single bit of the authentication tag is flipped', async () => {
      const key = await KeyManager.generateKey();
      const plaintext = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const encrypted = await AesGcmCipher.encrypt(plaintext, key);

      // Tamper with the trailing byte (inside 16-byte GCM tag)
      const tamperedCiphertext = new Uint8Array(encrypted.ciphertext);
      const lastIndex = tamperedCiphertext.length - 1;
      tamperedCiphertext[lastIndex] = (tamperedCiphertext[lastIndex] ?? 0) ^ 0x80;

      await expect(
        AesGcmCipher.decrypt(
          {
            ciphertext: tamperedCiphertext,
            iv: encrypted.iv,
          },
          key,
        ),
      ).rejects.toThrow(/authentication tag verification failed/i);
    });

    it('should fail decryption if the IV is modified', async () => {
      const key = await KeyManager.generateKey();
      const plaintext = new TextEncoder().encode('Hello Tamper');
      const encrypted = await AesGcmCipher.encrypt(plaintext, key);

      const tamperedIv = new Uint8Array(encrypted.iv);
      tamperedIv[0] = (tamperedIv[0] ?? 0) ^ 0x01;

      await expect(
        AesGcmCipher.decrypt(
          {
            ciphertext: encrypted.ciphertext,
            iv: tamperedIv,
          },
          key,
        ),
      ).rejects.toThrow(/authentication tag verification failed/i);
    });
  });

  // =========================================================================
  // 3. Authenticated Additional Data (AAD)
  // =========================================================================
  describe('Authenticated Additional Data (AAD) Binding', () => {
    it('should bind header metadata into the authentication tag', async () => {
      const key = await KeyManager.generateKey();
      const plaintext = new TextEncoder().encode('Payload with authenticated header');
      const aad = new TextEncoder().encode('SessionId:0x12345678,Seq:42');

      const encrypted = await AesGcmCipher.encrypt(plaintext, key, aad);

      // Decrypting with identical AAD succeeds
      const decrypted = await AesGcmCipher.decrypt(encrypted, key);
      expect(decrypted).toEqual(plaintext);
    });

    it('should fail decryption if AAD is altered', async () => {
      const key = await KeyManager.generateKey();
      const plaintext = new TextEncoder().encode('Sensitive Payload');
      const validAad = new TextEncoder().encode('SessionId:0x12345678');
      const forgedAad = new TextEncoder().encode('SessionId:0x99999999');

      const encrypted = await AesGcmCipher.encrypt(plaintext, key, validAad);

      // Attempting to decrypt with forged AAD must fail
      await expect(
        AesGcmCipher.decrypt(
          {
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            aad: forgedAad,
          },
          key,
        ),
      ).rejects.toThrow(/authentication tag verification failed/i);
    });
  });

  // =========================================================================
  // 4. ECDH P-256 Key Exchange
  // =========================================================================
  describe('ECDH P-256 Key Agreement & Key Derivation', () => {
    it('should establish identical shared secrets between Alice and Bob', async () => {
      // 1. Alice and Bob generate ephemeral keypairs
      const aliceKeyPair = await KeyExchange.generateKeyPair();
      const bobKeyPair = await KeyExchange.generateKeyPair();

      // Verify uncompressed EC point format (65 bytes starting with 0x04)
      expect(aliceKeyPair.publicKeyRaw.length).toBe(65);
      expect(aliceKeyPair.publicKeyRaw[0]).toBe(0x04);
      expect(bobKeyPair.publicKeyRaw.length).toBe(65);
      expect(bobKeyPair.publicKeyRaw[0]).toBe(0x04);

      // 2. Compute shared secrets
      const aliceSecret = await KeyExchange.computeSharedSecret(
        aliceKeyPair.privateKey,
        bobKeyPair.publicKeyRaw,
      );
      const bobSecret = await KeyExchange.computeSharedSecret(
        bobKeyPair.privateKey,
        aliceKeyPair.publicKeyRaw,
      );

      expect(aliceSecret.length).toBe(32);
      expect(bobSecret.length).toBe(32);
      expect(timingSafeEqual(aliceSecret, bobSecret)).toBe(true);
    });

    it('should establish matching AES-256 session keys for end-to-end communication', async () => {
      const aliceKeyPair = await KeyExchange.generateKeyPair();
      const bobKeyPair = await KeyExchange.generateKeyPair();

      const commonSalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const sessionInfo = 'OptiShare-Transfer-999';

      const aliceResult = await KeyExchange.establishSessionKey(
        aliceKeyPair.privateKey,
        bobKeyPair.publicKeyRaw,
        commonSalt,
        sessionInfo,
      );

      const bobResult = await KeyExchange.establishSessionKey(
        bobKeyPair.privateKey,
        aliceKeyPair.publicKeyRaw,
        commonSalt,
        sessionInfo,
      );

      expect(timingSafeEqual(aliceResult.sessionKeyRaw, bobResult.sessionKeyRaw)).toBe(true);

      // Alice encrypts message, Bob decrypts it
      const message = new TextEncoder().encode('Secure message over optical channel');
      const encrypted = await AesGcmCipher.encrypt(message, aliceResult.sessionKey);
      const decrypted = await AesGcmCipher.decrypt(encrypted, bobResult.sessionKey);

      expect(new TextDecoder().decode(decrypted)).toBe('Secure message over optical channel');
    });
  });

  // =========================================================================
  // 5. HKDF Key Derivation
  // =========================================================================
  describe('HKDF Key Derivation', () => {
    it('should derive distinct keys for different context strings (domain separation)', async () => {
      const masterSecret = new Uint8Array(32).fill(0x55);
      const salt = new Uint8Array(16).fill(0x11);

      const key1 = await KeyManager.deriveSessionKey(masterSecret, salt, 'Context-A');
      const key2 = await KeyManager.deriveSessionKey(masterSecret, salt, 'Context-B');

      expect(timingSafeEqual(key1.sessionKeyRaw, key2.sessionKeyRaw)).toBe(false);
    });
  });

  // =========================================================================
  // 6. Sliding-Window Replay Protection
  // =========================================================================
  describe('ReplayProtector', () => {
    it('should accept sequential in-order packets', () => {
      const protector = new ReplayProtector(100);

      expect(protector.update(0)).toBe(true);
      expect(protector.update(1)).toBe(true);
      expect(protector.update(2)).toBe(true);
      expect(protector.highestSequenceSeen).toBe(2);
      expect(protector.acceptedPacketsCount).toBe(3);
      expect(protector.replayedPacketsCount).toBe(0);
    });

    it('should accept out-of-order packets within sliding window', () => {
      const protector = new ReplayProtector(100);

      expect(protector.update(10)).toBe(true);
      expect(protector.update(5)).toBe(true);
      expect(protector.update(8)).toBe(true);
      expect(protector.update(3)).toBe(true);
      expect(protector.acceptedPacketsCount).toBe(4);
      expect(protector.replayedPacketsCount).toBe(0);
    });

    it('should reject replayed/duplicate packets', () => {
      const protector = new ReplayProtector(100);

      expect(protector.update(5)).toBe(true);
      expect(protector.update(5)).toBe(false); // replay!
      expect(protector.replayedPacketsCount).toBe(1);
    });

    it('should reject stale packets older than the sliding window cutoff', () => {
      const protector = new ReplayProtector(10); // small window for testing

      expect(protector.update(0)).toBe(true);
      expect(protector.update(15)).toBe(true); // advances window: cutoff is 15 - 10 = 5

      // Packet 2 is < cutoff (5) -> stale, rejected!
      expect(protector.update(2)).toBe(false);
      // Packet 12 is within [6 .. 15] -> accepted
      expect(protector.update(12)).toBe(true);
    });

    it('should reset state cleanly', () => {
      const protector = new ReplayProtector(50);
      protector.update(10);
      protector.update(10); // replay

      protector.reset();
      expect(protector.highestSequenceSeen).toBe(-1);
      expect(protector.acceptedPacketsCount).toBe(0);
      expect(protector.replayedPacketsCount).toBe(0);

      // Now sequence 10 is accepted fresh again
      expect(protector.update(10)).toBe(true);
    });
  });

  // =========================================================================
  // 7. Streaming Chunk Encryption
  // =========================================================================
  describe('StreamingCipher for Large Files', () => {
    it('should encrypt and decrypt a stream of chunks in order', async () => {
      const key = await KeyManager.generateKey();
      const chunk1 = new Uint8Array([1, 2, 3]);
      const chunk2 = new Uint8Array([4, 5, 6]);
      const chunk3 = new Uint8Array([7, 8, 9]);
      const chunks = [chunk1, chunk2, chunk3];

      const encrypted = await StreamingCipher.encryptStream(chunks, key, 0x1234);
      expect(encrypted.length).toBe(3);
      expect(encrypted[0]?.isFinal).toBe(false);
      expect(encrypted[1]?.isFinal).toBe(false);
      expect(encrypted[2]?.isFinal).toBe(true);

      const decrypted = await StreamingCipher.decryptStream(encrypted, key, 0x1234);
      expect(decrypted.length).toBe(3);
      expect(decrypted[0]).toEqual(chunk1);
      expect(decrypted[1]).toEqual(chunk2);
      expect(decrypted[2]).toEqual(chunk3);
    });

    it('should reject swapped/reordered chunks due to AAD mismatch', async () => {
      const key = await KeyManager.generateKey();
      const chunk0 = new Uint8Array([1, 1]);
      const chunk1 = new Uint8Array([2, 2]);

      const enc0 = await StreamingCipher.encryptChunk(chunk0, key, 0, 2, false, 1);
      await StreamingCipher.encryptChunk(chunk1, key, 1, 2, true, 1);

      // Attempting to decrypt chunk 0 under expected index 1 fails AAD check
      await expect(
        StreamingCipher.decryptChunk(
          {
            chunkIndex: 1, // swapped index
            ciphertext: enc0.ciphertext,
            iv: enc0.iv,
            isFinal: false,
          },
          key,
          2,
          1,
        ),
      ).rejects.toThrow(/authentication/i);
    });

    it('should reject chunks from a different session ID', async () => {
      const key = await KeyManager.generateKey();
      const chunk = new Uint8Array([9, 9]);
      const enc = await StreamingCipher.encryptChunk(chunk, key, 0, 1, true, 0xaaaa);

      // Attempt decrypt under session 0xbbbb
      await expect(StreamingCipher.decryptChunk(enc, key, 1, 0xbbbb)).rejects.toThrow(
        /authentication/i,
      );
    });
  });

  // =========================================================================
  // 8. Utilities & Sanitization
  // =========================================================================
  describe('Security Utilities', () => {
    it('should wipe memory buffer with zeroes', () => {
      const buffer = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      wipeBuffer(buffer);
      expect(buffer).toEqual(new Uint8Array([0, 0, 0, 0]));
    });

    it('should perform constant-time comparison accurately', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 4]);
      const c = new Uint8Array([1, 2, 3, 5]);
      const d = new Uint8Array([1, 2, 3]);

      expect(timingSafeEqual(a, b)).toBe(true);
      expect(timingSafeEqual(a, c)).toBe(false);
      expect(timingSafeEqual(a, d)).toBe(false);
    });

    it('should round-trip hex conversions correctly', () => {
      const original = new Uint8Array([0x00, 0x1a, 0xff, 0x42]);
      const hex = bytesToHex(original);
      expect(hex).toBe('001aff42');
      const recovered = hexToBytes(hex);
      expect(recovered).toEqual(original);
    });

    it('should round-trip base64 conversions correctly', () => {
      const original = new Uint8Array([10, 20, 30, 40, 50]);
      const b64 = bytesToBase64(original);
      const recovered = base64ToBytes(b64);
      expect(recovered).toEqual(original);
    });
  });

  // =========================================================================
  // 9. SecurityEngine Facade
  // =========================================================================
  describe('SecurityEngine Facade', () => {
    it('should manage sessions, replay checks, and full encrypt/decrypt flows', async () => {
      const key = await securityEngine.generateKey();
      const salt = securityEngine.generateRandomBytes(16);
      const sessionId = 0x55aa55aa;

      securityEngine.registerSession(sessionId, key, salt);
      expect(securityEngine.getSession(sessionId)).not.toBeNull();

      // Replay verification through facade
      expect(securityEngine.verifyReplay(sessionId, 0)).toBe(true);
      expect(securityEngine.verifyReplay(sessionId, 0)).toBe(false); // replay blocked!
      expect(securityEngine.verifyReplay(sessionId, 1)).toBe(true);

      // Cleanup
      securityEngine.clearSession(sessionId);
      expect(securityEngine.getSession(sessionId)).toBeNull();
    });
  });
});
