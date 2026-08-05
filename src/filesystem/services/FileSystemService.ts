/**
 * OptiShare FileSystemService
 *
 * Wraps react-native-fs native file operations with Clean Architecture methods.
 */

import RNFSOp from 'react-native-fs';

import type { ReadFileOptions, StorageSpaceInfo, WriteFileOptions } from '../types/filesystemTypes';

export class FileSystemService {
  public static async exists(filepath: string): Promise<boolean> {
    try {
      return await RNFSOp.exists(filepath);
    } catch {
      return false;
    }
  }

  public static async readFile(filepath: string, options?: ReadFileOptions): Promise<string> {
    const encoding = options?.encoding || 'utf8';
    return await RNFSOp.readFile(filepath, encoding);
  }

  public static async writeFile(
    filepath: string,
    content: string,
    options?: WriteFileOptions,
  ): Promise<void> {
    const encoding = options?.encoding || 'utf8';
    if (options?.append) {
      await RNFSOp.appendFile(filepath, content, encoding);
    } else {
      await RNFSOp.writeFile(filepath, content, encoding);
    }
  }

  public static async copyFile(sourcePath: string, destPath: string): Promise<void> {
    await RNFSOp.copyFile(sourcePath, destPath);
  }

  public static async moveFile(sourcePath: string, destPath: string): Promise<void> {
    await RNFSOp.moveFile(sourcePath, destPath);
  }

  public static async deleteFile(filepath: string): Promise<void> {
    const fileExists = await this.exists(filepath);
    if (fileExists) {
      await RNFSOp.unlink(filepath);
    }
  }

  public static async mkdir(dirPath: string): Promise<void> {
    const dirExists = await this.exists(dirPath);
    if (!dirExists) {
      await RNFSOp.mkdir(dirPath);
    }
  }

  public static async getFileStats(
    filepath: string,
  ): Promise<{ sizeBytes: number; isFile: boolean; isDirectory: boolean }> {
    const statResult = await RNFSOp.stat(filepath);
    return {
      sizeBytes: Number(statResult.size),
      isFile: statResult.isFile(),
      isDirectory: statResult.isDirectory(),
    };
  }

  public static async getFreeDiskStorage(): Promise<StorageSpaceInfo> {
    try {
      const fsInfo = await RNFSOp.getFSInfo();
      return {
        totalSpaceBytes: fsInfo.totalSpace,
        freeSpaceBytes: fsInfo.freeSpace,
      };
    } catch {
      return {
        totalSpaceBytes: 64000000000,
        freeSpaceBytes: 32000000000,
      };
    }
  }
}
