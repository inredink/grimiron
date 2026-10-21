import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { CombatAfterActionReport } from '../types/combat';
import { Ionicons } from '@expo/vector-icons';
import { TerminalButton } from './TerminalButton';
import { ProgressBar } from './ProgressBar';
import { getSafeIoniconsName } from '../utils/iconHelper';

interface AfterActionReportModalProps {
  visible: boolean;
  report: CombatAfterActionReport | null;
  onClose: () => void;
}

export const AfterActionReportModal: React.FC<AfterActionReportModalProps> = ({
  visible,
  report,
  onClose,
}) => {
  if (!report) return null;

  const {
    mission,
    enemy,
    isVictory = false,
    totalDamage = 0,
    enemyRemainingHealth = 0,
    overkillDamage = 0,
    completedSetsCount = 0,
    totalVolumeKg = 0,
    baseXpEarned = 0,
    gloryBonusXp = 0,
    totalXpEarned = 0,
    newLevel = 1,
    newRank = 'Operative',
    progressPercent = 0,
    achievementsUnlocked = [],
  } = report;

  const safeVolume = typeof totalVolumeKg === 'number' && !isNaN(totalVolumeKg) ? totalVolumeKg : 0;
  const safeProgress = typeof progressPercent === 'number' && !isNaN(progressPercent) ? progressPercent : 0;
  const safeAchievements = Array.isArray(achievementsUnlocked) ? achievementsUnlocked : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Mission Outcome Banner */}
            <View
              style={[
                styles.outcomeBanner,
                {
                  borderColor: isVictory ? THEME.colors.primary : THEME.colors.warning,
                  backgroundColor: isVictory ? '#162214' : '#1C1912',
                },
              ]}
            >
              <Ionicons
                name={isVictory ? 'trophy' : 'shield-half'}
                size={38}
                color={isVictory ? THEME.colors.primary : THEME.colors.warning}
              />
              <Text
                style={[
                  styles.outcomeTitle,
                  { color: isVictory ? THEME.colors.primary : THEME.colors.warning },
                ]}
              >
                {isVictory ? 'MISSION ACCOMPLISHED // PURGE VICTORY' : 'TACTICAL WITHDRAWAL // SECTOR HELD'}
              </Text>
              <Text style={styles.outcomeSubtitle}>
                {isVictory
                  ? `Hostile target ${enemy?.name || 'Hostile'} has been eradicated. Glory to your Chapter!`
                  : `Training objectives completed. Hostile survived with ${enemyRemainingHealth} HP, but all XP is preserved.`}
              </Text>
            </View>

            {/* Target Assessment Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>TARGET ENGAGEMENT DOSSIER</Text>
              <View style={styles.enemyRow}>
                <View
                  style={[
                    styles.enemyAvatar,
                    { borderColor: enemy?.visual?.primaryColor || THEME.colors.primary },
                  ]}
                >
                  <Ionicons
                    name={getSafeIoniconsName(enemy?.visual?.iconName, 'skull')}
                    size={24}
                    color={enemy?.visual?.primaryColor || THEME.colors.primary}
                  />
                </View>
                <View style={styles.enemyDetails}>
                  <Text style={styles.enemyName}>{enemy?.name || 'Hostile Combatant'}</Text>
                  <Text style={styles.enemyTitle}>
                    {enemy?.title || 'Warp Entity'} • {(enemy?.faction || 'HOSTILE').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: isVictory ? THEME.colors.success : THEME.colors.warning },
                    ]}
                  >
                    {isVictory ? 'SLAIN' : 'SURVIVED'}
                  </Text>
                </View>
              </View>

              <Text style={styles.enemyQuote}>
                "{isVictory ? (enemy?.defeatQuote || 'Target neutralized.') : (enemy?.tauntQuote || 'The battle line holds.')}"
              </Text>
            </View>

            {/* Combat & Munitions Metrics */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>MUNITIONS & COMBAT TELEMETRY</Text>
              <View style={styles.gridRow}>
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>SETS COMPLETED</Text>
                  <Text style={styles.gridValue}>{completedSetsCount}</Text>
                </View>
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>BATTLE TONNAGE</Text>
                  <Text style={styles.gridValue}>{safeVolume} kg</Text>
                </View>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>DAMAGE DEALT</Text>
                  <Text style={[styles.gridValue, { color: THEME.colors.danger }]}>
                    {totalDamage}
                  </Text>
                </View>
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>OVERKILL DAMAGE</Text>
                  <Text style={[styles.gridValue, { color: THEME.colors.primary }]}>
                    +{overkillDamage}
                  </Text>
                </View>
              </View>
            </View>

            {/* XP Rewards Breakdown */}
            <View style={[styles.sectionCard, styles.rewardCard]}>
              <Text style={styles.sectionHeader}>REQUISITION & XP REWARDS</Text>
              <Text style={styles.rewardTotal}>+{totalXpEarned} XP</Text>
              <View style={styles.rewardDivider} />
              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>Base Mission Training:</Text>
                <Text style={styles.rewardValue}>+{baseXpEarned} XP</Text>
              </View>
              {gloryBonusXp > 0 && (
                <View style={styles.rewardRow}>
                  <Text style={[styles.rewardLabel, { color: THEME.colors.primary }]}>
                    Target Purge Glory Bonus:
                  </Text>
                  <Text style={[styles.rewardValue, { color: THEME.colors.primary }]}>
                    +{gloryBonusXp} XP
                  </Text>
                </View>
              )}
              {report.isCapped && (
                <View style={styles.capNoticeBox}>
                  <Ionicons name="information-circle-outline" size={16} color={THEME.colors.warning} />
                  <Text style={styles.capNoticeText}>
                    Daily Cap Reached: Credited {report.creditedXp} of {report.requestedXp} XP ({report.spilloverXp} XP overflow). Training data and achievements fully recorded.
                  </Text>
                </View>
              )}
            </View>

            {/* Rank & Promotion Progress */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>PROMOTION STANDING</Text>
              <View style={styles.rankRow}>
                <Text style={styles.rankText}>Level {newLevel || 1} • {newRank || 'Operative'}</Text>
                <Text style={styles.progressPercentText}>{safeProgress}%</Text>
              </View>
              <ProgressBar
                progress={safeProgress}
                color={THEME.colors.primary}
                height={8}
              />
              <Text style={styles.nextPromotionNotice}>
                Training progress recorded in the Chapter Annals.
              </Text>
            </View>

            {/* Battle Honors & Achievements */}
            {safeAchievements.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>BATTLE HONORS EARNED</Text>
                {safeAchievements.map((ach, idx) => (
                  <View key={idx} style={styles.honorRow}>
                    <Ionicons name="medal-outline" size={16} color={THEME.colors.primary} />
                    <Text style={styles.honorText}>{ach}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Return Action Button */}
            <TerminalButton
              title="RETURN TO COMMAND TERMINAL"
              onPress={onClose}
              variant="primary"
              size="lg"
              style={{ marginTop: 12, marginBottom: 8 }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.92)',
    justifyContent: 'center',
    padding: THEME.spacing.md,
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: THEME.spacing.lg,
    maxHeight: '90%',
  },
  outcomeBanner: {
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  outcomeTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
    textAlign: 'center',
  },
  outcomeSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: 12,
    marginBottom: 10,
  },
  sectionHeader: {
    color: THEME.colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  enemyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enemyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#0E1724',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  enemyDetails: {
    flex: 1,
  },
  enemyName: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '800',
  },
  enemyTitle: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#121B28',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  enemyQuote: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridBox: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceHighlight,
    borderRadius: THEME.borderRadius.sm,
    padding: 8,
    marginHorizontal: 3,
  },
  gridLabel: {
    color: THEME.colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gridValue: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  rewardCard: {
    backgroundColor: '#101B1E',
    borderColor: THEME.colors.successMuted,
  },
  rewardTotal: {
    color: THEME.colors.success,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  rewardDivider: {
    height: 1,
    backgroundColor: THEME.colors.surfaceBorder,
    marginVertical: 8,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  rewardLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  rewardValue: {
    color: THEME.colors.textBright,
    fontSize: 11,
    fontWeight: '700',
  },
  capNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 170, 0, 0.12)',
    borderWidth: 1,
    borderColor: THEME.colors.warning,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  capNoticeText: {
    flex: 1,
    color: THEME.colors.warning,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rankText: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '800',
  },
  progressPercentText: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  nextPromotionNotice: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginTop: 6,
    fontStyle: 'italic',
  },
  honorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  honorText: {
    color: THEME.colors.textBright,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
});
