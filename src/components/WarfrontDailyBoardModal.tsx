import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DailyRotationRecord,
  EncounterCategory,
  EncounterTemplate,
} from '../types/warfront';
import { getSafeIoniconsName } from '../utils/iconHelper';
import {
  getEncounterById,
  getEncountersByCategory,
  allEncounterTemplates,
} from '../content/encounters/catalog';

interface WarfrontDailyBoardModalProps {
  visible: boolean;
  onClose: () => void;
  dailyRotation: DailyRotationRecord | null;
  onDeployEncounter: (encounter: EncounterTemplate) => void;
}

const CATEGORIES: { id: EncounterCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Operations', icon: 'grid-outline' },
  { id: 'recon', label: 'Recon', icon: 'speedometer-outline' },
  { id: 'assault', label: 'Assault', icon: 'flame-outline' },
  { id: 'defense', label: 'Defense', icon: 'shield-outline' },
  { id: 'sabotage', label: 'Sabotage', icon: 'flash-off-outline' },
  { id: 'hunting', label: 'Hunting', icon: 'skull-outline' },
  { id: 'special_ops', label: 'Special Ops', icon: 'eye-off-outline' },
  { id: 'escalating', label: 'Escalating', icon: 'trending-up-outline' },
  { id: 'coop', label: 'Co-op Raid', icon: 'people-outline' },
];

export const WarfrontDailyBoardModal: React.FC<WarfrontDailyBoardModalProps> = ({
  visible,
  onClose,
  dailyRotation,
  onDeployEncounter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EncounterCategory | 'all'>('all');

  const offeredEncounters: EncounterTemplate[] = (
    dailyRotation?.offeredEncounterIds || []
  )
    .map((id) => getEncounterById(id))
    .filter((enc): enc is EncounterTemplate => !!enc);

  const displayedEncounters =
    selectedCategory === 'all'
      ? offeredEncounters
      : offeredEncounters.filter((enc) => enc.category === selectedCategory);

  const totalCatalogCount = allEncounterTemplates.length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="compass" size={26} color="#E53935" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>WARFRONT ENGAGEMENTS</Text>
                <Text style={styles.headerSubtitle}>
                  Daily Battle Board • Cycle: {dailyRotation?.rotationDate || 'Today'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#CFD8DC" />
            </TouchableOpacity>
          </View>

          {/* Operational Status Pill */}
          <View style={styles.statusBanner}>
            <View style={styles.statusPill}>
              <Ionicons name="shield-checkmark" size={14} color="#00E676" />
              <Text style={styles.statusPillText}>LOCKED DATE ROTATION</Text>
            </View>
            <Text style={styles.catalogInfoText}>
              Catalog: {totalCatalogCount} Tactical Templates
            </Text>
          </View>

          {/* Category Filter Scroll */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={isSelected ? '#121212' : '#90A4AE'}
                      style={styles.filterIcon}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Encounters List */}
          <ScrollView style={styles.encountersScroll} contentContainerStyle={styles.encountersContent}>
            {displayedEncounters.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="scan-outline" size={44} color="#546E7A" />
                <Text style={styles.emptyText}>No operations in this category today.</Text>
                <Text style={styles.emptySubtext}>
                  Switch category filter above to view today's active deployments.
                </Text>
              </View>
            ) : (
              displayedEncounters.map((encounter) => {
                const isCompleted =
                  dailyRotation?.completedEncounterIds?.includes(encounter.id) || false;

                return (
                  <View
                    key={encounter.id}
                    style={[
                      styles.encounterCard,
                      { borderLeftColor: encounter.primaryColor },
                      isCompleted && styles.encounterCardCompleted,
                    ]}
                  >
                    {/* Top Row: Category & Badges */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.categoryBadge}>
                        <Ionicons
                          name={getSafeIoniconsName(encounter.iconName, 'shield-outline')}
                          size={14}
                          color={encounter.accentColor}
                        />
                        <Text style={[styles.categoryBadgeText, { color: encounter.accentColor }]}>
                          {encounter.category.toUpperCase().replace('_', ' ')}
                        </Text>
                      </View>

                      <View style={styles.difficultyBadge}>
                        <Text style={styles.difficultyBadgeText}>
                          {encounter.difficulty.toUpperCase()}
                        </Text>
                      </View>

                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#00E676" />
                          <Text style={styles.completedBadgeText}>COMPLETED</Text>
                        </View>
                      )}
                    </View>

                    {/* Operation Title */}
                    <Text style={styles.encounterTitle}>{encounter.title}</Text>

                    {/* Enemy Target Header */}
                    <View style={styles.targetDossier}>
                      <Text style={styles.targetName}>{encounter.enemyName}</Text>
                      <Text style={styles.targetTitle}>
                        {encounter.enemyTitle} • {encounter.enemyFactionName}
                      </Text>
                      <Text style={styles.targetBriefing}>{encounter.briefing}</Text>
                    </View>

                    {/* Tactical Objective Box */}
                    <View style={styles.tacticalBox}>
                      <View style={styles.tacticalRow}>
                        <Ionicons name="locate" size={14} color="#FFB74D" />
                        <Text style={styles.tacticalLabel}>TACTICAL PROTOCOL:</Text>
                      </View>
                      <Text style={styles.tacticalText}>{encounter.tacticalObjective}</Text>
                    </View>

                    {/* Modifiers List */}
                    {encounter.modifiers.length > 0 && (
                      <View style={styles.modifiersSection}>
                        {encounter.modifiers.map((mod) => (
                          <View key={mod.id} style={styles.modifierPill}>
                            <Ionicons
                              name={getSafeIoniconsName(mod.iconName, 'flash')}
                              size={12}
                              color={mod.color}
                              style={styles.modIcon}
                            />
                            <Text style={[styles.modifierName, { color: mod.color }]}>
                              {mod.name}:
                            </Text>
                            <Text style={styles.modifierDesc} numberOfLines={1}>
                              {mod.description}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Stats & Deploy Footer */}
                    <View style={styles.cardFooter}>
                      <View style={styles.statsColumn}>
                        <View style={styles.statRow}>
                          <Ionicons name="fitness-outline" size={14} color="#90A4AE" />
                          <Text style={styles.statText}>
                            Rec: {encounter.recommendedSets} sets • {encounter.recommendedIntensity}
                          </Text>
                        </View>
                        <View style={styles.statRow}>
                          <Ionicons name="heart-outline" size={14} color="#E53935" />
                          <Text style={styles.statText}>Target HP: {encounter.baseHealth}</Text>
                          <Ionicons
                            name="trophy-outline"
                            size={14}
                            color="#FFD700"
                            style={{ marginLeft: 12 }}
                          />
                          <Text style={[styles.statText, { color: '#FFD700' }]}>
                            +{encounter.baseXpBonus} Glory XP
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.deployButton,
                          { backgroundColor: encounter.primaryColor },
                          isCompleted && styles.deployButtonCompleted,
                        ]}
                        onPress={() => {
                          onDeployEncounter(encounter);
                          onClose();
                        }}
                      >
                        <Ionicons
                          name={isCompleted ? 'repeat-outline' : 'play-outline'}
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={styles.deployButtonText}>
                          {isCompleted ? 'REPEAT' : 'DEPLOY'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1A1D24',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    minHeight: '85%',
    borderWidth: 1,
    borderColor: '#37474F',
    paddingBottom: 24,
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
  headerTextContainer: {
    flexDirection: 'column',
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
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#12151B',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  catalogInfoText: {
    color: '#78909C',
    fontSize: 11,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#263238',
    backgroundColor: '#1E232D',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#263238',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#37474F',
  },
  filterChipActive: {
    backgroundColor: '#FFB74D',
    borderColor: '#FFA726',
  },
  filterIcon: {
    marginRight: 6,
  },
  filterChipText: {
    color: '#CFD8DC',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#121212',
    fontWeight: '800',
  },
  encountersScroll: {
    flex: 1,
  },
  encountersContent: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#ECEFF1',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#78909C',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  encounterCard: {
    backgroundColor: '#212631',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#37474F',
    borderLeftWidth: 5,
    padding: 16,
  },
  encounterCardCompleted: {
    opacity: 0.85,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#12151B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  difficultyBadge: {
    backgroundColor: '#263238',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyBadgeText: {
    color: '#B0BEC5',
    fontSize: 10,
    fontWeight: '700',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  completedBadgeText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '800',
  },
  encounterTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  targetDossier: {
    backgroundColor: '#181C24',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  targetName: {
    color: '#FFCC80',
    fontSize: 14,
    fontWeight: '700',
  },
  targetTitle: {
    color: '#90A4AE',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  targetBriefing: {
    color: '#CFD8DC',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  tacticalBox: {
    backgroundColor: 'rgba(255, 183, 77, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFB74D',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  tacticalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  tacticalLabel: {
    color: '#FFB74D',
    fontSize: 10,
    fontWeight: '800',
  },
  tacticalText: {
    color: '#FFE082',
    fontSize: 11,
    lineHeight: 16,
  },
  modifiersSection: {
    marginBottom: 12,
    gap: 6,
  },
  modifierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1E26',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modIcon: {
    marginRight: 6,
  },
  modifierName: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 6,
  },
  modifierDesc: {
    color: '#90A4AE',
    fontSize: 11,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2C3440',
  },
  statsColumn: {
    flex: 1,
    gap: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#B0BEC5',
    fontSize: 11,
  },
  deployButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deployButtonCompleted: {
    backgroundColor: '#455A64',
  },
  deployButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
