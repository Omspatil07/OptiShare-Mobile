/**
 * OptiShare File System Layer - Constants
 */

import RNFSOp from 'react-native-fs';

export const FILESYSTEM_PATHS = {
  APP_DIR: RNFSOp.DocumentDirectoryPath || '/data/user/0/com.optishare.mobile/files',
  TEMP_DIR: RNFSOp.TemporaryDirectoryPath || '/data/user/0/com.optishare.mobile/cache/tmp',
  CACHE_DIR: RNFSOp.CachesDirectoryPath || '/data/user/0/com.optishare.mobile/cache',
  DOWNLOADS_DIR: RNFSOp.DownloadDirectoryPath || '/storage/emulated/0/Download/OptiShare',
} as const;

export const FILE_LIMITS = {
  MAX_FILE_SIZE_BYTES: 524288000, // 500 MB
  MAX_CHUNK_SIZE_BYTES: 65536, // 64 KB per frame chunk
  MIN_FREE_STORAGE_BYTES: 104857600, // 100 MB required buffer
} as const;

export const SUPPORTED_FILE_EXTENSIONS = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'mp4',
  'zip',
  'txt',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'json',
] as const;
