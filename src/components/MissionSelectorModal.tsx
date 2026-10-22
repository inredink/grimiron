import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { MISSION_CATALOG } from '../content/combat/missions';
import { getEnemyById } from '../content/combat/enemies';
import { CombatMission } from '../types/combat';
import { Ionicons } from '@expo/vector-icons';
import { TerminalButton } from './TerminalButton';
import { getSafeIoniconsName } from '../utils/iconHelper';
import { isNamedEnemyDefeated } from '../services/database/namedEnemyRepository';
import { triggerHaptic } from '../utils/haptics';

interface MissionSelectorModalProps {
  visible: boolean;
  selectedMissionId: string;
  onSelectMission: (mission: CombatMission) => void;
  onClose: () => void;
}

export const MissionSelectorModal: React.FC<MissionSelectorModalProps> = ({
  visible,
  selectedMissionId,
  onSelectMission,
  onClose,
}) => {
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>CRUSADE OBJECTIVES</Text>
              <Text style={styles.headerTitle}>SELECT COMBAT MISSION</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.instructions}>
            Select a hostile target to engage during this training session. Defeating enemies awards bonus Glory XP and records battle honors.
          </Text>

          {/* Missions List */}
          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {MISSION_CATALOG.map((mission) => {
              const enemy = getEnemyById(mission.enemyId);
              const isSelected = mission.id === selectedMissionId;
              const isDefeatedBoss = isNamedEnemyDefeated(enemy.name) || isNamedEnemyDefeated(enemy.id);
              const isExpanded = expandedMissionId === mission.id;

              return (
                <TouchableOpacity
                  key={mission.id}
                  style={[
                    styles.missionCard,
                    isSelected && styles.missionCardSelected,
                    isDefeatedBoss && { opacity: 0.65, borderColor: '#374151' },
                    isExpanded && { borderColor: THEME.colors.primary, backgroundColor: '#0B1322' },
                    { borderColor: isSelected ? THEME.colors.primary : isDefeatedBoss ? '#374151' : THEME.colors.surfaceBorder },
                  ]}
                  onPress={() => setExpandedMissionId(isExpanded ? null : mission.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.enemyBadge,
                        {
                          borderColor: isDefeatedBoss ? '#6B7280' : enemy.visual.primaryColor,
                          backgroundColor: '#101726',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isDefeatedBoss ? 'skull' : getSafeIoniconsName(enemy.visual.iconName, 'skull')}
                        size={20}
                        color={isDefeatedBoss ? '#EF4444' : enemy.visual.primaryColor}
                      />
                    </View>

                    <View style={styles.cardInfo}>
                      <View style={styles.difficultyRow}>
                        <Text style={styles.enemyFaction}>{enemy.faction.toUpperCase()}</Text>
                        <View
                          style={[
                            styles.diffBadge,
                            { borderColor: isDefeatedBoss ? '#EF4444' : enemy.visual.accentColor },
                          ]}
                        >
                          <Text
                            style={[
                              styles.diffBadgeText,
                              { color: isDefeatedBoss ? '#EF4444' : enemy.visual.accentColor },
                            ]}
                          >
                            {isDefeatedBoss ? 'NEUTRALIZED' : mission.difficulty.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.missionTitle, isDefeatedBoss && { textDecorationLine: 'line-through', color: THEME.colors.textMuted }]}>{mission.title}</Text>
                      <Text style={styles.enemyName}>Target: {enemy.name} {isDefeatedBoss ? '(SLAIN)' : ''}</Text>
                    </View>

                    <Ionicons
                      name={isExpanded ? 'chevron-up' : isSelected ? 'checkmark-circle' : 'chevron-down'}
                      size={22}
                      color={isDefeatedBoss ? '#6B7280' : isSelected ? THEME.colors.primary : THEME.colors.textMuted}
                      style={{ marginLeft: 6 }}
                    />
                  </View>

                  <Text style={styles.briefingText} numberOfLines={isExpanded ? undefined : 2}>
                    {isDefeatedBoss ? 'Adversary has been slain and neutralized in the imperial ledger.' : mission.briefing}
                  </Text>

                  {/* Expanded Tactical Intel */}
                  {isExpanded && (
                    <View style={styles.expandedIntelBox}>
                      <Text style={styles.intelHeader}>TARGET DOSSIER & COMBAT PROFILE</Text>
                      <Text style={styles.loreText}>{enemy.loreDescription}</Text>
                      <Text style={styles.tauntText}>"{isDefeatedBoss ? (enemy.defeatQuote || 'Target eradicated.') : enemy.tauntQuote}"</Text>

                      <View style={styles.actionRow}>
                        <TerminalButton
                          title={
                            isDefeatedBoss
                              ? "WARLORD PERMANENTLY NEUTRALIZED"
                              : isSelected
                              ? "CURRENTLY ARMED"
                              : "SELECT & ARM MISSION"
                          }
                          disabled={isDefeatedBoss}
                          onPress={() => {
                            if (isDefeatedBoss) return;
                            triggerHaptic.selection();
                            onSelectMission(mission);
                            setExpandedMissionId(null);
                          }}
                          variant={isDefeatedBoss ? "outline" : isSelected ? "primary" : "secondary"}
                          size="sm"
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  )}

                  {/* Mission Specs Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.specItem}>
                      <Ionicons name="heart-outline" size={12} color={THEME.colors.danger} />
                      <Text style={styles.specText}>{enemy.baseHealth} HP</Text>
                    </View>
                    <View style={styles.specItem}>
                      <Ionicons name="barbell-outline" size={12} color={THEME.colors.secondary} />
                      <Text style={styles.specText}>~{mission.recommendedSets} sets</Text>
                    </View>
                    <View style={styles.specItem}>
                      <Ionicons name="trophy-outline" size={12} color={THEME.colors.primary} />
                      <Text style={[styles.specText, { color: THEME.colors.primary }]}>
                        +{mission.gloryBonusXp} Glory XP
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TerminalButton
            title="CONFIRM TARGET"
            onPress={onClose}
            variant="primary"
            size="md"
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLabel: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    color: THEME.colors.textBright,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  instructions: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
  scrollList: {
    maxHeight: 460,
  },
  missionCard: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  missionCardSelected: {
    backgroundColor: '#121A2B',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  enemyBadge: {
    width: 38,
    height: 38,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  enemyFaction: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginRight: 6,
  },
  diffBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
  },
  diffBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  missionTitle: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '800',
  },
  enemyName: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  briefingText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  expandedIntelBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    marginTop: 2,
  },
  intelHeader: {
    color: THEME.colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  loreText: {
    color: THEME.colors.textMain,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
  },
  tauntText: {
    color: THEME.colors.warning,
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 14,
    marginBottom: 6,
  },
  actionRow: {
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    paddingTop: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specText: {
    color: THEME.colors.textBright,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
});
