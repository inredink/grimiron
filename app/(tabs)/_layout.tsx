import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../src/constants/theme';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '../../src/utils/haptics';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // On Android with 3-button navigation, insets.bottom is typically 48-56dp.
  // On gesture navigation, insets.bottom is typically 16-24dp.
  // We compute a dynamic bottom padding so tab buttons are never covered by Android system buttons.
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 8);
  const tabHeight = 60 + bottomInset;

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          triggerHaptic.selection();
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: THEME.colors.surface,
          borderTopColor: THEME.colors.surfaceBorder,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color ? (color as string) : THEME.colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="raid"
        options={{
          title: 'RAIDS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="skull-outline" size={size} color={color ? (color as string) : THEME.colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'LOG WORKOUT',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color ? (color as string) : THEME.colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'HISTORY',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color ? (color as string) : THEME.colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: 'CHARACTER',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" size={size} color={color ? (color as string) : THEME.colors.primary} />
          ),
        }}
      />
    </Tabs>
  );
}
