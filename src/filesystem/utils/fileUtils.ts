/**
 * OptiShare File System Utilities
 */

import { SUPPORTED_FILE_EXTENSIONS } from '../constants/filesystemConstants';

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const count = (bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2);
  return `${count} ${units[index] || 'GB'}`;
}

export function getFileExtension(filenameOrPath: string): string {
  const cleanPath = filenameOrPath.split('?')[0] || filenameOrPath;
  const lastDot = cleanPath.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) {
    return '';
  }
  return cleanPath.slice(lastDot + 1).toLowerCase();
}

export function isSupportedExtension(extension: string): boolean {
  const cleanExt = extension.toLowerCase().replace(/^\./, '');
  return (SUPPORTED_FILE_EXTENSIONS as readonly string[]).includes(cleanExt);
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

export function getMimeTypeFromExtension(extension: string): string {
  const ext = extension.toLowerCase().replace(/^\./, '');
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'mp4':
      return 'video/mp4';
    case 'zip':
      return 'application/zip';
    case 'txt':
      return 'text/plain';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}
