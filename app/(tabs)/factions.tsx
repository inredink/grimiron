import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { THEME } from '../../src/constants/theme';
import { SciFiCard } from '../../src/components/SciFiCard';
import { Badge } from '../../src/components/Badge';
import { TerminalButton } from '../../src/components/TerminalButton';
import { warhammer40kUniverse } from '../../src/content/warhammer40k';
import { Faction, Subfaction } from '../../src/content/types';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../src/utils/haptics';
import { getFactionSymbol } from '../../src/assets/factionSymbols';
import { CustomSubfactionManagerModal } from '../../src/components/CustomSubfactionManagerModal';
import { toSubfactionView } from '../../src/types/customSubfaction';

type AllegianceFilter = 'all' | 'imperium' | 'chaos' | 'xenos';

export default function FactionsScreen() {
  const insets = useSafeAreaInsets();
  const { character, changeFaction, customSubfactions } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<AllegianceFilter>('all');
  const [expandedFactionId, setExpandedFactionId] = useState<string | null>(character.factionId);
  const [selectedSubfactionByFaction, setSelectedSubfactionByFaction] = useState<Record<string, string>>({
    [character.factionId]: character.subfactionId || '',
  });
  const [isCustomManagerVisible, setIsCustomManagerVisible] = useState(false);
  const [customModalParentFactionId, setCustomModalParentFactionId] = useState<string | undefined>(undefined);

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
    triggerHaptic.selection();
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
          onPress: async () => {
            triggerHaptic.success();
            await changeFaction(faction.id, chosenSubfactionId);
            setSelectedSubfactionByFaction((prev) => ({
              ...prev,
              [faction.id]: chosenSubfactionId,
            }));
            setExpandedFactionId(faction.id);
            const sub = faction.subfactions.find((s) => s.id === chosenSubfactionId);
            Alert.alert(
              'Allegiance Sworn',
              `You are now pledged to ${faction.name}${sub ? ` (${sub.name})` : ''}!\n\nYour rank, badges, and training telemetry have been successfully updated.`,
              [{ text: 'For the Crusade!', style: 'default' }]
            );
          },
        },
      ]
    );
  };

  const toggleExpand = (id: string) => {
    triggerHaptic.light();
    setExpandedFactionId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(60, insets.bottom + 40) },
        ]}
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
                onPress={() => {
                  triggerHaptic.selection();
                  setSelectedFilter(filter);
                }}
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

        {/* Custom Subfactions Hub Banner */}
        <TouchableOpacity
          style={styles.customSubfactionBanner}
          onPress={() => {
            triggerHaptic.selection();
            setCustomModalParentFactionId(undefined);
            setIsCustomManagerVisible(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.customBannerIconCircle}>
            <Ionicons name="flag" size={18} color={THEME.colors.primary} />
          </View>
          <View style={styles.customBannerMiddle}>
            <View style={styles.customBannerHeaderRow}>
              <Text style={styles.customBannerTitle}>MY CUSTOM SUBFACTIONS</Text>
              {customSubfactions.length > 0 ? (
                <Badge
                  label={`${customSubfactions.length} ACTIVE`}
                  variant="secondary"
                  style={{ marginLeft: 6 }}
                />
              ) : (
                <Badge
                  label="CREATE"
                  variant="primary"
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>
            <Text style={styles.customBannerSubtitle} numberOfLines={1}>
              {customSubfactions.length > 0
                ? `${customSubfactions.length} player force${customSubfactions.length === 1 ? '' : 's'} established • Tap to manage or edit`
                : 'Found your own Chapter, Warband, Craftworld, or Sept'}
            </Text>
          </View>
          <View style={styles.customBannerChevronBox}>
            <Ionicons name="chevron-forward" size={18} color={THEME.colors.primary} />
          </View>
        </TouchableOpacity>

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

          const factionSymbol = getFactionSymbol(faction.id, undefined, 'white');

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
                <View style={styles.factionHeaderLeft}>
                  {factionSymbol && (
                    <View style={[styles.factionIconBox, { borderColor: faction.themeColor || THEME.colors.primary }]}>
                      <Image
                        source={factionSymbol}
                        style={styles.factionIconImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}
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
                  {(() => {
                    const customForFaction = customSubfactions
                      .filter((cs) => cs.parentFactionId === faction.id && !cs.isArchived)
                      .map(toSubfactionView);
                    const allSubfactions = [...faction.subfactions, ...customForFaction];

                    return (
                      <>
                        <View style={styles.subfactionHeaderRow}>
                          <Text style={styles.sectionHeader}>
                            SUBFACTIONS ({allSubfactions.length})
                          </Text>
                          {customForFaction.length > 0 && (
                            <Badge
                              label={`${customForFaction.length} CUSTOM`}
                              variant="secondary"
                              style={{ marginBottom: 8 }}
                            />
                          )}
                        </View>
                        <View style={styles.subfactionsGrid}>
                          {allSubfactions.map((subfaction) => {
                            const isSelected = activeSubfactionId === subfaction.id;
                            const isCustom = (subfaction as any).isCustom;
                            const customIconUri = (subfaction as any).customIconUri;
                            const subSymbol = getFactionSymbol(faction.id, subfaction.id, 'white');

                            return (
                              <TouchableOpacity
                                key={subfaction.id}
                                style={[
                                  styles.subfactionChip,
                                  isCustom && styles.subfactionChipCustom,
                                  isSelected && styles.subfactionChipSelected,
                                ]}
                                onPress={() => handleSelectSubfaction(faction.id, subfaction.id)}
                                activeOpacity={0.7}
                              >
                                {customIconUri ? (
                                  <Image
                                    source={{ uri: customIconUri }}
                                    style={[
                                      styles.subfactionChipIcon,
                                      { borderRadius: 2 },
                                    ]}
                                    resizeMode={(subfaction as any).iconCropMode || 'contain'}
                                  />
                                ) : subSymbol ? (
                                  <Image
                                    source={subSymbol}
                                    style={[
                                      styles.subfactionChipIcon,
                                      isSelected && { tintColor: '#0A0E17' },
                                    ]}
                                    resizeMode="contain"
                                  />
                                ) : (
                                  <View
                                    style={[
                                      styles.subfactionDot,
                                      { backgroundColor: subfaction.colorScheme.primary },
                                    ]}
                                  />
                                )}
                                <Text
                                  style={[
                                    styles.subfactionChipText,
                                    isSelected && styles.subfactionChipTextSelected,
                                  ]}
                                >
                                  {subfaction.name}
                                  {isCustom ? ' ★' : ''}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}

                          {/* Quick Add Custom Subfaction Button */}
                          <TouchableOpacity
                            style={styles.addSubfactionChip}
                            onPress={() => {
                              triggerHaptic.selection();
                              setCustomModalParentFactionId(faction.id);
                              setIsCustomManagerVisible(true);
                            }}
                            activeOpacity={0.75}
                          >
                            <Ionicons name="add" size={14} color={THEME.colors.primary} />
                            <Text style={styles.addSubfactionChipText}>FOUND NEW</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Selected Subfaction Motto / Lore */}
                        {activeSubfactionId && (
                          <View style={styles.selectedSubfactionCard}>
                            {(() => {
                              const sub = allSubfactions.find((s) => s.id === activeSubfactionId);
                              if (!sub) return null;
                              const isCustom = (sub as any).isCustom;
                              const customIconUri = (sub as any).customIconUri;
                              const subSymbol = getFactionSymbol(faction.id, sub.id, 'white');

                              return (
                                <View style={styles.selectedSubfactionRow}>
                                  {customIconUri ? (
                                    <View style={[styles.selectedSubfactionIconBox, { borderColor: sub.colorScheme.primary }]}>
                                      <Image
                                        source={{ uri: customIconUri }}
                                        style={styles.selectedSubfactionIcon}
                                        resizeMode={(sub as any).iconCropMode || 'contain'}
                                      />
                                    </View>
                                  ) : subSymbol ? (
                                    <View style={[styles.selectedSubfactionIconBox, { borderColor: sub.colorScheme.primary }]}>
                                      <Image
                                        source={subSymbol}
                                        style={styles.selectedSubfactionIcon}
                                        resizeMode="contain"
                                      />
                                    </View>
                                  ) : null}

                                  <View style={{ flex: 1, marginLeft: (customIconUri || subSymbol) ? 12 : 0 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                      <Text style={styles.selectedSubTitle}>{sub.name}</Text>
                                      {isCustom ? (
                                        <Badge label="CUSTOM" variant="secondary" style={{ marginLeft: 6 }} />
                                      ) : null}
                                    </View>
                                    {(sub as any).homeworld ? (
                                      <Text style={styles.selectedSubHomeworld}>
                                        Strategic Base: {(sub as any).homeworld}
                                      </Text>
                                    ) : null}
                                    <Text style={styles.selectedSubLore}>{sub.lore}</Text>
                                    {sub.motto ? (
                                      <Text style={styles.selectedSubMotto}>"{sub.motto}"</Text>
                                    ) : null}
                                  </View>
                                </View>
                              );
                            })()}
                          </View>
                        )}
                      </>
                    );
                  })()}

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
                  ) : activeSubfactionId !== character.subfactionId ? (
                    <TerminalButton
                      title="UPDATE SUBFACTION ALLEGIANCE"
                      onPress={async () => {
                        triggerHaptic.success();
                        await changeFaction(faction.id, activeSubfactionId);
                        const sub = faction.subfactions.find((s) => s.id === activeSubfactionId);
                        Alert.alert(
                          'Doctrine Updated',
                          `Your chapter doctrine is now set to ${sub ? sub.name : 'selected subfaction'}!`,
                          [{ text: 'Affirmative', style: 'default' }]
                        );
                      }}
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
                        YOU ARE CURRENTLY PLEDGED TO THIS FACTION & SUBFACTION
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </SciFiCard>
          );
        })}
      </ScrollView>

      {/* Custom Subfaction Manager Modal */}
      <CustomSubfactionManagerModal
        visible={isCustomManagerVisible}
        onClose={() => setIsCustomManagerVisible(false)}
        defaultParentFactionId={customModalParentFactionId}
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
  factionHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  factionIconBox: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: '#0A0E17',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    padding: 4,
  },
  factionIconImage: {
    width: '100%',
    height: '100%',
  },
  factionTitleBlock: {
    flex: 1,
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
  subfactionChipIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
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
  selectedSubfactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedSubfactionIconBox: {
    width: 48,
    height: 48,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: '#0A0E17',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  selectedSubfactionIcon: {
    width: '100%',
    height: '100%',
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
  customSubfactionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    marginBottom: 12,
  },
  customBannerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0A0E17',
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  customBannerMiddle: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  customBannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  customBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 1,
  },
  customBannerSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  customBannerChevronBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  subfactionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subfactionChipCustom: {
    borderStyle: 'dashed',
    borderColor: THEME.colors.primary,
  },
  addSubfactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0E17',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.colors.primary,
    marginRight: 6,
    marginBottom: 6,
  },
  addSubfactionChipText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  selectedSubHomeworld: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
});
