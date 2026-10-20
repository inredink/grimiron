import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { THEME } from '../../src/constants/theme';
import { SciFiCard } from '../../src/components/SciFiCard';
import { Badge } from '../../src/components/Badge';
import { TerminalButton } from '../../src/components/TerminalButton';
import { deleteWorkout } from '../../src/services/database/workoutRepository';
import { getBattleHistoryList } from '../../src/services/database/battleHistoryRepository';
import { BattleDetailModal } from '../../src/components/BattleDetailModal';
import { BattleOutcome, BattleRecord, EncounterMode } from '../../src/types/battleHistory';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutSession } from '../../src/types/workout';
import { triggerHaptic } from '../../src/utils/haptics';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { workoutHistory, refreshData, startNewWorkout, repeatWorkout } = useApp();

  // Tab Mode: 'workouts' vs 'battles'
  const [activeTab, setActiveTab] = useState<'workouts' | 'battles'>('workouts');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Battle History State & Filters
  const [battles, setBattles] = useState<BattleRecord[]>([]);
  const [selectedOutcome, setSelectedOutcome] = useState<BattleOutcome | 'all'>('all');
  const [selectedMode, setSelectedMode] = useState<EncounterMode | 'all'>('all');
  const [selectedSort, setSelectedSort] = useState<'recent' | 'highest_damage'>('recent');
  const [selectedBattleDetail, setSelectedBattleDetail] = useState<BattleRecord | null>(null);

  const loadBattles = useCallback(() => {
    try {
      const records = getBattleHistoryList({
        outcome: selectedOutcome,
        encounterMode: selectedMode,
        sortBy: selectedSort,
      });
      setBattles(records);
    } catch (err) {
      console.warn('Error loading battle history:', err);
      setBattles([]);
    }
  }, [selectedOutcome, selectedMode, selectedSort]);

  useEffect(() => {
    if (activeTab === 'battles') {
      loadBattles();
    }
  }, [activeTab, loadBattles]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRepeat = (session: WorkoutSession) => {
    Alert.alert(
      'Repeat Mission',
      `Deploy "${session.title}" as your active workout with the same exercises and sets?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deploy Mission',
          onPress: () => {
            triggerHaptic.medium();
            repeatWorkout(session.id);
            router.push('/(tabs)/workout');
          },
        },
      ]
    );
  };

  const handleDelete = (session: WorkoutSession) => {
    Alert.alert(
      'Delete Mission Record',
      `Are you sure you want to delete "${session.title}"? This will subtract ${session.totalXpEarned} XP from your career total.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            triggerHaptic.warning();
            deleteWorkout(session.id);
            refreshData();
          },
        },
      ]
    );
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
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

  const getDifficultyBadgeVariant = (diff?: string): 'danger' | 'primary' | 'neutral' => {
    if (diff === 'boss' || diff === 'crusade') return 'danger';
    if (diff === 'incursion' || diff === 'skirmish') return 'primary';
    return 'neutral';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(60, insets.bottom + 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Terminal Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CRUSADE ARCHIVES</Text>
          <Text style={styles.headerSubtitle}>
            HISTORICAL COMBAT & TRAINING LOGS
          </Text>
        </View>

        {/* Segmented Control: WORKOUT LOGS vs BATTLE ARCHIVES */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'workouts' && styles.segmentButtonActive,
            ]}
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('workouts');
            }}
          >
            <Ionicons
              name="barbell-outline"
              size={15}
              color={
                activeTab === 'workouts'
                  ? THEME.colors.primary
                  : THEME.colors.textMuted
              }
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === 'workouts' && styles.segmentTextActive,
              ]}
            >
              WORKOUT LOGS ({workoutHistory.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'battles' && styles.segmentButtonActive,
            ]}
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('battles');
            }}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={
                activeTab === 'battles'
                  ? THEME.colors.primary
                  : THEME.colors.textMuted
              }
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === 'battles' && styles.segmentTextActive,
              ]}
            >
              BATTLE ARCHIVES
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* VIEW 1: WORKOUT LOGS */}
        {/* ======================================================== */}
        {activeTab === 'workouts' && (
          <>
            {workoutHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="journal-outline"
                  size={64}
                  color={THEME.colors.surfaceBorder}
                />
                <Text style={styles.emptyTitle}>NO ARCHIVED MISSIONS</Text>
                <Text style={styles.emptySubtitle}>
                  You have not recorded any workouts yet. Launch your first training session to begin logging combat records.
                </Text>
                <TerminalButton
                  title="START FIRST MISSION"
                  onPress={() => {
                    startNewWorkout('Initiate Crusade');
                    router.push('/(tabs)/workout');
                  }}
                  variant="primary"
                  size="md"
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              workoutHistory.map((workout) => {
                const isExpanded = expandedId === workout.id;
                const totalSets = workout.exercises.reduce(
                  (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
                  0
                );

                return (
                  <SciFiCard
                    key={workout.id}
                    title={workout.title}
                    subtitle={formatDate(workout.startedAt)}
                    rightAction={
                      <View style={styles.cardHeaderRight}>
                        <Badge
                          label={`+${workout.totalXpEarned} XP`}
                          variant="success"
                          style={{ marginRight: 8 }}
                        />
                        <TouchableOpacity
                          onPress={() => handleRepeat(workout)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{ marginRight: 8 }}
                        >
                          <Ionicons
                            name="repeat"
                            size={17}
                            color={THEME.colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(workout)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color={THEME.colors.danger}
                          />
                        </TouchableOpacity>
                      </View>
                    }
                  >
                    {/* Summary Chips */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleExpand(workout.id)}
                      style={styles.summaryRow}
                    >
                      <View style={styles.metricItem}>
                        <Ionicons
                          name="fitness-outline"
                          size={15}
                          color={THEME.colors.primary}
                        />
                        <Text style={styles.metricText}>
                          {workout.exercises.length} Exercises
                        </Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={15}
                          color={THEME.colors.secondary}
                        />
                        <Text style={styles.metricText}>{totalSets} Sets Done</Text>
                      </View>

                      <View style={styles.expandChevron}>
                        <Text style={styles.viewDetailsText}>
                          {isExpanded ? 'COLLAPSE' : 'INSPECT'}
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={THEME.colors.textMuted}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Details Breakdown */}
                    {isExpanded && (
                      <View style={styles.detailsContainer}>
                        {workout.exercises.map((ex, exIdx) => (
                          <View key={ex.id} style={styles.exerciseDetailCard}>
                            <Text style={styles.exerciseName}>
                              {exIdx + 1}. {ex.name}
                            </Text>
                            <View style={styles.setsList}>
                              {ex.sets.map((set) => (
                                <View key={set.id} style={styles.setRow}>
                                  <Text style={styles.setIndex}>
                                    SET {set.setNumber}
                                  </Text>
                                  <Text style={styles.setData}>
                                    {set.reps} reps @ {set.weight} {set.unit}
                                  </Text>
                                  <Badge
                                    label={set.isCompleted ? 'COMPLETE' : 'SKIPPED'}
                                    variant={set.isCompleted ? 'success' : 'neutral'}
                                  />
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </SciFiCard>
                );
              })
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: BATTLE ARCHIVES */}
        {/* ======================================================== */}
        {activeTab === 'battles' && (
          <>
            {/* Filter controls strip */}
            <View style={styles.filterStrip}>
              {/* Outcome filter pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {(['all', 'victory', 'defeat', 'abandoned'] as const).map((out) => {
                  const isActive = selectedOutcome === out;
                  return (
                    <TouchableOpacity
                      key={out}
                      style={[styles.pillBtn, isActive && styles.pillBtnActive]}
                      onPress={() => setSelectedOutcome(out)}
                    >
                      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                        {out === 'all' ? 'ALL OUTCOMES' : out.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Mode and sort row */}
              <View style={styles.secondaryFilterRow}>
                <TouchableOpacity
                  style={styles.modeToggle}
                  onPress={() => {
                    setSelectedMode((prev) =>
                      prev === 'all' ? 'solo' : prev === 'solo' ? 'coop' : 'all'
                    );
                  }}
                >
                  <Text style={styles.modeToggleText}>
                    MODE: {selectedMode.toUpperCase()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modeToggle}
                  onPress={() => {
                    setSelectedSort((prev) =>
                      prev === 'recent' ? 'highest_damage' : 'recent'
                    );
                  }}
                >
                  <Text style={styles.modeToggleText}>
                    SORT: {selectedSort === 'recent' ? 'NEWEST' : 'DAMAGE'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Battles List */}
            {battles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="shield-outline"
                  size={64}
                  color={THEME.colors.surfaceBorder}
                />
                <Text style={styles.emptyTitle}>NO BATTLE ARCHIVES</Text>
                <Text style={styles.emptySubtitle}>
                  No combat encounters match your active filters. Engage enemies during workouts to populate after-action records.
                </Text>
                <TerminalButton
                  title="START COMBAT ENCOUNTER"
                  onPress={() => {
                    startNewWorkout('Crusade Mission');
                    router.push('/(tabs)/workout');
                  }}
                  variant="primary"
                  size="md"
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              battles.map((b) => {
                const outcomeVariant =
                  b.outcome === 'victory'
                    ? 'success'
                    : b.outcome === 'abandoned'
                    ? 'primary'
                    : 'danger';

                return (
                  <TouchableOpacity
                    key={b.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedBattleDetail(b)}
                    style={styles.battleCard}
                  >
                    <View style={styles.battleCardHeader}>
                      <View style={styles.battleCardTitleWrap}>
                        <View style={styles.battleEnemyGlyph}>
                          <Ionicons
                            name="flame"
                            size={20}
                            color={
                              b.outcome === 'victory'
                                ? THEME.colors.success
                                : THEME.colors.primary
                            }
                          />
                        </View>
                        <View>
                          <Text style={styles.battleEnemyName} numberOfLines={1}>
                            {b.enemyName.toUpperCase()}
                          </Text>
                          <Text style={styles.battleMissionTitle} numberOfLines={1}>
                            {b.missionTitle}
                          </Text>
                        </View>
                      </View>

                      <Badge
                        label={b.outcome.toUpperCase()}
                        variant={outcomeVariant}
                      />
                    </View>

                    {/* Metadata & Stats Grid */}
                    <View style={styles.battleStatsGrid}>
                      <View style={styles.battleStatBox}>
                        <Text style={styles.battleStatLabel}>TOTAL DAMAGE</Text>
                        <Text style={styles.battleStatVal}>
                          {b.totalDamage.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.battleStatBox}>
                        <Text style={styles.battleStatLabel}>ATTACKS</Text>
                        <Text style={styles.battleStatVal}>{b.totalAttacks}</Text>
                      </View>
                      <View style={styles.battleStatBox}>
                        <Text style={styles.battleStatLabel}>DURATION</Text>
                        <Text style={styles.battleStatVal}>
                          {formatDuration(b.durationSeconds)}
                        </Text>
                      </View>
                      <View style={styles.battleStatBox}>
                        <Text style={styles.battleStatLabel}>XP REWARD</Text>
                        <Text style={[styles.battleStatVal, { color: THEME.colors.primary }]}>
                          +{b.xpEarned}
                        </Text>
                      </View>
                    </View>

                    {/* Card Footer */}
                    <View style={styles.battleCardFooter}>
                      <View style={styles.battleTagsRow}>
                        <Badge
                          label={b.encounterMode.toUpperCase()}
                          variant="neutral"
                          style={{ marginRight: 6 }}
                        />
                        {b.enemyDifficulty && (
                          <Badge
                            label={b.enemyDifficulty.toUpperCase()}
                            variant={getDifficultyBadgeVariant(b.enemyDifficulty)}
                            style={{ marginRight: 6 }}
                          />
                        )}
                      </View>
                      <Text style={styles.battleTimestamp}>
                        {formatDate(b.startedAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Battle Detail Modal */}
      {selectedBattleDetail && (
        <BattleDetailModal
          visible={Boolean(selectedBattleDetail)}
          onClose={() => setSelectedBattleDetail(null)}
          battle={selectedBattleDetail}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.textBright,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 8,
    marginBottom: 16,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  segmentTextActive: {
    color: THEME.colors.primary,
    fontWeight: '900',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metricText: {
    fontSize: 12,
    color: THEME.colors.textMain,
    fontWeight: '600',
    marginLeft: 6,
  },
  expandChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  viewDetailsText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginRight: 4,
    letterSpacing: 0.5,
  },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
  },
  exerciseDetailCard: {
    marginBottom: 12,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 10,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textBright,
    marginBottom: 6,
  },
  setsList: {
    paddingLeft: 4,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  setIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    width: 50,
  },
  setData: {
    fontSize: 12,
    color: THEME.colors.textMain,
    flex: 1,
  },
  filterStrip: {
    marginBottom: 16,
  },
  filterScroll: {
    marginBottom: 8,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginRight: 8,
  },
  pillBtnActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: `${THEME.colors.primary}20`,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  pillTextActive: {
    color: THEME.colors.primary,
    fontWeight: '900',
  },
  secondaryFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  modeToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  battleCard: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  battleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  battleCardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  battleEnemyGlyph: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  battleEnemyName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textBright,
  },
  battleMissionTitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  battleStatsGrid: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    paddingVertical: 8,
    marginBottom: 12,
  },
  battleStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  battleStatLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  battleStatVal: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.textBright,
    marginTop: 2,
  },
  battleCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  battleTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  battleTimestamp: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
