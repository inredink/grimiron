declare const process: any;
declare const require: any;

export const APP_VERSION = '1.0.0';
export const APP_BUILD = 1;
export const EXPO_SDK_VERSION = '57.0.30';

function getRuntimePlatform(): string {
  try {
    const RN = require('react-native');
    if (RN?.Platform?.OS) {
      return `${RN.Platform.OS} (${RN.Platform.Version || 'standard'})`;
    }
  } catch {}
  return 'node/testing';
}

export interface AppDiagnostics {
  appVersion: string;
  expoVersion: string;
  platform: string;
  databaseStatus: string;
  totalWorkouts: number;
  totalSetsCompleted?: number;
  totalVolumeLbs?: number;
  totalCustomSubfactions: number;
  totalAchievementsAwarded: number;
  cloudSyncConfigured: boolean;
  characterSummary?: string;
  timestamp: string;
}

export interface DiagnosticsDataProvider {
  getCounts(): {
    workouts: number;
    setsCompleted?: number;
    volumeLbs?: number;
    subfactions: number;
    achievements: number;
    characterSummary?: string;
    dbStatus: string;
  };
}

export const inMemoryDiagnosticsProvider: DiagnosticsDataProvider = {
  getCounts: () => ({
    workouts: 0,
    setsCompleted: 0,
    volumeLbs: 0,
    subfactions: 0,
    achievements: 0,
    characterSummary: 'Level 1 Battle-Brother',
    dbStatus: 'ONLINE (Mock/Memory)',
  }),
};

let currentDiagnosticsProvider: DiagnosticsDataProvider = inMemoryDiagnosticsProvider;

export function setDiagnosticsDataProvider(provider: DiagnosticsDataProvider): void {
  currentDiagnosticsProvider = provider;
}

/**
 * Collects safe, non-sensitive diagnostic metadata for troubleshooting.
 * Never includes passwords, tokens, private keys, or personal health notes.
 */
export function getAppDiagnostics(): AppDiagnostics {
  const counts = currentDiagnosticsProvider.getCounts();
  const cloudUrl =
    typeof process !== 'undefined' && process.env
      ? (process.env as Record<string, string | undefined>).EXPO_PUBLIC_SUPABASE_URL
      : '';
  const cloudSyncConfigured = Boolean(
    cloudUrl && cloudUrl !== 'https://placeholder.supabase.co'
  );

  return {
    appVersion: APP_VERSION,
    expoVersion: EXPO_SDK_VERSION,
    platform: getRuntimePlatform(),
    databaseStatus: counts.dbStatus,
    totalWorkouts: counts.workouts,
    totalSetsCompleted: counts.setsCompleted,
    totalVolumeLbs: counts.volumeLbs,
    totalCustomSubfactions: counts.subfactions,
    totalAchievementsAwarded: counts.achievements,
    characterSummary: counts.characterSummary,
    cloudSyncConfigured,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Formats diagnostic report into a clean, human-readable string for copying or submitting.
 */
export function formatDiagnosticReport(
  userProblemDescription: string,
  category: string,
  includeDiagnostics: boolean = true
): string {
  const lines: string[] = [
    '=== GRIMIRON TACTICAL INCIDENT REPORT ===',
    `Timestamp: ${new Date().toISOString()}`,
    `Category: ${category.toUpperCase()}`,
    '',
    '--- USER PROBLEM DESCRIPTION ---',
    userProblemDescription.trim() || 'No description provided.',
    '',
  ];

  if (includeDiagnostics) {
    const diag = getAppDiagnostics();
    lines.push(
      '--- APP METADATA & TELEMETRY ---',
      `App Version: ${diag.appVersion}`,
      `Expo SDK: ${diag.expoVersion}`,
      `Platform: ${diag.platform}`,
      `Database Engine: ${diag.databaseStatus}`,
      `Warrior Profile: ${diag.characterSummary || 'Unknown'}`,
      `Total Workouts: ${diag.totalWorkouts}`,
      `Completed Sets: ${diag.totalSetsCompleted ?? 0}`,
      `Total Tonnage: ${diag.totalVolumeLbs ? `${diag.totalVolumeLbs.toLocaleString()} lbs` : '0 lbs'}`,
      `Custom Subfactions: ${diag.totalCustomSubfactions}`,
      `Achievements Earned: ${diag.totalAchievementsAwarded}`,
      `Cloud Synchronization: ${diag.cloudSyncConfigured ? 'Configured & Active' : 'Local Offline Mode'}`,
      'Security: No sensitive tokens or secrets collected.'
    );
  }

  lines.push('=========================================');
  return lines.join('\n');
}
