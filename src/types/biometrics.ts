export interface DailyStepRecord {
  date: string; // YYYY-MM-DD
  steps: number;
  distanceMeters: number;
  dailyTarget: number;
  auxXpAwarded: number;
  isTargetMet: boolean;
  reconIntelAwarded: number;
  updatedAt: string;
}

export interface StepMilestone {
  milestoneKey: string;
  targetSteps: number;
  title: string;
  xpReward: number;
  badgeName: string;
  achievedAt: string | null;
}

export type WeightGoalType = 'hypertrophy_gain' | 'fat_loss' | 'maintenance';

export interface BodyweightRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number;
  unit: 'lbs' | 'kg';
  emaWeight: number; // 7-day Exponential Moving Average
  notes?: string;
  createdAt: string;
}

export interface BodyweightGoal {
  characterId: string;
  goalType: WeightGoalType;
  targetWeight: number | null;
  weeklyRatePercent: number; // e.g. +0.35% for bulk, -0.75% for cut, 0% for recomp
  updatedAt: string;
}

export interface WeightAnalytics {
  currentWeight: number | null;
  currentEmaWeight: number | null;
  unit: 'lbs' | 'kg';
  goalType: WeightGoalType;
  targetWeight: number | null;
  weeklyRatePercent: number;
  actualWeeklyRatePercent: number | null;
  rateStatus: 'optimal' | 'moderate' | 'excessive_cut' | 'excessive_bulk' | 'stable';
  healthWarning?: string;
  logsCount: number;
}

export interface StasisSleepRecord {
  id: string;
  date: string; // YYYY-MM-DD
  hoursSlept: number;
  isWellRested: boolean;
  auxXpAwarded: number;
  loggedAt: string;
}
