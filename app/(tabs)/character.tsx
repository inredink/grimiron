import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { THEME } from '../../src/constants/theme';
import { SciFiCard } from '../../src/components/SciFiCard';
import { ProgressBar } from '../../src/components/ProgressBar';
import { Badge } from '../../src/components/Badge';
import { PlaceholderPortrait } from '../../src/components/PlaceholderPortrait';
import { TerminalButton } from '../../src/components/TerminalButton';
import { EquipmentSlotCard } from '../../src/components/EquipmentSlotCard';
import { EquipmentInventoryModal } from '../../src/components/EquipmentInventoryModal';
import { EquipmentSlot } from '../../src/types/equipment';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../src/utils/haptics';
import { getRankForXp } from '../../src/content/warhammer40k';
import { getAcquiredTitles, TitleOption } from '../../src/services/progression/titleService';
import { getCodexPrSummary, CodexPrSummary } from '../../src/services/database/prRepository';
import { COMBAT_DOCTRINES, CombatDoctrine, getCombatDoctrineById } from '../../src/services/combat/doctrineService';
import { computePledgeProgress, PledgeProgressView } from '../../src/services/progression/pledgeService';
import { getAllKnownNamedBossesWithStatus, NamedEnemyTarget, DefeatedNamedEnemy } from '../../src/services/database/namedEnemyRepository';
import { WeightGoalType } from '../../src/types/biometrics';

export default function CharacterTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    character,
    progression,
    stats,
    currentFaction,
    currentSubfaction,
    inventory,
    loadout,
    equippedItems,
    equipmentBonuses,
    gearPowerInfo,
    raidProgression,
    equipItemAction,
    unequipItemAction,
    clearEquipmentAction,
    updateCharacterNameAction,
    updatePreferredTitleAction,
    updateCombatDoctrineAction,
    activePledge,
    claimPledgeRewardAction,
    defeatedNamedEnemies,
    refreshDefeatedNamedEnemies,
    campaignTelemetry,
    dailyStepRecord,
    stepMilestones,
    lifetimeTotalSteps,
    weightAnalytics,
    weightHistory,
    isWellRested,
    hasReconIntel,
    syncStepsAction,
    logManualStepsAction,
    logBodyweightAction,
    setBodyweightGoalAction,
    logSleepAction,
    refreshBiometricsAction,
    autoStasisNotice,
    dismissAutoStasisNotice,
  } = useApp();

  // Modals state
  const [isEquipmentModalVisible, setIsEquipmentModalVisible] = useState(false);
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] = useState<EquipmentSlot | undefined>(undefined);
  const [isTitleModalVisible, setIsTitleModalVisible] = useState(false);
  const [isCallsignModalVisible, setIsCallsignModalVisible] = useState(false);
  const [newCallsignInput, setNewCallsignInput] = useState(character.characterName);
  const [isCodexMortisModalVisible, setIsCodexMortisModalVisible] = useState(false);
  const [selectedBossDetail, setSelectedBossDetail] = useState<NamedEnemyTarget | null>(null);
  const [codexMortisTab, setCodexMortisTab] = useState<'slain' | 'targets'>('slain');

  // Biometrics Modals state
  const [isStepModalVisible, setIsStepModalVisible] = useState(false);
  const [stepInput, setStepInput] = useState('');
  const [isMilestonesModalVisible, setIsMilestonesModalVisible] = useState(false);
  const [isWeighInModalVisible, setIsWeighInModalVisible] = useState(false);
  const [weighInInput, setWeighInInput] = useState('');
  const [weighInNotesInput, setWeighInNotesInput] = useState('');
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [goalTypeInput, setGoalTypeInput] = useState<WeightGoalType>(weightAnalytics.goalType || 'maintenance');
  const [goalTargetWeightInput, setGoalTargetWeightInput] = useState(weightAnalytics.targetWeight ? String(weightAnalytics.targetWeight) : '');
  const [goalRatePercentInput, setGoalRatePercentInput] = useState(String(weightAnalytics.weeklyRatePercent || 0));
  const [isSleepModalVisible, setIsSleepModalVisible] = useState(false);
  const [sleepHoursInput, setSleepHoursInput] = useState('8.0');

  // PR Summary State
  const [prSummary, setPrSummary] = useState<CodexPrSummary>(() => getCodexPrSummary());

  useEffect(() => {
    setPrSummary(getCodexPrSummary());
  }, [stats.totalSets]);

  // Titles
  const acquiredTitles = useMemo(() => {
    return getAcquiredTitles(
      character,
      progression,
      raidProgression as any,
      campaignTelemetry?.completedProgramSessionsCount || 0,
      stats.totalWorkouts || 0
    );
  }, [character, progression, raidProgression, campaignTelemetry, stats.totalWorkouts]);

  const activeTitle = character.preferredTitle || progression.currentRankTitle || 'Battle-Brother';

  // Combat Doctrine
  const activeDoctrine: CombatDoctrine = useMemo(() => {
    return getCombatDoctrineById(character.combatDoctrine || 'iron_juggernaut');
  }, [character.combatDoctrine]);

  // Faction Weekly Pledge
  const pledgeProgress: PledgeProgressView = useMemo(() => {
    return computePledgeProgress(activePledge, currentFaction.id);
  }, [activePledge, currentFaction.id]);

  // Named Bosses & Nemesis Targets
  const allKnownBosses = useMemo(() => {
    return getAllKnownNamedBossesWithStatus();
  }, [defeatedNamedEnemies]);

  const slainBosses = useMemo(() => {
    return allKnownBosses.filter((b) => b.isDefeated);
  }, [allKnownBosses]);

  const unslainTargets = useMemo(() => {
    return allKnownBosses.filter((b) => !b.isDefeated);
  }, [allKnownBosses]);

  // Current rank object
  const currentRank = getRankForXp(currentFaction, character.totalXp).currentRank;

  const handleSaveCallsign = async () => {
    const trimmed = newCallsignInput.trim();
    if (trimmed.length > 0) {
      triggerHaptic.success();
      await updateCharacterNameAction(trimmed);
      setIsCallsignModalVisible(false);
    }
  };

  const handleSelectTitle = (title: string) => {
    triggerHaptic.selection();
    updatePreferredTitleAction(title);
    setIsTitleModalVisible(false);
  };

  const handleSelectDoctrine = (doctrineId: string) => {
    triggerHaptic.selection();
    updateCombatDoctrineAction(doctrineId);
  };

  const handleClaimPledge = () => {
    triggerHaptic.success();
    const result = claimPledgeRewardAction();
    if (result.success) {
      Alert.alert(
        'Pledge Honored!',
        `Your steadfast devotion has been recorded in the imperial annals! Awarded +${result.xpEarned} Glory XP.`
      );
    }
  };

  // Biometrics & Recon Milestones
  const nextMilestone = useMemo(() => {
    return stepMilestones.find((m) => !m.achievedAt) || null;
  }, [stepMilestones]);

  const handleSaveSteps = () => {
    const val = parseInt(stepInput.trim(), 10);
    if (!isNaN(val) && val >= 0) {
      triggerHaptic.success();
      const res = logManualStepsAction(val);
      setIsStepModalVisible(false);
      setStepInput('');
      if (res.newlyAwardedXp > 0) {
        Alert.alert(
          'Forced March Quota Met!',
          `Awarded +${res.newlyAwardedXp} Discipline XP and Field Recon Intel (+5% Tactical Combat Damage)!`
        );
      }
    } else {
      Alert.alert('Invalid Steps', 'Please enter a valid step count.');
    }
  };

  const handleSyncPedometer = async () => {
    triggerHaptic.selection();
    await syncStepsAction();
    Alert.alert('Sensors Synchronized', 'Hardware pedometer registers updated.');
  };

  const handleSaveWeighIn = () => {
    const val = parseFloat(weighInInput.trim());
    if (!isNaN(val) && val > 0) {
      triggerHaptic.success();
      const res = logBodyweightAction(val, weighInNotesInput.trim() || undefined);
      setIsWeighInModalVisible(false);
      setWeighInInput('');
      setWeighInNotesInput('');
      if (res.auxXpAwarded > 0) {
        Alert.alert(
          'Biomarker Recorded',
          `Scaled weight recorded with 7-day EMA smoothing. Awarded +${res.auxXpAwarded} Discipline XP!`
        );
      } else {
        Alert.alert('Biomarker Updated', 'Scaled weight and 7-day trend EMA updated.');
      }
    } else {
      Alert.alert('Invalid Weight', 'Please enter a valid numeric bodyweight.');
    }
  };

  const handleSaveGoal = () => {
    const targetW = goalTargetWeightInput.trim() ? parseFloat(goalTargetWeightInput.trim()) : null;
    const rateP = parseFloat(goalRatePercentInput.trim()) || 0;
    triggerHaptic.success();
    setBodyweightGoalAction({
      goalType: goalTypeInput,
      targetWeight: targetW && !isNaN(targetW) ? targetW : null,
      weeklyRatePercent: !isNaN(rateP) ? rateP : 0,
    });
    setIsGoalModalVisible(false);
    Alert.alert('Goal Updated', 'Corporeal composition directives updated.');
  };

  const handleSaveSleep = () => {
    const val = parseFloat(sleepHoursInput.trim());
    if (!isNaN(val) && val >= 0 && val <= 24) {
      triggerHaptic.success();
      const res = logSleepAction(val);
      setIsSleepModalVisible(false);
      setSleepHoursInput('');
      if (res.isWellRested) {
        Alert.alert(
          'Stasis Well-Rested!',
          `Adequate stasis cycle logged (${val}h). +${res.auxXpAwarded} Discipline XP awarded and +5% Stasis Combat Buff active for your next crusade!`
        );
      } else {
        Alert.alert('Stasis Recorded', `${val}h stasis cycle logged. Stasis recovery requires >= 7.0h for combat buff.`);
      }
    } else {
      Alert.alert('Invalid Duration', 'Please enter a valid number of hours (0 - 24).');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(60, insets.bottom + 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Terminal Sub-header */}
        <View style={styles.terminalHeader}>
          <View style={styles.terminalStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.terminalStatusText}>WARRIOR CODEX // SERVICE RECORD</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic.selection();
              router.push('/settings');
            }}
            style={styles.settingsHeaderButton}
            accessibilityLabel="Open Settings"
            accessibilityRole="button"
          >
            <Ionicons name="settings-sharp" size={16} color={THEME.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Character Hero Dossier Card */}
        <SciFiCard variant="accent" style={styles.heroCard}>
          <View style={styles.heroContent}>
            {/* 2D Portrait with Reticle */}
            <PlaceholderPortrait
              faction={currentFaction}
              subfaction={currentSubfaction}
              currentRank={currentRank}
              level={progression.level}
              size={110}
            />

            {/* Profile Info */}
            <View style={styles.heroDetails}>
              <View style={styles.badgeRow}>
                <Badge
                  label={currentFaction.allegiance}
                  variant={currentFaction.allegiance as any}
                />
                <Badge
                  label={`TIER ${progression.currentRankTier}`}
                  variant="primary"
                  style={{ marginLeft: 6 }}
                />
              </View>

              {/* Callsign + Edit Button */}
              <TouchableOpacity
                onPress={() => {
                  setNewCallsignInput(character.characterName);
                  setIsCallsignModalVisible(true);
                }}
                style={styles.callsignRow}
                activeOpacity={0.7}
              >
                <Text style={styles.callsignText} numberOfLines={1}>
                  {character.characterName.toUpperCase()}
                </Text>
                <Ionicons name="pencil" size={13} color={THEME.colors.primary} style={{ marginLeft: 6 }} />
              </TouchableOpacity>

              {/* Preferred Title Selector Badge */}
              <TouchableOpacity
                onPress={() => setIsTitleModalVisible(true)}
                style={styles.titleBadgeContainer}
                activeOpacity={0.7}
              >
                <Ionicons name="ribbon-outline" size={13} color="#FFD700" style={{ marginRight: 4 }} />
                <Text style={styles.titleBadgeText} numberOfLines={1}>
                  « {activeTitle} »
                </Text>
                <Ionicons name="chevron-down" size={12} color="#FFD700" style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              {/* Faction and Subfaction */}
              <View style={styles.factionMetaRow}>
                <Text style={styles.factionNameText} numberOfLines={1}>
                  {currentFaction.name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic.selection();
                    router.push('/factions');
                  }}
                  style={styles.switchFactionBtn}
                >
                  <Text style={styles.switchFactionBtnText}>CHANGE</Text>
                </TouchableOpacity>
              </View>

              {currentSubfaction && (
                <Text style={styles.subfactionNameText} numberOfLines={1}>
                  {currentSubfaction.name}
                </Text>
              )}
            </View>
          </View>

          {/* Level Progress */}
          <View style={styles.progressSection}>
            <ProgressBar
              progress={progression.progressPercent}
              label={`Level ${progression.level} Progression`}
              valueText={`${progression.xpInCurrentLevel} / ${progression.xpNeededForNextLevel + progression.xpInCurrentLevel} XP (${progression.progressPercent}%)`}
              color={THEME.colors.primary}
              height={8}
            />
            <Text style={styles.xpTotalText}>
              Cumulative Glory: <Text style={styles.xpHighlight}>{character.totalXp.toLocaleString()} XP</Text>
            </Text>
          </View>
        </SciFiCard>

        {/* Equipped Arsenal & Wargear Card */}
        <EquipmentSlotCard
          factionId={currentFaction.id}
          loadout={loadout}
          equippedItems={equippedItems}
          equipmentBonuses={equipmentBonuses}
          gearPower={gearPowerInfo.gearPower}
          gearTierLabel={gearPowerInfo.primaryTierLabel}
          onOpenInventory={(slot) => {
            setSelectedEquipmentSlot(slot);
            setIsEquipmentModalVisible(true);
          }}
        />

        {/* Codex Mortis: Named Enemies & Raid Bosses */}
        <SciFiCard
          title="CODEX MORTIS // NEMESIS LEDGER"
          variant="normal"
          rightAction={
            <TouchableOpacity
              onPress={() => setIsCodexMortisModalVisible(true)}
              style={styles.codexMortisTag}
            >
              <Text style={styles.codexMortisTagText}>
                {slainBosses.length} SLAIN / {allKnownBosses.length} TARGETS
              </Text>
            </TouchableOpacity>
          }
        >
          <Text style={styles.codexMortisDesc}>
            Persistent chronicle of unique named warlords and raid bosses. Slain named hostiles are permanently eradicated and never respawn for your crusade.
          </Text>

          <View style={styles.codexMortisStatsRow}>
            <View style={styles.codexStatBox}>
              <Ionicons name="skull" size={22} color="#EF4444" />
              <Text style={styles.codexStatValue}>{slainBosses.length}</Text>
              <Text style={styles.codexStatLabel}>VANQUISHED</Text>
            </View>

            <View style={styles.codexStatBox}>
              <Ionicons name="locate-outline" size={22} color="#FFB800" />
              <Text style={styles.codexStatValue}>{unslainTargets.length}</Text>
              <Text style={styles.codexStatLabel}>AT LARGE</Text>
            </View>

            <View style={styles.codexStatBox}>
              <Ionicons name="shield-checkmark" size={22} color="#00E676" />
              <Text style={styles.codexStatValue}>
                {allKnownBosses.length > 0 ? Math.round((slainBosses.length / allKnownBosses.length) * 100) : 0}%
              </Text>
              <Text style={styles.codexStatLabel}>SECTOR PURGE</Text>
            </View>
          </View>

          <TerminalButton
            title={`INSPECT CODEX MORTIS (${slainBosses.length} SLAIN)`}
            onPress={() => setIsCodexMortisModalVisible(true)}
            variant="secondary"
            size="md"
            icon={<Ionicons name="book-outline" size={17} color={THEME.colors.primary} />}
            style={{ marginTop: 10 }}
          />
        </SciFiCard>

        {/* Halls of Valor // Codex PRs (Idea #2) */}
        <SciFiCard
          title="HALLS OF VALOR // CODEX PRs"
          rightAction={
            <View style={[styles.titanBadge, { borderColor: prSummary.titanRating.badgeColor }]}>
              <Ionicons name="fitness" size={12} color={prSummary.titanRating.badgeColor} style={{ marginRight: 4 }} />
              <Text style={[styles.titanBadgeText, { color: prSummary.titanRating.badgeColor }]}>
                {prSummary.titanRating.ratingTitle.toUpperCase()}
              </Text>
            </View>
          }
        >
          <Text style={styles.prSummaryDesc}>
            Titan strength rating derived from completed compound sets in your crusade history.
          </Text>

          <View style={styles.liftsGrid}>
            {prSummary.lifts.map((lift) => (
              <View key={lift.key} style={styles.liftPrCard}>
                <View style={styles.liftHeaderRow}>
                  <Text style={styles.liftCategory}>{lift.category.toUpperCase()}</Text>
                  {lift.hasRecord && (
                    <Text style={styles.liftSetsBadge}>{lift.totalSetsLogged} SETS</Text>
                  )}
                </View>
                <Text style={styles.liftName}>{lift.name}</Text>
                {lift.hasRecord ? (
                  <View style={styles.liftStatsRow}>
                    <View>
                      <Text style={styles.liftMetricValue}>
                        {lift.bestWeightLbs} <Text style={styles.liftUnit}>lbs</Text>
                      </Text>
                      <Text style={styles.liftMetricLabel}>
                        {lift.repsAtBestWeight} reps ({lift.bestWeightKg} kg)
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.liftMetricValue, { color: '#00F0FF' }]}>
                        {lift.estimated1RmLbs} <Text style={styles.liftUnit}>lbs</Text>
                      </Text>
                      <Text style={styles.liftMetricLabel}>EST. 1RM ({lift.estimated1RmKg} kg)</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noLiftRecordText}>No working sets logged yet</Text>
                )}
              </View>
            ))}
          </View>
        </SciFiCard>

        {/* Combat Doctrines & Training Stances (Idea #3) */}
        <SciFiCard
          title="COMBAT DOCTRINE // TACTICAL STANCE"
          rightAction={
            <View style={[styles.activeDoctrineTag, { borderColor: activeDoctrine.color }]}>
              <Text style={[styles.activeDoctrineTagText, { color: activeDoctrine.color }]}>
                {activeDoctrine.name.toUpperCase()}
              </Text>
            </View>
          }
        >
          <Text style={styles.doctrineDesc}>
            Select your primary combat doctrine. Each stance grants active combat buffs scaled to your training methodology.
          </Text>

          {COMBAT_DOCTRINES.map((doc) => {
            const isSelected = activeDoctrine.id === doc.id;
            return (
              <TouchableOpacity
                key={doc.id}
                onPress={() => handleSelectDoctrine(doc.id)}
                style={[
                  styles.doctrineOptionCard,
                  isSelected && { borderColor: doc.color, backgroundColor: '#0B1322' },
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.doctrineCardTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons
                      name={doc.icon as any}
                      size={20}
                      color={doc.color}
                      style={{ marginRight: 8 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.doctrineName, isSelected && { color: doc.color }]}>
                        {doc.name}
                      </Text>
                      <Text style={styles.doctrineTagline}>{doc.tagline}</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? doc.color : THEME.colors.textMuted}
                  />
                </View>

                <View style={[styles.doctrinePerkBox, { borderColor: `${doc.color}55` }]}>
                  <Ionicons name="flash-outline" size={14} color={doc.color} style={{ marginRight: 6 }} />
                  <Text style={[styles.doctrinePerkText, { color: doc.color }]}>
                    {doc.tacticalPerk}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </SciFiCard>

        {/* Faction Pledges of War / Weekly Oaths (Idea #4) */}
        <SciFiCard
          title={`WEEKLY PLEDGE // ${pledgeProgress.skin.pledgeTitle}`}
          variant="accent"
          rightAction={
            <Text style={styles.pledgeWeekTag}>{pledgeProgress.pledge.weekId}</Text>
          }
        >
          <Text style={styles.pledgeSubtitle}>{pledgeProgress.skin.allegianceSubtitle}</Text>
          <Text style={styles.pledgeQuote}>"{pledgeProgress.skin.loreQuote}"</Text>

          <View style={styles.pledgeProgressBox}>
            <ProgressBar
              progress={pledgeProgress.workoutProgressPercent}
              label="Weekly Crusade Quota"
              valueText={`${pledgeProgress.completedWorkouts} / ${pledgeProgress.pledge.targetWorkouts} Crusades (${pledgeProgress.workoutProgressPercent}%)`}
              color={pledgeProgress.skin.primaryColor}
              height={8}
            />

            <View style={styles.pledgeStatsRow}>
              <Text style={styles.pledgeTonnageText}>
                Weekly Tonnage: <Text style={{ color: THEME.colors.textBright }}>{pledgeProgress.completedVolumeKg.toLocaleString()} kg</Text>
              </Text>
              <Text style={styles.pledgeBountyText}>
                Bounty: <Text style={{ color: THEME.colors.primary }}>+{pledgeProgress.pledge.rewardGloryXp} Glory XP</Text>
              </Text>
            </View>
          </View>

          {pledgeProgress.canClaim ? (
            <TerminalButton
              title="CLAIM WEEKLY PLEDGE GLORY BOUNTY"
              onPress={handleClaimPledge}
              variant="primary"
              size="md"
              icon={<Ionicons name="trophy" size={18} color="#0A0E17" />}
              style={{ marginTop: 10 }}
            />
          ) : pledgeProgress.pledge.isClaimed ? (
            <View style={styles.pledgeClaimedRow}>
              <Ionicons name="checkmark-circle" size={16} color="#00E676" />
              <Text style={styles.pledgeClaimedText}>Weekly dedication fulfilled and bounty claimed.</Text>
            </View>
          ) : (
            <Text style={styles.pledgeRemainingText}>
              Log {pledgeProgress.pledge.targetWorkouts - pledgeProgress.completedWorkouts} more workout{pledgeProgress.pledge.targetWorkouts - pledgeProgress.completedWorkouts === 1 ? '' : 's'} this week to fulfill your oath.
            </Text>
          )}
        </SciFiCard>

        {/* Apothecarion // Biometric Registers & Forced March */}
        <SciFiCard
          title="APOTHECARION // BIOMETRIC & RECON REGISTERS"
          variant="normal"
          rightAction={
            hasReconIntel ? (
              <View style={styles.reconBuffTag}>
                <Ionicons name="radio-outline" size={12} color="#00E676" style={{ marginRight: 4 }} />
                <Text style={styles.reconBuffTagText}>RECON BUFF ACTIVE (+5%)</Text>
              </View>
            ) : undefined
          }
        >
          <Text style={styles.biometricDesc}>
            Internal phone telemetry registers. Tracks daily forced march steps, 7-day trend smoothed weight goals, and stasis restoration cycles.
          </Text>

          {/* 1. Field Recon // Pedometer Steps */}
          <View style={styles.bioSubSection}>
            <View style={styles.bioSectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="footsteps-outline" size={16} color={THEME.colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.bioSubSectionTitle}>FORCED MARCH // DAILY STEPS</Text>
              </View>
              <Text style={styles.bioSubSectionMeta}>
                {dailyStepRecord ? `${dailyStepRecord.steps.toLocaleString()} / ${dailyStepRecord.dailyTarget.toLocaleString()} STEPS` : '0 / 10,000 STEPS'}
              </Text>
            </View>

            <ProgressBar
              progress={
                dailyStepRecord
                  ? Math.min(100, Math.round((dailyStepRecord.steps / (dailyStepRecord.dailyTarget || 10000)) * 100))
                  : 0
              }
              label="Daily Recon Quota"
              valueText={
                dailyStepRecord
                  ? `${Math.min(100, Math.round((dailyStepRecord.steps / (dailyStepRecord.dailyTarget || 10000)) * 100))}%`
                  : '0%'
              }
              color="#00F0FF"
              height={7}
            />

            <View style={styles.stepStatsRow}>
              <Text style={styles.lifetimeStepText}>
                Lifetime March: <Text style={{ color: THEME.colors.textBright }}>{lifetimeTotalSteps.toLocaleString()} steps</Text>
              </Text>
              {nextMilestone && (
                <Text style={styles.nextMilestoneText}>
                  Next: {nextMilestone.title} ({nextMilestone.targetSteps.toLocaleString()})
                </Text>
              )}
            </View>

            <View style={styles.bioBtnRow}>
              <TouchableOpacity
                onPress={handleSyncPedometer}
                style={styles.bioBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={13} color={THEME.colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.bioBtnText}>SYNC SENSORS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setStepInput(dailyStepRecord ? String(dailyStepRecord.steps) : '');
                  setIsStepModalVisible(true);
                }}
                style={styles.bioBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={13} color={THEME.colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.bioBtnText}>LOG STEPS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsMilestonesModalVisible(true)}
                style={[styles.bioBtn, { borderColor: '#FFD700', backgroundColor: 'rgba(255, 215, 0, 0.08)' }]}
                activeOpacity={0.8}
              >
                <Ionicons name="trophy-outline" size={13} color="#FFD700" style={{ marginRight: 4 }} />
                <Text style={[styles.bioBtnText, { color: '#FFD700' }]}>MILESTONES</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Corporeal Biomarkers // Weight & Goals */}
          <View style={[styles.bioSubSection, { marginTop: 14 }]}>
            <View style={styles.bioSectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="scale-outline" size={16} color="#FFB800" style={{ marginRight: 6 }} />
                <Text style={styles.bioSubSectionTitle}>CORPOREAL BIOMARKERS // WEIGHT & COMPOSITION</Text>
              </View>
              <Text style={styles.bioSubSectionMeta}>
                Goal: {weightAnalytics.goalType === 'hypertrophy_gain' ? 'BULK' : weightAnalytics.goalType === 'fat_loss' ? 'CUT' : 'MAINTAIN'}
              </Text>
            </View>

            <View style={styles.weightMetricsGrid}>
              <View style={styles.weightMetricBox}>
                <Text style={styles.weightMetricLabel}>SCALE WEIGHT</Text>
                <Text style={styles.weightMetricVal}>
                  {weightAnalytics.currentWeight !== null ? `${weightAnalytics.currentWeight} ${weightAnalytics.unit}` : '--'}
                </Text>
              </View>
              <View style={styles.weightMetricBox}>
                <Text style={styles.weightMetricLabel}>7-DAY TREND EMA</Text>
                <Text style={[styles.weightMetricVal, { color: '#00F0FF' }]}>
                  {weightAnalytics.currentEmaWeight !== null ? `${weightAnalytics.currentEmaWeight} ${weightAnalytics.unit}` : '--'}
                </Text>
              </View>
              <View style={styles.weightMetricBox}>
                <Text style={styles.weightMetricLabel}>WEEKLY VELOCITY</Text>
                <Text style={[styles.weightMetricVal, { color: weightAnalytics.rateStatus === 'excessive_cut' ? '#EF4444' : weightAnalytics.rateStatus === 'excessive_bulk' ? '#FFB800' : '#00E676' }]}>
                  {weightAnalytics.actualWeeklyRatePercent !== null ? `${weightAnalytics.actualWeeklyRatePercent > 0 ? '+' : ''}${weightAnalytics.actualWeeklyRatePercent}%/wk` : 'Tracking'}
                </Text>
              </View>
            </View>

            {/* Health Guardrail Warning if needed */}
            {weightAnalytics.healthWarning && (
              <View style={styles.healthWarningBanner}>
                <Ionicons name="warning-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.healthWarningText}>{weightAnalytics.healthWarning}</Text>
              </View>
            )}

            <View style={styles.bioBtnRow}>
              <TouchableOpacity
                onPress={() => {
                  setWeighInInput(weightAnalytics.currentWeight ? String(weightAnalytics.currentWeight) : '');
                  setIsWeighInModalVisible(true);
                }}
                style={styles.bioBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={13} color={THEME.colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.bioBtnText}>LOG WEIGH-IN (+5 XP)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setGoalTypeInput(weightAnalytics.goalType);
                  setGoalTargetWeightInput(weightAnalytics.targetWeight ? String(weightAnalytics.targetWeight) : '');
                  setGoalRatePercentInput(String(weightAnalytics.weeklyRatePercent || 0));
                  setIsGoalModalVisible(true);
                }}
                style={styles.bioBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="flag-outline" size={13} color={THEME.colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.bioBtnText}>SET GOAL</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Apothecary Stasis // Sleep & Recovery */}
          <View style={[styles.bioSubSection, { marginTop: 14 }]}>
            <View style={styles.bioSectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="bed-outline" size={16} color="#A78BFA" style={{ marginRight: 6 }} />
                <Text style={styles.bioSubSectionTitle}>APOTHECARY STASIS // SLEEP RESTORATION</Text>
              </View>
              {isWellRested ? (
                <View style={[styles.reconBuffTag, { borderColor: '#A78BFA' }]}>
                  <Ionicons name="shield-checkmark" size={12} color="#A78BFA" style={{ marginRight: 4 }} />
                  <Text style={[styles.reconBuffTagText, { color: '#A78BFA' }]}>WELL-RESTED (+5% DMG)</Text>
                </View>
              ) : (
                <Text style={[styles.bioSubSectionMeta, { color: THEME.colors.textMuted }]}>7.0h+ required</Text>
              )}
            </View>

            {/* Auto-detected Stasis Notification Banner */}
            {autoStasisNotice && (
              <View style={styles.autoStasisNoticeBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="moon" size={15} color="#A78BFA" style={{ marginRight: 6 }} />
                  <Text style={styles.autoStasisNoticeText}>{autoStasisNotice}</Text>
                </View>
                <TouchableOpacity onPress={dismissAutoStasisNotice} style={{ padding: 4 }}>
                  <Ionicons name="close" size={16} color={THEME.colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.stasisAutoDesc}>
              GrimIron monitors phone stillness: inactivity lasting 7+ hours automatically credits stasis rest &amp; the Well-Rested combat buff without manual input.
            </Text>

            <View style={styles.bioBtnRow}>
              <TouchableOpacity
                onPress={() => {
                  setSleepHoursInput('8.0');
                  setIsSleepModalVisible(true);
                }}
                style={[styles.bioBtn, { flex: 1 }]}
                activeOpacity={0.8}
              >
                <Ionicons name="moon-outline" size={13} color={THEME.colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.bioBtnText}>MANUAL STASIS LOG (+10 XP)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SciFiCard>

        {/* Career Combat Telemetry (Service Record) */}
        <SciFiCard title="CAREER SERVICE RECORD">
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="barbell-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
              <Text style={styles.statLabel}>CRUSADES</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="layers-outline" size={20} color={THEME.colors.secondary} />
              <Text style={styles.statValue}>{stats.totalSets}</Text>
              <Text style={styles.statLabel}>SETS LOGGED</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="repeat-outline" size={20} color={THEME.colors.success} />
              <Text style={styles.statValue}>{stats.totalReps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>TOTAL REPS</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="speedometer-outline" size={20} color={THEME.colors.warning} />
              <Text style={styles.statValue}>{stats.totalVolumeKg.toLocaleString()} kg</Text>
              <Text style={styles.statLabel}>WEIGHT MOVED</Text>
            </View>
          </View>
        </SciFiCard>
      </ScrollView>

      {/* Equipment Inventory Modal for Gear Switching */}
      <EquipmentInventoryModal
        visible={isEquipmentModalVisible}
        onClose={() => {
          setIsEquipmentModalVisible(false);
          setSelectedEquipmentSlot(undefined);
        }}
        factionId={currentFaction.id}
        characterLevel={progression.level}
        characterRankTier={progression.currentRankTier}
        inventory={inventory}
        loadout={loadout}
        equippedItems={equippedItems}
        equipmentBonuses={equipmentBonuses}
        initialSelectedSlot={selectedEquipmentSlot}
        onEquipItem={(slot, itemId) => {
          equipItemAction(slot, itemId);
        }}
        onUnequipItem={(slot) => {
          unequipItemAction(slot);
        }}
        onClearEquipment={clearEquipmentAction}
      />

      {/* Preferred Title Selection Modal */}
      <Modal
        visible={isTitleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTitleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTag}>HONORARY DESIGNATIONS</Text>
                <Text style={styles.modalHeaderTitle}>SELECT PREFERRED TITLE</Text>
              </View>
              <TouchableOpacity onPress={() => setIsTitleModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructions}>
              Select your preferred title earned through rank advancements, raids, campaign chapters, or combat honors.
            </Text>

            <ScrollView style={{ maxHeight: 380 }}>
              {acquiredTitles.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => handleSelectTitle(t.title)}
                  style={[
                    styles.titleItemCard,
                    t.isEquipped && styles.titleItemCardActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.titleItemName, t.isEquipped && { color: '#FFD700' }]}>
                      {t.title}
                    </Text>
                    <Text style={styles.titleItemSource}>{t.sourceDescription}</Text>
                  </View>
                  {t.isEquipped && (
                    <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Callsign Editor Modal */}
      <Modal
        visible={isCallsignModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCallsignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 260 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>UPDATE WARRIOR CALLSIGN</Text>
              <TouchableOpacity onPress={() => setIsCallsignModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.callsignInput}
              value={newCallsignInput}
              onChangeText={setNewCallsignInput}
              placeholder="Enter operative callsign..."
              placeholderTextColor={THEME.colors.textDisabled}
              maxLength={24}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TerminalButton
                title="CANCEL"
                onPress={() => setIsCallsignModalVisible(false)}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <TerminalButton
                title="SAVE CALLSIGN"
                onPress={handleSaveCallsign}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Codex Mortis: Named Enemies & Bosses Modal */}
      <Modal
        visible={isCodexMortisModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedBossDetail(null);
          setIsCodexMortisModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTag}>SECTOR KILL LEDGER</Text>
                <Text style={styles.modalHeaderTitle}>CODEX MORTIS</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedBossDetail(null);
                  setIsCodexMortisModalVisible(false);
                }}
              >
                <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Sub-tabs: Slain vs Targets */}
            <View style={styles.codexTabRow}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic.selection();
                  setCodexMortisTab('slain');
                }}
                style={[
                  styles.codexTabButton,
                  codexMortisTab === 'slain' && styles.codexTabButtonActive,
                ]}
              >
                <Ionicons
                  name="skull"
                  size={14}
                  color={codexMortisTab === 'slain' ? '#EF4444' : THEME.colors.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.codexTabText,
                    codexMortisTab === 'slain' && { color: '#EF4444' },
                  ]}
                >
                  DEFEATED NEMESES ({slainBosses.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic.selection();
                  setCodexMortisTab('targets');
                }}
                style={[
                  styles.codexTabButton,
                  codexMortisTab === 'targets' && styles.codexTabButtonActive,
                ]}
              >
                <Ionicons
                  name="locate-outline"
                  size={14}
                  color={codexMortisTab === 'targets' ? THEME.colors.primary : THEME.colors.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.codexTabText,
                    codexMortisTab === 'targets' && { color: THEME.colors.primary },
                  ]}
                >
                  AT LARGE ({unslainTargets.length})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {codexMortisTab === 'slain' ? (
                slainBosses.length === 0 ? (
                  <View style={styles.emptyCodexBox}>
                    <Ionicons name="skull-outline" size={40} color={THEME.colors.textDisabled} />
                    <Text style={styles.emptyCodexTitle}>No Named Bosses Slain Yet</Text>
                    <Text style={styles.emptyCodexDesc}>
                      Deploy against high-value named enemies or raid commanders in combat to record their downfall in the Codex Mortis.
                    </Text>
                  </View>
                ) : (
                  slainBosses.map((boss) => (
                    <TouchableOpacity
                      key={boss.id}
                      onPress={() => setSelectedBossDetail(boss)}
                      style={styles.bossCardItem}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.bossAvatarBox, { borderColor: '#EF4444' }]}>
                        <Ionicons name="skull" size={22} color="#EF4444" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={styles.bossNameText}>{boss.name}</Text>
                          <Badge label="ERADICATED" variant="danger" />
                        </View>
                        <Text style={styles.bossMetaText}>
                          {boss.title} • {boss.faction.toUpperCase()}
                        </Text>
                        {boss.slainAt && (
                          <Text style={styles.bossSlainDateText}>
                            Slain on {new Date(boss.slainAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )
              ) : (
                unslainTargets.map((boss) => (
                  <TouchableOpacity
                    key={boss.id}
                    onPress={() => setSelectedBossDetail(boss)}
                    style={styles.bossCardItem}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.bossAvatarBox, { borderColor: THEME.colors.warning }]}>
                      <Ionicons name="locate-outline" size={22} color={THEME.colors.warning} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.bossNameText}>{boss.name}</Text>
                        <Badge label="WANTED" variant="secondary" />
                      </View>
                      <Text style={styles.bossMetaText}>
                        {boss.title} • {boss.baseHealth.toLocaleString()} HP
                      </Text>
                      <Text style={styles.bossLoreSnippet} numberOfLines={1}>
                        {boss.loreDescription}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Boss Lore / Inspector Sub-card */}
            {selectedBossDetail && (
              <View style={styles.bossDetailBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.bossDetailTitle}>{selectedBossDetail.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedBossDetail(null)}>
                    <Ionicons name="close-circle" size={20} color={THEME.colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.bossDetailLore}>{selectedBossDetail.loreDescription}</Text>
                <Text style={styles.bossDetailStatus}>
                  Status: {selectedBossDetail.isDefeated ? `PERMANENTLY SLAIN (Recorded ${new Date(selectedBossDetail.slainAt || '').toLocaleDateString()})` : 'AT LARGE — Active threat to imperial space'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 1. Log Steps Modal */}
      <Modal
        visible={isStepModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStepModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 340 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTag}>FIELD RECON TELEMETRY</Text>
                <Text style={styles.modalHeaderTitle}>LOG FORCED MARCH STEPS</Text>
              </View>
              <TouchableOpacity onPress={() => setIsStepModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructions}>
              Enter physical step count registered by device or external fitness wearable. Reaching 10,000 steps awards +25 Discipline XP and unlocks Daily Recon Intel (+5% Combat Damage).
            </Text>

            <TextInput
              style={styles.biometricInput}
              value={stepInput}
              onChangeText={setStepInput}
              placeholder="e.g. 10000"
              placeholderTextColor={THEME.colors.textDisabled}
              keyboardType="number-pad"
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TerminalButton
                title="CANCEL"
                onPress={() => setIsStepModalVisible(false)}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <TerminalButton
                title="RECORD STEPS"
                onPress={handleSaveSteps}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Step Milestones Modal */}
      <Modal
        visible={isMilestonesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsMilestonesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTag}>CRUSADE MARCH MERITS</Text>
                <Text style={styles.modalHeaderTitle}>LIFETIME STEP MILESTONES</Text>
              </View>
              <TouchableOpacity onPress={() => setIsMilestonesModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructions}>
              Cumulative distance traversed across all crusades ({lifetimeTotalSteps.toLocaleString()} total steps logged). Unlocks permanent titles and uncapped Glory XP.
            </Text>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {stepMilestones.map((m) => {
                const isClaimed = Boolean(m.achievedAt);
                const progressPct = Math.min(100, Math.round((lifetimeTotalSteps / m.targetSteps) * 100));
                return (
                  <View key={m.milestoneKey} style={[styles.milestoneCard, isClaimed && styles.milestoneCardClaimed]}>
                    <View style={styles.milestoneHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Ionicons
                          name={isClaimed ? 'ribbon' : 'footsteps-outline'}
                          size={18}
                          color={isClaimed ? '#FFD700' : THEME.colors.textMuted}
                          style={{ marginRight: 8 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.milestoneTitle, isClaimed && { color: '#FFD700' }]}>
                            {m.title}
                          </Text>
                          <Text style={styles.milestoneSub}>
                            {m.targetSteps.toLocaleString()} Steps • {m.badgeName}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.milestoneXp, isClaimed && { color: '#00E676' }]}>
                          +{m.xpReward} XP
                        </Text>
                        <Text style={styles.milestoneStatus}>
                          {isClaimed ? 'HONOR UNLOCKED' : `${progressPct}%`}
                        </Text>
                      </View>
                    </View>
                    {!isClaimed && (
                      <ProgressBar
                        progress={progressPct}
                        color={THEME.colors.primary}
                        height={4}
                      />
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <TerminalButton
              title="DISMISS"
              onPress={() => setIsMilestonesModalVisible(false)}
              variant="secondary"
              size="md"
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>

      {/* 3. Weigh-In Modal */}
      <Modal
        visible={isWeighInModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsWeighInModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTag}>CORPOREAL TELEMETRY</Text>
                <Text style={styles.modalHeaderTitle}>LOG WEIGH-IN</Text>
              </View>
              <TouchableOpacity onPress={() => setIsWeighInModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructions}>
              Raw scale readings fluctuate daily due to sodium and hydration. GrimIron calculates a 7-day Exponential Moving Average (EMA) to smooth out water weight noise.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TextInput
                style={[styles.biometricInput, { flex: 1 }]}
                value={weighInInput}
                onChangeText={setWeighInInput}
                placeholder={`Scale weight (${weightAnalytics.unit})...`}
                placeholderTextColor={THEME.colors.textDisabled}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={{ color: THEME.colors.textBright, fontWeight: '800', fontSize: 16 }}>
                {weightAnalytics.unit.toUpperCase()}
              </Text>
            </View>

            <TextInput
              style={[styles.biometricInput, { marginTop: 10 }]}
              value={weighInNotesInput}
              onChangeText={setWeighInNotesInput}
              placeholder="Notes (e.g. morning fasting, post-workout)..."
              placeholderTextColor={THEME.colors.textDisabled}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TerminalButton
                title="CANCEL"
                onPress={() => setIsWeighInModalVisible(false)}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <TerminalButton
                title="SAVE WEIGH-IN (+5 XP)"
                onPress={handleSaveWeighIn}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>

            {/* Recent History Table */}
            {weightHistory.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.historyTableHeader}>RECENT WEIGH-INS & 7-DAY TREND</Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {weightHistory.slice(0, 7).map((rec) => (
                    <View key={rec.id} style={styles.historyTableRow}>
                      <Text style={styles.historyTableDate}>{rec.date}</Text>
                      <Text style={styles.historyTableWeight}>
                        {rec.weight} {rec.unit}
                      </Text>
                      <Text style={styles.historyTableEma}>
                        EMA: {rec.emaWeight} {rec.unit}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 4. Composition Goal Modal */}
      <Modal
        visible={isGoalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTag}>CORPOREAL DIRECTIVE</Text>
                <Text style={styles.modalHeaderTitle}>SET COMPOSITION GOAL</Text>
              </View>
              <TouchableOpacity onPress={() => setIsGoalModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructions}>
              Select your physiological goal. Safe rates are calculated against muscle retention and metabolic throughput.
            </Text>

            {/* Goal Type Tabs */}
            <View style={styles.goalTypeTabRow}>
              {[
                { type: 'hypertrophy_gain' as const, label: 'BULK', sub: '+0.25-0.5%/wk' },
                { type: 'fat_loss' as const, label: 'CUT', sub: '-0.5-1.0%/wk' },
                { type: 'maintenance' as const, label: 'MAINTAIN', sub: '0.0%/wk' },
              ].map((g) => (
                <TouchableOpacity
                  key={g.type}
                  onPress={() => {
                    triggerHaptic.selection();
                    setGoalTypeInput(g.type);
                    if (g.type === 'hypertrophy_gain') setGoalRatePercentInput('0.35');
                    else if (g.type === 'fat_loss') setGoalRatePercentInput('-0.75');
                    else setGoalRatePercentInput('0.0');
                  }}
                  style={[
                    styles.goalTypeTab,
                    goalTypeInput === g.type && styles.goalTypeTabActive,
                  ]}
                >
                  <Text style={[styles.goalTypeTabTitle, goalTypeInput === g.type && { color: THEME.colors.primary }]}>
                    {g.label}
                  </Text>
                  <Text style={styles.goalTypeTabSub}>{g.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.fieldLabel}>TARGET WEIGHT ({weightAnalytics.unit.toUpperCase()}) (OPTIONAL)</Text>
              <TextInput
                style={styles.biometricInput}
                value={goalTargetWeightInput}
                onChangeText={setGoalTargetWeightInput}
                placeholder="e.g. 180"
                placeholderTextColor={THEME.colors.textDisabled}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.fieldLabel}>WEEKLY TARGET CHANGE RATE (%/WEEK)</Text>
              <TextInput
                style={styles.biometricInput}
                value={goalRatePercentInput}
                onChangeText={setGoalRatePercentInput}
                placeholder="e.g. -0.75 or +0.35"
                placeholderTextColor={THEME.colors.textDisabled}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TerminalButton
                title="CANCEL"
                onPress={() => setIsGoalModalVisible(false)}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <TerminalButton
                title="SAVE GOAL"
                onPress={handleSaveGoal}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. Stasis Sleep Modal */}
      <Modal
        visible={isSleepModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSleepModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 330 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTag}>STASIS RESTORATION</Text>
                <Text style={styles.modalHeaderTitle}>LOG STASIS SLEEP</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSleepModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructions}>
              Cellular rejuvenation and central nervous system recovery. Logging &gt;= 7.0 hours grants +10 Discipline XP and the "Stasis Well-Rested" tactical combat buff (+5% bonus damage on your next crusade).
            </Text>

            <TextInput
              style={styles.biometricInput}
              value={sleepHoursInput}
              onChangeText={setSleepHoursInput}
              placeholder="Hours slept (e.g. 7.5)..."
              placeholderTextColor={THEME.colors.textDisabled}
              keyboardType="decimal-pad"
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TerminalButton
                title="CANCEL"
                onPress={() => setIsSleepModalVisible(false)}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <TerminalButton
                title="RECORD STASIS (+10 XP)"
                onPress={handleSaveSleep}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    gap: 14,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  terminalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.success,
    marginRight: 6,
  },
  terminalStatusText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  settingsHeaderButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  heroCard: {
    marginTop: 0,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroDetails: {
    flex: 1,
    marginLeft: THEME.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  callsignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  callsignText: {
    color: THEME.colors.textBright,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  titleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  titleBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  factionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  factionNameText: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
  },
  switchFactionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  switchFactionBtnText: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  subfactionNameText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  progressSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  xpTotalText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  xpHighlight: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  codexMortisTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  codexMortisTagText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  codexMortisDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  codexMortisStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codexStatBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  codexStatValue: {
    color: THEME.colors.textBright,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  codexStatLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  titanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  titanBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  prSummaryDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  liftsGrid: {
    gap: 8,
  },
  liftPrCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 10,
  },
  liftHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  liftCategory: {
    color: THEME.colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  liftSetsBadge: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  liftName: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  liftStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liftMetricValue: {
    color: THEME.colors.textBright,
    fontSize: 16,
    fontWeight: '800',
  },
  liftUnit: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  liftMetricLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
  },
  noLiftRecordText: {
    color: THEME.colors.textDisabled,
    fontSize: 11,
    fontStyle: 'italic',
  },
  activeDoctrineTag: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  activeDoctrineTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  doctrineDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  doctrineOptionCard: {
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  doctrineCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctrineName: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  doctrineTagline: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  doctrinePerkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 8,
  },
  doctrinePerkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pledgeWeekTag: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  pledgeSubtitle: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  pledgeQuote: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  pledgeProgressBox: {
    gap: 8,
  },
  pledgeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pledgeTonnageText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  pledgeBountyText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  pledgeClaimedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  pledgeClaimedText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
  },
  pledgeRemainingText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  statValue: {
    color: THEME.colors.textBright,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.88)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.borderRadius.lg,
    borderTopRightRadius: THEME.borderRadius.lg,
    borderTopWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: THEME.spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderTag: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalHeaderTitle: {
    color: THEME.colors.textBright,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalInstructions: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  titleItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  titleItemCardActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  titleItemName: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '700',
  },
  titleItemSource: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  callsignInput: {
    backgroundColor: '#0A0E17',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderRadius: 6,
    padding: 12,
    color: THEME.colors.textBright,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  codexTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  codexTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  codexTabButtonActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  codexTabText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCodexBox: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyCodexTitle: {
    color: THEME.colors.textBright,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyCodexDesc: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  bossCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  bossAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bossNameText: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  bossMetaText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  bossSlainDateText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  bossLoreSnippet: {
    color: THEME.colors.textDisabled,
    fontSize: 10,
    marginTop: 2,
  },
  bossDetailBox: {
    marginTop: 12,
    backgroundColor: '#0B1322',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderRadius: 6,
    padding: 12,
  },
  bossDetailTitle: {
    color: THEME.colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  bossDetailLore: {
    color: THEME.colors.textBright,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  bossDetailStatus: {
    color: THEME.colors.warning,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  reconBuffTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00E676',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reconBuffTagText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  biometricDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  bioSubSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 12,
  },
  bioSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bioSubSectionTitle: {
    color: THEME.colors.textBright,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bioSubSectionMeta: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  stepStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  lifetimeStepText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  nextMilestoneText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '700',
  },
  bioBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  bioBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  bioBtnText: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  weightMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  weightMetricBox: {
    flex: 1,
    backgroundColor: '#070D18',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  weightMetricLabel: {
    color: THEME.colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  weightMetricVal: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
  },
  healthWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 4,
    padding: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  healthWarningText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  biometricInput: {
    backgroundColor: '#0A0E17',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderRadius: 6,
    padding: 12,
    color: THEME.colors.textBright,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  milestoneCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  milestoneCardClaimed: {
    borderColor: 'rgba(255, 215, 0, 0.4)',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  milestoneHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneTitle: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '800',
  },
  milestoneSub: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  milestoneXp: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  milestoneStatus: {
    color: THEME.colors.textDisabled,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  historyTableHeader: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  historyTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  historyTableDate: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  historyTableWeight: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '700',
  },
  historyTableEma: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
  },
  goalTypeTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  goalTypeTab: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  goalTypeTabActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  goalTypeTabTitle: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '800',
  },
  goalTypeTabSub: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  fieldLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  autoStasisNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderWidth: 1,
    borderColor: '#A78BFA',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  autoStasisNoticeText: {
    color: '#E9D5FF',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    lineHeight: 15,
  },
  stasisAutoDesc: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
});
