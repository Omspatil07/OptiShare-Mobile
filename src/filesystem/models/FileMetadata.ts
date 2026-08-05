/**
 * OptiShare FileMetadata Model
 */

import type { FileMetadataInfo } from '../types/filesystemTypes';
import { getFileExtension, getMimeTypeFromExtension } from '../utils/fileUtils';

export class FileMetadata implements FileMetadataInfo {
  public id: string;
  public name: string;
  public path: string;
  public sizeBytes: number;
  public mimeType: string;
  public extension: string;
  public checksumMd5?: string | undefined;
  public createdAtMs: number;
  public updatedAtMs: number;

  constructor(params: {
    id?: string;
    name: string;
    path: string;
    sizeBytes: number;
    mimeType?: string;
    extension?: string;
    checksumMd5?: string;
    createdAtMs?: number;
    updatedAtMs?: number;
  }) {
    const ext = params.extension || getFileExtension(params.name);
    this.id = params.id || `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.name = params.name;
    this.path = params.path;
    this.sizeBytes = params.sizeBytes;
    this.extension = ext;
    this.mimeType = params.mimeType || getMimeTypeFromExtension(ext);
    this.checksumMd5 = params.checksumMd5;
    this.createdAtMs = params.createdAtMs || Date.now();
    this.updatedAtMs = params.updatedAtMs || Date.now();
  }

  public toJSON(): FileMetadataInfo {
    const json: FileMetadataInfo = {
      id: this.id,
      name: this.name,
      path: this.path,
      sizeBytes: this.sizeBytes,
      mimeType: this.mimeType,
      extension: this.extension,
      createdAtMs: this.createdAtMs,
      updatedAtMs: this.updatedAtMs,
    };
    if (this.checksumMd5 !== undefined) {
      json.checksumMd5 = this.checksumMd5;
    }
    return json;
  }
}
