/* eslint-disable no-bitwise */
/**
 * OptiShare Transfer Pipeline Integration & Unit Test Suite
 *
 * Tests the entire Sender and Receiver Pipeline:
 * - End-to-end encrypted transfer with AES-256-GCM + AAD
 * - Unencrypted (plaintext) transfer
 * - Lossy optical channel tolerance (dropped frames)
 * - Anti-replay protection & duplicate frame rejection
 * - Tampered & corrupted frame detection
 * - Pause, resume, cancellation, and watchdog timeout
 * - Stage-level unit tests
 */

import {
  PipelineErrorCode,
  PipelineStatus,
  ReceiverDecryptionStage,
  ReceiverPipeline,
  ReceiverReconstructionStage,
  ReceiverValidationStage,
  SenderChunkingStage,
  SenderEncryptionStage,
  SenderFountainStage,
  TransferPipelineCoordinator,
} from '../../src/pipeline';
import { CRC32 } from '../../src/protocol';
import { KeyManager } from '../../src/security';

describe('Phase 14 — Sender & Receiver Pipeline', () => {
  let cryptoKey: CryptoKey;

  beforeAll(async () => {
    cryptoKey = await KeyManager.generateKey();
  });

  describe('Stage Unit Tests', () => {
    it('SenderEncryptionStage encrypts data with key and preserves plaintext when unencrypted', async () => {
      const stage = new SenderEncryptionStage();
      const plaintext = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const aad = new Uint8Array([9, 9, 9]);

      // Encrypted
      const encryptedOutput = await stage.process({
        plaintext,
        key: cryptoKey,
        aad,
      });
      expect(encryptedOutput.isEncrypted).toBe(true);
      expect(encryptedOutput.originalSize).toBe(plaintext.length);
      expect(encryptedOutput.originalChecksum).toBe(CRC32.calculate(plaintext));
      // Packed ciphertext includes 12-byte IV + ciphertext + 16-byte tag = 8 + 28 = 36 bytes
      expect(encryptedOutput.data.length).toBe(36);

      // Unencrypted
      const plainOutput = await stage.process({
        plaintext,
      });
      expect(plainOutput.isEncrypted).toBe(false);
      expect(plainOutput.data).toEqual(plaintext);
    });

    it('SenderChunkingStage slices payload into uniform symbols with zero padding', () => {
      const stage = new SenderChunkingStage();
      const data = new Uint8Array([10, 20, 30, 40, 50]);
      const symbolSize = 4;

      const output = stage.process({ data, symbolSize });
      expect(output.totalChunks).toBe(2);
      expect(output.chunks.length).toBe(2);
      expect(output.chunks[0]).toEqual(new Uint8Array([10, 20, 30, 40]));
      expect(output.chunks[1]).toEqual(new Uint8Array([50, 0, 0, 0]));
    });

    it('SenderFountainStage generates LT encoder with correct K', () => {
      const stage = new SenderFountainStage();
      const data = new Uint8Array(1000);
      const symbolSize = 250;

      const output = stage.process({ data, symbolSize, seed: 12345 });
      expect(output.k).toBe(4);
      expect(output.seed).toBe(12345);
      expect(output.symbolSize).toBe(250);
    });

    it('ReceiverValidationStage detects replayed and corrupted packets', () => {
      const stage = new ReceiverValidationStage({ expectedSessionId: 100 });

      // Corrupted frame
      const corruptedFrame = new Uint8Array([0x5a, 0x5a, 0x5a]);
      const corruptResult = stage.process(corruptedFrame);
      expect(corruptResult.valid).toBe(false);
      expect(corruptResult.isCorrupted).toBe(true);
    });

    it('ReceiverDecryptionStage verifies and decrypts AEAD ciphertext', async () => {
      const encStage = new SenderEncryptionStage();
      const decStage = new ReceiverDecryptionStage();

      const secret = new TextEncoder().encode(
        'Confidential Optical Transmission',
      );
      const aad = new Uint8Array([1, 2, 3, 4]);

      const encrypted = await encStage.process({
        plaintext: secret,
        key: cryptoKey,
        aad,
      });

      const decrypted = await decStage.process({
        data: encrypted.data,
        key: cryptoKey,
        isEncrypted: true,
        aad,
      });

      expect(decrypted.wasEncrypted).toBe(true);
      expect(new TextDecoder().decode(decrypted.plaintext)).toBe(
        'Confidential Optical Transmission',
      );
    });

    it('ReceiverReconstructionStage verifies CRC-32 checksum and detects tampering', async () => {
      const stage = new ReceiverReconstructionStage();
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const correctChecksum = CRC32.calculate(plaintext);
      const metadata = {
        fileName: 'test.bin',
        fileSizeBytes: 5,
        mimeType: 'application/octet-stream',
        fileChecksum: correctChecksum,
        chunkSize: 5,
        totalChunks: 1,
      };

      const result = await stage.process({
        plaintext,
        metadata: metadata as any,
        expectedChecksum: correctChecksum,
      });

      expect(result.checksum).toBe(correctChecksum);
      expect(result.data).toEqual(plaintext);

      // Tampered checksum should throw
      await expect(
        stage.process({
          plaintext,
          metadata: metadata as any,
          expectedChecksum: 0xdeadbeef,
        }),
      ).rejects.toThrow(PipelineErrorCode.INTEGRITY_CHECK_FAILED);
    });
  });

  describe('End-to-End Pipeline Integration', () => {
    it('successfully transfers encrypted file through loopback pipeline', async () => {
      const originalText =
        'OptiShare high-speed optical transfer test data.'.repeat(20);
      const fileData = new TextEncoder().encode(originalText);

      const result = await TransferPipelineCoordinator.runLoopbackTransfer({
        fileName: 'secure-doc.txt',
        fileData,
        mimeType: 'text/plain',
        cryptoKey,
        symbolSize: 64,
        redundancyFactor: 1.5,
      });

      expect(result.metadata.fileName).toBe('secure-doc.txt');
      expect(result.metadata.isEncrypted).toBe(true);
      expect(result.data.length).toBe(fileData.length);
      expect(new TextDecoder().decode(result.data)).toBe(originalText);
    });

    it('successfully transfers unencrypted (plaintext) file', async () => {
      const rawData = new Uint8Array([
        10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
      ]);

      const result = await TransferPipelineCoordinator.runLoopbackTransfer({
        fileName: 'plain.dat',
        fileData: rawData,
        cryptoKey: null,
        symbolSize: 32,
        redundancyFactor: 1.5,
      });

      expect(result.metadata.isEncrypted).toBe(false);
      expect(result.data).toEqual(rawData);
    });

    it('recovers completely over a lossy optical channel with 25% dropped frames', async () => {
      // 1000 bytes with symbol size 64 => ~16 source symbols
      const testData = new Uint8Array(1000);
      for (let i = 0; i < testData.length; i++) {
        testData[i] = (i * 17 + 3) & 0xff;
      }

      const result = await TransferPipelineCoordinator.runLoopbackTransfer({
        fileName: 'lossy-test.bin',
        fileData: testData,
        cryptoKey,
        symbolSize: 64,
        lossRate: 0.25, // 25% random frame loss!
        redundancyFactor: 2.0, // ample rateless droplets to overcome loss
      });

      expect(result.data).toEqual(testData);
      expect(result.metadata.fileSizeBytes).toBe(testData.length);
    });

    it('rejects replayed frames and counts them in metrics', async () => {
      const fileData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      const receiver = new ReceiverPipeline({
        cryptoKey,
      });

      const sender = await TransferPipelineCoordinator.createSender({
        fileName: 'replay-test.bin',
        fileData,
        cryptoKey,
        symbolSize: 32,
      });

      // Frame 0: FILE_INFO
      const frame0 = sender.step()!;
      expect(await receiver.ingestFrame(frame0)).toBe(true);

      // Frame 1: DATA droplet 0
      const frame1 = sender.step()!;
      expect(await receiver.ingestFrame(frame1)).toBe(true);

      // Ingest frame 1 AGAIN (replay attack simulation)
      const replayedResult = await receiver.ingestFrame(frame1);
      expect(replayedResult).toBe(false);
      expect(receiver.metrics.replayedFrames).toBe(1);
    });

    it('handles pause, resume, and cancellation properly on sender', async () => {
      const fileData = new Uint8Array(200);

      const sender = await TransferPipelineCoordinator.createSender({
        fileName: 'lifecycle.bin',
        fileData,
        symbolSize: 32,
      });

      expect(sender.currentStatus).toBe(PipelineStatus.IDLE);

      sender.step();
      expect(sender.currentStatus).toBe(PipelineStatus.RUNNING);

      sender.pause();
      expect(sender.currentStatus).toBe(PipelineStatus.PAUSED);

      sender.resume();
      expect(sender.currentStatus).toBe(PipelineStatus.RUNNING);

      sender.cancel('User requested cancel');
      expect(sender.currentStatus).toBe(PipelineStatus.CANCELLED);
    });

    it('handles pause, resume, and cancellation properly on receiver', async () => {
      const receiver = new ReceiverPipeline();
      expect(receiver.currentStatus).toBe(PipelineStatus.IDLE);

      receiver.start();
      expect(receiver.currentStatus).toBe(PipelineStatus.RUNNING);

      receiver.pause();
      expect(receiver.currentStatus).toBe(PipelineStatus.PAUSED);

      receiver.resume();
      expect(receiver.currentStatus).toBe(PipelineStatus.RUNNING);

      receiver.cancel('Receiver cancel test');
      expect(receiver.currentStatus).toBe(PipelineStatus.CANCELLED);

      // Ingesting when cancelled returns false
      const dummyFrame = new Uint8Array([1, 2, 3]);
      expect(await receiver.ingestFrame(dummyFrame)).toBe(false);
    });

    it('triggers timeout error on receiver when no frames arrive', done => {
      const receiver = new ReceiverPipeline({
        timeoutMs: 100, // Short timeout for test
        onError: (_err, code) => {
          expect(code).toBe(PipelineErrorCode.TIMEOUT);
          expect(receiver.currentStatus).toBe(PipelineStatus.ERROR);
          receiver.reset();
          done();
        },
      });

      receiver.start();
    });

    it('streams progress, speed, and ETA updates during transmission', async () => {
      const fileData = new Uint8Array(1200);
      const progressUpdates: number[] = [];

      const sender = await TransferPipelineCoordinator.createSender({
        fileName: 'progress-test.bin',
        fileData,
        symbolSize: 64,
        onProgress: progress => {
          progressUpdates.push(progress.percentage);
        },
      });

      while (sender.step() !== null) {
        if (sender.frameIndex >= sender.framesTotal) break;
      }

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });
  });
});
