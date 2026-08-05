/**
 * OptiShare FileManager
 *
 * High-level manager orchestrating file validation, metadata extraction,
 * and chunking calculations for optical transfers.
 */

import { FILE_LIMITS } from '../constants/filesystemConstants';
import { FileMetadata } from '../models/FileMetadata';
import { FileSystemService } from '../services/FileSystemService';
import type { FileMetadataInfo } from '../types/filesystemTypes';
import { FileValidator } from '../validators/FileValidator';

export class FileManager {
  public static async prepareFileForTransfer(
    filepath: string,
    filename: string,
  ): Promise<{ metadata: FileMetadataInfo; totalChunks: number }> {
    const stats = await FileSystemService.getFileStats(filepath);
    const freeSpace = await FileSystemService.getFreeDiskStorage();

    const validation = FileValidator.validateFile(
      stats.sizeBytes,
      filename,
      freeSpace.freeSpaceBytes,
    );
    if (!validation.isValid) {
      throw new Error(validation.errorMessage || 'Invalid file for transfer.');
    }

    const metadata = new FileMetadata({
      name: filename,
      path: filepath,
      sizeBytes: stats.sizeBytes,
    });

    const totalChunks = Math.ceil(stats.sizeBytes / FILE_LIMITS.MAX_CHUNK_SIZE_BYTES);

    return {
      metadata: metadata.toJSON(),
      totalChunks,
    };
  }

  public static async saveReceivedFile(
    destDirectory: string,
    filename: string,
    sourcePath: string,
  ): Promise<string> {
    await FileSystemService.mkdir(destDirectory);
    const targetPath = `${destDirectory}/${filename}`;
    await FileSystemService.moveFile(sourcePath, targetPath);
    return targetPath;
  }
}
