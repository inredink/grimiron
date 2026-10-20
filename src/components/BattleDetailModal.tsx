import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { BattleRecord } from '../types/battleHistory';

interface BattleDetailModalProps {
  visible: boolean;
  onClose: () => void;
  battle: BattleRecord | null;
}

export const BattleDetailModal: React.FC<BattleDetailModalProps> = ({
  visible,
  onClose,
  battle,
}) => {
  if (!battle) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const outcomeVariant: 'success' | 'danger' | 'primary' =
    battle.outcome === 'victory'
      ? 'success'
      : battle.outcome === 'abandoned'
      ? 'primary'
      : 'danger';

  const snapshot = battle.snapshot;
  const hpPercent = Math.max(
    0,
    Math.min(100, Math.round((battle.enemyRemainingHp / Math.max(1, battle.enemyMaxHp)) * 100))
  );

  const getDifficultyBadgeVariant = (diff?: string): 'danger' | 'primary' | 'neutral' => {
    if (diff === 'boss' || diff === 'crusade') return 'danger';
    if (diff === 'incursion' || diff === 'skirmish') return 'primary';
    return 'neutral';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color={THEME.colors.textBright} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerSubtitle}>AFTER-ACTION ENCOUNTER REPORT</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {battle.enemyName.toUpperCase()}
            </Text>
          </View>
          <Badge
            label={battle.outcome.toUpperCase()}
            variant={outcomeVariant}
          />
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Enemy Dossier */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="skull-outline" size={18} color={THEME.colors.primary} />
              <Text style={styles.sectionTitle}>TARGET DOSSIER</Text>
            </View>

            <View style={styles.enemyRow}>
              <View style={styles.enemyGlyphBox}>
                <Ionicons
                  name="flame"
                  size={36}
                  color={
                    battle.outcome === 'victory'
                      ? THEME.colors.success
                      : THEME.colors.primary
                  }
                />
              </View>
              <View style={styles.enemyMeta}>
                <Text style={styles.enemyName}>{battle.enemyName}</Text>
                <Text style={styles.enemyLore}>
                  {snapshot?.enemyDescription || battle.missionTitle}
                </Text>
                <View style={styles.tagRow}>
                  {battle.enemyFaction ? (
                    <Badge
                      label={battle.enemyFaction.toUpperCase()}
                      variant="neutral"
                      style={{ marginRight: 6 }}
                    />
                  ) : null}
                  {battle.enemyDifficulty ? (
                    <Badge
                      label={battle.enemyDifficulty.toUpperCase()}
                      variant={getDifficultyBadgeVariant(battle.enemyDifficulty)}
                      style={{ marginRight: 6 }}
                    />
                  ) : null}
                  <Badge
                    label={battle.encounterMode.toUpperCase()}
                    variant="primary"
                  />
                </View>
              </View>
            </View>

            {/* Health Bar */}
            <View style={styles.hpSection}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>TARGET HP STATUS</Text>
                <Text style={styles.metricValue}>
                  {battle.enemyRemainingHp} / {battle.enemyMaxHp} HP ({hpPercent}%)
                </Text>
              </View>
              <ProgressBar
                progress={hpPercent}
                color={battle.outcome === 'victory' ? THEME.colors.danger : THEME.colors.primary}
                style={{ marginTop: 6 }}
              />
            </View>
          </View>

          {/* Section 2: Combat Telemetry */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart-outline" size={18} color={THEME.colors.primary} />
              <Text style={styles.sectionTitle}>ENGAGEMENT TELEMETRY</Text>
            </View>

            <View style={styles.grid2x2}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>TOTAL DAMAGE</Text>
                <Text style={styles.gridValue}>{battle.totalDamage.toLocaleString()}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>TOTAL ATTACKS</Text>
                <Text style={styles.gridValue}>{battle.totalAttacks}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>COMBAT DURATION</Text>
                <Text style={styles.gridValue}>{formatDuration(battle.durationSeconds)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>XP AWARDED</Text>
                <Text style={[styles.gridValue, { color: THEME.colors.primary }]}>
                  +{battle.xpEarned} XP
                </Text>
              </View>
            </View>

            <View style={styles.timestampRow}>
              <Text style={styles.timestampText}>
                Initiated: {formatDate(battle.startedAt)}
              </Text>
              {battle.completedAt && (
                <Text style={styles.timestampText}>
                  Concluded: {formatDate(battle.completedAt)}
                </Text>
              )}
            </View>
          </View>

          {/* Section 3: Squad & Individual Contributions */}
          {snapshot?.participants && snapshot.participants.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={18} color={THEME.colors.primary} />
                <Text style={styles.sectionTitle}>
                  PARTICIPANTS & CONTRIBUTIONS ({snapshot.participants.length})
                </Text>
              </View>

              {snapshot.participants.map((p, idx) => (
                <View key={idx} style={styles.participantItem}>
                  <View style={styles.participantHeader}>
                    <Text style={styles.participantName}>{p.callsign}</Text>
                    <Badge
                      label={`${p.damageSharePercent}% DAMAGE SHARE`}
                      variant="primary"
                    />
                  </View>

                  <View style={styles.participantMeta}>
                    <Text style={styles.participantDetail}>
                      Faction: {p.factionId} {p.subfactionId ? `(${p.subfactionId})` : ''}
                    </Text>
                    <Text style={styles.participantDetail}>
                      Attacks: {p.attacksCount} | Damage: {p.damageDealt.toLocaleString()}
                    </Text>
                  </View>

                  <ProgressBar
                    progress={Math.max(5, p.damageSharePercent)}
                    color={THEME.colors.primary}
                    style={{ marginTop: 8 }}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Section 4: Combat Timeline */}
          {snapshot?.timeline && snapshot.timeline.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={18} color={THEME.colors.primary} />
                <Text style={styles.sectionTitle}>
                  COMBAT TIMELINE ({snapshot.timeline.length} EVENTS)
                </Text>
              </View>

              {snapshot.timeline.map((evt, idx) => {
                const isCrit = evt.eventType === 'critical_strike';
                const isKill = evt.eventType === 'enemy_slain';
                const dotColor = isCrit
                  ? THEME.colors.warning
                  : isKill
                  ? THEME.colors.success
                  : THEME.colors.primary;

                return (
                  <View key={idx} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineTop}>
                        <Text style={styles.timelineActor}>{evt.actorName}</Text>
                        <Text style={styles.timelineTime}>{formatDate(evt.timestamp)}</Text>
                      </View>
                      <Text style={[styles.timelineDesc, isCrit && { color: THEME.colors.warning }]}>
                        {evt.description}
                      </Text>
                      {evt.damageDealt !== undefined && evt.damageDealt > 0 && (
                        <Text style={styles.timelineDamage}>
                          +{evt.damageDealt} DMG
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Section 5: Linked Workout Record */}
          {battle.sessionId && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="barbell-outline" size={18} color={THEME.colors.primary} />
                <Text style={styles.sectionTitle}>LINKED CRUSADE WORKOUT</Text>
              </View>
              <Text style={styles.linkedWorkoutText}>
                This encounter was fueled by training mission{' '}
                <Text style={{ color: THEME.colors.primary, fontWeight: '700' }}>
                  {battle.missionTitle}
                </Text>{' '}
                (Session ID: {battle.sessionId}). Every completed repetition fueled strikes directly on the enemy target.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surface,
  },
  closeBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.textBright,
    letterSpacing: 0.5,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 1,
    marginLeft: 8,
  },
  enemyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  enemyGlyphBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  enemyMeta: {
    flex: 1,
  },
  enemyName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textBright,
    marginBottom: 4,
  },
  enemyLore: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hpSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  gridItem: {
    width: '50%',
    padding: 4,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.textBright,
  },
  timestampRow: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    paddingTop: 8,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginBottom: 2,
  },
  participantItem: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textBright,
  },
  participantMeta: {
    marginTop: 2,
  },
  participantDetail: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    lineHeight: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 10,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 8,
  },
  timelineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineActor: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textBright,
  },
  timelineTime: {
    fontSize: 9,
    color: THEME.colors.textMuted,
  },
  timelineDesc: {
    fontSize: 12,
    color: THEME.colors.textMain,
    lineHeight: 16,
  },
  timelineDamage: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    marginTop: 2,
  },
  linkedWorkoutText: {
    fontSize: 12,
    color: THEME.colors.textMain,
    lineHeight: 18,
  },
});
