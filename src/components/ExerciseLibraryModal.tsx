import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { THEME } from '../constants/theme';
import {
  ExerciseDefinition,
  MuscleGroup,
  EquipmentType,
  MovementPattern,
  ExerciseCategory,
} from '../types/exercise';
import {
  getAllExercises,
  createCustomExercise,
  toggleFavoriteExercise,
} from '../services/database/exerciseRepository';
import { TerminalButton } from './TerminalButton';
import { Badge } from './Badge';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseDefinition) => void;
}

const MUSCLE_FILTERS: { label: string; value: MuscleGroup | 'all' }[] = [
  { label: 'ALL', value: 'all' },
  { label: 'CHEST', value: 'chest' },
  { label: 'BACK', value: 'back' },
  { label: 'QUADS', value: 'quads' },
  { label: 'HAMSTRINGS', value: 'hamstrings' },
  { label: 'GLUTES', value: 'glutes' },
  { label: 'SHOULDERS', value: 'shoulders' },
  { label: 'BICEPS', value: 'biceps' },
  { label: 'TRICEPS', value: 'triceps' },
  { label: 'CORE', value: 'core' },
];

const EQUIPMENT_FILTERS: { label: string; value: EquipmentType | 'all' }[] = [
  { label: 'ALL', value: 'all' },
  { label: 'BARBELL', value: 'barbell' },
  { label: 'DUMBBELL', value: 'dumbbell' },
  { label: 'BODYWEIGHT', value: 'bodyweight' },
  { label: 'CABLE', value: 'cable' },
  { label: 'MACHINE', value: 'machine' },
  { label: 'KETTLEBELL', value: 'kettlebell' },
  { label: 'BAND', value: 'resistance_band' },
];

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
  visible,
  onClose,
  onSelectExercise,
}) => {
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | 'all'>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Custom Exercise Creation Form state
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrimaryMuscle, setCustomPrimaryMuscle] = useState<MuscleGroup>('chest');
  const [customEquipment, setCustomEquipment] = useState<EquipmentType>('barbell');
  const [customPattern, setCustomPattern] = useState<MovementPattern>('push');
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>('strength');

  const loadExercises = () => {
    try {
      const all = getAllExercises();
      setExercises(all);
    } catch (err) {
      console.error('Failed to load exercises:', err);
    }
  };

  React.useEffect(() => {
    if (visible) {
      loadExercises();
    }
  }, [visible]);

  const handleToggleFavorite = (exerciseId: string) => {
    toggleFavoriteExercise(exerciseId);
    loadExercises();
  };

  const handleSaveCustomExercise = () => {
    if (!customName.trim()) return;

    const created = createCustomExercise({
      name: customName.trim(),
      aliases: [],
      primaryMuscle: customPrimaryMuscle,
      secondaryMuscles: [],
      equipment: customEquipment,
      movementPattern: customPattern,
      category: customCategory,
    });

    setCustomName('');
    setIsCreatingCustom(false);
    loadExercises();
    onSelectExercise(created);
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      if (showOnlyFavorites && !ex.isFavorite) {
        return false;
      }

      if (selectedMuscle !== 'all') {
        const matchesPrimary = ex.primaryMuscle === selectedMuscle;
        const matchesSecondary = ex.secondaryMuscles.includes(selectedMuscle);
        if (!matchesPrimary && !matchesSecondary) return false;
      }

      if (selectedEquipment !== 'all' && ex.equipment !== selectedEquipment) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = ex.name.toLowerCase().includes(query);
        const matchesAliases = ex.aliases.some((a) => a.toLowerCase().includes(query));
        const matchesMuscle = ex.primaryMuscle.toLowerCase().includes(query);
        const matchesEquip = ex.equipment.toLowerCase().includes(query);
        if (!matchesName && !matchesAliases && !matchesMuscle && !matchesEquip) return false;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedMuscle, selectedEquipment, showOnlyFavorites]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>EXERCISE ARMORY</Text>
              <Text style={styles.subtitle}>
                {filteredExercises.length} EXERCISES AVAILABLE
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {!isCreatingCustom ? (
            <>
              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color={THEME.colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search 100+ exercises or aliases..."
                  placeholderTextColor={THEME.colors.textDisabled}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
                <TouchableOpacity
                  style={[styles.favoriteFilterPill, showOnlyFavorites && styles.favoriteFilterPillActive]}
                  onPress={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showOnlyFavorites ? 'star' : 'star-outline'}
                    size={16}
                    color={showOnlyFavorites ? '#0A0E17' : THEME.colors.primary}
                  />
                </TouchableOpacity>
              </View>

              {/* Muscle Filters Horizontal Scroll */}
              <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {MUSCLE_FILTERS.map((m) => (
                    <TouchableOpacity
                      key={m.value}
                      style={[
                        styles.filterChip,
                        selectedMuscle === m.value && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedMuscle(m.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedMuscle === m.value && styles.filterChipTextActive,
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Equipment Filters Horizontal Scroll */}
              <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {EQUIPMENT_FILTERS.map((e) => (
                    <TouchableOpacity
                      key={e.value}
                      style={[
                        styles.filterChip,
                        selectedEquipment === e.value && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedEquipment(e.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedEquipment === e.value && styles.filterChipTextActive,
                        ]}
                      >
                        {e.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Exercise List */}
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.exerciseCard}
                    activeOpacity={0.7}
                    onPress={() => onSelectExercise(item)}
                  >
                    <View style={styles.cardInfo}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.exerciseName}>{item.name}</Text>
                        <TouchableOpacity
                          onPress={() => handleToggleFavorite(item.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{ padding: 4 }}
                        >
                          <Ionicons
                            name={item.isFavorite ? 'star' : 'star-outline'}
                            size={18}
                            color={item.isFavorite ? THEME.colors.primary : THEME.colors.textDisabled}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.tagRow}>
                        <Badge label={item.equipment.replace('_', ' ')} variant="neutral" style={styles.tagBadge} />
                        <Badge label={item.primaryMuscle} variant="secondary" style={styles.tagBadge} />
                        {item.isCustom && (
                          <Badge label="CUSTOM" variant="primary" style={styles.tagBadge} />
                        )}
                      </View>
                    </View>

                    <Ionicons name="add-circle" size={24} color={THEME.colors.primary} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptySearch}>
                    <Ionicons name="search-outline" size={32} color={THEME.colors.textDisabled} />
                    <Text style={styles.emptySearchText}>No matching exercises found.</Text>
                    <TerminalButton
                      title="+ CREATE AS CUSTOM EXERCISE"
                      onPress={() => {
                        setCustomName(searchQuery);
                        setIsCreatingCustom(true);
                      }}
                      variant="primary"
                      size="sm"
                      style={{ marginTop: 12 }}
                    />
                  </View>
                }
              />

              {/* Create Custom Exercise Bar */}
              <TouchableOpacity
                style={styles.createCustomBar}
                onPress={() => setIsCreatingCustom(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="construct-outline" size={16} color={THEME.colors.primary} />
                <Text style={styles.createCustomText}>+ CREATE CUSTOM EXERCISE</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Custom Exercise Form */
            <ScrollView style={styles.customForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.formSectionTitle}>CREATE CUSTOM COMBAT EXERCISE</Text>

              <Text style={styles.inputLabel}>EXERCISE DISPLAY NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Hex Bar Shrugs"
                placeholderTextColor={THEME.colors.textDisabled}
                value={customName}
                onChangeText={setCustomName}
              />

              <Text style={styles.inputLabel}>PRIMARY MUSCLE GROUP</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {MUSCLE_FILTERS.filter((m) => m.value !== 'all').map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    style={[
                      styles.filterChip,
                      customPrimaryMuscle === m.value && styles.filterChipActive,
                    ]}
                    onPress={() => setCustomPrimaryMuscle(m.value as MuscleGroup)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        customPrimaryMuscle === m.value && styles.filterChipTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>EQUIPMENT TYPE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {EQUIPMENT_FILTERS.filter((e) => e.value !== 'all').map((e) => (
                  <TouchableOpacity
                    key={e.value}
                    style={[
                      styles.filterChip,
                      customEquipment === e.value && styles.filterChipActive,
                    ]}
                    onPress={() => setCustomEquipment(e.value as EquipmentType)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        customEquipment === e.value && styles.filterChipTextActive,
                      ]}
                    >
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.formActions}>
                <TerminalButton
                  title="SAVE & SELECT"
                  onPress={handleSaveCustomExercise}
                  disabled={!customName.trim()}
                  variant="primary"
                  size="md"
                  style={{ flex: 1, marginRight: 8 }}
                />
                <TerminalButton
                  title="CANCEL"
                  onPress={() => setIsCreatingCustom(false)}
                  variant="ghost"
                  size="md"
                  style={{ width: 90 }}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.88)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.borderRadius.lg,
    borderTopRightRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    height: '90%',
    padding: THEME.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: 4,
  },
  title: {
    color: THEME.colors.primary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  subtitle: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.textBright,
    fontSize: 13,
  },
  favoriteFilterPill: {
    padding: 6,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginLeft: 6,
  },
  favoriteFilterPillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterSection: {
    marginVertical: 2,
  },
  horizontalScroll: {
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterChipText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  filterChipTextActive: {
    color: '#0A0E17',
  },
  list: {
    flex: 1,
    marginTop: 6,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: 10,
    marginBottom: 6,
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tagBadge: {
    marginRight: 4,
  },
  createCustomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.colors.primary,
    marginTop: 8,
  },
  createCustomText: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 6,
  },
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptySearchText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  customForm: {
    flex: 1,
    paddingVertical: 8,
  },
  formSectionTitle: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: THEME.borderRadius.sm,
    color: THEME.colors.textBright,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
});
