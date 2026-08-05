/**
 * Typed environment variable access for OptiShare.
 *
 * Uses react-native-config to load environment-specific values
 * from .env.development, .env.staging, or .env.production.
 *
 * @see docs/05-architecture.md — Configuration section
 */

/**
 * All available environment variables.
 * Each variable must be documented here and in .env.example.
 */
interface EnvironmentVariables {
  /** Display name of the application. */
  readonly APP_NAME: string;

  /** Bundle identifier for the application. */
  readonly APP_BUNDLE_ID: string;

  /** Current build environment. */
  readonly BUILD_ENV: 'development' | 'staging' | 'production';

  /** Enable verbose debug logging. */
  readonly ENABLE_DEBUG_LOGGING: string;

  /** Enable performance monitoring instrumentation. */
  readonly ENABLE_PERFORMANCE_MONITORING: string;
}

/**
 * Parsed and validated environment configuration.
 */
interface AppEnvironment {
  readonly appName: string;
  readonly bundleId: string;
  readonly buildEnv: 'development' | 'staging' | 'production';
  readonly isDebugLoggingEnabled: boolean;
  readonly isPerformanceMonitoringEnabled: boolean;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
}

/**
 * Lazily loaded environment configuration.
 *
 * Lazy loading avoids importing react-native-config at module evaluation time,
 * which can cause issues in test environments.
 */
let cachedEnvironment: AppEnvironment | undefined;

/**
 * Returns the current application environment configuration.
 * Values are parsed from environment variables and cached after first access.
 */
export function getEnvironment(): AppEnvironment {
  if (cachedEnvironment !== undefined) {
    return cachedEnvironment;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Config = require('react-native-config').default as EnvironmentVariables;

  cachedEnvironment = {
    appName: Config.APP_NAME ?? 'OptiShare',
    bundleId: Config.APP_BUNDLE_ID ?? 'com.optishare.mobile',
    buildEnv: (Config.BUILD_ENV as AppEnvironment['buildEnv']) ?? 'development',
    isDebugLoggingEnabled: Config.ENABLE_DEBUG_LOGGING === 'true',
    isPerformanceMonitoringEnabled: Config.ENABLE_PERFORMANCE_MONITORING === 'true',
    isDevelopment: Config.BUILD_ENV === 'development',
    isProduction: Config.BUILD_ENV === 'production',
  };

  return cachedEnvironment;
}
