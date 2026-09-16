/* eslint-disable no-bitwise */
/**
 * OptiShare Optical Transfer Protocol (OTP) Unit Tests — Phase 10
 */

import {
  CancelReasonCode,
  ChunkTracker,
  CRC32,
  FileMetadata,
  HEADER_SIZE,
  MAX_PAYLOAD_SIZE,
  PacketDecoder,
  PacketEncoder,
  PacketHeader,
  PacketType,
  PROTOCOL_MAGIC,
  PROTOCOL_VERSION,
  ProtocolErrorCode,
  SessionManager,
  SessionState,
  opticalTransferProtocol,
} from '../../src/protocol';

describe('OptiShare Optical Transfer Protocol (OTP) — Phase 10', () => {
  // ─── 1. CRC-32 Checksum Tests ───────────────────────────────────────────────
  describe('CRC32 Checksum', () => {
    it('calculates correct CRC32 for empty buffer', () => {
      const empty = new Uint8Array(0);
      expect(CRC32.calculate(empty)).toBe(0);
    });

    it('calculates correct CRC32 for standard test vector "123456789"', () => {
      const data = new Uint8Array([0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39]);
      // Standard CRC-32 for "123456789" is 0xCBF43926 (3421780262)
      expect(CRC32.calculate(data)).toBe(0xcbf43926);
    });

    it('matches incremental update with single-pass calculation', () => {
      const part1 = new Uint8Array([1, 2, 3, 4, 5]);
      const part2 = new Uint8Array([6, 7, 8, 9, 10]);
      const combined = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      const singlePass = CRC32.calculate(combined);
      const crc1 = CRC32.calculate(part1);
      const crcIncremental = CRC32.update(crc1, part2);

      expect(crcIncremental).toBe(singlePass);
    });

    it('detects 1-bit corruption in payload', () => {
      const original = new Uint8Array([10, 20, 30, 40, 50, 60]);
      const corrupted = new Uint8Array([10, 20, 31, 40, 50, 60]); // 1 bit flipped

      expect(CRC32.calculate(original)).not.toBe(CRC32.calculate(corrupted));
    });
  });

  // ─── 2. PacketHeader Model Tests ─────────────────────────────────────────────
  describe('PacketHeader', () => {
    it('serializes and deserializes a 24-byte header correctly', () => {
      const header = new PacketHeader({
        magic: PROTOCOL_MAGIC,
        version: PROTOCOL_VERSION,
        packetType: PacketType.DATA,
        sessionId: 0x12345678,
        sequenceNumber: 42,
        totalSequences: 100,
        payloadLength: 256,
        reserved: 0xabcd,
        checksum: 0xdeadbeef,
      });

      const buffer = header.serialize();
      expect(buffer.length).toBe(HEADER_SIZE);

      const deserialized = PacketHeader.deserialize(buffer);
      expect(deserialized.magic).toBe(PROTOCOL_MAGIC);
      expect(deserialized.version).toBe(PROTOCOL_VERSION);
      expect(deserialized.packetType).toBe(PacketType.DATA);
      expect(deserialized.sessionId).toBe(0x12345678);
      expect(deserialized.sequenceNumber).toBe(42);
      expect(deserialized.totalSequences).toBe(100);
      expect(deserialized.payloadLength).toBe(256);
      expect(deserialized.reserved).toBe(0xabcd);
      expect(deserialized.checksum).toBe(0xdeadbeef);

      expect(deserialized.isValidMagic).toBe(true);
      expect(deserialized.isValidVersion).toBe(true);
      expect(deserialized.isValidType).toBe(true);
      expect(deserialized.isValidPayloadLength).toBe(true);
    });

    it('throws error when deserializing buffer smaller than 24 bytes', () => {
      const shortBuf = new Uint8Array(20);
      expect(() => PacketHeader.deserialize(shortBuf)).toThrow('Buffer too small for OTP header');
    });
  });

  // ─── 3. FileMetadata Model Tests ─────────────────────────────────────────────
  describe('FileMetadata', () => {
    it('serializes and deserializes file metadata correctly', () => {
      const meta = new FileMetadata({
        fileName: 'transfer_test.pdf',
        fileSizeBytes: 1048576, // 1 MB
        mimeType: 'application/pdf',
        fileChecksum: 0xaabbccdd,
        chunkSize: 512,
        totalChunks: 2048,
      });

      const serialized = meta.serialize();
      const deserialized = FileMetadata.deserialize(serialized);

      expect(deserialized.fileName).toBe('transfer_test.pdf');
      expect(deserialized.fileSizeBytes).toBe(1048576);
      expect(deserialized.mimeType).toBe('application/pdf');
      expect(deserialized.fileChecksum).toBe(0xaabbccdd);
      expect(deserialized.chunkSize).toBe(512);
      expect(deserialized.totalChunks).toBe(2048);
    });

    it('correctly calculates total chunks', () => {
      expect(FileMetadata.calculateTotalChunks(0, 256)).toBe(1);
      expect(FileMetadata.calculateTotalChunks(256, 256)).toBe(1);
      expect(FileMetadata.calculateTotalChunks(257, 256)).toBe(2);
      expect(FileMetadata.calculateTotalChunks(1000, 256)).toBe(4);
    });

    it('validates file name and chunk size constraints', () => {
      expect(
        () =>
          new FileMetadata({
            fileName: '',
            fileSizeBytes: 100,
            mimeType: 'text/plain',
            fileChecksum: 1,
            chunkSize: 256,
            totalChunks: 1,
          }),
      ).toThrow('File name cannot be empty');

      expect(
        () =>
          new FileMetadata({
            fileName: 'test.txt',
            fileSizeBytes: 100,
            mimeType: 'text/plain',
            fileChecksum: 1,
            chunkSize: 16, // < MIN_CHUNK_SIZE (32)
            totalChunks: 1,
          }),
      ).toThrow('Chunk size must be >= 32');
    });
  });

  // ─── 4. Packet Types & Codec Roundtrip ─────────────────────────────────────────
  describe('PacketEncoder and PacketDecoder', () => {
    const sessionId = 0x98765432;

    it('encodes and decodes HANDSHAKE packet', () => {
      const handshake = {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: 0x0003,
        deviceName: 'Pixel 9 Pro',
      };

      const buffer = PacketEncoder.encodeHandshake(sessionId, handshake);
      const result = PacketDecoder.decode(buffer);

      expect(result.success).toBe(true);
      expect(result.packet?.packetType).toBe(PacketType.HANDSHAKE);
      expect(result.packet?.sessionId).toBe(sessionId);
    });

    it('encodes and decodes FILE_INFO packet', () => {
      const meta = new FileMetadata({
        fileName: 'report.docx',
        fileSizeBytes: 65536,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileChecksum: 0x11223344,
        chunkSize: 256,
        totalChunks: 256,
      });

      const buffer = PacketEncoder.encodeFileInfo(sessionId, meta);
      const result = PacketDecoder.decode(buffer);

      expect(result.success).toBe(true);
      expect(result.packet?.packetType).toBe(PacketType.FILE_INFO);
      expect(result.packet?.payloadLength).toBe(buffer.length - HEADER_SIZE);
    });

    it('encodes and decodes DATA packet', () => {
      const payload = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const buffer = PacketEncoder.encodeData(sessionId, 5, 20, payload);

      const result = PacketDecoder.decode(buffer);
      expect(result.success).toBe(true);
      expect(result.packet?.packetType).toBe(PacketType.DATA);
      expect(result.packet?.sequenceNumber).toBe(5);
      expect(result.packet?.totalSequences).toBe(20);
      expect(result.packet?.payload).toEqual(payload);
    });

    it('encodes and decodes ACK packet with multiple missing ranges', () => {
      const ack = {
        lastContiguousSeq: 10,
        missingRanges: [
          [11, 15],
          [20, 25],
        ] as [number, number][],
      };

      const buffer = PacketEncoder.encodeAck(sessionId, ack);
      const result = PacketDecoder.decode(buffer);

      expect(result.success).toBe(true);
      expect(result.packet?.packetType).toBe(PacketType.ACK);
    });

    it('encodes and decodes COMPLETE packet', () => {
      const buffer = PacketEncoder.encodeComplete(sessionId, 0x12345678, 102400);
      const result = PacketDecoder.decode(buffer);

      expect(result.success).toBe(true);
      expect(result.packet?.packetType).toBe(PacketType.COMPLETE);
    });

    it('encodes and decodes CANCEL packet', () => {
      const buffer = PacketEncoder.encodeCancel(
        sessionId,
        CancelReasonCode.USER_CANCELLED,
        'User pressed stop',
      );
      const result = PacketDecoder.decode(buffer);

      expect(result.success).toBe(true);
      expect(result.packet?.packetType).toBe(PacketType.CANCEL);
    });

    it('encodes and decodes ERROR packet', () => {
      const buffer = PacketEncoder.encodeError(
        sessionId,
        ProtocolErrorCode.PAYLOAD_OVERFLOW,
        'Overflow error',
      );
      const result = PacketDecoder.decode(buffer);

      expect(result.success).toBe(true);
      expect(result.packet?.packetType).toBe(PacketType.ERROR);
    });

    it('slices a file buffer into valid DATA packet buffers', () => {
      const fileBytes = new Uint8Array(600);
      for (let i = 0; i < 600; i++) fileBytes[i] = i & 0xff;

      const packets = PacketEncoder.sliceFileIntoDataPackets(sessionId, fileBytes, 256);
      expect(packets.length).toBe(3); // 256 + 256 + 88

      for (let i = 0; i < packets.length; i++) {
        const p = packets[i];
        if (p) {
          const res = PacketDecoder.decode(p);
          expect(res.success).toBe(true);
          expect(res.packet?.sequenceNumber).toBe(i);
          expect(res.packet?.totalSequences).toBe(3);
        }
      }
    });
  });

  // ─── 5. Decoder Security & Error Rejection ──────────────────────────────────
  describe('PacketDecoder Security & Error Handling', () => {
    it('rejects packet smaller than header size', () => {
      const truncated = new Uint8Array(10);
      const res = PacketDecoder.decode(truncated);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe(ProtocolErrorCode.BUFFER_TOO_SMALL);
    });

    it('rejects packet with invalid magic bytes', () => {
      const data = PacketEncoder.encodeData(1, 0, 1, new Uint8Array([1, 2, 3]));
      data[0] = 0x00; // corrupt magic byte
      const res = PacketDecoder.decode(data);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe(ProtocolErrorCode.INVALID_MAGIC);
    });

    it('rejects packet with unsupported version', () => {
      const data = PacketEncoder.encodeData(1, 0, 1, new Uint8Array([1, 2, 3]));
      data[2] = 0x99; // invalid version
      const res = PacketDecoder.decode(data);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe(ProtocolErrorCode.VERSION_MISMATCH);
    });

    it('rejects packet with corrupted checksum (optical bit-flip)', () => {
      const data = PacketEncoder.encodeData(1, 0, 1, new Uint8Array([1, 2, 3, 4, 5]));
      data[HEADER_SIZE + 2] = 0xff; // corrupt payload byte
      const res = PacketDecoder.decode(data);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe(ProtocolErrorCode.CHECKSUM_FAILED);
    });

    it('rejects packet when payload exceeds MAX_PAYLOAD_SIZE', () => {
      expect(() => {
        const oversized = new Uint8Array(MAX_PAYLOAD_SIZE + 10);
        PacketEncoder.encodeData(1, 0, 1, oversized);
      }).toThrow('exceeds MAX_PAYLOAD_SIZE');
    });

    it('decodeOrThrow throws properly on invalid buffer', () => {
      expect(() => PacketDecoder.decodeOrThrow(new Uint8Array(4))).toThrow();
    });
  });

  // ─── 6. ChunkTracker Tests ──────────────────────────────────────────────────
  describe('ChunkTracker', () => {
    it('tracks received chunks and calculates completion percentage', () => {
      const tracker = new ChunkTracker(4);
      expect(tracker.isComplete).toBe(false);
      expect(tracker.percentComplete).toBe(0);

      expect(tracker.markReceived(0, 100)).toBe(true);
      expect(tracker.hasChunk(0)).toBe(true);
      expect(tracker.hasChunk(1)).toBe(false);
      expect(tracker.percentComplete).toBe(25);

      // Duplicate frame returns false
      expect(tracker.markReceived(0, 100)).toBe(false);
      expect(tracker.receivedCount).toBe(1);

      // Out of order reception
      expect(tracker.markReceived(2, 100)).toBe(true);
      expect(tracker.markReceived(3, 100)).toBe(true);
      expect(tracker.percentComplete).toBe(75);
      expect(tracker.isComplete).toBe(false);

      // Fill missing chunk
      expect(tracker.markReceived(1, 100)).toBe(true);
      expect(tracker.percentComplete).toBe(100);
      expect(tracker.isComplete).toBe(true);
      expect(tracker.receivedBytes).toBe(400);
    });

    it('identifies missing ranges accurately', () => {
      const tracker = new ChunkTracker(10);
      tracker.markReceived(0);
      tracker.markReceived(1);
      // missing: 2, 3, 4
      tracker.markReceived(5);
      tracker.markReceived(6);
      // missing: 7, 8, 9

      const ranges = tracker.getMissingRanges();
      expect(ranges).toEqual([
        [2, 4],
        [7, 9],
      ]);

      expect(tracker.getLastContiguousSeq()).toBe(1);
    });

    it('handles out of bounds sequence numbers gracefully', () => {
      const tracker = new ChunkTracker(5);
      expect(tracker.markReceived(-1)).toBe(false);
      expect(tracker.markReceived(5)).toBe(false);
      expect(tracker.markReceived(100)).toBe(false);
    });
  });

  // ─── 7. TransferSession (End-to-End Optical Simulation) ──────────────────────
  describe('TransferSession Workflow Simulation', () => {
    afterEach(() => {
      SessionManager.reset();
    });

    it('simulates full optical transmission from Sender to Receiver', () => {
      const fileData = new Uint8Array(1000);
      for (let i = 0; i < 1000; i++) fileData[i] = (i * 7) & 0xff;

      let completedFile: Uint8Array | null = null;
      let completedMeta: FileMetadata | null = null;
      let progressEventsCount = 0;

      // Prepare transfer via facade
      const transfer = opticalTransferProtocol.prepareTransfer(
        fileData,
        'image.png',
        'image/png',
        256,
      );

      // Receiver session
      const receiver = opticalTransferProtocol.createReceiverSession(
        transfer.sessionId,
        {
          onProgress: () => {
            progressEventsCount++;
          },
          onComplete: (assembled, meta) => {
            completedFile = assembled;
            completedMeta = meta;
          },
        },
      );

      receiver.start();
      expect(receiver.state).toBe(SessionState.HANDSHAKING);

      // Ingest FILE_INFO
      const fileInfo = PacketDecoder.decodeOrThrow(transfer.fileInfoBuffer);
      receiver.processPacket(fileInfo);
      expect(receiver.state).toBe(SessionState.TRANSFERRING);

      // Ingest DATA frames out of order (shuffle chunks)
      const shuffledBuffers = [...transfer.dataBuffers].reverse();
      for (const buf of shuffledBuffers) {
        const dataPacket = PacketDecoder.decodeOrThrow(buf);
        receiver.processPacket(dataPacket);
      }

      // Verify completion
      expect(receiver.state).toBe(SessionState.COMPLETED);
      expect(completedFile).not.toBeNull();
      expect(completedFile).toEqual(fileData);
      expect(completedMeta?.fileName).toBe('image.png');
      expect(progressEventsCount).toBe(transfer.dataBuffers.length);
    });

    it('ignores duplicate frames in session without state corruption', () => {
      const fileData = new Uint8Array(500);
      const transfer = opticalTransferProtocol.prepareTransfer(fileData, 'test.bin');
      const receiver = opticalTransferProtocol.createReceiverSession(transfer.sessionId);
      receiver.start();

      const fileInfo = PacketDecoder.decodeOrThrow(transfer.fileInfoBuffer);
      receiver.processPacket(fileInfo);

      const chunk0 = PacketDecoder.decodeOrThrow(transfer.dataBuffers[0]!);
      // Ingest twice
      expect(receiver.processPacket(chunk0)).toBe(true);
      expect(receiver.processPacket(chunk0)).toBe(true);

      const progress = receiver.getProgress();
      expect(progress?.receivedChunksCount).toBe(1);
    });

    it('handles transfer cancellation cleanly', () => {
      let cancelledReason: CancelReasonCode | null = null;
      const receiver = opticalTransferProtocol.createReceiverSession(12345, {
        onCancelled: (reason) => {
          cancelledReason = reason;
        },
      });

      receiver.start();
      receiver.cancel(CancelReasonCode.USER_CANCELLED, 'User aborted');

      expect(receiver.state).toBe(SessionState.CANCELLED);
      expect(cancelledReason).toBe(CancelReasonCode.USER_CANCELLED);
    });

    it('fails session when file CRC integrity check fails on corrupted payload', () => {
      let errorCode: ProtocolErrorCode | null = null;
      const fileData = new Uint8Array(200);
      const transfer = opticalTransferProtocol.prepareTransfer(fileData, 'corrupt_test.bin');

      const receiver = opticalTransferProtocol.createReceiverSession(transfer.sessionId, {
        onError: (code) => {
          errorCode = code;
        },
      });

      receiver.start();
      const fileInfo = PacketDecoder.decodeOrThrow(transfer.fileInfoBuffer);
      receiver.processPacket(fileInfo);

      // Mutate chunk payload directly after decoding
      const dataPacket = PacketDecoder.decodeOrThrow(transfer.dataBuffers[0]!);
      dataPacket.payload[10] = 0xff; // tamper after packet validation
      receiver.processPacket(dataPacket);

      expect(receiver.state).toBe(SessionState.FAILED);
      expect(errorCode).toBe(ProtocolErrorCode.FILE_INTEGRITY_FAILED);
    });
  });

  // ─── 8. Performance Benchmarks ───────────────────────────────────────────────
  describe('OpticalTransferProtocol Benchmarks', () => {
    it('runs performance benchmark diagnostic and verifies throughput', () => {
      const benchmark = opticalTransferProtocol.runBenchmark(100, 256);

      expect(benchmark.packetsCount).toBe(100);
      expect(benchmark.totalBytes).toBe(100 * (HEADER_SIZE + 256));
      expect(benchmark.encodeTimeMs).toBeGreaterThan(0);
      expect(benchmark.decodeTimeMs).toBeGreaterThan(0);
      expect(benchmark.encodePacketsPerSec).toBeGreaterThan(0);
      expect(benchmark.decodePacketsPerSec).toBeGreaterThan(0);
      // Fixed 24 bytes header over 280 bytes = ~8.57%
      expect(benchmark.headerOverheadPercent).toBeCloseTo(8.57, 1);
    });
  });
});
