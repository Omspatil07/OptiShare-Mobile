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

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn(({ children }) => children),
    SafeAreaView: jest.fn(({ children }) => children),
    useSafeAreaInsets: jest.fn(() => inset),
    useSafeAreaFrame: jest.fn(() => ({ x: 0, y: 0, width: 390, height: 844 })),
  };
});
