/**
 * OptiShare FilePickerService
 *
 * Provides document picker abstraction using react-native-document-picker.
 */

import DocumentPicker, { isCancel, types } from 'react-native-document-picker';

import type { FilePickerResult } from '../types/filesystemTypes';

export class FilePickerService {
  public static async pickSingleFile(): Promise<FilePickerResult | null> {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [types.allFiles],
      });
      return {
        uri: res.uri,
        name: res.name || 'unnamed_file',
        sizeBytes: res.size || 0,
        mimeType: res.type || 'application/octet-stream',
      };
    } catch (err) {
      if (isCancel(err)) {
        return null;
      }
      throw err;
    }
  }

  public static async pickMultipleFiles(): Promise<FilePickerResult[]> {
    try {
      const results = await DocumentPicker.pick({
        type: [types.allFiles],
        allowMultiSelection: true,
      });
      return results.map((res) => ({
        uri: res.uri,
        name: res.name || 'unnamed_file',
        sizeBytes: res.size || 0,
        mimeType: res.type || 'application/octet-stream',
      }));
    } catch (err) {
      if (isCancel(err)) {
        return [];
      }
      throw err;
    }
  }
}
