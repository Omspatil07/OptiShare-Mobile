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
