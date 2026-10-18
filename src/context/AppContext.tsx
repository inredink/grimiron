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

export interface FinishWorkoutResult {
  xpEarned: number;
  breakdown: XpBreakdown;
  report?: CombatAfterActionReport;
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

  const loadData = useCallback(() => {
    try {
      initializeDatabase();
      const prof = getCharacterProfile();
      const userStats = getUserCareerStats();
      const history = getAllWorkouts();
      const cachedRaid = getActiveRaid();
      setCharacter(prof);
      setStats(userStats);
      setWorkoutHistory(history);
      setActiveCoopRaidState(cachedRaid);
      setIsInitialized(true);
    } catch (err) {
      console.error('Database initialization error:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
