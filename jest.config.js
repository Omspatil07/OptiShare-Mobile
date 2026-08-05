/**
 * Jest configuration for OptiShare.
 *
 * Uses the React Native preset with path alias resolution
 * and coverage thresholds per docs/14-testing-strategy.md.
 *
 * @see docs/14-testing-strategy.md
 */
module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  forceExit: true,
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-config|react-native-safe-area-context|react-native-permissions|react-native-fs|react-native-document-picker|react-native-mmkv|react-native-vision-camera|zustand|qrcode|jsqr)/)',
  ],
};
