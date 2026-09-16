/* eslint-disable no-bitwise */
/**
 * OptiShare Transfer Engine Test Suite
 *
 * Comprehensive unit and integration tests covering state transitions,
 * real-time metrics, frame dispatching, packet processing, standard chunk loopback,
 * Fountain Code loss-tolerant transfer, error recovery, and Zustand store sync.
 */

import { CRC32, PacketEncoder, PacketType } from '../../src/protocol';
import { useTransferStore } from '../../src/store';
import {
  FrameDispatcher,
  FrameProcessor,
  TransferEngine,
  TransferEngineState,
  TransferErrorCode,
  TransferMetrics,
  TransferMode,
  TransferReceiver,
  TransferRole,
  TransferSender,
  TransferStateMachine,
} from '../../src/transfer';

describe('Transfer Engine — Phase 12', () => {
  afterEach(() => {
    jest.clearAllMocks();
    useTransferStore.getState().resetTransfer();
  });

  // =========================================================================
  // 1. State Machine Tests
  // =========================================================================
  describe('TransferStateMachine', () => {
    it('should initialize with IDLE state and allow valid transitions', () => {
      const sm = new TransferStateMachine();
      expect(sm.currentState).toBe(TransferEngineState.IDLE);
      expect(sm.isActive).toBe(false);
      expect(sm.isTerminal).toBe(false);

      sm.transition(TransferEngineState.PREPARING, 'Preparing transfer');
      expect(sm.currentState).toBe(TransferEngineState.PREPARING);
      expect(sm.lastState).toBe(TransferEngineState.IDLE);
      expect(sm.isActive).toBe(true);

      sm.transition(TransferEngineState.HANDSHAKING);
      expect(sm.currentState).toBe(TransferEngineState.HANDSHAKING);

      sm.transition(TransferEngineState.TRANSFERRING);
      expect(sm.currentState).toBe(TransferEngineState.TRANSFERRING);

      sm.transition(TransferEngineState.PAUSED);
      expect(sm.currentState).toBe(TransferEngineState.PAUSED);

      sm.transition(TransferEngineState.TRANSFERRING);
      sm.transition(TransferEngineState.FINALIZING);
      sm.transition(TransferEngineState.COMPLETED);
      expect(sm.currentState).toBe(TransferEngineState.COMPLETED);
      expect(sm.isTerminal).toBe(true);
      expect(sm.isActive).toBe(false);

      sm.reset();
      expect(sm.currentState).toBe(TransferEngineState.IDLE);
    });

    it('should disallow invalid state transitions and throw', () => {
      const sm = new TransferStateMachine();
      expect(sm.canTransition(TransferEngineState.COMPLETED)).toBe(false);
      expect(() => sm.transition(TransferEngineState.COMPLETED)).toThrow(
        /Invalid transfer state transition/,
      );

      sm.transition(TransferEngineState.PREPARING);
      expect(sm.canTransition(TransferEngineState.IDLE)).toBe(false);
      expect(() => sm.transition(TransferEngineState.IDLE)).toThrow();
    });

    it('should notify registered listeners on state changes', () => {
      const sm = new TransferStateMachine();
      const listener = jest.fn();
      const unsubscribe = sm.addListener({ onStateChange: listener });

      sm.transition(TransferEngineState.PREPARING, 'testing');
      expect(listener).toHaveBeenCalledWith(
        TransferEngineState.IDLE,
        TransferEngineState.PREPARING,
        'testing',
      );

      unsubscribe();
      sm.transition(TransferEngineState.TRANSFERRING);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 2. Metrics Calculator Tests
  // =========================================================================
  describe('TransferMetrics', () => {
    it('should track bytes, progress percentage, and calculate speeds', () => {
      const metrics = new TransferMetrics(1000);
      metrics.start();

      metrics.recordBytes(250);
      let snapshot = metrics.getSnapshot();
      expect(snapshot.bytesTransferred).toBe(250);
      expect(snapshot.totalBytes).toBe(1000);
      expect(snapshot.progressPercentage).toBe(25);

      metrics.setBytesTransferred(750);
      snapshot = metrics.getSnapshot();
      expect(snapshot.bytesTransferred).toBe(750);
      expect(snapshot.progressPercentage).toBe(75);

      metrics.recordFrameDispatched();
      metrics.recordFrameReceived(false, false);
      metrics.recordFrameReceived(true, false); // duplicate
      metrics.recordFrameReceived(false, true); // corrupt
      snapshot = metrics.getSnapshot();

      expect(snapshot.framesDispatched).toBe(1);
      expect(snapshot.framesReceived).toBe(3);
      expect(snapshot.duplicateFrames).toBe(1);
      expect(snapshot.corruptFrames).toBe(1);

      metrics.reset(500);
      snapshot = metrics.getSnapshot();
      expect(snapshot.bytesTransferred).toBe(0);
      expect(snapshot.totalBytes).toBe(500);
      expect(snapshot.framesReceived).toBe(0);
    });
  });

  // =========================================================================
  // 3. FrameDispatcher Tests
  // =========================================================================
  describe('FrameDispatcher', () => {
    it('should step through static frames in manual mode', () => {
      const dispatcher = new FrameDispatcher(10);
      const frame1 = new Uint8Array([1, 2, 3]);
      const frame2 = new Uint8Array([4, 5, 6]);
      dispatcher.setFrames([frame1, frame2], false);

      expect(dispatcher.currentIndex).toBe(0);
      const f1 = dispatcher.step();
      expect(f1).toBe(frame1);
      expect(dispatcher.currentIndex).toBe(1);

      const f2 = dispatcher.step();
      expect(f2).toBe(frame2);
      expect(dispatcher.currentIndex).toBe(2);

      const f3 = dispatcher.step();
      expect(f3).toBeNull();
    });

    it('should support continuous frame supplier generators', () => {
      const dispatcher = new FrameDispatcher(15);
      dispatcher.setSupplier((idx) => new Uint8Array([idx & 0xff]));

      const frame0 = dispatcher.step();
      const frame1 = dispatcher.step();
      const frame2 = dispatcher.step();

      expect(frame0?.[0]).toBe(0);
      expect(frame1?.[0]).toBe(1);
      expect(frame2?.[0]).toBe(2);
    });

    it('should handle pause and resume in timed loop mode', () => {
      jest.useFakeTimers();
      const dispatcher = new FrameDispatcher(20);
      const received: number[] = [];
      dispatcher.setSupplier((idx) => new Uint8Array([idx]));

      dispatcher.start((frame) => {
        received.push(frame[0] ?? 0);
      });

      // First tick happens immediately on start
      expect(received).toEqual([0]);

      jest.advanceTimersByTime(50); // 1 tick at 20 fps (50ms interval)
      expect(received.length).toBe(2);

      dispatcher.pause();
      expect(dispatcher.isPaused).toBe(true);

      jest.advanceTimersByTime(200);
      expect(received.length).toBe(2); // no new frames while paused

      dispatcher.resume();
      expect(dispatcher.isPaused).toBe(false);

      jest.advanceTimersByTime(100);
      expect(received.length).toBeGreaterThan(2);

      dispatcher.stop();
      jest.useRealTimers();
    });
  });

  // =========================================================================
  // 4. FrameProcessor Tests
  // =========================================================================
  describe('FrameProcessor', () => {
    it('should decode and validate valid protocol packet buffers', () => {
      const sessionId = 0x12345678;
      const rawPayload = new Uint8Array([10, 20, 30, 40]);
      const encoded = PacketEncoder.encodeData(sessionId, 0, 1, rawPayload);

      const result = FrameProcessor.processFrame(encoded);
      expect(result.success).toBe(true);
      expect(result.isCorrupt).toBe(false);
      expect(result.packet?.sessionId).toBe(sessionId);
      expect(result.packet?.packetType).toBe(PacketType.DATA);
      expect(result.isFountain).toBe(false);
    });

    it('should reject corrupt buffers and return corrupt flag', () => {
      const corrupt = new Uint8Array([0x00, 0x11, 0x22]);
      const result = FrameProcessor.processFrame(corrupt);
      expect(result.success).toBe(false);
      expect(result.isCorrupt).toBe(true);
    });

    it('should enforce expected session ID filter', () => {
      const sessionId = 0x12345678;
      const encoded = PacketEncoder.encodeData(sessionId, 0, 1, new Uint8Array([1]));

      const validResult = FrameProcessor.processFrame(encoded, sessionId);
      expect(validResult.success).toBe(true);

      const invalidResult = FrameProcessor.processFrame(encoded, 0x99999999);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain('Mismatched session ID');
    });
  });

  // =========================================================================
  // 5. TransferSender & TransferReceiver Standard Mode Integration
  // =========================================================================
  describe('Standard Chunk Optical Transfer Pipeline', () => {
    it('should transfer file from sender to receiver with full integrity', async () => {
      // 1. Create synthetic file data (1024 bytes)
      const testData = new Uint8Array(1024);
      for (let i = 0; i < testData.length; i++) {
        testData[i] = (i * 7 + 13) & 0xff;
      }
      const originalCrc = CRC32.calculate(testData);

      const dispatchedFrames: Uint8Array[] = [];
      const sender = new TransferSender({
        fileName: 'test-document.pdf',
        mimeType: 'application/pdf',
        fileData: testData,
        chunkSize: 256,
        mode: TransferMode.STANDARD,
        onFrameDispatched: (frame) => {
          dispatchedFrames.push(frame);
        },
      });

      await sender.prepare();
      expect(sender.sessionInfo.fileSizeBytes).toBe(1024);
      expect(sender.sessionInfo.totalFrames).toBe(6); // 1 FileInfo + 4 Data + 1 Complete

      // 2. Step sender through all frames
      while (sender.step() !== null) {
        if (dispatchedFrames.length >= 6) break;
      }
      expect(dispatchedFrames.length).toBe(6);

      // 3. Receiver ingests all frames
      let completedData: Uint8Array | null = null;
      const receiver = new TransferReceiver({
        mode: TransferMode.STANDARD,
        onComplete: (fileBytes) => {
          completedData = fileBytes;
        },
      });

      receiver.start();
      for (const f of dispatchedFrames) {
        receiver.ingestFrame(f);
      }

      // 4. Verify reconstruction and checksum match
      expect(receiver.state).toBe(TransferEngineState.COMPLETED);
      expect(completedData).not.toBeNull();
      expect(completedData).toEqual(testData);

      const reconstructedCrc = CRC32.calculate(completedData!);
      expect(reconstructedCrc).toBe(originalCrc);
    });

    it('should ignore duplicate frames and track duplicate count in metrics', async () => {
      const testData = new Uint8Array(512);
      testData.fill(42);

      const sender = new TransferSender({
        fileName: 'small.bin',
        fileData: testData,
        chunkSize: 256,
      });
      await sender.prepare();

      const frames: Uint8Array[] = [];
      for (let i = 0; i < 4; i++) {
        const f = sender.step();
        if (f) frames.push(f);
      }

      const receiver = new TransferReceiver();
      receiver.start();

      // Ingest FileInfo
      receiver.ingestFrame(frames[0]!);
      // Ingest Data frame 0 twice
      receiver.ingestFrame(frames[1]!);
      const duplicateAccepted = receiver.ingestFrame(frames[1]!);
      expect(duplicateAccepted).toBe(false);

      const metrics = receiver.getMetrics();
      expect(metrics.duplicateFrames).toBe(1);
    });
  });

  // =========================================================================
  // 6. TransferSender & TransferReceiver Fountain Mode Integration
  // =========================================================================
  describe('Fountain Rateless FEC Transfer Pipeline', () => {
    it('should recover file even with 20% dropped frames over lossy channel', async () => {
      // 1. Create file payload (512 bytes = 4 symbols of 128 bytes)
      const testData = new Uint8Array(512);
      for (let i = 0; i < testData.length; i++) {
        testData[i] = (i * 17) & 0xff;
      }
      const originalCrc = CRC32.calculate(testData);

      const sender = new TransferSender({
        fileName: 'fountain-photo.jpg',
        mimeType: 'image/jpeg',
        fileData: testData,
        chunkSize: 128,
        mode: TransferMode.FOUNTAIN,
        fountainSeed: 0,
      });

      await sender.prepare();
      expect(sender.sessionInfo.mode).toBe(TransferMode.FOUNTAIN);

      let completedData: Uint8Array | null = null;
      const receiver = new TransferReceiver({
        mode: TransferMode.FOUNTAIN,
        onComplete: (bytes) => {
          completedData = bytes;
        },
      });

      receiver.start();

      // Transmit frames: drop every 4th droplet (25% loss)
      let dropletIndex = 0;
      let frame: Uint8Array | null;

      while (receiver.state !== TransferEngineState.COMPLETED && dropletIndex < 30) {
        frame = sender.step();
        if (!frame) break;

        // Frame 0 is FILE_INFO metadata (always deliver metadata)
        if (dropletIndex === 0) {
          receiver.ingestFrame(frame);
        } else {
          // Simulate 25% optical frame loss on droplets
          if (dropletIndex % 4 !== 0) {
            receiver.ingestFrame(frame);
          }
        }
        dropletIndex++;
      }

      expect(receiver.state).toBe(TransferEngineState.COMPLETED);
      expect(completedData).not.toBeNull();
      expect(completedData).toEqual(testData);
      expect(CRC32.calculate(completedData!)).toBe(originalCrc);
    });
  });

  // =========================================================================
  // 7. TransferEngine High-Level Facade & Store Synchronization
  // =========================================================================
  describe('TransferEngine Facade & Global Store Sync', () => {
    it('should manage sender and receiver sessions and sync with Zustand store', async () => {
      const engine = new TransferEngine({ autoSyncStore: true });
      const testBytes = new Uint8Array([1, 2, 3, 4, 5]);

      const sender = await engine.startSend({
        fileName: 'test.txt',
        fileData: testBytes,
        chunkSize: 128,
      });

      expect(engine.getActiveSender()).toBe(sender);
      expect(engine.getActiveSessionInfo()?.role).toBe(TransferRole.SENDER);

      // Verify Zustand store was updated
      const store = useTransferStore.getState();
      expect(store.role).toBe('sender');
      expect(store.status).toBe('transferring');

      // Pause and resume
      engine.pause();
      expect(sender.state).toBe(TransferEngineState.PAUSED);
      expect(useTransferStore.getState().status).toBe('paused');

      engine.resume();
      expect(sender.state).toBe(TransferEngineState.TRANSFERRING);
      expect(useTransferStore.getState().status).toBe('transferring');

      // Cancel
      engine.cancel('User cancelled transfer');
      expect(sender.state).toBe(TransferEngineState.CANCELLED);
      expect(useTransferStore.getState().status).toBe('idle');
    });

    it('should handle receiver inactivity timeout and fail gracefully', () => {
      jest.useFakeTimers();
      const engine = new TransferEngine({ defaultTimeoutMs: 5000 });
      const errorHandler = jest.fn();

      const receiver = engine.startReceive({
        timeoutMs: 5000,
        onError: errorHandler,
      });

      expect(receiver.state).toBe(TransferEngineState.HANDSHAKING);

      // Advance past inactivity timeout
      jest.advanceTimersByTime(5100);

      expect(receiver.state).toBe(TransferEngineState.FAILED);
      expect(errorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        TransferErrorCode.TIMEOUT,
      );

      jest.useRealTimers();
    });

    it('should support retry for previous transfer session', async () => {
      const engine = new TransferEngine();
      const testBytes = new Uint8Array([9, 8, 7]);

      await engine.startSend({
        fileName: 'retry-file.bin',
        fileData: testBytes,
      });

      engine.cancel();
      expect(engine.getActiveSender()?.state).toBe(TransferEngineState.CANCELLED);

      const retried = await engine.retry();
      expect(retried).toBe(true);
      expect(engine.getActiveSender()?.state).toBe(TransferEngineState.TRANSFERRING);
    });
  });
});
