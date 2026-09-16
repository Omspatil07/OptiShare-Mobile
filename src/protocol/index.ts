/**
 * OptiShare Optical Transfer Protocol (OTP) — Public API
 */

// Constants
export {
  CancelReasonCode,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_SESSION_TIMEOUT_MS,
  HEADER_SIZE,
  MAX_CHUNK_SIZE,
  MAX_FILE_NAME_LENGTH,
  MAX_FILE_SIZE_BYTES,
  MAX_MIME_TYPE_LENGTH,
  MAX_PAYLOAD_SIZE,
  MIN_CHUNK_SIZE,
  PacketType,
  PROTOCOL_MAGIC,
  PROTOCOL_VERSION,
  ProtocolErrorCode,
  SUPPORTED_PROTOCOL_VERSIONS,
  SessionState,
} from './constants/protocolConstants';

// Types
export type {
  ChunkTrackingStats,
  DecodeResult,
  IAckPayload,
  ICancelPayload,
  IErrorPayload,
  IFileMetadata,
  IHandshakePayload,
  IPacketHeader,
  ProtocolBenchmarkResult,
  SessionEvents,
  SessionRole,
} from './types/protocolTypes';

// Checksum
export { CRC32 } from './checksum/CRC32';

// Models
export { PacketHeader } from './models/PacketHeader';
export { FileMetadata } from './models/FileMetadata';
export { ProtocolPacket } from './models/ProtocolPacket';

// Packets
export { HandshakePacket } from './packets/HandshakePacket';
export { FileInfoPacket } from './packets/FileInfoPacket';
export { DataPacket } from './packets/DataPacket';
export { AckPacket } from './packets/AckPacket';
export { CompletePacket } from './packets/CompletePacket';
export type { ICompletePayload } from './packets/CompletePacket';
export { CancelPacket } from './packets/CancelPacket';
export { ErrorPacket } from './packets/ErrorPacket';

// Codec
export { PacketEncoder } from './encoder/PacketEncoder';
export { PacketDecoder } from './decoder/PacketDecoder';

// Session
export { ChunkTracker } from './session/ChunkTracker';
export { TransferSession } from './session/TransferSession';
export { SessionManager, sessionManager } from './session/SessionManager';

// Core Facade
export { OpticalTransferProtocol, opticalTransferProtocol } from './core/OpticalTransferProtocol';

// Utilities
export { formatBytes, generateSessionId, stringToUtf8, utf8ToString } from './utils/protocolUtils';
