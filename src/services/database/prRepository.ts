declare const require: any;

export interface CoreLiftPR {
  key: string;
  name: string;
  iconName: string;
  category: string;
  bestWeightLbs: number;
  bestWeightKg: number;
  repsAtBestWeight: number;
  estimated1RmLbs: number;
  estimated1RmKg: number;
  totalSetsLogged: number;
  hasRecord: boolean;
}

export interface TitanRating {
  ratingTitle: string;
  badgeColor: string;
  totalEstimated1RmLbs: number;
  totalEstimated1RmKg: number;
  description: string;
}

export interface CodexPrSummary {
  lifts: CoreLiftPR[];
  titanRating: TitanRating;
}

export interface SetRecordInput {
  exerciseName: string;
  weight: number;
  reps: number;
  unit: string;
}

/**
 * Calculates Estimated 1RM using the Brzycki equation:
 * E1RM = Weight * (1 + Reps / 30)
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weight);
  return Math.round(weight * (1 + reps / 30));
}

export const CORE_LIFT_PATTERNS = [
  {
    key: 'bench_press',
    name: 'Bench Press',
    iconName: 'fitness',
    category: 'Chest / Push',
    keywords: ['bench press', 'bench', 'chest press', 'incline press', 'dumbbell press'],
  },
  {
    key: 'barbell_squat',
    name: 'Back Squat',
    iconName: 'barbell',
    category: 'Quads / Legs',
    keywords: ['squat', 'back squat', 'front squat', 'hack squat', 'leg press'],
  },
  {
    key: 'deadlift',
    name: 'Deadlift',
    iconName: 'speedometer',
    category: 'Posterior / Back',
    keywords: ['deadlift', 'romanian deadlift', 'sumo deadlift', 'trap bar'],
  },
  {
    key: 'overhead_press',
    name: 'Overhead Press',
    iconName: 'arrow-up-circle',
    category: 'Shoulders / Delta',
    keywords: ['overhead press', 'military press', 'shoulder press', 'strict press', 'ohp'],
  },
  {
    key: 'pullup_row',
    name: 'Pull-Up / Heavy Row',
    iconName: 'body',
    category: 'Lats / Back',
    keywords: ['pull-up', 'pull up', 'chin-up', 'chin up', 'barbell row', 'bent over row', 'lat pulldown'],
  },
];

/**
 * Computes Titan Strength Rating from total estimated 1RM.
 */
export function calculateTitanRating(totalE1RmLbs: number): TitanRating {
  const totalE1RmKg = Math.round(totalE1RmLbs / 2.20462);

  if (totalE1RmLbs >= 1500) {
    return {
      ratingTitle: 'Imperator Titan',
      badgeColor: '#FFD700',
      totalEstimated1RmLbs: totalE1RmLbs,
      totalEstimated1RmKg: totalE1RmKg,
      description: 'Supreme kinetic dominance. A god-machine of unwavering iron strength.',
    };
  } else if (totalE1RmLbs >= 1250) {
    return {
      ratingTitle: 'Warlord Titan',
      badgeColor: '#FF6D00',
      totalEstimated1RmLbs: totalE1RmLbs,
      totalEstimated1RmKg: totalE1RmKg,
      description: 'Devastating powerhouse. Crushes opposition with monumental heavy tonnage.',
    };
  } else if (totalE1RmLbs >= 1000) {
    return {
      ratingTitle: 'Warhound Titan',
      badgeColor: '#00E5FF',
      totalEstimated1RmLbs: totalE1RmLbs,
      totalEstimated1RmKg: totalE1RmKg,
      description: 'Fierce, aggressive combat power. 1,000+ lbs aggregate compound drive.',
    };
  } else if (totalE1RmLbs >= 750) {
    return {
      ratingTitle: 'Questoris Knight',
      badgeColor: '#7C4DFF',
      totalEstimated1RmLbs: totalE1RmLbs,
      totalEstimated1RmKg: totalE1RmKg,
      description: 'Armored battle-tested veteran with exceptional work capacity.',
    };
  } else if (totalE1RmLbs >= 500) {
    return {
      ratingTitle: 'Armiger Knight',
      badgeColor: '#00E676',
      totalEstimated1RmLbs: totalE1RmLbs,
      totalEstimated1RmKg: totalE1RmKg,
      description: 'Swift and deadly frontline warfare. Solid compound foundations.',
    };
  } else {
    return {
      ratingTitle: 'Scout Vanguard',
      badgeColor: '#90A4AE',
      totalEstimated1RmLbs: totalE1RmLbs,
      totalEstimated1RmKg: totalE1RmKg,
      description: 'Initiate scout operative. Log compound sets to awaken your inner Titan.',
    };
  }
}

/**
 * Pure helper to compute PR summary from a list of sets.
 */
export function computePrSummaryFromSets(sets: SetRecordInput[]): CodexPrSummary {
  const lifts: CoreLiftPR[] = CORE_LIFT_PATTERNS.map((liftDef) => {
    const matchingSets = sets.filter((s) => {
      const lower = s.exerciseName.toLowerCase();
      return liftDef.keywords.some((kw) => lower.includes(kw));
    });

    let bestWeightLbs = 0;
    let repsAtBestWeight = 0;
    let maxEstimated1RmLbs = 0;

    for (const r of matchingSets) {
      const weightLbs = r.unit === 'kg' ? r.weight * 2.20462 : r.weight;
      const e1rm = calculateEstimated1RM(weightLbs, r.reps);

      if (e1rm > maxEstimated1RmLbs) {
        maxEstimated1RmLbs = e1rm;
      }

      if (weightLbs > bestWeightLbs) {
        bestWeightLbs = weightLbs;
        repsAtBestWeight = r.reps;
      } else if (weightLbs === bestWeightLbs && r.reps > repsAtBestWeight) {
        repsAtBestWeight = r.reps;
      }
    }

    const hasRecord = matchingSets.length > 0 && maxEstimated1RmLbs > 0;
    const bestWeightKg = Math.round(bestWeightLbs / 2.20462);
    const estimated1RmKg = Math.round(maxEstimated1RmLbs / 2.20462);

    return {
      key: liftDef.key,
      name: liftDef.name,
      iconName: liftDef.iconName,
      category: liftDef.category,
      bestWeightLbs: Math.round(bestWeightLbs),
      bestWeightKg,
      repsAtBestWeight,
      estimated1RmLbs: Math.round(maxEstimated1RmLbs),
      estimated1RmKg,
      totalSetsLogged: matchingSets.length,
      hasRecord,
    };
  });

  const totalE1RmLbs = lifts.reduce((sum, l) => sum + l.estimated1RmLbs, 0);
  const titanRating = calculateTitanRating(totalE1RmLbs);

  return {
    lifts,
    titanRating,
  };
}

/**
 * Queries workout history from SQLite and computes Personal Records (PRs)
 * and Estimated 1RMs for core movements.
 */
export function getCodexPrSummary(): CodexPrSummary {
  try {
    const { getDatabase } = require('./db');
    const db = getDatabase();

    const query = `
      SELECT e.name as exerciseName, s.weight, s.reps, s.unit
      FROM workout_sets s
      JOIN workout_exercises e ON s.exercise_id = e.id
      JOIN workout_sessions w ON e.session_id = w.id
      WHERE s.is_completed = 1 AND w.is_completed = 1
    `;

    const rows = (db.getAllSync(query) as SetRecordInput[]) || [];
    return computePrSummaryFromSets(rows);
  } catch {
    return computePrSummaryFromSets([]);
  }
}
