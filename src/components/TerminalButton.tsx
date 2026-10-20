import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { THEME } from '../constants/theme';

import { triggerHaptic } from '../utils/haptics';

interface TerminalButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const TerminalButton: React.FC<TerminalButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const handlePress = () => {
    if (variant === 'danger') {
      triggerHaptic.warning();
    } else if (variant === 'success') {
      triggerHaptic.medium();
    } else {
      triggerHaptic.light();
    }
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: THEME.colors.primary,
          borderColor: THEME.colors.primaryMuted,
        };
      case 'secondary':
        return {
          backgroundColor: THEME.colors.secondary,
          borderColor: THEME.colors.secondaryMuted,
        };
      case 'success':
        return {
          backgroundColor: THEME.colors.success,
          borderColor: THEME.colors.successMuted,
        };
      case 'danger':
        return {
          backgroundColor: THEME.colors.danger,
          borderColor: THEME.colors.dangerMuted,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: THEME.colors.primary,
          borderWidth: 1,
        };
      case 'ghost':
        return {
          backgroundColor: THEME.colors.surfaceRaised,
          borderColor: THEME.colors.surfaceBorder,
          borderWidth: 1,
        };
      default:
        return {};
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'success':
        return '#0A0E17'; // High-contrast dark on bright accents
      case 'danger':
        return '#FFFFFF';
      case 'outline':
        return THEME.colors.primary;
      case 'ghost':
        return THEME.colors.textBright;
      default:
        return THEME.colors.textBright;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 6, paddingHorizontal: 12 };
      case 'lg':
        return { paddingVertical: 14, paddingHorizontal: 20 };
      default:
        return { paddingVertical: 10, paddingHorizontal: 16 };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 16;
      default:
        return 14;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        getContainerStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getTextSize() },
              textStyle,
            ]}
          >
            {title.toUpperCase()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  disabled: {
    opacity: 0.45,
  },
});
