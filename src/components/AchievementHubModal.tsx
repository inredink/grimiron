import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Badge } from './Badge';
import { AchievementCard } from './AchievementCard';
import { AchievementDetailModal } from './AchievementDetailModal';
import {
  AchievementAward,
  AchievementCategory,
  AchievementDefinition,
  AchievementProgress,
  AchievementScope,
} from '../types/achievements';
import { ACHIEVEMENT_CATALOG } from '../content/achievements/catalog';
import {
  getAllAwards,
  getAllAchievementProgress,
} from '../services/database/achievementRepository';

interface AchievementHubModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  characterId: string;
  squadId?: string;
}

const CATEGORIES: Array<{ key: AchievementCategory | 'all'; label: string }> = [
  { key: 'all', label: 'ALL CATEGORIES' },
  { key: 'workouts', label: 'WORKOUTS' },
  { key: 'volume', label: 'VOLUME' },
  { key: 'variety', label: 'VARIETY' },
  { key: 'personal_records', label: 'PR RECORDS' },
  { key: 'consistency', label: 'CONSISTENCY' },
  { key: 'combat', label: 'COMBAT' },
  { key: 'bosses', label: 'BOSSES' },
  { key: 'squad', label: 'SQUAD' },
  { key: 'progression', label: 'PROGRESSION' },
  { key: 'equipment', label: 'EQUIPMENT' },
  { key: 'campaigns', label: 'CAMPAIGNS' },
];

export const AchievementHubModal: React.FC<AchievementHubModalProps> = ({
  visible,
  onClose,
  userId,
  characterId,
  squadId,
}) => {
  // Filters & State
  const [selectedScope, setSelectedScope] = useState<AchievementScope | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'earned' | 'in_progress' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'tier' | 'progress' | 'name'>('progress');
  const [selectedDetailDef, setSelectedDetailDef] = useState<AchievementDefinition | null>(null);

  // Load live awards and progress
  const { awardsMap, progressMap, awardsList } = useMemo(() => {
    try {
      const allAwards = getAllAwards();
      const allProgress = getAllAchievementProgress();

      const aMap = new Map<string, AchievementAward>();
      for (const a of allAwards) {
        aMap.set(`${a.achievementId}_${a.targetId}`, a);
      }

      const pMap = new Map<string, AchievementProgress>();
      for (const p of allProgress) {
        pMap.set(`${p.achievementId}_${p.targetId}`, p);
      }

      return { awardsMap: aMap, progressMap: pMap, awardsList: allAwards };
    } catch {
      return {
        awardsMap: new Map<string, AchievementAward>(),
        progressMap: new Map<string, AchievementProgress>(),
        awardsList: [],
      };
    }
  }, [visible]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalAwardsCount = awardsList.length;
    const totalXp = awardsList.reduce((acc, a) => acc + (a.rewardXp || 0), 0);
    const userAwardsCount = awardsList.filter((a) => a.scope === 'user').length;
    const charAwardsCount = awardsList.filter((a) => a.scope === 'character').length;
    const squadAwardsCount = awardsList.filter((a) => a.scope === 'squad').length;

    return {
      totalAwardsCount,
      totalCatalogCount: ACHIEVEMENT_CATALOG.length,
      totalXp,
      userAwardsCount,
      charAwardsCount,
      squadAwardsCount,
    };
  }, [awardsList]);

  // Filtered definitions
  const filteredDefinitions = useMemo(() => {
    return ACHIEVEMENT_CATALOG.filter((def) => {
      // 1. Scope filter
      if (selectedScope !== 'all' && def.scope !== selectedScope) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && def.category !== selectedCategory) {
        return false;
      }

      // Target ID lookup
      let targetId = userId;
      if (def.scope === 'character') targetId = characterId;
      if (def.scope === 'squad') targetId = squadId || 'squad_default';

      const key = `${def.id}_${targetId}`;
      const award = awardsMap.get(key);
      const prog = progressMap.get(key);
      const isCompleted = Boolean(award || prog?.isCompleted);

      // 3. Status filter
      if (selectedStatus === 'earned' && !isCompleted) return false;
      if (selectedStatus === 'locked' && (isCompleted || (prog?.progressPercent || 0) > 0)) return false;
      if (selectedStatus === 'in_progress') {
        if (isCompleted) return false;
        if (!prog || prog.progressPercent === 0) return false;
      }

      // 4. Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchName = def.name.toLowerCase().includes(q);
        const matchDesc = def.description.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      return true;
    }).sort((a, b) => {
      let targetIdA = a.scope === 'character' ? characterId : a.scope === 'squad' ? (squadId || 'squad_default') : userId;
      let targetIdB = b.scope === 'character' ? characterId : b.scope === 'squad' ? (squadId || 'squad_default') : userId;

      const progA = progressMap.get(`${a.id}_${targetIdA}`)?.progressPercent || 0;
      const progB = progressMap.get(`${b.id}_${targetIdB}`)?.progressPercent || 0;

      if (sortBy === 'progress') {
        return progB - progA;
      }
      if (sortBy === 'tier') {
        const tierWeights: Record<string, number> = { relic: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
        return (tierWeights[b.tier] || 0) - (tierWeights[a.tier] || 0);
      }
      return a.name.localeCompare(b.name);
    });
  }, [
    selectedScope,
    selectedCategory,
    selectedStatus,
    searchQuery,
    sortBy,
    awardsMap,
    progressMap,
    userId,
    characterId,
    squadId,
  ]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color={THEME.colors.textBright} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerSubtitle}>TACTICAL CITATIONS & HONORS</Text>
            <Text style={styles.headerTitle}>CRUSADE ACHIEVEMENTS</Text>
          </View>
          <Badge
            label={`${stats.totalAwardsCount} / ${stats.totalCatalogCount}`}
            variant="primary"
          />
        </View>

        {/* Summary Metric Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>USER HONORS</Text>
            <Text style={styles.statValue}>{stats.userAwardsCount}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>CHARACTER</Text>
            <Text style={styles.statValue}>{stats.charAwardsCount}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SQUAD</Text>
            <Text style={styles.statValue}>{stats.squadAwardsCount}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL XP</Text>
            <Text style={[styles.statValue, { color: THEME.colors.primary }]}>
              +{stats.totalXp.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Scope Tabs: ALL | USER | CHARACTER | SQUAD */}
        <View style={styles.scopeTabs}>
          {(['all', 'user', 'character', 'squad'] as const).map((sc) => {
            const isActive = selectedScope === sc;
            return (
              <TouchableOpacity
                key={sc}
                style={[styles.scopeTabBtn, isActive && styles.scopeTabBtnActive]}
                onPress={() => setSelectedScope(sc)}
              >
                <Text
                  style={[
                    styles.scopeTabText,
                    isActive && styles.scopeTabTextActive,
                  ]}
                >
                  {sc === 'all' ? 'ALL SCOPES' : sc.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category Horizontal Filter */}
        <View style={styles.categoryScrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryPill,
                    isActive && styles.categoryPillActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.key)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isActive && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Search & Status Bar */}
        <View style={styles.filterRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={THEME.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search achievements..."
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

          {/* Status selector */}
          <TouchableOpacity
            style={styles.statusToggleBtn}
            onPress={() => {
              const nextStatus: Record<string, 'all' | 'earned' | 'in_progress' | 'locked'> = {
                all: 'earned',
                earned: 'in_progress',
                in_progress: 'locked',
                locked: 'all',
              };
              setSelectedStatus(nextStatus[selectedStatus]);
            }}
          >
            <Text style={styles.statusToggleText}>
              {selectedStatus === 'all'
                ? 'ALL'
                : selectedStatus === 'earned'
                ? 'EARNED'
                : selectedStatus === 'in_progress'
                ? 'PROGRESS'
                : 'LOCKED'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Achievement List */}
        <FlatList
          data={filteredDefinitions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            let targetId = userId;
            if (item.scope === 'character') targetId = characterId;
            if (item.scope === 'squad') targetId = squadId || 'squad_default';

            const key = `${item.id}_${targetId}`;
            const award = awardsMap.get(key);
            const progress = progressMap.get(key);

            return (
              <AchievementCard
                definition={item}
                award={award}
                progress={progress}
                onPress={() => setSelectedDetailDef(item)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="shield-outline"
                size={48}
                color={THEME.colors.surfaceBorder}
              />
              <Text style={styles.emptyTitle}>NO CITATIONS FOUND</Text>
              <Text style={styles.emptySubtitle}>
                No achievements match your active filter criteria. Clear filters or complete more crusade missions.
              </Text>
            </View>
          }
        />

        {/* Detail Inspection Modal */}
        {selectedDetailDef && (
          <AchievementDetailModal
            visible={Boolean(selectedDetailDef)}
            onClose={() => setSelectedDetailDef(null)}
            definition={selectedDetailDef}
            award={
              awardsMap.get(
                `${selectedDetailDef.id}_${
                  selectedDetailDef.scope === 'character'
                    ? characterId
                    : selectedDetailDef.scope === 'squad'
                    ? squadId || 'squad_default'
                    : userId
                }`
              )
            }
            progress={
              progressMap.get(
                `${selectedDetailDef.id}_${
                  selectedDetailDef.scope === 'character'
                    ? characterId
                    : selectedDetailDef.scope === 'squad'
                    ? squadId || 'squad_default'
                    : userId
                }`
              )
            }
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
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.textBright,
    letterSpacing: 0.5,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    paddingVertical: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textBright,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.surfaceBorder,
  },
  scopeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.background,
  },
  scopeTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  scopeTabBtnActive: {
    borderBottomColor: THEME.colors.primary,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  scopeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  scopeTabTextActive: {
    color: THEME.colors.primary,
    fontWeight: '900',
  },
  categoryScrollWrap: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surface,
  },
  categoryScrollContent: {
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
    letterSpacing: 0.5,
  },
  categoryPillTextActive: {
    color: THEME.colors.primary,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 36,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.textBright,
    marginLeft: 6,
    paddingVertical: 0,
  },
  statusToggleBtn: {
    paddingHorizontal: 10,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  statusToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
    lineHeight: 16,
  },
});
