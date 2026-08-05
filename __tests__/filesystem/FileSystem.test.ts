/**
 * File System Layer Unit Test Suite
 *
 * Verifies FileSystemService, FilePickerService, FileManager, TempStorageManager,
 * CacheManager, FileMetadata, FileValidator, and fileUtils.
 */

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
} from '../../src/filesystem';

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
      expect(getMimeTypeFromExtension('unknown')).toBe('application/octet-stream');
    });
  });

  describe('2. FileMetadata Model', () => {
    it('instantiates and serializes metadata accurately', () => {
      const meta = new FileMetadata({
        name: 'sample.pdf',
        path: '/mock/documents/sample.pdf',
        sizeBytes: 1048576,
      });

      expect(meta.name).toBe('sample.pdf');
      expect(meta.extension).toBe('pdf');
      expect(meta.mimeType).toBe('application/pdf');

      const json = meta.toJSON();
      expect(json.name).toBe('sample.pdf');
      expect(json.sizeBytes).toBe(1048576);
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
  });

  describe('4. FileSystemService & Picker', () => {
    it('checks file existence, reads, writes, and gets stats', async () => {
      const exists = await FileSystemService.exists('/mock/path');
      expect(exists).toBe(true);

      await FileSystemService.writeFile('/mock/path', 'test_content');
      const content = await FileSystemService.readFile('/mock/path');
      expect(content).toBe('mock_content');

      const stats = await FileSystemService.getFileStats('/mock/path');
      expect(stats.sizeBytes).toBeGreaterThan(0);
    });

    it('picks single and multiple files via DocumentPicker', async () => {
      const single = await FilePickerService.pickSingleFile();
      expect(single?.name).toBe('sample.pdf');

      const multiple = await FilePickerService.pickMultipleFiles();
      expect(multiple).toHaveLength(1);
    });
  });

  describe('5. File Manager & Temp/Cache Managers', () => {
    it('prepares file metadata and calculates chunk count', async () => {
      const prepared = await FileManager.prepareFileForTransfer('/mock/documents/sample.pdf', 'sample.pdf');
      expect(prepared.metadata.name).toBe('sample.pdf');
      expect(prepared.totalChunks).toBeGreaterThan(0);
    });

    it('handles temporary storage and cache purging', async () => {
      const tempPath = await TempStorageManager.getTempFilePath('tx_123', 'chunk_0.bin');
      expect(tempPath).toContain('tx_123');

      await expect(TempStorageManager.clearTransferTemp('tx_123')).resolves.not.toThrow();
      await expect(CacheManager.purgeCache()).resolves.not.toThrow();
    });
  });
});
