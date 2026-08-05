/**
 * OptiShare App State Store
 *
 * Manages global app initialization, ready state, active modal, and error state.
 */

import { create } from 'zustand';

export interface AppState {
  isInitialized: boolean;
  isReady: boolean;
  activeModal: string | null;
  errorMessage: string | null;
}

export interface AppActions {
  setInitialized: (initialized: boolean) => void;
  setReady: (ready: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setError: (message: string | null) => void;
  resetAppStore: () => void;
}

export type AppStore = AppState & AppActions;

const initialAppState: AppState = {
  isInitialized: false,
  isReady: false,
  activeModal: null,
  errorMessage: null,
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialAppState,
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setReady: (ready) => set({ isReady: ready }),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  setError: (message) => set({ errorMessage: message }),
  resetAppStore: () => set(initialAppState),
}));
