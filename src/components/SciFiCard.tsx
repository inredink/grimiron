import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../constants/theme';

interface SciFiCardProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'normal' | 'raised' | 'accent' | 'danger';
}

export const SciFiCard: React.FC<SciFiCardProps> = ({
  title,
  subtitle,
  rightAction,
  children,
  style,
  variant = 'normal',
}) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'accent':
        return THEME.colors.primary;
      case 'danger':
        return THEME.colors.danger;
      default:
        return THEME.colors.surfaceBorder;
    }
  };

  return (
    <View style={[styles.container, { borderColor: getBorderColor() }, style]}>
      {/* Corner tactical accents */}
      <View style={[styles.cornerAccent, styles.cornerTL]} />
      <View style={[styles.cornerAccent, styles.cornerTR]} />

      {(title || rightAction) && (
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            {title && <Text style={styles.title}>{title.toUpperCase()}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
        </View>
      )}

      <View style={styles.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  cornerAccent: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderColor: THEME.colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  subtitle: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rightAction: {
    marginLeft: THEME.spacing.sm,
  },
  body: {
    width: '100%',
  },
});
