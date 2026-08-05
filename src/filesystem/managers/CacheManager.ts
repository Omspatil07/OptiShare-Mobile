/**
 * OptiShare CacheManager
 *
 * Manages application cache directory size calculations and cache purge.
 */

import { FILESYSTEM_PATHS } from '../constants/filesystemConstants';
import { FileSystemService } from '../services/FileSystemService';

export class CacheManager {
  public static async getCacheSize(): Promise<number> {
    try {
      const stats = await FileSystemService.getFileStats(FILESYSTEM_PATHS.CACHE_DIR);
      return stats.sizeBytes;
    } catch {
      return 0;
    }
  }

  public static async purgeCache(): Promise<void> {
    await FileSystemService.deleteFile(FILESYSTEM_PATHS.CACHE_DIR);
    await FileSystemService.mkdir(FILESYSTEM_PATHS.CACHE_DIR);
  }
}
