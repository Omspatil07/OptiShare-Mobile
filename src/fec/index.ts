/**
 * OptiShare Fountain Codes / Forward Error Correction (FEC) — Public API
 */

// Constants
export {
  DEFAULT_SOLITON_C,
  DEFAULT_SOLITON_DELTA,
  DEFAULT_SYMBOL_SIZE,
  FOUNTAIN_PACKET_FLAG,
  MAX_SOURCE_SYMBOLS,
  MAX_SYMBOL_SIZE,
  MIN_SYMBOL_SIZE,
  DecoderState,
  FecErrorCode,
} from './constants/fecConstants';

// Types
export type {
  DecoderEvents,
  DecodingStats,
  FecBenchmarkResult,
  FountainDecoderOptions,
  FountainEncoderOptions,
  IFountainSymbol,
} from './types/fecTypes';

// PRNG & Distribution
export { XorShiftPRNG } from './prng/XorShiftPRNG';
export { RobustSolitonDistribution } from './distribution/RobustSolitonDistribution';

// Models
export { FountainSymbol } from './models/FountainSymbol';

// Codec
export { FountainEncoder } from './encoder/FountainEncoder';
export { FountainDecoder } from './decoder/FountainDecoder';

// Bridge to Phase 10 Optical Transfer Protocol
export { FountainProtocolBridge } from './bridge/FountainProtocolBridge';

// Core Facade
export { FountainEngine, fountainEngine } from './core/FountainEngine';

// Utilities
export { generateFecSeed, xorBuffers, xorBuffersInPlace } from './utils/fecUtils';
