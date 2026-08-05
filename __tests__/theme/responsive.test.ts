/**
 * Responsive Utilities Test Suite
 */

import { responsive } from '../../src/shared/theme/responsive';

describe('responsive utilities', () => {
  it('calculates screen dimensions and breakpoints', () => {
    expect(responsive.screenWidth).toBeGreaterThan(0);
    expect(responsive.screenHeight).toBeGreaterThan(0);
    expect(typeof responsive.isSmallDevice).toBe('boolean');
    expect(typeof responsive.isTablet).toBe('boolean');
  });

  it('scales sizes proportionally', () => {
    const scaled = responsive.scale(16);
    expect(typeof scaled).toBe('number');
    expect(scaled).toBeGreaterThan(0);

    const verticalScaled = responsive.verticalScale(20);
    expect(typeof verticalScaled).toBe('number');
    expect(verticalScaled).toBeGreaterThan(0);

    const moderateScaled = responsive.moderateScale(16, 0.5);
    expect(typeof moderateScaled).toBe('number');
    expect(moderateScaled).toBeGreaterThan(0);
  });
});
