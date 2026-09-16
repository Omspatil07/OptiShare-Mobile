/* eslint-disable no-bitwise */
/**
 * OptiShare File Metadata Model & Binary Serializer
 */

import {
  MAX_FILE_NAME_LENGTH,
  MAX_MIME_TYPE_LENGTH,
  MIN_CHUNK_SIZE,
} from '../constants/protocolConstants';
import type { IFileMetadata } from '../types/protocolTypes';
import { stringToUtf8, utf8ToString } from '../utils/protocolUtils';

export class FileMetadata implements IFileMetadata {
  public readonly fileName: string;
  public readonly fileSizeBytes: number;
  public readonly mimeType: string;
  public readonly fileChecksum: number;
  public readonly chunkSize: number;
  public readonly totalChunks: number;

  constructor(meta: IFileMetadata) {
    if (!meta.fileName || meta.fileName.length === 0) {
      throw new Error('File name cannot be empty');
    }
    if (meta.fileSizeBytes < 0) {
      throw new Error('File size cannot be negative');
    }
    if (meta.chunkSize < MIN_CHUNK_SIZE) {
      throw new Error(`Chunk size must be >= ${MIN_CHUNK_SIZE}`);
    }

    this.fileName = meta.fileName;
    this.fileSizeBytes = meta.fileSizeBytes;
    this.mimeType = meta.mimeType || 'application/octet-stream';
    this.fileChecksum = meta.fileChecksum >>> 0;
    this.chunkSize = meta.chunkSize;
    this.totalChunks = meta.totalChunks;
  }

  /**
   * Helper to calculate total chunks required for a file.
   */
  public static calculateTotalChunks(fileSizeBytes: number, chunkSize: number): number {
    if (fileSizeBytes === 0) return 1; // At least 1 chunk (empty)
    return Math.ceil(fileSizeBytes / chunkSize);
  }

  /**
   * Serializes metadata to compact binary representation.
   *
   * Layout:
   * [0..7]   File size (64-bit uint big-endian: high32, low32)
   * [8..11]  File CRC-32 checksum (32-bit uint)
   * [12..13] Chunk size (16-bit uint)
   * [14..17] Total chunks (32-bit uint)
   * [18]     File name byte length (uint8)
   * [19..19+nameLen-1] File name UTF-8 bytes
   * [19+nameLen] Mime type byte length (uint8)
   * [20+nameLen..] Mime type UTF-8 bytes
   */
  public serialize(): Uint8Array {
    const nameBytes = stringToUtf8(this.fileName);
    if (nameBytes.length > MAX_FILE_NAME_LENGTH) {
      throw new Error(`File name exceeds maximum length of ${MAX_FILE_NAME_LENGTH} bytes`);
    }

    const mimeBytes = stringToUtf8(this.mimeType);
    if (mimeBytes.length > MAX_MIME_TYPE_LENGTH) {
      throw new Error(`MIME type exceeds maximum length of ${MAX_MIME_TYPE_LENGTH} bytes`);
    }

    const totalLength = 8 + 4 + 2 + 4 + 1 + nameBytes.length + 1 + mimeBytes.length;
    const buffer = new Uint8Array(totalLength);
    const view = new DataView(buffer.buffer, buffer.byteOffset, totalLength);

    // 64-bit file size as two 32-bit ints
    const highSize = Math.floor(this.fileSizeBytes / 0x100000000);
    const lowSize = this.fileSizeBytes >>> 0;
    view.setUint32(0, highSize, false);
    view.setUint32(4, lowSize, false);

    view.setUint32(8, this.fileChecksum, false);
    view.setUint16(12, this.chunkSize, false);
    view.setUint32(14, this.totalChunks, false);

    view.setUint8(18, nameBytes.length);
    buffer.set(nameBytes, 19);

    const mimeOffset = 19 + nameBytes.length;
    view.setUint8(mimeOffset, mimeBytes.length);
    buffer.set(mimeBytes, mimeOffset + 1);

    return buffer;
  }

  /**
   * Deserializes binary metadata into a FileMetadata instance.
   */
  public static deserialize(buffer: Uint8Array): FileMetadata {
    if (buffer.length < 20) {
      throw new Error(`Buffer too small for FileMetadata: ${buffer.length} < 20`);
    }

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);
    const highSize = view.getUint32(0, false);
    const lowSize = view.getUint32(4, false);
    const fileSizeBytes = highSize * 0x100000000 + lowSize;

    const fileChecksum = view.getUint32(8, false);
    const chunkSize = view.getUint16(12, false);
    const totalChunks = view.getUint32(14, false);

    const nameLen = view.getUint8(18);
    if (buffer.length < 19 + nameLen + 1) {
      throw new Error('Malformed FileMetadata payload: truncated file name');
    }

    const nameBytes = buffer.subarray(19, 19 + nameLen);
    const fileName = utf8ToString(nameBytes);

    const mimeOffset = 19 + nameLen;
    const mimeLen = view.getUint8(mimeOffset);
    if (buffer.length < mimeOffset + 1 + mimeLen) {
      throw new Error('Malformed FileMetadata payload: truncated MIME type');
    }

    const mimeBytes = buffer.subarray(mimeOffset + 1, mimeOffset + 1 + mimeLen);
    const mimeType = utf8ToString(mimeBytes);

    return new FileMetadata({
      fileName,
      fileSizeBytes,
      mimeType,
      fileChecksum,
      chunkSize,
      totalChunks,
    });
  }
}
