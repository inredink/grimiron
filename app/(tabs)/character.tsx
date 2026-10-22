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
});
