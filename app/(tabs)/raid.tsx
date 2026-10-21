import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { THEME } from '../../src/constants/theme';
import { getSafeIoniconsName } from '../../src/utils/iconHelper';
import { RaidSpawnDay } from '../../src/types/warfront';
import { triggerHaptic } from '../../src/utils/haptics';
import { BOSS_DIFFICULTY_LOOT_TABLES } from '../../src/services/progression/raidLootEngine';
import { getEquipmentById } from '../../src/content/equipment/catalog';
import { RARITY_COLORS } from '../../src/components/EquipmentSlotCard';
import { RAID_TIERS, getRaidTierById } from '../../src/content/raidTiers';
import { getLootCandidatesForRaidTier } from '../../src/services/progression/raidLootEngine';
import { isItemEquipEligible } from '../../src/services/progression/equipmentService';
import { RaidTierId } from '../../src/types/raidProgression';
import { getOrCreateWeeklyRaid } from '../../src/services/progression/warfrontEngine';

export default function RaidScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    weeklyRaid,
    warfrontSettings,
    setWarfrontSpawnDay,
    deployWeeklyRaid,
    claimWeeklyRaidRewardsAction,
    selectedRaidTierId,
    setSelectedRaidTierId,
    checkRaidEligibility,
    raidProgression,
    gearPowerInfo,
    progression,
    currentFaction,
  } = useApp();

  const [previewMode, setPreviewMode] = useState<'individual' | 'squad'>('individual');

  // Immediate authoritative weekly raid cycle resolution (zero-delay deterministic availability)
  const currentWeeklyRaid =
    weeklyRaid ||
    getOrCreateWeeklyRaid({
      preferredSpawnDay: warfrontSettings?.preferredSpawnDay || 'saturday',
    });

  const { boss, maxHp, currentHp, status, isRewardClaimed, contributions, spawnDay, expiresAt, timezone } =
    currentWeeklyRaid;
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));

  // Determine active phase
  let currentPhaseIndex = 0;
  if (hpPercent <= 33) {
    currentPhaseIndex = 2;
  } else if (hpPercent <= 66) {
    currentPhaseIndex = 1;
  }
  const activePhase = boss.phases[currentPhaseIndex] || boss.phases[0];

  const participantsList = Object.values(contributions).sort(
    (a, b) => b.damage - a.damage
  );

  const currentTierDef = getRaidTierById(selectedRaidTierId);
  const eligibility = checkRaidEligibility(selectedRaidTierId);

  const handleDeployStrike = () => {
    triggerHaptic.medium();
    const res = deployWeeklyRaid(currentWeeklyRaid, selectedRaidTierId);
    if (!res.success) {
      triggerHaptic.warning();
      Alert.alert('Raid Clearance Denied', res.reason || 'You do not meet the operational requirements to deploy on this raid.');
      return;
    }
    router.push('/(tabs)/workout');
  };

  const handleClaimSpoils = () => {
    const success = claimWeeklyRaidRewardsAction(currentWeeklyRaid.cycleId, selectedRaidTierId);
    if (success) {
      triggerHaptic.success();
      Alert.alert('Spoils Claimed', `Awarded +${currentTierDef.gloryXpReward} Glory XP for neutralizing ${boss.name}!`);
    } else {
      triggerHaptic.warning();
      Alert.alert('Claim Notice', 'Raid spoils could not be claimed or were already redeemed.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(60, insets.bottom + 40) },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="flame" size={24} color="#FF5252" />
            <Text style={styles.headerTitle}>WEEKLY CRUSADE RAID</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Cycle: {currentWeeklyRaid.cycleId} • Saturday Reset
          </Text>
        </View>

        {/* Schedule & Timezone Card */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Ionicons name="calendar-outline" size={15} color="#FFB74D" />
            <Text style={styles.scheduleTitle}>RAID SPAWN SCHEDULE</Text>
          </View>
          <Text style={styles.scheduleDesc}>
            Default deployment is Saturday. Schedule adjustments apply to future weekly cycles.
          </Text>
          <View style={styles.daySelectorRow}>
            <TouchableOpacity
              style={[
                styles.dayButton,
                warfrontSettings.preferredSpawnDay === 'saturday' && styles.dayButtonActive,
              ]}
              onPress={() => setWarfrontSpawnDay('saturday')}
            >
              <Ionicons
                name={
                  warfrontSettings.preferredSpawnDay === 'saturday'
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={14}
                color={
                  warfrontSettings.preferredSpawnDay === 'saturday' ? '#00E676' : '#78909C'
                }
              />
              <Text
                style={[
                  styles.dayButtonText,
                  warfrontSettings.preferredSpawnDay === 'saturday' && styles.dayButtonTextActive,
                ]}
              >
                Saturday Spawn (Default)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dayButton,
                warfrontSettings.preferredSpawnDay === 'friday' && styles.dayButtonActive,
              ]}
              onPress={() => setWarfrontSpawnDay('friday')}
            >
              <Ionicons
                name={
                  warfrontSettings.preferredSpawnDay === 'friday'
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={14}
                color={
                  warfrontSettings.preferredSpawnDay === 'friday' ? '#00E676' : '#78909C'
                }
              />
              <Text
                style={[
                  styles.dayButtonText,
                  warfrontSettings.preferredSpawnDay === 'friday' && styles.dayButtonTextActive,
                ]}
              >
                Friday Spawn
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Active Cycle Day: <Text style={styles.metaHighlight}>{spawnDay.toUpperCase()}</Text>
            </Text>
            <Text style={styles.metaText}>
              Zone: <Text style={styles.metaHighlight}>{timezone || 'Local'}</Text>
            </Text>
            <Text style={styles.metaText}>
              Expires: <Text style={styles.metaHighlight}>{new Date(expiresAt).toLocaleDateString()}</Text>
            </Text>
          </View>
        </View>

        {/* MMORPG Raid Progression Ladder Tabs */}
        <View style={styles.raidLadderContainer}>
          <View style={styles.raidLadderHeaderRow}>
            <View style={styles.raidLadderTitleBox}>
              <Ionicons name="git-network-outline" size={15} color="#00F0FF" />
              <Text style={styles.raidLadderTitle}>CRUSADE RAID PROGRESSION LADDER</Text>
            </View>
            <View style={styles.highestUnlockedPill}>
              <Text style={styles.highestUnlockedPillText}>
                UNLOCKED: T{getRaidTierById(raidProgression.highestTierUnlocked).tierNumber}
              </Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ladderScrollRow}>
            {RAID_TIERS.map((tier) => {
              const isSelected = selectedRaidTierId === tier.id;
              const tierEligibility = checkRaidEligibility(tier.id);
              const isDefeated = (raidProgression.tierVictories[tier.id] || 0) > 0;

              return (
                <TouchableOpacity
                  key={tier.id}
                  style={[
                    styles.ladderTab,
                    isSelected && { borderColor: tier.color, backgroundColor: `${tier.color}15` },
                    !tierEligibility.isEligible && styles.ladderTabLocked,
                  ]}
                  onPress={() => {
                    triggerHaptic.selection();
                    setSelectedRaidTierId(tier.id);
                  }}
                >
                  <View style={styles.ladderTabHeader}>
                    <Text style={[styles.ladderTabNum, isSelected && { color: tier.color }]}>
                      T{tier.tierNumber}
                    </Text>
                    <Ionicons
                      name={
                        isDefeated
                          ? 'checkmark-circle'
                          : tierEligibility.isEligible
                          ? 'lock-open-outline'
                          : 'lock-closed'
                      }
                      size={12}
                      color={
                        isDefeated
                          ? '#00E676'
                          : tierEligibility.isEligible
                          ? '#00F0FF'
                          : '#90A4AE'
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.ladderTabName,
                      isSelected && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                    numberOfLines={1}
                  >
                    {tier.name.replace(' Raids', '').replace(' Crusade', '')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Raid Tier Clearance & Requirements Dossier */}
        <View style={[styles.tierDossierCard, { borderColor: currentTierDef.color }]}>
          <View style={styles.tierDossierTopRow}>
            <View style={styles.tierTitleBox}>
              <Text style={[styles.tierCodeName, { color: currentTierDef.color }]}>
                [{currentTierDef.codeName}]
              </Text>
              <Text style={styles.tierMainTitle}>
                TIER {currentTierDef.tierNumber}: {currentTierDef.name.toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.clearanceBadge,
                eligibility.isEligible ? styles.clearanceBadgeGranted : styles.clearanceBadgeDenied,
              ]}
            >
              <Ionicons
                name={eligibility.isEligible ? 'shield-checkmark' : 'lock-closed'}
                size={12}
                color={eligibility.isEligible ? '#00E676' : '#FF5252'}
              />
              <Text
                style={[
                  styles.clearanceBadgeText,
                  eligibility.isEligible
                    ? styles.clearanceBadgeTextGranted
                    : styles.clearanceBadgeTextDenied,
                ]}
              >
                {eligibility.isEligible ? 'CLEARANCE GRANTED' : 'CLEARANCE LOCKED'}
              </Text>
            </View>
          </View>

          <Text style={styles.tierLoreText}>{currentTierDef.loreBriefing}</Text>

          {/* Operational Eligibility Requirements Checklist */}
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>OPERATIONAL CLEARANCE CRITERIA</Text>
            
            <View style={styles.reqItemRow}>
              <Ionicons
                name={eligibility.checks.level.met ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={eligibility.checks.level.met ? '#00E676' : '#FF5252'}
              />
              <Text style={styles.reqLabel}>Level Clearance:</Text>
              <Text style={[styles.reqValue, !eligibility.checks.level.met && styles.reqValueFailed]}>
                {eligibility.checks.level.required} ({eligibility.checks.level.current})
              </Text>
            </View>

            <View style={styles.reqItemRow}>
              <Ionicons
                name={eligibility.checks.rank.met ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={eligibility.checks.rank.met ? '#00E676' : '#FF5252'}
              />
              <Text style={styles.reqLabel}>Military Rank:</Text>
              <Text style={[styles.reqValue, !eligibility.checks.rank.met && styles.reqValueFailed]}>
                {eligibility.checks.rank.required} ({eligibility.checks.rank.current})
              </Text>
            </View>

            <View style={styles.reqItemRow}>
              <Ionicons
                name={eligibility.checks.gearPower.met ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={eligibility.checks.gearPower.met ? '#00E676' : '#FF5252'}
              />
              <Text style={styles.reqLabel}>Gear Power:</Text>
              <Text style={[styles.reqValue, !eligibility.checks.gearPower.met && styles.reqValueFailed]}>
                {eligibility.checks.gearPower.required} ({eligibility.checks.gearPower.current})
              </Text>
            </View>

            <View style={styles.reqItemRow}>
              <Ionicons
                name={eligibility.checks.prerequisiteRaid.met ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={eligibility.checks.prerequisiteRaid.met ? '#00E676' : '#FF5252'}
              />
              <Text style={styles.reqLabel}>Prerequisite Trial:</Text>
              <Text style={[styles.reqValue, !eligibility.checks.prerequisiteRaid.met && styles.reqValueFailed]}>
                {eligibility.checks.prerequisiteRaid.required} ({eligibility.checks.prerequisiteRaid.current})
              </Text>
            </View>
          </View>

          {/* Tier Combat Targets & Spoils Preview */}
          <View style={styles.tierTargetStatsRow}>
            <View style={styles.tierTargetStat}>
              <Text style={styles.tierTargetLabel}>TARGET HEALTH</Text>
              <Text style={styles.tierTargetValue}>
                {previewMode === 'individual'
                  ? `${currentTierDef.soloHp.toLocaleString()} HP`
                  : `${currentTierDef.squadHp.toLocaleString()} HP`}
              </Text>
            </View>
            <View style={styles.tierTargetStat}>
              <Text style={styles.tierTargetLabel}>RECOM SETS</Text>
              <Text style={styles.tierTargetValue}>{currentTierDef.recommendedSets} Sets</Text>
            </View>
            <View style={styles.tierTargetStat}>
              <Text style={styles.tierTargetLabel}>GLORY REWARD</Text>
              <Text style={styles.tierTargetValue}>+{currentTierDef.gloryXpReward} XP</Text>
            </View>
          </View>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, previewMode === 'individual' && styles.modeTabActive]}
            onPress={() => setPreviewMode('individual')}
          >
            <Ionicons
              name="person"
              size={14}
              color={previewMode === 'individual' ? '#00E676' : '#90A4AE'}
            />
            <Text
              style={[
                styles.modeTabText,
                previewMode === 'individual' && styles.modeTabTextActive,
              ]}
            >
              SOLO WARFRONT (~2,400 HP)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, previewMode === 'squad' && styles.modeTabActive]}
            onPress={() => setPreviewMode('squad')}
          >
            <Ionicons
              name="people"
              size={14}
              color={previewMode === 'squad' ? '#00E676' : '#90A4AE'}
            />
            <Text
              style={[
                styles.modeTabText,
                previewMode === 'squad' && styles.modeTabTextActive,
              ]}
            >
              SQUAD CRUSADE (~7,500 HP)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Boss Dossier Card */}
        <View style={[styles.bossCard, { borderColor: boss.primaryColor }]}>
          {/* Top Status & Faction Bar */}
          <View style={styles.bossTopBar}>
            <View style={styles.factionTag}>
              <Text style={styles.factionTagText}>{boss.factionName.toUpperCase()}</Text>
            </View>

            {boss.isReturningNemesis && (
              <View style={styles.returningNemesisPill}>
                <Ionicons name="alert-circle" size={11} color="#FF9100" />
                <Text style={styles.returningNemesisPillText}>RETURNING NEMESIS</Text>
              </View>
            )}

            {status === 'active' && (
              <View style={styles.activePill}>
                <Ionicons name="radio-outline" size={11} color="#00E676" />
                <Text style={styles.activePillText}>ENGAGEMENT ACTIVE</Text>
              </View>
            )}

            {status === 'defeated' && (
              <View style={styles.defeatedPill}>
                <Ionicons name="trophy" size={11} color="#FFD700" />
                <Text style={styles.defeatedPillText}>WARLORD VANQUISHED</Text>
              </View>
            )}

            {status === 'escaped' && (
              <View style={styles.escapedPill}>
                <Ionicons name="exit-outline" size={11} color="#B0BEC5" />
                <Text style={styles.escapedPillText}>WARLORD ESCAPED</Text>
              </View>
            )}
          </View>

          {/* Identity & Visual */}
          <View style={styles.bossProfileRow}>
            <View style={[styles.bossAvatarCircle, { backgroundColor: boss.primaryColor }]}>
              <Ionicons
                name={getSafeIoniconsName(boss.glyph, 'skull')}
                size={34}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.bossInfoCol}>
              <View style={styles.tierRow}>
                <View
                  style={[
                    styles.difficultyBadge,
                    boss.difficultyTier === 'legendary'
                      ? styles.diffLegendary
                      : boss.difficultyTier === 'challenging'
                      ? styles.diffChallenging
                      : styles.diffStandard,
                  ]}
                >
                  <Text style={styles.difficultyBadgeText}>
                    {boss.difficultyTier?.toUpperCase() || 'STANDARD'} THREAT
                  </Text>
                </View>

                {boss.subfactionName ? (
                  <View style={styles.subfactionTag}>
                    <Text style={styles.subfactionTagText}>{boss.subfactionName}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.bossHonorificText}>{boss.honorific}</Text>
              <Text style={styles.bossNameText}>{boss.name}</Text>
              <Text style={styles.bossTitleText}>{boss.title}</Text>

              <View style={styles.roleArchetypeRow}>
                <Text style={styles.combatRoleText}>{boss.combatRole || 'Commander'}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.archetypeText}>{boss.archetype || 'Crusade Boss'}</Text>
              </View>
            </View>
          </View>

          {/* Health Gauge */}
          <View style={styles.healthBlock}>
            <View style={styles.healthNumbersRow}>
              <Text style={styles.healthLabel}>SECTOR REINFORCEMENTS</Text>
              <Text style={styles.healthValue}>
                {currentHp.toLocaleString()} / {maxHp.toLocaleString()} HP ({hpPercent}%)
              </Text>
            </View>

            <View style={styles.hpTrack}>
              <View
                style={[
                  styles.hpFill,
                  {
                    width: `${hpPercent}%`,
                    backgroundColor:
                      hpPercent > 66
                        ? '#4CAF50'
                        : hpPercent > 33
                        ? '#FF9800'
                        : '#D32F2F',
                  },
                ]}
              />
              <View style={[styles.phaseDivider, { left: '33%' }]} />
              <View style={[styles.phaseDivider, { left: '66%' }]} />
            </View>

            <View style={styles.phaseLabelsRow}>
              <Text style={styles.phaseThresholdText}>Phase 3 (33%)</Text>
              <Text style={styles.phaseThresholdText}>Phase 2 (66%)</Text>
              <Text style={styles.phaseThresholdText}>Phase 1 (100%)</Text>
            </View>
          </View>

          {/* Tactical Modifiers & Armaments */}
          <View style={styles.armamentsCard}>
            <View style={styles.armamentItem}>
              <Ionicons name="hammer-outline" size={13} color="#FFB74D" />
              <Text style={styles.armamentLabel}>Signature Weapon:</Text>
              <Text style={styles.armamentValue}>{boss.signatureWeapon}</Text>
            </View>
            <View style={styles.armamentItem}>
              <Ionicons name="shield-outline" size={13} color="#80DEEA" />
              <Text style={styles.armamentLabel}>Combat Trait:</Text>
              <Text style={styles.armamentValue}>{boss.combatTrait}</Text>
            </View>
          </View>

          {/* 3 Phases Detailed Cards */}
          <View style={styles.phasesSection}>
            <Text style={styles.phasesSectionTitle}>TACTICAL COMBAT PHASES</Text>
            {boss.phases.map((ph, idx) => {
              const isPassed = (idx === 0 && hpPercent <= 66) || (idx === 1 && hpPercent <= 33);
              const isCurrent = idx === currentPhaseIndex;
              const isUpcoming = !isPassed && !isCurrent;

              return (
                <View
                  key={ph.phaseNumber}
                  style={[
                    styles.phaseItemBox,
                    isCurrent && {
                      borderColor: ph.visualColor,
                      borderWidth: 1.5,
                      backgroundColor: '#1E2533',
                    },
                    isPassed && { opacity: 0.6 },
                  ]}
                >
                  <View style={styles.phaseItemHeader}>
                    <View style={styles.phaseTitleWithIcon}>
                      <Ionicons
                        name={
                          isPassed
                            ? 'checkmark-circle'
                            : isCurrent
                            ? 'radio-button-on'
                            : 'lock-closed-outline'
                        }
                        size={13}
                        color={isPassed ? '#00E676' : isCurrent ? ph.visualColor : '#78909C'}
                      />
                      <Text
                        style={[
                          styles.phaseItemTitleText,
                          isCurrent && { color: ph.visualColor, fontWeight: '800' },
                        ]}
                      >
                        {ph.title}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.phaseTag,
                        isPassed && styles.phaseTagCleared,
                        isCurrent && { backgroundColor: ph.visualColor },
                        isUpcoming && styles.phaseTagUpcoming,
                      ]}
                    >
                      <Text style={styles.phaseTagText}>
                        {isPassed ? 'CLEARED' : isCurrent ? 'ACTIVE' : 'UPCOMING'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.phaseItemDescText}>{ph.description}</Text>
                  {isCurrent && <Text style={styles.phaseItemTauntText}>"{ph.taunt}"</Text>}
                </View>
              );
            })}
          </View>

          {/* Lore Synopsis */}
          <Text style={styles.loreText}>{boss.loreDescription}</Text>

          {/* Returning Nemesis Warning */}
          {boss.isReturningNemesis && (
            <View style={styles.returningWarningBox}>
              <Ionicons name="warning-outline" size={15} color="#FF9100" />
              <Text style={styles.returningWarningText}>
                Auspex Warning: This hostile commander previously escaped imperial engagement and has returned to contest the sector!
              </Text>
            </View>
          )}
        </View>

        {/* Participant Contributions & Leaderboard */}
        <View style={styles.leaderboardBox}>
          <View style={styles.leaderboardTitleRow}>
            <Ionicons name="people" size={16} color="#FFD700" />
            <Text style={styles.leaderboardTitleText}>SQUAD COMBAT CONTRIBUTIONS</Text>
          </View>

          {participantsList.length === 0 ? (
            <Text style={styles.emptyContribText}>
              No battle strikes recorded yet this week. Deploy an assault workout to deal damage!
            </Text>
          ) : (
            participantsList.map((p, idx) => {
              const sharePercent = Math.min(100, Math.round((p.damage / maxHp) * 100));
              return (
                <View key={p.userId} style={styles.participantRow}>
                  <Text style={styles.rankText}>#{idx + 1}</Text>
                  <View style={styles.callerInfo}>
                    <Text style={styles.callsignText}>{p.callsign}</Text>
                    <Text style={styles.metricsText}>
                      {p.workoutsCount} sessions • {p.attacksCount} attacks landed
                    </Text>
                  </View>
                  <View style={styles.damageInfo}>
                    <Text style={styles.damageValue}>{p.damage.toLocaleString()} DMG</Text>
                    <Text style={styles.shareValue}>{sharePercent}% contribution</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Raid Wargear Loot Table Preview Card */}
        <View style={styles.lootTableCard}>
          <View style={styles.lootTableHeader}>
            <Ionicons name="trophy-outline" size={16} color="#00F0FF" />
            <Text style={styles.lootTableTitle}>
              RAID SPOILS // TIER {currentTierDef.tierNumber} REWARD TABLE
            </Text>
          </View>
          <Text style={styles.lootTableSubtitle}>
            Neutralizing this raid boss grants +{currentTierDef.gloryXpReward} Glory XP and eligible wargear drops:
          </Text>
          <View style={styles.lootItemsList}>
            {(getLootCandidatesForRaidTier(selectedRaidTierId) || []).map((itemId) => {
              const item = getEquipmentById(itemId);
              if (!item) return null;
              const color = RARITY_COLORS[item.rarity] || '#FFFFFF';
              const equipCheck = isItemEquipEligible(
                item,
                currentFaction.id,
                progression.level,
                progression.currentRankTier
              );

              return (
                <View key={item.id} style={[styles.lootItemRow, { borderLeftColor: color }]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.lootItemTitleRow}>
                      <Text style={[styles.lootItemName, { color }]}>{item.name}</Text>
                      <View
                        style={[
                          styles.lootEquipBadge,
                          equipCheck.eligible
                            ? styles.lootEquipBadgeReady
                            : styles.lootEquipBadgeLocked,
                        ]}
                      >
                        <Text
                          style={[
                            styles.lootEquipBadgeText,
                            equipCheck.eligible
                              ? styles.lootEquipBadgeTextReady
                              : styles.lootEquipBadgeTextLocked,
                          ]}
                        >
                          {equipCheck.eligible
                            ? 'EQUIP READY'
                            : `REQ LVL ${item.requirements.minLevel || 1}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.lootItemStats}>
                      Tier {item.tier} {item.rarity.toUpperCase()} • {item.slot.replace(/_/g, ' ').toUpperCase()}
                      {item.stats.bonusDamage ? ` • +${item.stats.bonusDamage} DMG` : ''}
                      {item.stats.damageMultiplier ? ` • +${Math.round(item.stats.damageMultiplier * 100)}% Mult` : ''}
                      {item.stats.defenseRating ? ` • +${item.stats.defenseRating} DEF` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action Button Footer */}
        <View style={styles.actionFooter}>
          {status === 'active' && eligibility.isEligible && (
            <TouchableOpacity style={styles.assaultBtn} onPress={handleDeployStrike}>
              <Ionicons name="flame" size={18} color="#FFFFFF" />
              <Text style={styles.assaultBtnText}>
                DEPLOY CRUSADE STRIKE (TIER {currentTierDef.tierNumber})
              </Text>
            </TouchableOpacity>
          )}

          {status === 'active' && !eligibility.isEligible && (
            <View style={styles.assaultBtnLocked}>
              <Ionicons name="lock-closed" size={18} color="#90A4AE" />
              <View style={styles.assaultBtnLockedTextBox}>
                <Text style={styles.assaultBtnLockedText}>
                  CLEARANCE LOCKED (TIER {currentTierDef.tierNumber})
                </Text>
                <Text style={styles.assaultBtnLockedSubtext} numberOfLines={1}>
                  {eligibility.primaryLockReason}
                </Text>
              </View>
            </View>
          )}

          {status === 'defeated' && !isRewardClaimed && (
            <TouchableOpacity style={styles.claimBtn} onPress={handleClaimSpoils}>
              <Ionicons name="trophy" size={18} color="#121212" />
              <Text style={styles.claimBtnText}>
                CLAIM VICTORY SPOILS (+{currentTierDef.gloryXpReward} XP)
              </Text>
            </TouchableOpacity>
          )}

          {status === 'defeated' && isRewardClaimed && (
            <View style={styles.claimedPillBox}>
              <Ionicons name="checkmark-circle" size={16} color="#00E676" />
              <Text style={styles.claimedPillText}>SPOILS OF WAR CLAIMED</Text>
            </View>
          )}

          {status === 'escaped' && (
            <View style={styles.escapedBox}>
              <Ionicons name="information-circle" size={16} color="#90A4AE" />
              <Text style={styles.escapedBoxText}>
                The weekly cycle concluded before victory. The warlord retreated into the void.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Ionicons name="time-outline" size={15} color="#90A4AE" />
            <Text style={styles.historyBtnText}>VIEW BATTLE HISTORY RECORDS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1116',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingTitle: {
    color: '#ECEFF1',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  loadingSubtitle: {
    color: '#90A4AE',
    fontSize: 12,
    textAlign: 'center',
  },
  retryScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00F0FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
  },
  retryScanBtnText: {
    color: '#0A0E17',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  header: {
    gap: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#ECEFF1',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: '#90A4AE',
    fontSize: 12,
  },
  scheduleCard: {
    backgroundColor: '#161922',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26303E',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  scheduleTitle: {
    color: '#FFB74D',
    fontSize: 11,
    fontWeight: '800',
  },
  scheduleDesc: {
    color: '#90A4AE',
    fontSize: 11,
    marginBottom: 8,
  },
  daySelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#202632',
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2F3B4D',
  },
  dayButtonActive: {
    backgroundColor: '#173325',
    borderColor: '#00E676',
  },
  dayButtonText: {
    color: '#B0BEC5',
    fontSize: 11,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#00E676',
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#202632',
  },
  metaText: {
    color: '#78909C',
    fontSize: 10,
  },
  metaHighlight: {
    color: '#CFD8DC',
    fontWeight: '700',
  },
  raidLadderContainer: {
    backgroundColor: '#161922',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#26303E',
  },
  raidLadderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  raidLadderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  raidLadderTitle: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  highestUnlockedPill: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00E67650',
  },
  highestUnlockedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00E676',
    letterSpacing: 0.5,
  },
  ladderScrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  ladderTab: {
    minWidth: 84,
    backgroundColor: '#202632',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2F3B4D',
    alignItems: 'center',
  },
  ladderTabLocked: {
    opacity: 0.65,
  },
  ladderTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  ladderTabNum: {
    fontSize: 10,
    fontWeight: '900',
    color: '#90A4AE',
  },
  ladderTabName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CFD8DC',
    textAlign: 'center',
  },
  tierDossierCard: {
    backgroundColor: '#131822',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  tierDossierTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tierTitleBox: {
    flex: 1,
    marginRight: 8,
  },
  tierCodeName: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  tierMainTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  clearanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  clearanceBadgeGranted: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
  },
  clearanceBadgeDenied: {
    backgroundColor: 'rgba(255, 51, 75, 0.15)',
    borderColor: '#FF334B',
  },
  clearanceBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  clearanceBadgeTextGranted: {
    color: '#00E676',
  },
  clearanceBadgeTextDenied: {
    color: '#FF5252',
  },
  tierLoreText: {
    fontSize: 11,
    color: '#90A4AE',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  requirementsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#26303E',
    gap: 6,
  },
  requirementsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00F0FF',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  reqItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CFD8DC',
    width: 125,
  },
  reqValue: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#00E676',
  },
  reqValueFailed: {
    color: '#FF5252',
    fontWeight: '700',
  },
  tierTargetStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E2533',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  tierTargetStat: {
    alignItems: 'center',
  },
  tierTargetLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#90A4AE',
    letterSpacing: 0.5,
  },
  tierTargetValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFD700',
    marginTop: 1,
  },
  lootItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lootEquipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
  },
  lootEquipBadgeReady: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
  },
  lootEquipBadgeLocked: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderColor: '#FFB800',
  },
  lootEquipBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  lootEquipBadgeTextReady: {
    color: '#00E676',
  },
  lootEquipBadgeTextLocked: {
    color: '#FFB800',
  },
  assaultBtnLocked: {
    backgroundColor: '#1E2533',
    borderWidth: 1.5,
    borderColor: '#37474F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  assaultBtnLockedTextBox: {
    alignItems: 'center',
  },
  assaultBtnLockedText: {
    color: '#90A4AE',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  assaultBtnLockedSubtext: {
    color: '#FF5252',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A1E27',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3240',
  },
  modeTabActive: {
    backgroundColor: '#1E2D27',
    borderColor: '#00E676',
  },
  modeTabText: {
    color: '#90A4AE',
    fontSize: 11,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#00E676',
    fontWeight: '800',
  },
  bossCard: {
    backgroundColor: '#181C25',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
  },
  bossTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factionTag: {
    backgroundColor: '#10131A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  factionTagText: {
    color: '#B0BEC5',
    fontSize: 10,
    fontWeight: '800',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  activePillText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '800',
  },
  defeatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  defeatedPillText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
  },
  escapedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#37474F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  escapedPillText: {
    color: '#B0BEC5',
    fontSize: 10,
    fontWeight: '800',
  },
  returningNemesisPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 145, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 145, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  returningNemesisPillText: {
    color: '#FF9100',
    fontSize: 10,
    fontWeight: '800',
  },
  returningWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 145, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 145, 0, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  returningWarningText: {
    color: '#FFB74D',
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
    fontWeight: '600',
  },
  bossProfileRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  bossAvatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bossInfoCol: {
    flex: 1,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffStandard: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  diffChallenging: {
    backgroundColor: 'rgba(255, 183, 77, 0.25)',
  },
  diffLegendary: {
    backgroundColor: 'rgba(229, 57, 53, 0.25)',
  },
  difficultyBadgeText: {
    color: '#ECEFF1',
    fontSize: 9,
    fontWeight: '800',
  },
  subfactionTag: {
    backgroundColor: '#26303E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subfactionTagText: {
    color: '#B0BEC5',
    fontSize: 9,
    fontWeight: '700',
  },
  bossHonorificText: {
    color: '#FFB74D',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bossNameText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 1,
  },
  bossTitleText: {
    color: '#90A4AE',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  roleArchetypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  combatRoleText: {
    color: '#80DEEA',
    fontSize: 10,
    fontWeight: '800',
  },
  dot: {
    color: '#546E7A',
    fontSize: 10,
  },
  archetypeText: {
    color: '#B0BEC5',
    fontSize: 10,
    fontWeight: '600',
  },
  healthBlock: {
    gap: 6,
  },
  healthNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthLabel: {
    color: '#90A4AE',
    fontSize: 11,
    fontWeight: '700',
  },
  healthValue: {
    color: '#ECEFF1',
    fontSize: 12,
    fontWeight: '800',
  },
  hpTrack: {
    height: 14,
    backgroundColor: '#10131A',
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
  },
  hpFill: {
    height: '100%',
    borderRadius: 7,
  },
  phaseDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  phaseLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phaseThresholdText: {
    color: '#78909C',
    fontSize: 9,
    fontWeight: '600',
  },
  armamentsCard: {
    backgroundColor: '#13161E',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  armamentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  armamentLabel: {
    color: '#90A4AE',
    fontSize: 11,
    fontWeight: '700',
  },
  armamentValue: {
    color: '#ECEFF1',
    fontSize: 11,
    flex: 1,
  },
  phasesSection: {
    gap: 8,
  },
  phasesSectionTitle: {
    color: '#ECEFF1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  phaseItemBox: {
    backgroundColor: '#141821',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#26303E',
  },
  phaseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phaseItemTitleText: {
    color: '#CFD8DC',
    fontSize: 11,
    fontWeight: '700',
  },
  phaseTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phaseTagCleared: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  phaseTagUpcoming: {
    backgroundColor: '#26303E',
  },
  phaseTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  phaseItemDescText: {
    color: '#B0BEC5',
    fontSize: 10,
    lineHeight: 14,
  },
  phaseItemTauntText: {
    color: '#FFB74D',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
  loreText: {
    color: '#90A4AE',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  leaderboardBox: {
    backgroundColor: '#161922',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26303E',
  },
  leaderboardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  leaderboardTitleText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyContribText: {
    color: '#78909C',
    fontSize: 11,
    fontStyle: 'italic',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#202632',
  },
  rankText: {
    color: '#FFB74D',
    fontSize: 12,
    fontWeight: '800',
    width: 26,
  },
  callerInfo: {
    flex: 1,
  },
  callsignText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsText: {
    color: '#78909C',
    fontSize: 10,
    marginTop: 1,
  },
  damageInfo: {
    alignItems: 'flex-end',
  },
  damageValue: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '800',
  },
  shareValue: {
    color: '#90A4AE',
    fontSize: 10,
    marginTop: 1,
  },
  actionFooter: {
    gap: 10,
  },
  assaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D32F2F',
    paddingVertical: 14,
    borderRadius: 10,
  },
  assaultBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 10,
  },
  claimBtnText: {
    color: '#121212',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  claimedPillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingVertical: 12,
    borderRadius: 10,
  },
  claimedPillText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '800',
  },
  escapedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#26303E',
    padding: 10,
    borderRadius: 8,
  },
  escapedBoxText: {
    color: '#B0BEC5',
    fontSize: 11,
    flex: 1,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#202632',
    paddingVertical: 11,
    borderRadius: 8,
  },
  historyBtnText: {
    color: '#B0BEC5',
    fontSize: 11,
    fontWeight: '700',
  },
  lootTableCard: {
    backgroundColor: '#1E2530',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2C3545',
    marginBottom: 16,
  },
  lootTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lootTableTitle: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  lootTableSubtitle: {
    color: '#90A4AE',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 10,
  },
  lootItemsList: {
    gap: 6,
  },
  lootItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2A3648',
    borderLeftWidth: 3,
  },
  lootItemName: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  lootItemStats: {
    fontSize: 10,
    color: '#90A4AE',
    marginTop: 2,
  },
});
