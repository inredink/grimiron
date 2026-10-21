import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { triggerHaptic } from '../../src/utils/haptics';
import { useApp } from '../../src/context/AppContext';
import { THEME } from '../../src/constants/theme';
import { SciFiCard } from '../../src/components/SciFiCard';
import { TerminalButton } from '../../src/components/TerminalButton';
import { SetRow } from '../../src/components/SetRow';
import { RestTimer } from '../../src/components/RestTimer';
import { ExerciseLibraryModal } from '../../src/components/ExerciseLibraryModal';
import { CombatHud } from '../../src/components/CombatHud';
import { MissionSelectorModal } from '../../src/components/MissionSelectorModal';
import { CombatLogModal } from '../../src/components/CombatLogModal';
import { AfterActionReportModal } from '../../src/components/AfterActionReportModal';
import { CoopBossCard } from '../../src/components/CoopBossCard';
import { CoopRaidModal } from '../../src/components/CoopRaidModal';
import { MissionCenterModal } from '../../src/components/MissionCenterModal';
import { ProgramCenterModal } from '../../src/components/ProgramCenterModal';
import { WarfrontDailyBoardModal } from '../../src/components/WarfrontDailyBoardModal';
import { WeeklyRaidModal } from '../../src/components/WeeklyRaidModal';
import { ScheduledProgramSession } from '../../src/types/program';
import { EncounterTemplate, WeeklyRaidCycle } from '../../src/types/warfront';
import { getMissionById } from '../../src/content/missions/catalog';
import { MissionObjectiveDefinition } from '../../src/types/mission';
import { XpAwardResult } from '../../src/services/progression/xpService';
import { calculateWorkoutXp } from '../../src/services/progression/xpCalculator';
import { WorkoutExercise, ExerciseSet, XpBreakdown, WorkoutSession } from '../../src/types/workout';
import { ExerciseDefinition } from '../../src/types/exercise';
import { CombatAfterActionReport, CombatEncounterState } from '../../src/types/combat';
import { getEnemyById } from '../../src/content/combat/enemies';
import { computeCombatState } from '../../src/services/combat/combatEngine';
import { createAttackFromSet } from '../../src/services/combat/attackEngine';
import { coopService, sanitizeCoopAttackPayload } from '../../src/services/supabase/coopService';
import { getQueueStats } from '../../src/services/database/coopQueueRepository';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeWorkout,
    workoutHistory,
    startNewWorkout,
    updateActiveWorkout,
    finishActiveWorkout,
    cancelActiveWorkout,
    repeatWorkout,
    currentMission,
    setCurrentMission,
    activeCoopRaid,
    setActiveCoopRaid,
    currentFaction,
    currentSubfaction,
    activeMissions,
    activeEnrollment,
    enrollInProgram,
    pauseActiveProgram,
    resumeActiveProgram,
    startProgramWorkout,
    logRestDaySessionAction,
    dailyRotation,
    weeklyRaid,
    warfrontSettings,
    setWarfrontSpawnDay,
    deployDailyEncounter,
    deployWeeklyRaid,
    claimWeeklyRaidRewardsAction,
    settings,
    equipmentBonuses,
  } = useApp();

  // Exercise Library Modal State
  const [isLibraryModalVisible, setIsLibraryModalVisible] = useState(false);
  const [isProgramModalVisible, setIsProgramModalVisible] = useState(false);
  const [isDailyBoardModalVisible, setIsDailyBoardModalVisible] = useState(false);
  const [isWeeklyRaidModalVisible, setIsWeeklyRaidModalVisible] = useState(false);

  // Combat Modals State
  const [isMissionModalVisible, setIsMissionModalVisible] = useState(false);
  const [isFactionMissionCenterVisible, setIsFactionMissionCenterVisible] = useState(false);
  const [isCombatLogVisible, setIsCombatLogVisible] = useState(false);
  const [isCoopModalVisible, setIsCoopModalVisible] = useState(false);
  const [coopQueueStats, setCoopQueueStats] = useState(() => {
    try {
      return getQueueStats();
    } catch {
      return { pending: 0, synced: 0 };
    }
  });
  const [lastCompletedSetId, setLastCompletedSetId] = useState<string | undefined>(undefined);
  const [afterActionReport, setAfterActionReport] = useState<CombatAfterActionReport | null>(null);

  // Rest Timer State
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerKey, setRestTimerKey] = useState(Date.now());

  // Legacy fallback finish modal state
  const [finishResult, setFinishResult] = useState<{
    xpEarned: number;
    breakdown: XpBreakdown;
    xpAward?: XpAwardResult;
  } | null>(null);

  // Current Target Hostile
  const currentEnemy = useMemo(
    () => getEnemyById(currentMission.enemyId),
    [currentMission.enemyId]
  );

  const currentProgramSession: ScheduledProgramSession | null = useMemo(() => {
    if (!activeEnrollment) return null;
    const snap = activeEnrollment.programSnapshot;
    const block =
      snap.blocks.find(
        (b) => b.blockNumber === activeEnrollment.currentBlockNumber
      ) || snap.blocks[0];
    if (!block || !block.sessions) return null;
    return (
      block.sessions[activeEnrollment.currentSessionIndex] || block.sessions[0]
    );
  }, [activeEnrollment]);

  // Pure functional combat encounter state derived from completed sets
  const combatState: CombatEncounterState = useMemo(() => {
    if (!activeWorkout) {
      return {
        missionId: currentMission.id,
        enemy: currentEnemy,
        maxHealth: currentEnemy.baseHealth,
        currentHealth: currentEnemy.baseHealth,
        isDefeated: false,
        totalDamage: 0,
        overkillDamage: 0,
        attacks: [],
      };
    }
    return computeCombatState(
      currentEnemy,
      currentMission,
      activeWorkout.exercises,
      lastCompletedSetId,
      currentFaction?.id,
      currentSubfaction?.id,
      equipmentBonuses
    );
  }, [activeWorkout, currentEnemy, currentMission, lastCompletedSetId, currentFaction?.id, currentSubfaction?.id, equipmentBonuses]);

  // Live estimated XP
  const currentBreakdown = activeWorkout
    ? calculateWorkoutXp(activeWorkout.exercises, true)
    : null;

  const handleStartWorkout = () => {
    startNewWorkout('Crusade Training', currentMission);
  };

  const handleRepeatRecentWorkout = () => {
    if (workoutHistory.length === 0) return;
    const mostRecent = workoutHistory[0];
    repeatWorkout(mostRecent.id);
  };

  const handleSelectFromLibrary = (exercise: ExerciseDefinition) => {
    const baseWorkout: WorkoutSession = activeWorkout || {
      id: `session_${Date.now()}`,
      title: 'Crusade Training',
      startedAt: new Date().toISOString(),
      totalXpEarned: 0,
      isCompleted: false,
      exercises: [],
    };

    const preferredUnit = settings.workout_weight_unit || 'lbs';
    const isBodyweight =
      exercise.equipment === 'bodyweight' ||
      settings.exercise_default_weight_behavior === 'bodyweight';

    const newExercise: WorkoutExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: baseWorkout.id,
      exerciseRefId: exercise.id,
      name: exercise.name,
      sortOrder: baseWorkout.exercises.length,
      sets: [
        {
          id: `set_${Date.now()}_1`,
          exerciseId: '',
          setNumber: 1,
          reps: 10,
          weight: isBodyweight ? 0 : (preferredUnit === 'lbs' ? 45 : 20),
          unit: preferredUnit,
          isCompleted: false,
          setClassification: 'working',
        },
      ],
    };

    updateActiveWorkout({
      ...baseWorkout,
      exercises: [...baseWorkout.exercises, newExercise],
    });

    setIsLibraryModalVisible(false);
  };

  const handleAddSet = (exerciseId: string) => {
    if (!activeWorkout) return;

    const updatedExercises = activeWorkout.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;

      const lastSet = ex.sets[ex.sets.length - 1];
      const newSet: ExerciseSet = {
        id: `set_${Date.now()}_${ex.sets.length + 1}`,
        exerciseId: ex.id,
        setNumber: ex.sets.length + 1,
        reps: lastSet ? lastSet.reps : 10,
        weight: lastSet ? lastSet.weight : 0,
        unit: lastSet ? lastSet.unit : (settings.workout_weight_unit || 'lbs'),
        isCompleted: false,
        setClassification: lastSet ? lastSet.setClassification : 'working',
      };

      return {
        ...ex,
        sets: [...ex.sets, newSet],
      };
    });

    updateActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const handleDuplicateSet = (exerciseId: string, setToDuplicate: ExerciseSet) => {
    if (!activeWorkout) return;

    const updatedExercises = activeWorkout.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;

      const duplicateSet: ExerciseSet = {
        id: `set_${Date.now()}_dup_${Math.random().toString(36).substring(2, 5)}`,
        exerciseId: ex.id,
        setNumber: ex.sets.length + 1,
        reps: setToDuplicate.reps,
        weight: setToDuplicate.weight,
        unit: setToDuplicate.unit,
        isCompleted: false,
        setClassification: setToDuplicate.setClassification || 'working',
      };

      const newSets = [...ex.sets, duplicateSet].map((s, idx) => ({
        ...s,
        setNumber: idx + 1,
      }));

      return {
        ...ex,
        sets: newSets,
      };
    });

    updateActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const handleUpdateSet = (exerciseId: string, updatedSet: ExerciseSet) => {
    if (!activeWorkout) return;

    const updatedExercises = activeWorkout.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => (s.id === updatedSet.id ? updatedSet : s)),
      };
    });

    updateActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    if (!activeWorkout) return;

    const updatedExercises = activeWorkout.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      const remainingSets = ex.sets.filter((s) => s.id !== setId);
      return {
        ...ex,
        sets: remainingSets.map((s, idx) => ({ ...s, setNumber: idx + 1 })),
      };
    });

    updateActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (!activeWorkout) return;

    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise and its sets?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const filtered = activeWorkout.exercises.filter((ex) => ex.id !== exerciseId);
            updateActiveWorkout({ ...activeWorkout, exercises: filtered });
          },
        },
      ]
    );
  };

  const handleSetCompleted = (isNowCompleted: boolean, setId: string) => {
    if (isNowCompleted) {
      // Auto-start rest timer only if enabled in user settings
      if (settings.workout_auto_start_rest_timer) {
        setRestTimerKey(Date.now());
        setShowRestTimer(true);
      }
      setLastCompletedSetId(setId);

      // Find exercise and set to deliver tactical combat feedback
      let targetEx: WorkoutExercise | undefined;
      let targetSet: ExerciseSet | undefined;
      for (const ex of activeWorkout?.exercises || []) {
        const found = ex.sets.find((s) => s.id === setId);
        if (found) {
          targetEx = ex;
          targetSet = found;
          break;
        }
      }

      if (targetEx && targetSet) {
        const attack = createAttackFromSet(
          targetSet,
          targetEx.name,
          targetEx.exerciseRefId,
          currentFaction?.id,
          currentSubfaction?.id,
          equipmentBonuses
        );

        if (attack.isCrit) {
          triggerHaptic.heavy();
        }

        // Asynchronous Cooperative Boss Assault
        if (activeCoopRaid && !activeCoopRaid.isDefeated) {
          const sanitizedPayload = sanitizeCoopAttackPayload({
            groupBossId: activeCoopRaid.bossId,
            clientSetId: targetSet.id,
            exerciseName: targetEx.name,
            attackName: attack.attackName,
            styleName: attack.styleName,
            damage: attack.damage,
            weight: targetSet.weight,
            reps: targetSet.reps,
          });

          coopService
            .recordAttack(sanitizedPayload)
            .then((result) => {
              try {
                setCoopQueueStats(getQueueStats());
              } catch {}
              if (result.newHp !== undefined && activeCoopRaid) {
                if (result.isDefeated) {
                  triggerHaptic.success();
                }
                setActiveCoopRaid({
                  ...activeCoopRaid,
                  bossCurrentHp: result.newHp,
                  isDefeated: Boolean(result.isDefeated),
                  updatedAt: new Date().toISOString(),
                });
              }
            })
            .catch((err) => {
              console.warn('Co-op attack dispatch background err:', err);
            });
        }
      }
    }
  };

  const handleConfirmFinish = () => {
    if (!activeWorkout || activeWorkout.exercises.length === 0) {
      Alert.alert('Empty Mission', 'Add at least one exercise and complete a set to record training.');
      return;
    }

    const hasCompletedSet = activeWorkout.exercises.some((ex) =>
      ex.sets.some((s) => s.isCompleted)
    );

    if (!hasCompletedSet) {
      Alert.alert(
        'No Sets Completed',
        'Mark at least one set completed by tapping the checkmark before finishing your session.'
      );
      return;
    }

    const executeFinish = () => {
      try {
        const result = finishActiveWorkout(combatState, currentMission);
        if (result) {
          triggerHaptic.success();
          setShowRestTimer(false);
          if (result.report) {
            setAfterActionReport(result.report);
          } else {
            setFinishResult(result);
          }
        }
      } catch (err: any) {
        console.error('Failed to complete workout session:', err);
        Alert.alert(
          'Crusade Session Error',
          'An issue occurred while recording your mission: ' + (err?.message || 'Unknown error')
        );
      }
    };

    if (settings.workout_confirm_finish) {
      Alert.alert(
        'Complete Crusade Session?',
        'Submit combat encounter performance and record accumulated Glory XP?',
        [
          { text: 'Keep Training', style: 'cancel' },
          { text: 'Complete Session', style: 'default', onPress: executeFinish },
        ]
      );
    } else {
      executeFinish();
    }
  };

  const handleCancelWorkout = () => {
    if (settings.workout_warn_unsaved) {
      Alert.alert(
        'Abort Crusade Mission?',
        'Are you sure you want to discard this in-progress workout session? Unsaved progress will be lost.',
        [
          { text: 'Resume', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              cancelActiveWorkout();
              setShowRestTimer(false);
            },
          },
        ]
      );
    } else {
      cancelActiveWorkout();
      setShowRestTimer(false);
    }
  };

  const renderCompletionModals = () => (
    <>
      {/* ==========================================
          AFTER-ACTION COMBAT & XP REPORT MODAL
         ========================================== */}
      <AfterActionReportModal
        visible={afterActionReport !== null}
        report={afterActionReport}
        onClose={() => {
          setAfterActionReport(null);
          router.replace('/(tabs)');
        }}
      />

      {/* ==========================================
          FALLBACK WORKOUT COMPLETED SUMMARY MODAL
         ========================================== */}
      <Modal
        visible={finishResult !== null && afterActionReport === null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setFinishResult(null);
          router.replace('/(tabs)');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.victoryCard}>
            <Ionicons name="medal" size={54} color={THEME.colors.primary} />
            <Text style={styles.victoryTitle}>MISSION ACCOMPLISHED</Text>
            <Text style={styles.victorySubtitle}>
              Your training has been recorded in the Chapter Annals.
            </Text>

            {finishResult && (
              <View style={styles.rewardBox}>
                <Text style={styles.rewardTotal}>+{finishResult.xpEarned} XP</Text>
                <View style={styles.rewardDivider} />
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardItemLabel}>Base Mission Completion:</Text>
                  <Text style={styles.rewardItemValue}>+{finishResult.breakdown.baseWorkoutXp} XP</Text>
                </View>
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardItemLabel}>Completed Working Sets:</Text>
                  <Text style={styles.rewardItemValue}>+{finishResult.breakdown.completedSetsXp} XP</Text>
                </View>
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardItemLabel}>Repetition Endurance:</Text>
                  <Text style={styles.rewardItemValue}>+{finishResult.breakdown.repsXp} XP</Text>
                </View>
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardItemLabel}>Tonnage / Volume Factor:</Text>
                  <Text style={styles.rewardItemValue}>+{finishResult.breakdown.volumeXp} XP</Text>
                </View>
                {finishResult.xpAward?.isCapped && (
                  <View style={styles.dailyCapNoticeBox}>
                    <Ionicons name="information-circle-outline" size={16} color={THEME.colors.warning} />
                    <Text style={styles.dailyCapNoticeText}>
                      Daily Training Quota Reached: Credited {finishResult.xpAward.creditedAmount} of {finishResult.xpAward.requestedAmount} XP ({finishResult.xpAward.spilloverAmount} XP spillover). Training log preserved.
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TerminalButton
              title="RETURN TO COMMAND TERMINAL"
              onPress={() => {
                setFinishResult(null);
                router.replace('/(tabs)');
              }}
              variant="primary"
              size="lg"
              style={{ width: '100%', marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </>
  );

  // If no active workout, display clean launcher card
  if (!activeWorkout) {
    const mostRecent = workoutHistory[0];

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.emptyContainer,
            { paddingBottom: Math.max(80, insets.bottom + 60) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Header & Settings Quick Access */}
          <View style={styles.topLauncherHeader}>
            <View style={styles.terminalStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.terminalStatusText}>CRUSADE TERMINAL // ARMED</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic.selection();
                router.push('/settings');
              }}
              style={styles.settingsHeaderButton}
              accessibilityLabel="Open Settings"
              accessibilityRole="button"
            >
              <Ionicons name="settings-sharp" size={17} color={THEME.colors.primary} />
            </TouchableOpacity>
          </View>

          <Ionicons name="shield-half-outline" size={60} color={THEME.colors.primary} />
          <Text style={styles.emptyTitle}>MISSION BRIEFING TERMINAL</Text>
          <Text style={styles.emptySubtitle}>
            Prepare for combat engagement. Strike down hostile forces with completed workout sets to earn XP, level up, and advance through your faction ranks.
          </Text>

          {/* Active Co-op Raid Target or Squad Recruitment CTA */}
          {activeCoopRaid ? (
            <CoopBossCard
              raid={activeCoopRaid}
              pendingSyncCount={coopQueueStats.pending}
              onOpenRaidModal={() => setIsCoopModalVisible(true)}
              onSyncPending={() => {
                coopService.flushOfflineQueue().then(() => {
                  try {
                    setCoopQueueStats(getQueueStats());
                  } catch {}
                });
              }}
            />
          ) : (
            <TouchableOpacity
              style={styles.squadCtaCard}
              onPress={() => setIsCoopModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="people" size={24} color={THEME.colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.squadCtaTitle}>COOPERATIVE CRUSADE SQUAD</Text>
                <Text style={styles.squadCtaSubtitle}>
                  Assault massive shared bosses with your friends asynchronously through real workouts.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Active Target Hostile Preview Card */}
          <View style={styles.targetPreviewCard}>
            <View style={styles.targetTopRow}>
              <View
                style={[
                  styles.targetIconBox,
                  { borderColor: currentEnemy.visual.primaryColor },
                ]}
              >
                <Ionicons
                  name={currentEnemy.visual.iconName as any}
                  size={24}
                  color={currentEnemy.visual.primaryColor}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.targetFaction}>{currentEnemy.faction.toUpperCase()}</Text>
                  <View style={[styles.targetDiffBadge, { borderColor: currentEnemy.visual.accentColor }]}>
                    <Text style={[styles.targetDiffText, { color: currentEnemy.visual.accentColor }]}>
                      {currentMission.difficulty.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.targetEnemyName}>{currentEnemy.name}</Text>
                <Text style={styles.targetMissionTitle}>Objective: {currentMission.title}</Text>
              </View>
              <TouchableOpacity
                style={styles.changeTargetButton}
                onPress={() => setIsMissionModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-horizontal" size={14} color={THEME.colors.primary} />
                <Text style={styles.changeTargetText}>CHANGE</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.targetFooter}>
              <Text style={styles.targetFooterText}>
                Hostile HP: {currentEnemy.baseHealth} • Recom. Sets: ~{currentMission.recommendedSets} • Glory Bonus: +{currentMission.gloryBonusXp} XP
              </Text>
            </View>
          </View>

          <TerminalButton
            title={`ENGAGE HOSTILE // DEPLOY CRUSADE`}
            onPress={handleStartWorkout}
            variant="primary"
            size="lg"
            icon={<Ionicons name="play" size={18} color="#0A0E17" />}
            style={styles.startButton}
          />

          <TerminalButton
            title="OPEN EXERCISE ARMORY"
            onPress={() => setIsLibraryModalVisible(true)}
            variant="outline"
            size="md"
            icon={<Ionicons name="albums-outline" size={16} color={THEME.colors.primary} />}
            style={{ width: '100%', marginBottom: THEME.spacing.sm }}
          />

          {/* Scheduled Program Quick Start */}
          {activeEnrollment && currentProgramSession && !currentProgramSession.isRestDay && (
            <TerminalButton
              title={`DEPLOY SCHEDULED: ${currentProgramSession.title.toUpperCase()}`}
              onPress={() => startProgramWorkout(currentProgramSession)}
              variant="secondary"
              size="md"
              icon={<Ionicons name="flash-outline" size={16} color={THEME.colors.primary} />}
              style={{ width: '100%', marginBottom: THEME.spacing.sm }}
            />
          )}

          <TerminalButton
            title={
              activeEnrollment
                ? `TRAINING PROGRAM: ${activeEnrollment.programTitle.toUpperCase()}`
                : 'TRAINING PROGRAM CENTER'
            }
            onPress={() => setIsProgramModalVisible(true)}
            variant="outline"
            size="md"
            icon={<Ionicons name="calendar-outline" size={16} color={THEME.colors.primary} />}
            style={{ width: '100%', marginBottom: THEME.spacing.sm }}
          />

          <TerminalButton
            title={
              activeMissions.length > 0
                ? `VIEW FACTION MISSIONS (${activeMissions.length} ACTIVE)`
                : 'FACTION MISSION CENTER'
            }
            onPress={() => setIsFactionMissionCenterVisible(true)}
            variant={activeMissions.length > 0 ? 'secondary' : 'outline'}
            size="md"
            icon={<Ionicons name="flag-outline" size={16} color={THEME.colors.primary} />}
            style={{ width: '100%', marginBottom: THEME.spacing.sm }}
          />

          <TerminalButton
            title="WARFRONT // DAILY ENGAGEMENTS"
            onPress={() => setIsDailyBoardModalVisible(true)}
            variant="secondary"
            size="md"
            icon={<Ionicons name="compass-outline" size={16} color={THEME.colors.primary} />}
            style={{ width: '100%', marginBottom: THEME.spacing.sm }}
          />

          <TerminalButton
            title={
              weeklyRaid
                ? `WEEKLY RAID: ${weeklyRaid.boss.name.toUpperCase()}`
                : 'WEEKLY RAID BOSS'
            }
            onPress={() => setIsWeeklyRaidModalVisible(true)}
            variant={weeklyRaid?.status === 'active' ? 'primary' : 'outline'}
            size="md"
            icon={<Ionicons name="skull-outline" size={16} color={THEME.colors.primary} />}
            style={{ width: '100%', marginBottom: THEME.spacing.sm }}
          />

          {mostRecent && (
            <TerminalButton
              title={`REPEAT RECENT: ${mostRecent.title.toUpperCase()}`}
              onPress={handleRepeatRecentWorkout}
              variant="outline"
              size="md"
              icon={<Ionicons name="repeat" size={16} color={THEME.colors.primary} />}
              style={styles.repeatButton}
            />
          )}
        </ScrollView>

        <ExerciseLibraryModal
          visible={isLibraryModalVisible}
          onClose={() => setIsLibraryModalVisible(false)}
          onSelectExercise={handleSelectFromLibrary}
        />

        <MissionSelectorModal
          visible={isMissionModalVisible}
          selectedMissionId={currentMission.id}
          onSelectMission={setCurrentMission}
          onClose={() => setIsMissionModalVisible(false)}
        />

        <MissionCenterModal
          visible={isFactionMissionCenterVisible}
          onClose={() => setIsFactionMissionCenterVisible(false)}
        />

        <ProgramCenterModal
          visible={isProgramModalVisible}
          onClose={() => setIsProgramModalVisible(false)}
          activeEnrollment={activeEnrollment}
          onEnrollProgram={enrollInProgram}
          onPauseProgram={pauseActiveProgram}
          onResumeProgram={resumeActiveProgram}
          onStartScheduledWorkout={(session) => {
            startProgramWorkout(session);
            setIsProgramModalVisible(false);
          }}
          onLogRestDay={logRestDaySessionAction}
        />

        {/* Warfront Daily Engagements Board Modal */}
        <WarfrontDailyBoardModal
          visible={isDailyBoardModalVisible}
          onClose={() => setIsDailyBoardModalVisible(false)}
          dailyRotation={dailyRotation}
          onDeployEncounter={(enc) => {
            deployDailyEncounter(enc);
            setIsDailyBoardModalVisible(false);
          }}
          preferredSpawnDay={warfrontSettings.preferredSpawnDay}
          onSetSpawnDay={setWarfrontSpawnDay}
        />

        {/* Weekly Raid Boss Encounter Modal */}
        <WeeklyRaidModal
          visible={isWeeklyRaidModalVisible}
          onClose={() => setIsWeeklyRaidModalVisible(false)}
          weeklyRaid={weeklyRaid}
          preferredSpawnDay={warfrontSettings.preferredSpawnDay}
          onSetSpawnDay={setWarfrontSpawnDay}
          onDeployRaidWorkout={(raid) => {
            deployWeeklyRaid(raid);
            setIsWeeklyRaidModalVisible(false);
          }}
          onClaimRewards={claimWeeklyRaidRewardsAction}
        />

        {/* Completion & After-Action Modals */}
        {renderCompletionModals()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              (showRestTimer ? 160 : 100) + Math.max(insets.bottom, 20),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Active Mission Header */}
        <View style={styles.missionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.activeLabel}>MISSION IN PROGRESS</Text>
            <TextInput
              style={styles.titleInput}
              value={activeWorkout.title}
              onChangeText={(text) =>
                updateActiveWorkout({ ...activeWorkout, title: text })
              }
              placeholder="Crusade Training"
              placeholderTextColor={THEME.colors.textDisabled}
            />
          </View>

          <View style={styles.headerRightActions}>
            {/* Crusade Squad Raid Button */}
            <TouchableOpacity
              onPress={() => setIsCoopModalVisible(true)}
              style={[styles.headerIconButton, activeCoopRaid && styles.headerIconButtonActive]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="people"
                size={18}
                color={activeCoopRaid ? THEME.colors.primary : THEME.colors.textMuted}
              />
            </TouchableOpacity>

            {/* Rest Timer Toggle Button */}
            <TouchableOpacity
              onPress={() => setShowRestTimer(!showRestTimer)}
              style={[styles.headerIconButton, showRestTimer && styles.headerIconButtonActive]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="hourglass-outline"
                size={20}
                color={showRestTimer ? THEME.colors.secondary : THEME.colors.textMuted}
              />
            </TouchableOpacity>

            {/* Tactical Settings Button */}
            <TouchableOpacity
              onPress={() => {
                triggerHaptic.selection();
                router.push('/settings');
              }}
              style={styles.headerIconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Open Settings"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={19} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            {/* Abort Button */}
            <TouchableOpacity
              onPress={handleCancelWorkout}
              style={styles.headerIconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle-outline" size={22} color={THEME.colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cooperative Crusade Squad Raid Target (Shared Boss) */}
        {activeCoopRaid && (
          <CoopBossCard
            raid={activeCoopRaid}
            pendingSyncCount={coopQueueStats.pending}
            onOpenRaidModal={() => setIsCoopModalVisible(true)}
            onSyncPending={() => {
              coopService.flushOfflineQueue().then(() => {
                try {
                  setCoopQueueStats(getQueueStats());
                } catch {}
              });
            }}
          />
        )}

        {/* Solo Combat Hostile Encounter HUD */}
        <CombatHud
          encounter={combatState}
          lastAttack={combatState.lastAttack}
          onOpenCombatLog={() => setIsCombatLogVisible(true)}
          onSwitchMission={() => setIsMissionModalVisible(true)}
        />

        {/* Active Faction Directive Banner */}
        {activeMissions.length > 0 && (() => {
          const firstRecord = activeMissions[0];
          const missionDef = firstRecord.mission || getMissionById(firstRecord.missionId);
          if (!missionDef) return null;
          return (
            <TouchableOpacity
              style={styles.activeMissionWorkoutBanner}
              onPress={() => setIsFactionMissionCenterVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.activeMissionWorkoutHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="flag-outline" size={14} color={THEME.colors.primary} />
                  <Text style={styles.activeMissionWorkoutTag}>
                    FACTION DIRECTIVE // {missionDef.category.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.activeMissionWorkoutLink}>DETAILS ›</Text>
              </View>
              <Text style={styles.activeMissionWorkoutTitle} numberOfLines={1}>
                {missionDef.title}
              </Text>
              {missionDef.objectives.slice(0, 2).map((obj: MissionObjectiveDefinition) => {
                const progRecord = firstRecord.objectives?.find((o) => o.objectiveId === obj.id);
                const currentVal = progRecord ? progRecord.currentValue : 0;
                const pct = Math.min(100, Math.round((currentVal / obj.targetValue) * 100));
                return (
                  <View key={obj.id} style={{ marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={styles.activeMissionWorkoutObjText} numberOfLines={1}>
                        {obj.description}
                      </Text>
                      <Text style={styles.activeMissionWorkoutObjProgress}>
                        {currentVal} / {obj.targetValue}
                      </Text>
                    </View>
                    <View style={styles.miniProgressBarTrack}>
                      <View style={[styles.miniProgressBarFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })}
            </TouchableOpacity>
          );
        })()}

        {/* Real-time Estimated XP Banner */}
        {currentBreakdown && (
          <SciFiCard variant="accent" style={styles.xpBanner}>
            <View style={styles.xpBannerRow}>
              <View>
                <Text style={styles.xpBannerLabel}>ESTIMATED REWARD</Text>
                <Text style={styles.xpBannerValue}>
                  +{currentBreakdown.totalXp} XP
                </Text>
              </View>
              <View style={styles.xpSubBreakdown}>
                <Text style={styles.xpSubText}>Base: {currentBreakdown.baseWorkoutXp}</Text>
                <Text style={styles.xpSubText}>Sets: +{currentBreakdown.completedSetsXp}</Text>
                <Text style={styles.xpSubText}>Reps: +{currentBreakdown.repsXp}</Text>
                <Text style={styles.xpSubText}>Vol: +{currentBreakdown.volumeXp}</Text>
              </View>
            </View>
          </SciFiCard>
        )}

        {/* Exercises List */}
        {activeWorkout.exercises.map((exercise) => (
          <SciFiCard
            key={exercise.id}
            title={exercise.name}
            rightAction={
              <TouchableOpacity
                onPress={() => handleDeleteExercise(exercise.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} color={THEME.colors.danger} />
              </TouchableOpacity>
            }
          >
            {/* Table Header */}
            <View style={styles.setTableHeader}>
              <Text style={[styles.headerCol, { width: 48 }]}>TYPE/#</Text>
              <Text style={[styles.headerCol, { flex: 2 }]}>WEIGHT</Text>
              <Text style={[styles.headerCol, { flex: 2 }]}>REPS</Text>
              <View style={{ width: 22 }} />
              <Text style={[styles.headerCol, { width: 34, textAlign: 'center' }]}>DONE</Text>
              <View style={{ width: 22 }} />
            </View>

            {/* Set Rows */}
            {exercise.sets.map((set, idx) => (
              <SetRow
                key={set.id}
                set={set}
                index={idx}
                onUpdate={(updated) => handleUpdateSet(exercise.id, updated)}
                onDelete={() => handleDeleteSet(exercise.id, set.id)}
                onDuplicate={() => handleDuplicateSet(exercise.id, set)}
                onCompletedChange={handleSetCompleted}
              />
            ))}

            {/* Add Set Button */}
            <TouchableOpacity
              style={styles.addSetButton}
              onPress={() => handleAddSet(exercise.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={THEME.colors.primary} />
              <Text style={styles.addSetText}>ADD WORKING SET</Text>
            </TouchableOpacity>
          </SciFiCard>
        ))}

        {/* Add Exercise Trigger Button */}
        <TerminalButton
          title="+ DEPLOY EXERCISE FROM ARMORY"
          onPress={() => setIsLibraryModalVisible(true)}
          variant="outline"
          size="md"
          icon={<Ionicons name="albums-outline" size={18} color={THEME.colors.primary} />}
          style={styles.addExerciseButton}
        />

        {/* Finish Workout Primary Button */}
        <TerminalButton
          title="COMPLETE MISSION // CLAIM XP"
          onPress={handleConfirmFinish}
          variant="success"
          size="lg"
          icon={<Ionicons name="trophy" size={20} color="#0A0E17" />}
          style={styles.finishButton}
        />
      </ScrollView>

      {/* Floating Tactical Rest Timer HUD pinned above bottom bar */}
      {showRestTimer && (
        <View
          style={[
            styles.floatingTimerContainer,
            { bottom: Math.max(12, insets.bottom + 4) },
          ]}
        >
          <RestTimer
            key={restTimerKey}
            initialSeconds={settings.workout_default_rest_duration || 90}
            autoStart={settings.workout_auto_start_rest_timer}
            visible={showRestTimer}
            onClose={() => setShowRestTimer(false)}
          />
        </View>
      )}

      {/* ==========================================
          EXERCISE LIBRARY ARMORY MODAL (100+ Catalog)
         ========================================== */}
      <ExerciseLibraryModal
        visible={isLibraryModalVisible}
        onClose={() => setIsLibraryModalVisible(false)}
        onSelectExercise={handleSelectFromLibrary}
      />

      {/* ==========================================
          COMBAT MISSION SELECTOR MODAL
         ========================================== */}
      <MissionSelectorModal
        visible={isMissionModalVisible}
        selectedMissionId={currentMission.id}
        onSelectMission={setCurrentMission}
        onClose={() => setIsMissionModalVisible(false)}
      />

      {/* ==========================================
          COMBAT LOG TELEMETRY MODAL
         ========================================== */}
      <CombatLogModal
        visible={isCombatLogVisible}
        attacks={combatState.attacks}
        totalDamage={combatState.totalDamage}
        enemyName={currentEnemy.name}
        onClose={() => setIsCombatLogVisible(false)}
      />

      {/* ==========================================
          AFTER-ACTION & COMPLETION MODALS
         ========================================== */}
      {renderCompletionModals()}

      {/* ==========================================
          COOPERATIVE CRUSADE SQUAD & RAID MODAL
         ========================================== */}
      <CoopRaidModal
        visible={isCoopModalVisible}
        onClose={() => {
          setIsCoopModalVisible(false);
          try {
            setCoopQueueStats(getQueueStats());
          } catch {}
        }}
        activeRaid={activeCoopRaid}
        onSelectActiveRaid={setActiveCoopRaid}
      />

      {/* ==========================================
          FACTION MISSION CENTER TERMINAL MODAL
         ========================================== */}
      <MissionCenterModal
        visible={isFactionMissionCenterVisible}
        onClose={() => setIsFactionMissionCenterVisible(false)}
      />

      <ProgramCenterModal
        visible={isProgramModalVisible}
        onClose={() => setIsProgramModalVisible(false)}
        activeEnrollment={activeEnrollment}
        onEnrollProgram={enrollInProgram}
        onPauseProgram={pauseActiveProgram}
        onResumeProgram={resumeActiveProgram}
        onStartScheduledWorkout={(session) => {
          startProgramWorkout(session);
          setIsProgramModalVisible(false);
        }}
        onLogRestDay={logRestDaySessionAction}
      />

      {/* Warfront Daily Engagements Board Modal */}
      <WarfrontDailyBoardModal
        visible={isDailyBoardModalVisible}
        onClose={() => setIsDailyBoardModalVisible(false)}
        dailyRotation={dailyRotation}
        onDeployEncounter={(enc) => {
          deployDailyEncounter(enc);
          setIsDailyBoardModalVisible(false);
        }}
        preferredSpawnDay={warfrontSettings.preferredSpawnDay}
        onSetSpawnDay={setWarfrontSpawnDay}
      />

      {/* Weekly Raid Boss Encounter Modal */}
      <WeeklyRaidModal
        visible={isWeeklyRaidModalVisible}
        onClose={() => setIsWeeklyRaidModalVisible(false)}
        weeklyRaid={weeklyRaid}
        preferredSpawnDay={warfrontSettings.preferredSpawnDay}
        onSetSpawnDay={setWarfrontSpawnDay}
        onDeployRaidWorkout={(raid) => {
          deployWeeklyRaid(raid);
          setIsWeeklyRaidModalVisible(false);
        }}
        onClaimRewards={claimWeeklyRaidRewardsAction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  squadCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1522',
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    width: '100%',
  },
  squadCtaTitle: {
    fontSize: 13,
    color: THEME.colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  squadCtaSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xxl,
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
  },
  topLauncherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  terminalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.success,
    marginRight: 6,
  },
  terminalStatusText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  settingsHeaderButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  emptyTitle: {
    color: THEME.colors.primary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 16,
  },
  emptySubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  startButton: {
    marginTop: 24,
    width: '100%',
  },
  repeatButton: {
    marginTop: 12,
    width: '100%',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  activeLabel: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  titleInput: {
    color: THEME.colors.textBright,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
    minWidth: 200,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: 6,
    marginLeft: 6,
  },
  headerIconButtonActive: {
    backgroundColor: '#0A2D33',
    borderRadius: THEME.borderRadius.sm,
  },
  xpBanner: {
    backgroundColor: '#19231A',
    borderColor: THEME.colors.success,
    marginVertical: 4,
  },
  xpBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpBannerLabel: {
    color: THEME.colors.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  xpBannerValue: {
    color: THEME.colors.textBright,
    fontSize: 22,
    fontWeight: '900',
  },
  xpSubBreakdown: {
    alignItems: 'flex-end',
  },
  xpSubText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  setTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  headerCol: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.colors.primaryMuted,
  },
  addSetText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.8,
  },
  addExerciseButton: {
    marginVertical: THEME.spacing.sm,
  },
  finishButton: {
    marginTop: THEME.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.md,
  },
  victoryCard: {
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    padding: THEME.spacing.lg,
    alignItems: 'center',
  },
  victoryTitle: {
    color: THEME.colors.primary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 12,
  },
  victorySubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  rewardBox: {
    width: '100%',
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: THEME.spacing.md,
    marginTop: 16,
  },
  rewardTotal: {
    color: THEME.colors.success,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  rewardDivider: {
    height: 1,
    backgroundColor: THEME.colors.surfaceBorder,
    marginVertical: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  rewardItemLabel: {
    color: THEME.colors.textMuted,
    fontSize: 12,
  },
  rewardItemValue: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '700',
  },
  floatingTimerContainer: {
    position: 'absolute',
    bottom: 12,
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
  },
  targetPreviewCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  targetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#0A0F1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFaction: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginRight: 6,
  },
  targetDiffBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
  },
  targetDiffText: {
    fontSize: 8,
    fontWeight: '900',
  },
  targetEnemyName: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 1,
  },
  targetMissionTitle: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  changeTargetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: THEME.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginLeft: 6,
  },
  changeTargetText: {
    color: THEME.colors.primary,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 3,
  },
  targetFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 8,
    marginTop: 10,
  },
  targetFooterText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeMissionWorkoutBanner: {
    backgroundColor: '#0F1522',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  activeMissionWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeMissionWorkoutTag: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  activeMissionWorkoutLink: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  activeMissionWorkoutTitle: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  activeMissionWorkoutObjText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    flex: 1,
    marginRight: 8,
  },
  activeMissionWorkoutObjProgress: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  miniProgressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  miniProgressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
    borderRadius: 2,
  },
  dailyCapNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 170, 0, 0.12)',
    borderWidth: 1,
    borderColor: THEME.colors.warning,
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
    gap: 6,
  },
  dailyCapNoticeText: {
    flex: 1,
    color: THEME.colors.warning,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
});
