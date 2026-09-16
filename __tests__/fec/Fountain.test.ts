/* eslint-disable no-bitwise */
/**
 * OptiShare Fountain Codes (Rateless FEC) Unit Tests — Phase 11
 */

import {
  DecoderState,
  FOUNTAIN_PACKET_FLAG,
  FountainDecoder,
  FountainEncoder,
  FountainProtocolBridge,
  FountainSymbol,
  RobustSolitonDistribution,
  XorShiftPRNG,
  fountainEngine,
  xorBuffers,
  xorBuffersInPlace,
} from '../../src/fec';
import { PacketDecoder } from '../../src/protocol';

describe('OptiShare Fountain Codes (Rateless FEC) — Phase 11', () => {
  // ─── 1. XorShift PRNG Tests ──────────────────────────────────────────────────
  describe('XorShiftPRNG', () => {
    it('produces identical deterministic sequences from identical seeds', () => {
      const prng1 = new XorShiftPRNG(12345);
      const prng2 = new XorShiftPRNG(12345);

      for (let i = 0; i < 50; i++) {
        expect(prng1.nextUint32()).toBe(prng2.nextUint32());
      }
    });

    it('produces distinct sequences from different seeds', () => {
      const prng1 = new XorShiftPRNG(11111);
      const prng2 = new XorShiftPRNG(99999);

      let matches = 0;
      for (let i = 0; i < 20; i++) {
        if (prng1.nextUint32() === prng2.nextUint32()) matches++;
      }
      expect(matches).toBeLessThan(5);
    });

    it('handles zero seed safely without hanging', () => {
      const prng = new XorShiftPRNG(0);
      expect(prng.nextUint32()).not.toBe(0);
    });

    it('samples distinct sorted indices within [0, k - 1]', () => {
      const prng = new XorShiftPRNG(42);
      const k = 20;
      const count = 7;

      const indices = prng.sampleDistinctIndices(k, count);
      expect(indices.length).toBe(count);

      // Verify strictly distinct and within bounds
      const unique = new Set(indices);
      expect(unique.size).toBe(count);

      for (const idx of indices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(k);
      }
    });

    it('handles edge cases in sampleDistinctIndices', () => {
      const prng = new XorShiftPRNG(42);
      expect(prng.sampleDistinctIndices(10, 0)).toEqual([]);
      expect(prng.sampleDistinctIndices(5, 5)).toEqual([0, 1, 2, 3, 4]);
      expect(prng.sampleDistinctIndices(5, 1).length).toBe(1);
    });
  });

  // ─── 2. Robust Soliton Distribution Tests ────────────────────────────────────
  describe('RobustSolitonDistribution', () => {
    it('always samples degree 1 when K = 1', () => {
      const dist = new RobustSolitonDistribution(1);
      const prng = new XorShiftPRNG(100);

      for (let i = 0; i < 20; i++) {
        expect(dist.sampleDegree(prng)).toBe(1);
      }
    });

    it('samples degrees strictly within [1, K]', () => {
      const k = 25;
      const dist = new RobustSolitonDistribution(k);
      const prng = new XorShiftPRNG(999);

      for (let i = 0; i < 100; i++) {
        const d = dist.sampleDegree(prng);
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(k);
      }
    });

    it('throws error on non-positive K', () => {
      expect(() => new RobustSolitonDistribution(0)).toThrow('K must be greater than 0');
      expect(() => new RobustSolitonDistribution(-5)).toThrow('K must be greater than 0');
    });
  });

  // ─── 3. Vectorized XOR Utility Tests ─────────────────────────────────────────
  describe('Vectorized XOR Utilities', () => {
    it('satisfies involution property (A ^ B) ^ B = A', () => {
      const a = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90]);
      const b = new Uint8Array([15, 25, 35, 45, 55, 65, 75, 85, 95]);

      const xored = xorBuffers(a, b);
      const restored = xorBuffers(xored, b);

      expect(restored).toEqual(a);
    });

    it('modifies target in place correctly with 32-bit alignment', () => {
      const target = new Uint8Array([0xff, 0x00, 0xaa, 0x55, 0x12, 0x34, 0x56, 0x78]);
      const source = new Uint8Array([0x0f, 0xf0, 0x55, 0xaa, 0x12, 0x34, 0x56, 0x78]);

      xorBuffersInPlace(target, source);

      expect(target[0]).toBe(0xf0);
      expect(target[1]).toBe(0xf0);
      expect(target[2]).toBe(0xff);
      expect(target[3]).toBe(0xff);
      expect(target[4]).toBe(0x00);
      expect(target[5]).toBe(0x00);
      expect(target[6]).toBe(0x00);
      expect(target[7]).toBe(0x00);
    });

    it('handles non-multiple-of-4 buffer lengths', () => {
      const a = new Uint8Array([1, 2, 3, 4, 5]);
      const b = new Uint8Array([5, 4, 3, 2, 1]);

      const result = xorBuffers(a, b);
      expect(result).toEqual(new Uint8Array([1 ^ 5, 2 ^ 4, 3 ^ 3, 4 ^ 2, 5 ^ 1]));
    });
  });

  // ─── 4. FountainSymbol Model Tests ───────────────────────────────────────────
  describe('FountainSymbol Model', () => {
    it('serializes and deserializes droplet symbol correctly', () => {
      const symbol = new FountainSymbol({
        sequenceNumber: 15,
        seed: 0xfeedbeef,
        degree: 3,
        sourceIndices: [1, 4, 9],
        data: new Uint8Array([10, 20, 30, 40, 50]),
        isSystematic: false,
      });

      const serialized = symbol.serialize();
      expect(serialized.length).toBe(12 + 5);

      const deserialized = FountainSymbol.deserialize(serialized, [1, 4, 9]);
      expect(deserialized.sequenceNumber).toBe(15);
      expect(deserialized.seed).toBe(0xfeedbeef);
      expect(deserialized.degree).toBe(3);
      expect(deserialized.data).toEqual(new Uint8Array([10, 20, 30, 40, 50]));
    });

    it('clones symbol cleanly without sharing data buffer', () => {
      const original = new FountainSymbol({
        sequenceNumber: 0,
        seed: 1,
        degree: 1,
        sourceIndices: [0],
        data: new Uint8Array([1, 2, 3]),
        isSystematic: true,
      });

      const cloned = original.clone();
      cloned.data[0] = 99;

      expect(original.data[0]).toBe(1);
    });
  });

  // ─── 5. FountainEncoder Tests ────────────────────────────────────────────────
  describe('FountainEncoder', () => {
    it('segments data into K symbols of uniform symbolSize', () => {
      const data = new Uint8Array(600);
      for (let i = 0; i < 600; i++) data[i] = i & 0xff;

      const encoder = new FountainEncoder(data, { symbolSize: 256 });
      expect(encoder.k).toBe(3); // 256 + 256 + 88 -> K=3
      expect(encoder.symbolSize).toBe(256);
      expect(encoder.originalLength).toBe(600);
    });

    it('generates systematic degree-1 droplets for sequences < K', () => {
      const data = new Uint8Array(64);
      for (let i = 0; i < 64; i++) data[i] = (i + 1) & 0xff;

      const encoder = new FountainEncoder(data, { symbolSize: 32, systematic: true });
      expect(encoder.k).toBe(2);

      const d0 = encoder.getDroplet(0);
      expect(d0.degree).toBe(1);
      expect(d0.isSystematic).toBe(true);
      expect(d0.sourceIndices).toEqual([0]);
      expect(d0.data).toEqual(data.subarray(0, 32));

      const d1 = encoder.getDroplet(1);
      expect(d1.degree).toBe(1);
      expect(d1.isSystematic).toBe(true);
      expect(d1.sourceIndices).toEqual([1]);
      expect(d1.data).toEqual(data.subarray(32, 64));
    });

    it('generates rateless droplets for sequences >= K', () => {
      const data = new Uint8Array(160);
      const encoder = new FountainEncoder(data, { symbolSize: 32 });
      expect(encoder.k).toBe(5);

      const d5 = encoder.getDroplet(5);
      expect(d5.sequenceNumber).toBe(5);
      expect(d5.isSystematic).toBe(false);
      expect(d5.degree).toBeGreaterThanOrEqual(1);
      expect(d5.degree).toBeLessThanOrEqual(5);
    });

    it('validates symbol size constraints', () => {
      const data = new Uint8Array(100);
      expect(() => new FountainEncoder(data, { symbolSize: 16 })).toThrow('Symbol size must be >= 32');
    });
  });

  // ─── 6. FountainDecoder & Peeling Decoding ───────────────────────────────────
  describe('FountainDecoder (Peeling Belief Propagation)', () => {
    it('reconstructs single-symbol file (K=1)', () => {
      const source = new Uint8Array([42, 43, 44, 45]);
      const encoder = new FountainEncoder(source, { symbolSize: 64 });
      expect(encoder.k).toBe(1);

      const decoder = new FountainDecoder({
        totalSymbols: 1,
        symbolSize: 64,
        originalLength: 4,
        seed: encoder.seed,
      });

      const droplet = encoder.getDroplet(0);
      decoder.addDroplet(droplet);

      expect(decoder.isComplete).toBe(true);
      expect(decoder.reconstructData()).toEqual(source);
    });

    it('reconstructs small multi-symbol file with systematic packets', () => {
      const source = new Uint8Array(120);
      for (let i = 0; i < 120; i++) source[i] = (i * 3) & 0xff;

      const encoder = new FountainEncoder(source, { symbolSize: 40 });
      expect(encoder.k).toBe(3);

      const decoder = new FountainDecoder({
        totalSymbols: encoder.k,
        symbolSize: 40,
        originalLength: 120,
        seed: encoder.seed,
      });

      decoder.addDroplet(encoder.getDroplet(0));
      decoder.addDroplet(encoder.getDroplet(1));
      expect(decoder.isComplete).toBe(false);

      decoder.addDroplet(encoder.getDroplet(2));
      expect(decoder.isComplete).toBe(true);
      expect(decoder.reconstructData()).toEqual(source);
    });

    it('reconstructs out-of-order and non-systematic droplet combinations', () => {
      const source = new Uint8Array(300);
      for (let i = 0; i < 300; i++) source[i] = (i * 11) & 0xff;

      const encoder = new FountainEncoder(source, { symbolSize: 50, systematic: false });
      const k = encoder.k; // 6 symbols

      const decoder = new FountainDecoder({
        totalSymbols: k,
        symbolSize: 50,
        originalLength: 300,
        seed: encoder.seed,
      });

      // Feed droplets until decoder resolves
      let seq = 0;
      while (!decoder.isComplete && seq < 50) {
        decoder.addDroplet(encoder.getDroplet(seq));
        seq++;
      }

      expect(decoder.isComplete).toBe(true);
      expect(decoder.reconstructData()).toEqual(source);
    });

    it('ignores duplicate droplets gracefully without state corruption', () => {
      const source = new Uint8Array(100);
      const encoder = new FountainEncoder(source, { symbolSize: 50 });
      const decoder = new FountainDecoder({
        totalSymbols: encoder.k,
        symbolSize: 50,
        originalLength: 100,
        seed: encoder.seed,
      });

      const d0 = encoder.getDroplet(0);
      expect(decoder.addDroplet(d0)).toBe(true);
      expect(decoder.addDroplet(d0)).toBe(false); // Duplicate ignored

      const stats = decoder.getStats();
      expect(stats.symbolsDecoded).toBe(1);
      expect(stats.redundantSymbols).toBe(1);
    });

    it('strips trailing zero-padding on last symbol to match exact original length', () => {
      const source = new Uint8Array(50); // 50 bytes with symbolSize 32 -> 32 + 18 padded
      for (let i = 0; i < 50; i++) source[i] = 0xaa;

      const encoder = new FountainEncoder(source, { symbolSize: 32 });
      expect(encoder.k).toBe(2);

      const decoder = new FountainDecoder({
        totalSymbols: 2,
        symbolSize: 32,
        originalLength: 50,
        seed: encoder.seed,
      });

      decoder.addDroplet(encoder.getDroplet(0));
      decoder.addDroplet(encoder.getDroplet(1));

      const recovered = decoder.reconstructData();
      expect(recovered.length).toBe(50);
      expect(recovered).toEqual(source);
    });
  });

  // ─── 7. Erasure Channel / Packet Loss Simulation ──────────────────────────────
  describe('Optical Packet Loss Resilience (Erasure Channel)', () => {
    it('recovers 100% of data under 20% random optical packet drop', () => {
      const fileBytes = new Uint8Array(1000);
      for (let i = 0; i < 1000; i++) fileBytes[i] = (i * 7) & 0xff;

      const encoder = new FountainEncoder(fileBytes, { symbolSize: 100 });
      const k = encoder.k; // 10 symbols

      let completedPayload: Uint8Array | null = null;
      const decoder = new FountainDecoder(
        {
          totalSymbols: k,
          symbolSize: 100,
          originalLength: 1000,
          seed: encoder.seed,
        },
        {
          onComplete: (data) => {
            completedPayload = data;
          },
        },
      );

      // Stream droplets with 20% simulated drop rate
      let seq = 0;
      while (!decoder.isComplete && seq < 50) {
        // Drop 20% of frames (deterministic modulo simulation)
        if (seq % 5 === 0) {
          seq++;
          continue; // Frame dropped by camera glare!
        }

        const droplet = encoder.getDroplet(seq);
        decoder.addDroplet(droplet);
        seq++;
      }

      expect(decoder.isComplete).toBe(true);
      expect(decoder.state).toBe(DecoderState.COMPLETE);
      expect(completedPayload).toEqual(fileBytes);
    });

    it('recovers 100% of data under 40% severe optical packet drop', () => {
      const fileBytes = new Uint8Array(800);
      for (let i = 0; i < 800; i++) fileBytes[i] = (i * 19) & 0xff;

      const encoder = new FountainEncoder(fileBytes, { symbolSize: 100 });
      const k = encoder.k; // 8 symbols

      const decoder = new FountainDecoder({
        totalSymbols: k,
        symbolSize: 100,
        originalLength: 800,
        seed: encoder.seed,
      });

      // Stream droplets with 40% drop rate (drop when seq % 5 is 0 or 1)
      let seq = 0;
      while (!decoder.isComplete && seq < 80) {
        if (seq % 5 === 0 || seq % 5 === 1) {
          seq++;
          continue;
        }

        decoder.addDroplet(encoder.getDroplet(seq));
        seq++;
      }

      expect(decoder.isComplete).toBe(true);
      expect(decoder.reconstructData()).toEqual(fileBytes);
    });
  });

  // ─── 8. Phase 10 Optical Transfer Protocol Bridge ───────────────────────────
  describe('FountainProtocolBridge Integration', () => {
    it('packs droplet into Phase 10 binary packet and unpacks cleanly', () => {
      const symbol = new FountainSymbol({
        sequenceNumber: 7,
        seed: 0x12345678,
        degree: 2,
        sourceIndices: [2, 5],
        data: new Uint8Array([10, 20, 30, 40]),
        isSystematic: false,
      });

      // 1. Pack droplet into Phase 10 binary buffer
      const wireBuffer = FountainProtocolBridge.encodeDropletToPacket(
        0xabcdef12,
        10,
        symbol,
      );

      // 2. Decode wire buffer via Phase 10 PacketDecoder
      const decodeResult = PacketDecoder.decode(wireBuffer);
      expect(decodeResult.success).toBe(true);
      expect(decodeResult.packet).toBeDefined();

      const packet = decodeResult.packet!;
      expect(FountainProtocolBridge.isFountainPacket(packet)).toBe(true);
      expect(packet.header.reserved & FOUNTAIN_PACKET_FLAG).not.toBe(0);

      // 3. Extract FountainSymbol from ProtocolPacket
      const extractedSymbol = FountainProtocolBridge.decodePacketToDroplet(
        packet,
        0x12345678,
      );

      expect(extractedSymbol).not.toBeNull();
      expect(extractedSymbol?.sequenceNumber).toBe(7);
      expect(extractedSymbol?.data).toEqual(new Uint8Array([10, 20, 30, 40]));
    });
  });

  // ─── 9. FountainEngine Facade & Benchmarks ───────────────────────────────────
  describe('FountainEngine Facade & Benchmarking', () => {
    it('runs loss-tolerant benchmark diagnostic and calculates throughput', () => {
      const benchmark = fountainEngine.runBenchmark(16384, 256, 0.15); // 16 KB with 15% drop

      expect(benchmark.dataSize).toBe(16384);
      expect(benchmark.symbolSize).toBe(256);
      expect(benchmark.k).toBe(64);
      expect(benchmark.encodedDroplets).toBeGreaterThanOrEqual(64);
      expect(benchmark.encodeTimeMs).toBeGreaterThan(0);
      expect(benchmark.decodeTimeMs).toBeGreaterThan(0);
      expect(benchmark.encodeThroughputMBps).toBeGreaterThan(0);
      expect(benchmark.decodeThroughputMBps).toBeGreaterThan(0);
    });
  });
});
