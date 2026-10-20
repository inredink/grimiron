import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { SciFiCard } from './SciFiCard';
import { Badge } from './Badge';
import {
  EquipmentDefinition,
  EquipmentSlot,
  EquippedLoadout,
  AggregatedEquipmentBonus,
} from '../types/equipment';
import { getFactionSlotConfig } from '../content/equipment/factionArchetypes';
import { triggerHaptic } from '../utils/haptics';
import { getSafeIoniconsName } from '../utils/iconHelper';

export const RARITY_COLORS: Record<string, string> = {
  common: '#9E9E9E',
  uncommon: '#2ECC71',
  rare: '#00F0FF',
  epic: '#A29BFE',
  relic: '#FF5252',
};

export const SLOT_LABELS: Record<EquipmentSlot, string> = {
  primary_weapon: 'PRIMARY WEAPON',
  secondary_weapon: 'SECONDARY WEAPON',
  armor: 'PROTECTIVE ARMOR',
  helmet: 'HELMET / AUSPEX',
  insignia: 'INSIGNIA / SEAL',
  tactical: 'TACTICAL GEAR',
  platform: 'EXOSUIT / PLATFORM',
};

export const SLOT_DEFAULT_ICONS: Record<EquipmentSlot, string> = {
  primary_weapon: 'radio-outline',
  secondary_weapon: 'flash-outline',
  armor: 'shield-outline',
  helmet: 'scan-outline',
  insignia: 'ribbon-outline',
  tactical: 'locate-outline',
  platform: 'hardware-chip-outline',
};

interface EquipmentSlotCardProps {
  factionId: string;
  loadout: EquippedLoadout;
  equippedItems: EquipmentDefinition[];
  equipmentBonuses: AggregatedEquipmentBonus;
  onOpenInventory: (slot?: EquipmentSlot) => void;
}

export const EquipmentSlotCard: React.FC<EquipmentSlotCardProps> = ({
  factionId,
  loadout,
  equippedItems,
  equipmentBonuses,
  onOpenInventory,
}) => {
  const slotConfig = getFactionSlotConfig(factionId);
  const activeSlots = slotConfig.allowedSlots;

  const equippedMap = new Map<EquipmentSlot, EquipmentDefinition>();
  for (const item of equippedItems) {
    equippedMap.set(item.slot, item);
  }

  return (
    <SciFiCard
      title="EQUIPPED ARSENAL & WARGEAR"
      variant="accent"
      rightAction={
        <TouchableOpacity
          onPress={() => {
            triggerHaptic.selection();
            onOpenInventory();
          }}
          style={styles.manageBtn}
        >
          <Text style={styles.manageBtnText}>MANAGE ARSENAL</Text>
        </TouchableOpacity>
      }
    >
      {/* Combat Power Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryStat}>
          <Text style={styles.statLabel}>ATTACK PWR</Text>
          <Text style={styles.statValue}>+{equipmentBonuses.totalBonusDamage} DMG</Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={styles.statLabel}>KINETIC MULT</Text>
          <Text style={styles.statValue}>
            +{Math.round(equipmentBonuses.totalDamageMultiplier * 100)}%
          </Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={styles.statLabel}>PRECISION CRIT</Text>
          <Text style={styles.statValue}>
            +{Math.round(equipmentBonuses.totalCritChanceBonus * 100)}%
          </Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={styles.statLabel}>DEFENSE SOAK</Text>
          <Text style={styles.statValue}>+{equipmentBonuses.totalDefenseRating} DEF</Text>
        </View>
      </View>

      {/* Equipment Slots Grid */}
      <View style={styles.slotsGrid}>
        {activeSlots.map((slot) => {
          const item = equippedMap.get(slot);
          const slotLabel =
            slot === 'platform' && slotConfig.platformSlotLabel
              ? slotConfig.platformSlotLabel
              : SLOT_LABELS[slot];
          const rarityColor = item ? RARITY_COLORS[item.rarity] || '#FFFFFF' : '#37474F';

          return (
            <TouchableOpacity
              key={slot}
              style={[
                styles.slotItem,
                item ? { borderColor: rarityColor } : styles.slotItemEmpty,
              ]}
              onPress={() => {
                triggerHaptic.selection();
                onOpenInventory(slot);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.slotHeaderRow}>
                <Text style={styles.slotLabel} numberOfLines={1}>
                  {slotLabel}
                </Text>
                {item && (
                  <Badge
                    label={`T${item.tier}`}
                    variant="primary"
                    style={{ paddingHorizontal: 4, paddingVertical: 1 }}
                  />
                )}
              </View>

              <View style={styles.slotContentRow}>
                <View
                  style={[
                    styles.iconBox,
                    { borderColor: rarityColor, backgroundColor: `${rarityColor}15` },
                  ]}
                >
                  <Ionicons
                    name={getSafeIoniconsName(item ? item.iconName : SLOT_DEFAULT_ICONS[slot])}
                    size={20}
                    color={rarityColor}
                  />
                </View>

                <View style={styles.slotDetails}>
                  {item ? (
                    <>
                      <Text style={[styles.itemName, { color: rarityColor }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemStatsSummary} numberOfLines={1}>
                        {item.stats.bonusDamage ? `+${item.stats.bonusDamage} DMG ` : ''}
                        {item.stats.damageMultiplier
                          ? `+${Math.round(item.stats.damageMultiplier * 100)}% Mult `
                          : ''}
                        {item.stats.defenseRating ? `+${item.stats.defenseRating} DEF ` : ''}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.emptySlotText}>[NO ITEM EQUIPPED]</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SciFiCard>
  );
};

const styles = StyleSheet.create({
  manageBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: `${THEME.colors.primary}20`,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  manageBtnText: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginBottom: 12,
  },
  summaryStat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.primary,
    letterSpacing: 0.5,
  },
  slotsGrid: {
    gap: 8,
  },
  slotItem: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
  },
  slotItemEmpty: {
    borderColor: THEME.colors.surfaceBorder,
    borderStyle: 'dashed',
  },
  slotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  slotLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  slotContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  slotDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  itemStatsSummary: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  emptySlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
});
