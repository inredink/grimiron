import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { SciFiCard } from './SciFiCard';
import { Badge } from './Badge';
import { TerminalButton } from './TerminalButton';
import { CustomSubfactionRecord, DOCTRINE_TAG_LABELS } from '../types/customSubfaction';
import { getFactionById } from '../content/warhammer40k';
import { getFactionSymbol } from '../assets/factionSymbols';
import { CustomSubfactionModal } from './CustomSubfactionModal';
import { useApp } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

interface CustomSubfactionManagerModalProps {
  visible: boolean;
  onClose: () => void;
  defaultParentFactionId?: string;
}

export const CustomSubfactionManagerModal: React.FC<CustomSubfactionManagerModalProps> = ({
  visible,
  onClose,
  defaultParentFactionId,
}) => {
  const insets = useSafeAreaInsets();
  const {
    character,
    customSubfactions,
    createCustomSubfactionAction,
    updateCustomSubfactionAction,
    duplicateCustomSubfactionAction,
    archiveCustomSubfactionAction,
    deleteCustomSubfactionAction,
    selectCustomSubfactionAction,
  } = useApp();

  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editingSubfaction, setEditingSubfaction] = useState<CustomSubfactionRecord | null>(null);

  const activeSubfactionId = character.subfactionId;

  const handleOpenCreate = () => {
    triggerHaptic.selection();
    setEditingSubfaction(null);
    setIsEditorVisible(true);
  };

  const handleOpenEdit = (subfaction: CustomSubfactionRecord) => {
    triggerHaptic.selection();
    setEditingSubfaction(subfaction);
    setIsEditorVisible(true);
  };

  const handleSelectSubfaction = (subfaction: CustomSubfactionRecord) => {
    triggerHaptic.success();
    selectCustomSubfactionAction(subfaction.id);
    Alert.alert(
      'Allegiance Pledged',
      `Your army is now marching under the banner of ${subfaction.name} (${getFactionById(subfaction.parentFactionId)?.name || 'Parent Army'}).`
    );
  };

  const handleDuplicate = (subfaction: CustomSubfactionRecord) => {
    triggerHaptic.medium();
    try {
      const duplicated = duplicateCustomSubfactionAction(subfaction.id);
      Alert.alert('Subfaction Cloned', `Created "${duplicated.name}".`);
    } catch (err: any) {
      Alert.alert('Duplication Error', err?.message || 'Could not clone subfaction.');
    }
  };

  const handleDeletePrompt = (subfaction: CustomSubfactionRecord) => {
    const isCurrentlyActive = activeSubfactionId === subfaction.id;

    Alert.alert(
      'Remove Custom Subfaction',
      isCurrentlyActive
        ? `"${subfaction.name}" is currently sworn by your active character. Deleting it will restore your parent army's default subfaction. Are you sure?`
        : `Are you sure you want to delete "${subfaction.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: () => {
            triggerHaptic.warning();
            archiveCustomSubfactionAction(subfaction.id);
          },
        },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => {
            triggerHaptic.warning();
            deleteCustomSubfactionAction(subfaction.id);
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <Ionicons name="flag" size={24} color={THEME.colors.primary} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerTitle}>MY CUSTOM SUBFACTIONS</Text>
              <Text style={styles.headerSubtitle}>
                PLAYER-CREATED CHAPTERS, WARBANDS, & FORCES
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Action Header Banner */}
        <View style={styles.actionBanner}>
          <Text style={styles.actionBannerText}>
            You have {customSubfactions.length} custom subfaction{customSubfactions.length === 1 ? '' : 's'}.
          </Text>
          <TouchableOpacity
            style={styles.foundNewBtn}
            onPress={handleOpenCreate}
            activeOpacity={0.75}
          >
            <Ionicons name="add" size={18} color="#0A0E17" />
            <Text style={styles.foundNewBtnText}>FOUND SUBFACTION</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: Math.max(40, insets.bottom + 20) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {customSubfactions.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="shield-outline" size={48} color={THEME.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>NO CUSTOM SUBFACTIONS YET</Text>
              <Text style={styles.emptySubtitle}>
                Forge your own original military identity! Choose any of the 20 major Warhammer 40K armies as your parent faction, name your subfaction, set a battle cry, and optionally upload your custom emblem.
              </Text>
              <TerminalButton
                title="FOUND YOUR FIRST SUBFACTION"
                variant="primary"
                icon="add-circle-outline"
                onPress={handleOpenCreate}
                style={{ marginTop: 20, width: '100%' }}
              />
            </View>
          ) : (
            /* List of Custom Subfactions */
            customSubfactions.map((subfaction) => {
              const isActive = activeSubfactionId === subfaction.id;
              const parentFaction = getFactionById(subfaction.parentFactionId);
              const fallbackSymbol = getFactionSymbol(subfaction.parentFactionId, undefined, 'white');

              return (
                <SciFiCard
                  key={subfaction.id}
                  variant={isActive ? 'accent' : 'normal'}
                  style={styles.subfactionCard}
                >
                  <View style={styles.cardTopRow}>
                    {/* Emblem View */}
                    <View
                      style={[
                        styles.emblemBox,
                        {
                          borderColor: subfaction.accentColor || THEME.colors.primary,
                          backgroundColor: subfaction.secondaryColor || THEME.colors.surfaceRaised,
                        },
                      ]}
                    >
                      {subfaction.iconUri ? (
                        <Image
                          source={{ uri: subfaction.iconUri }}
                          style={styles.emblemImg}
                          resizeMode={subfaction.iconCropMode || 'contain'}
                        />
                      ) : fallbackSymbol ? (
                        <Image
                          source={fallbackSymbol}
                          style={[
                            styles.emblemImg,
                            { tintColor: subfaction.primaryColor || THEME.colors.primary },
                          ]}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons
                          name="shield"
                          size={28}
                          color={subfaction.primaryColor || THEME.colors.primary}
                        />
                      )}
                    </View>

                    {/* Title & Parent Faction */}
                    <View style={styles.cardHeaderInfo}>
                      <View style={styles.badgeRow}>
                        <Badge label="CUSTOM" variant="secondary" />
                        {parentFaction && (
                          <Badge
                            label={parentFaction.name.toUpperCase()}
                            variant={parentFaction.allegiance as any}
                            style={{ marginLeft: 6 }}
                          />
                        )}
                        {isActive && (
                          <Badge
                            label="PLEDGED // ACTIVE"
                            variant="primary"
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </View>

                      <Text style={styles.subfactionName}>{subfaction.name}</Text>

                      {subfaction.homeworld ? (
                        <Text style={styles.homeworldText}>
                          Base: {subfaction.homeworld}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Motto */}
                  {subfaction.motto ? (
                    <Text style={styles.mottoText}>"{subfaction.motto}"</Text>
                  ) : null}

                  {/* Lore */}
                  {subfaction.lore ? (
                    <Text style={styles.loreText} numberOfLines={3}>
                      {subfaction.lore}
                    </Text>
                  ) : null}

                  {/* Doctrine Tags */}
                  {subfaction.doctrineTags && subfaction.doctrineTags.length > 0 && (
                    <View style={styles.doctrineRow}>
                      {subfaction.doctrineTags.map((tag) => (
                        <View key={tag} style={styles.doctrinePill}>
                          <Text style={styles.doctrinePillText}>
                            {DOCTRINE_TAG_LABELS[tag] || tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Buttons Bar */}
                  <View style={styles.cardActionsRow}>
                    {!isActive ? (
                      <TouchableOpacity
                        style={[styles.smallBtn, styles.pledgeBtn]}
                        onPress={() => handleSelectSubfaction(subfaction)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="shield-checkmark" size={14} color="#0A0E17" />
                        <Text style={styles.pledgeBtnText}>SWEAR ALLEGIANCE</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.activePillContainer}>
                        <Ionicons name="checkmark-circle" size={16} color={THEME.colors.primary} />
                        <Text style={styles.activePillText}>ACTIVE ARMY IDENTITY</Text>
                      </View>
                    )}

                    <View style={styles.cardUtilityActions}>
                      <TouchableOpacity
                        style={styles.iconActionBtn}
                        onPress={() => handleOpenEdit(subfaction)}
                        activeOpacity={0.7}
                        accessibilityLabel="Edit subfaction"
                      >
                        <Ionicons name="pencil" size={16} color={THEME.colors.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconActionBtn}
                        onPress={() => handleDuplicate(subfaction)}
                        activeOpacity={0.7}
                        accessibilityLabel="Duplicate subfaction"
                      >
                        <Ionicons name="copy-outline" size={16} color={THEME.colors.textMuted} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.iconActionBtn, styles.deleteBtn]}
                        onPress={() => handleDeletePrompt(subfaction)}
                        activeOpacity={0.7}
                        accessibilityLabel="Delete subfaction"
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF5252" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </SciFiCard>
              );
            })
          )}
        </ScrollView>

        {/* Embedded Subfaction Creator / Editor Modal */}
        <CustomSubfactionModal
          visible={isEditorVisible}
          onClose={() => setIsEditorVisible(false)}
          onSave={() => {
            setIsEditorVisible(false);
          }}
          editingSubfaction={editingSubfaction}
          defaultParentFactionId={defaultParentFactionId}
          createAction={createCustomSubfactionAction}
          updateAction={updateCustomSubfactionAction}
        />
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
    backgroundColor: THEME.colors.surfaceRaised,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  actionBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  foundNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  foundNewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0E17',
    marginLeft: 4,
    letterSpacing: 0.6,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 2,
    borderColor: THEME.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  subfactionCard: {
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  emblemBox: {
    width: 58,
    height: 58,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  emblemImg: {
    width: 50,
    height: 50,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 4,
  },
  subfactionName: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 0.8,
  },
  homeworldText: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  mottoText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: THEME.colors.secondary,
    marginBottom: 6,
  },
  loreText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  doctrineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  doctrinePill: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  doctrinePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    paddingTop: 10,
    marginTop: 4,
  },
  pledgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pledgeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0E17',
    marginLeft: 6,
    letterSpacing: 0.6,
  },
  smallBtn: {},
  activePillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    marginLeft: 6,
    letterSpacing: 0.8,
  },
  cardUtilityActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconActionBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginLeft: 8,
  },
  deleteBtn: {
    borderColor: 'rgba(255, 82, 82, 0.4)',
  },
});
