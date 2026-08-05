/**
 * Application-wide constants.
 *
 * Values that are fixed across all environments and never change at runtime.
 * For environment-specific values, use environment.ts instead.
 *
 * @see docs/03-functional-requirements.md
 * @see docs/04-non-functional-requirements.md
 */

/** Maximum file size for a single transfer (100 MB). */
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

/** Maximum number of files in a multi-file transfer. */
export const MAX_FILES_PER_TRANSFER = 20;

/** Maximum text input length for text transfer. */
export const MAX_TEXT_LENGTH = 50_000;

/** Default frame rate for visual code display (fps). */
export const DEFAULT_FRAME_RATE = 4;

/** Minimum frame rate (fps). */
export const MIN_FRAME_RATE = 1;

/** Maximum frame rate (fps). */
export const MAX_FRAME_RATE = 15;

/** Default FEC redundancy ratio. */
export const DEFAULT_FEC_RATIO = 1.3;

/** Default zstd compression level. */
export const DEFAULT_COMPRESSION_LEVEL = 3;

/** Maximum transfer history entries before LRU eviction. */
export const MAX_HISTORY_ENTRIES = 1000;

/** Partial transfer data expiry time (24 hours in milliseconds). */
export const PARTIAL_TRANSFER_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Application version — synchronized with package.json at build time. */
export const APP_VERSION = '0.1.0';

/** Visual protocol version. */
export const PROTOCOL_VERSION = 1;
