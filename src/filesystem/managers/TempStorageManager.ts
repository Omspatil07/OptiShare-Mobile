/**
 * OptiShare TempStorageManager
 *
 * Manages optical transfer frame assembly temporary files and directory cleanup.
 */

import { FILESYSTEM_PATHS } from '../constants/filesystemConstants';
import { FileSystemService } from '../services/FileSystemService';

export class TempStorageManager {
  public static async getTempFilePath(transferId: string, filename: string): Promise<string> {
    const transferTempDir = `${FILESYSTEM_PATHS.TEMP_DIR}/${transferId}`;
    await FileSystemService.mkdir(transferTempDir);
    return `${transferTempDir}/${filename}`;
  }

  public static async appendChunkData(filepath: string, chunkData: string): Promise<void> {
    await FileSystemService.writeFile(filepath, chunkData, { append: true, encoding: 'base64' });
  }

  public static async clearTransferTemp(transferId: string): Promise<void> {
    const transferTempDir = `${FILESYSTEM_PATHS.TEMP_DIR}/${transferId}`;
    await FileSystemService.deleteFile(transferTempDir);
  }

  public static async clearAllTempStorage(): Promise<void> {
    await FileSystemService.deleteFile(FILESYSTEM_PATHS.TEMP_DIR);
    await FileSystemService.mkdir(FILESYSTEM_PATHS.TEMP_DIR);
  }
}
