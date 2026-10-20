import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Badge } from './Badge';
import {
  EquipmentDefinition,
  EquipmentSlot,
  EquippedLoadout,
  InventoryItemRecord,
  AggregatedEquipmentBonus,
} from '../types/equipment';
import {
  EQUIPMENT_CATALOG,
  getEquipmentById,
} from '../content/equipment/catalog';
import {
  RARITY_COLORS,
  SLOT_LABELS,
  SLOT_DEFAULT_ICONS,
} from './EquipmentSlotCard';
import { getFactionSlotConfig } from '../content/equipment/factionArchetypes';
import { isItemEquipEligible } from '../services/database/equipmentRepository';
import { triggerHaptic } from '../utils/haptics';
import { getSafeIoniconsName } from '../utils/iconHelper';

interface EquipmentInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  factionId: string;
  characterLevel: number;
  characterRankTier: number;
  inventory: InventoryItemRecord[];
  loadout: EquippedLoadout;
  equippedItems: EquipmentDefinition[];
  equipmentBonuses: AggregatedEquipmentBonus;
  initialSelectedSlot?: EquipmentSlot;
  onEquipItem: (slot: EquipmentSlot, itemId: string) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
}

export const EquipmentInventoryModal: React.FC<EquipmentInventoryModalProps> = ({
  visible,
  onClose,
  factionId,
  characterLevel,
  characterRankTier,
  inventory,
  loadout,
  equippedItems,
  equipmentBonuses,
  initialSelectedSlot,
  onEquipItem,
  onUnequipItem,
}) => {
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<EquipmentSlot | 'all'>(
    initialSelectedSlot || 'all'
  );
  const [activeTab, setActiveTab] = useState<'owned' | 'armory'>('owned');
  const [inspectingItem, setInspectingItem] = useState<EquipmentDefinition | null>(null);

  const slotConfig = getFactionSlotConfig(factionId);
  const activeSlots = slotConfig.allowedSlots;

  const ownedItemIdsSet = useMemo(() => {
    return new Set(inventory.map((inv) => inv.itemId));
  }, [inventory]);

  const equippedItemIdsSet = useMemo(() => {
    return new Set(Object.values(loadout).filter(Boolean) as string[]);
  }, [loadout]);

  // Filtered list of items
  const displayedItems = useMemo(() => {
    return EQUIPMENT_CATALOG.filter((item) => {
      // 1. Slot filter
      if (selectedSlotFilter !== 'all' && item.slot !== selectedSlotFilter) {
        return false;
      }

      // 2. Faction compatibility
      const factionMatch =
        item.compatibleFactions.includes('all') ||
        item.compatibleFactions.includes(factionId);
      if (!factionMatch) {
        return false;
      }

      // 3. Tab filter: Owned vs Armory Catalog
      if (activeTab === 'owned') {
        return ownedItemIdsSet.has(item.id);
      }

      return true;
    }).sort((a, b) => {
      // Sort: equipped first, then tier desc
      const isEqA = equippedItemIdsSet.has(a.id) ? 1 : 0;
      const isEqB = equippedItemIdsSet.has(b.id) ? 1 : 0;
      if (isEqB !== isEqA) return isEqB - isEqA;
      return b.tier - a.tier;
    });
  }, [selectedSlotFilter, factionId, activeTab, ownedItemIdsSet, equippedItemIdsSet]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic.selection();
              onClose();
            }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color={THEME.colors.textBright} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerSubtitle}>TACTICAL ARSENAL & WARGEAR</Text>
            <Text style={styles.headerTitle}>CRUSADE EQUIPMENT</Text>
          </View>
          <Badge label={`L${characterLevel} • T${characterRankTier}`} variant="primary" />
        </View>

        {/* Primary View Switcher: OWNED vs ARMORY */}
        <View style={styles.primaryTabRow}>
          <TouchableOpacity
            style={[styles.primaryTab, activeTab === 'owned' && styles.primaryTabActive]}
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('owned');
            }}
          >
            <Ionicons
              name="cube-outline"
              size={16}
              color={activeTab === 'owned' ? THEME.colors.primary : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.primaryTabText,
                activeTab === 'owned' && styles.primaryTabTextActive,
              ]}
            >
              OWNED INVENTORY ({inventory.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryTab, activeTab === 'armory' && styles.primaryTabActive]}
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('armory');
            }}
          >
            <Ionicons
              name="library-outline"
              size={16}
              color={activeTab === 'armory' ? THEME.colors.primary : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.primaryTabText,
                activeTab === 'armory' && styles.primaryTabTextActive,
              ]}
            >
              FACTION ARMORY
            </Text>
          </TouchableOpacity>
        </View>

        {/* Equipment Slot Filter Pills */}
        <View style={styles.filterPillsScrollWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsContent}>
            <TouchableOpacity
              style={[styles.filterPill, selectedSlotFilter === 'all' && styles.filterPillActive]}
              onPress={() => {
                triggerHaptic.selection();
                setSelectedSlotFilter('all');
              }}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedSlotFilter === 'all' && styles.filterPillTextActive,
                ]}
              >
                ALL SLOTS
              </Text>
            </TouchableOpacity>

            {activeSlots.map((slot) => {
              const label =
                slot === 'platform' && slotConfig.platformSlotLabel
                  ? slotConfig.platformSlotLabel
                  : SLOT_LABELS[slot];
              const isSelected = selectedSlotFilter === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.filterPill, isSelected && styles.filterPillActive]}
                  onPress={() => {
                    triggerHaptic.selection();
                    setSelectedSlotFilter(slot);
                  }}
                >
                  <Text
                    style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Item List */}
        <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
          {displayedItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-outline" size={48} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>NO WARGEAR FOUND</Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'owned'
                  ? 'No equipment owned in this category yet. Win weekly raids and complete campaign missions to claim rare loot!'
                  : 'No faction armory blueprints cataloged for this category.'}
              </Text>
            </View>
          ) : (
            displayedItems.map((item) => {
              const isEquipped = loadout[item.slot] === item.id;
              const isOwned = ownedItemIdsSet.has(item.id);
              const eligibility = isItemEquipEligible(
                item,
                factionId,
                characterLevel,
                characterRankTier
              );
              const rarityColor = RARITY_COLORS[item.rarity] || '#FFFFFF';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.itemCard,
                    isEquipped ? styles.itemCardEquipped : null,
                    { borderLeftColor: rarityColor },
                  ]}
                >
                  {/* Top Row */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.itemTitleWrap}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.cardItemName, { color: rarityColor }]}>
                          {item.name}
                        </Text>
                        {isEquipped && (
                          <Badge
                            label="EQUIPPED"
                            variant="primary"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                        {!isOwned && (
                          <Badge
                            label="ARMORY"
                            variant="secondary"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </View>
                      <Text style={styles.slotSubtitle}>
                        {SLOT_LABELS[item.slot]} • TIER {item.tier} • {item.rarity.toUpperCase()}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.itemIconBox,
                        { borderColor: rarityColor, backgroundColor: `${rarityColor}15` },
                      ]}
                    >
                      <Ionicons
                        name={getSafeIoniconsName(item.iconName || SLOT_DEFAULT_ICONS[item.slot])}
                        size={22}
                        color={rarityColor}
                      />
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.cardDesc}>{item.description}</Text>

                  {/* Lore Note */}
                  {item.loreNote && (
                    <Text style={styles.loreNote}>Lore: {item.loreNote}</Text>
                  )}

                  {/* Combat Stat Badges */}
                  <View style={styles.statBadgesRow}>
                    {Boolean(item.stats.bonusDamage) && (
                      <View style={styles.statChip}>
                        <Ionicons name="flash-outline" size={12} color={THEME.colors.primary} />
                        <Text style={styles.statChipText}>+{item.stats.bonusDamage} Flat DMG</Text>
                      </View>
                    )}
                    {Boolean(item.stats.damageMultiplier) && (
                      <View style={styles.statChip}>
                        <Ionicons name="flame-outline" size={12} color="#FF9800" />
                        <Text style={styles.statChipText}>
                          +{Math.round((item.stats.damageMultiplier || 0) * 100)}% Kinetic Mult
                        </Text>
                      </View>
                    )}
                    {Boolean(item.stats.critChanceBonus) && (
                      <View style={styles.statChip}>
                        <Ionicons name="locate-outline" size={12} color="#00F0FF" />
                        <Text style={styles.statChipText}>
                          +{Math.round((item.stats.critChanceBonus || 0) * 100)}% Crit Chance
                        </Text>
                      </View>
                    )}
                    {Boolean(item.stats.defenseRating) && (
                      <View style={styles.statChip}>
                        <Ionicons name="shield-outline" size={12} color="#2ECC71" />
                        <Text style={styles.statChipText}>+{item.stats.defenseRating} Defense</Text>
                      </View>
                    )}
                  </View>

                  {/* Lock Warning if not eligible */}
                  {!eligibility.eligible && (
                    <View style={styles.lockWarningRow}>
                      <Ionicons name="lock-closed-outline" size={14} color="#FF5252" />
                      <Text style={styles.lockWarningText}>{eligibility.reason}</Text>
                    </View>
                  )}

                  {/* Drop Sources */}
                  {item.dropSources && item.dropSources.length > 0 && (
                    <View style={styles.sourcesRow}>
                      <Ionicons name="skull-outline" size={12} color={THEME.colors.textMuted} />
                      <Text style={styles.sourcesText}>
                        Drop sources: {item.dropSources.join(' • ')}
                      </Text>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.cardActionsRow}>
                    {isEquipped ? (
                      <TouchableOpacity
                        style={styles.unequipBtn}
                        onPress={() => {
                          triggerHaptic.medium();
                          onUnequipItem(item.slot);
                        }}
                      >
                        <Ionicons name="remove-circle-outline" size={16} color="#FF5252" />
                        <Text style={styles.unequipBtnText}>UNEQUIP WARGEAR</Text>
                      </TouchableOpacity>
                    ) : isOwned && eligibility.eligible ? (
                      <TouchableOpacity
                        style={styles.equipBtn}
                        onPress={() => {
                          triggerHaptic.heavy();
                          onEquipItem(item.slot, item.id);
                        }}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#121212" />
                        <Text style={styles.equipBtnText}>EQUIP ITEM</Text>
                      </TouchableOpacity>
                    ) : !isOwned ? (
                      <View style={styles.unownedBadgeWrap}>
                        <Text style={styles.unownedText}>
                          NOT OWNED — DEFEAT RAIDS & CAMPAIGN BOSSES TO EARN
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.lockedBtnWrap}>
                        <Ionicons name="lock-closed" size={14} color={THEME.colors.textMuted} />
                        <Text style={styles.lockedBtnText}>LOCKED (REQUIRES HIGHER PROGRESSION)</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0E17',
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
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.textBright,
    letterSpacing: 0.8,
  },
  primaryTabRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  primaryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    gap: 6,
  },
  primaryTabActive: {
    backgroundColor: `${THEME.colors.primary}20`,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  primaryTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.6,
  },
  primaryTabTextActive: {
    color: THEME.colors.primary,
    fontWeight: '900',
  },
  filterPillsScrollWrap: {
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  filterPillsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  filterPillActive: {
    backgroundColor: `${THEME.colors.primary}25`,
    borderColor: THEME.colors.primary,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  filterPillTextActive: {
    color: THEME.colors.primary,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textBright,
    marginTop: 12,
    letterSpacing: 1,
  },
  emptyDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  itemCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderLeftWidth: 4,
  },
  itemCardEquipped: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  cardItemName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  slotSubtitle: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.6,
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDesc: {
    fontSize: 12,
    color: THEME.colors.textMain,
    lineHeight: 18,
    marginTop: 8,
  },
  loreNote: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  statBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    gap: 4,
  },
  statChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  lockWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  lockWarningText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF5252',
    flex: 1,
  },
  sourcesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  sourcesText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  cardActionsRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    paddingTop: 10,
  },
  equipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  equipBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0A0E17',
    letterSpacing: 0.8,
  },
  unequipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderWidth: 1,
    borderColor: '#FF5252',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  unequipBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FF5252',
    letterSpacing: 0.8,
  },
  unownedBadgeWrap: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unownedText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  lockedBtnWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  lockedBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
});
