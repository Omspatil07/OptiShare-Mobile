/**
 * OptiShare Navigation - Bottom Tab Navigator
 *
 * Configures main tabs: Home, Send, Receive, History, Settings.
 */

import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ROUTES } from './routes';
import type { TabParamList } from './types';
import { HistoryScreen } from '../../features/history/screens/HistoryScreen';
import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { ReceiveScreen } from '../../features/receive/screens/ReceiveScreen';
import { SendScreen } from '../../features/send/screens/SendScreen';
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen';
import { Icon, useTheme } from '../../shared';

const Tab = createBottomTabNavigator<TabParamList>();

const renderHomeIcon = ({ color, size }: { color: string; size: number }): React.JSX.Element => (
  <Icon color={color} name="sun" size={size} />
);
const renderSendIcon = ({ color, size }: { color: string; size: number }): React.JSX.Element => (
  <Icon color={color} name="check" size={size} />
);
const renderReceiveIcon = ({ color, size }: { color: string; size: number }): React.JSX.Element => (
  <Icon color={color} name="search" size={size} />
);
const renderHistoryIcon = ({ color, size }: { color: string; size: number }): React.JSX.Element => (
  <Icon color={color} name="copy" size={size} />
);
const renderSettingsIcon = ({
  color,
  size,
}: {
  color: string;
  size: number;
}): React.JSX.Element => <Icon color={color} name="info" size={size} />;

export function TabNavigator(): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        component={HomeScreen}
        name={ROUTES.HOME_TAB}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: renderHomeIcon,
        }}
      />
      <Tab.Screen
        component={SendScreen}
        name={ROUTES.SEND_TAB}
        options={{
          tabBarLabel: 'Send',
          tabBarIcon: renderSendIcon,
        }}
      />
      <Tab.Screen
        component={ReceiveScreen}
        name={ROUTES.RECEIVE_TAB}
        options={{
          tabBarLabel: 'Receive',
          tabBarIcon: renderReceiveIcon,
        }}
      />
      <Tab.Screen
        component={HistoryScreen}
        name={ROUTES.HISTORY_TAB}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: renderHistoryIcon,
        }}
      />
      <Tab.Screen
        component={SettingsScreen}
        name={ROUTES.SETTINGS_TAB}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: renderSettingsIcon,
        }}
      />
    </Tab.Navigator>
  );
}
