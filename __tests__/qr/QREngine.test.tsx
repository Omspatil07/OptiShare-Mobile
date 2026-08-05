/**
 * OptiShare QR Engine Unit Tests — Phase 9
 *
 * Verifies QRFrame model, CRC32 calculations, QRGenerator, QRDecoder,
 * QRFrameScheduler, and QREngineService facade.
 */

import {
  DEFAULT_EC_LEVEL,
  DEFAULT_QR_VERSION,
  QRDecoder,
  QRFrame,
  QRFrameScheduler,
  QRGenerator,
  base64ToUint8Array,
  calculateCRC32,
  calculateOptimalVersion,
  getSafeVersion,
  isValidECLevel,
  isValidQRVersion,
  qrEngineService,
  uint8ArrayToBase64,
} from '../../src/qr';

// ─── 1. Utilities & Calculations ─────────────────────────────────────────────

describe('QR Engine Utilities', () => {
  it('calculates CRC32 checksums deterministically', () => {
    const text = 'Hello OptiShare';
    const crc1 = calculateCRC32(text);
    const crc2 = calculateCRC32(text);
    expect(crc1).toBe(crc2);
    expect(typeof crc1).toBe('number');
    expect(crc1).toBeGreaterThan(0);
  });

  it('converts Uint8Array to Base64 and back losslessly', () => {
    const sample = new Uint8Array([79, 112, 116, 105, 83, 104, 97, 114, 101]);
    const b64 = uint8ArrayToBase64(sample);
    const restored = base64ToUint8Array(b64);
    expect(restored).toEqual(sample);
  });

  it('calculates optimal QR version based on payload size', () => {
    expect(calculateOptimalVersion(10)).toBe(1);
    expect(calculateOptimalVersion(100)).toBe(6);
    expect(calculateOptimalVersion(200)).toBe(10);
    expect(calculateOptimalVersion(5000)).toBe(40);
  });

  it('validates QR versions and EC levels correctly', () => {
    expect(isValidQRVersion(1)).toBe(true);
    expect(isValidQRVersion(40)).toBe(true);
    expect(isValidQRVersion(0)).toBe(false);
    expect(isValidQRVersion(41)).toBe(false);

    expect(isValidECLevel('M')).toBe(true);
    expect(isValidECLevel('H')).toBe(true);
    expect(isValidECLevel('X')).toBe(false);
  });

  it('getSafeVersion returns fallback for invalid input', () => {
    expect(getSafeVersion(5)).toBe(5);
    expect(getSafeVersion(999)).toBe(DEFAULT_QR_VERSION);
  });
});

// ─── 2. QRFrame Model ────────────────────────────────────────────────────────

describe('QRFrame Model', () => {
  it('creates and serializes a QRFrame correctly', () => {
    const payload = new Uint8Array([1, 2, 3, 4, 5]);
    const frame = new QRFrame(0, 10, payload);

    expect(frame.sequenceNumber).toBe(0);
    expect(frame.totalFrames).toBe(10);
    expect(frame.isValid).toBe(true);

    const serialized = frame.serialize();
    expect(serialized).toContain('OP:0:10:');
  });

  it('parses a serialized QRFrame string back accurately', () => {
    const originalPayload = new Uint8Array([10, 20, 30, 40]);
    const originalFrame = new QRFrame(3, 5, originalPayload);
    const serialized = originalFrame.serialize();

    const parsed = QRFrame.parse(serialized);
    expect(parsed).not.toBeNull();
    expect(parsed?.sequenceNumber).toBe(3);
    expect(parsed?.totalFrames).toBe(5);
    expect(parsed?.payload).toEqual(originalPayload);
    expect(parsed?.isValid).toBe(true);
  });

  it('detects corrupted CRC checksums during parsing', () => {
    const corruptSerialized = 'OP:0:10:999999999:AQIDBAU=';
    const parsed = QRFrame.parse(corruptSerialized);
    expect(parsed).not.toBeNull();
    expect(parsed?.isValid).toBe(false);
  });

  it('returns null for invalid string format', () => {
    expect(QRFrame.parse('INVALID_STRING')).toBeNull();
    expect(QRFrame.parse('OP:not_a_number:10:123:abc')).toBeNull();
  });

  it('converts to QRFrameData interface correctly', () => {
    const payload = new Uint8Array([9, 8, 7]);
    const frame = new QRFrame(1, 2, payload);
    const data = frame.toData();

    expect(data.header.sequenceNumber).toBe(1);
    expect(data.header.totalFrames).toBe(2);
    expect(data.header.payloadSize).toBe(3);
    expect(data.isValid).toBe(true);
  });
});

// ─── 3. QRGenerator Service ──────────────────────────────────────────────────

describe('QRGenerator Service', () => {
  it('generates a 2D boolean matrix from text', async () => {
    const matrix = await QRGenerator.generateMatrix('OptiShare Matrix Test');
    expect(Array.isArray(matrix)).toBe(true);
    expect(matrix.length).toBeGreaterThan(0);
    expect(Array.isArray(matrix[0])).toBe(true);
    expect(typeof matrix[0]?.[0]).toBe('boolean');
  });

  it('generates a Base64 Data URL', async () => {
    const dataUrl = await QRGenerator.generateDataURL('OptiShare DataURL Test');
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('generates an SVG string', async () => {
    const svg = await QRGenerator.generateSVG('OptiShare SVG Test');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('encodes a binary chunk directly to a frame and Data URL', async () => {
    const chunk = new Uint8Array([100, 101, 102]);
    const result = await QRGenerator.encodeChunkToFrame(chunk, 0, 1);
    expect(result.frame.sequenceNumber).toBe(0);
    expect(result.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(result.serialized).toContain('OP:0:1:');
  });

  it('splits a large payload into multiple QRFrames', () => {
    const largePayload = new Uint8Array(500);
    const frames = QRGenerator.createFramesFromPayload(largePayload, 100);
    expect(frames.length).toBe(5);
    expect(frames[0]?.totalFrames).toBe(5);
    expect(frames[0]?.sequenceNumber).toBe(0);
    expect(frames[4]?.sequenceNumber).toBe(4);
  });
});

// ─── 4. QRDecoder Service ────────────────────────────────────────────────────

describe('QRDecoder Service', () => {
  it('validates optical frame payload formats', () => {
    expect(QRDecoder.validateQRPayload('OP:0:10:123:abc')).toBe(true);
    expect(QRDecoder.validateQRPayload('INVALID:0:10')).toBe(false);
    expect(QRDecoder.validateQRPayload('')).toBe(false);
  });

  it('decodes a valid serialized frame string', () => {
    const payload = new Uint8Array([55, 66, 77]);
    const frame = new QRFrame(0, 1, payload);
    const decoded = QRDecoder.decodeRawString(frame.serialize());

    expect(decoded).not.toBeNull();
    expect(decoded?.payload).toEqual(payload);
  });

  it('returns null when decoding corrupt or invalid frame string', () => {
    expect(QRDecoder.decodeRawString('OP:0:1:999999:bad_data')).toBeNull();
  });

  it('handles empty or zero-dimension RGBA input gracefully', () => {
    const emptyRgba = new Uint8Array(0);
    expect(QRDecoder.decodeRGBA(emptyRgba, 0, 0)).toBeNull();
  });
});

// ─── 5. QRFrameScheduler ─────────────────────────────────────────────────────

describe('QRFrameScheduler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('schedules and emits frames sequentially at target FPS', () => {
    const frames = [
      new QRFrame(0, 3, new Uint8Array([1])),
      new QRFrame(1, 3, new Uint8Array([2])),
      new QRFrame(2, 3, new Uint8Array([3])),
    ];

    const scheduler = new QRFrameScheduler({ targetFps: 10, loop: false });
    const emittedIndices: number[] = [];

    scheduler.onFrame((_frame, index) => {
      emittedIndices.push(index);
    });

    scheduler.start(frames);
    expect(emittedIndices).toEqual([0]);

    jest.advanceTimersByTime(100); // 1 frame period at 10 FPS
    expect(emittedIndices).toEqual([0, 1]);

    jest.advanceTimersByTime(100);
    expect(emittedIndices).toEqual([0, 1, 2]);

    scheduler.stop();
    expect(scheduler.isActive()).toBe(false);
  });

  it('supports pause and resume', () => {
    const frames = [
      new QRFrame(0, 2, new Uint8Array([1])),
      new QRFrame(1, 2, new Uint8Array([2])),
    ];

    const scheduler = new QRFrameScheduler({ targetFps: 10 });
    scheduler.start(frames);

    scheduler.pause();
    expect(scheduler.isActive()).toBe(false);

    scheduler.resume();
    expect(scheduler.isActive()).toBe(true);
    scheduler.stop();
  });

  it('allows manual nextStep navigation', () => {
    const frames = [
      new QRFrame(0, 2, new Uint8Array([1])),
      new QRFrame(1, 2, new Uint8Array([2])),
    ];

    const scheduler = new QRFrameScheduler();
    scheduler.setFrames(frames);

    expect(scheduler.getCurrentFrame()?.sequenceNumber).toBe(0);
    const next = scheduler.nextStep();
    expect(next?.sequenceNumber).toBe(1);
  });
});

// ─── 6. QREngineService Facade ───────────────────────────────────────────────

describe('QREngineService Facade', () => {
  it('provides a unified interface for generator, decoder, and scheduler', async () => {
    const payload = new Uint8Array([12, 34, 56]);
    const frames = qrEngineService.prepareFrames(payload, 100);
    expect(frames.length).toBe(1);

    const svg = await qrEngineService.generateSVG('OptiShare Facade Test');
    expect(svg).toContain('<svg');

    const optimalVersion = qrEngineService.getOptimalVersion(50, DEFAULT_EC_LEVEL);
    expect(optimalVersion).toBeGreaterThanOrEqual(1);

    const scheduler = qrEngineService.createScheduler({ targetFps: 20 });
    expect(scheduler).toBeInstanceOf(QRFrameScheduler);
  });

  it('runs benchmark diagnostic and calculates FPS throughput', async () => {
    const benchmark = await qrEngineService.runBenchmark(5, 50);
    expect(benchmark.totalFramesGenerated).toBe(5);
    expect(benchmark.avgGenTimePerFrameMs).toBeGreaterThanOrEqual(0);
    expect(benchmark.framesPerSecond).toBeGreaterThan(0);
  });
});
