/**
 * OptiShare Zustand Store Unit Test Suite
 *
 * Tests state initializations, actions, mutations, selectors, and persistence fallback.
 */

import {
  selectActiveModal,
  selectFilteredHistory,
  selectHasCameraPermission,
  selectIsAppReady,
  selectIsCameraActive,
  selectSelectedFiles,
  selectTargetFps,
  selectTransferProgress,
  useAppStore,
  useCameraStore,
  useFileStore,
  useHistoryStore,
  usePermissionStore,
  useSettingsStore,
  useThemeStore,
  useTransferStore,
} from '../../src/store';

describe('OptiShare Global State Management (Zustand Stores)', () => {
  beforeEach(() => {
    useAppStore.getState().resetAppStore();
    useSettingsStore.getState().resetSettings();
    useTransferStore.getState().resetTransfer();
    useFileStore.getState().clearFiles();
    usePermissionStore.getState().resetPermissions();
    useCameraStore.getState().resetCameraState();
    useHistoryStore.getState().clearHistory();
    useThemeStore.getState().setThemeMode('system');
  });

  describe('1. appStore', () => {
    it('updates initialization, ready state, and active modal', () => {
      const store = useAppStore.getState();
      expect(selectIsAppReady(useAppStore.getState())).toBe(false);

      store.setInitialized(true);
      store.setReady(true);
      store.openModal('permissions_modal');

      expect(useAppStore.getState().isInitialized).toBe(true);
      expect(selectIsAppReady(useAppStore.getState())).toBe(true);
      expect(selectActiveModal(useAppStore.getState())).toBe('permissions_modal');

      store.closeModal();
      expect(selectActiveModal(useAppStore.getState())).toBeNull();
    });
  });

  describe('2. settingsStore', () => {
    it('updates FPS, brightness, folder, and toggles vibration', () => {
      const store = useSettingsStore.getState();
      expect(selectTargetFps(useSettingsStore.getState())).toBe(60);

      store.setTargetFps(120);
      store.setScreenBrightness(0.9);
      store.toggleVibration();
      store.setSaveFolderPath('/custom/path');

      expect(selectTargetFps(useSettingsStore.getState())).toBe(120);
      expect(useSettingsStore.getState().screenBrightness).toBe(0.9);
      expect(useSettingsStore.getState().enableVibration).toBe(false);
      expect(useSettingsStore.getState().saveFolderPath).toBe('/custom/path');
    });
  });

  describe('3. transferStore', () => {
    it('manages transfer lifecycle, progress updates, and completion', () => {
      const store = useTransferStore.getState();
      store.startTransfer('tx_101', 'sender', 100);

      expect(useTransferStore.getState().transferId).toBe('tx_101');
      expect(useTransferStore.getState().status).toBe('preparing');

      store.updateProgress(50, 2.5, 10);
      expect(selectTransferProgress(useTransferStore.getState())).toBe(50);
      expect(useTransferStore.getState().status).toBe('transferring');

      store.updateProgress(100, 3.0, 20);
      expect(selectTransferProgress(useTransferStore.getState())).toBe(100);
      expect(useTransferStore.getState().status).toBe('completed');
    });
  });

  describe('4. fileStore', () => {
    it('adds, removes, and calculates total file sizes', () => {
      const store = useFileStore.getState();
      const file1 = { id: 'f1', name: 'a.pdf', sizeBytes: 1000, mimeType: 'application/pdf', path: '/a.pdf' };
      const file2 = { id: 'f2', name: 'b.zip', sizeBytes: 2000, mimeType: 'application/zip', path: '/b.zip' };

      store.addFile(file1);
      store.addFile(file2);

      expect(selectSelectedFiles(useFileStore.getState())).toHaveLength(2);
      expect(useFileStore.getState().totalSizeBytes).toBe(3000);

      store.removeFile('f1');
      expect(selectSelectedFiles(useFileStore.getState())).toHaveLength(1);
      expect(useFileStore.getState().totalSizeBytes).toBe(2000);
    });
  });

  describe('5. permissionStore', () => {
    it('manages camera, storage, and notification permissions', () => {
      const store = usePermissionStore.getState();
      expect(selectHasCameraPermission(usePermissionStore.getState())).toBe(false);

      store.setCameraPermission('granted');
      store.setStoragePermission('granted');

      expect(selectHasCameraPermission(usePermissionStore.getState())).toBe(true);
      expect(usePermissionStore.getState().storagePermission).toBe('granted');
    });
  });

  describe('6. cameraStore', () => {
    it('manages camera stream, zoom, flash, and alignment score', () => {
      const store = useCameraStore.getState();
      expect(selectIsCameraActive(useCameraStore.getState())).toBe(false);

      store.setCameraActive(true);
      store.setZoomLevel(2.0);
      store.toggleFlash();
      store.setAlignment(true, 95);

      expect(selectIsCameraActive(useCameraStore.getState())).toBe(true);
      expect(useCameraStore.getState().zoomLevel).toBe(2.0);
      expect(useCameraStore.getState().isFlashOn).toBe(true);
      expect(useCameraStore.getState().isAligned).toBe(true);
      expect(useCameraStore.getState().alignmentQualityScore).toBe(95);
    });
  });

  describe('7. historyStore', () => {
    it('adds history records and filters by query and role', () => {
      const store = useHistoryStore.getState();
      store.addRecord({
        id: 'h1',
        fileName: 'report.pdf',
        fileSizeBytes: 5000,
        role: 'sender',
        timestampMs: Date.now(),
        durationSeconds: 5,
        status: 'completed',
      });
      store.addRecord({
        id: 'h2',
        fileName: 'photo.jpg',
        fileSizeBytes: 2000,
        role: 'receiver',
        timestampMs: Date.now(),
        durationSeconds: 2,
        status: 'completed',
      });

      expect(useHistoryStore.getState().records).toHaveLength(2);

      store.setSearchQuery('report');
      let filtered = selectFilteredHistory(useHistoryStore.getState());
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.fileName).toBe('report.pdf');

      store.setSearchQuery('');
      store.setFilterRole('receiver');
      filtered = selectFilteredHistory(useHistoryStore.getState());
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.role).toBe('receiver');
    });
  });

  describe('8. themeStore', () => {
    it('toggles theme mode between light and dark', () => {
      const store = useThemeStore.getState();
      store.setThemeMode('dark');
      expect(useThemeStore.getState().mode).toBe('dark');

      store.toggleThemeMode();
      expect(useThemeStore.getState().mode).toBe('light');
    });
  });
});
