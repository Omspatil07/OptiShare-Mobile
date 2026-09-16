/**
 * OptiShare Fountain Codes / FEC Layer Constants
 */

/**
 * Default symbol size in bytes (matches Phase 10 chunk size and QR capacity).
 */
export const DEFAULT_SYMBOL_SIZE = 256;

/**
 * Minimum allowable symbol size in bytes.
 */
export const MIN_SYMBOL_SIZE = 32;

/**
 * Maximum allowable symbol size in bytes.
 */
export const MAX_SYMBOL_SIZE = 4096;

/**
 * Default parameter 'c' for Robust Soliton Distribution.
 * Controls the expected number of degree-1 ripple symbols.
 */
export const DEFAULT_SOLITON_C = 0.1;

/**
 * Default parameter 'delta' (failure probability bound) for Robust Soliton Distribution.
 */
export const DEFAULT_SOLITON_DELTA = 0.05;

/**
 * Maximum supported number of source symbols in a single FEC block.
 */
export const MAX_SOURCE_SYMBOLS = 65536;

/**
 * Flag bit in Phase 10 PacketHeader `reserved` field (bit 15)
 * indicating that this packet carries a Fountain Code encoded droplet.
 */
export const FOUNTAIN_PACKET_FLAG = 0x8000;

/**
 * Decoder operational state.
 */
export enum DecoderState {
  INITIALIZING = 'INITIALIZING',
  DECODING = 'DECODING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

/**
 * FEC error codes.
 */
export enum FecErrorCode {
  INVALID_SOURCE_DATA = 0x01,
  INVALID_SYMBOL_SIZE = 0x02,
  INVALID_DEGREE = 0x03,
  DECODING_FAILED = 0x04,
  ALREADY_COMPLETE = 0x05,
  SYMBOL_CORRUPTED = 0x06,
  SEED_MISMATCH = 0x07,
  BLOCK_OVERFLOW = 0x08,
}
