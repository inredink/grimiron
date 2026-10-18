import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'imperium' | 'chaos' | 'xenos' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style }) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'primary':
      case 'imperium':
        return {
          bg: '#2C200B',
          border: THEME.colors.primary,
          text: THEME.colors.primary,
        };
      case 'secondary':
        return {
          bg: '#052933',
          border: THEME.colors.secondary,
          text: THEME.colors.secondary,
        };
      case 'success':
        return {
          bg: '#0A3319',
          border: THEME.colors.success,
          text: THEME.colors.success,
        };
      case 'danger':
      case 'chaos':
        return {
          bg: '#3D0D14',
          border: THEME.colors.danger,
          text: '#FF6B7D',
        };
      case 'xenos':
        return {
          bg: '#0E331A',
          border: '#4CAF50',
          text: '#81C784',
        };
      default:
        return {
          bg: THEME.colors.surfaceRaised,
          border: THEME.colors.surfaceBorder,
          text: THEME.colors.textMuted,
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.label, { color: colors.text }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
