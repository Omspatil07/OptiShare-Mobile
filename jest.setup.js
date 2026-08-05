/**
 * Jest setup file for OptiShare.
 *
 * Configures React Native Testing Library and provides
 * mock implementations for native modules.
 */

// Native module mocks for Jest environment
jest.mock('react-native-config', () => ({
  default: {
    APP_NAME: 'OptiShare',
    APP_BUNDLE_ID: 'com.optishare.mobile',
    BUILD_ENV: 'development',
    ENABLE_DEBUG_LOGGING: 'true',
    ENABLE_PERFORMANCE_MONITORING: 'false',
  },
}));

// Mock react-native-safe-area-context using official package mock
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  CachesDirectoryPath: '/mock/cache',
  TemporaryDirectoryPath: '/mock/tmp',
  ExternalDirectoryPath: '/mock/external',
  DownloadDirectoryPath: '/mock/downloads',
  readFile: jest.fn(() => Promise.resolve('mock_content')),
  writeFile: jest.fn(() => Promise.resolve(true)),
  unlink: jest.fn(() => Promise.resolve(true)),
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve(true)),
  moveFile: jest.fn(() => Promise.resolve(true)),
  copyFile: jest.fn(() => Promise.resolve(true)),
  stat: jest.fn(() =>
    Promise.resolve({
      name: 'sample.pdf',
      path: '/mock/documents/sample.pdf',
      size: 1024000,
      isFile: () => true,
      isDirectory: () => false,
      mtime: new Date('2026-08-05T00:00:00Z'),
      ctime: new Date('2026-08-05T00:00:00Z'),
    })
  ),
  getFSInfo: jest.fn(() => Promise.resolve({ totalSpace: 64000000000, freeSpace: 32000000000 })),
}));

// Mock react-native-document-picker
jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(() =>
    Promise.resolve([
      {
        uri: 'file:///mock/documents/sample.pdf',
        name: 'sample.pdf',
        size: 1024000,
        type: 'application/pdf',
      },
    ])
  ),
  pickSingle: jest.fn(() =>
    Promise.resolve({
      uri: 'file:///mock/documents/sample.pdf',
      name: 'sample.pdf',
      size: 1024000,
      type: 'application/pdf',
    })
  ),
  types: {
    allFiles: '*/*',
    images: 'image/*',
    pdf: 'application/pdf',
    audio: 'audio/*',
    video: 'video/*',
  },
  isCancel: jest.fn((err) => err?.message === 'User canceled'),
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(() => Promise.resolve('granted')),
  request: jest.fn(() => Promise.resolve('granted')),
  checkMultiple: jest.fn(() => Promise.resolve({ 'android.permission.CAMERA': 'granted' })),
  requestMultiple: jest.fn(() => Promise.resolve({ 'android.permission.CAMERA': 'granted' })),
  openSettings: jest.fn(() => Promise.resolve(true)),
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    GRANTED: 'granted',
    LIMITED: 'limited',
  },
  PERMISSIONS: {
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
      WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
      READ_MEDIA_IMAGES: 'android.permission.READ_MEDIA_IMAGES',
      READ_MEDIA_VIDEO: 'android.permission.READ_MEDIA_VIDEO',
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
      PHOTO_LIBRARY_ADD_ONLY: 'ios.permission.PHOTO_LIBRARY_ADD_ONLY',
    },
  },
}));
