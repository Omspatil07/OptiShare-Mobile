/**
 * Jest setup file for OptiShare.
 *
 * Configures React Native Testing Library and provides
 * mock implementations for native modules.
 *
 * @see docs/14-testing-strategy.md
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
