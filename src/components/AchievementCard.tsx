import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import {
  AchievementAward,
  AchievementDefinition,
  AchievementProgress,
  AchievementTier,
} from '../types/achievements';

interface AchievementCardProps {
  definition: AchievementDefinition;
  progress?: AchievementProgress;
  award?: AchievementAward;
  onPress?: () => void;
}

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#00E5FF',
  relic: '#FF3366',
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  definition,
  progress,
  award,
  onPress,
}) => {
  const isUnlocked = Boolean(award || progress?.isCompleted);
  const tierColor = TIER_COLORS[definition.tier] || THEME.colors.primary;

  const currentVal = progress?.currentValue ?? (isUnlocked ? definition.criterion.targetValue : 0);
  const targetVal = definition.criterion.targetValue;
  const progressPercent = Math.min(
    100,
    progress?.progressPercent ?? (isUnlocked ? 100 : Math.round((currentVal / targetVal) * 100))
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.cardContainer,
        isUnlocked && styles.cardContainerUnlocked,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Tier & Icon Glyph Badge */}
        <View
          style={[
            styles.iconBox,
            { borderColor: isUnlocked ? tierColor : THEME.colors.surfaceBorder },
            isUnlocked && { backgroundColor: `${tierColor}15` },
          ]}
        >
          <Ionicons
            name={(definition.icon as any) || 'trophy-outline'}
            size={24}
            color={isUnlocked ? tierColor : THEME.colors.textMuted}
          />
          {isUnlocked && (
            <View style={[styles.miniCheck, { backgroundColor: tierColor }]}>
              <Ionicons name="checkmark" size={10} color="#000" />
            </View>
          )}
        </View>

        {/* Text Details */}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.title,
                isUnlocked && { color: THEME.colors.textBright },
              ]}
              numberOfLines={1}
            >
              {definition.name}
            </Text>
            <Badge
              label={definition.tier.toUpperCase()}
              variant="neutral"
              style={{
                borderColor: tierColor,
                borderWidth: 1,
                backgroundColor: 'transparent',
              }}
            />
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {definition.description}
          </Text>

          {/* Progress Bar & Numerical Target */}
          <View style={styles.progressSection}>
            <View style={styles.progressNumbersRow}>
              <Text style={styles.progressText}>
                {isUnlocked
                  ? 'ACCOMPLISHED'
                  : `${currentVal.toLocaleString()} / ${targetVal.toLocaleString()}`}
              </Text>
              <Text style={styles.xpText}>+{definition.rewardXp} XP</Text>
            </View>
            <ProgressBar
              progress={progressPercent}
              color={isUnlocked ? THEME.colors.success : THEME.colors.primary}
              style={{ marginTop: 4 }}
            />
          </View>

          {/* Metadata tags */}
          <View style={styles.metaRow}>
            <Badge
              label={`[${definition.scope.toUpperCase()}]`}
              variant="primary"
              style={{ marginRight: 6 }}
            />
            <Badge
              label={definition.category.toUpperCase().replace('_', ' ')}
              variant="neutral"
            />
            {award?.unlockedAt && (
              <Text style={styles.unlockedDate}>
                Awarded {new Date(award.unlockedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    opacity: 0.9,
  },
  cardContainerUnlocked: {
    borderColor: 'rgba(255,255,255,0.2)',
    opacity: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  miniCheck: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textMain,
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  progressSection: {
    marginBottom: 8,
  },
  progressNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  xpText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  unlockedDate: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginLeft: 'auto',
  },
});
