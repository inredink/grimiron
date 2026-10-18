import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../src/constants/theme';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: THEME.colors.surface,
          borderTopColor: THEME.colors.surfaceBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
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
          title: 'CHARACTER',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color ? (color as string) : THEME.colors.primary} />
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
        name="factions"
        options={{
          title: 'FACTIONS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="planet-outline" size={size} color={color ? (color as string) : THEME.colors.primary} />
          ),
        }}
      />
    </Tabs>
  );
}
