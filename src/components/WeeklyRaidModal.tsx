import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeeklyRaidCycle, RaidSpawnDay } from '../types/warfront';
import { getSafeIoniconsName } from '../utils/iconHelper';

interface WeeklyRaidModalProps {
  visible: boolean;
  onClose: () => void;
  weeklyRaid: WeeklyRaidCycle | null;
  preferredSpawnDay: RaidSpawnDay;
  onSetSpawnDay: (day: RaidSpawnDay) => void;
  onDeployRaidWorkout: (raid: WeeklyRaidCycle) => void;
  onClaimRewards: (cycleId: string) => void;
}

export const WeeklyRaidModal: React.FC<WeeklyRaidModalProps> = ({
  visible,
  onClose,
  weeklyRaid,
  preferredSpawnDay,
  onSetSpawnDay,
  onDeployRaidWorkout,
  onClaimRewards,
}) => {
  if (!weeklyRaid) return null;

  const { boss, maxHp, currentHp, status, isRewardClaimed, contributions } = weeklyRaid;
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="skull" size={26} color="#FF5252" />
              <View>
                <Text style={styles.headerTitle}>WEEKLY RAID ENCOUNTER</Text>
                <Text style={styles.headerSubtitle}>
                  Cycle: {weeklyRaid.cycleId} • {weeklyRaid.scope.toUpperCase()} RAID
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#CFD8DC" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} contentContainerStyle={styles.scrollContent}>
            {/* Preferred Spawn Day Configuration Pill */}
            <View style={styles.configCard}>
              <View style={styles.configHeader}>
                <Ionicons name="calendar-outline" size={16} color="#FFB74D" />
                <Text style={styles.configTitle}>WEEKLY SPAWN SCHEDULE</Text>
              </View>
              <Text style={styles.configDesc}>
                Choose which day your weekly raid boss deploys:
              </Text>
              <View style={styles.daySelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.dayButton,
                    preferredSpawnDay === 'friday' && styles.dayButtonActive,
                  ]}
                  onPress={() => onSetSpawnDay('friday')}
                >
                  <Ionicons
                    name={preferredSpawnDay === 'friday' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={preferredSpawnDay === 'friday' ? '#00E676' : '#78909C'}
                  />
                  <Text
                    style={[
                      styles.dayButtonText,
                      preferredSpawnDay === 'friday' && styles.dayButtonTextActive,
                    ]}
                  >
                    Friday Spawn
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dayButton,
                    preferredSpawnDay === 'saturday' && styles.dayButtonActive,
                  ]}
                  onPress={() => onSetSpawnDay('saturday')}
                >
                  <Ionicons
                    name={preferredSpawnDay === 'saturday' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={preferredSpawnDay === 'saturday' ? '#00E676' : '#78909C'}
                  />
                  <Text
                    style={[
                      styles.dayButtonText,
                      preferredSpawnDay === 'saturday' && styles.dayButtonTextActive,
                    ]}
                  >
                    Saturday Spawn
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Boss Banner Card */}
            <View style={[styles.bossCard, { borderColor: boss.primaryColor }]}>
              {/* Top Meta Bar */}
              <View style={styles.bossTopMeta}>
                <View style={styles.factionPill}>
                  <Text style={styles.factionPillText}>{boss.factionName.toUpperCase()}</Text>
                </View>

                {status === 'active' && (
                  <View style={styles.activeRaidPill}>
                    <Ionicons name="radio-outline" size={12} color="#00E676" />
                    <Text style={styles.activeRaidPillText}>ENGAGEMENT ACTIVE</Text>
                  </View>
                )}

                {status === 'defeated' && (
                  <View style={styles.defeatedPill}>
                    <Ionicons name="trophy" size={12} color="#FFD700" />
                    <Text style={styles.defeatedPillText}>WARLORD SLAIN</Text>
                  </View>
                )}

                {status === 'escaped' && (
                  <View style={styles.escapedPill}>
                    <Ionicons name="exit-outline" size={12} color="#9E9E9E" />
                    <Text style={styles.escapedPillText}>WARLORD ESCAPED</Text>
                  </View>
                )}
              </View>

              {/* Boss Visual Icon & Identity */}
              <View style={styles.bossIdentityRow}>
                <View style={[styles.bossIconCircle, { backgroundColor: boss.primaryColor }]}>
                  <Ionicons name={getSafeIoniconsName(boss.glyph, 'skull')} size={36} color="#FFFFFF" />
                </View>
                <View style={styles.bossIdentityInfo}>
                  <View style={styles.tierAndSubfactionRow}>
                    <View
                      style={[
                        styles.tierBadge,
                        boss.difficultyTier === 'legendary'
                          ? styles.tierLegendary
                          : boss.difficultyTier === 'challenging'
                          ? styles.tierChallenging
                          : styles.tierStandard,
                      ]}
                    >
                      <Text style={styles.tierBadgeText}>
                        {boss.difficultyTier?.toUpperCase() || 'STANDARD'} THREAT
                      </Text>
                    </View>
                    {boss.subfactionName ? (
                      <View style={styles.subfactionBadge}>
                        <Text style={styles.subfactionBadgeText}>{boss.subfactionName}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.bossHonorific}>{boss.honorific}</Text>
                  <Text style={styles.bossName}>{boss.name}</Text>
                  <Text style={styles.bossTitle}>{boss.title}</Text>
                  <View style={styles.roleAndArchetypeRow}>
                    <Text style={styles.roleText}>{boss.combatRole || 'Hostile Commander'}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.archetypeText}>{boss.archetype || 'Crusade Boss'}</Text>
                  </View>
                </View>
              </View>

              {/* Schedule and Timezone Metadata */}
              <View style={styles.scheduleInfoRow}>
                <View style={styles.scheduleInfoItem}>
                  <Ionicons name="time-outline" size={13} color="#90A4AE" />
                  <Text style={styles.scheduleInfoText}>
                    Expires: {new Date(weeklyRaid.expiresAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.scheduleInfoItem}>
                  <Ionicons name="globe-outline" size={13} color="#90A4AE" />
                  <Text style={styles.scheduleInfoText}>
                    Zone: {weeklyRaid.timezone || 'Local'}
                  </Text>
                </View>
                <View style={styles.scheduleInfoItem}>
                  <Ionicons name="shield-outline" size={13} color="#90A4AE" />
                  <Text style={styles.scheduleInfoText}>
                    Spawn: {weeklyRaid.spawnDay.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Health Gauge */}
              <View style={styles.healthContainer}>
                <View style={styles.healthLabels}>
                  <Text style={styles.healthTitle}>BOSS REINFORCEMENTS</Text>
                  <Text style={styles.healthNumbers}>
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
                  {/* Phase Dividers */}
                  <View style={[styles.phaseMarker, { left: '33%' }]} />
                  <View style={[styles.phaseMarker, { left: '66%' }]} />
                </View>

                <View style={styles.phaseLabelsRow}>
                  <Text style={styles.phaseLabelText}>Phase 3 (33%)</Text>
                  <Text style={styles.phaseLabelText}>Phase 2 (66%)</Text>
                  <Text style={styles.phaseLabelText}>Phase 1 (100%)</Text>
                </View>
              </View>

              {/* Dynamic Phases Overview */}
              <View style={styles.phasesSection}>
                <Text style={styles.phasesSectionTitle}>COMBAT PHASES & TACTICAL SHIFTS</Text>
                {boss.phases.map((ph, idx) => {
                  const isPassed = (idx === 0 && hpPercent <= 66) || (idx === 1 && hpPercent <= 33);
                  const isCurrent = idx === currentPhaseIndex;
                  const isUpcoming = !isPassed && !isCurrent;

                  return (
                    <View
                      key={ph.phaseNumber}
                      style={[
                        styles.phaseItem,
                        isCurrent && {
                          borderColor: ph.visualColor,
                          borderWidth: 1.5,
                          backgroundColor: '#1E2533',
                        },
                        isPassed && { opacity: 0.6 },
                      ]}
                    >
                      <View style={styles.phaseItemHeader}>
                        <View style={styles.phaseItemTitleRow}>
                          <Ionicons
                            name={
                              isPassed
                                ? 'checkmark-circle'
                                : isCurrent
                                ? 'radio-button-on'
                                : 'lock-closed-outline'
                            }
                            size={14}
                            color={isPassed ? '#00E676' : isCurrent ? ph.visualColor : '#78909C'}
                          />
                          <Text
                            style={[
                              styles.phaseItemTitle,
                              isCurrent && { color: ph.visualColor, fontWeight: '800' },
                            ]}
                          >
                            {ph.title}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.phaseStatusBadge,
                            isPassed && styles.phaseStatusCleared,
                            isCurrent && { backgroundColor: ph.visualColor },
                            isUpcoming && styles.phaseStatusUpcoming,
                          ]}
                        >
                          <Text style={styles.phaseStatusBadgeText}>
                            {isPassed ? 'CLEARED' : isCurrent ? 'ENGAGED' : 'UPCOMING'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.phaseItemDesc}>{ph.description}</Text>
                      {isCurrent && <Text style={styles.phaseItemTaunt}>"{ph.taunt}"</Text>}
                    </View>
                  );
                })}
              </View>

              {/* Weapon & Trait Details */}
              <View style={styles.gearDetails}>
                <View style={styles.gearRow}>
                  <Ionicons name="hammer-outline" size={14} color="#FFB74D" />
                  <Text style={styles.gearLabel}>Signature Weapon:</Text>
                  <Text style={styles.gearValue}>{boss.signatureWeapon}</Text>
                </View>
                <View style={styles.gearRow}>
                  <Ionicons name="shield-outline" size={14} color="#80DEEA" />
                  <Text style={styles.gearLabel}>Combat Trait:</Text>
                  <Text style={styles.gearValue}>{boss.combatTrait}</Text>
                </View>
              </View>

              {/* Lore Paragraph */}
              <Text style={styles.bossLoreText}>{boss.loreDescription}</Text>
            </View>

            {/* Unresolved Escaped Banner */}
            {status === 'escaped' && (
              <View style={styles.escapedBannerBox}>
                <Ionicons name="information-circle" size={20} color="#B0BEC5" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.escapedBannerTitle}>CYCLE EXPIRED — ENEMY RETREATED</Text>
                  <Text style={styles.escapedBannerText}>
                    The weekly cycle concluded before total elimination. The warlord retreated
                    into deep orbit. All damage dealt and individual combat records have been
                    preserved in the annals of war history.
                  </Text>
                </View>
              </View>
            )}

            {/* Squad / Participant Contribution Leaderboard */}
            <View style={styles.leaderboardCard}>
              <View style={styles.leaderboardHeader}>
                <Ionicons name="people" size={18} color="#FFD700" />
                <Text style={styles.leaderboardTitle}>PARTICIPANT CONTRIBUTIONS</Text>
              </View>

              {participantsList.length === 0 ? (
                <Text style={styles.noContributionsText}>
                  No assault damage logged yet for this weekly cycle. Deploy a training session to
                  strike the boss!
                </Text>
              ) : (
                participantsList.map((p, idx) => {
                  const sharePercent = Math.min(
                    100,
                    Math.round((p.damage / maxHp) * 100)
                  );
                  return (
                    <View key={p.userId} style={styles.participantRow}>
                      <Text style={styles.participantRank}>#{idx + 1}</Text>
                      <View style={styles.participantDetails}>
                        <Text style={styles.participantCallsign}>{p.callsign}</Text>
                        <Text style={styles.participantWorkouts}>
                          {p.workoutsCount} workouts • {p.attacksCount} attacks landed
                        </Text>
                      </View>
                      <View style={styles.participantNumbers}>
                        <Text style={styles.participantDamage}>
                          {p.damage.toLocaleString()} DMG
                        </Text>
                        <Text style={styles.participantShare}>{sharePercent}% share</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            {status === 'active' && (
              <TouchableOpacity
                style={styles.assaultButton}
                onPress={() => {
                  onDeployRaidWorkout(weeklyRaid);
                  onClose();
                }}
              >
                <Ionicons name="flame" size={18} color="#FFFFFF" />
                <Text style={styles.assaultButtonText}>ASSAULT RAID BOSS</Text>
              </TouchableOpacity>
            )}

            {status === 'defeated' && !isRewardClaimed && (
              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => onClaimRewards(weeklyRaid.cycleId)}
              >
                <Ionicons name="trophy" size={18} color="#121212" />
                <Text style={styles.claimButtonText}>CLAIM SPOILS OF WAR (+500 XP)</Text>
              </TouchableOpacity>
            )}

            {status === 'defeated' && isRewardClaimed && (
              <View style={styles.claimedBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#00E676" />
                <Text style={styles.claimedBannerText}>SPOILS OF WAR CLAIMED</Text>
              </View>
            )}

            {status === 'escaped' && (
              <TouchableOpacity style={styles.closeFooterButton} onPress={onClose}>
                <Text style={styles.closeFooterButtonText}>DISMISS REPORT</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#161920',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '94%',
    minHeight: '88%',
    borderWidth: 1,
    borderColor: '#37474F',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#263238',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#ECEFF1',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: '#90A4AE',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  configCard: {
    backgroundColor: '#1C212B',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C3440',
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  configTitle: {
    color: '#FFB74D',
    fontSize: 12,
    fontWeight: '800',
  },
  configDesc: {
    color: '#90A4AE',
    fontSize: 11,
    marginBottom: 10,
  },
  daySelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#263238',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#37474F',
  },
  dayButtonActive: {
    backgroundColor: '#1E392A',
    borderColor: '#00E676',
  },
  dayButtonText: {
    color: '#B0BEC5',
    fontSize: 12,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#00E676',
    fontWeight: '800',
  },
  bossCard: {
    backgroundColor: '#212631',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
  },
  bossTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  factionPill: {
    backgroundColor: '#12151B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  factionPillText: {
    color: '#CFD8DC',
    fontSize: 10,
    fontWeight: '800',
  },
  activeRaidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeRaidPillText: {
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
    borderRadius: 6,
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
    borderRadius: 6,
  },
  escapedPillText: {
    color: '#B0BEC5',
    fontSize: 10,
    fontWeight: '800',
  },
  bossIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  bossIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bossIdentityInfo: {
    flex: 1,
  },
  tierAndSubfactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierStandard: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  tierChallenging: {
    backgroundColor: 'rgba(255, 183, 77, 0.25)',
  },
  tierLegendary: {
    backgroundColor: 'rgba(229, 57, 53, 0.25)',
  },
  tierBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ECEFF1',
    letterSpacing: 0.5,
  },
  subfactionBadge: {
    backgroundColor: '#263238',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subfactionBadgeText: {
    color: '#B0BEC5',
    fontSize: 9,
    fontWeight: '700',
  },
  roleAndArchetypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  roleText: {
    color: '#80DEEA',
    fontSize: 10,
    fontWeight: '800',
  },
  dotSeparator: {
    color: '#546E7A',
    fontSize: 10,
  },
  archetypeText: {
    color: '#B0BEC5',
    fontSize: 10,
    fontWeight: '600',
  },
  scheduleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#181C24',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  scheduleInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleInfoText: {
    color: '#90A4AE',
    fontSize: 10,
    fontWeight: '600',
  },
  phasesSection: {
    marginBottom: 14,
    gap: 8,
  },
  phasesSectionTitle: {
    color: '#ECEFF1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  phaseItem: {
    backgroundColor: '#1A1E26',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2C3440',
  },
  phaseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phaseItemTitle: {
    color: '#CFD8DC',
    fontSize: 11,
    fontWeight: '700',
  },
  phaseStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phaseStatusCleared: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  phaseStatusUpcoming: {
    backgroundColor: '#263238',
  },
  phaseStatusBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  phaseItemDesc: {
    color: '#B0BEC5',
    fontSize: 10,
    lineHeight: 14,
  },
  phaseItemTaunt: {
    color: '#FFB74D',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
  bossHonorific: {
    color: '#FFB74D',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bossName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  bossTitle: {
    color: '#90A4AE',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  healthContainer: {
    marginBottom: 14,
  },
  healthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  healthTitle: {
    color: '#90A4AE',
    fontSize: 11,
    fontWeight: '700',
  },
  healthNumbers: {
    color: '#ECEFF1',
    fontSize: 12,
    fontWeight: '800',
  },
  hpTrack: {
    height: 14,
    backgroundColor: '#12151B',
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
  },
  hpFill: {
    height: '100%',
    borderRadius: 7,
  },
  phaseMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  phaseLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  phaseLabelText: {
    color: '#78909C',
    fontSize: 9,
    fontWeight: '600',
  },
  phaseDossier: {
    backgroundColor: '#1A1E26',
    borderLeftWidth: 3,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  phaseDossierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  phaseDossierTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  phaseDossierDesc: {
    color: '#CFD8DC',
    fontSize: 11,
    lineHeight: 16,
  },
  phaseDossierTaunt: {
    color: '#FFB74D',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  gearDetails: {
    backgroundColor: '#181C24',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  gearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gearLabel: {
    color: '#90A4AE',
    fontSize: 11,
    fontWeight: '700',
  },
  gearValue: {
    color: '#ECEFF1',
    fontSize: 11,
    flex: 1,
  },
  bossLoreText: {
    color: '#B0BEC5',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  escapedBannerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#263238',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#455A64',
  },
  escapedBannerTitle: {
    color: '#ECEFF1',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  escapedBannerText: {
    color: '#B0BEC5',
    fontSize: 11,
    lineHeight: 16,
  },
  leaderboardCard: {
    backgroundColor: '#1E232D',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2C3440',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  leaderboardTitle: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noContributionsText: {
    color: '#78909C',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#263238',
  },
  participantRank: {
    color: '#FFB74D',
    fontSize: 13,
    fontWeight: '800',
    width: 28,
  },
  participantDetails: {
    flex: 1,
  },
  participantCallsign: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  participantWorkouts: {
    color: '#78909C',
    fontSize: 10,
    marginTop: 2,
  },
  participantNumbers: {
    alignItems: 'flex-end',
  },
  participantDamage: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '800',
  },
  participantShare: {
    color: '#90A4AE',
    fontSize: 10,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  assaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D32F2F',
    paddingVertical: 14,
    borderRadius: 10,
  },
  assaultButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 10,
  },
  claimButtonText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  claimedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingVertical: 14,
    borderRadius: 10,
  },
  claimedBannerText: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeFooterButton: {
    backgroundColor: '#37474F',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    color: '#ECEFF1',
    fontSize: 13,
    fontWeight: '700',
  },
});
