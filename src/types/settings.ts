/**
 * Complete Settings & User Preferences Definition for GrimIron Workout RPG.
 * Every setting has a stable namespaced key, defined default value,
 * and valid options.
 */

export type WeightUnit = 'lbs' | 'kg';
export type DistanceUnit = 'miles' | 'km';
export type AppTheme = 'dark' | 'system' | 'light';
export type AccentColor = 'cyan' | 'gold' | 'crimson' | 'emerald' | 'purple' | 'orange';
export type TextSize = 'small' | 'standard' | 'large' | 'extra_large';
export type WeekStartsOn = 'monday' | 'sunday';
export type MissedSessionAction = 'neutral_reminder' | 'suggest_reschedule' | 'keep_visible' | 'manual';
export type RecoveryPreference = 'planned_rest' | 'active_recovery' | 'deload';
export type ExerciseSortOrder = 'alphabetical' | 'recent' | 'muscle_group';
export type ExerciseWeightBehavior = 'weighted' | 'bodyweight' | 'assisted';
export type BattleSummaryDetail = 'detailed' | 'concise';
export type SquadContributionVisibility = 'full_summary' | 'minimal';
export type WorkoutPrivacy = 'private' | 'squad_only' | 'public';
export type ProfileVisibility = 'public' | 'squad_only' | 'private';
export type SubfactionVisibility = 'public' | 'squad_only' | 'private';
export type SquadInvitePolicy = 'anyone' | 'squad_leaders' | 'nobody';
export type DateFormat = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
export type TimeFormat = '24h' | '12h';

export interface AppSettings {
  // Category 1: Workout & Logging
  workout_weight_unit: WeightUnit;
  workout_distance_unit: DistanceUnit;
  workout_default_rest_duration: number; // in seconds (e.g. 30, 60, 90, 120, 180, 240)
  workout_auto_start_rest_timer: boolean;
  workout_keep_screen_awake: boolean;
  workout_auto_save: boolean;
  workout_confirm_finish: boolean;
  workout_warn_unsaved: boolean;
  timer_sound_enabled: boolean;
  timer_haptic_enabled: boolean;
  exercise_sort_order: ExerciseSortOrder;
  exercise_favorites_first: boolean;
  exercise_default_category: string;
  exercise_remember_filter: boolean;
  exercise_default_weight_behavior: ExerciseWeightBehavior;

  // Category 2: Training Programs & Scheduling
  training_weekly_workout_goal: number; // 1 to 7 sessions
  training_preferred_days: string[]; // e.g. ['monday', 'wednesday', 'friday']
  training_week_starts_on: WeekStartsOn;
  training_scheduled_session_time: string; // 'HH:mm', e.g. '18:00'
  training_recovery_preference: RecoveryPreference;
  training_recovery_xp_enabled: boolean;
  training_recovery_xp_amount: number; // e.g. 50 XP
  training_missed_session_action: MissedSessionAction;
  training_program_reminders_enabled: boolean;
  training_deload_reminders_enabled: boolean;

  // Category 3: RPG, Faction & Campaign
  rpg_notify_new_missions: boolean;
  rpg_notify_mission_objectives: boolean;
  rpg_notify_campaign_regions: boolean;
  warfront_preferred_spawn_day: 'friday' | 'saturday';
  rpg_notify_raid_new: boolean;
  rpg_notify_raid_expiring: boolean;
  rpg_notify_raid_boss_defeated: boolean;
  rpg_battle_summary_detail: BattleSummaryDetail;
  rpg_squad_contribution_visibility: SquadContributionVisibility;
  rpg_daily_xp_cap: number; // System hard cap (default: 500 XP)

  // Category 4: Notifications & Reminders
  notif_workout_reminders: boolean;
  notif_rest_timer: boolean;
  notif_recovery_reminders: boolean;
  notif_mission_updates: boolean;
  notif_boss_alerts: boolean;
  notif_squad_activity: boolean;
  notif_achievements: boolean;
  notif_promotions: boolean;
  notif_weekly_summary: boolean;
  notif_quiet_hours_enabled: boolean;
  notif_quiet_hours_start: string; // '22:00'
  notif_quiet_hours_end: string; // '08:00'

  // Category 5: Appearance & Accessibility
  app_theme: AppTheme;
  app_accent_color: AccentColor;
  app_text_size: TextSize;
  sound_effects_enabled: boolean;
  haptics_enabled: boolean;
  high_contrast_enabled: boolean;
  app_language: string; // 'en'
  date_format: DateFormat;
  time_format: TimeFormat;

  // Category 6: Privacy, Account & Multiplayer
  privacy_workout_details: WorkoutPrivacy;
  privacy_share_contributions: boolean;
  privacy_profile_visibility: ProfileVisibility;
  privacy_custom_subfaction_visibility: SubfactionVisibility;
  privacy_squad_invites: SquadInvitePolicy;

  // Category 7: App Meta & Diagnostics
  onboarding_completed: boolean;
  starter_equipment_cleared: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  // Category 1: Workout & Logging
  workout_weight_unit: 'lbs',
  workout_distance_unit: 'miles',
  workout_default_rest_duration: 90,
  workout_auto_start_rest_timer: true,
  workout_keep_screen_awake: true,
  workout_auto_save: true,
  workout_confirm_finish: true,
  workout_warn_unsaved: true,
  timer_sound_enabled: true,
  timer_haptic_enabled: true,
  exercise_sort_order: 'alphabetical',
  exercise_favorites_first: true,
  exercise_default_category: 'all',
  exercise_remember_filter: true,
  exercise_default_weight_behavior: 'weighted',

  // Category 2: Training Programs & Scheduling
  training_weekly_workout_goal: 3,
  training_preferred_days: ['monday', 'wednesday', 'friday'],
  training_week_starts_on: 'monday',
  training_scheduled_session_time: '18:00',
  training_recovery_preference: 'planned_rest',
  training_recovery_xp_enabled: true,
  training_recovery_xp_amount: 50,
  training_missed_session_action: 'suggest_reschedule',
  training_program_reminders_enabled: true,
  training_deload_reminders_enabled: true,

  // Category 3: RPG, Faction & Campaign
  rpg_notify_new_missions: true,
  rpg_notify_mission_objectives: true,
  rpg_notify_campaign_regions: true,
  warfront_preferred_spawn_day: 'saturday',
  rpg_notify_raid_new: true,
  rpg_notify_raid_expiring: true,
  rpg_notify_raid_boss_defeated: true,
  rpg_battle_summary_detail: 'detailed',
  rpg_squad_contribution_visibility: 'full_summary',
  rpg_daily_xp_cap: 500,

  // Category 4: Notifications & Reminders
  notif_workout_reminders: true,
  notif_rest_timer: true,
  notif_recovery_reminders: true,
  notif_mission_updates: true,
  notif_boss_alerts: true,
  notif_squad_activity: true,
  notif_achievements: true,
  notif_promotions: true,
  notif_weekly_summary: true,
  notif_quiet_hours_enabled: false,
  notif_quiet_hours_start: '22:00',
  notif_quiet_hours_end: '08:00',

  // Category 5: Appearance & Accessibility
  app_theme: 'dark',
  app_accent_color: 'cyan',
  app_text_size: 'standard',
  sound_effects_enabled: true,
  haptics_enabled: true,
  high_contrast_enabled: false,
  app_language: 'en',
  date_format: 'YYYY-MM-DD',
  time_format: '24h',

  // Category 6: Privacy, Account & Multiplayer
  privacy_workout_details: 'private',
  privacy_share_contributions: true,
  privacy_profile_visibility: 'public',
  privacy_custom_subfaction_visibility: 'public',
  privacy_squad_invites: 'anyone',

  // Category 7: App Meta & Diagnostics
  onboarding_completed: false,
  starter_equipment_cleared: false,
};

export const ACCENT_COLOR_MAP: Record<AccentColor, { hex: string; label: string; loreName: string }> = {
  cyan: { hex: '#00F0FF', label: 'Plasma Cyan', loreName: 'Forgeworld Blue' },
  gold: { hex: '#FFB800', label: 'Auramite Gold', loreName: 'Adeptus Custodes' },
  crimson: { hex: '#FF3366', label: 'Blood Crimson', loreName: 'Blood Angels' },
  emerald: { hex: '#00E676', label: 'Vulkan Emerald', loreName: 'Salamanders' },
  purple: { hex: '#9D4EDD', label: 'Warp Purple', loreName: 'Emperor\'s Children' },
  orange: { hex: '#FF9100', label: 'Mars Rust', loreName: 'Adeptus Mechanicus' },
};
