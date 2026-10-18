import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { THEME } from '../../src/constants/theme';
import { SciFiCard } from '../../src/components/SciFiCard';
import { ProgressBar } from '../../src/components/ProgressBar';
import { Badge } from '../../src/components/Badge';
import { PlaceholderPortrait } from '../../src/components/PlaceholderPortrait';
import { TerminalButton } from '../../src/components/TerminalButton';
import { CoopRaidModal } from '../../src/components/CoopRaidModal';
import { Ionicons } from '@expo/vector-icons';
import { getRankForXp } from '../../src/content/warhammer40k';

export default function CharacterScreen() {
  const router = useRouter();
  const {
    character,
    progression,
    stats,
    currentFaction,
    currentSubfaction,
    activeWorkout,
    startNewWorkout,
    activeCoopRaid,
    setActiveCoopRaid,
  } = useApp();

  const [isCoopModalVisible, setIsCoopModalVisible] = useState(false);

  const { currentRank } = getRankForXp(currentFaction, character.totalXp);

  const handleStartWorkout = () => {
    if (!activeWorkout) {
      startNewWorkout('Crusade Training');
    }
    router.push('/(tabs)/workout');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Terminal Header Bar */}
        <View style={styles.terminalHeader}>
          <View style={styles.terminalStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.terminalStatusText}>TACTICAL TERMINAL // ONLINE</Text>
          </View>
          <Text style={styles.terminalDate}>
            M41.{new Date().getFullYear()}
          </Text>
        </View>

        {/* Character Dossier Hero Card */}
        <SciFiCard variant="accent" style={styles.heroCard}>
          <View style={styles.heroContent}>
            {/* 2D Portrait with reticle */}
            <PlaceholderPortrait
              faction={currentFaction}
              subfaction={currentSubfaction}
              currentRank={currentRank}
              level={progression.level}
              size={120}
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

              <Text style={styles.rankTitle} numberOfLines={2}>
                {progression.currentRankTitle.toUpperCase()}
              </Text>

              <Text style={styles.factionName} numberOfLines={1}>
                {currentFaction.name}
              </Text>

              {currentSubfaction && (
                <Text style={styles.subfactionName} numberOfLines={1}>
                  {currentSubfaction.name}
                </Text>
              )}

              {currentSubfaction?.motto && (
                <Text style={styles.mottoText} numberOfLines={1}>
                  "{currentSubfaction.motto}"
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
              height={10}
            />
            <Text style={styles.xpTotalText}>
              Cumulative Career Glory: <Text style={styles.xpHighlight}>{character.totalXp.toLocaleString()} XP</Text>
            </Text>
          </View>
        </SciFiCard>

        {/* Next Rank Horizon */}
        {progression.nextRankTitle && (
          <SciFiCard
            title="NEXT PROMOTION TARGET"
            rightAction={
              <Text style={styles.remainingXpText}>
                {progression.xpNeededForNextRank} XP TO ADVANCE
              </Text>
            }
          >
            <View style={styles.nextRankRow}>
              <Ionicons
                name="chevron-forward-circle-outline"
                size={22}
                color={THEME.colors.secondary}
              />
              <View style={styles.nextRankInfo}>
                <Text style={styles.nextRankName}>
                  {progression.nextRankTitle}
                </Text>
                <ProgressBar
                  progress={progression.rankProgressPercent}
                  color={THEME.colors.secondary}
                  height={6}
                />
              </View>
            </View>
          </SciFiCard>
        )}

        {/* Career Statistics */}
        <SciFiCard title="CRUSADE COMBAT METRICS">
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="barbell-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
              <Text style={styles.statLabel}>MISSIONS</Text>
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

        {/* Quick Launch Buttons */}
        <View style={styles.actionButtons}>
          <TerminalButton
            title={activeWorkout ? 'RESUME ACTIVE WORKOUT' : 'START NEW WORKOUT'}
            onPress={handleStartWorkout}
            variant="primary"
            size="lg"
            icon={
              <Ionicons
                name="fitness-outline"
                size={20}
                color="#0A0E17"
              />
            }
            style={styles.primaryAction}
          />

          <TerminalButton
            title="CRUSADE SQUAD // CO-OP RAID"
            onPress={() => setIsCoopModalVisible(true)}
            variant={activeCoopRaid ? 'primary' : 'outline'}
            size="md"
            icon={
              <Ionicons
                name="people-outline"
                size={18}
                color={THEME.colors.primary}
              />
            }
          />

          <TerminalButton
            title="BROWSE FACTION CODEX"
            onPress={() => router.push('/(tabs)/factions')}
            variant="outline"
            size="md"
            icon={
              <Ionicons
                name="planet-outline"
                size={16}
                color={THEME.colors.primary}
              />
            }
          />
        </View>
      </ScrollView>

      {/* Cooperative Crusade Squad & Raid Modal */}
      <CoopRaidModal
        visible={isCoopModalVisible}
        onClose={() => setIsCoopModalVisible(false)}
        activeRaid={activeCoopRaid}
        onSelectActiveRaid={setActiveCoopRaid}
      />
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
    paddingBottom: THEME.spacing.xl,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
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
  terminalDate: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
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
  rankTitle: {
    color: THEME.colors.textBright,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  factionName: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  subfactionName: {
    color: THEME.colors.textMain,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  mottoText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 3,
  },
  progressSection: {
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
  },
  xpTotalText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  xpHighlight: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  remainingXpText: {
    color: THEME.colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  nextRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextRankInfo: {
    flex: 1,
    marginLeft: 8,
  },
  nextRankName: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: THEME.colors.surfaceRaised,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  statValue: {
    color: THEME.colors.textBright,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  actionButtons: {
    marginTop: THEME.spacing.md,
  },
  primaryAction: {
    marginBottom: THEME.spacing.sm,
  },
});
