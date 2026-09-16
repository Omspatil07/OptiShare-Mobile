/**
 * OptiShare Optical Transfer Protocol (OTP) Constants
 */

/**
 * 2-byte magic identifier at start of every OTP packet: 'OP' (0x4F, 0x50).
 */
export const PROTOCOL_MAGIC = 0x4f50;

/**
 * Current OTP specification version.
 */
export const PROTOCOL_VERSION = 0x01;

/**
 * Supported protocol versions list.
 */
export const SUPPORTED_PROTOCOL_VERSIONS: readonly number[] = [0x01];

/**
 * Fixed binary header size in bytes.
 * [0..1]   Magic (2 bytes)
 * [2]      Version (1 byte)
 * [3]      Packet Type (1 byte)
 * [4..7]   Session ID (4 bytes)
 * [8..11]  Sequence Number (4 bytes)
 * [12..15] Total Sequences (4 bytes)
 * [16..17] Payload Length (2 bytes)
 * [18..19] Reserved / Flags (2 bytes)
 * [20..23] Checksum (4 bytes)
 */
export const HEADER_SIZE = 24;

/**
 * Maximum payload byte length per individual packet.
 * Prevents memory allocation denial-of-service.
 */
export const MAX_PAYLOAD_SIZE = 4096;

/**
 * Minimum allowable chunk size in bytes.
 */
export const MIN_CHUNK_SIZE = 32;

/**
 * Maximum allowable chunk size in bytes.
 */
export const MAX_CHUNK_SIZE = 4096;

/**
 * Default chunk payload size in bytes.
 * Optimized for QR version 10-14 with ECC Medium over 60FPS optical channels.
 */
export const DEFAULT_CHUNK_SIZE = 256;

/**
 * Maximum length of a file name in UTF-8 bytes.
 */
export const MAX_FILE_NAME_LENGTH = 255;

/**
 * Maximum length of a MIME type string in UTF-8 bytes.
 */
export const MAX_MIME_TYPE_LENGTH = 128;

/**
 * Maximum supported file size: 4GB - 1 byte (uint32 max limit).
 */
export const MAX_FILE_SIZE_BYTES = 0xffffffff;

/**
 * Default receiver inactivity timeout before declaring session failure (milliseconds).
 */
export const DEFAULT_SESSION_TIMEOUT_MS = 30000;

/**
 * Packet Type identifiers.
 */
export enum PacketType {
  HANDSHAKE = 0x01,
  FILE_INFO = 0x02,
  DATA = 0x03,
  ACK = 0x04,
  COMPLETE = 0x05,
  CANCEL = 0x06,
  ERROR = 0x07,
}

/**
 * Reason codes for transfer cancellation.
 */
export enum CancelReasonCode {
  USER_CANCELLED = 0x01,
  TIMEOUT = 0x02,
  CHECKSUM_MISMATCH = 0x03,
  UNSUPPORTED_VERSION = 0x04,
  STORAGE_FULL = 0x05,
  DUPLICATE_SESSION = 0x06,
  UNKNOWN = 0xff,
}

/**
 * Protocol error codes.
 */
export enum ProtocolErrorCode {
  MALFORMED_PACKET = 0x01,
  INVALID_MAGIC = 0x02,
  VERSION_MISMATCH = 0x03,
  CHECKSUM_FAILED = 0x04,
  PAYLOAD_OVERFLOW = 0x05,
  SESSION_MISMATCH = 0x06,
  SEQUENCE_OUT_OF_BOUNDS = 0x07,
  INVALID_FILE_METADATA = 0x08,
  FILE_INTEGRITY_FAILED = 0x09,
  BUFFER_TOO_SMALL = 0x0a,
}

/**
 * Transfer Session operational states.
 */
export enum SessionState {
  IDLE = 'IDLE',
  HANDSHAKING = 'HANDSHAKING',
  TRANSFERRING = 'TRANSFERRING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  TIMED_OUT = 'TIMED_OUT',
}
