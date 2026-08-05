/**
 * OptiShare File Selection State Store
 *
 * Manages selected files for optical transmission, metadata, and chunk configuration.
 */

import { create } from 'zustand';

export interface SelectedFileItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  path: string;
}

export interface FileState {
  selectedFiles: SelectedFileItem[];
  totalSizeBytes: number;
  activeFileId: string | null;
}

export interface FileActions {
  addFile: (file: SelectedFileItem) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  setActiveFile: (fileId: string | null) => void;
}

export type FileStore = FileState & FileActions;

const initialFileState: FileState = {
  selectedFiles: [],
  totalSizeBytes: 0,
  activeFileId: null,
};

export const useFileStore = create<FileStore>((set) => ({
  ...initialFileState,
  addFile: (file) =>
    set((state) => {
      const exists = state.selectedFiles.some((f) => f.id === file.id);
      if (exists) {
        return state;
      }
      const updatedFiles = [...state.selectedFiles, file];
      const totalSize = updatedFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
      return {
        selectedFiles: updatedFiles,
        totalSizeBytes: totalSize,
        activeFileId: state.activeFileId ?? file.id,
      };
    }),
  removeFile: (fileId) =>
    set((state) => {
      const updatedFiles = state.selectedFiles.filter((f) => f.id !== fileId);
      const totalSize = updatedFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
      return {
        selectedFiles: updatedFiles,
        totalSizeBytes: totalSize,
        activeFileId:
          state.activeFileId === fileId ? updatedFiles[0]?.id ?? null : state.activeFileId,
      };
    }),
  clearFiles: () => set(initialFileState),
  setActiveFile: (fileId) => set({ activeFileId: fileId }),
}));
