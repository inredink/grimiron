import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  EquipmentDefinition,
  EquipmentSlot,
  EquippedLoadout,
  InventoryItemRecord,
  AggregatedEquipmentBonus,
} from '../types/equipment';
import {
  getCharacterInventory,
  getCharacterLoadout,
  getEquippedDefinitions,
  calculateEquipmentBonuses,
  equipItem,
  unequipItem,
  initializeStarterEquipment,
  initializeEquipmentSqliteStorage,
} from '../services/database/equipmentRepository';
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
import { initializeXpSqliteStorage } from '../services/database/xpRepository';
import {
  GearPowerCalculationResult,
  RaidTierId,
  RaidTierDefinition,
  RaidEligibilityResult,
  CharacterRaidProgressionRecord,
} from '../types/raidProgression';
import {
  calculateGearPower,
  evaluateRaidTierEligibility,
  getRaidProgressionStorageAdapter,
} from '../services/progression/raidProgressionEngine';
import { initializeRaidProgressionSqliteStorage } from '../services/database/raidProgressionRepository';
import { getRaidTierById, RAID_TIERS } from '../content/raidTiers';
import {
  awardXp,
  getDailyXpCredited,
  getDailyXpRemaining,
  XP_ECONOMY_CONFIG,
  XpAwardResult,
} from '../services/progression/xpService';

export interface FinishWorkoutResult {
  xpEarned: number;
  breakdown: XpBreakdown;
  report?: CombatAfterActionReport;
  xpAward?: XpAwardResult;
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
  inventory: InventoryItemRecord[];
  loadout: EquippedLoadout;
  equippedItems: EquipmentDefinition[];
  equipmentBonuses: AggregatedEquipmentBonus;
  gearPowerInfo: GearPowerCalculationResult;
  raidProgression: CharacterRaidProgressionRecord;
  selectedRaidTierId: RaidTierId;
  setSelectedRaidTierId: (tierId: RaidTierId) => void;
  checkRaidEligibility: (tierId: RaidTierId) => RaidEligibilityResult;
  equipItemAction: (slot: EquipmentSlot, itemId: string) => { success: boolean; message: string };
  unequipItemAction: (slot: EquipmentSlot) => { success: boolean; message: string };
  activeMissions: ActiveMissionRecord[];
  activeEnrollment: UserProgramEnrollment | null;
  campaignTelemetry: CampaignTelemetryContext;
  dailyRotation: DailyRotationRecord | null;
  weeklyRaid: WeeklyRaidCycle | null;
  warfrontSettings: WarfrontSettings;
  setWarfrontSpawnDay: (spawnDay: RaidSpawnDay) => void;
  deployDailyEncounter: (encounter: EncounterTemplate) => void;
  deployWeeklyRaid: (raid: WeeklyRaidCycle, tierId?: RaidTierId) => { success: boolean; reason?: string };
  claimWeeklyRaidRewardsAction: (cycleId: string, tierId?: RaidTierId) => boolean;
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
  dailyXpCredited: number;
  dailyXpRemaining: number;
  dailyXpCap: number;
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
  const [weeklyRaid, setWeeklyRaid] = useState<WeeklyRaidCycle | null>(() => {
    try {
      return getOrCreateWeeklyRaid({ preferredSpawnDay: 'saturday' });
    } catch {
      return null;
    }
  });
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
  const [dailyXpCredited, setDailyXpCredited] = useState<number>(0);
  const [dailyXpRemaining, setDailyXpRemaining] = useState<number>(1000);

  // Character Equipment & Inventory State
  const [inventory, setInventory] = useState<InventoryItemRecord[]>([]);
  const [loadout, setLoadout] = useState<EquippedLoadout>({});
  const [equippedItems, setEquippedItems] = useState<EquipmentDefinition[]>([]);
  const [equipmentBonuses, setEquipmentBonuses] = useState<AggregatedEquipmentBonus>({
    totalBonusDamage: 0,
    totalDamageMultiplier: 0,
    totalCritChanceBonus: 0,
    totalCritMultiplierBonus: 0,
    totalDefenseRating: 0,
    equippedItemIds: [],
  });

  // Raid Progression & Tier Clearance State
  const [raidProgression, setRaidProgression] = useState<CharacterRaidProgressionRecord>({
    characterId: 'char_main',
    highestTierUnlocked: 'tier_1_initiation',
    tierVictories: {},
    totalRaidVictories: 0,
  });
  const [selectedRaidTierId, setSelectedRaidTierId] = useState<RaidTierId>('tier_1_initiation');

  const loadData = useCallback(() => {
    try {
      initializeDatabase();
      initializeXpSqliteStorage();
      initializeEquipmentSqliteStorage();
      initializeRaidProgressionSqliteStorage();
      initializeRecoverySqliteStorage();
      initializeNotificationSqliteStorage();
      initializeDiagnosticsSqliteProvider();
      const prof = getCharacterProfile();
      setCharacter(prof);
      const userStats = getUserCareerStats();
      const history = getAllWorkouts();
      const cachedRaid = getActiveRaid();
      const curRaidProg = getRaidProgressionStorageAdapter().getProgression('char_main');
      setRaidProgression(curRaidProg);

      // Clean up any erroneous initiate achievements if fresh account
      try {
        clearUnearnedInitiateAchievements();
      } catch {}

      // Load user settings
      try {
        const userSettings = getAllSettings();

        // If this is an existing user who already has recorded workouts or training XP,
        // but onboarding_completed is false (e.g. from an older version of the app),
        // automatically mark onboarding as completed so they are never forced through it.
        const isExistingUser = userStats.totalWorkouts > 0 || prof.totalXp > 0;
        if (isExistingUser && !userSettings.onboarding_completed) {
          userSettings.onboarding_completed = true;
          saveSetting('onboarding_completed', true);
        }

        setSettings(userSettings);
        setHapticsEnabled(userSettings.haptics_enabled);

        const creditedToday = getDailyXpCredited();
        const cap = userSettings.rpg_daily_xp_cap || XP_ECONOMY_CONFIG.DEFAULT_DAILY_XP_CAP;
        setDailyXpCredited(creditedToday);
        setDailyXpRemaining(Math.max(0, cap - creditedToday));
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

      // Load character equipment and inventory
      try {
        let curInv = getCharacterInventory('char_main');
        if (curInv.length === 0) {
          initializeStarterEquipment('char_main', prof.factionId);
          curInv = getCharacterInventory('char_main');
        }
        setInventory(curInv);
        const curLoadout = getCharacterLoadout('char_main');
        setLoadout(curLoadout);
        const curEquipped = getEquippedDefinitions('char_main');
        setEquippedItems(curEquipped);
        setEquipmentBonuses(calculateEquipmentBonuses(curEquipped));
      } catch (equipErr) {
        console.warn('Equipment loading skipped:', equipErr);
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

        // Sync cloud onboarding metadata if authenticated with Supabase
        coopService
          .getOnboardingMetadata()
          .then((cloudOnboarding) => {
            if (cloudOnboarding === true) {
              const currentSettings = getAllSettings();
              if (!currentSettings.onboarding_completed) {
                saveSetting('onboarding_completed', true);
                setSettings((prev) => ({ ...prev, onboarding_completed: true }));
              }
            } else if (cloudOnboarding === false) {
              const currentSettings = getAllSettings();
              if (currentSettings.onboarding_completed) {
                coopService.updateOnboardingMetadata(true).catch(() => {});
              }
            }
          })
          .catch(() => {});
      }

      // Activate SQLite storage adapter for Warfront
      setWarfrontStorageAdapter(sqliteWarfrontStorage);

      // Load Warfront daily rotation, weekly raid, and user settings with resilient error isolation
      try {
        const rot = getOrCreateDailyRotation();
        setDailyRotation(rot);
      } catch (rotErr) {
        console.warn('Warfront daily rotation initialization warning:', rotErr);
      }

      let activeWfSettings: WarfrontSettings = {
        preferredSpawnDay: 'saturday',
        categoryFilter: 'all',
      };
      try {
        activeWfSettings = getWarfrontSettings();
        setWarfrontSettingsState(activeWfSettings);
      } catch (wfErr) {
        console.warn('Warfront settings initialization warning:', wfErr);
      }

      try {
        const raid = getOrCreateWeeklyRaid({ preferredSpawnDay: activeWfSettings.preferredSpawnDay });
        setWeeklyRaid(raid);
      } catch (raidErr) {
        console.warn('Warfront weekly raid initialization warning:', raidErr);
        try {
          const fallbackRaid = getOrCreateWeeklyRaid({ preferredSpawnDay: 'saturday', now: new Date() });
          setWeeklyRaid(fallbackRaid);
        } catch (fbErr) {
          console.warn('Fallback raid generation warning:', fbErr);
        }
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

  const gearPowerInfo: GearPowerCalculationResult = useMemo(() => {
    return calculateGearPower(equippedItems);
  }, [equippedItems]);

  const defeatedRaidTiers = useMemo(() => {
    return getRaidProgressionStorageAdapter().getDefeatedTiers('char_main');
  }, [raidProgression]);

  const progression: CharacterProgression = calculateProgression(
    character.totalXp,
    currentFaction,
    defeatedRaidTiers
  );

  const checkRaidEligibility = useCallback(
    (tierId: RaidTierId): RaidEligibilityResult => {
      const defTiers = getRaidProgressionStorageAdapter().getDefeatedTiers('char_main');
      return evaluateRaidTierEligibility(tierId, {
        characterLevel: progression.level,
        characterRankTier: progression.currentRankTier,
        gearPower: gearPowerInfo.gearPower,
        characterFactionId: currentFaction?.id || 'adeptus-astartes',
        defeatedRaidTiers: defTiers,
      });
    },
    [progression.level, progression.currentRankTier, gearPowerInfo.gearPower, currentFaction?.id]
  );

  const enrollInProgram = useCallback((program: TrainingProgramDefinition) => {
    try {
      const enrollment = createProgramEnrollment(character.id.toString(), program);
      saveProgramEnrollment(enrollment);
      setActiveEnrollment(enrollment);
      loadData();
    } catch (err) {
      console.warn('Error enrolling in program:', err);
    }
  }, [character.id, loadData]);

  const pauseActiveProgram = useCallback(() => {
    if (activeEnrollment) {
      pauseProgramEnrollment(activeEnrollment.id);
      setActiveEnrollment((prev) => (prev ? { ...prev, status: 'paused' } : null));
      loadData();
    }
  }, [activeEnrollment, loadData]);

  const resumeActiveProgram = useCallback(() => {
    if (activeEnrollment) {
      resumeProgramEnrollment(activeEnrollment.id);
      setActiveEnrollment((prev) => (prev ? { ...prev, status: 'active' } : null));
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
        } else if (key === 'onboarding_completed') {
          // If cloud authenticated, synchronize the onboarding state to cloud account user_metadata
          if (coopService.isConfigured()) {
            coopService.updateOnboardingMetadata(Boolean(value)).catch(() => {});
          }
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
    (raid: WeeklyRaidCycle, tierId?: RaidTierId): { success: boolean; reason?: string } => {
      const targetTierId = tierId || selectedRaidTierId || 'tier_1_initiation';
      const eligibility = checkRaidEligibility(targetTierId);
      if (!eligibility.isEligible) {
        return { success: false, reason: eligibility.primaryLockReason };
      }

      const tierDef = getRaidTierById(targetTierId);
      setActiveRaidCycleId(raid.cycleId);
      setActiveDailyEncounterId(null);
      const mission: CombatMission = {
        id: `raid_${raid.cycleId}`,
        title: `Raid [${tierDef.codeName}]: ${raid.boss.name}`,
        briefing: `${tierDef.loreBriefing}\n\n${raid.boss.tacticalDescription}`,
        difficulty: tierDef.tierNumber >= 6 ? 'crusade' : tierDef.tierNumber >= 4 ? 'boss' : 'incursion',
        enemyId: raid.boss.bossKey,
        recommendedSets: tierDef.recommendedSets,
        gloryBonusXp: tierDef.gloryXpReward,
      };
      setCurrentMission(mission);
      startNewWorkout(`Weekly Raid (${tierDef.name}): ${raid.boss.name}`, mission);
      return { success: true };
    },
    [selectedRaidTierId, checkRaidEligibility]
  );

  const claimWeeklyRaidRewardsAction = useCallback((cycleId: string, tierId?: RaidTierId): boolean => {
    const targetTierId = tierId || selectedRaidTierId || 'tier_1_initiation';
    const result = claimWeeklyRaidRewards(
      cycleId,
      currentFaction.id,
      progression.level,
      progression.currentRankTier,
      'char_main',
      targetTierId
    );
    if (result.success) {
      getRaidProgressionStorageAdapter().recordRaidVictory(targetTierId, 'char_main');
      const updatedProg = getRaidProgressionStorageAdapter().getProgression('char_main');
      setRaidProgression(updatedProg);

      if (result.gloryXpAwarded > 0) {
        awardXp({
          amount: result.gloryXpAwarded,
          sourceType: 'raid_boss_defeat',
          idempotencyKey: `raid_${cycleId}_${targetTierId}`,
          reason: result.message,
          dailyCap: settings.rpg_daily_xp_cap,
        });
      }
      loadData();
      return true;
    }
    return false;
  }, [loadData, settings.rpg_daily_xp_cap, currentFaction.id, progression.level, progression.currentRankTier, selectedRaidTierId]);

  const equipItemAction = useCallback(
    (slot: EquipmentSlot, itemId: string): { success: boolean; message: string } => {
      const result = equipItem(
        'char_main',
        slot,
        itemId,
        progression.level,
        progression.currentRankTier,
        currentFaction.id
      );
      if (result.success) {
        loadData();
      }
      return result;
    },
    [progression.level, progression.currentRankTier, currentFaction.id, loadData]
  );

  const unequipItemAction = useCallback(
    (slot: EquipmentSlot): { success: boolean; message: string } => {
      const result = unequipItem('char_main', slot);
      if (result.success) {
        loadData();
      }
      return result;
    },
    [loadData]
  );

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

    const xpAward = saveCompletedWorkout(
      completedSession,
      totalXp,
      breakdown,
      settings.rpg_daily_xp_cap
    );

    // Immediately synchronize in-memory React character profile with the credited XP
    const updatedProf = getCharacterProfile();
    setCharacter(updatedProf);

    let report: CombatAfterActionReport | undefined;
    let battleRecordId: string | undefined;

    if (encounterState && mission) {
      saveCombatEncounter(completedSession.id, encounterState);
      const newProg = calculateProgression(
        xpAward.totalXpNow,
        currentFaction
      );
      const xpCapInfo = {
        isCapped: xpAward.isCapped,
        requestedXp: xpAward.requestedAmount,
        creditedXp: xpAward.creditedAmount,
        spilloverXp: xpAward.spilloverAmount,
      };
      report = buildAfterActionReport(
        mission,
        encounterState.enemy,
        encounterState,
        completedSession,
        breakdown.totalXp,
        progression,
        newProg,
        xpCapInfo
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
        xpEarned: xpAward.creditedAmount,
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
            totalXpEarned: xpAward.creditedAmount,
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
            awardXp({
              amount: questResult.totalXpAwarded,
              sourceType: 'campaign_quest',
              idempotencyKey: `quest_batch_${currentAcadEnrollment.id}_${questResult.newlyCompletedQuests.map((q) => q.id).join('_')}`,
              reason: `Academy Quests: ${questResult.newlyCompletedQuests.map((q) => q.title).join(', ')}`,
              dailyCap: settings.rpg_daily_xp_cap,
            });
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

    return { xpEarned: xpAward.creditedAmount, breakdown, report, xpAward };
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

        const xpAward = awardXp({
          amount: gloryBonusXp,
          sourceType: 'chapter_boss_defeat',
          idempotencyKey: `boss_${battleId}`,
          reason: `Crusade victory achieved! ${boss.name} was slain.`,
          dailyCap: settings.rpg_daily_xp_cap,
        });

        battleRecord.xpEarned = xpAward.creditedAmount;
        recordBattleHistory(battleRecord);

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
        awardXp({
          amount: report.xpEarned,
          sourceType: 'phase_report',
          idempotencyKey: `phase_report_${activeAcademyEnrollment.id}_p${phaseNumber}`,
          reason: `Campaign Academy Phase ${phaseNumber} Complete`,
          dailyCap: settings.rpg_daily_xp_cap,
        });
        loadData();
        return report;
      } catch (err) {
        console.warn('Error claiming academy phase report:', err);
        return null;
      }
    },
    [activeAcademyEnrollment, activeAcademyCampaign, character, loadData, settings.rpg_daily_xp_cap]
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
      awardXp({
        amount: dossier.totalGloryXpAwarded,
        sourceType: 'final_dossier',
        idempotencyKey: `final_dossier_${activeAcademyEnrollment.id}`,
        reason: `Final Campaign Dossier: ${activeAcademyCampaign.title}`,
        dailyCap: settings.rpg_daily_xp_cap,
      });
      loadData();
      return dossier;
    } catch (err) {
      console.warn('Error claiming final campaign dossier:', err);
      return null;
    }
  }, [activeAcademyEnrollment, activeAcademyCampaign, character, loadData, settings.rpg_daily_xp_cap]);

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

    // Initialize starter equipment for newly chosen faction without erasing existing inventory
    try {
      initializeStarterEquipment('char_main', factionId);
      loadData();
    } catch (e) {
      console.warn('Starter equipment sync error:', e);
    }

    if (coopService.isConfigured()) {
      try {
        await coopService.updateMyProfileFaction(factionId);
      } catch (err) {
        console.warn('Failed to sync faction change to cloud:', err);
      }
    }
    return updated;
  }, [loadData]);

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
        inventory,
        loadout,
        equippedItems,
        equipmentBonuses,
        gearPowerInfo,
        raidProgression,
        selectedRaidTierId,
        setSelectedRaidTierId,
        checkRaidEligibility,
        equipItemAction,
        unequipItemAction,
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
        dailyXpCredited,
        dailyXpRemaining,
        dailyXpCap: settings.rpg_daily_xp_cap || XP_ECONOMY_CONFIG.DEFAULT_DAILY_XP_CAP,
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
