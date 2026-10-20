import React, { useState } from 'react';
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

export default function RaidScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    weeklyRaid,
    warfrontSettings,
    setWarfrontSpawnDay,
    deployWeeklyRaid,
    claimWeeklyRaidRewardsAction,
  } = useApp();

  const [previewMode, setPreviewMode] = useState<'individual' | 'squad'>('individual');

  if (!weeklyRaid) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="skull" size={48} color="#FF5252" />
          <Text style={styles.loadingTitle}>SCANNING WAR SECTOR...</Text>
          <Text style={styles.loadingSubtitle}>
            Calibrating orbital auspex sensors for hostile commanders.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { boss, maxHp, currentHp, status, isRewardClaimed, contributions, spawnDay, expiresAt, timezone } =
    weeklyRaid;
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

  const handleDeployStrike = () => {
    triggerHaptic.medium();
    deployWeeklyRaid(weeklyRaid);
    router.push('/(tabs)/workout');
  };

  const handleClaimSpoils = () => {
    const success = claimWeeklyRaidRewardsAction(weeklyRaid.cycleId);
    if (success) {
      triggerHaptic.success();
      Alert.alert('Spoils Claimed', `Awarded +500 Glory XP for neutralizing ${boss.name}!`);
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
            Cycle: {weeklyRaid.cycleId} • Saturday Reset
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

        {/* Action Button Footer */}
        <View style={styles.actionFooter}>
          {status === 'active' && (
            <TouchableOpacity style={styles.assaultBtn} onPress={handleDeployStrike}>
              <Ionicons name="flame" size={18} color="#FFFFFF" />
              <Text style={styles.assaultBtnText}>DEPLOY ASSAULT STRIKE</Text>
            </TouchableOpacity>
          )}

          {status === 'defeated' && !isRewardClaimed && (
            <TouchableOpacity style={styles.claimBtn} onPress={handleClaimSpoils}>
              <Ionicons name="trophy" size={18} color="#121212" />
              <Text style={styles.claimBtnText}>CLAIM VICTORY SPOILS (+500 XP)</Text>
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
});
