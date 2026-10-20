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
import { getSafeIoniconsName } from '../utils/iconHelper';
import {
  AchievementAward,
  AchievementCriterion,
  AchievementDefinition,
  AchievementProgress,
  AchievementTier,
} from '../types/achievements';

export interface AchievementCardProps {
  definition: AchievementDefinition;
  progress?: AchievementProgress;
  award?: AchievementAward;
  onPress?: () => void;
  mode?: 'available' | 'completed';
  characterFactionId?: string;
}

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#00E5FF',
  relic: '#FF3366',
};

import { formatCriterionRequirement } from '../utils/achievementFormatter';
export { formatCriterionRequirement };

export const AchievementCard: React.FC<AchievementCardProps> = ({
  definition,
  progress,
  award,
  onPress,
  mode,
  characterFactionId,
}) => {
  const isUnlocked = Boolean(award || progress?.isCompleted);
  const cardMode = mode || (isUnlocked ? 'completed' : 'available');
  const tierColor = TIER_COLORS[definition.tier] || THEME.colors.primary;

  const currentVal = progress?.currentValue ?? (isUnlocked ? definition.criterion.targetValue : 0);
  const targetVal = definition.criterion.targetValue;
  const remaining = Math.max(0, targetVal - currentVal);
  const progressPercent = Math.min(
    100,
    progress?.progressPercent ?? (isUnlocked ? 100 : Math.round((currentVal / Math.max(1, targetVal)) * 100))
  );

  const isRestricted = Boolean(
    definition.factionRestriction &&
      characterFactionId &&
      definition.factionRestriction !== characterFactionId
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.cardContainer,
        cardMode === 'completed' && styles.cardContainerCompleted,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Tier & Glyph Medallion */}
        <View
          style={[
            styles.iconBox,
            { borderColor: cardMode === 'completed' ? tierColor : THEME.colors.surfaceBorder },
            cardMode === 'completed' && { backgroundColor: `${tierColor}18` },
          ]}
        >
          <Ionicons
            name={getSafeIoniconsName(definition.icon, cardMode === 'completed' ? 'trophy' : 'trophy-outline')}
            size={24}
            color={cardMode === 'completed' ? tierColor : THEME.colors.textMuted}
          />
          {cardMode === 'completed' && (
            <View style={[styles.miniCheck, { backgroundColor: tierColor }]}>
              <Ionicons name="checkmark" size={10} color="#000" />
            </View>
          )}
        </View>

        {/* Text & Telemetry Body */}
        <View style={styles.textContainer}>
          {/* Header Row: Title, Tier, Status */}
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.title,
                cardMode === 'completed' && { color: THEME.colors.textBright },
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

          {/* ========================================================= */}
          {/* AVAILABLE MODE: Telemetry, Requirement, Remaining Needed  */}
          {/* ========================================================= */}
          {cardMode === 'available' && (
            <View style={styles.availableSection}>
              {/* Requirement Summary */}
              <View style={styles.requirementRow}>
                <Ionicons name="flag-outline" size={12} color={THEME.colors.textMuted} />
                <Text style={styles.requirementText} numberOfLines={1}>
                  {formatCriterionRequirement(definition.criterion)}
                </Text>
              </View>

              {/* Progress Bar & Numerical Target */}
              <View style={styles.progressSection}>
                <View style={styles.progressNumbersRow}>
                  <Text style={styles.progressText}>
                    Progress: {currentVal.toLocaleString()} / {targetVal.toLocaleString()} ({progressPercent}%)
                  </Text>
                  <Text style={styles.remainingText}>
                    {remaining === 0 ? 'READY TO CLAIM' : `${remaining.toLocaleString()} more needed`}
                  </Text>
                </View>
                <ProgressBar
                  progress={progressPercent}
                  color={progressPercent > 0 ? THEME.colors.primary : THEME.colors.surfaceBorder}
                  style={{ marginTop: 4 }}
                />
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* COMPLETED MODE: Conferred Date, Source Event, XP Awarded */}
          {/* ========================================================= */}
          {cardMode === 'completed' && (
            <View style={styles.completedSection}>
              <View style={styles.completedMetaRow}>
                <Ionicons name="checkmark-circle" size={13} color={THEME.colors.success} />
                <Text style={styles.conferredDateText}>
                  {award?.unlockedAt
                    ? `Awarded ${new Date(award.unlockedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })} at ${new Date(award.unlockedAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}`
                    : 'Honor Conferred'}
                </Text>
              </View>

              {Boolean(award?.sourceEventType) && (
                <View style={styles.sourceEventRow}>
                  <Ionicons name="link-outline" size={12} color={THEME.colors.textMuted} />
                  <Text style={styles.sourceEventText}>
                    {award?.sourceEventType === 'workout_completed'
                      ? 'Linked: Crusade Workout Session'
                      : award?.sourceEventType === 'battle_completed'
                      ? 'Linked: Tactical Combat Engagement'
                      : award?.sourceEventType === 'raid_completed'
                      ? 'Linked: Weekly Raid Boss Battle'
                      : award?.sourceEventType === 'mission_reward'
                      ? 'Linked: Mission Operations'
                      : `Linked: ${award?.sourceEventType?.replace(/_/g, ' ')}`}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Metadata & Reward Strip */}
          <View style={styles.metaRow}>
            <Badge
              label={`[${definition.scope.toUpperCase()}]`}
              variant="primary"
              style={{ marginRight: 6 }}
            />
            <Badge
              label={definition.category.toUpperCase().replace('_', ' ')}
              variant="neutral"
              style={{ marginRight: 6 }}
            />

            {isRestricted ? (
              <Badge
                label="FACTION LOCKED"
                variant="neutral"
                style={{ borderColor: THEME.colors.warning, borderWidth: 1 }}
              />
            ) : null}

            <Text
              style={[
                styles.rewardTag,
                cardMode === 'completed' && { color: THEME.colors.success },
              ]}
            >
              {cardMode === 'completed'
                ? `+${award?.rewardXp || definition.rewardXp} XP Credited`
                : `+${definition.rewardXp} XP Commendation`}
            </Text>
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
    opacity: 0.95,
  },
  cardContainerCompleted: {
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(20, 24, 30, 0.95)',
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
  availableSection: {
    marginBottom: 8,
    gap: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  requirementText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  progressSection: {
    marginTop: 2,
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
  remainingText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  completedSection: {
    marginBottom: 8,
    gap: 3,
  },
  completedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  conferredDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  sourceEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceEventText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  rewardTag: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primary,
    marginLeft: 'auto',
  },
});
