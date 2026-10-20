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
import { triggerHaptic } from '../utils/haptics';

export interface AchievementHubModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  characterId: string;
  squadId?: string;
  characterFactionId?: string;
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
  characterFactionId,
}) => {
  // Primary Navigation Tab: Available vs Completed
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');

  // Scope & Category Filtering
  const [selectedScope, setSelectedScope] = useState<AchievementScope | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [availableStatusFilter, setAvailableStatusFilter] = useState<'all' | 'in_progress' | 'unstarted'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting
  const [availableSortBy, setAvailableSortBy] = useState<'progress' | 'tier' | 'name'>('progress');
  const [completedSortBy, setCompletedSortBy] = useState<'recently_earned' | 'tier' | 'name'>('recently_earned');

  const [selectedDetailDef, setSelectedDetailDef] = useState<AchievementDefinition | null>(null);

  // Load live awards and progress from SQLite
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

  // Counts partitioned by Available vs Completed for current scope
  const tabCounts = useMemo(() => {
    let availCount = 0;
    let compCount = 0;
    let inProgCount = 0;
    let unstartedCount = 0;

    for (const def of ACHIEVEMENT_CATALOG) {
      if (selectedScope !== 'all' && def.scope !== selectedScope) continue;

      let targetId = userId;
      if (def.scope === 'character') targetId = characterId;
      if (def.scope === 'squad') targetId = squadId || 'squad_default';

      const key = `${def.id}_${targetId}`;
      const award = awardsMap.get(key);
      const prog = progressMap.get(key);
      const isCompleted = Boolean(award || prog?.isCompleted);

      if (isCompleted) {
        compCount++;
      } else {
        availCount++;
        if ((prog?.currentValue || 0) > 0) {
          inProgCount++;
        } else {
          unstartedCount++;
        }
      }
    }

    return {
      availCount,
      compCount,
      inProgCount,
      unstartedCount,
    };
  }, [awardsMap, progressMap, selectedScope, userId, characterId, squadId]);

  // Filtered and sorted definitions
  const displayedDefinitions = useMemo(() => {
    const list = ACHIEVEMENT_CATALOG.filter((def) => {
      // 1. Scope filter
      if (selectedScope !== 'all' && def.scope !== selectedScope) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && def.category !== selectedCategory) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchName = def.name.toLowerCase().includes(q);
        const matchDesc = def.description.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      // Resolve scope target ID
      let targetId = userId;
      if (def.scope === 'character') targetId = characterId;
      if (def.scope === 'squad') targetId = squadId || 'squad_default';

      const key = `${def.id}_${targetId}`;
      const award = awardsMap.get(key);
      const prog = progressMap.get(key);
      const isCompleted = Boolean(award || prog?.isCompleted);

      // 4. Primary tab separation:
      // AVAILABLE tab MUST only include unearned achievements
      // COMPLETED tab MUST only include earned achievements
      if (activeTab === 'available') {
        if (isCompleted) return false;

        // Sub-filter for available tab
        const currentVal = prog?.currentValue || 0;
        if (availableStatusFilter === 'in_progress' && currentVal === 0) return false;
        if (availableStatusFilter === 'unstarted' && currentVal > 0) return false;

        return true;
      } else {
        // activeTab === 'completed'
        if (!isCompleted) return false;
        return true;
      }
    });

    const tierWeights: Record<string, number> = { relic: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };

    return list.sort((a, b) => {
      let targetIdA = a.scope === 'character' ? characterId : a.scope === 'squad' ? (squadId || 'squad_default') : userId;
      let targetIdB = b.scope === 'character' ? characterId : b.scope === 'squad' ? (squadId || 'squad_default') : userId;

      if (activeTab === 'completed') {
        // Completed sorting (default: most recently earned first)
        if (completedSortBy === 'recently_earned') {
          const awardA = awardsMap.get(`${a.id}_${targetIdA}`);
          const awardB = awardsMap.get(`${b.id}_${targetIdB}`);
          const timeA = awardA?.unlockedAt ? new Date(awardA.unlockedAt).getTime() : 0;
          const timeB = awardB?.unlockedAt ? new Date(awardB.unlockedAt).getTime() : 0;
          if (timeB !== timeA) return timeB - timeA;
        }
        if (completedSortBy === 'tier') {
          const diff = (tierWeights[b.tier] || 0) - (tierWeights[a.tier] || 0);
          if (diff !== 0) return diff;
        }
        return a.name.localeCompare(b.name);
      } else {
        // Available sorting (default: highest progress percentage first)
        if (availableSortBy === 'progress') {
          const progA = progressMap.get(`${a.id}_${targetIdA}`)?.progressPercent || 0;
          const progB = progressMap.get(`${b.id}_${targetIdB}`)?.progressPercent || 0;
          if (progB !== progA) return progB - progA;
        }
        if (availableSortBy === 'tier') {
          const diff = (tierWeights[b.tier] || 0) - (tierWeights[a.tier] || 0);
          if (diff !== 0) return diff;
        }
        return a.name.localeCompare(b.name);
      }
    });
  }, [
    activeTab,
    selectedScope,
    selectedCategory,
    availableStatusFilter,
    searchQuery,
    availableSortBy,
    completedSortBy,
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

        {/* ========================================================= */}
        {/* PRIMARY VIEW MODE SWITCHER: AVAILABLE vs COMPLETED TABS   */}
        {/* ========================================================= */}
        <View style={styles.primaryTabsContainer}>
          <TouchableOpacity
            style={[
              styles.primaryTabBtn,
              activeTab === 'available' && styles.primaryTabBtnActive,
            ]}
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('available');
            }}
          >
            <Ionicons
              name="compass-outline"
              size={18}
              color={activeTab === 'available' ? THEME.colors.primary : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.primaryTabText,
                activeTab === 'available' && styles.primaryTabTextActive,
              ]}
            >
              AVAILABLE
            </Text>
            <View
              style={[
                styles.tabBadge,
                activeTab === 'available' && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === 'available' && styles.tabBadgeTextActive,
                ]}
              >
                {tabCounts.availCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryTabBtn,
              activeTab === 'completed' && styles.primaryTabBtnActiveCompleted,
            ]}
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('completed');
            }}
          >
            <Ionicons
              name="trophy"
              size={18}
              color={activeTab === 'completed' ? THEME.colors.success : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.primaryTabText,
                activeTab === 'completed' && styles.primaryTabTextActiveCompleted,
              ]}
            >
              COMPLETED
            </Text>
            <View
              style={[
                styles.tabBadge,
                activeTab === 'completed' && styles.tabBadgeActiveCompleted,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === 'completed' && styles.tabBadgeTextActiveCompleted,
                ]}
              >
                {tabCounts.compCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Summary Metric Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>AVAILABLE</Text>
            <Text style={[styles.statValue, { color: THEME.colors.primary }]}>
              {tabCounts.availCount}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>IN PROGRESS</Text>
            <Text style={[styles.statValue, { color: THEME.colors.warning }]}>
              {tabCounts.inProgCount}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>COMPLETED</Text>
            <Text style={[styles.statValue, { color: THEME.colors.success }]}>
              {tabCounts.compCount}
            </Text>
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
                onPress={() => {
                  triggerHaptic.selection();
                  setSelectedScope(sc);
                }}
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
                  onPress={() => {
                    triggerHaptic.selection();
                    setSelectedCategory(cat.key);
                  }}
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

        {/* Search & Sub-Filter / Sort Control Row */}
        <View style={styles.filterRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={THEME.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search citations..."
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

          {/* Sub-filter or Sorting Button depending on activeTab */}
          {activeTab === 'available' ? (
            <TouchableOpacity
              style={styles.statusToggleBtn}
              onPress={() => {
                triggerHaptic.selection();
                const nextStatus: Record<string, 'all' | 'in_progress' | 'unstarted'> = {
                  all: 'in_progress',
                  in_progress: 'unstarted',
                  unstarted: 'all',
                };
                setAvailableStatusFilter(nextStatus[availableStatusFilter]);
              }}
            >
              <Text style={styles.statusToggleText}>
                {availableStatusFilter === 'all'
                  ? 'STATUS: ALL'
                  : availableStatusFilter === 'in_progress'
                  ? 'IN PROGRESS'
                  : 'UNSTARTED'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.statusToggleBtn}
              onPress={() => {
                triggerHaptic.selection();
                const nextSort: Record<string, 'recently_earned' | 'tier' | 'name'> = {
                  recently_earned: 'tier',
                  tier: 'name',
                  name: 'recently_earned',
                };
                setCompletedSortBy(nextSort[completedSortBy]);
              }}
            >
              <Text style={styles.statusToggleText}>
                {completedSortBy === 'recently_earned'
                  ? 'SORT: RECENT'
                  : completedSortBy === 'tier'
                  ? 'SORT: TIER'
                  : 'SORT: NAME'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Secondary Sort button for Available tab */}
          {activeTab === 'available' && (
            <TouchableOpacity
              style={styles.sortToggleBtn}
              onPress={() => {
                triggerHaptic.selection();
                const nextSort: Record<string, 'progress' | 'tier' | 'name'> = {
                  progress: 'tier',
                  tier: 'name',
                  name: 'progress',
                };
                setAvailableSortBy(nextSort[availableSortBy]);
              }}
            >
              <Ionicons name="swap-vertical" size={14} color={THEME.colors.primary} />
              <Text style={styles.sortToggleText}>
                {availableSortBy === 'progress'
                  ? 'PROGRESS'
                  : availableSortBy === 'tier'
                  ? 'TIER'
                  : 'A-Z'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Achievement List */}
        <FlatList
          data={displayedDefinitions}
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
                mode={activeTab}
                characterFactionId={characterFactionId}
                onPress={() => setSelectedDetailDef(item)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'completed' ? 'trophy-outline' : 'shield-outline'}
                size={48}
                color={THEME.colors.surfaceBorder}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'completed'
                  ? tabCounts.compCount === 0
                    ? 'NO HONORS EARNED YET'
                    : 'NO COMPLETED HONORS IN THIS CATEGORY'
                  : tabCounts.availCount === 0
                  ? 'ALL COMMENDATIONS CONFERRED'
                  : 'NO AVAILABLE CITATIONS MATCH'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'completed'
                  ? tabCounts.compCount === 0
                    ? 'Complete physical workouts, break personal records, or slay sector invaders to earn Imperial citations.'
                    : 'No completed achievements match your active category, scope, or search filter.'
                  : tabCounts.availCount === 0
                  ? 'Outstanding devotion to the Emperor! You have completed all achievements in this category.'
                  : 'No incomplete achievements match your active search terms or criteria.'}
              </Text>
              {(selectedCategory !== 'all' ||
                selectedScope !== 'all' ||
                searchQuery.length > 0 ||
                availableStatusFilter !== 'all') && (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => {
                    triggerHaptic.selection();
                    setSelectedCategory('all');
                    setSelectedScope('all');
                    setSearchQuery('');
                    setAvailableStatusFilter('all');
                  }}
                >
                  <Ionicons name="refresh-outline" size={14} color={THEME.colors.primary} />
                  <Text style={styles.resetFilterBtnText}>RESET ALL FILTERS</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />

        {/* Detail Inspection Modal */}
        {selectedDetailDef && (
          <AchievementDetailModal
            visible={Boolean(selectedDetailDef)}
            onClose={() => setSelectedDetailDef(null)}
            definition={selectedDetailDef}
            mode={activeTab}
            characterFactionId={characterFactionId}
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
  primaryTabsContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  primaryTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surface,
    gap: 8,
  },
  primaryTabBtnActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  primaryTabBtnActiveCompleted: {
    borderColor: THEME.colors.success,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  primaryTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  primaryTabTextActive: {
    color: THEME.colors.primary,
  },
  primaryTabTextActiveCompleted: {
    color: THEME.colors.success,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  tabBadgeActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  tabBadgeActiveCompleted: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
  },
  tabBadgeTextActive: {
    color: '#000',
  },
  tabBadgeTextActiveCompleted: {
    color: '#000',
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
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textBright,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.surfaceBorder,
  },
  scopeTabs: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceRaised,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scopeTabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 4,
  },
  scopeTabBtnActive: {
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.primary,
  },
  scopeTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  scopeTabTextActive: {
    color: THEME.colors.textBright,
    fontWeight: '900',
  },
  categoryScrollWrap: {
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    paddingVertical: 6,
  },
  categoryScrollContent: {
    paddingHorizontal: 12,
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  categoryPillActive: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderColor: THEME.colors.primary,
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
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 36,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.textBright,
    paddingVertical: 0,
  },
  statusToggleBtn: {
    height: 36,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 6,
  },
  statusToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 0.5,
  },
  sortToggleBtn: {
    height: 36,
    flexDirection: 'row',
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 6,
    gap: 4,
  },
  sortToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textBright,
    letterSpacing: 1,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  resetFilterBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 0.5,
  },
});
