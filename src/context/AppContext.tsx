import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CharacterProfile, CharacterProgression, UserStats } from '../types/character';
import { WorkoutSession, WorkoutExercise, ExerciseSet, XpBreakdown } from '../types/workout';
import { Faction, Subfaction } from '../content/types';
import { warhammer40kUniverse, getFactionById, getSubfactionById } from '../content/warhammer40k';
import {
  initializeDatabase,
} from '../services/database/db';
import {
  getCharacterProfile,
  updateFactionAllegiance,
  getUserCareerStats,
} from '../services/database/characterRepository';
import {
  saveCompletedWorkout,
  getAllWorkouts,
  cloneWorkoutForRepeat,
} from '../services/database/workoutRepository';
import { calculateProgression } from '../services/progression/rankEngine';
import { calculateWorkoutXp } from '../services/progression/xpCalculator';
import {
  CombatMission,
  CombatEncounterState,
  CombatAfterActionReport,
} from '../types/combat';
import { getDefaultMission } from '../content/combat/missions';
import { saveCombatEncounter } from '../services/database/combatRepository';
import { buildAfterActionReport } from '../services/combat/combatEngine';
import { ActiveCoopRaid } from '../types/coop';
import {
  getActiveRaid,
  saveActiveRaid,
  clearActiveRaid,
} from '../services/database/coopQueueRepository';
import { coopService } from '../services/supabase/coopService';
import { recordBattleHistory } from '../services/database/battleHistoryRepository';
import {
  BattleRecord,
  BattleParticipantContribution,
  BattleTimelineEvent,
} from '../types/battleHistory';
import {
  buildEvaluationContextFromDb,
  runEvaluationWithDb,
  backfillHistoricalAchievements,
} from '../services/database/achievementContextBuilder';
import {
  getPendingNotifications,
  dismissNotification,
} from '../services/database/achievementRepository';
import {
  ActiveMissionRecord,
  FactionMissionDefinition,
} from '../types/mission';
import {
  getMissionsByStatus,
  activateMission,
  claimMissionReward,
} from '../services/database/missionRepository';
import { updateActiveMissions } from '../services/database/missionEngine';
import {
  UserProgramEnrollment,
  TrainingProgramDefinition,
  ScheduledProgramSession,
} from '../types/program';
import {
  CampaignTelemetryContext,
  CampaignNode,
} from '../types/campaign';
import {
  createProgramEnrollment,
  populateWorkoutFromScheduledSession,
  evaluateSessionAdherence,
  advanceEnrollmentSession,
} from '../services/progression/programEngine';
import {
  saveProgramEnrollment,
  getActiveProgramEnrollment,
  pauseProgramEnrollment,
  resumeProgramEnrollment,
  recordProgramSession,
} from '../services/database/programRepository';
import { buildCampaignTelemetryContext } from '../services/database/campaignRepository';
import {
  DailyRotationRecord,
  WeeklyRaidCycle,
  WarfrontSettings,
  RaidSpawnDay,
  EncounterTemplate,
} from '../types/warfront';
import {
  getOrCreateDailyRotation,
  completeDailyEncounter,
  getOrCreateWeeklyRaid,
  applyDamageToWeeklyRaid,
  claimWeeklyRaidRewards,
  setWarfrontStorageAdapter,
} from '../services/progression/warfrontEngine';
import {
  getWarfrontSettings,
  updatePreferredSpawnDay,
  sqliteWarfrontStorage,
} from '../services/database/warfrontRepository';
import {
  convertToCombatMission,
  convertToEnemyDefinition,
  getEncounterById,
} from '../content/encounters/catalog';

export interface FinishWorkoutResult {
  xpEarned: number;
  breakdown: XpBreakdown;
  report?: CombatAfterActionReport;
}

export interface PendingNotificationItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  details?: any;
  createdAt: string;
}

interface AppContextValue {
  isInitialized: boolean;
  character: CharacterProfile;
  progression: CharacterProgression;
  stats: UserStats;
  currentFaction: Faction;
  currentSubfaction?: Subfaction;
  currentMission: CombatMission;
  setCurrentMission: (mission: CombatMission) => void;
  activeCoopRaid: ActiveCoopRaid | null;
  setActiveCoopRaid: (raid: ActiveCoopRaid | null) => void;
  activeWorkout: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  pendingNotifications: PendingNotificationItem[];
  activeMissions: ActiveMissionRecord[];
  activeEnrollment: UserProgramEnrollment | null;
  campaignTelemetry: CampaignTelemetryContext;
  dailyRotation: DailyRotationRecord | null;
  weeklyRaid: WeeklyRaidCycle | null;
  warfrontSettings: WarfrontSettings;
  setWarfrontSpawnDay: (spawnDay: RaidSpawnDay) => void;
  deployDailyEncounter: (encounter: EncounterTemplate) => void;
  deployWeeklyRaid: (raid: WeeklyRaidCycle) => void;
  claimWeeklyRaidRewardsAction: (cycleId: string) => boolean;
  enrollInProgram: (program: TrainingProgramDefinition) => void;
  pauseActiveProgram: () => void;
  resumeActiveProgram: () => void;
  startProgramWorkout: (session: ScheduledProgramSession) => void;
  dismissPendingNotification: (id: string) => void;
  triggerAchievementEvaluation: () => void;
  activatePlayerMission: (mission: FactionMissionDefinition) => void;
  claimMissionRewards: (missionId: string) => boolean;
  startNewWorkout: (title?: string, mission?: CombatMission) => void;
  updateActiveWorkout: (workout: WorkoutSession) => void;
  finishActiveWorkout: (
    encounterState?: CombatEncounterState,
    mission?: CombatMission
  ) => FinishWorkoutResult | null;
  cancelActiveWorkout: () => void;
  repeatWorkout: (sessionId: string) => boolean;
  changeFaction: (factionId: string, subfactionId?: string) => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_PROFILE: CharacterProfile = {
  id: 1,
  universeId: 'warhammer40k',
  factionId: 'adeptus-astartes',
  subfactionId: 'ultramarines',
  characterName: 'Battle-Brother',
  totalXp: 0,
  currentLevel: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_FACTION = warhammer40kUniverse.factions[0];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [character, setCharacter] = useState<CharacterProfile>(DEFAULT_PROFILE);
  const [stats, setStats] = useState<UserStats>({
    totalWorkouts: 0,
    totalSets: 0,
    totalReps: 0,
    totalVolumeKg: 0,
    totalXpEarned: 0,
  });
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [currentMission, setCurrentMission] = useState<CombatMission>(getDefaultMission());
  const [activeCoopRaid, setActiveCoopRaidState] = useState<ActiveCoopRaid | null>(null);
  const [pendingNotifications, setPendingNotifications] = useState<PendingNotificationItem[]>([]);
  const [activeMissions, setActiveMissions] = useState<ActiveMissionRecord[]>([]);
  const [activeEnrollment, setActiveEnrollment] = useState<UserProgramEnrollment | null>(null);
  const [campaignTelemetry, setCampaignTelemetry] = useState<CampaignTelemetryContext>({
    characterId: 'char_main',
    totalWorkouts: 0,
    totalSets: 0,
    totalVolumeKg: 0,
    totalCombatDamage: 0,
    totalCombatAttacks: 0,
    defeatedEnemyIds: [],
    completedFactionMissionIds: [],
    completedProgramSessionsCount: 0,
    completedProgramBlockNumber: 1,
    squadBattleAttacks: 0,
  });
  const [dailyRotation, setDailyRotation] = useState<DailyRotationRecord | null>(null);
  const [weeklyRaid, setWeeklyRaid] = useState<WeeklyRaidCycle | null>(null);
  const [warfrontSettings, setWarfrontSettingsState] = useState<WarfrontSettings>({
    preferredSpawnDay: 'friday',
    categoryFilter: 'all',
  });
  const [activeDailyEncounterId, setActiveDailyEncounterId] = useState<string | null>(null);
  const [activeRaidCycleId, setActiveRaidCycleId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    try {
      initializeDatabase();
      const prof = getCharacterProfile();
      const userStats = getUserCareerStats();
      const history = getAllWorkouts();
      const cachedRaid = getActiveRaid();

      // Backfill achievements safely and idempotently on startup
      try {
        backfillHistoricalAchievements('user_main', 'char_main');
      } catch (backfillErr) {
        console.warn('Initial backfill skipped:', backfillErr);
      }

      // Check for un-dismissed notifications
      const notifs = getPendingNotifications();

      // Load active missions for character
      const curMissions = getMissionsByStatus(prof.id.toString(), 'active');

      // Load active program enrollment & campaign telemetry
      const currentEnrollment = getActiveProgramEnrollment(prof.id.toString());
      const campTelemetry = buildCampaignTelemetryContext(prof.id.toString());

      // Activate SQLite storage adapter for Warfront
      setWarfrontStorageAdapter(sqliteWarfrontStorage);

      // Load Warfront daily rotation, weekly raid, and user settings
      const rot = getOrCreateDailyRotation();
      const wfSettings = getWarfrontSettings();
      const raid = getOrCreateWeeklyRaid({ preferredSpawnDay: wfSettings.preferredSpawnDay });

      setCharacter(prof);
      setStats(userStats);
      setWorkoutHistory(history);
      setActiveCoopRaidState(cachedRaid);
      setPendingNotifications(notifs);
      setActiveMissions(curMissions);
      setActiveEnrollment(currentEnrollment);
      setCampaignTelemetry(campTelemetry);
      setDailyRotation(rot);
      setWarfrontSettingsState(wfSettings);
      setWeeklyRaid(raid);
      setIsInitialized(true);
    } catch (err) {
      console.error('Database initialization error:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dismissPendingNotification = useCallback((id: string) => {
    try {
      dismissNotification(id);
      setPendingNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.warn('Error dismissing notification:', err);
    }
  }, []);

  const activatePlayerMission = useCallback(
    (mission: FactionMissionDefinition) => {
      try {
        activateMission(character.id.toString(), mission);
        loadData();
      } catch (err) {
        console.warn('Error activating mission:', err);
      }
    },
    [character.id, loadData]
  );

  const claimMissionRewards = useCallback(
    (missionId: string) => {
      try {
        const success = claimMissionReward(character.id.toString(), missionId);
        if (success) {
          loadData();
        }
        return success;
      } catch (err) {
        console.warn('Error claiming mission reward:', err);
        return false;
      }
    },
    [character.id, loadData]
  );

  const triggerAchievementEvaluation = useCallback(() => {
    try {
      const evalCtx = buildEvaluationContextFromDb('user_main', 'char_main');
      runEvaluationWithDb(evalCtx);
      const notifs = getPendingNotifications();
      setPendingNotifications(notifs);
    } catch (err) {
      console.warn('Manual achievement evaluation failed:', err);
    }
  }, []);

  const currentFaction: Faction =
    getFactionById(character.factionId) || DEFAULT_FACTION;
  const currentSubfaction: Subfaction | undefined = getSubfactionById(
    character.factionId,
    character.subfactionId
  );

  const progression: CharacterProgression = calculateProgression(
    character.totalXp,
    currentFaction
  );

  const enrollInProgram = useCallback((program: TrainingProgramDefinition) => {
    try {
      const enrollment = createProgramEnrollment(character.id.toString(), program);
      saveProgramEnrollment(enrollment);
      loadData();
    } catch (err) {
      console.warn('Error enrolling in program:', err);
    }
  }, [character.id, loadData]);

  const pauseActiveProgram = useCallback(() => {
    if (activeEnrollment) {
      pauseProgramEnrollment(activeEnrollment.id);
      loadData();
    }
  }, [activeEnrollment, loadData]);

  const resumeActiveProgram = useCallback(() => {
    if (activeEnrollment) {
      resumeProgramEnrollment(activeEnrollment.id);
      loadData();
    }
  }, [activeEnrollment, loadData]);

  const startProgramWorkout = useCallback((session: ScheduledProgramSession) => {
    const prepopulated = populateWorkoutFromScheduledSession(session);
    setActiveWorkout(prepopulated);
  }, []);

  const startNewWorkout = (
    title: string = 'Crusade Training',
    mission?: CombatMission
  ) => {
    if (mission) {
      setCurrentMission(mission);
    }
    const newSession: WorkoutSession = {
      id: `session_${Date.now()}`,
      title,
      startedAt: new Date().toISOString(),
      totalXpEarned: 0,
      isCompleted: false,
      exercises: [],
    };
    setActiveWorkout(newSession);
  };

  const updateActiveWorkout = (workout: WorkoutSession) => {
    setActiveWorkout(workout);
  };

  const cancelActiveWorkout = () => {
    setActiveWorkout(null);
  };

  const repeatWorkout = (sessionId: string): boolean => {
    const cloned = cloneWorkoutForRepeat(sessionId);
    if (cloned) {
      setActiveWorkout(cloned);
      return true;
    }
    return false;
  };

  const setWarfrontSpawnDay = useCallback((spawnDay: RaidSpawnDay) => {
    updatePreferredSpawnDay(spawnDay);
    setWarfrontSettingsState((prev) => ({ ...prev, preferredSpawnDay: spawnDay }));
    const newRaid = getOrCreateWeeklyRaid({ preferredSpawnDay: spawnDay });
    setWeeklyRaid(newRaid);
  }, []);

  const deployDailyEncounter = useCallback(
    (encounter: EncounterTemplate) => {
      setActiveDailyEncounterId(encounter.id);
      setActiveRaidCycleId(null);
      const mission = convertToCombatMission(encounter);
      setCurrentMission(mission);
      startNewWorkout(`Warfront: ${encounter.title}`, mission);
    },
    []
  );

  const deployWeeklyRaid = useCallback(
    (raid: WeeklyRaidCycle) => {
      setActiveRaidCycleId(raid.cycleId);
      setActiveDailyEncounterId(null);
      const mission: CombatMission = {
        id: `raid_${raid.cycleId}`,
        title: `Raid: ${raid.boss.name}`,
        briefing: raid.boss.tacticalDescription,
        difficulty: 'boss',
        enemyId: raid.boss.bossKey,
        recommendedSets: 16,
        gloryBonusXp: 400,
      };
      setCurrentMission(mission);
      startNewWorkout(`Weekly Raid: ${raid.boss.name}`, mission);
    },
    []
  );

  const claimWeeklyRaidRewardsAction = useCallback((cycleId: string): boolean => {
    const result = claimWeeklyRaidRewards(cycleId);
    if (result.success) {
      loadData();
      return true;
    }
    return false;
  }, [loadData]);

  const finishActiveWorkout = (
    encounterState?: CombatEncounterState,
    mission?: CombatMission
  ): FinishWorkoutResult | null => {
    if (!activeWorkout) return null;

    const breakdown = calculateWorkoutXp(activeWorkout.exercises, true);
    const gloryBonus =
      encounterState && encounterState.isDefeated && mission
        ? mission.gloryBonusXp
        : 0;
    const totalXp = breakdown.totalXp + gloryBonus;

    const completedSession: WorkoutSession = {
      ...activeWorkout,
      finishedAt: new Date().toISOString(),
      isCompleted: true,
      totalXpEarned: totalXp,
    };

    saveCompletedWorkout(completedSession, totalXp, breakdown);

    let report: CombatAfterActionReport | undefined;
    let battleRecordId: string | undefined;

    if (encounterState && mission) {
      saveCombatEncounter(completedSession.id, encounterState);
      const newProg = calculateProgression(
        character.totalXp + totalXp,
        currentFaction
      );
      report = buildAfterActionReport(
        mission,
        encounterState.enemy,
        encounterState,
        completedSession,
        breakdown.totalXp,
        progression,
        newProg
      );

      // Record immutable Battle History record
      battleRecordId = `battle_${completedSession.id}`;
      const durationSeconds =
        completedSession.finishedAt && completedSession.startedAt
          ? Math.max(
              0,
              Math.floor(
                (new Date(completedSession.finishedAt).getTime() -
                  new Date(completedSession.startedAt).getTime()) /
                  1000
              )
            )
          : undefined;

      const timeline: BattleTimelineEvent[] = [
        {
          timestamp: completedSession.startedAt,
          eventType: 'battle_started',
          actorName: character.characterName,
          description: `Engagement initiated against ${encounterState.enemy.name}.`,
        },
      ];

      for (const atk of encounterState.attacks) {
        timeline.push({
          timestamp: atk.timestamp,
          eventType: atk.isCrit ? 'critical_strike' : 'strike_landed',
          actorName: character.characterName,
          description: `${atk.attackName} landed for ${atk.damage} damage!`,
          damageDealt: atk.damage,
        });
      }

      if (encounterState.isDefeated) {
        timeline.push({
          timestamp: completedSession.finishedAt || new Date().toISOString(),
          eventType: 'enemy_slain',
          actorName: character.characterName,
          description: `${encounterState.enemy.name} has been neutralized in glorious combat.`,
        });
      } else {
        timeline.push({
          timestamp: completedSession.finishedAt || new Date().toISOString(),
          eventType: 'tactical_retreat',
          actorName: character.characterName,
          description: `Tactical withdrawal executed. Target sustained ${encounterState.totalDamage} total damage.`,
        });
      }

      const participant: BattleParticipantContribution = {
        userId: 'user_main',
        callsign: character.characterName,
        factionId: character.factionId,
        subfactionId: character.subfactionId || undefined,
        attacksCount: encounterState.attacks.length,
        damageDealt: encounterState.totalDamage,
        damageSharePercent: 100,
        workoutsAttributed: 1,
        setsAttributed: completedSession.exercises.reduce(
          (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
          0
        ),
      };

      const battleRecord: BattleRecord = {
        id: battleRecordId,
        encounterMode: 'solo',
        sessionId: completedSession.id,
        missionId: mission.id,
        missionTitle: mission.title,
        enemyId: encounterState.enemy.id,
        enemyName: encounterState.enemy.name,
        enemyFaction: encounterState.enemy.faction,
        enemyDifficulty: encounterState.enemy.difficulty,
        enemyMaxHp: encounterState.maxHealth,
        enemyRemainingHp: encounterState.currentHealth,
        outcome: encounterState.isDefeated
          ? 'victory'
          : encounterState.currentHealth === encounterState.maxHealth
          ? 'abandoned'
          : 'defeat',
        totalDamage: encounterState.totalDamage,
        totalAttacks: encounterState.attacks.length,
        participantCount: 1,
        startedAt: completedSession.startedAt,
        completedAt: completedSession.finishedAt,
        durationSeconds,
        xpEarned: totalXp,
        snapshot: {
          enemyDescription: encounterState.enemy.loreDescription,
          enemyGlyph: encounterState.enemy.visual.iconName,
          enemyFaction: encounterState.enemy.faction,
          initialHealth: encounterState.maxHealth,
          finalHealth: encounterState.currentHealth,
          timeline,
          participants: [participant],
          userAttacks: encounterState.attacks,
          linkedWorkoutIds: [completedSession.id],
          rewards: {
            baseXpEarned: breakdown.totalXp,
            gloryBonusXp: gloryBonus,
            totalXpEarned: totalXp,
          },
          afterActionReportSummary: encounterState.isDefeated
            ? `Victory achieved against ${encounterState.enemy.name}.`
            : `Encounter concluded against ${encounterState.enemy.name}.`,
        },
        createdAt: new Date().toISOString(),
      };

      try {
        recordBattleHistory(battleRecord);
      } catch (bhErr) {
        console.warn('Error recording battle history:', bhErr);
      }
    }

    // Evaluate achievements dynamically following workout completion
    try {
      const evalCtx = buildEvaluationContextFromDb('user_main', 'char_main', undefined, {
        latestWorkoutSessionId: completedSession.id,
        latestBattleId: battleRecordId,
      });
      runEvaluationWithDb(evalCtx);
    } catch (achErr) {
      console.warn('Error during achievement evaluation:', achErr);
    }

    // Evaluate active faction missions dynamically following workout completion
    try {
      updateActiveMissions(
        character.id.toString(),
        character.factionId,
        character.subfactionId || undefined
      );
    } catch (mErr) {
      console.warn('Error evaluating active missions:', mErr);
    }

    // Advance training program progression if enrolled and active
    if (activeEnrollment && activeEnrollment.status === 'active') {
      try {
        const block = activeEnrollment.programSnapshot.blocks.find(
          (b) => b.blockNumber === activeEnrollment.currentBlockNumber
        ) || activeEnrollment.programSnapshot.blocks[0];
        const scheduledSession = block?.sessions[activeEnrollment.currentSessionIndex] || block?.sessions[0];
        if (scheduledSession) {
          const sessionRecord = evaluateSessionAdherence(
            scheduledSession,
            completedSession,
            activeEnrollment.id
          );
          recordProgramSession(sessionRecord);
          const updatedEnrollment = advanceEnrollmentSession(activeEnrollment, true);
          saveProgramEnrollment(updatedEnrollment);
        }
      } catch (progErr) {
        console.warn('Error recording program session:', progErr);
      }
    }

    // Handle Warfront daily encounter completion
    if (activeDailyEncounterId && encounterState?.isDefeated && dailyRotation) {
      try {
        completeDailyEncounter(dailyRotation.rotationDate, activeDailyEncounterId);
      } catch (deErr) {
        console.warn('Error recording completed daily encounter:', deErr);
      }
      setActiveDailyEncounterId(null);
    }

    // Handle Warfront weekly raid damage application
    if (activeRaidCycleId && encounterState) {
      try {
        const completedSetsCount = completedSession.exercises.reduce(
          (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
          0
        );
        applyDamageToWeeklyRaid(
          activeRaidCycleId,
          'user_main',
          character.characterName,
          character.factionId,
          encounterState.totalDamage,
          completedSetsCount
        );
      } catch (rdErr) {
        console.warn('Error applying weekly raid damage:', rdErr);
      }
      setActiveRaidCycleId(null);
    }

    setActiveWorkout(null);
    loadData();

    // Asynchronously flush any buffered offline attacks in the background
    coopService.flushOfflineQueue().catch(() => {});

    return { xpEarned: totalXp, breakdown, report };
  };

  const setActiveCoopRaid = (raid: ActiveCoopRaid | null) => {
    if (raid) {
      saveActiveRaid(raid);
    } else {
      clearActiveRaid();
    }
    setActiveCoopRaidState(raid);
  };

  const changeFaction = (factionId: string, subfactionId?: string) => {
    const updated = updateFactionAllegiance(factionId, subfactionId);
    setCharacter(updated);
  };

  return (
    <AppContext.Provider
      value={{
        isInitialized,
        character,
        progression,
        stats,
        currentFaction,
        currentSubfaction,
        currentMission,
        setCurrentMission,
        activeCoopRaid,
        setActiveCoopRaid,
        activeWorkout,
        workoutHistory,
        pendingNotifications,
        activeMissions,
        activeEnrollment,
        campaignTelemetry,
        dailyRotation,
        weeklyRaid,
        warfrontSettings,
        setWarfrontSpawnDay,
        deployDailyEncounter,
        deployWeeklyRaid,
        claimWeeklyRaidRewardsAction,
        enrollInProgram,
        pauseActiveProgram,
        resumeActiveProgram,
        startProgramWorkout,
        dismissPendingNotification,
        triggerAchievementEvaluation,
        activatePlayerMission,
        claimMissionRewards,
        startNewWorkout,
        updateActiveWorkout,
        finishActiveWorkout,
        cancelActiveWorkout,
        repeatWorkout,
        changeFaction,
        refreshData: loadData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
