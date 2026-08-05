/**
 * File System Layer Unit Test Suite
 *
 * Verifies FileSystemService, FilePickerService, FileManager, TempStorageManager,
 * CacheManager, FileMetadata, FileValidator, fileUtils, and useFileSystem hook.
 */

import React from 'react';

import ReactTestRenderer, { act } from 'react-test-renderer';

import {
  CacheManager,
  FileManager,
  FileMetadata,
  FilePickerService,
  FileSystemService,
  FileValidator,
  TempStorageManager,
  formatFileSize,
  getFileExtension,
  getMimeTypeFromExtension,
  isSupportedExtension,
  sanitizeFileName,
  useFileSystem,
} from '../../src/filesystem';

function TestHookConsumer({
  onMount,
}: {
  onMount: (hookData: ReturnType<typeof useFileSystem>) => void;
}): React.JSX.Element | null {
  const hookData = useFileSystem();
  React.useEffect(() => {
    onMount(hookData);
  }, [hookData, onMount]);
  return null;
}

describe('OptiShare File System Layer', () => {
  describe('1. File Utilities', () => {
    it('formats file sizes into human-readable strings', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1048576 * 15)).toBe('15.00 MB');
      expect(formatFileSize(1073741824 * 2)).toBe('2.00 GB');
    });

    it('extracts file extensions accurately', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('/path/to/archive.tar.gz')).toBe('gz');
      expect(getFileExtension('noextension')).toBe('');
    });

    it('validates supported file extensions', () => {
      expect(isSupportedExtension('pdf')).toBe(true);
      expect(isSupportedExtension('.png')).toBe(true);
      expect(isSupportedExtension('exe')).toBe(false);
    });

    it('sanitizes file names', () => {
      expect(sanitizeFileName('my file name#1.pdf')).toBe('my_file_name_1.pdf');
    });

    it('maps file extensions to MIME types', () => {
      expect(getMimeTypeFromExtension('pdf')).toBe('application/pdf');
      expect(getMimeTypeFromExtension('png')).toBe('image/png');
      expect(getMimeTypeFromExtension('jpg')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('gif')).toBe('image/gif');
      expect(getMimeTypeFromExtension('webp')).toBe('image/webp');
      expect(getMimeTypeFromExtension('mp4')).toBe('video/mp4');
      expect(getMimeTypeFromExtension('zip')).toBe('application/zip');
      expect(getMimeTypeFromExtension('txt')).toBe('text/plain');
      expect(getMimeTypeFromExtension('json')).toBe('application/json');
      expect(getMimeTypeFromExtension('unknown')).toBe('application/octet-stream');
    });
  });

  describe('2. FileMetadata Model', () => {
    it('instantiates and serializes metadata accurately', () => {
      const meta = new FileMetadata({
        name: 'sample.pdf',
        path: '/mock/documents/sample.pdf',
        sizeBytes: 1048576,
        checksumMd5: 'md5_hash_sample',
      });

      expect(meta.name).toBe('sample.pdf');
      expect(meta.extension).toBe('pdf');
      expect(meta.mimeType).toBe('application/pdf');
      expect(meta.checksumMd5).toBe('md5_hash_sample');

      const json = meta.toJSON();
      expect(json.name).toBe('sample.pdf');
      expect(json.sizeBytes).toBe(1048576);
      expect(json.checksumMd5).toBe('md5_hash_sample');
    });
  });

  describe('3. FileValidator', () => {
    it('validates valid files', () => {
      const result = FileValidator.validateFile(1024000, 'sample.pdf');
      expect(result.isValid).toBe(true);
    });

    it('rejects non-existent or zero-byte files', () => {
      const result = FileValidator.validateFile(0, 'empty.txt');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('FILE_NOT_FOUND');
    });

    it('rejects files exceeding 500MB size limit', () => {
      const result = FileValidator.validateFile(600000000, 'huge.mp4');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
    });

    it('rejects unsupported file extensions', () => {
      const result = FileValidator.validateFile(1024, 'malware.exe');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('UNSUPPORTED_TYPE');
    });

    it('rejects files when device storage space is insufficient', () => {
      const result = FileValidator.validateFile(104857600, 'large.pdf', 50000000);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INSUFFICIENT_STORAGE');
    });
  });

  describe('4. FileSystemService & Picker', () => {
    it('checks file existence, reads, writes, copies, moves, and deletes', async () => {
      const exists = await FileSystemService.exists('/mock/path');
      expect(exists).toBe(true);

      await FileSystemService.writeFile('/mock/path', 'test_content');
      await FileSystemService.writeFile('/mock/path', 'append_content', { append: true });
      const content = await FileSystemService.readFile('/mock/path');
      expect(content).toBe('mock_content');

      await FileSystemService.copyFile('/mock/source', '/mock/dest');
      await FileSystemService.moveFile('/mock/source', '/mock/dest');
      await FileSystemService.mkdir('/mock/dir');
      await FileSystemService.deleteFile('/mock/path');

      const stats = await FileSystemService.getFileStats('/mock/path');
      expect(stats.sizeBytes).toBeGreaterThan(0);

      const free = await FileSystemService.getFreeDiskStorage();
      expect(free.freeSpaceBytes).toBeGreaterThan(0);
    });

    it('picks single and multiple files via DocumentPicker', async () => {
      const single = await FilePickerService.pickSingleFile();
      expect(single?.name).toBe('sample.pdf');

      const multiple = await FilePickerService.pickMultipleFiles();
      expect(multiple).toHaveLength(1);
    });
  });

  describe('5. File Manager & Temp/Cache Managers', () => {
    it('prepares file metadata and saves received files', async () => {
      const prepared = await FileManager.prepareFileForTransfer('/mock/documents/sample.pdf', 'sample.pdf');
      expect(prepared.metadata.name).toBe('sample.pdf');
      expect(prepared.totalChunks).toBeGreaterThan(0);

      const savedPath = await FileManager.saveReceivedFile('/mock/downloads', 'sample.pdf', '/mock/tmp/sample.pdf');
      expect(savedPath).toBe('/mock/downloads/sample.pdf');
    });

    it('handles temporary storage and cache purging', async () => {
      const tempPath = await TempStorageManager.getTempFilePath('tx_123', 'chunk_0.bin');
      expect(tempPath).toContain('tx_123');

      await TempStorageManager.appendChunkData(tempPath, 'chunk_base64_data');
      await expect(TempStorageManager.clearTransferTemp('tx_123')).resolves.not.toThrow();
      await expect(TempStorageManager.clearAllTempStorage()).resolves.not.toThrow();

      const cacheSize = await CacheManager.getCacheSize();
      expect(cacheSize).toBeGreaterThanOrEqual(0);
      await expect(CacheManager.purgeCache()).resolves.not.toThrow();
    });
  });

  describe('6. useFileSystem React Hook', () => {
    it('executes hook picking and file preparation callbacks', async () => {
      let hookResult: ReturnType<typeof useFileSystem> | null = null;

      await act(async () => {
        ReactTestRenderer.create(
          <TestHookConsumer
            onMount={(data) => {
              hookResult = data;
            }}
          />
        );
      });

      expect(hookResult).not.toBeNull();

      let picked: any = null;
      let prepared: any = null;

      await act(async () => {
        picked = await hookResult?.pickSingleFile();
        prepared = await hookResult?.prepareFile('/mock/documents/sample.pdf', 'sample.pdf');
      });

      expect(picked?.name).toBe('sample.pdf');
      expect(prepared?.metadata.name).toBe('sample.pdf');
    });
  });
});
