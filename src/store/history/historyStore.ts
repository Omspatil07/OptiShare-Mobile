/**
 * OptiShare History State Store
 *
 * Persistent store for transfer history records and filter state.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '../storage/storage';

export interface HistoryRecord {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  role: 'sender' | 'receiver';
  timestampMs: number;
  durationSeconds: number;
  status: 'completed' | 'failed';
}

export interface HistoryState {
  records: HistoryRecord[];
  searchQuery: string;
  filterRole: 'all' | 'sender' | 'receiver';
}

export interface HistoryActions {
  addRecord: (record: HistoryRecord) => void;
  removeRecord: (recordId: string) => void;
  clearHistory: () => void;
  setSearchQuery: (query: string) => void;
  setFilterRole: (role: 'all' | 'sender' | 'receiver') => void;
}

export type HistoryStore = HistoryState & HistoryActions;

const initialHistoryState: HistoryState = {
  records: [],
  searchQuery: '',
  filterRole: 'all',
};

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      ...initialHistoryState,
      addRecord: (record) =>
        set((state) => ({
          records: [record, ...state.records],
        })),
      removeRecord: (recordId) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== recordId),
        })),
      clearHistory: () => set({ records: [] }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterRole: (role) => set({ filterRole: role }),
    }),
    {
      name: 'optishare-history-store',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
