import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Badge } from './Badge';
import { MissionCard } from './MissionCard';
import { MissionDetailModal } from './MissionDetailModal';
import {
  FactionMissionDefinition,
  MissionCategory,
  MissionStatus,
} from '../types/mission';
import {
  getPlayerMissionRoster,
  PlayerMissionViewItem,
} from '../services/database/missionEngine';
import {
  activateMission,
  claimMissionReward,
} from '../services/database/missionRepository';
import { Faction, Subfaction } from '../content/types';
import { useApp } from '../context/AppContext';

export interface MissionCenterModalProps {
  visible: boolean;
  onClose: () => void;
  characterId?: string;
  faction?: Faction;
  subfaction?: Subfaction;
  currentLevel?: number;
  rankTier?: number;
  onMissionsUpdated?: () => void;
}

const CATEGORIES: Array<{ key: MissionCategory | 'all'; label: string }> = [
  { key: 'all', label: 'ALL TYPES' },
  { key: 'training', label: 'TRAINING' },
  { key: 'patrol', label: 'PATROL' },
  { key: 'assault', label: 'ASSAULT' },
  { key: 'defense', label: 'DEFENSE' },
  { key: 'boss', label: 'BOSS PURGE' },
  { key: 'logistics', label: 'LOGISTICS' },
  { key: 'special', label: 'SPECIAL RITES' },
];

export const MissionCenterModal: React.FC<MissionCenterModalProps> = ({
  visible,
  onClose,
  characterId,
  faction,
  subfaction,
  currentLevel,
  rankTier,
  onMissionsUpdated,
}) => {
  const app = useApp();
  const effectiveCharId = characterId ?? app.character.id.toString();
  const effectiveFaction = faction ?? app.currentFaction;
  const effectiveSubfaction = subfaction ?? app.currentSubfaction;
  const effectiveLevel = currentLevel ?? app.progression.level;
  const effectiveRankTier = rankTier ?? app.progression.currentRankTier;
  const notifyUpdated = onMissionsUpdated ?? app.refreshData;

  const [selectedStatus, setSelectedStatus] = useState<MissionStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<MissionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roster, setRoster] = useState<PlayerMissionViewItem[]>([]);
  const [selectedDetailItem, setSelectedDetailItem] = useState<PlayerMissionViewItem | null>(null);

  const loadRoster = useCallback(() => {
    try {
      const items = getPlayerMissionRoster(
        effectiveCharId,
        effectiveFaction.id,
        effectiveSubfaction?.id
      );
      setRoster(items);
    } catch (err) {
      console.warn('Error loading mission roster:', err);
      setRoster([]);
    }
  }, [effectiveCharId, effectiveFaction.id, effectiveSubfaction?.id]);

  useEffect(() => {
    if (visible) {
      loadRoster();
    }
  }, [visible, loadRoster]);

  // Statistics
  const counts = useMemo(() => {
    const total = roster.length;
    const active = roster.filter((i) => i.status === 'active').length;
    const completed = roster.filter((i) => i.status === 'completed').length;
    const available = roster.filter((i) => i.status === 'available').length;
    const locked = roster.filter((i) => i.status === 'locked').length;
    return { total, active, completed, available, locked };
  }, [roster]);

  // Filtered roster
  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      // 1. Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && item.mission.category !== selectedCategory) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.mission.title.toLowerCase().includes(q);
        const matchDesc = item.mission.shortDescription.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [roster, selectedStatus, selectedCategory, searchQuery]);

  const handleAcceptMission = (mission: FactionMissionDefinition) => {
    try {
      activateMission(effectiveCharId, mission);
      loadRoster();
      setSelectedDetailItem(null);
      notifyUpdated();
      Alert.alert(
        'Deployment Authorized',
        `Operation "${mission.title}" is now active. Complete your workout sets to progress objectives!`,
        [{ text: 'Acknowledge' }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to activate mission.');
    }
  };

  const handleClaimReward = (missionId: string) => {
    try {
      const success = claimMissionReward(effectiveCharId, missionId);
      if (success) {
        loadRoster();
        setSelectedDetailItem(null);
        notifyUpdated();
        Alert.alert(
          'Honors Conferred',
          'Mission rewards have been deposited into your career record.',
          [{ text: 'Praise the Chapter' }]
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to claim reward.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Terminal Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color={THEME.colors.textBright} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerSubtitle}>TACTICAL WAR ROOM</Text>
            <Text style={styles.headerTitle}>MISSION COMMAND TERMINAL</Text>
          </View>
          <Badge
            label={`${counts.completed} / ${counts.total} DONE`}
            variant="success"
          />
        </View>

        {/* Faction Dossier Strip */}
        <View style={styles.factionStrip}>
          <View style={styles.factionMeta}>
            <Text style={styles.factionName}>{effectiveFaction.name.toUpperCase()}</Text>
            {effectiveSubfaction && (
              <Text style={styles.subfactionMotto}>"{effectiveSubfaction.motto || effectiveSubfaction.name}"</Text>
            )}
          </View>
          <View style={styles.rankBadgeBox}>
            <Badge label={`TIER ${effectiveRankTier}`} variant="primary" style={{ marginRight: 6 }} />
            <Badge label={`LVL ${effectiveLevel}`} variant="secondary" />
          </View>
        </View>

        {/* Metric Summary Counters */}
        <View style={styles.countersStrip}>
          <TouchableOpacity
            style={[styles.counterBox, selectedStatus === 'all' && styles.counterBoxActive]}
            onPress={() => setSelectedStatus('all')}
          >
            <Text style={styles.counterVal}>{counts.total}</Text>
            <Text style={styles.counterLabel}>TOTAL</Text>
          </TouchableOpacity>
          <View style={styles.counterDiv} />

          <TouchableOpacity
            style={[styles.counterBox, selectedStatus === 'active' && styles.counterBoxActive]}
            onPress={() => setSelectedStatus('active')}
          >
            <Text style={[styles.counterVal, { color: THEME.colors.secondary }]}>
              {counts.active}
            </Text>
            <Text style={styles.counterLabel}>ACTIVE</Text>
          </TouchableOpacity>
          <View style={styles.counterDiv} />

          <TouchableOpacity
            style={[styles.counterBox, selectedStatus === 'available' && styles.counterBoxActive]}
            onPress={() => setSelectedStatus('available')}
          >
            <Text style={[styles.counterVal, { color: THEME.colors.primary }]}>
              {counts.available}
            </Text>
            <Text style={styles.counterLabel}>AVAILABLE</Text>
          </TouchableOpacity>
          <View style={styles.counterDiv} />

          <TouchableOpacity
            style={[styles.counterBox, selectedStatus === 'completed' && styles.counterBoxActive]}
            onPress={() => setSelectedStatus('completed')}
          >
            <Text style={[styles.counterVal, { color: THEME.colors.success }]}>
              {counts.completed}
            </Text>
            <Text style={styles.counterLabel}>PURGED</Text>
          </TouchableOpacity>
          <View style={styles.counterDiv} />

          <TouchableOpacity
            style={[styles.counterBox, selectedStatus === 'locked' && styles.counterBoxActive]}
            onPress={() => setSelectedStatus('locked')}
          >
            <Text style={[styles.counterVal, { color: THEME.colors.textMuted }]}>
              {counts.locked}
            </Text>
            <Text style={styles.counterLabel}>LOCKED</Text>
          </TouchableOpacity>
        </View>

        {/* Category Horizontal Filter Pills */}
        <View style={styles.categoryWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(cat.key)}
                >
                  <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search faction operations..."
            placeholderTextColor={THEME.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Mission List */}
        <FlatList
          data={filteredRoster}
          keyExtractor={(item) => item.mission.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MissionCard
              mission={item.mission}
              status={item.status}
              record={item.record}
              lockReason={item.lockReason}
              onPress={() => setSelectedDetailItem(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-outline" size={48} color={THEME.colors.surfaceBorder} />
              <Text style={styles.emptyTitle}>NO MISSIONS DETECTED</Text>
              <Text style={styles.emptySubtitle}>
                No operations match your current filter settings. Reset filters or advance your rank to unlock higher-tier crusades.
              </Text>
            </View>
          }
        />

        {/* Mission Detail Briefing Modal */}
        {selectedDetailItem && (
          <MissionDetailModal
            visible={Boolean(selectedDetailItem)}
            onClose={() => setSelectedDetailItem(null)}
            mission={selectedDetailItem.mission}
            status={selectedDetailItem.status}
            record={selectedDetailItem.record}
            lockReason={selectedDetailItem.lockReason}
            onAcceptMission={handleAcceptMission}
            onClaimReward={handleClaimReward}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

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
    backgroundColor: THEME.colors.surface,
  },
  closeBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.textBright,
    letterSpacing: 0.5,
  },
  factionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  factionMeta: {
    flex: 1,
    marginRight: 8,
  },
  factionName: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.primary,
    letterSpacing: 0.5,
  },
  subfactionMotto: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 1,
  },
  rankBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countersStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  counterBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  counterBoxActive: {
    borderBottomColor: THEME.colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  counterVal: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textBright,
  },
  counterLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  counterDiv: {
    width: 1,
    height: 20,
    backgroundColor: THEME.colors.surfaceBorder,
  },
  categoryWrap: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surface,
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginRight: 6,
  },
  categoryPillActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: `${THEME.colors.primary}20`,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  categoryPillTextActive: {
    color: THEME.colors.primary,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.textBright,
    marginLeft: 6,
    paddingVertical: 0,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
