/**
 * OptiShare Transfer State Store
 *
 * Tracks active optical transfer session, role, progress, speed, and status.
 */

import { create } from 'zustand';

export type TransferRole = 'sender' | 'receiver' | null;
export type TransferStatus =
  | 'idle'
  | 'preparing'
  | 'transferring'
  | 'paused'
  | 'completed'
  | 'error';

export interface TransferState {
  transferId: string | null;
  role: TransferRole;
  status: TransferStatus;
  progressPercentage: number;
  currentFrame: number;
  totalFrames: number;
  transferSpeedMbps: number;
  elapsedSeconds: number;
  errorMessage: string | null;
}

export interface TransferActions {
  startTransfer: (id: string, role: TransferRole, totalFrames: number) => void;
  updateProgress: (currentFrame: number, speedMbps: number, elapsed: number) => void;
  setTransferStatus: (status: TransferStatus) => void;
  setTransferError: (error: string) => void;
  resetTransfer: () => void;
}

export type TransferStore = TransferState & TransferActions;

const initialTransferState: TransferState = {
  transferId: null,
  role: null,
  status: 'idle',
  progressPercentage: 0,
  currentFrame: 0,
  totalFrames: 0,
  transferSpeedMbps: 0,
  elapsedSeconds: 0,
  errorMessage: null,
};

export const useTransferStore = create<TransferStore>((set) => ({
  ...initialTransferState,
  startTransfer: (id, role, totalFrames) =>
    set({
      transferId: id,
      role,
      status: 'preparing',
      totalFrames,
      currentFrame: 0,
      progressPercentage: 0,
      errorMessage: null,
    }),
  updateProgress: (currentFrame, speedMbps, elapsed) =>
    set((state) => {
      const percentage =
        state.totalFrames > 0 ? Math.min(100, (currentFrame / state.totalFrames) * 100) : 0;
      return {
        currentFrame,
        progressPercentage: Number(percentage.toFixed(1)),
        transferSpeedMbps: speedMbps,
        elapsedSeconds: elapsed,
        status: percentage >= 100 ? 'completed' : 'transferring',
      };
    }),
  setTransferStatus: (status) => set({ status }),
  setTransferError: (error) => set({ status: 'error', errorMessage: error }),
  resetTransfer: () => set(initialTransferState),
}));
