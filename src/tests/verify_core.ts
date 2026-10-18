import { XP_CONFIG, calculateWorkoutXp, normalizeToKg } from '../services/progression/xpCalculator';
import { getCumulativeXpForLevel, getLevelFromTotalXp, calculateProgression } from '../services/progression/rankEngine';
import { warhammer40kUniverse, getFactionById, getRankForXp } from '../content/warhammer40k';
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

console.log('\n====================================================');
console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
console.log('====================================================');

