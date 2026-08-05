/**
 * OptiShare useFileSystem React Hook
 *
 * Reusable custom hook for file picking, metadata extraction, and storage operations.
 */

import { useCallback, useState } from 'react';

import { FileManager } from '../managers/FileManager';
import { FilePickerService } from '../services/FilePickerService';
import type { FileMetadataInfo, FilePickerResult } from '../types/filesystemTypes';

export function useFileSystem() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pickSingleFile = useCallback(async (): Promise<FilePickerResult | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const file = await FilePickerService.pickSingleFile();
      setIsLoading(false);
      return file;
    } catch (err) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Failed to pick file.';
      setError(msg);
      return null;
    }
  }, []);

  const prepareFile = useCallback(
    async (
      filepath: string,
      filename: string,
    ): Promise<{ metadata: FileMetadataInfo; totalChunks: number } | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await FileManager.prepareFileForTransfer(filepath, filename);
        setIsLoading(false);
        return result;
      } catch (err) {
        setIsLoading(false);
        const msg = err instanceof Error ? err.message : 'Failed to prepare file.';
        setError(msg);
        return null;
      }
    },
    [],
  );

  return {
    isLoading,
    error,
    pickSingleFile,
    prepareFile,
  };
}
