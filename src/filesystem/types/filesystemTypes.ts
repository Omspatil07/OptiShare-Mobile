/**
 * OptiShare File System Layer - Type Definitions
 */

export interface FileMetadataInfo {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
  extension: string;
  checksumMd5?: string | undefined;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ReadFileOptions {
  encoding?: 'utf8' | 'ascii' | 'base64';
}

export interface WriteFileOptions {
  encoding?: 'utf8' | 'ascii' | 'base64';
  append?: boolean;
}

export interface FilePickerResult {
  uri: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
}

export interface StorageSpaceInfo {
  totalSpaceBytes: number;
  freeSpaceBytes: number;
}

export interface FileValidationResult {
  isValid: boolean;
  errorCode?:
    | 'FILE_NOT_FOUND'
    | 'FILE_TOO_LARGE'
    | 'UNSUPPORTED_TYPE'
    | 'INSUFFICIENT_STORAGE'
    | undefined;
  errorMessage?: string | undefined;
}
