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
  updateCharacterName,
  getUserCareerStats,
  addCharacterXp,
  syncCharacterProfileFromCloud,
} from '../services/database/characterRepository';
import {
  saveCompletedWorkout,
  getAllWorkouts,
  cloneWorkoutForRepeat,
  saveWorkoutDraft,
  loadWorkoutDraft,
  clearWorkoutDraft,
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
import { ActiveCoopRaid, CoopBoss, CoopGroup, CoopAttack } from '../types/coop';
import {
  getActiveRaid,
  saveActiveRaid,
  clearActiveRaid,
} from '../services/database/coopQueueRepository';
import { coopService } from '../services/supabase/coopService';
import {
  recordBattleHistory,
  getBattleHistoryById,
} from '../services/database/battleHistoryRepository';
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
  clearUnearnedInitiateAchievements,
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
  recordRestDaySession,
} from '../services/progression/programEngine';
import {
  saveProgramEnrollment,
  getActiveProgramEnrollment,
  pauseProgramEnrollment,
  resumeProgramEnrollment,
  recordProgramSession,
} from '../services/database/programRepository';
import {
  buildCampaignTelemetryContext,
  syncCampaignProgressToDb,
} from '../services/database/campaignRepository';
import { CAMPAIGN_CATALOG } from '../content/campaigns/catalog';
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
import {
  CampaignAcademyTemplate,
  UserCampaignEnrollment,
  CampaignChapter,
  CampaignQuest,
  CampaignPhaseReport,
  FinalCampaignDossier,
  CampaignPhaseNumber,
} from '../types/campaignAcademy';
import {
  createCampaignEnrollment,
  evaluateCampaignQuests,
  evaluateChapterBossUnlock,
  recordBossVictory,
  generatePhaseReport,
  generateFinalDossier,
} from '../services/progression/campaignAcademyEngine';
import {
  saveAcademyEnrollment,
  getActiveAcademyEnrollment,
  getAllAcademyEnrollments,
  pauseAcademyEnrollment,
  resumeAcademyEnrollment,
  savePhaseReport,
  getPhaseReports,
  saveFinalDossier,
  getFinalDossier,
} from '../services/database/campaignAcademyRepository';
import {
  CAMPAIGN_ACADEMY_CATALOG,
  getAcademyCampaignById,
} from '../content/campaignAcademy/catalog';
import {
  CustomSubfactionRecord,
  CustomSubfactionInput,
} from '../types/customSubfaction';
import {
  createCustomSubfaction,
  getAllCustomSubfactions,
  getCustomSubfactionById,
  updateCustomSubfaction,
  duplicateCustomSubfaction,
  archiveCustomSubfaction,
  deleteCustomSubfaction,
} from '../services/database/customSubfactionRepository';
import { AppSettings, DEFAULT_APP_SETTINGS } from '../types/settings';
import {
  getAllSettings,
  saveSetting,
  resetAllSettings,
} from '../services/database/settingsRepository';
import { setHapticsEnabled } from '../utils/haptics';
import {
  activateWorkoutKeepAwake,
  deactivateWorkoutKeepAwake,
} from '../utils/keepAwake';
import { awardRecoveryDayXp } from '../services/progression/recoveryEngine';
import {
  signOutAccount,
  deleteAccountData,
  signInAccount,
  signUpAccount,
  resendVerificationEmail,
  getAccountInfo,
  AccountInfo,
} from '../services/account/accountService';
import { initializeRecoverySqliteStorage } from '../services/database/recoveryRepository';
import { initializeNotificationSqliteStorage } from '../services/database/notificationRepository';
import { initializeDiagnosticsSqliteProvider } from '../services/database/diagnosticsRepository';

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
  logRestDaySessionAction: (session: ScheduledProgramSession) => void;
  claimCoopRaidVictoryAction: (
    boss: CoopBoss,
    group?: CoopGroup,
    attacks?: CoopAttack[]
  ) => boolean;
  isCoopVictoryClaimed: (bossId: string) => boolean;
  syncUserProfileFromCloud: (profile: {
    displayName?: string;
    factionId?: string;
    subfactionId?: string;
  }) => void;
  repeatWorkout: (sessionId: string) => boolean;
  changeFaction: (factionId: string, subfactionId?: string) => Promise<any> | void;
  refreshData: () => void;
  activeAcademyEnrollment: UserCampaignEnrollment | null;
  academyEnrollments: UserCampaignEnrollment[];
  activeAcademyCampaign: CampaignAcademyTemplate | null;
  academyPhaseReports: CampaignPhaseReport[];
  academyFinalDossier: FinalCampaignDossier | null;
  enrollInAcademyCampaign: (campaign: CampaignAcademyTemplate) => void;
  pauseAcademyCampaign: () => void;
  resumeAcademyCampaign: () => void;
  claimAcademyPhaseReport: (phaseNumber: CampaignPhaseNumber) => CampaignPhaseReport | null;
  claimAcademyFinalDossier: () => FinalCampaignDossier | null;
  deployChapterBossBattle: (chapter: CampaignChapter) => void;
  customSubfactions: CustomSubfactionRecord[];
  refreshCustomSubfactions: () => void;
  createCustomSubfactionAction: (input: CustomSubfactionInput) => CustomSubfactionRecord;
  updateCustomSubfactionAction: (id: string, updates: Partial<CustomSubfactionInput>) => CustomSubfactionRecord;
  duplicateCustomSubfactionAction: (id: string, newName?: string) => CustomSubfactionRecord;
  archiveCustomSubfactionAction: (id: string) => boolean;
  deleteCustomSubfactionAction: (id: string) => boolean;
  selectCustomSubfactionAction: (customSubfactionId: string) => void;
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  claimRecoveryXpAction: () => { awarded: boolean; xpEarned: number; reason: string };
  updateCharacterNameAction: (name: string) => Promise<any> | void;
  accountInfo: AccountInfo | null;
  refreshAccountInfo: () => Promise<AccountInfo>;
  signInCloudAccount: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  signUpCloudAccount: (email: string, pass: string, displayName: string) => Promise<{ success: boolean; message: string }>;
  resendVerificationEmailAction: (email: string) => Promise<{ success: boolean; message: string }>;
  signOutAction: () => Promise<{ success: boolean; message: string }>;
  deleteAccountAction: () => Promise<{ success: boolean; message: string }>;
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
  const [activeAcademyEnrollment, setActiveAcademyEnrollment] = useState<UserCampaignEnrollment | null>(null);
  const [academyEnrollments, setAcademyEnrollments] = useState<UserCampaignEnrollment[]>([]);
  const [activeAcademyCampaign, setActiveAcademyCampaign] = useState<CampaignAcademyTemplate | null>(null);
  const [academyPhaseReports, setAcademyPhaseReports] = useState<CampaignPhaseReport[]>([]);
  const [academyFinalDossier, setAcademyFinalDossier] = useState<FinalCampaignDossier | null>(null);
  const [customSubfactions, setCustomSubfactions] = useState<CustomSubfactionRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);

  const loadData = useCallback(() => {
    try {
      initializeDatabase();
      initializeRecoverySqliteStorage();
      initializeNotificationSqliteStorage();
      initializeDiagnosticsSqliteProvider();
      const prof = getCharacterProfile();
      const userStats = getUserCareerStats();
      const history = getAllWorkouts();
      const cachedRaid = getActiveRaid();

      // Clean up any erroneous initiate achievements if fresh account
      try {
        clearUnearnedInitiateAchievements();
      } catch {}

      // Load user settings
      try {
        const userSettings = getAllSettings();
        setSettings(userSettings);
        setHapticsEnabled(userSettings.haptics_enabled);
      } catch (settingsErr) {
        console.warn('Error loading settings:', settingsErr);
      }

      // Load account authentication info
      getAccountInfo().then((acc) => setAccountInfo(acc)).catch(() => {});

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

      // Persist campaign graph evaluations to SQLite
      try {
        for (const camp of CAMPAIGN_CATALOG) {
          syncCampaignProgressToDb(camp, campTelemetry, prof.id.toString());
        }
      } catch (campErr) {
        console.warn('Initial campaign sync skipped:', campErr);
      }

      // Restore in-progress workout draft across crashes / app restarts
      try {
        const savedDraft = loadWorkoutDraft();
        if (savedDraft && savedDraft.workout && !savedDraft.workout.isCompleted) {
          setActiveWorkout((prev) => prev || savedDraft.workout);
          if (savedDraft.mission) {
            setCurrentMission(savedDraft.mission);
          }
          if (savedDraft.dailyEncounterId) {
            setActiveDailyEncounterId(savedDraft.dailyEncounterId);
          }
          if (savedDraft.raidCycleId) {
            setActiveRaidCycleId(savedDraft.raidCycleId);
          }
        }
      } catch (draftErr) {
        console.warn('Draft restore skipped:', draftErr);
      }

      // Automatically sync cloud profile if authenticated with Supabase
      if (coopService.isConfigured()) {
        coopService
          .getMyProfile()
          .then((cloudProf) => {
            if (cloudProf) {
              const currentLocal = getCharacterProfile();
              const isDefaultLocalName =
                !currentLocal.characterName ||
                currentLocal.characterName === 'Battle-Brother' ||
                currentLocal.characterName.trim() === '';
              const isDefaultLocalFaction =
                !currentLocal.factionId ||
                currentLocal.factionId === 'adeptus-astartes';

              // If local character is untouched default initiate, adopt personalized cloud profile
              if (
                isDefaultLocalName &&
                isDefaultLocalFaction &&
                (cloudProf.displayName !== 'Battle-Brother' ||
                  cloudProf.factionId !== 'adeptus-astartes')
              ) {
                const synced = syncCharacterProfileFromCloud({
                  displayName: cloudProf.displayName,
                  factionId: cloudProf.factionId,
                });
                setCharacter(synced);
              } else if (!isDefaultLocalFaction || !isDefaultLocalName) {
                // If local has been customized (user chose another faction or name),
                // make sure cloud profile is kept in sync with local character!
                if (
                  cloudProf.factionId !== currentLocal.factionId ||
                  cloudProf.displayName !== currentLocal.characterName
                ) {
                  coopService
                    .updateMyProfile({
                      displayName: currentLocal.characterName,
                      factionId: currentLocal.factionId,
                    })
                    .catch(() => {});
                }
              }
            }
          })
          .catch(() => {});
      }

      // Activate SQLite storage adapter for Warfront
      setWarfrontStorageAdapter(sqliteWarfrontStorage);

      // Load Warfront daily rotation, weekly raid, and user settings
      try {
        const rot = getOrCreateDailyRotation();
        const wfSettings = getWarfrontSettings();
        const raid = getOrCreateWeeklyRaid({ preferredSpawnDay: wfSettings.preferredSpawnDay });
        setDailyRotation(rot);
        setWarfrontSettingsState(wfSettings);
        setWeeklyRaid(raid);
      } catch (wfErr) {
        console.warn('Warfront initialization warning:', wfErr);
      }

      setCharacter(prof);
      setStats(userStats);
      setWorkoutHistory(history);
      setActiveCoopRaidState(cachedRaid);
      setPendingNotifications(notifs);
      setActiveMissions(curMissions);
      setActiveEnrollment(currentEnrollment);
      setCampaignTelemetry(campTelemetry);

      // Load Campaign Academy data
      try {
        const curAcadEnrollment = getActiveAcademyEnrollment(prof.id.toString());
        setActiveAcademyEnrollment(curAcadEnrollment);
        const allAcad = getAllAcademyEnrollments(prof.id.toString());
        setAcademyEnrollments(allAcad);
        if (curAcadEnrollment) {
          const foundCamp = getAcademyCampaignById(curAcadEnrollment.campaignId) || null;
          setActiveAcademyCampaign(foundCamp);
          setAcademyPhaseReports(getPhaseReports(curAcadEnrollment.id));
          setAcademyFinalDossier(getFinalDossier(curAcadEnrollment.id));
        } else {
          setActiveAcademyCampaign(null);
          setAcademyPhaseReports([]);
          setAcademyFinalDossier(null);
        }
      } catch (acadLoadErr) {
        console.warn('Error loading academy enrollment:', acadLoadErr);
      }

      // Load custom subfactions
      try {
        const userCustomSubfactions = getAllCustomSubfactions();
        setCustomSubfactions(userCustomSubfactions);
      } catch (subfacErr) {
        console.warn('Error loading custom subfactions:', subfacErr);
      }

      setIsInitialized(true);
    } catch (err) {
      console.error('Database initialization error:', err);
      // Ensure app does not hang forever on loading screens if a recoverable error occurs
      setIsInitialized(true);
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
    character.subfactionId,
    customSubfactions
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
    saveWorkoutDraft(prepopulated, undefined, null, null);
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
    if (settings.workout_keep_screen_awake) {
      activateWorkoutKeepAwake(true);
    }
    saveWorkoutDraft(
      newSession,
      mission || currentMission,
      activeDailyEncounterId,
      activeRaidCycleId
    );
  };

  const updateActiveWorkout = (workout: WorkoutSession) => {
    setActiveWorkout(workout);
    if (settings.workout_auto_save) {
      saveWorkoutDraft(
        workout,
        currentMission,
        activeDailyEncounterId,
        activeRaidCycleId
      );
    }
  };

  const cancelActiveWorkout = () => {
    deactivateWorkoutKeepAwake();
    clearWorkoutDraft();
    setActiveDailyEncounterId(null);
    setActiveRaidCycleId(null);
    setActiveWorkout(null);
  };

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      try {
        saveSetting(key, value);
        setSettings((prev) => ({ ...prev, [key]: value }));

        if (key === 'haptics_enabled') {
          setHapticsEnabled(value as boolean);
        } else if (key === 'warfront_preferred_spawn_day') {
          updatePreferredSpawnDay(value as RaidSpawnDay);
          setWarfrontSettingsState((prev) => ({
            ...prev,
            preferredSpawnDay: value as RaidSpawnDay,
          }));
          const newRaid = getOrCreateWeeklyRaid({
            preferredSpawnDay: value as RaidSpawnDay,
          });
          setWeeklyRaid(newRaid);
        }
      } catch (err) {
        console.error(`Failed to update setting ${key}:`, err);
      }
    },
    []
  );

  const resetSettings = useCallback(() => {
    try {
      const defs = resetAllSettings();
      setSettings(defs);
      setHapticsEnabled(defs.haptics_enabled);
    } catch (err) {
      console.error('Failed to reset settings:', err);
    }
  }, []);

  const claimRecoveryXpAction = useCallback(() => {
    const result = awardRecoveryDayXp(new Date(), settings, activeEnrollment);
    if (result.awarded) {
      loadData();
    }
    return result;
  }, [settings, activeEnrollment, loadData]);

  const updateCharacterNameAction = useCallback(async (name: string) => {
    const updated = updateCharacterName(name);
    setCharacter(updated);

    if (coopService.isConfigured()) {
      try {
        await coopService.updateMyProfileDisplayName(name);
      } catch (err) {
        console.warn('Failed to sync callsign change to cloud:', err);
      }
    }
  }, []);

  const refreshAccountInfo = useCallback(async () => {
    const acc = await getAccountInfo();
    setAccountInfo(acc);
    return acc;
  }, []);

  const signInCloudAccount = useCallback(
    async (email: string, pass: string) => {
      const res = await signInAccount(email, pass);
      if (res.success) {
        await refreshAccountInfo();
        loadData();
      }
      return res;
    },
    [loadData, refreshAccountInfo]
  );

  const signUpCloudAccount = useCallback(
    async (email: string, pass: string, displayName: string) => {
      const res = await signUpAccount(email, pass, displayName, character.factionId);
      if (res.success) {
        updateCharacterNameAction(displayName);
        await refreshAccountInfo();
        loadData();
      }
      return res;
    },
    [character.factionId, loadData, refreshAccountInfo, updateCharacterNameAction]
  );

  const resendVerificationEmailAction = useCallback(async (email: string) => {
    return await resendVerificationEmail(email);
  }, []);

  const signOutAction = useCallback(async () => {
    const res = await signOutAccount();
    if (res.success) {
      await refreshAccountInfo();
      loadData();
    }
    return res;
  }, [loadData, refreshAccountInfo]);

  const deleteAccountAction = useCallback(async () => {
    const res = await deleteAccountData(true);
    if (res.success) {
      loadData();
    }
    return res;
  }, [loadData]);

  const repeatWorkout = (sessionId: string): boolean => {
    const cloned = cloneWorkoutForRepeat(sessionId);
    if (cloned) {
      setActiveWorkout(cloned);
      saveWorkoutDraft(cloned, undefined, null, null);
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

    // Advance Campaign Academy progression if enrolled
    if (activeAcademyEnrollment && activeAcademyEnrollment.status === 'active' && activeAcademyCampaign) {
      try {
        let currentAcadEnrollment = { ...activeAcademyEnrollment };

        // Check if this workout defeated the current chapter boss
        if (encounterState?.isDefeated) {
          const currentChapter = activeAcademyCampaign.chapters.find(
            (c) => c.chapterNumber === currentAcadEnrollment.currentChapterNumber
          );
          if (
            currentChapter &&
            (currentChapter.bossEncounterId === encounterState.enemy.id ||
              mission?.id === `chap_boss_${currentChapter.id}`)
          ) {
            const victoryResult = recordBossVictory(
              activeAcademyCampaign,
              currentAcadEnrollment,
              currentChapter.id
            );
            currentAcadEnrollment = victoryResult.updatedEnrollment;
          }
        }

        // Refresh telemetry to evaluate quests & unlock state
        const campCtx = buildCampaignTelemetryContext(character.id.toString());
        const questResult = evaluateCampaignQuests(
          activeAcademyCampaign,
          currentAcadEnrollment,
          campCtx
        );
        if (questResult.newlyCompletedQuests.length > 0) {
          currentAcadEnrollment.completedQuestIds = questResult.updatedCompletedQuestIds;
          if (questResult.totalXpAwarded > 0) {
            addCharacterXp(questResult.totalXpAwarded);
          }
        }

        const unlockResult = evaluateChapterBossUnlock(
          activeAcademyCampaign,
          currentAcadEnrollment,
          campCtx.completedProgramSessionsCount
        );
        currentAcadEnrollment.unlockedBossChapterIds = unlockResult.unlockedBossChapterIds;

        saveAcademyEnrollment(currentAcadEnrollment);
        setActiveAcademyEnrollment(currentAcadEnrollment);
      } catch (acadErr) {
        console.warn('Error advancing Campaign Academy upon workout finish:', acadErr);
      }
    }

    // Clear in-progress workout draft upon completion
    deactivateWorkoutKeepAwake();
    clearWorkoutDraft();
    setActiveDailyEncounterId(null);
    setActiveRaidCycleId(null);
    setActiveWorkout(null);

    // Sync planetary campaign theater progression
    try {
      const campCtx = buildCampaignTelemetryContext(character.id.toString());
      for (const camp of CAMPAIGN_CATALOG) {
        syncCampaignProgressToDb(camp, campCtx, character.id.toString());
      }
    } catch (cErr) {
      console.warn('Error syncing campaign progress upon workout finish:', cErr);
    }

    loadData();

    // Asynchronously flush any buffered offline attacks in the background
    coopService.flushOfflineQueue().catch(() => {});

    return { xpEarned: totalXp, breakdown, report };
  };

  const logRestDaySessionAction = useCallback(
    (session: ScheduledProgramSession) => {
      if (!activeEnrollment || activeEnrollment.status !== 'active') return;
      try {
        const restRecord = recordRestDaySession(session, activeEnrollment.id);
        recordProgramSession(restRecord);
        const updatedEnrollment = advanceEnrollmentSession(activeEnrollment, true);
        saveProgramEnrollment(updatedEnrollment);
        loadData();
        try {
          const evalCtx = buildEvaluationContextFromDb('user_main', 'char_main');
          runEvaluationWithDb(evalCtx);
        } catch (e) {}
      } catch (err) {
        console.warn('Error recording rest day session:', err);
      }
    },
    [activeEnrollment, loadData]
  );

  const isCoopVictoryClaimed = useCallback((bossId: string): boolean => {
    try {
      const record = getBattleHistoryById(`battle_coop_${bossId}`);
      return Boolean(record);
    } catch (err) {
      return false;
    }
  }, []);

  const claimCoopRaidVictoryAction = useCallback(
    (boss: CoopBoss, group?: CoopGroup, attacks?: CoopAttack[]): boolean => {
      const battleId = `battle_coop_${boss.id}`;
      try {
        const existing = getBattleHistoryById(battleId);
        if (existing) {
          return true; // Idempotent: already claimed and recorded
        }

        const totalDamage =
          attacks && attacks.length > 0
            ? attacks.reduce((sum, a) => sum + a.damage, 0)
            : Math.max(1, boss.maxHp - boss.currentHp);
        const totalAttacksCount = attacks && attacks.length > 0 ? attacks.length : 1;

        // Group attacks by participant
        const participantMap = new Map<
          string,
          { userId: string; callsign: string; attacksCount: number; damageDealt: number }
        >();

        if (attacks && attacks.length > 0) {
          for (const atk of attacks) {
            const p = participantMap.get(atk.userId) || {
              userId: atk.userId,
              callsign: atk.userName || 'Battle-Brother',
              attacksCount: 0,
              damageDealt: 0,
            };
            p.attacksCount += 1;
            p.damageDealt += atk.damage;
            participantMap.set(atk.userId, p);
          }
        } else {
          participantMap.set('user_main', {
            userId: 'user_main',
            callsign: character.characterName,
            attacksCount: 1,
            damageDealt: totalDamage,
          });
        }

        const participants: BattleParticipantContribution[] = Array.from(
          participantMap.values()
        ).map((p) => ({
          userId: p.userId,
          callsign: p.callsign,
          factionId: character.factionId,
          subfactionId: character.subfactionId || undefined,
          attacksCount: p.attacksCount,
          damageDealt: p.damageDealt,
          damageSharePercent:
            totalDamage > 0 ? Math.round((p.damageDealt / totalDamage) * 100) : 100,
          workoutsAttributed: 1,
          setsAttributed: p.attacksCount,
        }));

        const gloryBonusXp = boss.gloryXp || 500;

        const timeline: BattleTimelineEvent[] = [
          {
            timestamp: boss.createdAt,
            eventType: 'battle_started',
            actorName: group?.name || 'Crusade Squad',
            description: `Cooperative Crusade assault commenced against ${boss.name}.`,
          },
          {
            timestamp: boss.defeatedAt || new Date().toISOString(),
            eventType: 'enemy_slain',
            actorName: character.characterName,
            description: `${boss.name} has been vanquished by the squad! Total damage dealt: ${totalDamage}.`,
            damageDealt: totalDamage,
          },
        ];

        const battleRecord: BattleRecord = {
          id: battleId,
          encounterMode: 'coop',
          sessionId: undefined,
          missionId: `mission_coop_${boss.id}`,
          missionTitle: `Co-op Raid: ${boss.name}`,
          enemyId: boss.bossKey,
          enemyName: boss.name,
          enemyFaction: boss.faction,
          enemyDifficulty: 'boss',
          enemyMaxHp: boss.maxHp,
          enemyRemainingHp: 0,
          outcome: 'victory',
          totalDamage,
          totalAttacks: totalAttacksCount,
          participantCount: participants.length,
          squadId: boss.groupId,
          squadName: group?.name || 'Crusade Squad',
          startedAt: boss.createdAt,
          completedAt: boss.defeatedAt || new Date().toISOString(),
          durationSeconds: Math.max(
            60,
            Math.floor(
              (new Date(boss.defeatedAt || new Date()).getTime() -
                new Date(boss.createdAt).getTime()) /
                1000
            )
          ),
          xpEarned: gloryBonusXp,
          snapshot: {
            enemyDescription: boss.loreTitle,
            enemyGlyph: boss.glyphName,
            enemyFaction: boss.faction,
            initialHealth: boss.maxHp,
            finalHealth: 0,
            timeline,
            participants,
            userAttacks: [],
            linkedWorkoutIds: [],
            rewards: {
              baseXpEarned: 0,
              gloryBonusXp: gloryBonusXp,
              totalXpEarned: gloryBonusXp,
            },
            afterActionReportSummary: `Crusade victory achieved! ${boss.name} was slain through squad cooperation.`,
          },
          createdAt: new Date().toISOString(),
        };

        recordBattleHistory(battleRecord);
        addCharacterXp(gloryBonusXp);

        // Trigger achievement evaluation dynamically
        try {
          const evalCtx = buildEvaluationContextFromDb('user_main', 'char_main', undefined, {
            latestBattleId: battleId,
          });
          runEvaluationWithDb(evalCtx);
        } catch (achErr) {
          console.warn('Error during co-op victory achievement evaluation:', achErr);
        }

        loadData();
        return true;
      } catch (err) {
        console.warn('Failed to claim co-op raid victory:', err);
        return false;
      }
    },
    [character, loadData]
  );

  const syncUserProfileFromCloud = useCallback(
    (profile: { displayName?: string; factionId?: string; subfactionId?: string }) => {
      try {
        const updated = syncCharacterProfileFromCloud(profile);
        setCharacter(updated);
        loadData();
      } catch (err) {
        console.warn('Failed to sync profile from cloud:', err);
      }
    },
    [loadData]
  );

  const setActiveCoopRaid = (raid: ActiveCoopRaid | null) => {
    if (raid) {
      saveActiveRaid(raid);
    } else {
      clearActiveRaid();
    }
    setActiveCoopRaidState(raid);
  };

  const enrollInAcademyCampaign = useCallback(
    (campaign: CampaignAcademyTemplate) => {
      try {
        const progEnrollment = createProgramEnrollment(character.id.toString(), campaign.programDefinition);
        saveProgramEnrollment(progEnrollment);
        setActiveEnrollment(progEnrollment);

        const acadEnrollment = createCampaignEnrollment(character.id.toString(), campaign, progEnrollment.id);
        saveAcademyEnrollment(acadEnrollment);
        setActiveAcademyEnrollment(acadEnrollment);
        setActiveAcademyCampaign(campaign);
        loadData();
      } catch (err) {
        console.warn('Failed to enroll in academy campaign:', err);
      }
    },
    [character, loadData]
  );

  const pauseAcademyCampaign = useCallback(() => {
    if (activeAcademyEnrollment) {
      pauseAcademyEnrollment(activeAcademyEnrollment.id);
      if (activeEnrollment) {
        pauseProgramEnrollment(activeEnrollment.id);
      }
      loadData();
    }
  }, [activeAcademyEnrollment, activeEnrollment, loadData]);

  const resumeAcademyCampaign = useCallback(() => {
    if (activeAcademyEnrollment) {
      resumeAcademyEnrollment(activeAcademyEnrollment.id);
      if (activeEnrollment) {
        resumeProgramEnrollment(activeEnrollment.id);
      }
      loadData();
    }
  }, [activeAcademyEnrollment, activeEnrollment, loadData]);

  const claimAcademyPhaseReport = useCallback(
    (phaseNumber: CampaignPhaseNumber): CampaignPhaseReport | null => {
      if (!activeAcademyEnrollment || !activeAcademyCampaign) return null;
      try {
        const campCtx = buildCampaignTelemetryContext(character.id.toString());
        const report = generatePhaseReport(activeAcademyEnrollment, activeAcademyCampaign, phaseNumber, campCtx);
        savePhaseReport(report);
        const updated = { ...activeAcademyEnrollment };
        if (phaseNumber === 1) updated.phase1ReportClaimed = true;
        if (phaseNumber === 2) updated.phase2ReportClaimed = true;
        if (phaseNumber === 3) updated.phase3ReportClaimed = true;
        saveAcademyEnrollment(updated);
        setActiveAcademyEnrollment(updated);
        addCharacterXp(report.xpEarned);
        loadData();
        return report;
      } catch (err) {
        console.warn('Error claiming academy phase report:', err);
        return null;
      }
    },
    [activeAcademyEnrollment, activeAcademyCampaign, character, loadData]
  );

  const claimAcademyFinalDossier = useCallback((): FinalCampaignDossier | null => {
    if (!activeAcademyEnrollment || !activeAcademyCampaign) return null;
    try {
      const campCtx = buildCampaignTelemetryContext(character.id.toString());
      const dossier = generateFinalDossier(activeAcademyEnrollment, activeAcademyCampaign, campCtx);
      saveFinalDossier(dossier);
      const updated = { ...activeAcademyEnrollment, finalDossierClaimed: true };
      saveAcademyEnrollment(updated);
      setActiveAcademyEnrollment(updated);
      addCharacterXp(dossier.totalGloryXpAwarded);
      loadData();
      return dossier;
    } catch (err) {
      console.warn('Error claiming final campaign dossier:', err);
      return null;
    }
  }, [activeAcademyEnrollment, activeAcademyCampaign, character, loadData]);

  const deployChapterBossBattle = useCallback(
    (chapter: CampaignChapter) => {
      const mission: CombatMission = {
        id: `chap_boss_${chapter.id}`,
        title: `Chapter Boss: ${chapter.bossName}`,
        briefing: `${chapter.bossTitle}. ${chapter.bossBriefing}`,
        difficulty: 'boss',
        enemyId: chapter.bossEncounterId,
        recommendedSets: 16,
        gloryBonusXp: chapter.rewards.find((r) => r.type === 'xp')?.amount || 500,
      };
      setCurrentMission(mission);
      startNewWorkout(`Boss Engagement: ${chapter.bossName}`, mission);
    },
    []
  );

  const changeFaction = useCallback(async (factionId: string, subfactionId?: string) => {
    const updated = updateFactionAllegiance(factionId, subfactionId);
    setCharacter(updated);

    if (coopService.isConfigured()) {
      try {
        await coopService.updateMyProfileFaction(factionId);
      } catch (err) {
        console.warn('Failed to sync faction change to cloud:', err);
      }
    }
    return updated;
  }, []);

  const refreshCustomSubfactions = useCallback(() => {
    try {
      const list = getAllCustomSubfactions();
      setCustomSubfactions(list);
    } catch (err) {
      console.warn('Failed to refresh custom subfactions:', err);
    }
  }, []);

  const createCustomSubfactionAction = useCallback(
    (input: CustomSubfactionInput) => {
      const created = createCustomSubfaction(input);
      refreshCustomSubfactions();
      return created;
    },
    [refreshCustomSubfactions]
  );

  const updateCustomSubfactionAction = useCallback(
    (id: string, updates: Partial<CustomSubfactionInput>) => {
      const updated = updateCustomSubfaction(id, updates);
      refreshCustomSubfactions();
      if (character.subfactionId === id) {
        loadData();
      }
      return updated;
    },
    [character.subfactionId, refreshCustomSubfactions, loadData]
  );

  const duplicateCustomSubfactionAction = useCallback(
    (id: string, newName?: string) => {
      const duplicated = duplicateCustomSubfaction(id, newName);
      refreshCustomSubfactions();
      return duplicated;
    },
    [refreshCustomSubfactions]
  );

  const archiveCustomSubfactionAction = useCallback(
    (id: string) => {
      const success = archiveCustomSubfaction(id);
      refreshCustomSubfactions();
      if (character.subfactionId === id) {
        const parent = getFactionById(character.factionId);
        changeFaction(character.factionId, parent?.subfactions[0]?.id);
      }
      return success;
    },
    [character.subfactionId, character.factionId, refreshCustomSubfactions, changeFaction]
  );

  const deleteCustomSubfactionAction = useCallback(
    (id: string) => {
      const isCurrent = character.subfactionId === id;
      const success = deleteCustomSubfaction(id);
      refreshCustomSubfactions();
      if (isCurrent) {
        const parent = getFactionById(character.factionId);
        changeFaction(character.factionId, parent?.subfactions[0]?.id);
      }
      return success;
    },
    [character.subfactionId, character.factionId, refreshCustomSubfactions, changeFaction]
  );

  const selectCustomSubfactionAction = useCallback(
    async (customSubfactionId: string) => {
      const subRecord = getCustomSubfactionById(customSubfactionId);
      if (subRecord) {
        await changeFaction(subRecord.parentFactionId, subRecord.id);
      }
    },
    [changeFaction]
  );

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
        logRestDaySessionAction,
        claimCoopRaidVictoryAction,
        isCoopVictoryClaimed,
        syncUserProfileFromCloud,
        repeatWorkout,
        changeFaction,
        refreshData: loadData,
        activeAcademyEnrollment,
        academyEnrollments,
        activeAcademyCampaign,
        academyPhaseReports,
        academyFinalDossier,
        enrollInAcademyCampaign,
        pauseAcademyCampaign,
        resumeAcademyCampaign,
        claimAcademyPhaseReport,
        claimAcademyFinalDossier,
        deployChapterBossBattle,
        customSubfactions,
        refreshCustomSubfactions,
        createCustomSubfactionAction,
        updateCustomSubfactionAction,
        duplicateCustomSubfactionAction,
        archiveCustomSubfactionAction,
        deleteCustomSubfactionAction,
        selectCustomSubfactionAction,
        settings,
        updateSetting,
        resetSettings,
        claimRecoveryXpAction,
        updateCharacterNameAction,
        accountInfo,
        refreshAccountInfo,
        signInCloudAccount,
        signUpCloudAccount,
        resendVerificationEmailAction,
        signOutAction,
        deleteAccountAction,
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
