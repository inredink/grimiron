import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import {
  AchievementAward,
  AchievementDefinition,
  AchievementProgress,
} from '../types/achievements';
import { TIER_COLORS, formatCriterionRequirement } from './AchievementCard';
import { getSafeIoniconsName } from '../utils/iconHelper';

export interface AchievementDetailModalProps {
  visible: boolean;
  onClose: () => void;
  definition: AchievementDefinition | null;
  progress?: AchievementProgress;
  award?: AchievementAward;
  mode?: 'available' | 'completed';
  characterFactionId?: string;
}

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  visible,
  onClose,
  definition,
  progress,
  award,
  mode,
  characterFactionId,
}) => {
  if (!definition) return null;

  const isUnlocked = Boolean(award || progress?.isCompleted);
  const detailMode = mode || (isUnlocked ? 'completed' : 'available');
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
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleWrap}>
              <Text style={styles.headerSubtitle}>
                {detailMode === 'completed'
                  ? 'IMPERIAL CITATION CONFERRED'
                  : 'TACTICAL CITATION OBJECTIVE'}
              </Text>
              <Text style={styles.headerTitle}>{definition.name.toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={24} color={THEME.colors.textBright} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Medallion Display */}
            <View style={styles.medallionSection}>
              <View
                style={[
                  styles.medallionBox,
                  { borderColor: tierColor },
                  detailMode === 'completed' && { backgroundColor: `${tierColor}20` },
                ]}
              >
                <Ionicons
                  name={getSafeIoniconsName(definition.icon, detailMode === 'completed' ? 'trophy' : 'trophy-outline')}
                  size={48}
                  color={detailMode === 'completed' ? tierColor : THEME.colors.textMuted}
                />
              </View>
              <View style={styles.badgeRow}>
                <Badge
                  label={`${definition.tier.toUpperCase()} TIER HONOR`}
                  variant="neutral"
                  style={{
                    borderColor: tierColor,
                    borderWidth: 1,
                    backgroundColor: 'transparent',
                    marginRight: 8,
                  }}
                />
                <Badge
                  label={detailMode === 'completed' ? 'CONFERRED' : 'INCOMPLETE'}
                  variant={detailMode === 'completed' ? 'primary' : 'neutral'}
                />
              </View>
            </View>

            {/* Description Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>TACTICAL COMMENDATION</Text>
              <Text style={styles.infoText}>{definition.description}</Text>
            </View>

            {/* Progress & Requirement Telemetry */}
            <View style={styles.infoCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.infoLabel}>PROGRESS TELEMETRY</Text>
                <Text style={styles.progressNumbers}>
                  {currentVal.toLocaleString()} / {targetVal.toLocaleString()} ({progressPercent}%)
                </Text>
              </View>
              <ProgressBar
                progress={progressPercent}
                color={detailMode === 'completed' ? THEME.colors.success : THEME.colors.primary}
                style={{ marginTop: 8 }}
              />
              <Text style={styles.criterionDetail}>
                Requirement: {formatCriterionRequirement(definition.criterion)}
              </Text>
              {detailMode === 'available' && (
                <Text style={styles.remainingDetail}>
                  {remaining === 0
                    ? 'Target accomplished! Ready to claim upon mission submission.'
                    : `Remaining needed: ${remaining.toLocaleString()} more`}
                </Text>
              )}
            </View>

            {/* Faction Prerequisite Notice if applicable */}
            {isRestricted && (
              <View style={[styles.infoCard, styles.restrictedCard]}>
                <View style={styles.restrictedRow}>
                  <Ionicons name="lock-closed" size={16} color={THEME.colors.warning} />
                  <Text style={styles.restrictedTitle}>FACTION RESTRICTION PREREQUISITE</Text>
                </View>
                <Text style={styles.restrictedText}>
                  This citation is reserved for warriors sworn to the {definition.factionRestriction}.
                </Text>
              </View>
            )}

            {/* Rewards & Attributes */}
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>CRUSADE ATTRIBUTES</Text>
              <View style={styles.attrRow}>
                <Text style={styles.attrKey}>Honor Scope:</Text>
                <Text style={styles.attrVal}>
                  {definition.scope.toUpperCase()} LEVEL CITATION
                </Text>
              </View>
              <View style={styles.attrRow}>
                <Text style={styles.attrKey}>Classification:</Text>
                <Text style={styles.attrVal}>
                  {definition.category.toUpperCase().replace('_', ' ')}
                </Text>
              </View>
              <View style={styles.attrRow}>
                <Text style={styles.attrKey}>XP Commendation:</Text>
                <Text style={[styles.attrVal, { color: THEME.colors.primary, fontWeight: '800' }]}>
                  +{award?.rewardXp || definition.rewardXp} CRUSADE XP {detailMode === 'completed' ? '(CREDITED)' : ''}
                </Text>
              </View>
              {award?.unlockedAt && (
                <View style={styles.attrRow}>
                  <Text style={styles.attrKey}>Conferred Date:</Text>
                  <Text style={styles.attrVal}>
                    {new Date(award.unlockedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })} at {new Date(award.unlockedAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}
              {Boolean(award?.sourceEventType) && (
                <View style={styles.attrRow}>
                  <Text style={styles.attrKey}>Linked Operation:</Text>
                  <Text style={styles.attrVal}>
                    {award?.sourceEventType === 'workout_completed'
                      ? 'Crusade Workout Operation'
                      : award?.sourceEventType === 'battle_completed'
                      ? 'Combat Battle Engagement'
                      : award?.sourceEventType === 'raid_completed'
                      ? 'Weekly Raid Boss Battle'
                      : award?.sourceEventType === 'mission_reward'
                      ? 'Faction Mission Operations'
                      : award?.sourceEventType?.replace(/_/g, ' ')}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Dismiss Button */}
          <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
            <Text style={styles.confirmBtnText}>ACKNOWLEDGE COMMENDATION</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.background,
  },
  titleWrap: {
    flex: 1,
    marginRight: 8,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.textBright,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  medallionSection: {
    alignItems: 'center',
    marginVertical: 4,
  },
  medallionBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: THEME.colors.background,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: THEME.colors.background,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: THEME.colors.textBright,
    lineHeight: 18,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressNumbers: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  criterionDetail: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  remainingDetail: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  restrictedCard: {
    borderColor: 'rgba(255, 170, 0, 0.4)',
    backgroundColor: 'rgba(255, 170, 0, 0.08)',
  },
  restrictedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  restrictedTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.warning,
    letterSpacing: 0.5,
  },
  restrictedText: {
    fontSize: 11,
    color: THEME.colors.textBright,
    lineHeight: 16,
  },
  attrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  attrKey: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  attrVal: {
    fontSize: 11,
    color: THEME.colors.textBright,
    fontWeight: '700',
  },
  confirmBtn: {
    margin: 16,
    paddingVertical: 14,
    backgroundColor: THEME.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
});
