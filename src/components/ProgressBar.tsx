import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  valueText?: string;
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  valueText,
  color = THEME.colors.primary,
  height = 8,
  style,
}) => {
  const safeProgress = typeof progress === 'number' && !isNaN(progress) ? progress : 0;
  const clampedProgress = Math.min(100, Math.max(0, safeProgress));

  return (
    <View style={[styles.container, style]}>
      {(label || valueText) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label.toUpperCase()}</Text>}
          {valueText && <Text style={styles.valueText}>{valueText}</Text>}
        </View>
      )}

      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: THEME.spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  valueText: {
    color: THEME.colors.textBright,
    fontSize: 11,
    fontWeight: '600',
  },
  track: {
    width: '100%',
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  fill: {
    borderRadius: THEME.borderRadius.sm,
  },
});
