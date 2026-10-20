import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { SciFiCard } from './SciFiCard';
import { Badge } from './Badge';
import { TerminalButton } from './TerminalButton';
import { warhammer40kUniverse, getFactionById } from '../content/warhammer40k';
import { Faction } from '../content/types';
import {
  CustomSubfactionRecord,
  CustomSubfactionInput,
  DoctrineTag,
  DOCTRINE_TAG_LABELS,
} from '../types/customSubfaction';
import {
  MAX_SUBFACTION_NAME_LENGTH,
  validateSubfactionInput,
} from '../services/database/customSubfactionRepository';
import { pickSubfactionIcon } from '../utils/customIconStorage';
import { getFactionSymbol } from '../assets/factionSymbols';
import { triggerHaptic } from '../utils/haptics';

interface CustomSubfactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (record: CustomSubfactionRecord) => void;
  editingSubfaction?: CustomSubfactionRecord | null;
  defaultParentFactionId?: string;
  createAction: (input: CustomSubfactionInput) => CustomSubfactionRecord;
  updateAction: (id: string, updates: Partial<CustomSubfactionInput>) => CustomSubfactionRecord;
}

const COLOR_PALETTE = [
  { name: 'Cyan Plasma', hex: '#00F0FF' },
  { name: 'Imperial Gold', hex: '#FFB800' },
  { name: 'Crimson Red', hex: '#FF4757' },
  { name: 'Emerald Gauss', hex: '#2ECC71' },
  { name: 'Warp Violet', hex: '#A29BFE' },
  { name: 'Cerulean Void', hex: '#3B82F6' },
  { name: 'Amber Forge', hex: '#F59E0B' },
  { name: 'Obsidian Slate', hex: '#334155' },
  { name: 'Pure Bone', hex: '#E2E8F0' },
  { name: 'Tox Phosphex', hex: '#10B981' },
];

const PRESET_THEMES = [
  { label: 'Honor Guard', primary: '#3B82F6', secondary: '#0F172A', accent: '#FFB800' },
  { label: 'Stealth Carbon', primary: '#00F0FF', secondary: '#1E293B', accent: '#38BDF8' },
  { label: 'Blood Zealot', primary: '#FF4757', secondary: '#1A0508', accent: '#FFB800' },
  { label: 'Necron Dynastic', primary: '#2ECC71', secondary: '#0B1410', accent: '#10B981' },
  { label: 'Warp Cult', primary: '#A29BFE', secondary: '#1E1035', accent: '#F43F5E' },
];

function getHomeworldFieldLabel(parentFactionId: string): string {
  switch (parentFactionId) {
    case 'adeptus-astartes':
      return 'Chapter Monastery / Homeworld';
    case 'necrons':
      return 'Crown World / Tomb Complex';
    case 'orks':
      return 'Warboss Stronghold / Junk-Hulk';
    case 'tau-empire':
      return 'Sept World / Colony Sphere';
    case 'astra-militarum':
      return 'Regimental Fortress / Tithe World';
    case 'adeptus-mechanicus':
      return 'Forge World / Research Vault';
    case 'tyranids':
      return 'Bio-Fleet Spawning Leviathan';
    case 'drukhari':
      return 'Commorragh Spire / Dark Port';
    case 'chaos-daemons':
    case 'heretic-astartes':
    case 'death-guard':
    case 'thousand-sons':
    case 'world-eaters':
      return 'Warp Rift / Daemon World Citadel';
    default:
      return 'Homeworld / Strategic Base';
  }
}

export const CustomSubfactionModal: React.FC<CustomSubfactionModalProps> = ({
  visible,
  onClose,
  onSave,
  editingSubfaction,
  defaultParentFactionId = 'adeptus-astartes',
  createAction,
  updateAction,
}) => {
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(editingSubfaction);

  // Form State
  const [name, setName] = useState('');
  const [parentFactionId, setParentFactionId] = useState(defaultParentFactionId);
  const [lore, setLore] = useState('');
  const [motto, setMotto] = useState('');
  const [homeworld, setHomeworld] = useState('');
  const [doctrineTags, setDoctrineTags] = useState<DoctrineTag[]>([]);
  const [primaryColor, setPrimaryColor] = useState('#00F0FF');
  const [secondaryColor, setSecondaryColor] = useState('#1E293B');
  const [accentColor, setAccentColor] = useState('#FFB800');
  const [iconUri, setIconUri] = useState<string | undefined>(undefined);
  const [iconCropMode, setIconCropMode] = useState<'contain' | 'cover'>('contain');

  // UI state
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (editingSubfaction) {
      setName(editingSubfaction.name);
      setParentFactionId(editingSubfaction.parentFactionId);
      setLore(editingSubfaction.lore || '');
      setMotto(editingSubfaction.motto || '');
      setHomeworld(editingSubfaction.homeworld || '');
      setDoctrineTags(editingSubfaction.doctrineTags || []);
      setPrimaryColor(editingSubfaction.primaryColor || '#00F0FF');
      setSecondaryColor(editingSubfaction.secondaryColor || '#1E293B');
      setAccentColor(editingSubfaction.accentColor || '#FFB800');
      setIconUri(editingSubfaction.iconUri);
      setIconCropMode(editingSubfaction.iconCropMode || 'contain');
    } else {
      setName('');
      setParentFactionId(defaultParentFactionId);
      setLore('');
      setMotto('');
      setHomeworld('');
      setDoctrineTags([]);
      setPrimaryColor('#00F0FF');
      setSecondaryColor('#1E293B');
      setAccentColor('#FFB800');
      setIconUri(undefined);
      setIconCropMode('contain');
    }
    setErrorMessage(null);
  }, [editingSubfaction, defaultParentFactionId, visible]);

  const selectedFaction = useMemo(
    () => getFactionById(parentFactionId) || warhammer40kUniverse.factions[0],
    [parentFactionId]
  );

  const fallbackFactionSymbol = useMemo(
    () => getFactionSymbol(parentFactionId, undefined, 'white'),
    [parentFactionId]
  );

  const handlePickIcon = async () => {
    triggerHaptic.selection();
    setIsPickingImage(true);
    setErrorMessage(null);

    const result = await pickSubfactionIcon();
    setIsPickingImage(false);

    if (result.error) {
      triggerHaptic.warning();
      Alert.alert('Image Selection Notice', result.error);
      return;
    }

    if (!result.cancelled && result.uri) {
      triggerHaptic.success();
      setIconUri(result.uri);
    }
  };

  const handleRemoveIcon = () => {
    triggerHaptic.light();
    setIconUri(undefined);
  };

  const toggleDoctrineTag = (tag: DoctrineTag) => {
    triggerHaptic.selection();
    setDoctrineTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleApplyPreset = (preset: typeof PRESET_THEMES[0]) => {
    triggerHaptic.selection();
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
  };

  const handleSave = () => {
    const input: CustomSubfactionInput = {
      name,
      parentFactionId,
      lore,
      motto,
      homeworld,
      doctrineTags,
      primaryColor,
      secondaryColor,
      accentColor,
      iconUri,
      iconCropMode,
    };

    const validation = validateSubfactionInput(input, editingSubfaction?.id);
    if (!validation.isValid) {
      triggerHaptic.warning();
      const firstError = validation.errors[0]?.message || 'Please check your inputs.';
      setErrorMessage(firstError);
      Alert.alert('Validation Error', firstError);
      return;
    }

    try {
      let saved: CustomSubfactionRecord;
      if (isEditing && editingSubfaction) {
        saved = updateAction(editingSubfaction.id, input);
      } else {
        saved = createAction(input);
      }
      triggerHaptic.success();
      onSave(saved);
      onClose();
    } catch (err: any) {
      triggerHaptic.warning();
      const message = err?.message || 'Failed to persist custom subfaction.';
      setErrorMessage(message);
      Alert.alert('Persistence Error', message);
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <Ionicons name="shield-half-outline" size={24} color={THEME.colors.primary} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.headerTitle}>
                  {isEditing ? 'EDIT CUSTOM SUBFACTION' : 'FOUND NEW SUBFACTION'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isEditing
                    ? `UPDATING DOSSIER: ${editingSubfaction?.name}`
                    : 'ESTABLISH ARMY IDENTITY & HERALDRY'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.container}
            contentContainerStyle={[
              styles.contentContainer,
              { paddingBottom: Math.max(80, insets.bottom + 48) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Error Banner */}
            {Boolean(errorMessage) && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#FF5252" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Section 1: Required Identity */}
            <SciFiCard title="1. SUBFACTION IDENTITY (REQUIRED)" variant="accent" style={styles.sectionCard}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>SUBFACTION NAME *</Text>
                  <Text style={styles.charCountText}>
                    {name.length} / {MAX_SUBFACTION_NAME_LENGTH}
                  </Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. The Ashen Wardens, Da Ironbreakaz, Obsidian Spear"
                  placeholderTextColor={THEME.colors.textDisabled}
                  value={name}
                  onChangeText={setName}
                  maxLength={MAX_SUBFACTION_NAME_LENGTH}
                  autoCapitalize="words"
                />
              </View>

              {/* Parent Faction Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PARENT ARMY / FACTION *</Text>
                <Text style={styles.fieldHelpText}>
                  Determines your baseline combat attacks, weapons, and rules.
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.parentFactionsRow}
                >
                  {warhammer40kUniverse.factions.map((f) => {
                    const isSelected = f.id === parentFactionId;
                    const fSymbol = getFactionSymbol(f.id, undefined, 'white');
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[
                          styles.parentFactionChip,
                          isSelected && styles.parentFactionChipSelected,
                        ]}
                        onPress={() => {
                          triggerHaptic.selection();
                          setParentFactionId(f.id);
                        }}
                        activeOpacity={0.75}
                      >
                        {fSymbol && (
                          <Image
                            source={fSymbol}
                            style={[
                              styles.parentFactionChipIcon,
                              isSelected && { tintColor: '#0A0E17' },
                            ]}
                            resizeMode="contain"
                          />
                        )}
                        <Text
                          style={[
                            styles.parentFactionChipText,
                            isSelected && styles.parentFactionChipTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {f.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </SciFiCard>

            {/* Section 2: Custom Emblem / Uploaded Picture */}
            <SciFiCard title="2. SUBFACTION HERALDRY & EMBLEM (OPTIONAL)" style={styles.sectionCard}>
              <Text style={styles.fieldHelpText}>
                Upload your own picture or emblem (transparent PNG, JPEG, WebP up to 5 MB). Uploading a picture is optional; without an upload, your army proudly displays its parent faction symbol.
              </Text>

              <View style={styles.emblemPreviewRow}>
                {/* Emblem Display Frame */}
                <View
                  style={[
                    styles.emblemSquareFrame,
                    {
                      borderColor: accentColor,
                      backgroundColor: secondaryColor,
                    },
                  ]}
                >
                  {iconUri ? (
                    <Image
                      source={{ uri: iconUri }}
                      style={styles.emblemImage}
                      resizeMode={iconCropMode}
                    />
                  ) : fallbackFactionSymbol ? (
                    <Image
                      source={fallbackFactionSymbol}
                      style={[styles.emblemImage, { tintColor: primaryColor }]}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons name="shield-outline" size={48} color={primaryColor} />
                  )}

                  {/* Corner reticles */}
                  <View style={[styles.cornerReticle, styles.reticleTL, { borderColor: primaryColor }]} />
                  <View style={[styles.cornerReticle, styles.reticleTR, { borderColor: primaryColor }]} />
                  <View style={[styles.cornerReticle, styles.reticleBL, { borderColor: primaryColor }]} />
                  <View style={[styles.cornerReticle, styles.reticleBR, { borderColor: primaryColor }]} />
                </View>

                {/* Emblem Action Buttons */}
                <View style={styles.emblemActionsCol}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={handlePickIcon}
                    activeOpacity={0.75}
                    disabled={isPickingImage}
                  >
                    {isPickingImage ? (
                      <ActivityIndicator size="small" color="#0A0E17" />
                    ) : (
                      <>
                        <Ionicons
                          name={iconUri ? 'repeat-outline' : 'cloud-upload-outline'}
                          size={18}
                          color="#0A0E17"
                        />
                        <Text style={styles.actionBtnPrimaryText}>
                          {iconUri ? 'REPLACE PICTURE' : 'CHOOSE PICTURE'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {Boolean(iconUri) && (
                    <>
                      {/* Crop Mode Toggle */}
                      <TouchableOpacity
                        style={styles.cropModeToggle}
                        onPress={() => {
                          triggerHaptic.selection();
                          setIconCropMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={iconCropMode === 'contain' ? 'scan-outline' : 'contract-outline'}
                          size={16}
                          color={THEME.colors.textMuted}
                        />
                        <Text style={styles.cropModeText}>
                          Mode: {iconCropMode.toUpperCase()}
                        </Text>
                      </TouchableOpacity>

                      {/* Remove Button */}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDanger]}
                        onPress={handleRemoveIcon}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF5252" />
                        <Text style={styles.actionBtnDangerText}>REMOVE CUSTOM ICON</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              <Text style={styles.emblemStatusText}>
                {iconUri
                  ? 'Custom emblem active. It will appear on your character dossier, army list, and battle debriefs.'
                  : `No picture uploaded. Defaulting to official ${selectedFaction.name} heraldry.`}
              </Text>
            </SciFiCard>

            {/* Section 3: Lore & Battle Cry */}
            <SciFiCard title="3. LORE & BATTLE CRY (OPTIONAL)" style={styles.sectionCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MOTTO OR BATTLE CRY</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Iron Within, Iron Without; For the Greater Good"
                  placeholderTextColor={THEME.colors.textDisabled}
                  value={motto}
                  onChangeText={setMotto}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {getHomeworldFieldLabel(parentFactionId).toUpperCase()}
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Baal Secundus, Medusa, Armageddon Hive Primus"
                  placeholderTextColor={THEME.colors.textDisabled}
                  value={homeworld}
                  onChangeText={setHomeworld}
                  maxLength={60}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DESCRIPTION & NARRATIVE LORE</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Record your subfaction's founding history, notable campaigns, or tactical temperament..."
                  placeholderTextColor={THEME.colors.textDisabled}
                  value={lore}
                  onChangeText={setLore}
                  multiline
                  numberOfLines={4}
                  maxLength={600}
                />
              </View>
            </SciFiCard>

            {/* Section 4: Doctrine & Personality Tags */}
            <SciFiCard title="4. DOCTRINE & PERSONALITY TAGS (OPTIONAL)" style={styles.sectionCard}>
              <Text style={styles.fieldHelpText}>
                Descriptive tags representing your subfaction's strategic ethos and martial culture:
              </Text>
              <View style={styles.doctrineChipsGrid}>
                {(Object.keys(DOCTRINE_TAG_LABELS) as DoctrineTag[]).map((tag) => {
                  const isSelected = doctrineTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.doctrineChip,
                        isSelected && styles.doctrineChipSelected,
                      ]}
                      onPress={() => toggleDoctrineTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={isSelected ? '#0A0E17' : THEME.colors.textMuted}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.doctrineChipText,
                          isSelected && styles.doctrineChipTextSelected,
                        ]}
                      >
                        {DOCTRINE_TAG_LABELS[tag]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </SciFiCard>

            {/* Section 5: Tactical Color Palette */}
            <SciFiCard title="5. ARMOR ACCENTS & PALETTE (OPTIONAL)" style={styles.sectionCard}>
              <Text style={styles.fieldHelpText}>
                Quick Theme Presets:
              </Text>
              <View style={styles.presetsRow}>
                {PRESET_THEMES.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={styles.presetChip}
                    onPress={() => handleApplyPreset(preset)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.presetDotRow}>
                      <View style={[styles.presetDot, { backgroundColor: preset.primary }]} />
                      <View style={[styles.presetDot, { backgroundColor: preset.accent }]} />
                    </View>
                    <Text style={styles.presetChipText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>PRIMARY COLOR</Text>
              <View style={styles.paletteRow}>
                {COLOR_PALETTE.map((c) => (
                  <TouchableOpacity
                    key={`pri_${c.hex}`}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c.hex },
                      primaryColor === c.hex && styles.colorCircleSelected,
                    ]}
                    onPress={() => {
                      triggerHaptic.selection();
                      setPrimaryColor(c.hex);
                    }}
                    activeOpacity={0.7}
                  />
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>ACCENT COLOR</Text>
              <View style={styles.paletteRow}>
                {COLOR_PALETTE.map((c) => (
                  <TouchableOpacity
                    key={`acc_${c.hex}`}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c.hex },
                      accentColor === c.hex && styles.colorCircleSelected,
                    ]}
                    onPress={() => {
                      triggerHaptic.selection();
                      setAccentColor(c.hex);
                    }}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
            </SciFiCard>

            {/* Bottom Actions */}
            <View style={styles.bottomButtonsRow}>
              <TerminalButton
                title={isEditing ? 'UPDATE SUBFACTION' : 'ESTABLISH SUBFACTION'}
                variant="primary"
                icon="checkmark-done"
                onPress={handleSave}
                style={{ flex: 1, marginRight: 8 }}
              />
              <TerminalButton
                title="CANCEL"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 0.6 }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderWidth: 1,
    borderColor: '#FF5252',
    borderRadius: THEME.borderRadius.sm,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  sectionCard: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  charCountText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  fieldHelpText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: THEME.colors.textBright,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  parentFactionsRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  parentFactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  parentFactionChipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  parentFactionChipIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  parentFactionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  parentFactionChipTextSelected: {
    color: '#0A0E17',
  },
  emblemPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emblemSquareFrame: {
    width: 100,
    height: 100,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  emblemImage: {
    width: 84,
    height: 84,
  },
  cornerReticle: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  reticleTL: {
    top: 3,
    left: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  reticleTR: {
    top: 3,
    right: 3,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  reticleBL: {
    bottom: 3,
    left: 3,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  reticleBR: {
    bottom: 3,
    right: 3,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  emblemActionsCol: {
    flex: 1,
    marginLeft: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.sm,
    marginBottom: 8,
  },
  actionBtnPrimary: {
    backgroundColor: THEME.colors.primary,
  },
  actionBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0E17',
    marginLeft: 6,
    letterSpacing: 0.8,
  },
  actionBtnDanger: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  actionBtnDangerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF5252',
    marginLeft: 6,
    letterSpacing: 0.8,
  },
  cropModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 8,
  },
  cropModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginLeft: 6,
  },
  emblemStatusText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
  doctrineChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  doctrineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 6,
    marginBottom: 8,
  },
  doctrineChipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  doctrineChipText: {
    fontSize: 11,
    color: THEME.colors.textBright,
    fontWeight: '600',
  },
  doctrineChipTextSelected: {
    color: '#0A0E17',
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  presetDotRow: {
    flexDirection: 'row',
    marginRight: 6,
  },
  presetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 2,
  },
  presetChipText: {
    fontSize: 10,
    color: THEME.colors.textBright,
    fontWeight: '600',
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  colorCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#0A0E17',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
  },
});
