/**
 * Navigation Test Suite
 *
 * Verifies navigation routes, types, theme adapter, deep linking,
 * navigation helper functions, and placeholder screen rendering.
 */

import React from 'react';

import ReactTestRenderer, { act } from 'react-test-renderer';

import { App } from '../../src/app/App';
import {
  ROUTES,
  getNavigationTheme,
  goBack,
  linking,
  navigate,
  navigationRef,
  reset,
} from '../../src/app/navigation';
import { HistoryScreen } from '../../src/features/history/screens/HistoryScreen';
import { HomeScreen } from '../../src/features/home/screens/HomeScreen';
import { PermissionsScreen } from '../../src/features/home/screens/PermissionsScreen';
import { SplashScreen } from '../../src/features/home/screens/SplashScreen';
import { CameraPreviewScreen } from '../../src/features/receive/screens/CameraPreviewScreen';
import { ReceiveScreen } from '../../src/features/receive/screens/ReceiveScreen';
import { FilePreviewScreen } from '../../src/features/send/screens/FilePreviewScreen';
import { SendScreen } from '../../src/features/send/screens/SendScreen';
import { TransferProgressScreen } from '../../src/features/send/screens/TransferProgressScreen';
import { AboutScreen } from '../../src/features/settings/screens/AboutScreen';
import { SettingsScreen } from '../../src/features/settings/screens/SettingsScreen';
import { Button, ThemeProvider, darkTheme, lightTheme } from '../../src/shared';

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
} as any;

describe('OptiShare Navigation System', () => {
  it('defines valid route constants', () => {
    expect(ROUTES.SPLASH).toBe('Splash');
    expect(ROUTES.MAIN_TABS).toBe('MainTabs');
    expect(ROUTES.HOME_TAB).toBe('HomeTab');
    expect(ROUTES.SEND_TAB).toBe('SendTab');
    expect(ROUTES.RECEIVE_TAB).toBe('ReceiveTab');
    expect(ROUTES.HISTORY_TAB).toBe('HistoryTab');
    expect(ROUTES.SETTINGS_TAB).toBe('SettingsTab');
  });

  it('configures deep linking prefixes and screens', () => {
    expect(linking.prefixes).toContain('optishare://');
    expect(linking.config?.screens).toBeTruthy();
  });

  it('converts OptiShare light and dark themes to navigation themes', () => {
    const lightNavTheme = getNavigationTheme(lightTheme);
    expect(lightNavTheme.dark).toBe(false);
    expect(lightNavTheme.colors.primary).toBe(lightTheme.colors.primary);

    const darkNavTheme = getNavigationTheme(darkTheme);
    expect(darkNavTheme.dark).toBe(true);
    expect(darkNavTheme.colors.primary).toBe(darkTheme.colors.primary);
  });

  it('safely invokes navigation helpers when navigation container is not ready', () => {
    expect(navigationRef).toBeTruthy();
    expect(() => navigate('Splash')).not.toThrow();
    expect(() => goBack()).not.toThrow();
    expect(() => reset('Splash')).not.toThrow();
  });

  it('renders root App component with navigation container', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });
    expect(renderer!.toJSON()).toBeTruthy();
  });

  it('renders all placeholder screens correctly and triggers button callbacks', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <SplashScreen navigation={mockNavigation} route={{} as any} />
          <HomeScreen navigation={mockNavigation} route={{} as any} />
          <PermissionsScreen navigation={mockNavigation} route={{} as any} />
          <SendScreen navigation={mockNavigation} route={{} as any} />
          <FilePreviewScreen navigation={mockNavigation} route={{ params: { fileName: 'test.pdf', fileSize: 1000 } } as any} />
          <TransferProgressScreen navigation={mockNavigation} route={{ params: { role: 'sender' } } as any} />
          <ReceiveScreen navigation={mockNavigation} route={{} as any} />
          <CameraPreviewScreen navigation={mockNavigation} route={{} as any} />
          <HistoryScreen navigation={mockNavigation} route={{} as any} />
          <SettingsScreen navigation={mockNavigation} route={{} as any} />
          <AboutScreen navigation={mockNavigation} route={{} as any} />
        </ThemeProvider>
      );
    });

    const buttons = renderer!.root.findAllByType(Button);
    expect(buttons.length).toBeGreaterThan(0);

    for (const button of buttons) {
      if (button.props.onPress) {
        await act(async () => {
          button.props.onPress();
        });
      }
    }
  });
});
