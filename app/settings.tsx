import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { THEME } from '../src/constants/theme';
import {
  AppSettings,
  ACCENT_COLOR_MAP,
  AccentColor,
  WeightUnit,
  DistanceUnit,
  AppTheme,
  TextSize,
  WeekStartsOn,
  RecoveryPreference,
  ExerciseSortOrder,
  ExerciseWeightBehavior,
  BattleSummaryDetail,
  SquadContributionVisibility,
  WorkoutPrivacy,
  ProfileVisibility,
  SubfactionVisibility,
  SquadInvitePolicy,
  DateFormat,
  TimeFormat,
} from '../src/types/settings';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../src/utils/haptics';
import {
  getAppDiagnostics,
  formatDiagnosticReport,
  AppDiagnostics,
} from '../src/services/diagnostics/diagnosticsService';
import { TacticalWalkthroughModal } from '../src/components/TacticalWalkthroughModal';
import appConfig from '../app.json';

type SettingsCategory =
  | 'workout'
  | 'training'
  | 'rpg'
  | 'notifications'
  | 'appearance'
  | 'privacy'
  | 'help';

interface CategoryTab {
  id: SettingsCategory;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORIES: CategoryTab[] = [
  { id: 'workout', title: 'WORKOUT & LOGGING', icon: 'barbell-outline' },
  { id: 'training', title: 'TRAINING & SCHEDULE', icon: 'calendar-outline' },
  { id: 'rpg', title: 'RPG & CAMPAIGN', icon: 'shield-outline' },
  { id: 'notifications', title: 'NOTIFICATIONS', icon: 'notifications-outline' },
  { id: 'appearance', title: 'APPEARANCE & A11Y', icon: 'color-palette-outline' },
  { id: 'privacy', title: 'PRIVACY & ACCOUNT', icon: 'lock-closed-outline' },
  { id: 'help', title: 'HELP & DIAGNOSTICS', icon: 'help-circle-outline' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string; openAuth?: string; returnWalkthrough?: string }>();
  const {
    settings,
    updateSetting,
    resetSettings,
    claimRecoveryXpAction,
    signOutAction,
    deleteAccountAction,
    character,
    updateCharacterNameAction,
    accountInfo,
    signInCloudAccount,
    signUpCloudAccount,
    resendVerificationEmailAction,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('workout');

  // Modal Dialog States
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLoggingGuideModal, setShowLoggingGuideModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [showPrivacyDocModal, setShowPrivacyDocModal] = useState(false);
  const [showCallsignModal, setShowCallsignModal] = useState(false);
  const [tempCallsign, setTempCallsign] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWalkthroughModal, setShowWalkthroughModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCallsign, setAuthCallsign] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Deep-link routing & Walkthrough jump handler
  React.useEffect(() => {
    if (params.category && CATEGORIES.some((c) => c.id === params.category)) {
      setActiveCategory(params.category as SettingsCategory);
    }
    if (params.openAuth === 'true') {
      setActiveCategory('privacy');
      setAuthMode('signup');
      setAuthEmail('');
      setAuthPassword('');
      setAuthCallsign(character.characterName);
      setAuthError(null);
      setShowAuthModal(true);
    }
  }, [params.category, params.openAuth, character.characterName]);

  // Report Problem State
  const [reportCategory, setReportCategory] = useState('bug');
  const [reportDescription, setReportDescription] = useState('');
  const [reportIncludeDiagnostics, setReportIncludeDiagnostics] = useState(true);
  const [reportSubmittedText, setReportSubmittedText] = useState<string | null>(null);

  // Diagnostics State
  const [currentDiagnostics, setCurrentDiagnostics] = useState<AppDiagnostics | null>(null);

  // Save Settings State
  const [saveBannerText, setSaveBannerText] = useState<string | null>(null);

  const activeAccent = ACCENT_COLOR_MAP[settings.app_accent_color]?.hex || THEME.colors.primary;

  const handleExplicitSaveSettings = () => {
    triggerHaptic.success();
    setSaveBannerText('Tactical configurations committed to Chapter Codex');
    setTimeout(() => {
      setSaveBannerText(null);
    }, 3500);
    Alert.alert(
      'Settings Saved',
      'All tactical preferences and crusade configurations have been committed and persisted to local Chapter storage.'
    );
  };

  const handleTabPress = (cat: SettingsCategory) => {
    triggerHaptic.selection();
    setActiveCategory(cat);
  };

  const handleClaimRecoveryXp = () => {
    triggerHaptic.medium();
    const result = claimRecoveryXpAction();
    if (result.awarded) {
      triggerHaptic.success();
      Alert.alert('Recovery XP Awarded!', result.reason);
    } else {
      triggerHaptic.warning();
      Alert.alert('Recovery Evaluation', result.reason);
    }
  };

  const handleResetSettingsConfirm = () => {
    Alert.alert(
      'Reset All Settings?',
      'This will restore all workout preferences, notification options, and appearance defaults without deleting workout history or characters.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Defaults',
          style: 'destructive',
          onPress: () => {
            resetSettings();
            triggerHaptic.success();
            Alert.alert('Settings Reset', 'All settings have been restored to defaults.');
          },
        },
      ]
    );
  };

  const handleSignOutPress = () => {
    Alert.alert(
      'Sign Out of Cloud Session?',
      'Local workout logs and tactical character stats will remain preserved on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const res = await signOutAction();
            triggerHaptic.medium();
            Alert.alert('Cloud Session', res.message);
          },
        },
      ]
    );
  };

  const handleSaveCallsign = () => {
    if (!tempCallsign.trim()) {
      Alert.alert('Invalid Callsign', 'Please enter a valid callsign for your warrior.');
      return;
    }
    updateCharacterNameAction(tempCallsign.trim());
    triggerHaptic.success();
    setShowCallsignModal(false);
    Alert.alert('Callsign Updated', `Your warrior will now be recognized as "${tempCallsign.trim()}".`);
  };

  const handleAuthSubmit = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'signin') {
        const res = await signInCloudAccount(authEmail.trim(), authPassword);
        if (res.success) {
          triggerHaptic.success();
          setShowAuthModal(false);
          if (params.returnWalkthrough === 'true' && router.canGoBack()) {
            Alert.alert(
              'Crusader Authenticated',
              `${res.message}\n\nWould you like to return to continue the tactical walkthrough?`,
              [
                { text: 'Return to Walkthrough', style: 'default', onPress: () => router.back() },
                { text: 'Stay in Settings', style: 'cancel' },
              ]
            );
          } else {
            Alert.alert('Authentication Success', res.message);
          }
        } else {
          setAuthError(res.message);
        }
      } else {
        const callsign = authCallsign.trim() || character.characterName || 'Battle-Brother';
        const res = await signUpCloudAccount(authEmail.trim(), authPassword, callsign);
        if (res.success) {
          triggerHaptic.success();
          setShowAuthModal(false);
          if (params.returnWalkthrough === 'true' && router.canGoBack()) {
            Alert.alert(
              'Warrior Registered',
              `${res.message}\n\nA confirmation transmission has been dispatched to ${authEmail.trim()}.\n\nWould you like to return to continue the tactical walkthrough?`,
              [
                { text: 'Return to Walkthrough', style: 'default', onPress: () => router.back() },
                { text: 'Stay in Settings', style: 'cancel' },
              ]
            );
          } else {
            Alert.alert('Warrior Registered', res.message);
          }
        } else {
          setAuthError(res.message);
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      'Purge & Delete Account Data?',
      'This will permanently wipe all local workout history, custom subfactions, and achievement progress, resetting your character to a fresh Level 1 Initiate.\n\nAre you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Purge Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This action is irreversible. All local workout logs, custom subfactions, and glory XP will be erased immediately.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Purge Account Now',
                  style: 'destructive',
                  onPress: async () => {
                    const res = await deleteAccountAction();
                    if (res.success) {
                      triggerHaptic.heavy();
                      Alert.alert('Account Purged', res.message, [
                        { text: 'OK', onPress: () => router.replace('/(tabs)') },
                      ]);
                    } else {
                      Alert.alert('Deletion Error', res.message);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleOpenDiagnostics = () => {
    setCurrentDiagnostics(getAppDiagnostics());
    setShowDiagnosticsModal(true);
  };

  const handleShareDiagnostics = async () => {
    const diag = currentDiagnostics || getAppDiagnostics();
    const text = [
      '=== GRIMIRON SYSTEM TELEMETRY ===',
      `App Version: v${diag.appVersion}`,
      `Expo SDK: ${diag.expoVersion}`,
      `Platform: ${diag.platform}`,
      `Storage Engine: ${diag.databaseStatus}`,
      `Warrior Profile: ${diag.characterSummary || character.characterName}`,
      `Completed Workouts: ${diag.totalWorkouts}`,
      `Completed Sets: ${diag.totalSetsCompleted ?? 0}`,
      `Total Volume: ${diag.totalVolumeLbs ? `${diag.totalVolumeLbs.toLocaleString()} lbs` : '0 lbs'}`,
      `Custom Subfactions: ${diag.totalCustomSubfactions}`,
      `Medals Unlocked: ${diag.totalAchievementsAwarded}`,
      `Cloud Sync: ${diag.cloudSyncConfigured ? 'Configured & Active' : 'Local Offline Mode'}`,
      `Account: ${accountInfo?.email || 'Local User'}`,
      `Timestamp: ${diag.timestamp}`,
      '=================================',
    ].join('\n');

    try {
      await Share.share({
        title: 'GrimIron Diagnostics Telemetry',
        message: text,
      });
      triggerHaptic.selection();
    } catch (err: any) {
      Alert.alert('Export Notice', err?.message || 'Could not open share dialog.');
    }
  };

  const handleSendEmailReport = async () => {
    if (!reportDescription.trim()) {
      Alert.alert('Description Required', 'Please enter a description of the issue or malfunction.');
      return;
    }
    const reportText = formatDiagnosticReport(
      reportDescription,
      reportCategory,
      reportIncludeDiagnostics
    );
    const recipient = 'support@grimiron.app';
    const subject = `[GrimIron Bug Report] - ${reportCategory.toUpperCase()}: ${reportDescription.trim().slice(0, 30)}`;
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportText)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        triggerHaptic.success();
      } else {
        await Share.share({
          title: subject,
          message: reportText,
        });
        triggerHaptic.selection();
      }
    } catch {
      await Share.share({
        title: subject,
        message: reportText,
      });
      triggerHaptic.selection();
    }
  };

  const handleShareReport = async () => {
    if (!reportDescription.trim()) {
      Alert.alert('Description Required', 'Please enter a description of the issue or malfunction.');
      return;
    }
    const reportText = formatDiagnosticReport(
      reportDescription,
      reportCategory,
      reportIncludeDiagnostics
    );
    try {
      await Share.share({
        title: `[GrimIron Incident] - ${reportCategory.toUpperCase()}`,
        message: reportText,
      });
      triggerHaptic.selection();
    } catch (err: any) {
      Alert.alert('Notice', err?.message || 'Failed to open share dialog.');
    }
  };

  const handleResetOnboarding = () => {
    updateSetting('onboarding_completed', false);
    triggerHaptic.success();
    Alert.alert(
      'Onboarding Reset',
      'Introductory tutorial directives and guides will be highlighted on your next mission deployment.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Tactical Navigation Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic.light();
            router.back();
          }}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={activeAccent} />
          <Text style={[styles.backButtonText, { color: activeAccent }]}>BACK</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>SETTINGS & CONFIGURATION</Text>
          <Text style={styles.headerSubtitle}>TACTICAL PREFERENCES CODESLATE</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={handleExplicitSaveSettings}
            style={[styles.headerSaveButton, { borderColor: activeAccent, backgroundColor: `${activeAccent}22` }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Save Tactical Settings"
            accessibilityRole="button"
          >
            <Ionicons name="checkmark-sharp" size={14} color={activeAccent} />
            <Text style={[styles.headerSaveButtonText, { color: activeAccent }]}>SAVE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResetSettingsConfirm}
            style={styles.resetButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh-outline" size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ephemeral Confirmation Banner */}
      {Boolean(saveBannerText) && (
        <View style={[styles.savedBanner, { borderBottomColor: activeAccent }]}>
          <Ionicons name="checkmark-circle" size={16} color={activeAccent} style={{ marginRight: 6 }} />
          <Text style={[styles.savedBannerText, { color: activeAccent }]}>{saveBannerText}</Text>
        </View>
      )}

      {/* Category Pills Navigation Bar */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsContent}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleTabPress(cat.id)}
                style={[
                  styles.categoryPill,
                  isActive && {
                    borderColor: activeAccent,
                    backgroundColor: 'rgba(0, 240, 255, 0.12)',
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon}
                  size={15}
                  color={isActive ? activeAccent : THEME.colors.textMuted}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && { color: activeAccent, fontWeight: '800' },
                  ]}
                >
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Settings Content Area */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(60, insets.bottom + 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* CATEGORY 1: WORKOUT & LOGGING                             */}
        {/* ========================================================= */}
        {activeCategory === 'workout' && (
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeader}>
              <Ionicons name="barbell-outline" size={20} color={activeAccent} />
              <Text style={styles.sectionTitle}>WORKOUT & LOGGING SETTINGS</Text>
            </View>

            {/* W1: Weight Units */}
            <View style={styles.settingCard}>
              <View style={styles.settingHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>WEIGHT UNITS</Text>
                  <Text style={styles.settingDescription}>
                    Preferred weight unit for workout sets, tonnages, and exercise history. Changing this converts displayed numbers without modifying raw recorded records.
                  </Text>
                </View>
              </View>
              <View style={styles.segmentedControl}>
                {(['lbs', 'kg'] as WeightUnit[]).map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('workout_weight_unit', unit);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.workout_weight_unit === unit && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.workout_weight_unit === unit && styles.segmentButtonTextActive,
                      ]}
                    >
                      {unit.toUpperCase()} {unit === 'lbs' ? '(POUNDS)' : '(KILOGRAMS)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* W2: Distance Units */}
            <View style={styles.settingCard}>
              <View style={styles.settingHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>DISTANCE UNITS</Text>
                  <Text style={styles.settingDescription}>
                    Preferred measurement for cardio, marching intervals, and distance metrics.
                  </Text>
                </View>
              </View>
              <View style={styles.segmentedControl}>
                {(['miles', 'km'] as DistanceUnit[]).map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('workout_distance_unit', unit);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.workout_distance_unit === unit && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.workout_distance_unit === unit && styles.segmentButtonTextActive,
                      ]}
                    >
                      {unit === 'miles' ? 'MILES' : 'KILOMETERS'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* W4: Default Rest Timer Duration */}
            <View style={styles.settingCard}>
              <View style={styles.settingHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>DEFAULT REST TIMER DURATION</Text>
                  <Text style={styles.settingDescription}>
                    Default duration loaded when a new rest interval begins between sets.
                  </Text>
                </View>
              </View>
              <View style={styles.chipRow}>
                {[30, 60, 90, 120, 180, 240].map((seconds) => (
                  <TouchableOpacity
                    key={seconds}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('workout_default_rest_duration', seconds);
                    }}
                    style={[
                      styles.chipButton,
                      settings.workout_default_rest_duration === seconds && {
                        backgroundColor: activeAccent,
                        borderColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipButtonText,
                        settings.workout_default_rest_duration === seconds &&
                          styles.chipButtonTextActive,
                      ]}
                    >
                      {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* W5: Auto-Start Rest Timer */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>AUTO-START REST TIMER</Text>
                <Text style={styles.settingDescription}>
                  Automatically launch the countdown timer immediately after checking off a completed set.
                </Text>
              </View>
              <Switch
                value={settings.workout_auto_start_rest_timer}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('workout_auto_start_rest_timer', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* W6: Keep Screen Awake */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>KEEP SCREEN AWAKE DURING WORKOUT</Text>
                <Text style={styles.settingDescription}>
                  Prevents the device screen from sleeping while an active workout is in progress. Released when workout completes or discards.
                </Text>
              </View>
              <Switch
                value={settings.workout_keep_screen_awake}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('workout_keep_screen_awake', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* W9: Automatic Saving */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>AUTOMATIC WORKOUT DRAFT SAVING</Text>
                <Text style={styles.settingDescription}>
                  Persists set entries and workout progress continuously to SQLite so unsaved work is protected against app restarts.
                </Text>
              </View>
              <Switch
                value={settings.workout_auto_save}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('workout_auto_save', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* W10: Finish-Workout Confirmation */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>FINISH WORKOUT CONFIRMATION</Text>
                <Text style={styles.settingDescription}>
                  Displays a confirmation prompt before finalizing combat encounters to prevent accidental premature completion.
                </Text>
              </View>
              <Switch
                value={settings.workout_confirm_finish}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('workout_confirm_finish', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* W11: Unsaved Workout Warning */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>UNSAVED CHANGES WARNING</Text>
                <Text style={styles.settingDescription}>
                  Warns before discarding or navigating away from an active session with unsaved sets.
                </Text>
              </View>
              <Switch
                value={settings.workout_warn_unsaved}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('workout_warn_unsaved', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* W13: Timer Sound & Vibration Alerts */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>TIMER ALERTS (REST INTERVALS)</Text>
              <Text style={[styles.settingDescription, { marginBottom: 12 }]}>
                Controls independent sound and vibration cues when countdown completes. Respects global audio/haptic master toggles.
              </Text>
              <View style={styles.subSettingRow}>
                <Text style={styles.subSettingText}>Timer Vibration / Haptic</Text>
                <Switch
                  value={settings.timer_haptic_enabled}
                  onValueChange={(val) => {
                    triggerHaptic.selection();
                    updateSetting('timer_haptic_enabled', val);
                  }}
                  trackColor={{ false: '#1E293B', true: activeAccent }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={[styles.subSettingRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.subSettingText}>Timer Audio Cue</Text>
                <Switch
                  value={settings.timer_sound_enabled}
                  onValueChange={(val) => {
                    triggerHaptic.selection();
                    updateSetting('timer_sound_enabled', val);
                  }}
                  trackColor={{ false: '#1E293B', true: activeAccent }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* W14: Exercise List Sorting & Favorites */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>EXERCISE LIBRARY SORTING</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Default ordering inside the exercise selection catalog.
              </Text>
              <View style={styles.segmentedControl}>
                {[
                  { id: 'alphabetical', label: 'A - Z' },
                  { id: 'muscle_group', label: 'MUSCLE' },
                  { id: 'recent', label: 'RECENT' },
                ].map((sort) => (
                  <TouchableOpacity
                    key={sort.id}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('exercise_sort_order', sort.id as ExerciseSortOrder);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.exercise_sort_order === sort.id && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.exercise_sort_order === sort.id &&
                          styles.segmentButtonTextActive,
                      ]}
                    >
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.subSettingRow, { marginTop: 12, borderBottomWidth: 0 }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.subSettingText}>Favorites Pinned to Top</Text>
                  <Text style={styles.settingSubDescription}>
                    Place bookmarked exercises at the top of the library.
                  </Text>
                </View>
                <Switch
                  value={settings.exercise_favorites_first}
                  onValueChange={(val) => {
                    triggerHaptic.selection();
                    updateSetting('exercise_favorites_first', val);
                  }}
                  trackColor={{ false: '#1E293B', true: activeAccent }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* W15: Default Weight-Entry Behavior */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>DEFAULT WEIGHT ENTRY BEHAVIOR</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Default template for newly added exercises. Individual catalog definitions (e.g. pullups vs squats) override this preference.
              </Text>
              <View style={styles.segmentedControl}>
                {[
                  { id: 'weighted', label: 'WEIGHTED' },
                  { id: 'bodyweight', label: 'BODYWEIGHT' },
                  { id: 'assisted', label: 'ASSISTED' },
                ].map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting(
                        'exercise_default_weight_behavior',
                        mode.id as ExerciseWeightBehavior
                      );
                    }}
                    style={[
                      styles.segmentButton,
                      settings.exercise_default_weight_behavior === mode.id && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.exercise_default_weight_behavior === mode.id &&
                          styles.segmentButtonTextActive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* CATEGORY 2: TRAINING PROGRAMS & SCHEDULING               */}
        {/* ========================================================= */}
        {activeCategory === 'training' && (
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color={activeAccent} />
              <Text style={styles.sectionTitle}>TRAINING PROGRAMS & SCHEDULING</Text>
            </View>

            {/* T1: Weekly Workout Goal */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>WEEKLY WORKOUT TARGET</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Your target number of completed workout sessions per calendar week.
              </Text>
              <View style={styles.chipRow}>
                {[2, 3, 4, 5, 6].map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('training_weekly_workout_goal', goal);
                    }}
                    style={[
                      styles.chipButton,
                      settings.training_weekly_workout_goal === goal && {
                        backgroundColor: activeAccent,
                        borderColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipButtonText,
                        settings.training_weekly_workout_goal === goal &&
                          styles.chipButtonTextActive,
                      ]}
                    >
                      {goal} DAYS / WK
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* T2: Preferred Training Days */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>PREFERRED TRAINING DAYS</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Days of the week designated for active workout missions. Non-selected days serve as observed recovery windows.
              </Text>
              <View style={styles.daysRow}>
                {[
                  { id: 'monday', label: 'MON' },
                  { id: 'tuesday', label: 'TUE' },
                  { id: 'wednesday', label: 'WED' },
                  { id: 'thursday', label: 'THU' },
                  { id: 'friday', label: 'FRI' },
                  { id: 'saturday', label: 'SAT' },
                  { id: 'sunday', label: 'SUN' },
                ].map((d) => {
                  const isSelected = settings.training_preferred_days.includes(d.id);
                  return (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => {
                        triggerHaptic.selection();
                        let updated = [...settings.training_preferred_days];
                        if (isSelected) {
                          if (updated.length > 1) {
                            updated = updated.filter((item) => item !== d.id);
                          }
                        } else {
                          updated.push(d.id);
                        }
                        updateSetting('training_preferred_days', updated);
                      }}
                      style={[
                        styles.dayCircle,
                        isSelected && {
                          backgroundColor: activeAccent,
                          borderColor: activeAccent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayCircleText,
                          isSelected && styles.dayCircleTextActive,
                        ]}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* T3: Week Starts On */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>WEEK STARTS ON</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Determines how weekly volume, adherence summaries, and habit tracking groups days.
              </Text>
              <View style={styles.segmentedControl}>
                {(['monday', 'sunday'] as WeekStartsOn[]).map((start) => (
                  <TouchableOpacity
                    key={start}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('training_week_starts_on', start);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.training_week_starts_on === start && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.training_week_starts_on === start &&
                          styles.segmentButtonTextActive,
                      ]}
                    >
                      {start.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* T6: Recovery-Day Preferences & Recovery XP */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>RECOVERY DAY PREFERENCE & BONUS XP</Text>
              <Text style={[styles.settingDescription, { marginBottom: 12 }]}>
                Adhering to scheduled rest days protects against overtraining. Awarding modest Glory XP rewards legitimate recovery windows without encouraging abuse.
              </Text>
              <View style={styles.segmentedControl}>
                {[
                  { id: 'planned_rest', label: 'REST' },
                  { id: 'active_recovery', label: 'ACTIVE' },
                  { id: 'deload', label: 'DELOAD' },
                ].map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting(
                        'training_recovery_preference',
                        mode.id as RecoveryPreference
                      );
                    }}
                    style={[
                      styles.segmentButton,
                      settings.training_recovery_preference === mode.id && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.training_recovery_preference === mode.id &&
                          styles.segmentButtonTextActive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.subSettingRow, { marginTop: 14 }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.subSettingText}>Award Recovery XP</Text>
                  <Text style={styles.settingSubDescription}>
                    Grants +{settings.training_recovery_xp_amount} XP for honoring planned rest days (capped at 1 claim per calendar date).
                  </Text>
                </View>
                <Switch
                  value={settings.training_recovery_xp_enabled}
                  onValueChange={(val) => {
                    triggerHaptic.selection();
                    updateSetting('training_recovery_xp_enabled', val);
                  }}
                  trackColor={{ false: '#1E293B', true: activeAccent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Action Button: Evaluate / Claim Rest Day for Today */}
              <TouchableOpacity
                onPress={handleClaimRecoveryXp}
                style={[styles.actionButton, { marginTop: 10, borderColor: activeAccent }]}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark-outline" size={16} color={activeAccent} />
                <Text style={[styles.actionButtonText, { color: activeAccent }]}>
                  CHECK & CLAIM TODAY'S RECOVERY XP
                </Text>
              </TouchableOpacity>
            </View>

            {/* T7: Missed-Session Handling */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>MISSED SESSION HANDLING</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                How scheduled training program workouts appear when a planned date passes without logging.
              </Text>
              <View style={styles.verticalOptions}>
                {[
                  {
                    id: 'suggest_reschedule',
                    title: 'Suggest Rescheduling (Recommended)',
                    desc: 'Offers a one-tap option to shift the session forward.',
                  },
                  {
                    id: 'neutral_reminder',
                    title: 'Neutral Reminder',
                    desc: 'Displays a calm reminder without altering the schedule.',
                  },
                  {
                    id: 'keep_visible',
                    title: 'Keep Schedule Visible',
                    desc: 'Retains original dates intact in the calendar.',
                  },
                  {
                    id: 'manual',
                    title: 'Manual Management',
                    desc: 'Leaves all session status changes strictly up to you.',
                  },
                ].map((opt) => {
                  const isSelected = settings.training_missed_session_action === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => {
                        triggerHaptic.selection();
                        updateSetting('training_missed_session_action', opt.id as any);
                      }}
                      style={[
                        styles.verticalOptionCard,
                        isSelected && { borderColor: activeAccent },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.verticalOptionTitle,
                            isSelected && { color: activeAccent },
                          ]}
                        >
                          {opt.title}
                        </Text>
                        <Text style={styles.verticalOptionDesc}>{opt.desc}</Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isSelected ? activeAccent : THEME.colors.textMuted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* T8: Program Reminders */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>PROGRAM SESSION REMINDERS</Text>
                <Text style={styles.settingDescription}>
                  Receives in-app notifications regarding upcoming prescribed routine sessions.
                </Text>
              </View>
              <Switch
                value={settings.training_program_reminders_enabled}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('training_program_reminders_enabled', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* T10: Deload and Recovery Reminders */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>DELOAD & RECOVERY REMINDERS</Text>
                <Text style={styles.settingDescription}>
                  Alerts when your training program prescribes a planned deload block to honor fatigue management.
                </Text>
              </View>
              <Switch
                value={settings.training_deload_reminders_enabled}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('training_deload_reminders_enabled', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* CATEGORY 3: RPG, FACTION & CAMPAIGN                       */}
        {/* ========================================================= */}
        {activeCategory === 'rpg' && (
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-outline" size={20} color={activeAccent} />
              <Text style={styles.sectionTitle}>RPG, FACTION & CAMPAIGN SETTINGS</Text>
            </View>

            {/* Daily XP Hard Cap (Authoritative Game Directive) */}
            <View style={styles.settingCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={styles.settingLabel}>DAILY TRAINING XP HARD CAP</Text>
                <View style={[styles.statusPill, { backgroundColor: 'rgba(255, 183, 77, 0.15)', borderColor: '#FFB74D' }]}>
                  <Text style={[styles.statusPillText, { color: '#FFB74D' }]}>CRUSADE DIRECTIVE</Text>
                </View>
              </View>
              <Text style={[styles.settingDescription, { marginBottom: 12 }]}>
                Authoritatively fixed by the chapter progression engine to protect warriors against overtraining and combat fatigue. This limit is maintained by the game system and cannot be altered by operative input.
              </Text>
              <View style={styles.authoritativeDirectiveCard}>
                <Ionicons name="lock-closed" size={18} color={activeAccent} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.authoritativeDirectiveTitle, { color: activeAccent }]}>500 XP / CALENDAR DAY</Text>
                  <Text style={styles.authoritativeDirectiveSubtitle}>
                    Active System Hard Cap • Resets nightly at 00:00 local time
                  </Text>
                </View>
              </View>
            </View>

            {/* G8: Raid Spawn Day */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>WEEKLY RAID SPAWN DAY</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Designated day when new weekly sector raid bosses spawn. Schedule transitions safely without erasing in-progress encounters.
              </Text>
              <View style={styles.segmentedControl}>
                {(['friday', 'saturday'] as const).map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('warfront_preferred_spawn_day', day);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.warfront_preferred_spawn_day === day && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.warfront_preferred_spawn_day === day &&
                          styles.segmentButtonTextActive,
                      ]}
                    >
                      {day.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* G10: Battle Result Summaries */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>BATTLE RESULT PRESENTATION</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Choose between the full dramatic After-Action Report (AAR) or a quick victory summary after combat workouts.
              </Text>
              <View style={styles.segmentedControl}>
                {[
                  { id: 'detailed', label: 'FULL AAR DOSSIER' },
                  { id: 'concise', label: 'CONCISE SUMMARY' },
                ].map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('rpg_battle_summary_detail', mode.id as BattleSummaryDetail);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.rpg_battle_summary_detail === mode.id && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.rpg_battle_summary_detail === mode.id &&
                          styles.segmentButtonTextActive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* G11: Squad Contribution Display */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>CO-OP SQUAD CONTRIBUTION VISIBILITY</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Governs how your assault metrics appear in shared squad raid dossiers. Private set and rep data is never shared.
              </Text>
              <View style={styles.segmentedControl}>
                {[
                  { id: 'full_summary', label: 'FULL DAMAGE SHARE' },
                  { id: 'minimal', label: 'MINIMAL CO-OP' },
                ].map((vis) => (
                  <TouchableOpacity
                    key={vis.id}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting(
                        'rpg_squad_contribution_visibility',
                        vis.id as SquadContributionVisibility
                      );
                    }}
                    style={[
                      styles.segmentButton,
                      settings.rpg_squad_contribution_visibility === vis.id && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.rpg_squad_contribution_visibility === vis.id &&
                          styles.segmentButtonTextActive,
                      ]}
                    >
                      {vis.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* G7: Campaign & Mission Notifications */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>NEW MISSION DIRECTIVE ALERTS</Text>
                <Text style={styles.settingDescription}>
                  Notifies when new faction missions and campaign regions become available.
                </Text>
              </View>
              <Switch
                value={settings.rpg_notify_new_missions}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('rpg_notify_new_missions', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* G9: Raid Reminders */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>RAID BOSS CYCLE REMINDERS</Text>
                <Text style={styles.settingDescription}>
                  Alerts when a new weekly raid spawns or approaches sector expiration.
                </Text>
              </View>
              <Switch
                value={settings.rpg_notify_raid_new}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('rpg_notify_raid_new', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* CATEGORY 4: NOTIFICATIONS & REMINDERS                     */}
        {/* ========================================================= */}
        {activeCategory === 'notifications' && (
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={20} color={activeAccent} />
              <Text style={styles.sectionTitle}>NOTIFICATIONS & TACTICAL DISPATCHES</Text>
            </View>

            {/* Tactical Notice Banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={18} color={activeAccent} />
              <Text style={styles.infoBannerText}>
                In-app tactical toasts and HUD alerts are 100% active and processed locally. Background OS push notifications require device authorization.
              </Text>
            </View>

            {/* N10: Quiet Hours */}
            <View style={styles.settingCard}>
              <View style={styles.settingHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>QUIET HOURS (LOCAL SILENCE WINDOW)</Text>
                  <Text style={styles.settingDescription}>
                    Mutes non-essential tactical dispatches between selected hours. In-workout timers are not suppressed.
                  </Text>
                </View>
                <Switch
                  value={settings.notif_quiet_hours_enabled}
                  onValueChange={(val) => {
                    triggerHaptic.selection();
                    updateSetting('notif_quiet_hours_enabled', val);
                  }}
                  trackColor={{ false: '#1E293B', true: activeAccent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {settings.notif_quiet_hours_enabled && (
                <View style={[styles.subSettingRow, { marginTop: 12, borderBottomWidth: 0 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.subSettingText}>Window: </Text>
                    <Text style={[styles.subSettingText, { color: activeAccent, fontWeight: '800' }]}>
                      {settings.notif_quiet_hours_start} - {settings.notif_quiet_hours_end}
                    </Text>
                  </View>
                  <Text style={styles.settingSubDescription}>
                    (Supports crossing midnight)
                  </Text>
                </View>
              )}
            </View>

            {/* N1: Workout Reminders */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>WORKOUT REMINDERS</Text>
                <Text style={styles.settingDescription}>
                  Reminders for upcoming planned training missions.
                </Text>
              </View>
              <Switch
                value={settings.notif_workout_reminders}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('notif_workout_reminders', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* N7: Achievement Notifications */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>ACHIEVEMENT UNLOCK TOASTS</Text>
                <Text style={styles.settingDescription}>
                  Displays tactical toasts when new combat medals or lifting achievements are unlocked.
                </Text>
              </View>
              <Switch
                value={settings.notif_achievements}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('notif_achievements', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* N8: Promotion Notifications */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>RANK PROMOTION ALERTS</Text>
                <Text style={styles.settingDescription}>
                  Alerts when your accumulated glory XP earns you promotion to a new faction tier.
                </Text>
              </View>
              <Switch
                value={settings.notif_promotions}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('notif_promotions', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* N9: Weekly Summary */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>WEEKLY TACTICAL PERFORMANCE SUMMARY</Text>
                <Text style={styles.settingDescription}>
                  Weekly overview of total sets, tonnage moved, enemies neutralized, and XP gained.
                </Text>
              </View>
              <Switch
                value={settings.notif_weekly_summary}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('notif_weekly_summary', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* CATEGORY 5: APPEARANCE & ACCESSIBILITY                    */}
        {/* ========================================================= */}
        {activeCategory === 'appearance' && (
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeader}>
              <Ionicons name="color-palette-outline" size={20} color={activeAccent} />
              <Text style={styles.sectionTitle}>APPEARANCE & ACCESSIBILITY</Text>
            </View>

            {/* A1: App Theme */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>APP THEME</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Visual presentation of interface and tactical dossiers.
              </Text>
              <View style={styles.segmentedControl}>
                {[
                  { id: 'dark', label: 'DARK (DEFAULT)' },
                  { id: 'system', label: 'SYSTEM' },
                  { id: 'light', label: 'LIGHT' },
                ].map((th) => (
                  <TouchableOpacity
                    key={th.id}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('app_theme', th.id as AppTheme);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.app_theme === th.id && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.app_theme === th.id && styles.segmentButtonTextActive,
                      ]}
                    >
                      {th.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* A2: Interface Accent Color */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>TACTICAL ACCENT COLOR</Text>
              <Text style={[styles.settingDescription, { marginBottom: 12 }]}>
                Curated palette of accessible HUD accents. Does not alter lore faction symbols or weapon stats.
              </Text>
              <View style={styles.colorPaletteRow}>
                {(Object.keys(ACCENT_COLOR_MAP) as AccentColor[]).map((colorKey) => {
                  const item = ACCENT_COLOR_MAP[colorKey];
                  const isSelected = settings.app_accent_color === colorKey;
                  return (
                    <TouchableOpacity
                      key={colorKey}
                      onPress={() => {
                        triggerHaptic.selection();
                        updateSetting('app_accent_color', colorKey);
                      }}
                      style={[
                        styles.colorChip,
                        { backgroundColor: item.hex },
                        isSelected && styles.colorChipSelected,
                      ]}
                      activeOpacity={0.8}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#000000" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.colorSelectedLabel}>
                Active: {ACCENT_COLOR_MAP[settings.app_accent_color]?.label} ({ACCENT_COLOR_MAP[settings.app_accent_color]?.loreName})
              </Text>
            </View>

            {/* A3: Text Size */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>INTERFACE TEXT SIZE</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Adjusts font scale across tactical readouts, labels, and workout buttons.
              </Text>
              <View style={styles.segmentedControl}>
                {[
                  { id: 'small', label: 'SMALL' },
                  { id: 'standard', label: 'STANDARD' },
                  { id: 'large', label: 'LARGE' },
                  { id: 'extra_large', label: 'XL' },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('app_text_size', s.id as TextSize);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.app_text_size === s.id && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.app_text_size === s.id && styles.segmentButtonTextActive,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* A5: Sound Effects Master */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>SOUND EFFECTS (MASTER)</Text>
                <Text style={styles.settingDescription}>
                  Global audio cues for UI clicks, timer countdowns, and battle victories.
                </Text>
              </View>
              <Switch
                value={settings.sound_effects_enabled}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('sound_effects_enabled', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* A6: Haptic Feedback Master */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>HAPTIC FEEDBACK (MASTER)</Text>
                <Text style={styles.settingDescription}>
                  Tactile vibrations for checked sets, critical hits, countdown warnings, and promotions.
                </Text>
              </View>
              <Switch
                value={settings.haptics_enabled}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('haptics_enabled', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* A7: High Contrast Mode */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>HIGH CONTRAST MODE</Text>
                <Text style={styles.settingDescription}>
                  Increases border definition and text luminance for enhanced outdoor and gym visibility.
                </Text>
              </View>
              <Switch
                value={settings.high_contrast_enabled}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('high_contrast_enabled', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* A9: Language */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>APP LANGUAGE</Text>
              <Text style={[styles.settingDescription, { marginBottom: 6 }]}>
                GrimIron lore and tactical interfaces are natively authored in English (US). Localization infrastructure is established for future dataslates.
              </Text>
              <View style={styles.languageBadge}>
                <Ionicons name="globe-outline" size={16} color={activeAccent} />
                <Text style={[styles.languageBadgeText, { color: activeAccent }]}>
                  ENGLISH (US) — OFFICIAL LORE SPEC
                </Text>
              </View>
            </View>

            {/* A10: Date and Time Formats */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>DATE & TIME FORMAT</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Formatting preference for workout timestamps and combat history without modifying underlying UTC records.
              </Text>

              <Text style={styles.subSettingText}>Date Presentation:</Text>
              <View style={[styles.segmentedControl, { marginBottom: 12 }]}>
                {(['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'] as DateFormat[]).map((fmt) => (
                  <TouchableOpacity
                    key={fmt}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('date_format', fmt);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.date_format === fmt && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.date_format === fmt && styles.segmentButtonTextActive,
                      ]}
                    >
                      {fmt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.subSettingText}>Time Clock:</Text>
              <View style={styles.segmentedControl}>
                {(['24h', '12h'] as TimeFormat[]).map((fmt) => (
                  <TouchableOpacity
                    key={fmt}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('time_format', fmt);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.time_format === fmt && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.time_format === fmt && styles.segmentButtonTextActive,
                      ]}
                    >
                      {fmt === '24h' ? '24-HOUR (18:00)' : '12-HOUR (6:00 PM)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* CATEGORY 6: PRIVACY, ACCOUNT & MULTIPLAYER               */}
        {/* ========================================================= */}
        {activeCategory === 'privacy' && (
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed-outline" size={20} color={activeAccent} />
              <Text style={styles.sectionTitle}>PRIVACY, ACCOUNT & MULTIPLAYER</Text>
            </View>

            {/* P1: Workout Privacy */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>WORKOUT DETAIL PRIVACY</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Controls who can inspect your specific exercises, weights, reps, and personal workout notes. Default is strictly Private.
              </Text>
              <View style={styles.segmentedControl}>
                {[
                  { id: 'private', label: 'PRIVATE (ONLY ME)' },
                  { id: 'squad_only', label: 'SQUAD ONLY' },
                  { id: 'public', label: 'PUBLIC' },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('privacy_workout_details', p.id as WorkoutPrivacy);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.privacy_workout_details === p.id && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.privacy_workout_details === p.id &&
                          styles.segmentButtonTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* P2: Share Battle Contributions */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>SHARE CO-OP BATTLE CONTRIBUTIONS</Text>
                <Text style={styles.settingDescription}>
                  Allows squad members to see your total boss damage and attack count during cooperative raids. Does NOT share your weights or reps.
                </Text>
              </View>
              <Switch
                value={settings.privacy_share_contributions}
                onValueChange={(val) => {
                  triggerHaptic.selection();
                  updateSetting('privacy_share_contributions', val);
                }}
                trackColor={{ false: '#1E293B', true: activeAccent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* P3: Profile Visibility */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>TACTICAL PROFILE VISIBILITY</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Visibility of character callsign, faction allegiance, level, and public titles.
              </Text>
              <View style={styles.segmentedControl}>
                {(['public', 'squad_only', 'private'] as ProfileVisibility[]).map((vis) => (
                  <TouchableOpacity
                    key={vis}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('privacy_profile_visibility', vis);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.privacy_profile_visibility === vis && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.privacy_profile_visibility === vis &&
                          styles.segmentButtonTextActive,
                      ]}
                    >
                      {vis.toUpperCase().replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* P4: Custom Subfaction Visibility */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>CUSTOM SUBFACTION VISIBILITY</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Controls whether your custom chapter or warband identity and uploaded emblem are shown to other squad members in battle logs.
              </Text>
              <View style={styles.segmentedControl}>
                {(['public', 'squad_only', 'private'] as SubfactionVisibility[]).map((vis) => (
                  <TouchableOpacity
                    key={vis}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('privacy_custom_subfaction_visibility', vis);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.privacy_custom_subfaction_visibility === vis && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.privacy_custom_subfaction_visibility === vis &&
                          styles.segmentButtonTextActive,
                      ]}
                    >
                      {vis.toUpperCase().replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* P5: Squad Invitations Policy */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>SQUAD INVITATIONS POLICY</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Who can dispatch cooperative crusade invitations to your warrior profile.
              </Text>
              <View style={styles.segmentedControl}>
                {[
                  { id: 'anyone', label: 'ANY SQUAD' },
                  { id: 'squad_leaders', label: 'OFFICERS ONLY' },
                  { id: 'nobody', label: 'NOBODY' },
                ].map((pol) => (
                  <TouchableOpacity
                    key={pol.id}
                    onPress={() => {
                      triggerHaptic.selection();
                      updateSetting('privacy_squad_invites', pol.id as SquadInvitePolicy);
                    }}
                    style={[
                      styles.segmentButton,
                      settings.privacy_squad_invites === pol.id && {
                        backgroundColor: activeAccent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        settings.privacy_squad_invites === pol.id &&
                          styles.segmentButtonTextActive,
                      ]}
                    >
                      {pol.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* P7: Account Management Details */}
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>ACCOUNT MANAGEMENT</Text>
              <Text style={[styles.settingDescription, { marginBottom: 10 }]}>
                Current warrior authentication identity and database session state.
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tactical ID:</Text>
                <Text style={styles.infoValue}>
                  {accountInfo?.isCloudAuthenticated ? accountInfo.userId : `user_main (Initiate #${character.id})`}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Database Engine:</Text>
                <Text style={styles.infoValue}>SQLite Local-First (Encrypted WAL)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Character Callsign:</Text>
                <Text style={[styles.infoValue, { color: activeAccent, fontWeight: '700' }]}>
                  {character.characterName}
                </Text>
              </View>
              {accountInfo?.isCloudAuthenticated && accountInfo.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Crusade Cloud Email:</Text>
                  <Text style={styles.infoValue}>{accountInfo.email}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cloud Session:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: accountInfo?.isCloudAuthenticated ? '#00E676' : '#EAB308',
                      fontWeight: '700',
                    },
                  ]}
                >
                  {accountInfo?.isCloudAuthenticated ? 'Connected & Synchronized' : 'Local Offline Mode'}
                </Text>
              </View>

              {/* Edit Callsign Button */}
              <TouchableOpacity
                onPress={() => {
                  setTempCallsign(character.characterName);
                  setShowCallsignModal(true);
                }}
                style={[styles.actionButton, { borderColor: activeAccent, marginTop: 12 }]}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={17} color={activeAccent} />
                <Text style={[styles.actionButtonText, { color: activeAccent }]}>
                  EDIT WARRIOR CALLSIGN
                </Text>
              </TouchableOpacity>

              {/* Connect Cloud Account Button if not authenticated */}
              {!accountInfo?.isCloudAuthenticated && (
                <TouchableOpacity
                  onPress={() => {
                    setAuthMode('signin');
                    setAuthEmail('');
                    setAuthPassword('');
                    setAuthCallsign(character.characterName);
                    setAuthError(null);
                    setShowAuthModal(true);
                  }}
                  style={[styles.actionButton, { borderColor: '#00E676', marginTop: 10 }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cloud-upload-outline" size={17} color="#00E676" />
                  <Text style={[styles.actionButtonText, { color: '#00E676' }]}>
                    CONNECT CLOUD ACCOUNT / REGISTER
                  </Text>
                </TouchableOpacity>
              )}

              {/* Resend Verification Email Button */}
              {accountInfo?.email && (
                <TouchableOpacity
                  onPress={async () => {
                    triggerHaptic.selection();
                    const res = await resendVerificationEmailAction(accountInfo.email!);
                    if (res.success) {
                      triggerHaptic.success();
                      Alert.alert('Verification Transmission', res.message);
                    } else {
                      triggerHaptic.warning();
                      Alert.alert('Notice', res.message);
                    }
                  }}
                  style={[styles.actionButton, { borderColor: '#FFB800', marginTop: 10 }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mail-outline" size={17} color="#FFB800" />
                  <Text style={[styles.actionButtonText, { color: '#FFB800' }]}>
                    RESEND VERIFICATION EMAIL
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* P8: Sign Out (visible only when cloud authenticated) */}
            {accountInfo?.isCloudAuthenticated && (
              <TouchableOpacity
                onPress={handleSignOutPress}
                style={[styles.actionButton, { borderColor: '#EAB308', marginTop: 6 }]}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={18} color="#EAB308" />
                <Text style={[styles.actionButtonText, { color: '#EAB308' }]}>
                  SIGN OUT OF CLOUD SESSION
                </Text>
              </TouchableOpacity>
            )}

            {/* P9: Delete Account */}
            <TouchableOpacity
              onPress={handleDeleteAccountPress}
              style={[styles.actionButton, { borderColor: '#EF4444', marginTop: 12 }]}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                PURGE & DELETE ACCOUNT DATA
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================= */}
        {/* CATEGORY 7: HELP, TROUBLESHOOTING & APP INFORMATION       */}
        {/* ========================================================= */}
        {activeCategory === 'help' && (
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeader}>
              <Ionicons name="help-circle-outline" size={20} color={activeAccent} />
              <Text style={styles.sectionTitle}>HELP, TROUBLESHOOTING & APP INFORMATION</Text>
            </View>

            {/* H1: General Help & Guidance */}
            <TouchableOpacity
              onPress={() => setShowHelpModal(true)}
              style={styles.menuLinkCard}
              activeOpacity={0.8}
            >
              <Ionicons name="book-outline" size={22} color={activeAccent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuLinkTitle}>APP OVERVIEW & TACTICAL GUIDANCE</Text>
                <Text style={styles.menuLinkSubtitle}>
                  Codex primer explaining how workouts fuel RPG combat, rank progression, and campaigns.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            {/* H2: Workout Logging Guide */}
            <TouchableOpacity
              onPress={() => setShowLoggingGuideModal(true)}
              style={styles.menuLinkCard}
              activeOpacity={0.8}
            >
              <Ionicons name="fitness-outline" size={22} color={activeAccent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuLinkTitle}>WORKOUT LOGGING FIELD MANUAL</Text>
                <Text style={styles.menuLinkSubtitle}>
                  Comprehensive guide on sets, reps, weight units, bodyweight exercises, and XP calculations.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            {/* H3: Report a Problem */}
            <TouchableOpacity
              onPress={() => setShowReportModal(true)}
              style={styles.menuLinkCard}
              activeOpacity={0.8}
            >
              <Ionicons name="bug-outline" size={22} color={activeAccent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuLinkTitle}>REPORT AN ISSUE OR BUG</Text>
                <Text style={styles.menuLinkSubtitle}>
                  Describe an issue, attach non-sensitive diagnostics, and export an incident report.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            {/* H4: Diagnostics Inspector */}
            <TouchableOpacity
              onPress={handleOpenDiagnostics}
              style={styles.menuLinkCard}
              activeOpacity={0.8}
            >
              <Ionicons name="hardware-chip-outline" size={22} color={activeAccent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuLinkTitle}>DIAGNOSTICS & SYSTEM STATUS</Text>
                <Text style={styles.menuLinkSubtitle}>
                  Inspect SQLite database records, table metrics, and client runtime health.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            {/* H7: Privacy & Data Architecture */}
            <TouchableOpacity
              onPress={() => setShowPrivacyDocModal(true)}
              style={styles.menuLinkCard}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark-outline" size={22} color={activeAccent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuLinkTitle}>PRIVACY & DATA STORAGE DISCLOSURE</Text>
                <Text style={styles.menuLinkSubtitle}>
                  Plain English breakdown of local SQLite storage, cloud sync, and encryption.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            {/* H5: Review Tactical Walkthrough */}
            <TouchableOpacity
              onPress={() => {
                triggerHaptic.selection();
                setShowWalkthroughModal(true);
              }}
              style={[styles.menuLinkCard, { marginTop: 12 }]}
              activeOpacity={0.8}
            >
              <Ionicons name="compass-outline" size={22} color={activeAccent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuLinkTitle}>TACTICAL ONBOARDING WALKTHROUGH</Text>
                <Text style={styles.menuLinkSubtitle}>
                  Review the 5-directive operational guide: local architecture, cloud sync, and 40k mechanics.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            {/* H6: Reset Onboarding */}
            <TouchableOpacity
              onPress={handleResetOnboarding}
              style={[styles.actionButton, { borderColor: THEME.colors.surfaceBorder, marginTop: 14 }]}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-circle-outline" size={18} color={THEME.colors.textBright} />
              <Text style={styles.actionButtonText}>RESET ONBOARDING DIRECTIVES</Text>
            </TouchableOpacity>

            {/* H6: App Version Footer Badge */}
            <View style={styles.versionFooter}>
              <Text style={styles.versionText}>
                GRIMIRON TACTICAL RPG // V{appConfig.expo.version || '1.0.0'} (BUILD 1)
              </Text>
              <Text style={styles.versionSubText}>
                M41 TITHE SPECIFICATION // EXPO 57 // REACT 19
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Save Action Bar */}
      <View style={[styles.saveFooterBar, { paddingBottom: Math.max(14, insets.bottom + 8) }]}>
        <TouchableOpacity
          onPress={handleExplicitSaveSettings}
          style={[styles.saveFooterButton, { backgroundColor: activeAccent }]}
          activeOpacity={0.8}
          accessibilityLabel="Save Tactical Settings"
          accessibilityRole="button"
        >
          <Ionicons name="checkmark-done" size={20} color="#0A0F1D" style={{ marginRight: 8 }} />
          <Text style={styles.saveFooterButtonText}>SAVE SETTINGS</Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================= */}
      {/* MODAL 1: H1 GENERAL APP HELP                              */}
      {/* ========================================================= */}
      <Modal visible={showHelpModal} transparent animationType="slide" onRequestClose={() => setShowHelpModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>TACTICAL TERMINAL // OVERVIEW</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textBright} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ flex: 1, marginVertical: 8 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.guideHeading}>1. HOW GRIMIRON WORKS</Text>
              <Text style={styles.guideBody}>
                GrimIron is a high-intensity workout RPG set in the grim darkness of the 41st Millennium. Every physical exercise set you perform in the gym transforms directly into tactical combat strikes against hostile planetary invaders, sector defense garrisons, and weekly multiplayer boss raids.
              </Text>

              <Text style={styles.guideHeading}>2. GLORY XP & RANK PROMOTION</Text>
              <Text style={styles.guideBody}>
                • Base Completion: +100 XP awarded for every completed workout session.
                {"\n"}• Working Sets: +20 XP per logged set.
                {"\n"}• Repetition Volume: +1 XP per rep logged.
                {"\n"}• Heavy Compound Tonnage: Progressive volume bonus awarded for heavy barbell and dumbbell tonnage.
                {"\n"}• Rank Progression: Earned XP promotes your warrior across 7 tactical rank tiers from Level 1 Initiate to Chapter Master / Warlord.
              </Text>

              <Text style={styles.guideHeading}>3. CAMPAIGNS, THEATERS & ACADEMY</Text>
              <Text style={styles.guideBody}>
                • Planetary Campaigns: Multi-node conquest sectors where consistent training weakens enemy forces node-by-node.
                {"\n"}• 90-Day Crusade Academy: Periodized 3-phase training curriculums (Hypertrophy, Strength, Peak Performance) with milestone boss engagements.
              </Text>

              <Text style={styles.guideHeading}>4. MULTIPLAYER CO-OP RAIDS</Text>
              <Text style={styles.guideBody}>
                Connect to the Crusade Cloud to take down massive weekly raid bosses alongside your battle-brothers. Every workout deal damage directly to the global boss HP pool.
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowHelpModal(false)}
              style={[styles.modalCloseButton, { backgroundColor: activeAccent }]}
            >
              <Text style={styles.modalCloseButtonText}>DISMISS BRIEFING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: H2 WORKOUT LOGGING GUIDE                         */}
      {/* ========================================================= */}
      <Modal visible={showLoggingGuideModal} transparent animationType="slide" onRequestClose={() => setShowLoggingGuideModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>WORKOUT LOGGING // FIELD MANUAL</Text>
              <TouchableOpacity onPress={() => setShowLoggingGuideModal(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textBright} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ flex: 1, marginVertical: 8 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.guideHeading}>RECORDING EXERCISES & SETS</Text>
              <Text style={styles.guideBody}>
                Tap "+ ADD EXERCISE" on the tactical workout screen. Choose from over 60 catalog movements across compound, isolation, and cardio categories, or create custom exercises tailored to your gym equipment.
              </Text>

              <Text style={styles.guideHeading}>LOGGING SETS & ATTACK TRIGGERING</Text>
              <Text style={styles.guideBody}>
                Tap the checkmark on any set when finished. Doing so:
                {"\n"}• Calculates strike damage based on weight moved and reps.
                {"\n"}• Inflicts combat damage on your active target.
                {"\n"}• Automatically fires your rest timer (if enabled in Workout Settings).
                {"\n"}• Checks for new Personal Records (PRs) and triggers achievement medals.
              </Text>

              <Text style={styles.guideHeading}>CALISTHENICS & 0-WEIGHT MOVEMENTS</Text>
              <Text style={styles.guideBody}>
                For bodyweight exercises (such as pull-ups, push-ups, or dips), enter weight as 0. The app awards full repetition XP and honors set completion without penalizing you for lacking external iron.
              </Text>

              <Text style={styles.guideHeading}>UNIT SWITCHING & CONVERSIONS</Text>
              <Text style={styles.guideBody}>
                Switch between LBS and KG on the fly using the unit toggle in Settings or directly during workout entry. Your recorded historical logs retain exact values and convert seamlessly.
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowLoggingGuideModal(false)}
              style={[styles.modalCloseButton, { backgroundColor: activeAccent }]}
            >
              <Text style={styles.modalCloseButtonText}>UNDERSTOOD</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: H3 REPORT A PROBLEM                              */}
      {/* ========================================================= */}
      <Modal visible={showReportModal} transparent animationType="slide" onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>REPORT TACTICAL MALFUNCTION</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textBright} />
              </TouchableOpacity>
            </View>

            {reportSubmittedText ? (
              <View style={{ flex: 1 }}>
                <Text style={[styles.guideHeading, { color: '#00E676', marginTop: 4 }]}>
                  INCIDENT REPORT PREPARED
                </Text>
                <Text style={styles.guideBody}>
                  Review the safe telemetry report below. You can send it directly to developer support via your email app or share it to any service.
                </Text>
                <ScrollView
                  style={[styles.codeBox, { flex: 1 }]}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.codeText}>{reportSubmittedText}</Text>
                </ScrollView>

                <TouchableOpacity
                  onPress={handleSendEmailReport}
                  style={[styles.modalCloseButton, { backgroundColor: activeAccent, marginTop: 10 }]}
                >
                  <Text style={styles.modalCloseButtonText}>TRANSMIT VIA EMAIL APP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareReport}
                  style={[styles.modalCloseButton, { backgroundColor: 'transparent', borderColor: activeAccent, borderWidth: 1, marginTop: 6 }]}
                >
                  <Text style={[styles.modalCloseButtonText, { color: activeAccent }]}>SHARE / EXPORT REPORT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setReportSubmittedText(null)}
                  style={[styles.modalCloseButton, { backgroundColor: 'transparent', borderColor: THEME.colors.surfaceBorder, borderWidth: 1, marginTop: 6 }]}
                >
                  <Text style={[styles.modalCloseButtonText, { color: THEME.colors.textMuted }]}>EDIT DESCRIPTION</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={{ flex: 1, marginVertical: 8 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.settingLabel}>INCIDENT CATEGORY</Text>
                <View style={[styles.segmentedControl, { marginBottom: 14 }]}>
                  {[
                    { id: 'bug', label: 'BUG' },
                    { id: 'balance', label: 'BALANCE' },
                    { id: 'feature', label: 'FEATURE' },
                    { id: 'typo', label: 'TYPO' },
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setReportCategory(cat.id)}
                      style={[
                        styles.segmentButton,
                        reportCategory === cat.id && { backgroundColor: activeAccent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          reportCategory === cat.id && styles.segmentButtonTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.settingLabel}>PROBLEM DESCRIPTION</Text>
                <TextInput
                  style={[styles.textAreaInput, { minHeight: 110 }]}
                  multiline
                  numberOfLines={5}
                  placeholder="Describe what occurred, steps to reproduce, and any error message displayed..."
                  placeholderTextColor={THEME.colors.textMuted}
                  value={reportDescription}
                  onChangeText={setReportDescription}
                />

                <View style={[styles.subSettingRow, { marginTop: 12, borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.subSettingText}>Attach Safe Diagnostics</Text>
                    <Text style={styles.settingSubDescription}>
                      Includes non-sensitive metadata (OS, app version, table metrics). Never transmits passwords or auth tokens.
                    </Text>
                  </View>
                  <Switch
                    value={reportIncludeDiagnostics}
                    onValueChange={setReportIncludeDiagnostics}
                    trackColor={{ false: '#1E293B', true: activeAccent }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Direct Action Buttons */}
                <TouchableOpacity
                  onPress={handleSendEmailReport}
                  style={[styles.modalCloseButton, { backgroundColor: activeAccent, marginTop: 16 }]}
                >
                  <Text style={styles.modalCloseButtonText}>TRANSMIT REPORT VIA EMAIL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareReport}
                  style={[styles.modalCloseButton, { backgroundColor: 'transparent', borderColor: activeAccent, borderWidth: 1, marginTop: 8 }]}
                >
                  <Text style={[styles.modalCloseButtonText, { color: activeAccent }]}>SHARE / EXPORT REPORT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (!reportDescription.trim()) {
                      Alert.alert('Description Required', 'Please enter a description of the issue.');
                      return;
                    }
                    const formatted = formatDiagnosticReport(
                      reportDescription,
                      reportCategory,
                      reportIncludeDiagnostics
                    );
                    setReportSubmittedText(formatted);
                    triggerHaptic.selection();
                  }}
                  style={[styles.modalCloseButton, { backgroundColor: 'transparent', borderColor: THEME.colors.surfaceBorder, borderWidth: 1, marginTop: 8 }]}
                >
                  <Text style={[styles.modalCloseButtonText, { color: THEME.colors.textMuted }]}>PREVIEW TELEMETRY TEXT</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: H4 DIAGNOSTICS INSPECTOR                         */}
      {/* ========================================================= */}
      <Modal visible={showDiagnosticsModal} transparent animationType="slide" onRequestClose={() => setShowDiagnosticsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SYSTEM DIAGNOSTICS & TELEMETRY</Text>
              <TouchableOpacity onPress={() => setShowDiagnosticsModal(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textBright} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ flex: 1, marginVertical: 8 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {currentDiagnostics && (
                <View style={{ paddingVertical: 4 }}>
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>App Build:</Text>
                    <Text style={styles.diagVal}>v{currentDiagnostics.appVersion} (Expo {currentDiagnostics.expoVersion})</Text>
                  </View>
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Platform / OS:</Text>
                    <Text style={styles.diagVal}>{currentDiagnostics.platform}</Text>
                  </View>
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Storage Engine:</Text>
                    <Text style={styles.diagVal}>{currentDiagnostics.databaseStatus}</Text>
                  </View>
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Warrior Profile:</Text>
                    <Text style={styles.diagVal}>{currentDiagnostics.characterSummary || character.characterName}</Text>
                  </View>
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Completed Workouts:</Text>
                    <Text style={styles.diagVal}>{currentDiagnostics.totalWorkouts}</Text>
                  </View>
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Completed Sets:</Text>
                    <Text style={styles.diagVal}>{currentDiagnostics.totalSetsCompleted ?? 0} sets</Text>
                  </View>
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Total Volume Moved:</Text>
                    <Text style={styles.diagVal}>{currentDiagnostics.totalVolumeLbs ? `${currentDiagnostics.totalVolumeLbs.toLocaleString()} lbs` : '0 lbs'}</Text>
                  </View>
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Custom Subfactions:</Text>
                    <Text style={styles.diagVal}>{currentDiagnostics.totalCustomSubfactions}</Text>
                  </View>
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Medals Awarded:</Text>
                    <Text style={styles.diagVal}>{currentDiagnostics.totalAchievementsAwarded}</Text>
                  </View>
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Cloud Sync Status:</Text>
                    <Text style={[styles.diagVal, { color: currentDiagnostics.cloudSyncConfigured ? '#00E676' : '#EAB308' }]}>
                      {currentDiagnostics.cloudSyncConfigured ? 'Configured & Active' : 'Local Offline Mode'}
                    </Text>
                  </View>
                  {accountInfo?.email && (
                    <View style={styles.diagRow}>
                      <Text style={styles.diagLabel}>Crusade Cloud Email:</Text>
                      <Text style={[styles.diagVal, { color: '#00F0FF' }]}>{accountInfo.email}</Text>
                    </View>
                  )}
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Timestamp:</Text>
                    <Text style={styles.diagVal}>{currentDiagnostics.timestamp}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={handleShareDiagnostics}
              style={[styles.modalCloseButton, { backgroundColor: activeAccent, marginTop: 8 }]}
            >
              <Text style={styles.modalCloseButtonText}>SHARE / EXPORT TELEMETRY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDiagnosticsModal(false)}
              style={[styles.modalCloseButton, { backgroundColor: 'transparent', borderColor: THEME.colors.surfaceBorder, borderWidth: 1, marginTop: 6 }]}
            >
              <Text style={[styles.modalCloseButtonText, { color: THEME.colors.textMuted }]}>DISMISS DIAGNOSTICS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 5: H7 PRIVACY & DATA INFORMATION                    */}
      {/* ========================================================= */}
      <Modal visible={showPrivacyDocModal} transparent animationType="slide" onRequestClose={() => setShowPrivacyDocModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PRIVACY & DATA STORAGE DISCLOSURE</Text>
              <TouchableOpacity onPress={() => setShowPrivacyDocModal(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textBright} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ flex: 1, marginVertical: 8 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.guideHeading}>1. LOCAL-FIRST SQLITE STORAGE</Text>
              <Text style={styles.guideBody}>
                All workouts, sets, reps, weights, custom exercises, custom subfactions, and progression medals are persisted locally in SQLite on your physical device drive. The app operates 100% offline without requiring internet connectivity.
              </Text>

              <Text style={styles.guideHeading}>2. CO-OP SQUAD PRIVACY</Text>
              <Text style={styles.guideBody}>
                In cooperative multiplayer boss raids, only aggregate combat damage numbers, attack names, and warrior callsigns are transmitted. Your private gym notes, set counts, and specific weights are never broadcast to squad mates.
              </Text>

              <Text style={styles.guideHeading}>3. CLOUD ENCRYPTION & DATA ERASURE</Text>
              <Text style={styles.guideBody}>
                Cloud account passwords are encrypted and managed using Supabase Auth industry-standard bcrypt encryption. Using "PURGE & DELETE ACCOUNT DATA" permanently wipes all local SQLite tables and resets your warrior profile to initiate status.
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowPrivacyDocModal(false)}
              style={[styles.modalCloseButton, { backgroundColor: activeAccent }]}
            >
              <Text style={styles.modalCloseButtonText}>ACKNOWLEDGE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 6: EDIT CALLSIGN                                    */}
      {/* ========================================================= */}
      <Modal visible={showCallsignModal} transparent animationType="slide" onRequestClose={() => setShowCallsignModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.compactModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SET WARRIOR CALLSIGN</Text>
              <TouchableOpacity onPress={() => setShowCallsignModal(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textBright} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.guideBody}>
                This name represents your warrior on mission dossiers, multiplayer co-op battle logs, raid leaderboards, and combat reports.
              </Text>
              <Text style={styles.settingLabel}>CALLSIGN / WARRIOR NAME</Text>
              <TextInput
                style={styles.textInput}
                value={tempCallsign}
                onChangeText={setTempCallsign}
                placeholder="e.g. Captain Titus"
                placeholderTextColor={THEME.colors.textMuted}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleSaveCallsign}
                style={[styles.modalCloseButton, { backgroundColor: activeAccent, marginTop: 16 }]}
              >
                <Text style={styles.modalCloseButtonText}>SAVE CALLSIGN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCallsignModal(false)}
                style={[styles.modalCloseButton, { backgroundColor: 'transparent', borderColor: THEME.colors.surfaceBorder, borderWidth: 1 }]}
              >
                <Text style={[styles.modalCloseButtonText, { color: THEME.colors.textMuted }]}>CANCEL</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 7: CRUSADE CLOUD ACCOUNT (SIGN IN / REGISTER)       */}
      {/* ========================================================= */}
      <Modal visible={showAuthModal} transparent animationType="slide" onRequestClose={() => setShowAuthModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CRUSADE NETWORK AUTHENTICATION</Text>
              <TouchableOpacity onPress={() => setShowAuthModal(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textBright} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.guideBody}>
                Connect to the Crusade Network to sync your profile across devices and fight in cooperative multiplayer boss raids with your squad.
              </Text>

              {/* Tab Selector: Sign In vs Create Account */}
              <View style={styles.authTabs}>
                <TouchableOpacity
                  onPress={() => {
                    setAuthMode('signin');
                    setAuthError(null);
                  }}
                  style={[styles.authTab, authMode === 'signin' && styles.authTabActive]}
                >
                  <Text style={[styles.authTabText, authMode === 'signin' && styles.authTabTextActive]}>
                    SIGN IN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                  }}
                  style={[styles.authTab, authMode === 'signup' && styles.authTabActive]}
                >
                  <Text style={[styles.authTabText, authMode === 'signup' && styles.authTabTextActive]}>
                    CREATE ACCOUNT
                  </Text>
                </TouchableOpacity>
              </View>

              {authError && (
                <View style={styles.authErrorBox}>
                  <Text style={styles.authErrorText}>{authError}</Text>
                </View>
              )}

              {authMode === 'signup' && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.settingLabel}>WARRIOR CALLSIGN</Text>
                  <TextInput
                    style={styles.textInput}
                    value={authCallsign}
                    onChangeText={setAuthCallsign}
                    placeholder="e.g. Brother Ironjaw"
                    placeholderTextColor={THEME.colors.textMuted}
                  />
                </View>
              )}

              <View style={{ marginBottom: 10 }}>
                <Text style={styles.settingLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.textInput}
                  value={authEmail}
                  onChangeText={setAuthEmail}
                  placeholder="warrior@crusade.net"
                  placeholderTextColor={THEME.colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={styles.settingLabel}>PASSWORD</Text>
                <TextInput
                  style={styles.textInput}
                  value={authPassword}
                  onChangeText={setAuthPassword}
                  placeholder="••••••••"
                  placeholderTextColor={THEME.colors.textMuted}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                onPress={handleAuthSubmit}
                disabled={authLoading}
                style={[styles.modalCloseButton, { backgroundColor: activeAccent, marginTop: 14 }]}
              >
                <Text style={styles.modalCloseButtonText}>
                  {authLoading
                    ? 'AUTHENTICATING...'
                    : authMode === 'signin'
                    ? 'SIGN IN TO CRUSADE NETWORK'
                    : 'REGISTER WARRIOR ACCOUNT'}
                </Text>
              </TouchableOpacity>

              {authMode === 'signup' && authEmail.trim().length > 3 && (
                <TouchableOpacity
                  onPress={async () => {
                    setAuthLoading(true);
                    try {
                      const res = await resendVerificationEmailAction(authEmail.trim());
                      if (res.success) {
                        triggerHaptic.success();
                        Alert.alert('Verification Transmission', res.message);
                      } else {
                        setAuthError(res.message);
                      }
                    } catch (e: any) {
                      setAuthError(e?.message || 'Failed to dispatch verification email.');
                    } finally {
                      setAuthLoading(false);
                    }
                  }}
                  style={{ marginTop: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFB800', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' }}>
                    DIDN'T RECEIVE EMAIL? RESEND VERIFICATION
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setShowAuthModal(false)}
                style={[styles.modalCloseButton, { backgroundColor: 'transparent', borderColor: THEME.colors.surfaceBorder, borderWidth: 1 }]}
              >
                <Text style={[styles.modalCloseButtonText, { color: THEME.colors.textMuted }]}>
                  CANCEL
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tactical Walkthrough Modal */}
      <TacticalWalkthroughModal
        visible={showWalkthroughModal}
        onClose={() => setShowWalkthroughModal(false)}
        currentCallsign={character.characterName}
        onSaveCallsign={updateCharacterNameAction}
        onCompleteOnboarding={() => updateSetting('onboarding_completed', true)}
        onOpenCloudAuth={() => {
          setShowWalkthroughModal(false);
          setActiveCategory('privacy');
          setAuthMode('signup');
          setAuthEmail('');
          setAuthPassword('');
          setAuthCallsign(character.characterName);
          setAuthError(null);
          setShowAuthModal(true);
        }}
        isCloudAuthenticated={accountInfo?.isCloudAuthenticated || false}
        cloudEmail={accountInfo?.email}
        onSignUpCloud={signUpCloudAccount}
        onSignInCloud={signInCloudAccount}
        onResendVerification={resendVerificationEmailAction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: '#0A0F1D',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resetButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 5,
    borderWidth: 1,
    gap: 4,
  },
  headerSaveButtonText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071520',
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  savedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  saveFooterBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#0A0F1D',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
  },
  saveFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveFooterButtonText: {
    color: '#0A0F1D',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  authoritativeDirectiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070C18',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 12,
  },
  authoritativeDirectiveTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  authoritativeDirectiveSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  categoryBar: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: '#070B14',
  },
  categoryPillsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    backgroundColor: '#0F172A',
    gap: 6,
  },
  categoryPillText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    padding: 16,
  },
  sectionGroup: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  settingCard: {
    backgroundColor: '#0E1526',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: 14,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E1526',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: 14,
    marginBottom: 12,
  },
  settingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingLabel: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  settingDescription: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  settingSubDescription: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  subSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  subSettingText: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#070B14',
    borderRadius: 6,
    padding: 3,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  segmentButtonText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  segmentButtonTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    backgroundColor: '#070B14',
  },
  chipButtonText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  chipButtonTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    backgroundColor: '#070B14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  dayCircleTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  colorChip: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChipSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  colorSelectedLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#070B14',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginTop: 6,
  },
  languageBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verticalOptions: {
    gap: 8,
  },
  verticalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    backgroundColor: '#070B14',
  },
  verticalOptionTitle: {
    color: THEME.colors.textBright,
    fontSize: 11,
    fontWeight: '800',
  },
  verticalOptionDesc: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#070B14',
    gap: 8,
  },
  actionButtonText: {
    color: THEME.colors.textBright,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  menuLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1526',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: 14,
    marginBottom: 10,
  },
  menuLinkTitle: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  menuLinkSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  infoBannerText: {
    color: THEME.colors.textBright,
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  infoValue: {
    color: THEME.colors.textBright,
    fontSize: 11,
    fontWeight: '700',
  },
  versionFooter: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  versionText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  versionSubText: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 9,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#0A0F1D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: 18,
    width: '100%',
    height: '82%',
    maxHeight: '88%',
    display: 'flex',
    flexDirection: 'column',
  },
  compactModalContent: {
    backgroundColor: '#0A0F1D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: 18,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    marginBottom: 12,
  },
  modalTitle: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  guideHeading: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  guideBody: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  textAreaInput: {
    backgroundColor: '#070B14',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    color: THEME.colors.textBright,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  textInput: {
    backgroundColor: '#070B14',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    color: THEME.colors.textBright,
    padding: 10,
    fontSize: 14,
    marginTop: 6,
  },
  codeBox: {
    backgroundColor: '#050811',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: 10,
    marginVertical: 10,
  },
  codeText: {
    color: '#00F0FF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    lineHeight: 14,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  diagLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  diagVal: {
    color: THEME.colors.textBright,
    fontSize: 11,
    fontWeight: '700',
  },
  authTabs: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  authTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#070B14',
  },
  authTabActive: {
    backgroundColor: '#1E293B',
  },
  authTabText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  authTabTextActive: {
    color: '#FFFFFF',
  },
  authErrorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  authErrorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
});
