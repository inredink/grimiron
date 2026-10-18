import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { THEME } from '../../src/constants/theme';
import { SciFiCard } from '../../src/components/SciFiCard';
import { Badge } from '../../src/components/Badge';
import { TerminalButton } from '../../src/components/TerminalButton';
import { warhammer40kUniverse } from '../../src/content/warhammer40k';
import { Faction, Subfaction } from '../../src/content/types';
import { Ionicons } from '@expo/vector-icons';

type AllegianceFilter = 'all' | 'imperium' | 'chaos' | 'xenos';

export default function FactionsScreen() {
  const { character, changeFaction, refreshData } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<AllegianceFilter>('all');
  const [expandedFactionId, setExpandedFactionId] = useState<string | null>(character.factionId);
  const [selectedSubfactionByFaction, setSelectedSubfactionByFaction] = useState<Record<string, string>>({
    [character.factionId]: character.subfactionId || '',
  });

  const filteredFactions = useMemo(() => {
    return warhammer40kUniverse.factions.filter((faction) => {
      // Filter by allegiance category
      if (selectedFilter !== 'all' && faction.allegiance !== selectedFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = faction.name.toLowerCase().includes(query);
        const matchesDesc = faction.shortDescription.toLowerCase().includes(query);
        const matchesSubfaction = faction.subfactions.some((s) =>
          s.name.toLowerCase().includes(query)
        );
        return matchesName || matchesDesc || matchesSubfaction;
      }

      return true;
    });
  }, [searchQuery, selectedFilter]);

  const handleSelectSubfaction = (factionId: string, subfactionId: string) => {
    setSelectedSubfactionByFaction((prev) => ({
      ...prev,
      [factionId]: subfactionId,
    }));
  };

  const handlePledgeAllegiance = (faction: Faction) => {
    const chosenSubfactionId =
      selectedSubfactionByFaction[faction.id] || faction.subfactions[0]?.id;

    Alert.alert(
      'Swear Allegiance',
      `Pledge your service to the ${faction.name}? Your accumulated training XP will carry over, and your new rank will be calculated immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pledge Allegiance',
          onPress: () => {
            changeFaction(faction.id, chosenSubfactionId);
            refreshData();
          },
        },
      ]
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedFactionId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FACTION CODEX</Text>
          <Text style={styles.headerSubtitle}>
            WARHAMMER 40,000 STRATEGIC ARMIES & SUBFACTIONS
          </Text>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={THEME.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search factions, chapters, legions, or klans..."
            placeholderTextColor={THEME.colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'imperium', 'chaos', 'xenos'] as AllegianceFilter[]).map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {filter.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Catalog Count Banner */}
        <Text style={styles.resultCountText}>
          Displaying {filteredFactions.length} of {warhammer40kUniverse.factions.length} Major 40K Armies
        </Text>

        {/* Faction Cards */}
        {filteredFactions.map((faction) => {
          const isCurrentAllegiance = character.factionId === faction.id;
          const isExpanded = expandedFactionId === faction.id;
          const activeSubfactionId =
            selectedSubfactionByFaction[faction.id] ||
            (isCurrentAllegiance ? character.subfactionId : faction.subfactions[0]?.id);

          return (
            <SciFiCard
              key={faction.id}
              variant={isCurrentAllegiance ? 'accent' : 'normal'}
              style={styles.factionCard}
            >
              {/* Card Header */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => toggleExpand(faction.id)}
                style={styles.factionHeader}
              >
                <View style={styles.factionTitleBlock}>
                  <View style={styles.badgeRow}>
                    <Badge label={faction.allegiance} variant={faction.allegiance as any} />
                    {isCurrentAllegiance && (
                      <Badge
                        label="ACTIVE ALLEGIANCE"
                        variant="primary"
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </View>
                  <Text style={styles.factionName}>{faction.name}</Text>
                  <Text style={styles.factionDesc}>{faction.shortDescription}</Text>
                </View>

                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={THEME.colors.primary}
                />
              </TouchableOpacity>

              {/* Expanded Codex View */}
              {isExpanded && (
                <View style={styles.codexDetails}>
                  <View style={styles.divider} />

                  {/* Lore Section */}
                  <Text style={styles.sectionHeader}>FACTION LORE</Text>
                  <Text style={styles.loreText}>{faction.lore}</Text>

                  {faction.loreCriteriaNote && (
                    <View style={styles.criteriaBox}>
                      <Text style={styles.criteriaTitle}>CODEX INCLUSION CRITERIA</Text>
                      <Text style={styles.criteriaText}>{faction.loreCriteriaNote}</Text>
                    </View>
                  )}

                  {/* Subfactions Section */}
                  <Text style={styles.sectionHeader}>
                    SUBFACTIONS ({faction.subfactions.length})
                  </Text>
                  <View style={styles.subfactionsGrid}>
                    {faction.subfactions.map((subfaction) => {
                      const isSelected = activeSubfactionId === subfaction.id;
                      return (
                        <TouchableOpacity
                          key={subfaction.id}
                          style={[
                            styles.subfactionChip,
                            isSelected && styles.subfactionChipSelected,
                          ]}
                          onPress={() => handleSelectSubfaction(faction.id, subfaction.id)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.subfactionDot,
                              { backgroundColor: subfaction.colorScheme.primary },
                            ]}
                          />
                          <Text
                            style={[
                              styles.subfactionChipText,
                              isSelected && styles.subfactionChipTextSelected,
                            ]}
                          >
                            {subfaction.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Selected Subfaction Motto / Lore */}
                  {activeSubfactionId && (
                    <View style={styles.selectedSubfactionCard}>
                      {(() => {
                        const sub = faction.subfactions.find((s) => s.id === activeSubfactionId);
                        if (!sub) return null;
                        return (
                          <>
                            <Text style={styles.selectedSubTitle}>{sub.name}</Text>
                            <Text style={styles.selectedSubLore}>{sub.lore}</Text>
                            {sub.motto && (
                              <Text style={styles.selectedSubMotto}>"{sub.motto}"</Text>
                            )}
                          </>
                        );
                      })()}
                    </View>
                  )}

                  {/* Rank Ladder Table */}
                  <Text style={styles.sectionHeader}>FACTION RANK LADDER</Text>
                  <View style={styles.rankTable}>
                    {faction.ranks.map((rank) => (
                      <View key={rank.tier} style={styles.rankTableRow}>
                        <View style={styles.rankTierCol}>
                          <Text style={styles.rankTierText}>T{rank.tier}</Text>
                        </View>
                        <View style={styles.rankInfoCol}>
                          <View style={styles.rankTitleRow}>
                            <Text style={styles.rankTitleText}>{rank.title}</Text>
                            <Text style={styles.rankXpText}>{rank.minXp} XP</Text>
                          </View>
                          <Text style={styles.rankDescText}>{rank.description}</Text>
                          {!rank.isCanonicalLore && rank.loreNote && (
                            <Text style={styles.rankNoteText}>* {rank.loreNote}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Pledge Button */}
                  {!isCurrentAllegiance ? (
                    <TerminalButton
                      title="PLEDGE ALLEGIANCE TO THIS FACTION"
                      onPress={() => handlePledgeAllegiance(faction)}
                      variant="primary"
                      size="md"
                      icon={<Ionicons name="shield-checkmark" size={16} color="#0A0E17" />}
                      style={{ marginTop: 16 }}
                    />
                  ) : (
                    <View style={styles.alreadyPledgedNotice}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={THEME.colors.primary}
                      />
                      <Text style={styles.alreadyPledgedText}>
                        YOU ARE CURRENTLY PLEDGED TO THIS FACTION
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </SciFiCard>
          );
        })}
      </ScrollView>
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
  header: {
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: THEME.colors.primary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 12,
    marginVertical: THEME.spacing.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.textBright,
    paddingVertical: 10,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.sm,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surfaceRaised,
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  filterTextActive: {
    color: '#0A0E17',
  },
  resultCountText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: 4,
  },
  factionCard: {
    marginVertical: 4,
  },
  factionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factionTitleBlock: {
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  factionName: {
    color: THEME.colors.textBright,
    fontSize: 15,
    fontWeight: '800',
  },
  factionDesc: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  codexDetails: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.surfaceBorder,
    marginBottom: 12,
  },
  sectionHeader: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 6,
  },
  loreText: {
    color: THEME.colors.textMain,
    fontSize: 13,
    lineHeight: 18,
  },
  criteriaBox: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    padding: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.secondary,
  },
  criteriaTitle: {
    color: THEME.colors.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  criteriaText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  subfactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  subfactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginRight: 6,
    marginBottom: 6,
  },
  subfactionChipSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#262012',
  },
  subfactionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  subfactionChipText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  subfactionChipTextSelected: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  selectedSubfactionCard: {
    backgroundColor: THEME.colors.surfaceRaised,
    padding: 10,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginBottom: 10,
  },
  selectedSubTitle: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '800',
  },
  selectedSubLore: {
    color: THEME.colors.textMain,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  selectedSubMotto: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  rankTable: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    overflow: 'hidden',
  },
  rankTableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  rankTierCol: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTierText: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  rankInfoCol: {
    flex: 1,
    marginLeft: 6,
  },
  rankTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankTitleText: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '700',
  },
  rankXpText: {
    color: THEME.colors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  rankDescText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rankNoteText: {
    color: THEME.colors.warning,
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  alreadyPledgedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#1E1A10',
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.primaryMuted,
  },
  alreadyPledgedText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
});
