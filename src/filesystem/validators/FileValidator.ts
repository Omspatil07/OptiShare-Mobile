/**
 * OptiShare FileValidator
 *
 * Validates file sizes, extension support, and available storage space.
 */

import { FILE_LIMITS } from '../constants/filesystemConstants';
import type { FileValidationResult } from '../types/filesystemTypes';
import { getFileExtension, isSupportedExtension } from '../utils/fileUtils';

export class FileValidator {
  public static validateFile(
    fileSizeBytes: number,
    fileName: string,
    availableStorageBytes?: number,
  ): FileValidationResult {
    if (fileSizeBytes <= 0) {
      return {
        isValid: false,
        errorCode: 'FILE_NOT_FOUND',
        errorMessage: 'File does not exist or has zero size.',
      };
    }

    if (fileSizeBytes > FILE_LIMITS.MAX_FILE_SIZE_BYTES) {
      return {
        isValid: false,
        errorCode: 'FILE_TOO_LARGE',
        errorMessage: `File exceeds maximum allowed size of ${
          FILE_LIMITS.MAX_FILE_SIZE_BYTES / 1024 / 1024
        } MB.`,
      };
    }

    const extension = getFileExtension(fileName);
    if (extension && !isSupportedExtension(extension)) {
      return {
        isValid: false,
        errorCode: 'UNSUPPORTED_TYPE',
        errorMessage: `Unsupported file extension '.${extension}'.`,
      };
    }

    if (
      availableStorageBytes !== undefined &&
      availableStorageBytes < fileSizeBytes + FILE_LIMITS.MIN_FREE_STORAGE_BYTES
    ) {
      return {
        isValid: false,
        errorCode: 'INSUFFICIENT_STORAGE',
        errorMessage: 'Insufficient storage space available on device.',
      };
    }

    return { isValid: true };
  }
}
