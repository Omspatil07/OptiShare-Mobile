import { APP_VERSION, DEFAULT_FRAME_RATE, MAX_FILE_SIZE_BYTES } from '@app/config/constants';
import { getEnvironment } from '@app/config/environment';

describe('App Config', () => {
  it('has correct constant values', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(100 * 1024 * 1024);
    expect(DEFAULT_FRAME_RATE).toBe(4);
    expect(APP_VERSION).toBe('0.1.0');
  });

  it('loads environment correctly', () => {
    const env = getEnvironment();
    expect(env.appName).toBeDefined();
    expect(env.isDevelopment).toBeDefined();
  });
});
