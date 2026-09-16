/* eslint-disable no-bitwise */
/**
 * OptiShare Fountain Code Droplet Symbol Model
 */

import type { IFountainSymbol } from '../types/fecTypes';

export class FountainSymbol implements IFountainSymbol {
  public readonly sequenceNumber: number;
  public readonly seed: number;
  public readonly degree: number;
  public readonly sourceIndices: readonly number[];
  public readonly data: Uint8Array;
  public readonly isSystematic: boolean;

  constructor(symbol: IFountainSymbol) {
    this.sequenceNumber = symbol.sequenceNumber >>> 0;
    this.seed = symbol.seed >>> 0;
    this.degree = symbol.degree;
    this.sourceIndices = symbol.sourceIndices;
    this.data = symbol.data;
    this.isSystematic = symbol.isSystematic;
  }

  /**
   * Length in bytes of the symbol data.
   */
  public get length(): number {
    return this.data.length;
  }

  /**
   * Serializes droplet symbol header + payload into a binary buffer.
   *
   * Layout:
   * [0..3]  Sequence number (uint32)
   * [4..7]  Seed (uint32)
   * [8..9]  Degree (uint16)
   * [10..11] Data length (uint16)
   * [12..]  Data bytes
   */
  public serialize(): Uint8Array {
    const totalLength = 12 + this.data.length;
    const buffer = new Uint8Array(totalLength);
    const view = new DataView(buffer.buffer, buffer.byteOffset, totalLength);

    view.setUint32(0, this.sequenceNumber, false);
    view.setUint32(4, this.seed, false);
    view.setUint16(8, this.degree, false);
    view.setUint16(10, this.data.length, false);
    buffer.set(this.data, 12);

    return buffer;
  }

  /**
   * Deserializes binary droplet data into a FountainSymbol.
   * Note: sourceIndices can be reconstructed deterministically via the PRNG.
   */
  public static deserialize(
    buffer: Uint8Array,
    sourceIndices: readonly number[] = [],
  ): FountainSymbol {
    if (buffer.length < 12) {
      throw new Error(`Buffer too small for FountainSymbol: ${buffer.length} < 12`);
    }

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);
    const sequenceNumber = view.getUint32(0, false);
    const seed = view.getUint32(4, false);
    const degree = view.getUint16(8, false);
    const dataLength = view.getUint16(10, false);

    if (buffer.length < 12 + dataLength) {
      throw new Error(
        `Buffer truncated for FountainSymbol: expected ${12 + dataLength}, got ${buffer.length}`,
      );
    }

    const data = buffer.subarray(12, 12 + dataLength);
    const isSystematic = degree === 1 && sequenceNumber < (sourceIndices.length || 1);

    return new FountainSymbol({
      sequenceNumber,
      seed,
      degree,
      sourceIndices,
      data,
      isSystematic,
    });
  }

  /**
   * Creates a deep copy of this FountainSymbol with a new data buffer.
   */
  public clone(): FountainSymbol {
    const dataCopy = new Uint8Array(this.data.length);
    dataCopy.set(this.data);
    return new FountainSymbol({
      sequenceNumber: this.sequenceNumber,
      seed: this.seed,
      degree: this.degree,
      sourceIndices: [...this.sourceIndices],
      data: dataCopy,
      isSystematic: this.isSystematic,
    });
  }
}
