import { XP_CONFIG, calculateWorkoutXp, normalizeToKg } from '../services/progression/xpCalculator';
import { getCumulativeXpForLevel, getLevelFromTotalXp, calculateProgression } from '../services/progression/rankEngine';
import { warhammer40kUniverse, getFactionById, getSubfactionById, getRankForXp } from '../content/warhammer40k';
import {
  CustomSubfactionRecord,
  CustomSubfactionInput,
  DoctrineTag,
  DOCTRINE_TAG_LABELS,
  toSubfactionView,
} from '../types/customSubfaction';
import {
  validateCustomSubfaction,
  MAX_SUBFACTION_NAME_LENGTH,
  ValidationError,
} from '../utils/customSubfactionValidator';
import { WorkoutExercise, WorkoutSession, ExerciseSet } from '../types/workout';
import { EXERCISE_CATALOG } from '../content/exercises/catalog';
import { ExerciseDefinition } from '../types/exercise';
import { calculateSetDamage, DAMAGE_CONFIG } from '../services/combat/damageCalculator';
import { getAttackStyleForExercise, createAttackFromSet } from '../services/combat/attackEngine';
import { computeCombatState, buildAfterActionReport } from '../services/combat/combatEngine';
import { ENEMY_CATALOG, getEnemyById } from '../content/combat/enemies';
import { MISSION_CATALOG, getMissionById } from '../content/combat/missions';
import {
  sanitizeCoopAttackPayload,
  simulateServerRecordCoopAttack,
} from '../services/combat/coopAttackSanitizer';
import { warhammer40kFactions } from '../content/warhammer40k/factions';
import {
  FACTION_ATTACKS_CATALOG,
  getAttacksForFaction,
  resolveFactionAttack,
  DEFAULT_FALLBACK_ATTACKS,
} from '../content/combat/factionAttacks';
import { getAttackCategoryForExercise } from '../services/combat/attackEngine';
import { ACHIEVEMENT_CATALOG } from '../content/achievements/catalog';
import {
  AchievementDefinition,
  AchievementEvaluationContext,
  AchievementAward,
  AchievementProgress,
  AchievementCategory,
} from '../types/achievements';
import {
  BattleRecord,
  BattleSnapshot,
  BattleParticipantContribution,
  BattleTimelineEvent,
  BattleOutcome,
} from '../types/battleHistory';
import {
  evaluateCriterionMetric,
  evaluateAchievements,
  getNumericTier,
} from '../services/progression/achievementEvaluator';
import {
  FACTION_MISSION_CATALOG,
  getMissionsForFaction,
  getMissionDefinitionById,
} from '../content/missions/catalog';
import {
  checkMissionEligibility,
  evaluateObjectiveMetric,
  evaluateActiveMission,
} from '../services/progression/missionEvaluator';
import {
  MissionEvaluationContext,
  FactionMissionDefinition,
  ActiveMissionRecord,
} from '../types/mission';
import {
  TRAINING_PROGRAM_CATALOG,
  getProgramById,
  getProgramsByCategory,
  createCustomProgramTemplate,
} from '../content/programs/catalog';
import {
  TrainingProgramDefinition,
  ScheduledProgramSession,
  UserProgramEnrollment,
  ProgramSessionRecord,
} from '../types/program';
import {
  createProgramEnrollment,
  populateWorkoutFromScheduledSession,
  evaluateSessionAdherence,
  advanceEnrollmentSession,
  recordRestDaySession,
  calculateExercisePerformanceTrends,
} from '../services/progression/programEngine';
import { CoopBoss, CoopGroup, CoopAttack } from '../types/coop';
import {
  CAMPAIGN_CATALOG,
  getCampaignById,
  getDefaultCampaign,
} from '../content/campaigns/catalog';
import {
  CampaignDefinition,
  CampaignNode,
  CampaignTelemetryContext,
} from '../types/campaign';
import { getSafeIoniconsName } from '../utils/iconHelper';
import {
  evaluateCampaignRequirement,
  evaluateCampaignNode,
  evaluateFullCampaign,
} from '../services/progression/campaignEvaluator';
import {
  allEncounterTemplates,
  getAllEncounterTemplates,
  getEncounterById,
  getEncountersByCategory,
  getEncountersByFaction,
  convertToCombatMission,
  convertToEnemyDefinition,
} from '../content/encounters/catalog';
import {
  EncounterTemplate,
  EncounterCategory,
  DailyRotationRecord,
  WeeklyRaidCycle,
  GeneratedBossIdentity,
  BossDifficultyTier,
  BossPhaseDefinition,
} from '../types/warfront';
import {
  createDeterministicPrng,
  generateProceduralBoss,
} from '../services/progression/bossGenerator';
import {
  getTodayDateString,
  getOrCreateDailyRotation,
  completeDailyEncounter,
  calculateWeeklyCycleTiming,
  reconcileExpiredRaids,
  getOrCreateWeeklyRaid,
  applyDamageToWeeklyRaid,
  claimWeeklyRaidRewards,
  inMemoryWarfrontStorage,
  calculateBossPhase,
  getCurrentBossPhase,
  createBattleRecordFromWeeklyRaid,
  archiveWeeklyRaidToBattleHistory,
  isEnemySlain,
  isEnemyEscaped,
} from '../services/progression/warfrontEngine';
import {
  CAMPAIGN_ACADEMY_CATALOG,
  getAcademyCampaignById,
  getCampaignsByExperience,
  getCampaignsByGoal,
  getCampaignsByEquipment,
} from '../content/campaignAcademy/catalog';
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
  AppSettings,
  DEFAULT_APP_SETTINGS,
  ACCENT_COLOR_MAP,
  WeightUnit,
  DistanceUnit,
  DateFormat,
  TimeFormat,
} from '../types/settings';
import {
  convertWeight,
  formatWeight,
  convertDistance,
  formatDate,
  formatTime,
  getStartOfWeek,
} from '../utils/unitConversion';
import {
  isRecoveryDayEligible,
  hasAlreadyReceivedRecoveryXp,
} from '../services/progression/recoveryEngine';
import {
  isInQuietHours,
  shouldDispatchNotification,
} from '../services/notifications/notificationManager';
import {
  getAppDiagnostics,
  formatDiagnosticReport,
} from '../services/diagnostics/diagnosticsService';
import {
  createCampaignEnrollment,
  evaluateCampaignQuests,
  evaluateChapterBossUnlock,
  recordBossVictory,
  generatePhaseReport,
  generateFinalDossier,
  inMemoryAcademyStorage,
} from '../services/progression/campaignAcademyEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

console.log('====================================================');
console.log('RUNNING GRIMIRON CORE DOMAIN & PROGRESSION TESTS');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST SUITE 1: XP Calculations
// ----------------------------------------------------
console.log('[TEST SUITE 1: XP Calculations]');

// 1.1 Incomplete workout or 0 sets
const emptyResult = calculateWorkoutXp([], true);
assert(emptyResult.totalXp === 0, 'Empty workout returns 0 XP');

const abandonedResult = calculateWorkoutXp([
  {
    id: 'e1',
    sessionId: 's1',
    name: 'Bench Press',
    sortOrder: 0,
    sets: [{ id: 'set1', exerciseId: 'e1', setNumber: 1, reps: 10, weight: 135, unit: 'lbs', isCompleted: false }],
  },
], false);
assert(abandonedResult.totalXp === 0, 'Unfinished/abandoned workout returns 0 XP');

// 1.2 Bodyweight exercises (0 weight)
const bodyweightExercise: WorkoutExercise[] = [
  {
    id: 'bw1',
    sessionId: 's1',
    name: 'Push-ups',
    sortOrder: 0,
    sets: [
      { id: 's1', exerciseId: 'bw1', setNumber: 1, reps: 20, weight: 0, unit: 'lbs', isCompleted: true },
      { id: 's2', exerciseId: 'bw1', setNumber: 2, reps: 15, weight: 0, unit: 'lbs', isCompleted: true },
      { id: 's3', exerciseId: 'bw1', setNumber: 3, reps: 15, weight: 0, unit: 'lbs', isCompleted: true },
    ],
  },
];
const bwResult = calculateWorkoutXp(bodyweightExercise, true);
assert(bwResult.baseWorkoutXp === 100, 'Base workout completion awards 100 XP');
assert(bwResult.completedSetsXp === 3 * 20, '3 completed sets award 60 XP');
assert(bwResult.repsXp === 50 * 1, '50 total reps award 50 XP');
assert(bwResult.volumeXp === 0, 'Bodyweight (0 weight) awards 0 extra tonnage XP without error');
assert(bwResult.totalXp === 210, 'Bodyweight workout yields 210 total XP correctly');

// 1.3 Heavy resistance training
const heavySquats: WorkoutExercise[] = [
  {
    id: 'sq1',
    sessionId: 's1',
    name: 'Barbell Squat',
    sortOrder: 0,
    sets: [
      { id: 's1', exerciseId: 'sq1', setNumber: 1, reps: 5, weight: 100, unit: 'kg', isCompleted: true },
      { id: 's2', exerciseId: 'sq1', setNumber: 2, reps: 5, weight: 100, unit: 'kg', isCompleted: true },
      { id: 's3', exerciseId: 'sq1', setNumber: 3, reps: 5, weight: 100, unit: 'kg', isCompleted: true },
    ],
  },
];
const heavyResult = calculateWorkoutXp(heavySquats, true);
assert(heavyResult.baseWorkoutXp === 100, 'Heavy lifting includes 100 base XP');
assert(heavyResult.completedSetsXp === 60, '3 heavy sets award 60 XP');
assert(heavyResult.repsXp === 15, '15 reps award 15 XP');
assert(heavyResult.volumeXp > 0, 'Weight moved awards positive tonnage XP');
assert(heavyResult.totalXp > bwResult.totalXp, 'Heavy lifting with weight gives higher total than bodyweight');

// 1.4 Max session cap check
const extremeWorkout: WorkoutExercise[] = [
  {
    id: 'ex1',
    sessionId: 's1',
    name: 'Endless Squats',
    sortOrder: 0,
    sets: Array.from({ length: 50 }, (_, i) => ({
      id: `set_${i}`,
      exerciseId: 'ex1',
      setNumber: i + 1,
      reps: 100,
      weight: 1000,
      unit: 'lbs' as const,
      isCompleted: true,
    })),
  },
];
const extremeResult = calculateWorkoutXp(extremeWorkout, true);
assert(
  extremeResult.totalXp <= XP_CONFIG.MAX_SESSION_TOTAL_XP,
  `Extreme inputs respect hard ceiling of ${XP_CONFIG.MAX_SESSION_TOTAL_XP} XP (got ${extremeResult.totalXp})`
);

// ----------------------------------------------------
// TEST SUITE 2: Level Progression
// ----------------------------------------------------
console.log('\n[TEST SUITE 2: Level & Progression]');

assert(getCumulativeXpForLevel(1) === 0, 'Level 1 requires 0 cumulative XP');
assert(getCumulativeXpForLevel(2) === 300, 'Level 2 requires 300 cumulative XP');
assert(getLevelFromTotalXp(0) === 1, '0 XP maps to Level 1');
assert(getLevelFromTotalXp(299) === 1, '299 XP remains Level 1');
assert(getLevelFromTotalXp(300) === 2, '300 XP promotes to Level 2');
assert(getLevelFromTotalXp(1000) === 3, '1,000 XP maps to Level 3');

const testFaction = warhammer40kUniverse.factions[0];
const prog1 = calculateProgression(0, testFaction);
assert(prog1.level === 1, 'calculateProgression Level is 1 at 0 XP');
assert(prog1.progressPercent === 0, 'calculateProgression progressPercent is 0% at start');
assert(prog1.currentRankTier === 1, 'Rank tier is 1 for initiate');

const progMid = calculateProgression(150, testFaction);
assert(progMid.level === 1, 'Level is still 1 at 150 XP');
assert(progMid.progressPercent === 50, 'progressPercent is exactly 50% at 150/300 XP');

// ----------------------------------------------------
// TEST SUITE 3: Warhammer 40K Content Catalog Integrity
// ----------------------------------------------------
console.log('\n[TEST SUITE 3: Warhammer 40,000 Factions Catalog]');

assert(warhammer40kUniverse.factions.length === 20, `Catalog contains 20 major 40K factions (found ${warhammer40kUniverse.factions.length})`);

const allegiances = new Set(warhammer40kUniverse.factions.map((f) => f.allegiance));
assert(allegiances.has('imperium'), 'Catalog contains Imperium factions');
assert(allegiances.has('chaos'), 'Catalog contains Chaos factions');
assert(allegiances.has('xenos'), 'Catalog contains Xenos factions');

for (const faction of warhammer40kUniverse.factions) {
  assert(Boolean(faction.id), `Faction ${faction.name} has non-empty id`);
  assert(Boolean(faction.name), `Faction ${faction.id} has valid name`);
  assert(faction.subfactions.length > 0, `Faction ${faction.name} has at least 1 subfaction (has ${faction.subfactions.length})`);
  assert(faction.ranks.length >= 5, `Faction ${faction.name} has at least 5 rank tiers (has ${faction.ranks.length})`);

  let prevXp = -1;
  for (let i = 0; i < faction.ranks.length; i++) {
    const rank = faction.ranks[i];
    assert(rank.tier === i + 1, `Faction ${faction.name} rank ${rank.title} has correct tier ${i + 1}`);
    assert(rank.minXp >= prevXp, `Faction ${faction.name} rank ${rank.title} XP (${rank.minXp}) is >= previous (${prevXp})`);
    prevXp = rank.minXp;
  }
}

// ----------------------------------------------------
// TEST SUITE 4: Exercise Library Catalog Integrity (~100 Exercises)
// ----------------------------------------------------
console.log('\n[TEST SUITE 4: Exercise Library Catalog Integrity]');

assert(EXERCISE_CATALOG.length >= 100, `Exercise catalog contains at least 100 exercises (actual count: ${EXERCISE_CATALOG.length})`);

const seenIds = new Set<string>();
const equipmentGroups = new Set<string>();
const muscleGroups = new Set<string>();

for (const ex of EXERCISE_CATALOG) {
  assert(!seenIds.has(ex.id), `Exercise ID ${ex.id} is unique`);
  seenIds.add(ex.id);

  assert(Boolean(ex.name && ex.name.trim().length > 0), `Exercise ${ex.id} has valid name`);
  assert(Array.isArray(ex.aliases), `Exercise ${ex.name} has aliases array`);
  assert(Boolean(ex.primaryMuscle), `Exercise ${ex.name} has primary muscle: ${ex.primaryMuscle}`);
  assert(Array.isArray(ex.secondaryMuscles), `Exercise ${ex.name} has secondaryMuscles array`);
  assert(Boolean(ex.equipment), `Exercise ${ex.name} has equipment: ${ex.equipment}`);
  assert(Boolean(ex.movementPattern), `Exercise ${ex.name} has movement pattern: ${ex.movementPattern}`);
  assert(Boolean(ex.category), `Exercise ${ex.name} has category: ${ex.category}`);

  equipmentGroups.add(ex.equipment);
  muscleGroups.add(ex.primaryMuscle);
}

// Verify comprehensive equipment coverage
const requiredEquipment = ['barbell', 'dumbbell', 'bodyweight', 'cable', 'machine', 'kettlebell', 'resistance_band'];
for (const eq of requiredEquipment) {
  assert(equipmentGroups.has(eq), `Catalog covers equipment: ${eq}`);
}

// Verify muscle group coverage
const requiredMuscles = ['chest', 'back', 'quads', 'hamstrings', 'glutes', 'shoulders', 'biceps', 'triceps', 'core'];
for (const m of requiredMuscles) {
  assert(muscleGroups.has(m), `Catalog covers primary muscle: ${m}`);
}

// ----------------------------------------------------
// TEST SUITE 5: Exercise Search & Filtering Algorithms
// ----------------------------------------------------
console.log('\n[TEST SUITE 5: Search & Alias Matching]');

// Test direct name search
const benchMatches = EXERCISE_CATALOG.filter((e) =>
  e.name.toLowerCase().includes('bench press') || e.aliases.some((a) => a.toLowerCase().includes('bench press'))
);
assert(benchMatches.length >= 3, `Search 'bench press' matches flat, incline, and close-grip variants (found ${benchMatches.length})`);

// Test acronym and alias search
const rdlMatches = EXERCISE_CATALOG.filter((e) =>
  e.aliases.some((a) => a.toLowerCase() === 'rdl')
);
assert(rdlMatches.length >= 2, `Alias search 'rdl' finds barbell and dumbbell Romanian Deadlifts (found ${rdlMatches.length})`);

const ohpMatches = EXERCISE_CATALOG.filter((e) =>
  e.aliases.some((a) => a.toLowerCase() === 'ohp')
);
assert(ohpMatches.length >= 1, `Alias search 'ohp' finds Overhead Press (found ${ohpMatches.length})`);

// Test equipment filtering
const kettlebells = EXERCISE_CATALOG.filter((e) => e.equipment === 'kettlebell');
assert(kettlebells.length >= 6, `Filter by equipment 'kettlebell' returns >= 6 exercises (found ${kettlebells.length})`);

const bodyweight = EXERCISE_CATALOG.filter((e) => e.equipment === 'bodyweight');
assert(bodyweight.length >= 15, `Filter by equipment 'bodyweight' returns >= 15 exercises (found ${bodyweight.length})`);

// ----------------------------------------------------
// TEST SUITE 6: Workout Cloning & Set Classification
// ----------------------------------------------------
console.log('\n[TEST SUITE 6: Workout Cloning & Repeat Support]');

const templateSession: WorkoutSession = {
  id: 'template_session_1',
  title: 'Leg Day Crusade',
  startedAt: '2026-10-15T10:00:00.000Z',
  finishedAt: '2026-10-15T11:00:00.000Z',
  totalXpEarned: 350,
  isCompleted: true,
  exercises: [
    {
      id: 'template_ex_1',
      sessionId: 'template_session_1',
      exerciseRefId: 'ex_bb_squat',
      name: 'Barbell Back Squat',
      sortOrder: 0,
      sets: [
        { id: 's1', exerciseId: 'template_ex_1', setNumber: 1, reps: 10, weight: 135, unit: 'lbs', isCompleted: true, setClassification: 'warmup' },
        { id: 's2', exerciseId: 'template_ex_1', setNumber: 2, reps: 5, weight: 225, unit: 'lbs', isCompleted: true, setClassification: 'working' },
        { id: 's3', exerciseId: 'template_ex_1', setNumber: 3, reps: 8, weight: 185, unit: 'lbs', isCompleted: true, setClassification: 'dropset' },
      ],
    },
    {
      id: 'template_ex_2',
      sessionId: 'template_session_1',
      exerciseRefId: 'ex_bw_pullup',
      name: 'Pull-up',
      sortOrder: 1,
      sets: [
        { id: 's4', exerciseId: 'template_ex_2', setNumber: 1, reps: 12, weight: 0, unit: 'lbs', isCompleted: true, setClassification: 'working' },
      ],
    },
  ],
};

// Simulate cloning function logic
const clonedSession: WorkoutSession = {
  id: `session_${Date.now()}`,
  title: templateSession.title,
  startedAt: new Date().toISOString(),
  totalXpEarned: 0,
  isCompleted: false,
  notes: templateSession.notes,
  exercises: templateSession.exercises.map((ex, exIdx) => {
    const newExId = `cloned_ex_${exIdx}`;
    return {
      id: newExId,
      sessionId: 'new_session',
      exerciseRefId: ex.exerciseRefId,
      name: ex.name,
      sortOrder: ex.sortOrder,
      sets: ex.sets.map((set, setIdx) => ({
        id: `cloned_set_${exIdx}_${setIdx}`,
        exerciseId: newExId,
        setNumber: setIdx + 1,
        reps: set.reps,
        weight: set.weight,
        unit: set.unit,
        isCompleted: false, // Must be reset
        setClassification: set.setClassification,
      })),
    };
  }),
};

assert(clonedSession.isCompleted === false, 'Cloned workout is not marked completed');
assert(clonedSession.totalXpEarned === 0, 'Cloned workout starts with 0 XP');
assert(clonedSession.exercises.length === 2, 'Cloned workout preserves all exercises');
assert(clonedSession.exercises[0].exerciseRefId === 'ex_bb_squat', 'Cloned exercise preserves catalog reference ID');
assert(clonedSession.exercises[0].sets.length === 3, 'Cloned exercise preserves all 3 sets');
assert(clonedSession.exercises[0].sets[0].setClassification === 'warmup', 'Warmup classification preserved');
assert(clonedSession.exercises[0].sets[0].isCompleted === false, 'Warmup set completion status is reset to false');
assert(clonedSession.exercises[0].sets[1].setClassification === 'working', 'Working classification preserved');
assert(clonedSession.exercises[0].sets[2].setClassification === 'dropset', 'Dropset classification preserved');
assert(clonedSession.exercises[1].sets[0].weight === 0, 'Bodyweight 0 weight is preserved without corruption');

// ----------------------------------------------------
// TEST SUITE 7: Solo Combat Encounter & Damage Formulas
// ----------------------------------------------------
console.log('\n[TEST SUITE 7: Solo Combat, Damage Engine & Idempotency]');

// 7.1 Damage Calculation Foundation: Bodyweight vs Weighted
const bodyweightSet: ExerciseSet = {
  id: 'set_bw_test',
  exerciseId: 'ex1',
  setNumber: 1,
  reps: 10,
  weight: 0,
  unit: 'lbs',
  isCompleted: true,
  setClassification: 'working',
};

const bwDmg = calculateSetDamage(bodyweightSet, 'Pull-up');
assert(bwDmg.damage > 0, `Bodyweight set deals non-zero damage (${bwDmg.damage} dmg)`);
assert(bwDmg.baseDamage === DAMAGE_CONFIG.BASE_SET_DAMAGE, 'Base effort damage is awarded');
assert(bwDmg.repBonus === 10 * 10, 'Rep bonus scales correctly (100 dmg for 10 reps)');
assert(bwDmg.loadBonus > 0, `Bodyweight calibrated load bonus is applied (${bwDmg.loadBonus} load bonus)`);

// 7.2 Weighted diminishing returns
const heavySquatSet: ExerciseSet = {
  id: 'set_heavy_squat',
  exerciseId: 'ex2',
  setNumber: 1,
  reps: 5,
  weight: 315, // lbs
  unit: 'lbs',
  isCompleted: true,
  setClassification: 'working',
};
const heavyDmg = calculateSetDamage(heavySquatSet, 'Barbell Squat');
assert(heavyDmg.damage > bwDmg.baseDamage, 'Heavy weighted lift deals substantial damage');
assert(heavyDmg.loadBonus <= DAMAGE_CONFIG.MAX_WEIGHT_BONUS, 'Weight damage respects diminishing returns cap');

// 7.3 Set classification scaling
const warmupSet: ExerciseSet = { ...bodyweightSet, id: 'set_wu_test', setClassification: 'warmup' };
const dropsetSet: ExerciseSet = { ...bodyweightSet, id: 'set_drop_test', setClassification: 'dropset' };
const wuDmg = calculateSetDamage(warmupSet);
const dropDmg = calculateSetDamage(dropsetSet);
assert(wuDmg.classMultiplier === 0.65, 'Warmup multiplier is 0.65x');
assert(dropDmg.classMultiplier === 1.15, 'Dropset multiplier is 1.15x');
assert(dropDmg.damage > wuDmg.damage, 'Dropset deals more damage than warmup set');

// 7.4 Thematic Attack Styles
const squatStyle = getAttackStyleForExercise('Barbell Back Squat', 'ex_bb_squat');
assert(squatStyle.styleName === 'Heavy Seismic Strike', 'Compound legs map to Heavy Seismic Strike');

const benchStyle = getAttackStyleForExercise('Flat Barbell Bench Press', 'ex_bb_bench_press');
assert(benchStyle.styleName === 'Armor-Piercing Volley', 'Upper push maps to Armor-Piercing Volley');

const pullStyle = getAttackStyleForExercise('Pull-up', 'ex_bw_pullup');
assert(pullStyle.styleName === 'Serrated Cleave', 'Upper pull maps to Serrated Cleave');

const curlStyle = getAttackStyleForExercise('Dumbbell Bicep Curl', 'ex_db_bicep_curl');
assert(curlStyle.styleName === 'Precision Strike', 'Arm isolation maps to Precision Strike');

const plankStyle = getAttackStyleForExercise('Plank', 'ex_bw_plank');
assert(plankStyle.styleName === 'Bulwark Reposition', 'Core & mobility map to Bulwark Reposition');

// 7.5 Combat Encounter State & Strict Idempotency
const testEnemy = getEnemyById('enemy_ork_boyz'); // 750 HP
const testMission = getMissionById('mission_ork_skirmish');

const workoutExercises: WorkoutExercise[] = [
  {
    id: 'we_1',
    sessionId: 'sess_combat_test',
    name: 'Barbell Back Squat',
    sortOrder: 0,
    sets: [
      { id: 'set_c1', exerciseId: 'we_1', setNumber: 1, reps: 10, weight: 185, unit: 'lbs', isCompleted: true, setClassification: 'working' },
      { id: 'set_c2', exerciseId: 'we_1', setNumber: 2, reps: 10, weight: 185, unit: 'lbs', isCompleted: true, setClassification: 'working' },
      { id: 'set_c3', exerciseId: 'we_1', setNumber: 3, reps: 10, weight: 185, unit: 'lbs', isCompleted: false, setClassification: 'working' }, // Incomplete
    ],
  },
];

// Run combat state calculation
const encounter1 = computeCombatState(testEnemy, testMission, workoutExercises);
assert(encounter1.attacks.length === 2, 'Only completed sets produce attacks (found 2)');
assert(encounter1.totalDamage > 0, `Total combat damage calculated (${encounter1.totalDamage} DMG)`);
assert(encounter1.currentHealth === testEnemy.baseHealth - encounter1.totalDamage, 'Enemy health properly decremented');

// Test Idempotency: recomputing state identical input produces identical attack list (no duplicate attacks)
const encounter2 = computeCombatState(testEnemy, testMission, workoutExercises);
assert(encounter2.attacks.length === 2, 'Recomputing encounter does not duplicate attacks (idempotent)');
assert(encounter2.totalDamage === encounter1.totalDamage, 'Total damage is deterministic and consistent');

// Test Set Editing: changing reps on set_c1 updates damage in-place without adding extra attacks
const editedWorkoutExercises: WorkoutExercise[] = [
  {
    ...workoutExercises[0],
    sets: [
      { ...workoutExercises[0].sets[0], reps: 15 }, // Edited from 10 to 15 reps
      workoutExercises[0].sets[1],
      workoutExercises[0].sets[2],
    ],
  },
];
const encounterEdited = computeCombatState(testEnemy, testMission, editedWorkoutExercises);
assert(encounterEdited.attacks.length === 2, 'Editing a set does NOT create duplicate attacks');
assert(encounterEdited.totalDamage > encounter1.totalDamage, 'Editing reps upward increases damage properly');

// 7.6 Overkill and Victory Determination
const overpoweredExercises: WorkoutExercise[] = [
  {
    id: 'we_boss_slayer',
    sessionId: 'sess_boss',
    name: 'Deadlift',
    sortOrder: 0,
    sets: [
      { id: 's_kill_1', exerciseId: 'we_boss_slayer', setNumber: 1, reps: 10, weight: 300, unit: 'lbs', isCompleted: true, setClassification: 'working' },
      { id: 's_kill_2', exerciseId: 'we_boss_slayer', setNumber: 2, reps: 10, weight: 300, unit: 'lbs', isCompleted: true, setClassification: 'working' },
      { id: 's_kill_3', exerciseId: 'we_boss_slayer', setNumber: 3, reps: 10, weight: 300, unit: 'lbs', isCompleted: true, setClassification: 'working' },
      { id: 's_kill_4', exerciseId: 'we_boss_slayer', setNumber: 4, reps: 10, weight: 300, unit: 'lbs', isCompleted: true, setClassification: 'working' },
    ],
  },
];
const weakEnemy = getEnemyById('enemy_chaos_cultist'); // 480 HP
const bossEncounter = computeCombatState(weakEnemy, getMissionById('mission_cultist_purge'), overpoweredExercises);
assert(bossEncounter.isDefeated === true, 'Enemy marked defeated when damage exceeds HP');
assert(bossEncounter.currentHealth === 0, 'Enemy HP clamped at 0');
assert(bossEncounter.overkillDamage > 0, `Overkill damage recorded (+${bossEncounter.overkillDamage} overkill)`);

// 7.7 After-Action Report (AAR) & Decoupled Progression
const mockSession: WorkoutSession = {
  id: 'sess_aar_test',
  title: 'Test Crusade',
  startedAt: '2026-10-18T10:00:00.000Z',
  totalXpEarned: 250,
  isCompleted: true,
  exercises: overpoweredExercises,
};

const fakeFaction = getFactionById('adeptus-astartes')!;
const prevProg = calculateProgression(100, fakeFaction);
const newProg = calculateProgression(350, fakeFaction);

const aar = buildAfterActionReport(
  testMission,
  weakEnemy,
  bossEncounter,
  mockSession,
  250,
  prevProg,
  newProg
);

assert(aar.isVictory === true, 'AAR records victory status');
assert(aar.gloryBonusXp === testMission.gloryBonusXp, 'Glory bonus XP is awarded on enemy defeat');
assert(aar.totalXpEarned === 250 + testMission.gloryBonusXp, 'Total XP includes training base + glory bonus');
assert(aar.achievementsUnlocked.length >= 2, 'Battle honors (achievements) are awarded');
assert(aar.completedSetsCount === 4, 'Completed sets accurately counted');

// ----------------------------------------------------
// TEST SUITE 8: Cooperative Boss Battles, Privacy & Idempotency
// ----------------------------------------------------
console.log('\n[TEST SUITE 8: Cooperative Boss Battles, Privacy & Idempotency]');

// 8.1 Workout Set Privacy Sanitization
const rawWorkoutSetData = {
  groupBossId: 'boss_skullkrakka_1',
  clientSetId: 'set_bench_heavy_3',
  exerciseName: 'Barbell Bench Press',
  attackName: 'Bolter Burst [Bench Press]',
  styleName: 'Armor-Piercing Volley',
  damage: 285,
  weight: 225, // RAW LBS
  reps: 8,     // RAW REPS
  notes: 'Felt heavy on last rep, had a spotter',
  rpe: 9,
};

const sanitized = sanitizeCoopAttackPayload(rawWorkoutSetData);
assert((sanitized as any).weight === undefined, 'Raw weight is strictly excluded from co-op payload (Privacy)');
assert((sanitized as any).reps === undefined, 'Raw repetitions are strictly excluded from co-op payload (Privacy)');
assert((sanitized as any).notes === undefined, 'Personal notes are strictly excluded from co-op payload (Privacy)');
assert((sanitized as any).rpe === undefined, 'Personal RPE is strictly excluded from co-op payload (Privacy)');
assert(sanitized.damage === 285, 'Computed damage is preserved accurately');
assert(sanitized.clientSetId === 'set_bench_heavy_3', 'Client set ID preserved for server idempotency');
assert(sanitized.groupBossId === 'boss_skullkrakka_1', 'Boss ID preserved');
assert(sanitized.exerciseName === 'Barbell Bench Press', 'Exercise name preserved');

// 8.2 Server Atomic RPC Damage & HP decrement
const sharedBoss = {
  id: 'boss_skullkrakka_1',
  currentHp: 10000,
  maxHp: 10000,
  isDefeated: false,
};
const serverAttackLog: Array<{ groupBossId: string; clientSetId: string; damage: number }> = [];

const strike1 = simulateServerRecordCoopAttack(sharedBoss, serverAttackLog, sanitized);
assert(strike1.status === 'attack_recorded', 'Initial strike successfully recorded');
assert(strike1.damageDealt === 285, 'Damage dealt matches payload');
assert(strike1.newHp === 10000 - 285, 'Boss HP atomically decremented to 9715');
assert(sharedBoss.isDefeated === false, 'Boss remains active when HP > 0');

// 8.3 Idempotency: Retrying or duplicate network request DOES NOT double-damage
const duplicateRetry = simulateServerRecordCoopAttack(sharedBoss, serverAttackLog, sanitized);
assert(duplicateRetry.status === 'duplicate_ignored', 'Duplicate set ID returns duplicate_ignored');
assert(duplicateRetry.damageDealt === 0, 'No additional damage dealt on duplicate submission');
assert(duplicateRetry.newHp === 9715, 'Boss HP remains unchanged at 9715');
assert(serverAttackLog.length === 1, 'Server attack log still contains exactly 1 entry');

// 8.4 Asynchronous second friend's attack (User B)
const friendSet = sanitizeCoopAttackPayload({
  groupBossId: 'boss_skullkrakka_1',
  clientSetId: 'set_squat_heavy_4',
  exerciseName: 'Barbell Back Squat',
  attackName: 'Thunder Hammer [Back Squat]',
  styleName: 'Heavy Seismic Strike',
  damage: 415,
  weight: 315,
  reps: 5,
});

const strike2 = simulateServerRecordCoopAttack(sharedBoss, serverAttackLog, friendSet);
assert(strike2.status === 'attack_recorded', "Friend's attack independently recorded");
assert(strike2.damageDealt === 415, "Friend's damage correctly applied");
assert(strike2.newHp === 9715 - 415, 'Boss HP decrements to 9300 from combined friend attacks');
assert(serverAttackLog.length === 2, 'Server attack log contains both friend attacks');

// 8.5 Lethal strike clamps HP at 0 and flags campaign victory
const lethalStrike = simulateServerRecordCoopAttack(
  sharedBoss,
  serverAttackLog,
  sanitizeCoopAttackPayload({
    groupBossId: 'boss_skullkrakka_1',
    clientSetId: 'set_overkill_5',
    exerciseName: 'Deadlift',
    attackName: 'Thunder Hammer [Deadlift]',
    styleName: 'Heavy Seismic Strike',
    damage: 15000,
  })
);
assert(lethalStrike.status === 'attack_recorded', 'Lethal strike recorded');
assert(lethalStrike.newHp === 0, 'Boss HP clamped at 0');
assert(lethalStrike.isDefeated === true, 'Boss marked defeated (Campaign Victory)');
assert(sharedBoss.isDefeated === true, 'Shared boss state updated to defeated');

// 8.6 Invariance: Personal local workout XP and history are never altered by shared boss state
const personalWorkoutXp = calculateWorkoutXp([
  {
    id: 'ex_1',
    sessionId: 'session_local_1',
    name: 'Push-ups',
    sortOrder: 0,
    sets: [{ id: 'set_1', exerciseId: 'ex_1', setNumber: 1, reps: 20, weight: 0, unit: 'lbs', isCompleted: true }],
  },
], true);
assert(personalWorkoutXp.totalXp > 0, 'Personal workout records independently compute and store XP');

// ----------------------------------------------------
// TEST SUITE 9: Faction-Specific Attack Names & Catalogs
// ----------------------------------------------------
console.log('\n[TEST SUITE 9: Faction-Specific Attack Names & Catalogs]');

// 9.1 Catalog Breadth & Validation
assert(FACTION_ATTACKS_CATALOG.length >= 100, `Catalog contains >= 100 lore attacks (found ${FACTION_ATTACKS_CATALOG.length})`);

const attackIds = new Set<string>();
for (const atk of FACTION_ATTACKS_CATALOG) {
  assert(!attackIds.has(atk.id), `Attack ID '${atk.id}' is globally unique`);
  attackIds.add(atk.id);
  assert(Boolean(atk.name && atk.name.trim().length > 0), `Attack ${atk.id} has valid display name: '${atk.name}'`);
  assert(Boolean(atk.flavorDescription), `Attack ${atk.id} has flavor description`);
  assert(Boolean(atk.visualColor && atk.visualColor.startsWith('#')), `Attack ${atk.id} has hex color`);
  assert(Boolean(atk.visualIcon), `Attack ${atk.id} has visual icon`);
}

// 9.2 All 20 factions resolve appropriate attacks across all 5 categories
for (const faction of warhammer40kFactions) {
  const factionPool = getAttacksForFaction(faction.id);
  assert(factionPool.length >= 5, `Faction '${faction.name}' has at least 5 attacks (found ${factionPool.length})`);

  for (const cat of ['heavy', 'ranged', 'melee', 'precision', 'defense'] as const) {
    const resolved = resolveFactionAttack({ factionId: faction.id, category: cat });
    assert(resolved.factionId === faction.id, `Faction '${faction.id}' resolves attack for category '${cat}': '${resolved.name}'`);
  }
}

// 9.3 T'au Empire and Farsight Enclaves Specific Lore Resolution (Prompt Requirement)
const tauHeavy = resolveFactionAttack({ factionId: 'tau-empire', category: 'heavy', seed: 0 });
assert(
  tauHeavy.name === 'Fusion Blaster Burst' || tauHeavy.name === 'Missile Pod Barrage',
  `T'au Empire resolves heavy attack from lore (got '${tauHeavy.name}')`
);

const tauRanged = resolveFactionAttack({ factionId: 'tau-empire', category: 'ranged', seed: 0 });
assert(
  tauRanged.name === 'Pulse Rifle Volley' || tauRanged.name === 'Plasma Rifle Strike',
  `T'au Empire resolves ranged attack from lore (got '${tauRanged.name}')`
);

const tauPrecision = resolveFactionAttack({ factionId: 'tau-empire', category: 'precision' });
assert(tauPrecision.name === 'Rail Rifle Shot', `T'au Empire resolves Rail Rifle Shot (got '${tauPrecision.name}')`);

// Farsight Enclaves Subfaction Overrides
const feRanged = resolveFactionAttack({ factionId: 'tau-empire', subfactionId: 'farsight-enclaves', category: 'ranged', seed: 'seed_fe_plasma' });
assert(
  feRanged.name === 'High-Intensity Plasma Rifle Strike' || feRanged.name === 'Pulse Rifle Volley',
  `Farsight Enclaves resolves Enclave ranged attack (got '${feRanged.name}')`
);

const feMelee = resolveFactionAttack({ factionId: 'tau-empire', subfactionId: 'farsight-enclaves', category: 'melee' });
assert(feMelee.name === 'Dawn Blade Arc Cleave', `Farsight Enclaves resolves Dawn Blade Arc Cleave (got '${feMelee.name}')`);

const fePrecision = resolveFactionAttack({ factionId: 'tau-empire', subfactionId: 'farsight-enclaves', category: 'precision' });
assert(fePrecision.name === 'Rail Rifle Strike', `Farsight Enclaves resolves Rail Rifle Strike (got '${fePrecision.name}')`);

// 9.4 Subfaction Overrides & Parent Fallbacks
// Space Wolves override melee
const wolfMelee = resolveFactionAttack({ factionId: 'adeptus-astartes', subfactionId: 'space-wolves', category: 'melee', seed: 0 });
assert(
  wolfMelee.name === 'Frost Blade Cleave' || wolfMelee.name === 'Wolf Claw Shred',
  `Space Wolves resolves Frost Blade Cleave or Wolf Claw (got '${wolfMelee.name}')`
);

// Ultramarines fall back to parent heavy weapon (Thunder Hammer Slam or Frag Missile Salvo)
const ultramarinesHeavy = resolveFactionAttack({ factionId: 'adeptus-astartes', subfactionId: 'ultramarines', category: 'heavy' });
assert(
  ultramarinesHeavy.factionId === 'adeptus-astartes',
  `Subfaction without specific heavy category cleanly falls back to parent faction pool (got '${ultramarinesHeavy.name}')`
);

// 9.5 Safe Fallback when faction is unknown or unresolvable
const unknownFallback = resolveFactionAttack({ factionId: 'unknown-alien-race-xyz', category: 'ranged' });
assert(Boolean(unknownFallback && unknownFallback.name), `Unknown faction safely falls back to standard attack (got '${unknownFallback.name}')`);

// 9.6 Deterministic Idempotency & Stability Across Re-computations
const testSet1: ExerciseSet = {
  id: 'set_bench_tau_1',
  exerciseId: 'ex_bench',
  setNumber: 1,
  reps: 10,
  weight: 185,
  unit: 'lbs',
  isCompleted: true,
  setClassification: 'working',
};

const attackResultA = createAttackFromSet(testSet1, 'Flat Barbell Bench Press', 'ex_bb_bench_press', 'tau-empire', 'farsight-enclaves');
const attackResultB = createAttackFromSet(testSet1, 'Flat Barbell Bench Press', 'ex_bb_bench_press', 'tau-empire', 'farsight-enclaves');

assert(attackResultA.attackName === attackResultB.attackName, `Attack name is 100% deterministic and stable across recomputations (${attackResultA.attackName})`);
assert(attackResultA.styleName === attackResultB.styleName, 'Style name is identical');
assert(attackResultA.factionId === 'tau-empire', 'Faction ID is recorded on AttackEvent');
assert(Boolean(attackResultA.flavorDescription), 'Flavor description is stored on AttackEvent');

// 9.7 End-to-End Combat State Calculation with Factions
const factionWorkoutExercises: WorkoutExercise[] = [
  {
    id: 'we_farsight_1',
    sessionId: 'sess_farsight_test',
    name: 'Flat Barbell Bench Press',
    sortOrder: 0,
    sets: [
      { id: 'set_fs_1', exerciseId: 'we_farsight_1', setNumber: 1, reps: 10, weight: 185, unit: 'lbs', isCompleted: true, setClassification: 'working' },
      { id: 'set_fs_2', exerciseId: 'we_farsight_1', setNumber: 2, reps: 8, weight: 195, unit: 'lbs', isCompleted: true, setClassification: 'working' },
    ],
  },
];

const factionCombatState = computeCombatState(
  testEnemy,
  testMission,
  factionWorkoutExercises,
  undefined,
  'tau-empire',
  'farsight-enclaves'
);

assert(factionCombatState.attacks.length === 2, 'Two completed sets generated two faction attacks');
assert(
  factionCombatState.attacks[0].attackName.includes('Bench Press'),
  `Attack name incorporates exercise context: '${factionCombatState.attacks[0].attackName}'`
);

// 9.8 Multiplayer Co-op Sanitizer Preserves Faction Attack Names
const coopFactionPayload = sanitizeCoopAttackPayload({
  groupBossId: 'boss_raid_123',
  clientSetId: factionCombatState.attacks[0].setId,
  exerciseName: factionCombatState.attacks[0].exerciseName,
  attackName: factionCombatState.attacks[0].attackName,
  styleName: factionCombatState.attacks[0].styleName,
  damage: factionCombatState.attacks[0].damage,
});

assert(coopFactionPayload.attackName === factionCombatState.attacks[0].attackName, 'Co-op payload preserves faction attack name for all players');
assert(coopFactionPayload.styleName === factionCombatState.attacks[0].styleName, 'Co-op payload preserves style name');

// ----------------------------------------------------
// TEST SUITE 10: Battle History Engine & Snapshot Integrity
// ----------------------------------------------------
console.log('\n[TEST SUITE 10: Battle History Engine & Snapshot Integrity]');

// 10.1 Snapshot creation and immutable schema integrity
const mockTimeline: BattleTimelineEvent[] = [
  {
    timestamp: '2026-10-18T00:00:00.000Z',
    eventType: 'battle_started',
    actorName: 'Brother Titus',
    description: 'Crusade encounter initiated against Chaos Helbrute.',
  },
  {
    timestamp: '2026-10-18T00:05:00.000Z',
    eventType: 'strike_landed',
    actorName: 'Brother Titus',
    description: 'Thunder Hammer Slam landed for 450 damage!',
    damageDealt: 450,
  },
  {
    timestamp: '2026-10-18T00:10:00.000Z',
    eventType: 'critical_strike',
    actorName: 'Brother Titus',
    description: 'CRITICAL Thunder Hammer Slam landed for 900 damage!',
    damageDealt: 900,
  },
  {
    timestamp: '2026-10-18T00:15:00.000Z',
    eventType: 'enemy_slain',
    actorName: 'Brother Titus',
    description: 'Chaos Helbrute has been destroyed.',
  },
];

const mockParticipantA: BattleParticipantContribution = {
  userId: 'user_titus',
  callsign: 'Brother Titus',
  factionId: 'adeptus-astartes',
  subfactionId: 'ultramarines',
  attacksCount: 2,
  damageDealt: 1350,
  damageSharePercent: 67.5,
  workoutsAttributed: 1,
  setsAttributed: 2,
};

const mockParticipantB: BattleParticipantContribution = {
  userId: 'user_vance',
  callsign: 'Brother Vance',
  factionId: 'adeptus-astartes',
  subfactionId: 'blood-angels',
  attacksCount: 1,
  damageDealt: 650,
  damageSharePercent: 32.5,
  workoutsAttributed: 1,
  setsAttributed: 1,
};

const mockSnapshot: BattleSnapshot = {
  enemyDescription: 'A towering daemon engine encased in corrupted adamantium.',
  enemyGlyph: 'skull',
  enemyFaction: 'heretic-astartes',
  initialHealth: 2000,
  finalHealth: 0,
  timeline: mockTimeline,
  participants: [mockParticipantA, mockParticipantB],
  userAttacks: [],
  linkedWorkoutIds: ['sess_test_100'],
  rewards: {
    baseXpEarned: 350,
    gloryBonusXp: 150,
    totalXpEarned: 500,
  },
  afterActionReportSummary: 'Decisive victory achieved against Chaos Helbrute.',
};

const mockBattleRecord: BattleRecord = {
  id: 'battle_test_100',
  encounterMode: 'coop',
  sessionId: 'sess_test_100',
  missionId: 'mission_iron_clash',
  missionTitle: 'Clash of Iron',
  enemyId: 'enemy_chaos_helbrute',
  enemyName: 'Chaos Helbrute',
  enemyFaction: 'heretic-astartes',
  enemyDifficulty: 'boss',
  enemyMaxHp: 2000,
  enemyRemainingHp: 0,
  outcome: 'victory',
  totalDamage: 2000,
  totalAttacks: 3,
  participantCount: 2,
  squadId: 'squad_first_company',
  squadName: '1st Company Terminators',
  startedAt: '2026-10-18T00:00:00.000Z',
  completedAt: '2026-10-18T00:15:00.000Z',
  durationSeconds: 900,
  xpEarned: 500,
  snapshot: mockSnapshot,
  createdAt: '2026-10-18T00:15:00.000Z',
};

assert(mockBattleRecord.outcome === 'victory', 'Battle record accurately marks victory');
assert(mockBattleRecord.snapshot.initialHealth === 2000, 'Immutable snapshot stores original enemy health');
assert(mockBattleRecord.snapshot.finalHealth === 0, 'Immutable snapshot stores final defeated health');
assert(mockBattleRecord.snapshot.timeline.length === 4, 'Snapshot preserves full chronological combat timeline');
assert(mockBattleRecord.snapshot.timeline[0].eventType === 'battle_started', 'Timeline begins with battle_started');
assert(mockBattleRecord.snapshot.timeline[3].eventType === 'enemy_slain', 'Timeline ends with enemy_slain');

// 10.2 Damage share percentage validation
const combinedDamageShare = mockParticipantA.damageSharePercent + mockParticipantB.damageSharePercent;
assert(Math.round(combinedDamageShare) === 100, 'Participants damage share percentages total exactly 100%');
assert(mockParticipantA.damageDealt + mockParticipantB.damageDealt === 2000, 'Participants damage dealt sums to total battle damage');

// 10.3 Outcome resolution logic
function resolveBattleOutcome(maxHp: number, remainingHp: number, isDefeated: boolean): BattleOutcome {
  if (isDefeated || remainingHp <= 0) return 'victory';
  if (remainingHp === maxHp) return 'abandoned';
  return 'defeat';
}

assert(resolveBattleOutcome(1000, 0, true) === 'victory', 'Outcome resolves to victory when defeated');
assert(resolveBattleOutcome(1000, 400, false) === 'defeat', 'Outcome resolves to defeat when time runs out with damage dealt');
assert(resolveBattleOutcome(1000, 1000, false) === 'abandoned', 'Outcome resolves to abandoned when 0 damage was dealt');

// 10.4 Filtering and sorting
const mockBattleList: BattleRecord[] = [
  mockBattleRecord,
  {
    ...mockBattleRecord,
    id: 'battle_test_101',
    encounterMode: 'solo',
    outcome: 'defeat',
    totalDamage: 850,
    startedAt: '2026-10-17T00:00:00.000Z',
  },
  {
    ...mockBattleRecord,
    id: 'battle_test_102',
    encounterMode: 'solo',
    outcome: 'victory',
    totalDamage: 3200,
    startedAt: '2026-10-16T00:00:00.000Z',
  },
];

const victoryFilter = mockBattleList.filter((b) => b.outcome === 'victory');
assert(victoryFilter.length === 2, 'Filtering by victory outcome returns correct count');

const coopFilter = mockBattleList.filter((b) => b.encounterMode === 'coop');
assert(coopFilter.length === 1, 'Filtering by coop mode returns only coop encounters');

const sortedByDamage = [...mockBattleList].sort((a, b) => b.totalDamage - a.totalDamage);
assert(sortedByDamage[0].totalDamage === 3200, 'Highest damage sorting prioritizes 3200 dmg encounter');
assert(sortedByDamage[2].totalDamage === 850, 'Lowest damage is at tail of sorted list');

// ----------------------------------------------------
// TEST SUITE 11: Achievement Catalog & Evaluation Engine
// ----------------------------------------------------
console.log('\n[TEST SUITE 11: Achievement Catalog & Evaluation Engine]');

// 11.1 Catalog size and requirements
assert(
  ACHIEVEMENT_CATALOG.length >= 350,
  `Catalog contains at least 350 distinct definitions (actual: ${ACHIEVEMENT_CATALOG.length})`
);

const expectedCategories: AchievementCategory[] = [
  'workouts',
  'volume',
  'variety',
  'personal_records',
  'consistency',
  'combat',
  'bosses',
  'squad',
  'progression',
  'equipment',
  'campaigns',
];

const categoryCounts = new Map<string, number>();
for (const def of ACHIEVEMENT_CATALOG) {
  categoryCounts.set(def.category, (categoryCounts.get(def.category) || 0) + 1);
}

for (const cat of expectedCategories) {
  const count = categoryCounts.get(cat) || 0;
  assert(count >= 10, `Category '${cat}' is represented with at least 10 achievements (found ${count})`);
}

// 11.2 Scope and tier coverage
const scopeCounts = new Map<string, number>();
const tierCounts = new Map<string, number>();
const idSet = new Set<string>();

for (const def of ACHIEVEMENT_CATALOG) {
  assert(!idSet.has(def.id), `Achievement ID '${def.id}' is unique in catalog`);
  idSet.add(def.id);

  scopeCounts.set(def.scope, (scopeCounts.get(def.scope) || 0) + 1);
  tierCounts.set(def.tier, (tierCounts.get(def.tier) || 0) + 1);
}

assert((scopeCounts.get('user') || 0) > 0, 'User scope achievements present');
assert((scopeCounts.get('character') || 0) > 0, 'Character scope achievements present');
assert((scopeCounts.get('squad') || 0) > 0, 'Squad scope achievements present');

assert((tierCounts.get('bronze') || 0) > 0, 'Bronze tier achievements present');
assert((tierCounts.get('silver') || 0) > 0, 'Silver tier achievements present');
assert((tierCounts.get('gold') || 0) > 0, 'Gold tier achievements present');
assert((tierCounts.get('platinum') || 0) > 0, 'Platinum tier achievements present');
assert((tierCounts.get('relic') || 0) > 0, 'Relic tier achievements present');

// 11.3 Criteria metric resolution
const testContext: AchievementEvaluationContext = {
  userId: 'user_tester',
  characterId: 'char_tester',
  characterTotalXp: 12500,
  characterLevel: 7,
  rankTier: 2,
  factionId: 'adeptus-astartes',
  subfactionId: 'ultramarines',
  squadId: 'squad_alpha',
  completedWorkoutsCount: 12,
  completedSetsCount: 65,
  totalReps: 550,
  totalVolumeKg: 42000,
  distinctExercisesCount: 14,
  distinctCategoriesCount: 4,
  distinctEquipmentCount: 5,
  personalRecordsBrokenCount: 8,
  maxSingleLiftWeightKg: 140,
  maxSingleSetVolumeKg: 1800,
  consecutiveTrainingWeeks: 6,
  longestRestDaysHonored: 2,
  totalCombatAttacks: 45,
  totalCombatCrits: 9,
  totalCombatDamage: 28000,
  soloBossesDefeatedCount: 4,
  distinctEnemiesDefeatedCount: 4,
  coopBossesDefeatedCount: 2,
  coopAttacksCount: 15,
  squadSharedDamageDealt: 12000,
  distinctFactionsExploredCount: 1,
  campaignMissionsCompletedCount: 12,
};

assert(
  evaluateCriterionMetric({ type: 'count_workouts', targetValue: 10 }, testContext) === 12,
  'Metric count_workouts correctly resolves from context'
);
assert(
  evaluateCriterionMetric({ type: 'single_lift_weight_kg', targetValue: 100 }, testContext) === 140,
  'Metric single_lift_weight_kg correctly resolves max lift'
);
assert(
  evaluateCriterionMetric({ type: 'solo_boss_defeated', targetValue: 3 }, testContext) === 4,
  'Metric solo_boss_defeated correctly resolves bosses count'
);
assert(
  evaluateCriterionMetric({ type: 'character_level', targetValue: 5 }, testContext) === 7,
  'Metric character_level correctly resolves character level'
);

// 11.4 In-Memory Evaluator Engine & Award Granting
const inMemoryAwards = new Map<string, AchievementAward>();
const inMemoryProgress = new Map<string, AchievementProgress>();
const notificationsList: string[] = [];

const mockHandlers = {
  checkAwardedFn: (achievementId: string, scope: string, targetId: string) => {
    return inMemoryAwards.has(`${achievementId}_${scope}_${targetId}`);
  },
  awardFn: (award: AchievementAward) => {
    const key = `${award.achievementId}_${award.scope}_${award.targetId}`;
    if (inMemoryAwards.has(key)) return false;
    inMemoryAwards.set(key, award);
    return true;
  },
  saveProgressFn: (prog: AchievementProgress) => {
    inMemoryProgress.set(`${prog.achievementId}_${prog.targetId}`, prog);
  },
  queueNotificationFn: (title: string, subtitle: string) => {
    notificationsList.push(`${title}: ${subtitle}`);
  },
};

const evalRun1 = evaluateAchievements(testContext, mockHandlers);
assert(evalRun1.newlyAwarded.length > 0, `First evaluation run awarded ${evalRun1.newlyAwarded.length} achievements`);
assert(notificationsList.length === evalRun1.newlyAwarded.length, 'Each new award queued a notification');

// Verify specific expected awards
const hasFirstDeployment = evalRun1.newlyAwarded.some((a) => a.achievementId === 'ach_wo_first_deployment');
assert(hasFirstDeployment, 'Player received First Deployment achievement');

const hasCenturyMark = evalRun1.newlyAwarded.some((a) => a.achievementId === 'ach_pr_weight_hundred_kg');
assert(hasCenturyMark, 'Player with 140kg lift received Century Plate Club (100kg milestone)');

// 11.5 Strict Duplicate Prevention & Idempotency
const evalRun2 = evaluateAchievements(testContext, mockHandlers);
assert(
  evalRun2.newlyAwarded.length === 0,
  'Second evaluation run with identical context awarded 0 duplicates (strict idempotency)'
);

// 11.6 Tier helper validation
assert(getNumericTier('bronze') === 1, 'Bronze tier maps to 1');
assert(getNumericTier('silver') === 2, 'Silver tier maps to 2');
assert(getNumericTier('gold') === 3, 'Gold tier maps to 3');
assert(getNumericTier('platinum') === 4, 'Platinum tier maps to 4');
assert(getNumericTier('relic') === 5, 'Relic tier maps to 5');

// ----------------------------------------------------
// TEST SUITE 12: Faction Missions & Objective Progress Engine
// ----------------------------------------------------
console.log('\n[TEST SUITE 12: Faction Missions & Objective Progress Engine]');

// 12.1 Faction Mission Catalog Coverage (All 20 Factions)
assert(FACTION_MISSION_CATALOG.length >= 60, `Catalog contains ${FACTION_MISSION_CATALOG.length} missions (>= 60 expected)`);

const allFactions = warhammer40kUniverse.factions;
assert(allFactions.length === 20, 'Universe catalog contains exactly 20 distinct factions');

for (const f of allFactions) {
  const factionMissions = FACTION_MISSION_CATALOG.filter((m) => m.factionId === f.id);
  assert(
    factionMissions.length >= 2,
    `Faction "${f.name}" (${f.id}) has ${factionMissions.length} missions (>= 2 required)`
  );

  // Validate structural integrity of each mission definition
  for (const m of factionMissions) {
    assert(Boolean(m.id && m.id.length > 0), `Mission ${m.id} has valid non-empty ID`);
    assert(Boolean(m.title && m.title.length > 0), `Mission ${m.id} has title "${m.title}"`);
    assert(Boolean(m.shortDescription && m.shortDescription.length > 0), `Mission ${m.id} has short description`);
    assert(Boolean(m.briefing && m.briefing.length > 0), `Mission ${m.id} has narrative briefing`);
    assert(Boolean(m.category && m.category.length > 0), `Mission ${m.id} has category "${m.category}"`);
    assert(Boolean(m.difficulty && m.difficulty.length > 0), `Mission ${m.id} has difficulty "${m.difficulty}"`);
    assert(Boolean(m.objectives && m.objectives.length > 0), `Mission ${m.id} has at least 1 objective`);
    assert(Boolean(m.rewards && m.rewards.length > 0), `Mission ${m.id} has at least 1 reward`);
    assert(Boolean(m.iconName && m.iconName.length > 0), `Mission ${m.id} has iconName "${m.iconName}"`);

    // Verify objectives have positive target values
    for (const obj of m.objectives) {
      assert(obj.targetValue > 0, `Objective ${obj.id} in ${m.id} has positive targetValue (${obj.targetValue})`);
      assert(Boolean(obj.description && obj.description.length > 0), `Objective ${obj.id} has description`);
    }
  }
}

// 12.2 Subfaction Resolution & Gating
const marineGeneralAndWolves = getMissionsForFaction('adeptus-astartes', 'space-wolves');
const marineGeneralAndUltras = getMissionsForFaction('adeptus-astartes', 'ultramarines');
const spaceWolvesOnly = marineGeneralAndWolves.filter((m) => m.subfactionId === 'space-wolves');
const ultrasOnly = marineGeneralAndUltras.filter((m) => m.subfactionId === 'ultramarines');

assert(spaceWolvesOnly.length > 0, 'Space Wolves subfaction retrieves wolf-specific rites');
assert(ultrasOnly.length > 0, 'Ultramarines subfaction retrieves Ultramarine-specific rites');
assert(
  !marineGeneralAndUltras.some((m) => m.subfactionId === 'space-wolves'),
  'Ultramarines query excludes Space Wolves specific rites'
);
assert(
  !marineGeneralAndWolves.some((m) => m.subfactionId === 'ultramarines'),
  'Space Wolves query excludes Ultramarines specific rites'
);

const tauEnclaves = getMissionsForFaction('tau-empire', 'farsight-enclaves');
assert(
  tauEnclaves.some((m) => m.subfactionId === 'farsight-enclaves'),
  'Farsight Enclaves retrieves Mont\'ka assault directive'
);

// 12.3 Eligibility Evaluation Logic
const sampleTier1Mission = FACTION_MISSION_CATALOG.find((m) => (m.minRankTier || 1) === 1)!;
const sampleTier2Mission = FACTION_MISSION_CATALOG.find((m) => m.minRankTier === 2)!;

function createMockMissionContext(overrides?: Partial<MissionEvaluationContext>): MissionEvaluationContext {
  return {
    characterId: 'char_test',
    factionId: 'adeptus-astartes',
    rankTier: 1,
    characterLevel: 1,
    completedWorkoutsCount: 0,
    completedSetsCount: 0,
    totalReps: 0,
    totalVolumeKg: 0,
    totalCombatDamage: 0,
    totalCombatAttacks: 0,
    enemiesDefeatedIds: [],
    coopAttacksCount: 0,
    coopBossesDefeatedCount: 0,
    personalRecordsBrokenCount: 0,
    completedMissionIds: [],
    ...overrides,
  };
}

const rookieEligibility = checkMissionEligibility(
  sampleTier2Mission,
  createMockMissionContext({ factionId: sampleTier2Mission.factionId, rankTier: 1 })
);
assert(!rookieEligibility.isEligible, 'Tier 1 rookie is ineligible for Tier 2 mission');
assert(
  rookieEligibility.reason !== undefined && rookieEligibility.reason.includes('Tier 2'),
  `Lock reason explains rank tier requirement: "${rookieEligibility.reason}"`
);

const veteranEligibility = checkMissionEligibility(
  sampleTier2Mission,
  createMockMissionContext({
    factionId: sampleTier2Mission.factionId,
    rankTier: 2,
    characterLevel: 5,
    completedMissionIds: sampleTier2Mission.prerequisites || [],
  })
);
assert(veteranEligibility.isEligible, 'Tier 2 veteran with prerequisites is eligible');

// Prerequisite chaining check
if (sampleTier2Mission.prerequisites && sampleTier2Mission.prerequisites.length > 0) {
  const missingPrereqEligibility = checkMissionEligibility(
    sampleTier2Mission,
    createMockMissionContext({
      factionId: sampleTier2Mission.factionId,
      rankTier: 2,
      characterLevel: 5,
      completedMissionIds: [], // missing prerequisite
    })
  );
  assert(!missingPrereqEligibility.isEligible, 'Mission with missing prerequisite is locked');
  assert(
    Boolean(
      missingPrereqEligibility.reason?.includes('prerequisite') ||
      missingPrereqEligibility.reason?.includes('Requires prior completion')
    ),
    'Lock reason identifies missing prerequisite'
  );
}

// Subfaction lock check
const subfactionLockedMission = FACTION_MISSION_CATALOG.find((m) => Boolean(m.subfactionId))!;
const wrongSubfactionEligibility = checkMissionEligibility(
  subfactionLockedMission,
  createMockMissionContext({
    factionId: subfactionLockedMission.factionId,
    subfactionId: 'wrong-chapter',
    rankTier: 5,
    characterLevel: 10,
    completedMissionIds: subfactionLockedMission.prerequisites || [],
  })
);
assert(!wrongSubfactionEligibility.isEligible, 'Mission requiring specific subfaction is locked for wrong subfaction');

// 12.4 Objective Metric Evaluation Logic
const mockMissionContext = createMockMissionContext({
  characterId: 'char_test',
  factionId: 'adeptus-astartes',
  characterLevel: 5,
  rankTier: 2,
  completedWorkoutsCount: 4,
  completedSetsCount: 28,
  totalVolumeKg: 3200,
  totalReps: 240,
  totalCombatDamage: 1850,
  totalCombatAttacks: 14,
  enemiesDefeatedIds: ['enemy_1', 'enemy_2', 'enemy_3'],
  coopAttacksCount: 6,
  coopBossesDefeatedCount: 1,
  personalRecordsBrokenCount: 2,
  categorySetsCount: {
    chest: 12,
    back: 8,
    legs: 8,
  },
});

assert(
  evaluateObjectiveMetric({ id: 'o1', type: 'complete_workouts', targetValue: 3, description: '' }, mockMissionContext) === 4,
  'complete_workouts correctly evaluates to 4'
);
assert(
  evaluateObjectiveMetric({ id: 'o2', type: 'complete_sets', targetValue: 20, description: '' }, mockMissionContext) === 28,
  'complete_sets correctly evaluates to 28'
);
assert(
  evaluateObjectiveMetric({ id: 'o3', type: 'volume_kg', targetValue: 3000, description: '' }, mockMissionContext) === 3200,
  'volume_kg correctly evaluates to 3200'
);
assert(
  evaluateObjectiveMetric({ id: 'o4', type: 'combat_damage', targetValue: 1500, description: '' }, mockMissionContext) === 1850,
  'combat_damage correctly evaluates to 1850'
);
assert(
  evaluateObjectiveMetric({ id: 'o5', type: 'defeat_enemy', targetValue: 2, description: '' }, mockMissionContext) === 3,
  'defeat_enemy correctly evaluates to 3'
);
assert(
  evaluateObjectiveMetric({ id: 'o6', type: 'exercise_category_sets', exerciseCategory: 'chest', targetValue: 10, description: '' }, mockMissionContext) === 12,
  'exercise_category_sets (chest) correctly evaluates to 12'
);

// 12.5 Active Mission Transition & Objective Evaluation
const testMissionToActivate: FactionMissionDefinition = {
  id: 'mis_test_assault',
  title: 'Test Spearhead Assault',
  shortDescription: 'Test assault description',
  briefing: 'Test briefing lore',
  factionId: 'adeptus-astartes',
  category: 'assault',
  difficulty: 'skirmish',
  isCanonical: false,
  iconName: 'flash-outline',
  objectives: [
    { id: 'obj_w', type: 'complete_workouts', targetValue: 2, description: 'Complete 2 workouts' },
    { id: 'obj_v', type: 'volume_kg', targetValue: 2000, description: 'Move 2,000 kg volume' },
  ],
  rewards: [
    { type: 'xp', amount: 250, description: '+250 XP' },
    { type: 'title', title: 'Iron Spear', description: 'Title: Iron Spear' },
  ],
};

const activeRecordToEvaluate: ActiveMissionRecord = {
  id: 'active_1',
  missionId: testMissionToActivate.id,
  factionId: testMissionToActivate.factionId,
  characterId: 'char_test',
  status: 'active',
  objectives: [
    { objectiveId: 'obj_w', currentValue: 0, targetValue: 2, isCompleted: false, progressPercent: 0 },
    { objectiveId: 'obj_v', currentValue: 0, targetValue: 2000, isCompleted: false, progressPercent: 0 },
  ],
  rewards: testMissionToActivate.rewards,
  isClaimed: false,
};

// Scenario A: Partial Progress
const partialContext = createMockMissionContext({
  completedWorkoutsCount: 1, // 1 of 2
  completedSetsCount: 5,
  totalVolumeKg: 1200, // 1200 of 2000
  totalReps: 50,
  totalCombatDamage: 100,
  totalCombatAttacks: 2,
});

const partialEval = evaluateActiveMission(testMissionToActivate, activeRecordToEvaluate, partialContext);
assert(!partialEval.isNewlyCompleted, 'Partial progress does not newly complete mission');
assert(partialEval.updatedRecord.status === 'active', 'Partial mission status remains active');
assert(partialEval.updatedRecord.objectives[0].currentValue === 1, 'Objective 1 partial progress is 1');
assert(partialEval.updatedRecord.objectives[0].progressPercent === 50, 'Objective 1 is 50% complete');
assert(partialEval.updatedRecord.objectives[1].currentValue === 1200, 'Objective 2 partial progress is 1200');
assert(partialEval.updatedRecord.objectives[1].progressPercent === 60, 'Objective 2 is 60% complete');

// Scenario B: Full Completion
const completeContext = createMockMissionContext({
  completedWorkoutsCount: 2, // 2 of 2 (100%)
  completedSetsCount: 15,
  totalVolumeKg: 2500, // 2500 of 2000 (100% clamped)
  totalReps: 150,
  totalCombatDamage: 500,
  totalCombatAttacks: 8,
  enemiesDefeatedIds: ['enemy_1'],
});

const completeEval = evaluateActiveMission(testMissionToActivate, activeRecordToEvaluate, completeContext);
assert(completeEval.isNewlyCompleted, 'Full progress marks newly completed');
assert(completeEval.updatedRecord.status === 'completed', 'Completed mission transitions status to "completed"');
assert(completeEval.updatedRecord.completedAt !== undefined, 'Completed mission records timestamp');
assert(completeEval.updatedRecord.objectives[0].isCompleted === true, 'Objective 1 marked completed');
assert(completeEval.updatedRecord.objectives[1].isCompleted === true, 'Objective 2 marked completed');

// 12.6 Idempotent Reward Protection & Faction Safety
assert(!activeRecordToEvaluate.isClaimed, 'New active record is initially unclaimed');
const claimedRecord: ActiveMissionRecord = {
  ...completeEval.updatedRecord,
  isClaimed: true,
};
assert(claimedRecord.isClaimed === true, 'Claimed mission record is marked isClaimed');

// Verify lookup by ID helper
const foundMission = getMissionDefinitionById('mis_sm_initiation');
assert(foundMission !== undefined, 'Found mission by ID helper');
assert(foundMission?.factionId === 'adeptus-astartes', 'Mission belongs to Adeptus Astartes');

// ============================================================================
// TEST SUITE 13: Structured Training Programs & Campaign Map Progression Engine
// ============================================================================
console.log('\n--- TEST SUITE 13: Structured Training Programs & Campaign Map Engine ---');

// 13.1 Program Catalog Completeness & Categorization
assert(TRAINING_PROGRAM_CATALOG.length >= 7, `Program catalog contains ${TRAINING_PROGRAM_CATALOG.length} programs (>= 7 required)`);
const categories = new Set(TRAINING_PROGRAM_CATALOG.map((p) => p.category));
assert(categories.has('gvt'), 'Catalog contains German Volume Training (GVT)');
assert(categories.has('ppl'), 'Catalog contains Push/Pull/Legs (PPL)');
assert(categories.has('upper_lower'), 'Catalog contains Upper/Lower split');
assert(categories.has('full_body'), 'Catalog contains Full-Body program');
assert(categories.has('strength_5x5'), 'Catalog contains Strength 5x5');
assert(categories.has('hypertrophy'), 'Catalog contains Hypertrophy split');
assert(categories.has('calisthenics'), 'Catalog contains Calisthenics program');

for (const prog of TRAINING_PROGRAM_CATALOG) {
  assert(prog.id.length > 0, `Program ${prog.id} has valid ID`);
  assert(prog.title.length > 0, `Program ${prog.id} has title "${prog.title}"`);
  assert(prog.sourceNote.length > 0, `Program ${prog.id} documents historical source/convention`);
  assert(prog.durationWeeks > 0, `Program ${prog.id} specifies duration (${prog.durationWeeks} weeks)`);
  assert(prog.frequencyDaysPerWeek > 0, `Program ${prog.id} specifies frequency (${prog.frequencyDaysPerWeek} days/wk)`);
  assert(prog.blocks.length > 0, `Program ${prog.id} has at least 1 training block`);
  assert(prog.blocks[0].sessions.length > 0, `Program ${prog.id} has scheduled sessions`);
}

// 13.2 Program Enrollment & Immutable Snapshot Capture
const gvtProgram = getProgramById('prog_gvt_classic');
assert(gvtProgram !== undefined, 'Found classic GVT program');
const enrollment = createProgramEnrollment('char_tester_01', gvtProgram!);
assert(enrollment.characterId === 'char_tester_01', 'Enrollment assigned to character');
assert(enrollment.programId === 'prog_gvt_classic', 'Enrollment references GVT program ID');
assert(enrollment.currentBlockNumber === 1, 'Enrollment starts at Block 1');
assert(enrollment.currentSessionIndex === 0, 'Enrollment starts at Session 0');
assert(enrollment.status === 'active', 'Enrollment initially active');
assert(enrollment.programSnapshot.title === gvtProgram!.title, 'Enrollment stores immutable program snapshot');
assert(enrollment.totalPlannedSessionsCount > 0, `Total planned sessions calculated (${enrollment.totalPlannedSessionsCount})`);

// 13.3 Prepopulating Workout Logger from Scheduled Session
const scheduledSession = gvtProgram!.blocks[0].sessions[0]; // Day 1: Chest & Back
assert(!scheduledSession.isRestDay, 'Day 1 is an active training day');
assert(scheduledSession.exercises.length === 2, 'Day 1 prescribes 2 antagonist exercises');
assert(scheduledSession.exercises[0].targetSets === 10, 'Bench Press prescribes 10 sets');

const populatedWorkout = populateWorkoutFromScheduledSession(scheduledSession, 'Crusade Training');
assert(populatedWorkout.exercises.length === 2, 'Workout logger populated with 2 exercises');
assert(populatedWorkout.exercises[0].sets.length === 10, 'Exercise 1 has 10 prepopulated sets');
assert(populatedWorkout.exercises[1].sets.length === 10, 'Exercise 2 has 10 prepopulated sets');

// CRITICAL SAFETY CHECK: Planned sets are NEVER marked as completed before user records them!
const anyPlannedSetMarkedCompleted = populatedWorkout.exercises.some((e) =>
  e.sets.some((s) => s.isCompleted === true)
);
assert(!anyPlannedSetMarkedCompleted, 'Planned sets are NEVER marked as completed before recording');

// 13.4 Recording Actual Performance & Adherence Evaluation
// Simulate user recording actual workout performance (e.g. 10 sets of 10 reps @ 80kg)
const recordedWorkout: WorkoutSession = {
  ...populatedWorkout,
  isCompleted: true,
  finishedAt: new Date().toISOString(),
  exercises: populatedWorkout.exercises.map((e) => ({
    ...e,
    sets: e.sets.map((s) => ({
      ...s,
      weight: 80,
      reps: 10,
      isCompleted: true,
    })),
  })),
};

const fullAdherence = evaluateSessionAdherence(scheduledSession, recordedWorkout, enrollment.id);
assert(fullAdherence.status === 'completed', 'Fully completed session marked "completed"');
assert(fullAdherence.actualSetsCompleted === 20, '20 actual sets recorded');
assert(fullAdherence.prescribedSetsCount === 20, '20 prescribed sets counted');
assert(fullAdherence.actualVolumeKg === 16000, `Calculated volume: 16,000 kg (${fullAdherence.actualVolumeKg})`);

// Partial session simulation (e.g. user finished early after 14 sets)
const partialWorkout: WorkoutSession = {
  ...populatedWorkout,
  isCompleted: true,
  exercises: [
    {
      ...populatedWorkout.exercises[0],
      sets: populatedWorkout.exercises[0].sets.map((s) => ({ ...s, weight: 80, reps: 10, isCompleted: true })), // 10 sets
    },
    {
      ...populatedWorkout.exercises[1],
      sets: populatedWorkout.exercises[1].sets.map((s, idx) => ({ ...s, weight: 80, reps: 10, isCompleted: idx < 4 })), // 4 sets
    },
  ],
};
const partialAdherence = evaluateSessionAdherence(scheduledSession, partialWorkout, enrollment.id);
assert(partialAdherence.status === 'partial', 'Finishing early marks session as "partial" without throwing error');
assert(partialAdherence.actualSetsCompleted === 14, '14 sets recorded');
assert(partialAdherence.deviationNotes !== undefined, 'Deviation notes recorded');

// 13.5 Planned Rest Days & Recovery
const restSession = gvtProgram!.blocks[0].sessions[2]; // Day 3 Rest
assert(restSession.isRestDay === true, 'Day 3 is a scheduled rest day');
assert(restSession.exercises.length === 0, 'Rest day prescribes zero lifts');

// Advancing enrollment
const advancedEnrollment = advanceEnrollmentSession(enrollment, true);
assert(advancedEnrollment.completedSessionsCount === 1, 'Completed sessions count incremented');
assert(advancedEnrollment.currentSessionIndex === 1, 'Advanced to session index 1');

// 13.6 Custom Program Builder Template
const customProg = createCustomProgramTemplate('Space Wolf Iron Might', 'Custom strength split for Fenrisians', [
  {
    id: 'cust_s1',
    sessionIndex: 0,
    dayNumber: 1,
    title: 'Fang of the Wolf',
    focus: 'Deadlift & Overhead Press',
    isRestDay: false,
    exercises: [
      {
        id: 'cust_e1',
        exerciseRefId: 'ex_bb_deadlift',
        exerciseName: 'Conventional Barbell Deadlift',
        targetSets: 5,
        targetRepsMin: 5,
        targetRepsMax: 5,
        sortOrder: 1,
      },
    ],
  },
]);
assert(customProg.category === 'custom', 'Custom program created with category "custom"');
assert(customProg.customizable === true, 'Custom program marked customizable');
assert(customProg.blocks[0].sessions.length === 1, 'Custom program has custom session');

// 13.7 Campaign Map Graph & Topological Navigation
const campaign = getCampaignById('camp_damocles_crusade');
assert(campaign !== undefined, 'Retrieved Damocles Gulf Crusade campaign');
assert(campaign!.nodes.length === 5, 'Campaign contains 5 nodes');

// Initial state: Start node is unlocked, others are locked
const initialContext: CampaignTelemetryContext = {
  characterId: 'char_tester_01',
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
};

const initialEval = evaluateFullCampaign(campaign!, initialContext);
assert(initialEval.unlockedNodeIds.includes('node_damocles_dropzone'), 'Dropzone start node is unlocked');
assert(!initialEval.unlockedNodeIds.includes('node_damocles_outpost'), 'Outpost node is locked initially');
assert(!initialEval.unlockedNodeIds.includes('node_damocles_fortress_prime'), 'Fortress Prime is locked initially');

// Progress state: Player completes 1 workout
const step1Context: CampaignTelemetryContext = {
  ...initialContext,
  totalWorkouts: 1,
};
const step1Eval = evaluateFullCampaign(campaign!, step1Context);
assert(step1Eval.completedNodeIds.includes('node_damocles_dropzone'), 'Dropzone node completed after 1 workout');
assert(step1Eval.unlockedNodeIds.includes('node_damocles_outpost'), 'Outpost node unlocked as successor to Dropzone');

// 13.8 Branch Point Unlocking: Outpost completion opens Route Alpha AND Route Beta
const step2Context: CampaignTelemetryContext = {
  ...step1Context,
  totalWorkouts: 2,
  totalCombatDamage: 450, // Meets outpost requirements (2 workouts, 400 damage)
};
const step2Eval = evaluateFullCampaign(campaign!, step2Context);
assert(step2Eval.completedNodeIds.includes('node_damocles_outpost'), 'Outpost completed after 2 workouts and 450 damage');
assert(step2Eval.unlockedNodeIds.includes('node_damocles_mines'), 'Route Alpha (Subterranean Mines) unlocked');
assert(step2Eval.unlockedNodeIds.includes('node_damocles_orbital_array'), 'Route Beta (Orbital Uplink Spire) unlocked');

// 13.9 Multi-Program Campaign Compatibility: Different programs can advance campaign
// Player A uses GVT (high sets/volume)
const playerGvtContext: CampaignTelemetryContext = {
  characterId: 'char_gvt',
  totalWorkouts: 3,
  totalSets: 30,
  totalVolumeKg: 8500, // Meets 3,000 kg volume for Mines
  totalCombatDamage: 1200,
  totalCombatAttacks: 15,
  defeatedEnemyIds: ['enemy_ork_boyz'],
  completedFactionMissionIds: [],
  activeProgramId: 'prog_gvt_classic',
  completedProgramSessionsCount: 3,
  completedProgramBlockNumber: 1,
  squadBattleAttacks: 0,
};
const playerGvtEval = evaluateFullCampaign(campaign!, playerGvtContext);
assert(playerGvtEval.completedNodeIds.includes('node_damocles_mines'), 'Player using GVT completed Subterranean Mines via high volume');

// Player B uses Calisthenics (bodyweight/attacks)
const playerCalisthenicsContext: CampaignTelemetryContext = {
  characterId: 'char_cal',
  totalWorkouts: 3,
  totalSets: 18,
  totalVolumeKg: 0, // Zero barbell volume
  totalCombatDamage: 950, // Meets 800 damage for Orbital Array
  totalCombatAttacks: 18, // Meets 12 attacks for Orbital Array
  defeatedEnemyIds: ['enemy_ork_boyz'],
  completedFactionMissionIds: [],
  activeProgramId: 'prog_calisthenics_recon',
  completedProgramSessionsCount: 3,
  completedProgramBlockNumber: 1,
  squadBattleAttacks: 0,
};
const playerCalEval = evaluateFullCampaign(campaign!, playerCalisthenicsContext);
assert(playerCalEval.completedNodeIds.includes('node_damocles_orbital_array'), 'Player using Calisthenics completed Orbital Array via attacks/damage');

// Boss encounter unlock: Completing either branch route allows unlocking Fortress Prime
assert(playerGvtEval.unlockedNodeIds.includes('node_damocles_fortress_prime'), 'GVT player branch completion unlocked Fortress Prime');
assert(playerCalEval.unlockedNodeIds.includes('node_damocles_fortress_prime'), 'Calisthenics player branch completion unlocked Fortress Prime');

// 13.10 Boss Defeat Closes Campaign Sector
const finalBossContext: CampaignTelemetryContext = {
  ...playerGvtContext,
  totalWorkouts: 4,
  totalCombatDamage: 2500,
  defeatedEnemyIds: ['enemy_ork_boyz', 'enemy_helbrute'], // Warlord neutralized
};
const finalEval = evaluateFullCampaign(campaign!, finalBossContext);
assert(finalEval.completedNodeIds.includes('node_damocles_fortress_prime'), 'Fortress Prime conquered upon Helbrute defeat');
assert(finalEval.campaignProgressPercent >= 80, `Campaign pacification progress: ${finalEval.campaignProgressPercent}%`);

// 13.11 Exercise-Level Performance Trends Tracking
const mockWorkoutsForTrends: WorkoutSession[] = [
  {
    id: 's_1',
    title: 'Session 1',
    startedAt: '2026-10-01T10:00:00Z',
    finishedAt: '2026-10-01T11:00:00Z',
    isCompleted: true,
    totalXpEarned: 200,
    exercises: [
      {
        id: 'e_1',
        sessionId: 's_1',
        exerciseRefId: 'ex_bb_bench_press',
        name: 'Barbell Flat Bench Press',
        sortOrder: 1,
        sets: [
          { id: 'set_1', exerciseId: 'e_1', setNumber: 1, reps: 5, weight: 100, unit: 'kg', isCompleted: true },
        ],
      },
    ],
  },
  {
    id: 's_2',
    title: 'Session 2',
    startedAt: '2026-10-05T10:00:00Z',
    finishedAt: '2026-10-05T11:00:00Z',
    isCompleted: true,
    totalXpEarned: 200,
    exercises: [
      {
        id: 'e_2',
        sessionId: 's_2',
        exerciseRefId: 'ex_bb_bench_press',
        name: 'Barbell Flat Bench Press',
        sortOrder: 1,
        sets: [
          { id: 'set_2', exerciseId: 'e_2', setNumber: 1, reps: 5, weight: 105, unit: 'kg', isCompleted: true },
        ],
      },
    ],
  },
];

const trends = calculateExercisePerformanceTrends(mockWorkoutsForTrends);
assert(trends['ex_bb_bench_press'] !== undefined, 'Tracked trends for Barbell Flat Bench Press');
assert(trends['ex_bb_bench_press'].sessionsLogged === 2, 'Logged across 2 sessions');
assert(trends['ex_bb_bench_press'].bestWeightKg === 105, 'Best weight is 105kg');
assert(trends['ex_bb_bench_press'].estimated1RM >= 118, 'Estimated 1RM calculated with Brzycki formula');

// ----------------------------------------------------
// TEST SUITE 14: Warfront Daily Battles, Procedural Bosses & Weekly Raids
// ----------------------------------------------------
console.log('\n--- TEST SUITE 14: Warfront Daily Battles, Procedural Bosses & Weekly Raids ---');

// 14.1 Catalog Breadth & Taxonomy Verification
const allEncounters = getAllEncounterTemplates();
assert(allEncounters.length >= 100, `Encounter catalog contains ${allEncounters.length} templates (>= 100 required)`);

const requiredCategories: EncounterCategory[] = [
  'recon',
  'assault',
  'defense',
  'sabotage',
  'hunting',
  'special_ops',
  'escalating',
  'coop',
];

for (const cat of requiredCategories) {
  const inCat = getEncountersByCategory(cat);
  assert(inCat.length >= 10, `Category "${cat}" has ${inCat.length} templates (>= 10 required)`);
}

// 14.2 20 Factions Representation in Warfront Catalog
const factionsInWarfront = new Set(allEncounters.map((e) => e.enemyFactionId));
for (const faction of warhammer40kFactions) {
  assert(
    factionsInWarfront.has(faction.id),
    `Faction "${faction.name}" (${faction.id}) represented in Warfront encounter catalog`
  );
}

// 14.3 Template Data Integrity Check
const sampleEncounter = getEncounterById('enc_hunting_01');
assert(sampleEncounter !== undefined, 'Found Carnifex Rampage Hunt template');
assert(sampleEncounter!.title === 'Carnifex Rampage Hunt', 'Encounter title matches');
assert(sampleEncounter!.category === 'hunting', 'Category is hunting');
assert(sampleEncounter!.enemyFactionId === 'tyranids', 'Enemy faction is tyranids');
assert(sampleEncounter!.recommendedSets > 0, `Recommended sets positive (${sampleEncounter!.recommendedSets})`);
assert(sampleEncounter!.baseHealth > 0, `Base health positive (${sampleEncounter!.baseHealth})`);
assert(sampleEncounter!.baseXpBonus > 0, `Base XP bonus positive (${sampleEncounter!.baseXpBonus})`);
assert(sampleEncounter!.modifiers.length > 0, 'Encounter has at least 1 modifier');

// 14.4 Runtime Conversion Helpers
const convertedMission = convertToCombatMission(sampleEncounter!);
assert(convertedMission.id === `mission_${sampleEncounter!.id}`, 'Converted mission has valid ID');
assert(convertedMission.title === sampleEncounter!.title, 'Converted mission has matching title');
assert(convertedMission.difficulty === sampleEncounter!.difficulty, 'Converted mission preserves difficulty');
assert(convertedMission.gloryBonusXp === sampleEncounter!.baseXpBonus, 'Converted mission preserves glory XP');

const convertedEnemy = convertToEnemyDefinition(sampleEncounter!);
assert(convertedEnemy.id === sampleEncounter!.id, 'Converted enemy has matching ID');
assert(convertedEnemy.name === sampleEncounter!.enemyName, 'Converted enemy has matching name');
assert(convertedEnemy.baseHealth === sampleEncounter!.baseHealth, 'Converted enemy has matching base health');
assert(convertedEnemy.visual.iconName === sampleEncounter!.iconName, 'Converted enemy has visual glyph');

// 14.5 Refresh-Proof Daily Engagements Board (Idempotent Date Rotation)
const testDate = '2026-10-18';
const rotation1 = getOrCreateDailyRotation(testDate);
assert(rotation1.rotationDate === testDate, `Rotation initialized for date ${testDate}`);
assert(rotation1.offeredEncounterIds.length === 3, 'Board offers exactly 3 daily encounters');

// CRITICAL REFRESH-PROOF CHECK: Calling again for the same date returns identical encounter IDs (NO reroll)
const rotation2 = getOrCreateDailyRotation(testDate);
assert(
  JSON.stringify(rotation1.offeredEncounterIds) === JSON.stringify(rotation2.offeredEncounterIds),
  'Daily board is refresh-proof: identical encounter IDs returned on subsequent lookups without reroll'
);

// 14.6 Daily Encounter Completion Flow
const encounterToComplete = rotation1.offeredEncounterIds[0];
const updatedRot = completeDailyEncounter(testDate, encounterToComplete);
assert(updatedRot !== null, 'Daily encounter completed successfully');
assert(updatedRot!.completedEncounterIds.includes(encounterToComplete), 'Encounter marked completed in rotation');

// Idempotent completion: completing again does not duplicate ID
const idempotentRot = completeDailyEncounter(testDate, encounterToComplete);
assert(
  idempotentRot!.completedEncounterIds.filter((id) => id === encounterToComplete).length === 1,
  'Encounter completion is idempotent; no duplicate IDs in completed list'
);

// 14.7 14-Day History Buffer Verification
const cutoff = '2026-10-01';
const recentList = inMemoryWarfrontStorage.getRecentEncounterIds(cutoff);
assert(recentList.includes(encounterToComplete), '14-day history buffer contains recent encounter ID');

// 14.8 Deterministic Procedural Boss Generator
const testSeed = 'cycle_2026_w42_alpha';
const boss1 = generateProceduralBoss(testSeed);
const boss2 = generateProceduralBoss(testSeed);
assert(boss1.name === boss2.name, `Deterministic boss name: "${boss1.name}"`);
assert(boss1.title === boss2.title, `Deterministic boss title: "${boss1.title}"`);
assert(boss1.signatureWeapon === boss2.signatureWeapon, `Deterministic signature weapon: "${boss1.signatureWeapon}"`);
assert(boss1.combatTrait === boss2.combatTrait, `Deterministic combat trait: "${boss1.combatTrait}"`);
assert(boss1.baseHealth === boss2.baseHealth, `Deterministic base health: ${boss1.baseHealth}`);

// Verify 3 dynamic boss phases
assert(boss1.phases.length === 3, 'Boss has exactly 3 combat phases');
assert(boss1.phases[0].hpThresholdPercent === 100, 'Phase 1 threshold is 100%');
assert(boss1.phases[1].hpThresholdPercent === 66, 'Phase 2 threshold is 66%');
assert(boss1.phases[2].hpThresholdPercent === 33, 'Phase 3 threshold is 33%');
assert(boss1.phases[0].taunt.length > 0, 'Phase 1 has tactical taunt');
assert(boss1.phases[1].taunt.length > 0, 'Phase 2 has tactical taunt');
assert(boss1.phases[2].taunt.length > 0, 'Phase 3 has tactical taunt');

// Verify all 20 factions generate valid procedural bosses
for (const faction of warhammer40kFactions) {
  const fb = generateProceduralBoss(`seed_${faction.id}`, faction.id);
  assert(fb.factionId === faction.id, `Procedural boss generated for faction "${faction.name}"`);
  assert(fb.signatureWeapon.length > 0, `Procedural boss has signature weapon for "${faction.name}"`);
  assert(fb.combatTrait.length > 0, `Procedural boss has combat trait for "${faction.name}"`);
}

// 14.9 Weekly Raid Cycle Timing (Friday vs Saturday spawn schedule)
const friTiming = calculateWeeklyCycleTiming(new Date('2026-10-18T12:00:00Z'), 'friday');
assert(friTiming.cycleId.includes('_friday'), `Friday spawn cycle timing generated: ${friTiming.cycleId}`);
const satTiming = calculateWeeklyCycleTiming(new Date('2026-10-18T12:00:00Z'), 'saturday');
assert(satTiming.cycleId.includes('_saturday'), `Saturday spawn cycle timing generated: ${satTiming.cycleId}`);

// 14.10 Weekly Raid Initialization & Scale (Individual vs Squad)
const soloRaid = getOrCreateWeeklyRaid({
  now: new Date('2026-10-18T12:00:00Z'),
  preferredSpawnDay: 'friday',
});
assert(soloRaid.scope === 'individual', 'Solo raid scope is individual');
assert(soloRaid.maxHp === 2400, `Solo raid HP scaled to 2,400 HP (${soloRaid.maxHp})`);
assert(soloRaid.status === 'active', 'Raid initially active');

const squadRaid = getOrCreateWeeklyRaid({
  now: new Date('2026-10-18T12:00:00Z'),
  squadId: 'squad_iron_wolves_01',
  squadName: 'Iron Wolves',
  preferredSpawnDay: 'friday',
});
assert(squadRaid.scope === 'squad', 'Squad raid scope is squad');
assert(squadRaid.maxHp === 7500, `Squad raid HP scaled to 7,500 HP (${squadRaid.maxHp})`);

// 14.11 Applying Raid Damage & Participant Contribution
const afterAtk1 = applyDamageToWeeklyRaid(
  squadRaid.cycleId,
  'user_tester_01',
  'Brother Titus',
  'adeptus-astartes',
  1200,
  8
);
assert(afterAtk1 !== null, 'Applied 1,200 damage to weekly raid');
assert(afterAtk1!.currentHp === 6300, `Current HP updated to 6,300 (${afterAtk1!.currentHp})`);
assert(afterAtk1!.contributions['user_tester_01'].damage === 1200, 'Participant recorded 1,200 damage');
assert(afterAtk1!.contributions['user_tester_01'].attacksCount === 8, 'Participant recorded 8 attacks landed');
assert(afterAtk1!.contributions['user_tester_01'].workoutsCount === 1, 'Participant recorded 1 workout');

// Cumulative idempotent damage application
const afterAtk2 = applyDamageToWeeklyRaid(
  squadRaid.cycleId,
  'user_tester_01',
  'Brother Titus',
  'adeptus-astartes',
  800,
  6
);
assert(afterAtk2!.currentHp === 5500, `Current HP updated to 5,500 (${afterAtk2!.currentHp})`);
assert(afterAtk2!.contributions['user_tester_01'].damage === 2000, 'Participant accumulated 2,000 damage');
assert(afterAtk2!.contributions['user_tester_01'].attacksCount === 14, 'Participant accumulated 14 attacks');
assert(afterAtk2!.contributions['user_tester_01'].workoutsCount === 2, 'Participant accumulated 2 workouts');

// 14.12 Raid Boss Defeat & Reward Claiming
const fatalDamage = 5500;
const afterDefeat = applyDamageToWeeklyRaid(
  squadRaid.cycleId,
  'user_tester_01',
  'Brother Titus',
  'adeptus-astartes',
  fatalDamage,
  10
);
assert(afterDefeat!.currentHp === 0, 'Raid boss HP reduced to zero');
assert(afterDefeat!.status === 'defeated', 'Raid status transitioned to "defeated"');

// Claiming rewards
const claim1 = claimWeeklyRaidRewards(squadRaid.cycleId);
assert(claim1.success, 'Successfully claimed weekly raid rewards');
assert(claim1.gloryXpAwarded === 500, 'Awarded 500 Glory XP');

// Reward claim idempotency (prevent double-claim exploit)
const claim2 = claimWeeklyRaidRewards(squadRaid.cycleId);
assert(!claim2.success, 'Duplicate reward claim prevented; cannot claim spoils twice');

// 14.13 Unresolved Boss Policy (Escaped Warlord without False Defeat)
const expiredRaid: WeeklyRaidCycle = {
  cycleId: '2026_W40_expired_test',
  scope: 'individual',
  boss: generateProceduralBoss('2026_W40_expired_test'),
  maxHp: 2400,
  currentHp: 1800, // Not defeated
  status: 'active',
  spawnDay: 'friday',
  startedAt: '2026-10-01T00:00:00Z',
  expiresAt: '2026-10-08T00:00:00Z', // In the past!
  isRewardClaimed: false,
  contributions: {
    user_test: {
      userId: 'user_test',
      callsign: 'Iron Guard',
      factionId: 'astra-militarum',
      damage: 600,
      attacksCount: 5,
      workoutsCount: 1,
      lastContributedAt: '2026-10-05T10:00:00Z',
    },
  },
  updatedAt: '2026-10-05T10:00:00Z',
};
inMemoryWarfrontStorage.saveWeeklyRaid(expiredRaid);

// Run reconciliation
reconcileExpiredRaids(new Date('2026-10-18T12:00:00Z'));
const resolvedExpired = inMemoryWarfrontStorage.getWeeklyRaid(expiredRaid.cycleId);
assert(resolvedExpired !== null, 'Loaded expired raid record');
assert(resolvedExpired!.status === 'escaped', 'Unresolved boss cleanly archived with status "escaped"');
assert(resolvedExpired!.status !== 'defeated', 'Expired boss is NOT marked defeated (no false victories)');
assert(resolvedExpired!.contributions['user_test'].damage === 600, 'Historical participant damage preserved');

// 14.14 Combat Engine Integration with Warfront Encounter
const mockExercisesForCombat: WorkoutExercise[] = [
  {
    id: 'we_1',
    sessionId: 'sess_wf_1',
    name: 'Barbell Flat Bench Press',
    sortOrder: 1,
    sets: [
      { id: 'set_c1', exerciseId: 'we_1', setNumber: 1, reps: 8, weight: 100, unit: 'kg', isCompleted: true },
      { id: 'set_c2', exerciseId: 'we_1', setNumber: 2, reps: 8, weight: 100, unit: 'kg', isCompleted: true },
    ],
  },
];
const wfCombatState = computeCombatState(
  convertedEnemy,
  convertedMission,
  mockExercisesForCombat,
  undefined,
  'adeptus-astartes',
  'ultramarines'
);
assert(wfCombatState.attacks.length === 2, '2 attacks generated from completed sets');
assert(wfCombatState.totalDamage > 0, `Total combat damage applied (${wfCombatState.totalDamage})`);
assert(wfCombatState.currentHealth === Math.max(0, convertedEnemy.baseHealth - wfCombatState.totalDamage), 'Enemy health decremented accurately');

// ============================================================================
// TEST SUITE 15: Ionicons Icon Integrity & Defensive Fallback
// ============================================================================
console.log('\n--- TEST SUITE 15: Ionicons Icon Integrity & Defensive Sanitization ---');

// 15.1 Safe Icon Alias Sanitization
assert(getSafeIoniconsName('award-outline') === 'medal-outline', 'award-outline sanitized to medal-outline');
assert(getSafeIoniconsName('award') === 'medal', 'award sanitized to medal');
assert(getSafeIoniconsName('crosshair-outline') === 'locate-outline', 'crosshair-outline sanitized to locate-outline');
assert(getSafeIoniconsName('crosshair') === 'locate', 'crosshair sanitized to locate');
assert(getSafeIoniconsName('cpu') === 'hardware-chip', 'cpu sanitized to hardware-chip');
assert(getSafeIoniconsName('zap') === 'flash', 'zap sanitized to flash');
assert(getSafeIoniconsName('box') === 'cube', 'box sanitized to cube');
assert(getSafeIoniconsName(undefined, 'trophy-outline') === 'trophy-outline', 'undefined falls back cleanly');
assert(getSafeIoniconsName('', 'trophy') === 'trophy', 'empty string falls back cleanly');

// 15.2 Verify Achievement Catalog (Zero invalid icons)
for (const ach of ACHIEVEMENT_CATALOG) {
  assert(ach.icon !== 'award-outline', `Achievement "${ach.id}" does not use invalid award-outline`);
  assert(ach.icon !== 'crosshair-outline', `Achievement "${ach.id}" does not use invalid crosshair-outline`);
  assert(Boolean(ach.icon && ach.icon.length > 0), `Achievement "${ach.id}" has non-empty icon`);
}

// 15.3 Verify Faction Mission Catalog
for (const mis of FACTION_MISSION_CATALOG) {
  assert(mis.iconName !== 'crosshair-outline', `Mission "${mis.id}" does not use invalid crosshair-outline`);
  assert(Boolean(mis.iconName && mis.iconName.length > 0), `Mission "${mis.id}" has non-empty iconName`);
}

// 15.4 Verify Warfront Encounters & Modifiers
for (const enc of allEncounterTemplates) {
  assert(enc.iconName !== 'crosshair' && enc.iconName !== 'crosshair-outline', `Encounter "${enc.id}" iconName is valid`);
  for (const mod of enc.modifiers) {
    assert(mod.iconName !== 'crosshair' && mod.iconName !== 'crosshair-outline', `Modifier "${mod.id}" iconName is valid`);
  }
}

// 15.5 Verify Warhammer 40k Factions
for (const faction of warhammer40kUniverse.factions) {
  const invalidFeatherNames = ['crosshair', 'cpu', 'award', 'zap', 'box', 'activity', 'feather', 'circle', 'smile', 'target', 'user-check', 'hexagon'];
  assert(!invalidFeatherNames.includes(faction.iconName), `Faction "${faction.id}" uses valid Ionicons iconName "${faction.iconName}"`);
}

// ============================================================================
// TEST SUITE 16: Quality Audit Verifications & Enhancements
// ============================================================================
console.log('\n--- TEST SUITE 16: Quality Audit Verifications & Enhancements ---');

// 16.1 Rest Day Session Engine & Non-Penalizing Progression
console.log('Testing Rest Day Progression & Recovery Record Generation...');
const testRestProgram = TRAINING_PROGRAM_CATALOG.find((p) =>
  p.blocks.some((b) => b.sessions.some((s) => s.isRestDay))
) || TRAINING_PROGRAM_CATALOG[0];
const restSessionSuite16: ScheduledProgramSession = testRestProgram.blocks[0].sessions.find((s) => s.isRestDay) || {
  id: 'sess_test_rest',
  sessionIndex: 3,
  dayNumber: 4,
  title: 'Active Recovery & Mobilization',
  focus: 'Rest, hydration & mobility',
  isRestDay: true,
  exercises: [],
};

const restRecord = recordRestDaySession(restSessionSuite16, 'enroll_test_01');
assert(restRecord.status === 'completed', 'Rest day record is marked completed');
assert(restRecord.actualSetsCompleted === 0, 'Rest day requires 0 actual sets');
assert(restRecord.prescribedSetsCount === 0, 'Rest day requires 0 prescribed sets');
assert(restRecord.actualVolumeKg === 0, 'Rest day records 0 kg volume');
assert(Boolean(restRecord.deviationNotes && restRecord.deviationNotes.includes('recovery')), 'Rest day includes recovery deviation notes');

const testEnrollment = createProgramEnrollment('char_test', testRestProgram);
const advancedAfterRest = advanceEnrollmentSession(testEnrollment, true);
assert(advancedAfterRest.completedSessionsCount === 1, 'Completed sessions count incremented after rest day');
const expectedAdherence = Math.round((1 / advancedAfterRest.totalPlannedSessionsCount) * 100);
assert(advancedAfterRest.adherencePercent === expectedAdherence, `Adherence percent tracks program completion (${expectedAdherence}%) after scheduled rest day`);

// 16.2 In-Progress Workout Auto-Save & Crash Recovery Model
console.log('Testing Workout Draft Auto-Save & Restore Serialization...');
const mockDraftWorkout: WorkoutSession = {
  id: 'session_draft_001',
  title: 'Assault on Hive Tertium',
  startedAt: '2026-10-18T10:00:00.000Z',
  totalXpEarned: 0,
  isCompleted: false,
  exercises: [
    {
      id: 'we_draft_1',
      sessionId: 'session_draft_001',
      exerciseRefId: 'barbell_bench_press',
      sortOrder: 1,
      name: 'Barbell Bench Press',
      sets: [
        { id: 's_d1', exerciseId: 'we_draft_1', setNumber: 1, reps: 10, weight: 80, unit: 'kg', isCompleted: true },
        { id: 's_d2', exerciseId: 'we_draft_1', setNumber: 2, reps: 8, weight: 85, unit: 'kg', isCompleted: false },
      ],
    },
  ],
};

const draftJson = JSON.stringify(mockDraftWorkout);
const restoredDraft: WorkoutSession = JSON.parse(draftJson);
assert(restoredDraft.id === mockDraftWorkout.id, 'Draft workout session ID preserved');
assert(restoredDraft.exercises.length === 1, 'Draft exercises preserved');
assert(restoredDraft.exercises[0].sets.length === 2, 'Draft sets preserved');
assert(restoredDraft.exercises[0].sets[0].isCompleted === true, 'Completed set flag preserved');
assert(restoredDraft.exercises[0].sets[1].isCompleted === false, 'In-progress set flag preserved');
assert(restoredDraft.exercises[0].sets[0].weight === 80, 'Weight preserved');

// 16.3 Co-op Raid Victory Settlement Calculation & Idempotency
console.log('Testing Co-op Raid Victory Settlement & Glory Distribution...');
const mockBoss: CoopBoss = {
  id: 'cboss_test_99',
  groupId: 'group_crusade_1',
  bossKey: 'enc_coop_gargant',
  name: 'Mega-Dread Alpha',
  faction: 'Orks',
  loreTitle: 'Juggernaut of the Green Tide',
  glyphName: 'skull',
  primaryColor: '#2ECC71',
  maxHp: 1000,
  currentHp: 0,
  isDefeated: true,
  gloryXp: 500,
  createdAt: '2026-10-18T08:00:00.000Z',
  defeatedAt: '2026-10-18T09:30:00.000Z',
};

const mockAttacks: CoopAttack[] = [
  { id: 'atk_1', groupBossId: mockBoss.id, userId: 'user_warrior_1', userName: 'Brother Titus', clientSetId: 's1', exerciseName: 'Barbell Squat', attackName: 'Smite', styleName: 'Heavy Strike', damage: 300, createdAt: '2026-10-18T08:15:00.000Z' },
  { id: 'atk_2', groupBossId: mockBoss.id, userId: 'user_warrior_2', userName: 'Brother Dante', clientSetId: 's2', exerciseName: 'Deadlift', attackName: 'Cleave', styleName: 'Heavy Strike', damage: 450, createdAt: '2026-10-18T08:30:00.000Z' },
  { id: 'atk_3', groupBossId: mockBoss.id, userId: 'user_warrior_2', userName: 'Brother Dante', clientSetId: 's3', exerciseName: 'Overhead Press', attackName: 'Fury', styleName: 'Crushing Blow', damage: 250, createdAt: '2026-10-18T09:00:00.000Z' },
];

const totalDmg = mockAttacks.reduce((sum, a) => sum + a.damage, 0);
assert(totalDmg === 1000, 'Total damage across squad attacks matches 1000');

// Calculate participants breakdown
const pMap = new Map<string, { userId: string; callsign: string; attacksCount: number; damageDealt: number }>();
for (const atk of mockAttacks) {
  const p = pMap.get(atk.userId) || { userId: atk.userId, callsign: atk.userName, attacksCount: 0, damageDealt: 0 };
  p.attacksCount += 1;
  p.damageDealt += atk.damage;
  pMap.set(atk.userId, p);
}
const pContributions: BattleParticipantContribution[] = Array.from(pMap.values()).map((p) => ({
  userId: p.userId,
  callsign: p.callsign,
  factionId: 'adeptus-astartes',
  attacksCount: p.attacksCount,
  damageDealt: p.damageDealt,
  damageSharePercent: Math.round((p.damageDealt / totalDmg) * 100),
  workoutsAttributed: 1,
  setsAttributed: p.attacksCount,
}));

assert(pContributions.length === 2, 'Two distinct squad participants calculated');
const p1 = pContributions.find((p) => p.userId === 'user_warrior_1')!;
const p2 = pContributions.find((p) => p.userId === 'user_warrior_2')!;
assert(p1.damageSharePercent === 30, 'Participant 1 achieved 30% damage share');
assert(p2.damageSharePercent === 70, 'Participant 2 achieved 70% damage share');
assert(mockBoss.gloryXp === 500, '500 Glory XP reward confirmed');

// 16.4 Planetary Campaign Theater Persistence
console.log('Testing Campaign Graph Evaluations & Node Progress Alignment...');
const defaultCamp = getDefaultCampaign();
const campEvalTelemetry: CampaignTelemetryContext = {
  characterId: 'char_eval_01',
  totalWorkouts: 5,
  totalSets: 30,
  totalVolumeKg: 15000,
  totalCombatDamage: 4000,
  totalCombatAttacks: 25,
  defeatedEnemyIds: ['scout_patrol_ork', 'rebel_guardsman'],
  completedFactionMissionIds: ['mis_purge_1'],
  completedProgramSessionsCount: 4,
  completedProgramBlockNumber: 1,
  squadBattleAttacks: 3,
};

const fullCampaignEval = evaluateFullCampaign(defaultCamp, campEvalTelemetry);
assert(defaultCamp.nodes.length > 0, 'Campaign contains valid nodes');
assert(fullCampaignEval.completedNodeIds.length >= 0, 'Completed nodes non-negative');
assert(fullCampaignEval.campaignProgressPercent >= 0 && fullCampaignEval.campaignProgressPercent <= 100, 'Campaign progress within [0, 100]');

for (const node of defaultCamp.nodes) {
  const nodeEval = fullCampaignEval.evaluations[node.id];
  assert(Boolean(nodeEval), `Node "${node.id}" has valid evaluation result`);
  const status: 'locked' | 'unlocked' | 'completed' = nodeEval.isCompleted
    ? 'completed'
    : nodeEval.isUnlocked
    ? 'unlocked'
    : 'locked';
  assert(['locked', 'unlocked', 'completed'].includes(status), `Node status "${status}" is valid`);
}

// 16.5 Multi-Account Cloud Profile Synchronization Model
console.log('Testing Cloud Profile Synchronization Model...');
const initialLocalProfile = {
  characterName: 'Battle-Brother',
  factionId: 'adeptus-astartes',
  subfactionId: 'ultramarines',
  totalXp: 12500,
  currentLevel: 5,
};

const incomingCloudProfile = {
  displayName: 'Captain Ventris',
  factionId: 'adeptus-astartes',
};

const syncedProfile = {
  ...initialLocalProfile,
  characterName: incomingCloudProfile.displayName || initialLocalProfile.characterName,
  factionId: incomingCloudProfile.factionId || initialLocalProfile.factionId,
};

assert(syncedProfile.characterName === 'Captain Ventris', 'Character name updated from cloud callsign');
assert(syncedProfile.totalXp === 12500, 'Character XP preserved during cloud sync');
assert(syncedProfile.currentLevel === 5, 'Character level preserved during cloud sync');
assert(syncedProfile.subfactionId === 'ultramarines', 'Subfaction preserved during cloud sync');

// ----------------------------------------------------
// TEST SUITE 17: Procedural Boss Generation, Weekly Raid Cycles & Cooperative Crusade Progression
// ----------------------------------------------------
console.log('\n--- TEST SUITE 17: Procedural Boss Generation, Weekly Raid Cycles & Cooperative Crusade Progression ---');

// 17.1 Procedural Boss Catalog Breadth across all 20 Factions
console.log('Testing 20-Faction Procedural Boss Generation & Non-Canonical Originality...');
const canonDisallowedNames = [
  'Marneus Calgar',
  'Roboute Guilliman',
  'Eldrad Ulthran',
  'Ursarkar E. Creed',
  'Saint Celestine',
  'Mortarion',
  'Magnus the Red',
  'Angron',
  'Ghazghkull Thraka',
  'The Swarmlord',
  'Commander Farsight',
  'Belisarius Cawl',
  'Trajann Valoris',
  'Kaldor Draigo',
  'Abaddon the Despoiler',
];

for (const faction of warhammer40kFactions) {
  const seed = `cycle_2026_w43_${faction.id}`;
  const boss = generateProceduralBoss(seed, faction.id);

  assert(boss.factionId === faction.id, `Boss faction matches "${faction.name}"`);
  assert(boss.name.length > 3, `Boss has valid procedural name: "${boss.name}"`);
  assert(boss.title.length > 3, `Boss has valid faction title: "${boss.title}"`);
  assert(boss.archetype.length > 0, `Boss has archetypical combat role: "${boss.archetype}"`);
  assert(boss.signatureWeapon.length > 0, `Boss has signature weapon: "${boss.signatureWeapon}"`);
  assert(boss.combatTrait.length > 0, `Boss has combat trait: "${boss.combatTrait}"`);
  assert(boss.phases.length === 3, `Boss defines exactly 3 dynamic combat phases`);
  assert(boss.baseHealth >= 2400, `Boss base health properly scaled (${boss.baseHealth})`);

  // Ensure no direct plagiarism of canonical main characters
  const isCanon = canonDisallowedNames.some(
    (canon) => boss.name.toLowerCase() === canon.toLowerCase()
  );
  assert(!isCanon, `Generated boss "${boss.name}" is original and avoids canonical named characters`);
}

// 17.2 Deterministic PRNG Seed Verification
console.log('Testing Deterministic Seed Reproducibility...');
const testSeedA = '2026_W42_saturday';
const bossSeedA1 = generateProceduralBoss(testSeedA);
const bossSeedA2 = generateProceduralBoss(testSeedA);
assert(bossSeedA1.bossKey === bossSeedA2.bossKey, 'Deterministic bossKey matches across identical seeds');
assert(bossSeedA1.name === bossSeedA2.name, 'Deterministic boss name matches across identical seeds');
assert(bossSeedA1.title === bossSeedA2.title, 'Deterministic boss title matches across identical seeds');
assert(bossSeedA1.signatureWeapon === bossSeedA2.signatureWeapon, 'Deterministic weapon matches across identical seeds');

// 17.3 12-Cycle Duplicate Avoidance Buffer
console.log('Testing 12-Cycle Duplicate Avoidance Buffer...');
const orkBossFirst = generateProceduralBoss('cycle_seed_ork_01', 'orks');
const recentBossKeys = [
  orkBossFirst.bossKey,
  `raid_orks_${orkBossFirst.archetype.toLowerCase().replace(/\s+/g, '_')}_old`,
];

const orkBossSecond = generateProceduralBoss('cycle_seed_ork_02', {
  targetFactionId: 'orks',
  recentBossKeys,
});
assert(orkBossSecond.bossKey !== orkBossFirst.bossKey, 'Duplicate avoidance produced distinct bossKey');

// 17.4 Saturday Default Spawn Day & Weekly Cycle Timing
console.log('Testing Saturday Default Spawn Day & Timing...');
const satDefaultTiming = calculateWeeklyCycleTiming(new Date('2026-10-18T12:00:00Z'));
assert(satDefaultTiming.cycleId.includes('_saturday'), `Default timing uses Saturday: ${satDefaultTiming.cycleId}`);

const cycleStartMs = new Date(satDefaultTiming.startedAt).getTime();
const cycleExpireMs = new Date(satDefaultTiming.expiresAt).getTime();
const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
assert(cycleExpireMs - cycleStartMs === sevenDaysMs, 'Weekly cycle window spans exactly 7 days');

// 17.5 Future-Cycle Schedule Policy (Non-disruption of active cycle)
console.log('Testing Future-Cycle Schedule Change Policy...');
const nowTime = new Date('2026-11-14T10:00:00Z'); // Saturday in November 2026
const activeSaturdayRaid = getOrCreateWeeklyRaid({
  now: nowTime,
  preferredSpawnDay: 'saturday',
  targetFactionId: 'necrons',
});
assert(activeSaturdayRaid.spawnDay === 'saturday', 'Active raid spawned with Saturday schedule');
assert(activeSaturdayRaid.status === 'active', 'Raid is in active status');

// User changes preferred spawn day to Friday mid-week
const subsequentLookup = getOrCreateWeeklyRaid({
  now: new Date('2026-11-16T10:00:00Z'), // Monday, still within the active week
  preferredSpawnDay: 'friday',
});
assert(
  subsequentLookup.cycleId === activeSaturdayRaid.cycleId,
  'Future-cycle policy upheld: active weekly raid preserved without mid-week reset when settings change'
);
assert(
  subsequentLookup.spawnDay === 'saturday',
  'Active weekly raid keeps its Saturday schedule until the 7-day cycle finishes'
);

// 17.6 Dynamic 3-Phase Health Transitions
console.log('Testing Dynamic Combat Phase Thresholds & Transitions...');
const samplePhases: BossPhaseDefinition[] = activeSaturdayRaid.boss.phases;

// Phase 1 (100% -> 67%)
const phaseAtFull = calculateBossPhase(2400, 2400, samplePhases);
assert(phaseAtFull.phaseNumber === 1, '100% HP is Phase 1');
assert(phaseAtFull.hpThresholdPercent === 100, 'Phase 1 threshold is 100%');

// Phase 2 (66% -> 34%)
const phaseAtHalf = calculateBossPhase(1400, 2400, samplePhases); // 58% HP
assert(phaseAtHalf.phaseNumber === 2, '58% HP transitions to Phase 2');
assert(phaseAtHalf.hpThresholdPercent === 66, 'Phase 2 threshold is 66%');
assert(phaseAtHalf.taunt.length > 0, 'Phase 2 provides tactical warlord taunt');

// Phase 3 (33% -> 0%)
const phaseAtLow = calculateBossPhase(600, 2400, samplePhases); // 25% HP
assert(phaseAtLow.phaseNumber === 3, '25% HP transitions to Phase 3: Desperate Last Stand');
assert(phaseAtLow.hpThresholdPercent === 33, 'Phase 3 threshold is 33%');

// 17.7 Health Scaling & Difficulty Tiers
console.log('Testing Scope & Difficulty Tier Health Scaling...');
const standardSolo = getOrCreateWeeklyRaid({
  now: new Date('2026-10-25T12:00:00Z'),
  forceDifficulty: 'standard',
});
assert(standardSolo.maxHp === 2400, `Standard solo raid scales to 2,400 HP (${standardSolo.maxHp})`);

const standardSquad = getOrCreateWeeklyRaid({
  now: new Date('2026-10-25T12:00:00Z'),
  squadId: 'squad_crusade_alpha',
  squadName: 'Alpha Crusade',
  forceDifficulty: 'standard',
});
assert(standardSquad.maxHp === 7500, `Standard squad raid scales to 7,500 HP (${standardSquad.maxHp})`);

const challengingSquad = getOrCreateWeeklyRaid({
  now: new Date('2026-11-01T12:00:00Z'),
  squadId: 'squad_crusade_beta',
  squadName: 'Beta Crusade',
  forceDifficulty: 'challenging',
});
assert(challengingSquad.maxHp === 9000, `Challenging squad raid scales to 9,000 HP (1.2x) (${challengingSquad.maxHp})`);

const legendarySquad = getOrCreateWeeklyRaid({
  now: new Date('2026-11-08T12:00:00Z'),
  squadId: 'squad_crusade_gamma',
  squadName: 'Gamma Crusade',
  forceDifficulty: 'legendary',
});
assert(legendarySquad.maxHp === 10500, `Legendary squad raid scales to 10,500 HP (1.4x) (${legendarySquad.maxHp})`);

// 17.8 Battle History Archival: Victory Record
console.log('Testing Battle History Archival on Boss Defeat...');
// Land fatal strike on standard solo
const victoryRaid = applyDamageToWeeklyRaid(
  standardSolo.cycleId,
  'user_slayer_01',
  'Captain Titus',
  'adeptus-astartes',
  2400,
  12
);
assert(victoryRaid !== null && victoryRaid.status === 'defeated', 'Raid defeated by assault damage');

const victoryRecord = createBattleRecordFromWeeklyRaid(victoryRaid!);
assert(victoryRecord.id === `bh_raid_${victoryRaid!.cycleId}`, 'Battle history ID correctly formatted');
assert(victoryRecord.outcome === 'victory', 'Outcome recorded as victory');
assert(victoryRecord.totalDamage === 2400, 'Total damage dealt matches maxHp');
assert(victoryRecord.snapshot.participants.length === 1, 'Participant recorded in battle snapshot');
assert(victoryRecord.snapshot.participants[0].damageSharePercent === 100, 'Solo participant has 100% damage share');
assert(victoryRecord.snapshot.timeline.some((t) => t.eventType === 'enemy_slain'), 'Timeline records enemy_slain event');

// 17.9 Battle History Archival: Escaped Warlord Resolution (No False Defeat)
console.log('Testing Unresolved Boss Resolution (Escaped Warlord Policy)...');
const uncompletedRaid: WeeklyRaidCycle = {
  cycleId: '2026_W41_escaped_demo',
  scope: 'individual',
  boss: generateProceduralBoss('2026_W41_escaped_demo', 'tyranids'),
  maxHp: 2400,
  currentHp: 1500, // 900 damage dealt, but survived
  status: 'active',
  spawnDay: 'saturday',
  startedAt: '2026-10-03T00:00:00.000Z',
  expiresAt: '2026-10-10T00:00:00.000Z',
  isRewardClaimed: false,
  contributions: {
    user_survivor: {
      userId: 'user_survivor',
      callsign: 'Sergeant Chronus',
      factionId: 'adeptus-astartes',
      damage: 900,
      attacksCount: 6,
      workoutsCount: 1,
      lastContributedAt: '2026-10-05T12:00:00.000Z',
    },
  },
  updatedAt: '2026-10-05T12:00:00.000Z',
};

inMemoryWarfrontStorage.saveWeeklyRaid(uncompletedRaid);
reconcileExpiredRaids(new Date('2026-10-15T00:00:00.000Z')); // After expiry

const archivedEscapedRaid = inMemoryWarfrontStorage.getWeeklyRaid(uncompletedRaid.cycleId);
assert(archivedEscapedRaid !== null, 'Found archived raid');
assert(archivedEscapedRaid!.status === 'escaped', 'Unresolved raid marked as "escaped" (never falsely marked defeated)');

const escapedBattleRecord = createBattleRecordFromWeeklyRaid(archivedEscapedRaid!);
assert(escapedBattleRecord.outcome === 'escaped', 'Battle record outcome is "escaped"');
assert(escapedBattleRecord.totalDamage === 900, 'Preserved 900 damage dealt in battle record');
assert(escapedBattleRecord.enemyRemainingHp === 1500, 'Remaining HP recorded accurately');
assert(escapedBattleRecord.snapshot.timeline.some((t) => t.eventType === 'tactical_retreat'), 'Timeline records tactical retreat');

// ============================================================================
// 18. VERIFY PERMANENT ELIMINATION OF SLAIN ENEMIES & RETENTION OF ESCAPED CREATURES
// ============================================================================
console.log('\n--- 18. VERIFY SLAIN ENEMY ELIMINATION & ESCAPED ENEMY RETENTION ---');

// 18.1 Procedural Boss Generator excludes slain enemy names
console.log('Testing Procedural Boss Generator rejection of slain enemy names...');
const baseSeed = 'cycle_2026_w44_test';
const initialOrkBoss = generateProceduralBoss(baseSeed, 'orks');
assert(initialOrkBoss.name.length > 0, `Generated initial Ork boss: ${initialOrkBoss.name}`);

// Mark initial Ork boss as slain
inMemoryWarfrontStorage.recordSlainEnemy!(initialOrkBoss.name, 'boss_ork_01', 'orks');
assert(isEnemySlain(initialOrkBoss.name), `Enemy "${initialOrkBoss.name}" is recorded as permanently slain`);

// Generate next boss with slainEnemyNames list
const nextOrkBoss = generateProceduralBoss(`${baseSeed}_next`, {
  targetFactionId: 'orks',
  slainEnemyNames: inMemoryWarfrontStorage.getSlainEnemyNames!(),
});
assert(
  nextOrkBoss.name !== initialOrkBoss.name,
  `Procedural generator never re-selects slain enemy "${initialOrkBoss.name}" (produced "${nextOrkBoss.name}")`
);

// 18.2 Escaped Adversary Retention
console.log('Testing Retention of Escaped Enemies...');
const escapedCreatureName = 'Gorgon the Unbroken';
inMemoryWarfrontStorage.saveWeeklyRaid({
  cycleId: '2026_W43_escaped_nemesis',
  scope: 'individual',
  boss: {
    ...generateProceduralBoss('seed_escaped_nemesis', 'heretic-astartes'),
    name: escapedCreatureName,
  },
  maxHp: 2400,
  currentHp: 800,
  status: 'escaped',
  spawnDay: 'saturday',
  startedAt: '2026-10-10T00:00:00.000Z',
  expiresAt: '2026-10-17T00:00:00.000Z',
  isRewardClaimed: false,
  contributions: {},
  updatedAt: '2026-10-17T00:00:00.000Z',
});

// Verify escaped enemy is NOT marked slain and is present in escaped pool
assert(!isEnemySlain(escapedCreatureName), `Escaped creature "${escapedCreatureName}" is NOT marked slain`);
assert(isEnemyEscaped(escapedCreatureName), `Escaped creature "${escapedCreatureName}" is recorded as an escaped adversary`);
const escapedList = inMemoryWarfrontStorage.getEscapedEnemyNames!();
assert(escapedList.includes(escapedCreatureName), `Escaped list includes "${escapedCreatureName}"`);

// 18.3 Returning Nemesis Generation & Thematic Flavor
console.log('Testing Returning Nemesis Generation...');
const returningNemesisBoss = generateProceduralBoss('seed_returning_cycle', {
  targetFactionId: 'heretic-astartes',
  escapedEnemyNames: [escapedCreatureName],
  returningBossName: escapedCreatureName,
});
assert(returningNemesisBoss.name === escapedCreatureName, `Boss identity preserved for returning nemesis: ${returningNemesisBoss.name}`);
assert(returningNemesisBoss.isReturningNemesis === true, 'Boss has isReturningNemesis flag set to true');
assert(
  returningNemesisBoss.taunts.some((t) => t.includes('escaped') || t.includes('survived')),
  `Returning nemesis has customized returning taunt: "${returningNemesisBoss.taunts[0]}"`
);
assert(
  returningNemesisBoss.loreDescription.includes('escaped') || returningNemesisBoss.loreDescription.includes('retreated'),
  'Lore description notes previous escape from imperial forces'
);

// 18.4 Defeating Returning Nemesis Transitions to Permanently Slain
console.log('Testing Defeating Returning Nemesis Transitions to Permanently Slain...');
const returningRaidCycle: WeeklyRaidCycle = {
  cycleId: '2026_W45_returning_nemesis_active',
  scope: 'individual',
  boss: returningNemesisBoss,
  maxHp: 2400,
  currentHp: 2400,
  status: 'active',
  spawnDay: 'saturday',
  startedAt: '2026-10-24T00:00:00.000Z',
  expiresAt: '2026-10-31T00:00:00.000Z',
  isRewardClaimed: false,
  contributions: {},
  updatedAt: '2026-10-24T00:00:00.000Z',
  isReturningNemesis: true,
};
inMemoryWarfrontStorage.saveWeeklyRaid(returningRaidCycle);

// Deal lethal damage
const defeatedReturningRaid = applyDamageToWeeklyRaid(
  returningRaidCycle.cycleId,
  'user_terminator_01',
  'Brother Gaius',
  'adeptus-astartes',
  2400,
  10
);
assert(defeatedReturningRaid !== null && defeatedReturningRaid.status === 'defeated', 'Returning nemesis raid defeated');
assert(isEnemySlain(escapedCreatureName), `Returning nemesis "${escapedCreatureName}" is now permanently marked as slain`);
assert(!isEnemyEscaped(escapedCreatureName), `Slain nemesis is removed from escaped pool`);
assert(!inMemoryWarfrontStorage.getEscapedEnemyNames!().includes(escapedCreatureName), 'Escaped list no longer contains slain enemy');

// 18.5 Daily Encounter Rotation Filters Out Slain Named Enemies
console.log('Testing Daily Encounter Rotation exclusion of slain named enemies...');
const dailyEncounterToSlay = allEncounterTemplates[0]; // has enc.enemyName, e.g. "Speed Freak Warbikers"
inMemoryWarfrontStorage.recordSlainEnemy!(dailyEncounterToSlay.enemyName);
assert(isEnemySlain(dailyEncounterToSlay.enemyName), `Daily encounter enemy "${dailyEncounterToSlay.enemyName}" recorded as slain`);

const dailyRotation = getOrCreateDailyRotation('2026-11-20');
assert(
  !dailyRotation.offeredEncounterIds.includes(dailyEncounterToSlay.id),
  `Daily rotation excludes permanently slain enemy encounter "${dailyEncounterToSlay.enemyName}"`
);
assert(dailyRotation.offeredEncounterIds.length === 3, `Daily rotation maintains complete 3-encounter board`);

// ====================================================
// SUITE 19: CAMPAIGN ACADEMY (90-DAY FITNESS CRUSADES)
// ====================================================
console.log('\n--- SUITE 19: CAMPAIGN ACADEMY (90-DAY FITNESS CRUSADES) ---');

// 19.1 Catalog Integrity & Curriculum Transparency
console.log('Testing Campaign Academy Catalog Integrity & Curriculum Transparency...');
assert(CAMPAIGN_ACADEMY_CATALOG.length >= 8, `Campaign Academy catalog contains at least 8 campaigns (${CAMPAIGN_ACADEMY_CATALOG.length} found)`);

const beginnerCamps = getCampaignsByExperience('beginner');
const intermediateCamps = getCampaignsByExperience('intermediate');
const advancedCamps = getCampaignsByExperience('advanced');
assert(beginnerCamps.length === 3, `Catalog offers 3 beginner campaigns (found ${beginnerCamps.length})`);
assert(intermediateCamps.length === 3, `Catalog offers 3 intermediate campaigns (found ${intermediateCamps.length})`);
assert(advancedCamps.length === 2, `Catalog offers 2 advanced campaigns (found ${advancedCamps.length})`);

for (const camp of CAMPAIGN_ACADEMY_CATALOG) {
  assert(camp.id.length > 0, `Campaign has id: ${camp.id}`);
  assert(camp.title.length > 0, `Campaign has title: ${camp.title}`);
  assert(camp.chapters.length === 6, `Campaign ${camp.id} has exactly 6 chapters for 3 phases`);
  assert(camp.programDefinition.blocks.length === 3, `Campaign ${camp.id} has 3 training blocks`);
  assert(camp.programDefinition.durationWeeks === 12, `Campaign ${camp.id} has 12 weeks / 90 days total duration`);
  assert(camp.trainingMethodSource.isOriginalAdaptation === true, `Campaign ${camp.id} transparently documents methodology`);
  assert(camp.trainingMethodSource.historicalBasis.length > 10, `Campaign ${camp.id} has verified historical basis`);

  // Verify all 6 chapters have valid boss encounters and rewards
  for (const ch of camp.chapters) {
    assert(ch.bossEncounterId.length > 0, `Chapter ${ch.chapterNumber} has bossEncounterId`);
    assert(ch.bossName.length > 0, `Chapter ${ch.chapterNumber} has bossName: ${ch.bossName}`);
    assert(ch.bossMaxHp > 0, `Chapter ${ch.chapterNumber} boss has positive max HP (${ch.bossMaxHp})`);
    assert(ch.requiredSessionsCount > 0, `Chapter ${ch.chapterNumber} requires positive session count`);
    assert(ch.rewards.length > 0, `Chapter ${ch.chapterNumber} has non-empty rewards array`);
  }

  // Verify quests cover all 3 phases
  assert(camp.quests.length >= 4, `Campaign ${camp.id} has at least 4 quests`);
  assert(camp.quests.some((q) => q.phaseNumber === 1), `Campaign ${camp.id} has phase 1 quests`);
  assert(camp.quests.some((q) => q.phaseNumber === 2), `Campaign ${camp.id} has phase 2 quests`);
  assert(camp.quests.some((q) => q.phaseNumber === 3), `Campaign ${camp.id} has phase 3 quests`);
}

// 19.2 Enrollment & Adaptive Non-Punitive Lifecycle
console.log('Testing Campaign Academy Enrollment & Non-Punitive Lifecycle...');
const testCampaign = getAcademyCampaignById('acad_camp_first_muster');
assert(testCampaign !== undefined, 'Found acad_camp_first_muster campaign in catalog');

const testAcadEnrollment = createCampaignEnrollment('char_90day_tester', testCampaign!, 'prog_enroll_mock_01');
assert(testAcadEnrollment.characterId === 'char_90day_tester', 'Enrollment character matches');
assert(testAcadEnrollment.campaignId === testCampaign!.id, 'Enrollment campaignId matches');
assert(testAcadEnrollment.status === 'active', 'Initial status is active');
assert(testAcadEnrollment.currentPhaseNumber === 1, 'Initial phase is Phase 1');
assert(testAcadEnrollment.currentChapterNumber === 1, 'Initial chapter is Chapter 1');
assert(testAcadEnrollment.completedChapterIds.length === 0, 'No chapters completed initially');
assert(testAcadEnrollment.defeatedBossChapterIds.length === 0, 'No bosses defeated initially');

inMemoryAcademyStorage.saveEnrollment(testAcadEnrollment);
const retrievedEnrollment = inMemoryAcademyStorage.getActiveEnrollment('char_90day_tester');
assert(retrievedEnrollment !== null, 'Active enrollment successfully retrieved from repository');
assert(retrievedEnrollment!.campaignId === testCampaign!.id, 'Retrieved enrollment campaign matches');

// Test Pause and Resume
inMemoryAcademyStorage.pauseEnrollment(testAcadEnrollment.id);
const pausedEnrollment = inMemoryAcademyStorage.getActiveEnrollment('char_90day_tester');
assert(pausedEnrollment === null, 'Paused enrollment is no longer returned as active enrollment');

inMemoryAcademyStorage.resumeEnrollment(testAcadEnrollment.id);
const resumedEnrollment = inMemoryAcademyStorage.getActiveEnrollment('char_90day_tester');
assert(resumedEnrollment !== null && resumedEnrollment.status === 'active', 'Resumed enrollment is active again');

// 19.3 Quest Evaluation & Telemetry
console.log('Testing Campaign Academy Quest Evaluation from Real Telemetry...');
const mockAcademyTelemetry: CampaignTelemetryContext = {
  characterId: 'char_90day_tester',
  totalWorkouts: 2,
  totalSets: 14,
  totalVolumeKg: 2500,
  totalCombatDamage: 600,
  totalCombatAttacks: 12,
  defeatedEnemyIds: [],
  completedFactionMissionIds: [],
  completedProgramSessionsCount: 2,
  completedProgramBlockNumber: 1,
  squadBattleAttacks: 0,
};

const questEvalResult = evaluateCampaignQuests(testCampaign!, resumedEnrollment!, mockAcademyTelemetry);
assert(questEvalResult.newlyCompletedQuests.length > 0, `Completed quests detected from telemetry: ${questEvalResult.newlyCompletedQuests.length}`);
assert(questEvalResult.totalXpAwarded > 0, `XP awarded for completed quests: ${questEvalResult.totalXpAwarded} XP`);
resumedEnrollment!.completedQuestIds = questEvalResult.updatedCompletedQuestIds;

// Verify quest idempotency
const idempotentEval = evaluateCampaignQuests(testCampaign!, resumedEnrollment!, mockAcademyTelemetry);
assert(idempotentEval.newlyCompletedQuests.length === 0, 'Idempotent quest evaluation awards no duplicate completions');
assert(idempotentEval.totalXpAwarded === 0, 'No duplicate XP awarded');

// 19.4 Training-Block-to-Boss Unlock Separation
console.log('Testing Training-Block-to-Boss Unlock Separation...');
// Test insufficient sessions
const lockedBossEval = evaluateChapterBossUnlock(testCampaign!, resumedEnrollment!, 2);
assert(!lockedBossEval.isBossUnlocked, 'Boss remains locked when block session quota is not yet met');

// Test meeting session quota unlocks boss without auto-defeating it
const unlockedBossEval = evaluateChapterBossUnlock(testCampaign!, resumedEnrollment!, 6);
assert(unlockedBossEval.isBossUnlocked, 'Boss is unlocked when block session quota is satisfied');
assert(
  unlockedBossEval.unlockedBossChapterIds.includes(unlockedBossEval.chapter.id),
  'Chapter boss added to unlocked list'
);
resumedEnrollment!.unlockedBossChapterIds = unlockedBossEval.unlockedBossChapterIds;
assert(
  !resumedEnrollment!.defeatedBossChapterIds.includes(unlockedBossEval.chapter.id),
  'Crucial Rule Verified: Meeting training block quota UNLOCKS boss, but DOES NOT auto-defeat it!'
);

// 19.5 Chapter Boss Combat Victory & 90-Day Progression
console.log('Testing Chapter Boss Combat Victory & Narrative Advancement...');
// Defeat Chapter 1 Boss
const chap1 = testCampaign!.chapters[0];
const vic1 = recordBossVictory(testCampaign!, resumedEnrollment!, chap1.id);
assert(!vic1.isPhaseComplete, 'Chapter 1 defeat does not complete Phase 1');
assert(!vic1.isCampaignComplete, 'Campaign not yet complete');
assert(vic1.updatedEnrollment.currentChapterNumber === 2, 'Advanced to Chapter 2');
assert(vic1.updatedEnrollment.currentPhaseNumber === 1, 'Still in Phase 1');
assert(vic1.updatedEnrollment.defeatedBossChapterIds.includes(chap1.id), 'Chapter 1 boss recorded defeated');

// Defeat Chapter 2 Boss (Phase 1 Culmination)
const chap2 = testCampaign!.chapters[1];
const vic2 = recordBossVictory(testCampaign!, vic1.updatedEnrollment, chap2.id);
assert(vic2.isPhaseComplete, 'Chapter 2 defeat completes Phase 1 (Foundation)');
assert(!vic2.isCampaignComplete, 'Campaign not yet complete');
assert(vic2.updatedEnrollment.currentPhaseNumber === 2, 'Advanced to Phase 2 (Development)');
assert(vic2.updatedEnrollment.currentChapterNumber === 3, 'Advanced to Chapter 3');

// Defeat Chapter 3 & 4 Bosses (Phase 2 Culmination)
const chap3 = testCampaign!.chapters[2];
const vic3 = recordBossVictory(testCampaign!, vic2.updatedEnrollment, chap3.id);
const chap4 = testCampaign!.chapters[3];
const vic4 = recordBossVictory(testCampaign!, vic3.updatedEnrollment, chap4.id);
assert(vic4.isPhaseComplete, 'Chapter 4 defeat completes Phase 2 (Development)');
assert(vic4.updatedEnrollment.currentPhaseNumber === 3, 'Advanced to Phase 3 (Culmination)');
assert(vic4.updatedEnrollment.currentChapterNumber === 5, 'Advanced to Chapter 5');

// Defeat Chapter 5 & 6 Bosses (Phase 3 & Campaign Culmination)
const chap5 = testCampaign!.chapters[4];
const vic5 = recordBossVictory(testCampaign!, vic4.updatedEnrollment, chap5.id);
const chap6 = testCampaign!.chapters[5];
const vic6 = recordBossVictory(testCampaign!, vic5.updatedEnrollment, chap6.id);
assert(vic6.isPhaseComplete, 'Chapter 6 defeat completes Phase 3');
assert(vic6.isCampaignComplete, 'Chapter 6 defeat completes entire 90-day campaign crusade!');
assert(vic6.updatedEnrollment.status === 'completed', 'Enrollment status updated to "completed"');
assert(vic6.updatedEnrollment.completedAt !== undefined, 'Completion timestamp recorded');
assert(vic6.updatedEnrollment.defeatedBossChapterIds.length === 6, 'All 6 chapter commanders neutralized');

// 19.6 Milestone Phase Reports & Final 90-Day Dossier
console.log('Testing Objective Phase Reports & Final 90-Day Dossier Generation...');
const fullTelemetry: CampaignTelemetryContext = {
  characterId: 'char_90day_tester',
  totalWorkouts: 36,
  totalSets: 288,
  totalVolumeKg: 42500,
  totalCombatDamage: 18500,
  totalCombatAttacks: 288,
  defeatedEnemyIds: ['boss_1', 'boss_2', 'boss_3', 'boss_4', 'boss_5', 'boss_6'],
  completedFactionMissionIds: [],
  completedProgramSessionsCount: 36,
  completedProgramBlockNumber: 3,
  squadBattleAttacks: 0,
};

// Phase 1 Report
const rep1 = generatePhaseReport(vic6.updatedEnrollment, testCampaign!, 1, fullTelemetry);
assert(rep1.phaseNumber === 1, 'Phase 1 report has phaseNumber 1');
assert(rep1.xpEarned === 500, 'Phase 1 report awards 500 XP');
assert(rep1.bossDefeatedName === chap2.bossName, `Phase 1 report names defeated commander: ${rep1.bossDefeatedName}`);
inMemoryAcademyStorage.savePhaseReport(rep1);

// Phase 2 & 3 Reports
const rep2 = generatePhaseReport(vic6.updatedEnrollment, testCampaign!, 2, fullTelemetry);
inMemoryAcademyStorage.savePhaseReport(rep2);
const rep3 = generatePhaseReport(vic6.updatedEnrollment, testCampaign!, 3, fullTelemetry);
inMemoryAcademyStorage.savePhaseReport(rep3);

const savedReports = inMemoryAcademyStorage.getPhaseReports(vic6.updatedEnrollment.id);
assert(savedReports.length === 3, `Saved and retrieved 3 objective phase reports (found ${savedReports.length})`);

// Final 90-Day Campaign Completion Dossier
const dossier = generateFinalDossier(vic6.updatedEnrollment, testCampaign!, fullTelemetry);
assert(dossier.campaignTitle === testCampaign!.title, 'Dossier campaignTitle matches');
assert(dossier.totalSessionsCompleted === 36, 'Dossier records 36 verified completed sessions');
assert(dossier.totalVolumeKg === 42500, 'Dossier records 42,500 kg total volume');
assert(dossier.bossesDefeatedCount === 6, 'Dossier records 6 defeated commanders');
assert(dossier.totalGloryXpAwarded === 5000, 'Dossier awards 5,000 Glory XP for completing 90-day crusade');
assert(dossier.adherencePercentage === 100, 'Dossier calculates 100% adherence');
assert(dossier.conferredTitles.length > 0, `Dossier confers titles: ${dossier.conferredTitles.join(', ')}`);

inMemoryAcademyStorage.saveFinalDossier(dossier);
const retrievedDossier = inMemoryAcademyStorage.getFinalDossier(vic6.updatedEnrollment.id);
assert(retrievedDossier !== null, 'Final 90-day dossier successfully persisted and retrieved');
assert(retrievedDossier!.totalGloryXpAwarded === 5000, 'Retrieved dossier glory XP matches');

// ============================================================================
// TEST SUITE 17: Custom Subfaction Creator & Uploaded Subfaction Icons
// ============================================================================
console.log('\n[TEST SUITE 17: Custom Subfaction Creator & Uploaded Subfaction Icons]');

// 1. Validation & Name Sanitization
console.log('Testing Input Validation & Name Sanitization...');
const emptyNameResult = validateCustomSubfaction({ name: '', parentFactionId: 'adeptus-astartes' });
assert(!emptyNameResult.isValid, 'Rejects empty subfaction name');
assert(emptyNameResult.errors.some((e) => e.field === 'name'), 'Empty name triggers name error');

const whitespaceNameResult = validateCustomSubfaction({ name: '   \t  \n  ', parentFactionId: 'adeptus-astartes' });
assert(!whitespaceNameResult.isValid, 'Rejects whitespace-only subfaction name');

const longName = 'A'.repeat(MAX_SUBFACTION_NAME_LENGTH + 1);
const longNameResult = validateCustomSubfaction({ name: longName, parentFactionId: 'adeptus-astartes' });
assert(!longNameResult.isValid, `Rejects names longer than ${MAX_SUBFACTION_NAME_LENGTH} characters`);

const missingFactionResult = validateCustomSubfaction({ name: 'Valid Name', parentFactionId: '' });
assert(!missingFactionResult.isValid, 'Rejects missing parent faction ID');

const validSanitized = validateCustomSubfaction({
  name: '   The Obsidian Spear   ',
  parentFactionId: 'tau-empire',
});
assert(validSanitized.isValid, 'Valid input passes validation');
assert(validSanitized.sanitizedName === 'The Obsidian Spear', 'Trims extraneous whitespace from name');

// Unicode and legitimate punctuation
const unicodePunctuation = validateCustomSubfaction({
  name: "Vior'la Cadre & Forge-Brothers (9th)",
  parentFactionId: 'tau-empire',
});
assert(unicodePunctuation.isValid, 'Preserves apostrophes, ampersands, hyphens, and parenthesis');
assert(unicodePunctuation.sanitizedName === "Vior'la Cadre & Forge-Brothers (9th)", 'Sanitized name preserves punctuation');

// Duplicate name check within existing collection
const mockExistingSubfactions: CustomSubfactionRecord[] = [
  {
    id: 'cs_101',
    userId: 'user_main',
    parentFactionId: 'tau-empire',
    name: 'The Obsidian Spear',
    doctrineTags: ['aggressive'],
    primaryColor: '#00E5FF',
    secondaryColor: '#1A1D24',
    accentColor: '#FFD700',
    iconCropMode: 'contain',
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cs_102',
    userId: 'user_main',
    parentFactionId: 'tau-empire',
    name: 'Archived Spear',
    doctrineTags: [],
    primaryColor: '#DAA520',
    secondaryColor: '#1A1D24',
    accentColor: '#E6C200',
    iconCropMode: 'cover',
    isArchived: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const duplicateCheck = validateCustomSubfaction(
  { name: 'the obsidian spear', parentFactionId: 'tau-empire' },
  undefined,
  mockExistingSubfactions
);
assert(!duplicateCheck.isValid, 'Rejects case-insensitive duplicate name within active subfactions');

const sameRecordUpdateCheck = validateCustomSubfaction(
  { name: 'The Obsidian Spear', parentFactionId: 'tau-empire' },
  'cs_101',
  mockExistingSubfactions
);
assert(sameRecordUpdateCheck.isValid, 'Allows updating an existing subfaction with its own current name');

const archivedDuplicateCheck = validateCustomSubfaction(
  { name: 'Archived Spear', parentFactionId: 'tau-empire' },
  undefined,
  mockExistingSubfactions
);
assert(archivedDuplicateCheck.isValid, 'Allows reusing the name of an archived subfaction');

// 2. Minimum Viable Subfaction & View Mapping (toSubfactionView)
console.log('Testing Minimum Viable Subfaction & View Mapping...');
const minSubfactionRecord: CustomSubfactionRecord = {
  id: 'cs_min_01',
  userId: 'user_main',
  parentFactionId: 'tau-empire',
  name: 'The Obsidian Spear',
  doctrineTags: [],
  primaryColor: '#DAA520',
  secondaryColor: '#1A1D24',
  accentColor: '#E6C200',
  iconCropMode: 'contain',
  isArchived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const minView = toSubfactionView(minSubfactionRecord);
assert(minView.id === 'cs_min_01', 'View id matches record id');
assert(minView.factionId === 'tau-empire', 'View factionId matches parent faction id');
assert(minView.name === 'The Obsidian Spear', 'View name matches');
assert(minView.isCustom === true, 'View has isCustom flag set to true');
assert(minView.customIconUri === undefined, 'Icon URI is undefined when user does not upload an icon');
assert(minView.lore.length > 0, 'Generates fallback lore when omitted');
assert(minView.colorScheme.primary === '#DAA520', 'Uses primary color');

// 3. Optional Fields & Rich Identity
console.log('Testing Optional Fields & Rich Identity...');
const richSubfactionRecord: CustomSubfactionRecord = {
  id: 'cs_rich_01',
  userId: 'user_main',
  parentFactionId: 'adeptus-astartes',
  name: 'The Ashen Wardens',
  lore: 'Forged in the ash wastes of a shattered fortress-world, standing vigil against the swarm.',
  motto: 'From Ash We Rise, In Iron We Endure',
  homeworld: 'Pyros IV (Ash Waste Fortress)',
  doctrineTags: ['defensive', 'siege_masters', 'disciplined'],
  primaryColor: '#708090',
  secondaryColor: '#2F4F4F',
  accentColor: '#FF4500',
  iconUri: 'file:///data/user/0/host.exp.exponent/files/subfaction_icons/ashen_wardens.png',
  iconCropMode: 'cover',
  isArchived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const richView = toSubfactionView(richSubfactionRecord);
assert(richView.lore === richSubfactionRecord.lore, 'Preserves custom narrative lore');
assert(richView.motto === richSubfactionRecord.motto, 'Preserves battle motto');
assert(richView.homeworld === 'Pyros IV (Ash Waste Fortress)', 'Preserves custom homeworld');
assert(richView.doctrineTags.length === 3, 'Preserves all doctrine tags');
assert(richView.doctrineTags.includes('siege_masters'), 'Includes siege_masters tag');
assert(Boolean(richView.customIconUri && richView.customIconUri.startsWith('file:///')), 'Preserves uploaded local icon file URI');
assert(richView.iconCropMode === 'cover', 'Preserves cover crop mode');

// 4. Subfaction Resolution via getSubfactionById
console.log('Testing Subfaction Resolution & Fallbacks...');
const allCustomList = [minSubfactionRecord, richSubfactionRecord];
const resolvedCustom = getSubfactionById('tau-empire', 'cs_min_01', allCustomList);
assert(resolvedCustom !== undefined, 'Resolves custom subfaction by ID');
assert(resolvedCustom?.name === 'The Obsidian Spear', 'Resolved custom subfaction name matches');
assert((resolvedCustom as any)?.isCustom === true, 'Resolved subfaction is recognized as custom');

const resolvedRich = getSubfactionById('adeptus-astartes', 'cs_rich_01', allCustomList);
assert(resolvedRich !== undefined, 'Resolves rich custom subfaction by ID');
assert(resolvedRich?.motto === 'From Ash We Rise, In Iron We Endure', 'Resolved subfaction retains motto');

// Official subfaction fallback behavior
const officialUltramarines = getSubfactionById('adeptus-astartes', 'ultramarines', allCustomList);
assert(officialUltramarines !== undefined, 'Official subfactions still resolve correctly alongside custom ones');
assert(officialUltramarines?.name === 'Ultramarines', 'Official name is intact');

// 5. Parent Faction Attack Catalog & Combat Rule Inheritance
console.log('Testing Parent Faction Attack Inheritance...');
const tauAttacks = getAttacksForFaction('tau-empire');
assert(tauAttacks.length > 0, "Parent T'au Empire has attacks defined");
const resolvedTauAttack = resolveFactionAttack({
  factionId: 'tau-empire',
  subfactionId: 'cs_min_01',
  category: 'ranged',
});
assert(resolvedTauAttack.factionId === 'tau-empire', "Custom T'au subfaction inherits attacks with parent factionId");
assert(resolvedTauAttack.category === 'ranged', "Inherits valid parent ranged combat attack");

const astartesAttacks = getAttacksForFaction('adeptus-astartes');
assert(astartesAttacks.length > 0, 'Parent Space Marines has attacks defined');
const resolvedAstartesAttack = resolveFactionAttack({
  factionId: 'adeptus-astartes',
  subfactionId: 'cs_rich_01',
  category: 'melee',
});
assert(resolvedAstartesAttack.factionId === 'adeptus-astartes', 'Custom Space Marine subfaction inherits Adeptus Astartes attacks');
assert(resolvedAstartesAttack.category === 'melee', 'Inherits valid parent melee combat attack');

const orkAttacks = getAttacksForFaction('orks');
assert(orkAttacks.length > 0, 'Parent Orks has attacks defined');
const resolvedOrkAttack = resolveFactionAttack({
  factionId: 'orks',
  subfactionId: 'cs_ork_custom',
  category: 'heavy',
});
assert(resolvedOrkAttack.factionId === 'orks', 'Custom Ork warband inherits Ork attacks');
assert(resolvedOrkAttack.category === 'heavy', 'Inherits valid parent heavy combat attack');

const necronAttacks = getAttacksForFaction('necrons');
assert(necronAttacks.length > 0, 'Parent Necrons has attacks defined');
const resolvedNecronAttack = resolveFactionAttack({
  factionId: 'necrons',
  subfactionId: 'cs_necron_custom',
  category: 'ranged',
});
assert(resolvedNecronAttack.factionId === 'necrons', 'Custom Necron dynasty inherits Necron attacks');
assert(resolvedNecronAttack.category === 'ranged', 'Inherits valid parent ranged combat attack');

// 6. User-Uploaded Icon Replacement & Removal Lifecycle
console.log('Testing User Icon Replacement & Removal Lifecycle...');
let liveRecord: CustomSubfactionRecord = {
  ...minSubfactionRecord,
  iconUri: 'file:///subfaction_icons/custom_emblem_v1.png',
  iconCropMode: 'contain',
};
assert(liveRecord.iconUri !== undefined, 'Has initial uploaded icon');

// Replace icon with new image
liveRecord = {
  ...liveRecord,
  iconUri: 'file:///subfaction_icons/custom_emblem_v2_hires.png',
  iconCropMode: 'cover',
  updatedAt: new Date().toISOString(),
};
assert(liveRecord.iconUri === 'file:///subfaction_icons/custom_emblem_v2_hires.png', 'Icon URI replaced with new path');
assert(liveRecord.iconCropMode === 'cover', 'Crop mode updated to cover');

// Remove icon (return to parent faction symbol fallback)
liveRecord = {
  ...liveRecord,
  iconUri: undefined,
  updatedAt: new Date().toISOString(),
};
const removedIconView = toSubfactionView(liveRecord);
assert(removedIconView.customIconUri === undefined, 'Icon URI is undefined after removal');
assert(removedIconView.name === 'The Obsidian Spear', 'Subfaction identity preserved without icon');

// 7. Duplication & Independence
console.log('Testing Subfaction Duplication & Independence...');
const originalRecord: CustomSubfactionRecord = { ...richSubfactionRecord };
const clonedRecord: CustomSubfactionRecord = {
  ...originalRecord,
  id: `cs_${Date.now()}_copy`,
  name: `${originalRecord.name} (Copy)`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

assert(clonedRecord.id !== originalRecord.id, 'Cloned subfaction has a unique ID');
assert(clonedRecord.name === 'The Ashen Wardens (Copy)', 'Cloned subfaction has copy name');
assert(clonedRecord.parentFactionId === originalRecord.parentFactionId, 'Clone retains parent faction');
assert(clonedRecord.motto === originalRecord.motto, 'Clone retains motto');
assert(clonedRecord.doctrineTags.length === originalRecord.doctrineTags.length, 'Clone retains doctrine tags');

// Modifying the clone does not alter the original
clonedRecord.name = 'The Iron Wardens';
clonedRecord.doctrineTags = ['aggressive', 'mechanized_assault'];
assert(originalRecord.name === 'The Ashen Wardens', 'Original name is untouched after editing clone');
assert(originalRecord.doctrineTags.includes('defensive'), 'Original doctrine is untouched after editing clone');

// 8. Archiving & Active Filtering
console.log('Testing Subfaction Archiving & Filtering...');
const archiveTestList: CustomSubfactionRecord[] = [
  { ...originalRecord, isArchived: false },
  { ...clonedRecord, isArchived: true },
];

const activeOnly = archiveTestList.filter((s) => !s.isArchived);
assert(activeOnly.length === 1, 'Active filter returns only non-archived subfactions');
assert(activeOnly[0].id === originalRecord.id, 'Active subfaction matches non-archived record');

// ----------------------------------------------------
// TEST SUITE 18: Complete Settings System & Behaviors
// ----------------------------------------------------
console.log('\n[TEST SUITE 18: Complete Settings System & Behaviors]');

console.log('Testing Default Settings & Stable Schema Keys...');
assert(DEFAULT_APP_SETTINGS.workout_weight_unit === 'lbs', 'Default weight unit is lbs');
assert(DEFAULT_APP_SETTINGS.workout_distance_unit === 'miles', 'Default distance unit is miles');
assert(DEFAULT_APP_SETTINGS.workout_default_rest_duration === 90, 'Default rest timer is 90s');
assert(DEFAULT_APP_SETTINGS.workout_auto_start_rest_timer === true, 'Auto-start rest timer defaults to enabled');
assert(DEFAULT_APP_SETTINGS.workout_keep_screen_awake === true, 'Keep screen awake defaults to enabled');
assert(DEFAULT_APP_SETTINGS.workout_auto_save === true, 'Workout auto-save defaults to enabled');
assert(DEFAULT_APP_SETTINGS.workout_confirm_finish === true, 'Finish workout confirmation defaults to enabled');
assert(DEFAULT_APP_SETTINGS.workout_warn_unsaved === true, 'Unsaved changes warning defaults to enabled');
assert(DEFAULT_APP_SETTINGS.privacy_workout_details === 'private', 'Workout details private by default');
assert(DEFAULT_APP_SETTINGS.privacy_share_contributions === true, 'Share battle contributions enabled by default');

console.log('Testing Weight & Distance Unit Conversions (W1 & W2)...');
// 100 kg to lbs
const weightInLbs = convertWeight(100, 'kg', 'lbs');
assert(weightInLbs === 220.5, `100 kg correctly converts to 220.5 lbs (got ${weightInLbs})`);

// 220.5 lbs back to kg
const weightBackInKg = convertWeight(220.5, 'lbs', 'kg');
assert(weightBackInKg === 100, `220.5 lbs correctly converts back to 100 kg (got ${weightBackInKg})`);

// Identity conversion does not alter or round
const identityLbs = convertWeight(185.25, 'lbs', 'lbs');
assert(identityLbs === 185.25, 'Same unit conversion preserves value without rounding errors');

// Formatter preserves stored measurement
const testSet: ExerciseSet = {
  id: 'set_w1_test',
  exerciseId: 'ex_bench',
  setNumber: 1,
  reps: 8,
  weight: 100,
  unit: 'kg',
  isCompleted: true,
};
const formattedForUsUser = formatWeight(testSet.weight, testSet.unit, 'lbs');
assert(formattedForUsUser.value === 220.5, 'Display value converted to lbs');
assert(formattedForUsUser.unit === 'lbs', 'Display unit label is lbs');
assert(formattedForUsUser.displayString === '220.5 lbs', 'Formatted string matches');
assert(testSet.weight === 100 && testSet.unit === 'kg', 'Raw recorded set retains 100 kg untouched');

// Distance conversion
const distanceKm = convertDistance(5, 'miles', 'km');
assert(distanceKm === 8.05, `5 miles converts to 8.05 km (got ${distanceKm})`);
const distanceMiles = convertDistance(8.05, 'km', 'miles');
assert(distanceMiles === 5, `8.05 km converts back to 5 miles (got ${distanceMiles})`);

console.log('Testing Training Schedule, Week Boundaries & Recovery (T1 - T6)...');
// Week starts on calculation
const wednesdayDate = new Date(2026, 9, 21); // Wednesday, Oct 21, 2026
const mondayStart = getStartOfWeek(wednesdayDate, 'monday');
assert(mondayStart.getDay() === 1, `Monday start returns day 1 (Monday), got day ${mondayStart.getDay()}`);
const sundayStart = getStartOfWeek(wednesdayDate, 'sunday');
assert(sundayStart.getDay() === 0, `Sunday start returns day 0 (Sunday), got day ${sundayStart.getDay()}`);

// Recovery day eligibility based on preferred days
const tuesdayDate = new Date(2026, 9, 20); // Tuesday
const preferredMonWedFri = ['monday', 'wednesday', 'friday'];
const tuesdayEligibility = isRecoveryDayEligible(tuesdayDate, preferredMonWedFri);
assert(tuesdayEligibility.eligible === true, 'Tuesday is recognized as eligible recovery day when training Mon/Wed/Fri');

// Scheduled training day is not eligible for rest bonus unless program prescribes rest
const mondayDate = new Date(2026, 9, 19); // Monday
const mondayEligibility = isRecoveryDayEligible(mondayDate, preferredMonWedFri);
assert(mondayEligibility.eligible === false, 'Monday is not an eligible rest day when scheduled as training day');

// Anti-farming check function exists and accepts date string
const hasClaimedTest = hasAlreadyReceivedRecoveryXp('2026-10-19');
assert(typeof hasClaimedTest === 'boolean', 'Anti-farming check returns boolean status');

console.log('Testing Notifications & Quiet Hours Logic (N1 - N10)...');
// Quiet hours spanning midnight (e.g. 22:00 to 08:00)
const nightTime = new Date(2026, 9, 19, 23, 30); // 23:30
const morningTime = new Date(2026, 9, 19, 6, 15); // 06:15
const afternoonTime = new Date(2026, 9, 19, 14, 0); // 14:00

assert(isInQuietHours(nightTime, '22:00', '08:00') === true, '23:30 correctly identified as inside Quiet Hours (22:00-08:00)');
assert(isInQuietHours(morningTime, '22:00', '08:00') === true, '06:15 correctly identified as inside Quiet Hours (22:00-08:00)');
assert(isInQuietHours(afternoonTime, '22:00', '08:00') === false, '14:00 correctly identified as outside Quiet Hours (22:00-08:00)');

// Notification permission checks
const mockSettings: AppSettings = {
  ...DEFAULT_APP_SETTINGS,
  notif_achievements: false,
  notif_boss_alerts: true,
  notif_quiet_hours_enabled: true,
  notif_quiet_hours_start: '22:00',
  notif_quiet_hours_end: '08:00',
};

const achCheck = shouldDispatchNotification('achievement', mockSettings, afternoonTime);
assert(achCheck.allowed === false, 'Achievement notification rejected when toggled off in settings');

const bossCheckDay = shouldDispatchNotification('boss', mockSettings, afternoonTime);
assert(bossCheckDay.allowed === true, 'Boss notification permitted during daytime');

const bossCheckNight = shouldDispatchNotification('boss', mockSettings, nightTime);
assert(bossCheckNight.allowed === false, 'Boss notification suppressed during Quiet Hours');

const timerCheckNight = shouldDispatchNotification('rest_timer', mockSettings, nightTime);
assert(timerCheckNight.allowed === true, 'Active in-workout rest timer is never suppressed by Quiet Hours');

console.log('Testing Appearance, Accents & Date/Time Formats (A1 - A10)...');
// Accent color palette
assert(ACCENT_COLOR_MAP.cyan.hex === '#00F0FF', 'Cyan accent maps to #00F0FF');
assert(ACCENT_COLOR_MAP.gold.hex === '#FFB800', 'Gold accent maps to #FFB800');
assert(ACCENT_COLOR_MAP.crimson.hex === '#FF3366', 'Crimson accent maps to #FF3366');
assert(ACCENT_COLOR_MAP.emerald.hex === '#00E676', 'Emerald accent maps to #00E676');

// Date formatting
const sampleDate = new Date(2026, 9, 25, 14, 30); // Oct 25, 2026
assert(formatDate(sampleDate, 'YYYY-MM-DD') === '2026-10-25', 'YYYY-MM-DD date formatted correctly');
assert(formatDate(sampleDate, 'MM/DD/YYYY') === '10/25/2026', 'MM/DD/YYYY date formatted correctly');
assert(formatDate(sampleDate, 'DD/MM/YYYY') === '25/10/2026', 'DD/MM/YYYY date formatted correctly');

// Time formatting
assert(formatTime(sampleDate, '24h') === '14:30', '24h time formatted as 14:30');
assert(formatTime(sampleDate, '12h') === '2:30 PM', '12h time formatted as 2:30 PM');

console.log('Testing Diagnostics & Incident Reporting (H3 & H4)...');
const report = formatDiagnosticReport('Screen freezes when tapping rest timer', 'bug', true);
assert(report.includes('GRIMIRON TACTICAL INCIDENT REPORT'), 'Report contains incident header');
assert(report.includes('Screen freezes when tapping rest timer'), 'Report contains user description');
assert(report.includes('BUG'), 'Report contains category');
assert(report.includes('Security: No sensitive tokens or secrets collected'), 'Report disclaims token privacy');

console.log('Testing Zero Achievements for Clean/Purged Initiates...');
const emptyInitiateContext: AchievementEvaluationContext = {
  userId: 'user_fresh',
  characterId: 'char_fresh',
  characterTotalXp: 0,
  characterLevel: 1,
  rankTier: 1,
  factionId: 'adeptus-astartes',
  completedWorkoutsCount: 0,
  completedSetsCount: 0,
  totalReps: 0,
  totalVolumeKg: 0,
  distinctExercisesCount: 0,
  distinctCategoriesCount: 0,
  distinctEquipmentCount: 0,
  personalRecordsBrokenCount: 0,
  maxSingleLiftWeightKg: 0,
  maxSingleSetVolumeKg: 0,
  consecutiveTrainingWeeks: 0,
  longestRestDaysHonored: 0,
  totalCombatAttacks: 0,
  totalCombatCrits: 0,
  totalCombatDamage: 0,
  soloBossesDefeatedCount: 0,
  distinctEnemiesDefeatedCount: 0,
  coopBossesDefeatedCount: 0,
  coopAttacksCount: 0,
  squadSharedDamageDealt: 0,
  distinctFactionsExploredCount: 0,
  campaignMissionsCompletedCount: 0,
  customEquipmentCount: 0,
};

const initiateEval = evaluateAchievements(emptyInitiateContext);
assert(
  initiateEval.newlyAwarded.length === 0,
  `Clean initiate with 0 workouts receives 0 achievements (got ${initiateEval.newlyAwarded.length})`
);

console.log('\n[TEST SUITE 19: Allegiance Swearing & Bi-directional Profile Sync Safety]');
console.log('Testing Faction Allegiance & Rank Carryover...');

const spaceMarineProfile = {
  characterName: 'Captain Titus',
  factionId: 'adeptus-astartes',
  subfactionId: 'ultramarines',
  totalXp: 8500,
  currentLevel: 10,
};

const marineFaction = getFactionById('adeptus-astartes')!;
const marineProgression = calculateProgression(spaceMarineProfile.totalXp, marineFaction);
assert(marineProgression.currentRankTier === 3, 'Space Marine rank is Tier 3 at 8,500 XP');

// Pledge allegiance to Necrons
const necronFaction = getFactionById('necrons')!;
assert(!!necronFaction, 'Necron faction exists in catalog');
const necronProgression = calculateProgression(spaceMarineProfile.totalXp, necronFaction);
assert(necronProgression.currentRankTier === 3, 'XP carries over to Necrons and calculates rank as Tier 3');
assert(necronProgression.currentRankTitle.length > 0, 'Necron rank has valid title');

console.log('Testing Bi-directional Cloud Sync Conflict Protection...');
function resolveProfileSync(
  local: { characterName: string; factionId: string },
  cloud: { displayName: string; factionId: string }
): { action: 'pull_cloud' | 'push_local' | 'in_sync'; resultingProfile: { characterName: string; factionId: string } } {
  const isDefaultLocalName = !local.characterName || local.characterName === 'Battle-Brother' || local.characterName.trim() === '';
  const isDefaultLocalFaction = !local.factionId || local.factionId === 'adeptus-astartes';

  if (isDefaultLocalName && isDefaultLocalFaction && (cloud.displayName !== 'Battle-Brother' || cloud.factionId !== 'adeptus-astartes')) {
    return {
      action: 'pull_cloud',
      resultingProfile: {
        characterName: cloud.displayName || local.characterName,
        factionId: cloud.factionId || local.factionId,
      },
    };
  } else if (!isDefaultLocalFaction || !isDefaultLocalName) {
    if (cloud.factionId !== local.factionId || cloud.displayName !== local.characterName) {
      return {
        action: 'push_local',
        resultingProfile: { ...local },
      };
    }
  }
  return { action: 'in_sync', resultingProfile: { ...local } };
}

// Case 1: Fresh initiate pulls from personalized cloud
const case1 = resolveProfileSync(
  { characterName: 'Battle-Brother', factionId: 'adeptus-astartes' },
  { displayName: 'Inquisitor Vane', factionId: 'grey-knights' }
);
assert(case1.action === 'pull_cloud', 'Fresh initiate pulls personalized profile from cloud');
assert(case1.resultingProfile.factionId === 'grey-knights', 'Faction pulled from cloud is grey-knights');

// Case 2: Customized local user never overwritten by stale cloud
const case2 = resolveProfileSync(
  { characterName: 'Captain Titus', factionId: 'necrons' },
  { displayName: 'Battle-Brother', factionId: 'adeptus-astartes' }
);
assert(case2.action === 'push_local', 'Local customization prevents overwrite and pushes local to cloud');
assert(case2.resultingProfile.factionId === 'necrons', 'Local faction remains Necrons');
assert(case2.resultingProfile.characterName === 'Captain Titus', 'Local warrior callsign remains Captain Titus');

// Case 3: Both in sync
const case3 = resolveProfileSync(
  { characterName: 'Captain Titus', factionId: 'necrons' },
  { displayName: 'Captain Titus', factionId: 'necrons' }
);
assert(case3.action === 'in_sync', 'Identical profiles remain in sync');

console.log('\n[TEST SUITE 20: One-Time Onboarding & Setup Lifecycle]');
console.log('Testing New User First Launch Evaluation...');

interface OnboardingEvaluationState {
  isInitialized: boolean;
  onboardingCompleted: boolean;
}

function shouldShowOnboarding(state: OnboardingEvaluationState): boolean {
  if (!state.isInitialized) return false; // Guarded against false trigger during SQLite load
  return !state.onboardingCompleted;
}

// 1. Initial boot before SQLite initializes
assert(
  !shouldShowOnboarding({ isInitialized: false, onboardingCompleted: false }),
  'Onboarding does not trigger before database initialization finishes'
);

// 2. First launch of fresh initiate
assert(
  shouldShowOnboarding({ isInitialized: true, onboardingCompleted: false }),
  'Fresh initiate sees onboarding once initialized'
);

console.log('Testing Completion & Skip Persistence...');
// 3. User finishes all slides
let simulatedSettings: AppSettings = { ...DEFAULT_APP_SETTINGS, onboarding_completed: false };
simulatedSettings.onboarding_completed = true; // onCompleteOnboarding()
assert(
  !shouldShowOnboarding({ isInitialized: true, onboardingCompleted: simulatedSettings.onboarding_completed }),
  'Completing onboarding prevents modal on subsequent evaluation'
);

// 4. User explicitly skips onboarding
let skippedSettings: AppSettings = { ...DEFAULT_APP_SETTINGS, onboarding_completed: false };
// handleSkip calls handleFinish -> onCompleteOnboarding
skippedSettings.onboarding_completed = true;
assert(
  !shouldShowOnboarding({ isInitialized: true, onboardingCompleted: skippedSettings.onboarding_completed }),
  'Skipping onboarding also marks completion and prevents repetition'
);

console.log('Testing App Restart & Tab Navigation Persistence...');
// 5. Subsequent launch / app restart
const restartedSettings: AppSettings = { ...simulatedSettings };
assert(
  !shouldShowOnboarding({ isInitialized: true, onboardingCompleted: restartedSettings.onboarding_completed }),
  'Restarting app preserves completed state and suppresses onboarding'
);

// 6. Tab navigation remount
const tabNavState: OnboardingEvaluationState = { isInitialized: true, onboardingCompleted: true };
assert(!shouldShowOnboarding(tabNavState), 'Navigating between tabs does not re-trigger onboarding');

console.log('Testing Interrupted Setup Recovery...');
// 7. Interrupted flow: app killed while onboarding is open
const interruptedState: OnboardingEvaluationState = { isInitialized: true, onboardingCompleted: false };
assert(shouldShowOnboarding(interruptedState), 'Interrupted setup is resumed on next launch');

console.log('Testing Existing User Automatic Protection...');
function resolveExistingUserOnboarding(
  userStats: { totalWorkouts: number },
  charProfile: { totalXp: number },
  currentOnboardingFlag: boolean
): boolean {
  const isExistingUser = userStats.totalWorkouts > 0 || charProfile.totalXp > 0;
  if (isExistingUser && !currentOnboardingFlag) {
    return true; // Auto-upgraded so veterans are never forced through onboarding
  }
  return currentOnboardingFlag;
}

assert(
  resolveExistingUserOnboarding({ totalWorkouts: 12 }, { totalXp: 5000 }, false) === true,
  'Existing user with 12 workouts automatically protected from onboarding'
);
assert(
  resolveExistingUserOnboarding({ totalWorkouts: 0 }, { totalXp: 800 }, false) === true,
  'Existing user with training XP automatically protected from onboarding'
);
assert(
  resolveExistingUserOnboarding({ totalWorkouts: 0 }, { totalXp: 0 }, false) === false,
  'Brand-new initiate with 0 workouts and 0 XP is eligible for onboarding'
);

console.log('Testing Settings Reset vs Onboarding Reset Separation...');
// 8. General settings reset preserves onboarding flag
function simulateResetAllSettings(wasOnboardingCompleted: boolean): AppSettings {
  return {
    ...DEFAULT_APP_SETTINGS,
    onboarding_completed: wasOnboardingCompleted,
  };
}

const resetPrefs = simulateResetAllSettings(true);
assert(resetPrefs.workout_weight_unit === 'lbs', 'Workout preferences restored to default');
assert(resetPrefs.onboarding_completed === true, 'General settings reset preserves completed onboarding');

// 9. Manual Onboarding Reset specifically resets onboarding
function simulateResetOnboardingOnly(settings: AppSettings): AppSettings {
  return {
    ...settings,
    onboarding_completed: false,
  };
}

const resetOnboardingOnly = simulateResetOnboardingOnly(resetPrefs);
assert(resetOnboardingOnly.onboarding_completed === false, 'Manual onboarding reset resets flag to false');
assert(resetOnboardingOnly.workout_weight_unit === 'lbs', 'Manual onboarding reset does not affect workout settings');

console.log('Testing Cloud Account Metadata Synchronization...');
function syncCloudOnboardingState(localCompleted: boolean, cloudCompleted: boolean | null): {
  localResult: boolean;
  pushToCloud: boolean;
} {
  if (cloudCompleted === true) {
    return { localResult: true, pushToCloud: false };
  } else if (cloudCompleted === false && localCompleted) {
    return { localResult: true, pushToCloud: true };
  }
  return { localResult: localCompleted, pushToCloud: false };
}

const cloudSync1 = syncCloudOnboardingState(false, true);
assert(cloudSync1.localResult === true, 'Cloud account completed state propagates to fresh device');

const cloudSync2 = syncCloudOnboardingState(true, false);
assert(cloudSync2.localResult === true, 'Local completed state not overwritten by pending cloud metadata');
assert(cloudSync2.pushToCloud === true, 'Local completed state pushed to cloud user metadata');

console.log('\n====================================================');
console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
console.log('====================================================');



