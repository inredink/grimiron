import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ExerciseSet, WeightUnit, SetClassification } from '../types/workout';
import { THEME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface SetRowProps {
  set: ExerciseSet;
  index: number;
  onUpdate: (updatedSet: ExerciseSet) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onCompletedChange?: (isNowCompleted: boolean, setId: string) => void;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  onCompletedChange,
}) => {
  const currentClassification: SetClassification = set.setClassification || 'working';

  const handleRepsChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const reps = cleaned === '' ? 0 : parseInt(cleaned, 10);
    onUpdate({ ...set, reps });
  };

  const handleWeightChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const weight = cleaned === '' ? 0 : parseFloat(cleaned);
    onUpdate({ ...set, weight: isNaN(weight) ? 0 : weight });
  };

  const toggleUnit = () => {
    const nextUnit: WeightUnit = set.unit === 'lbs' ? 'kg' : 'lbs';
    onUpdate({ ...set, unit: nextUnit });
  };

  const toggleClassification = () => {
    const nextClassification: SetClassification =
      currentClassification === 'working'
        ? 'warmup'
        : currentClassification === 'warmup'
        ? 'dropset'
        : 'working';
    onUpdate({ ...set, setClassification: nextClassification });
  };

  const toggleCompleted = () => {
    const nextState = !set.isCompleted;
    onUpdate({ ...set, isCompleted: nextState });
    onCompletedChange?.(nextState, set.id);
  };

  const getClassificationBadge = () => {
    switch (currentClassification) {
      case 'warmup':
        return { label: 'WU', color: THEME.colors.warning, bg: '#33230A' };
      case 'dropset':
        return { label: 'D', color: THEME.colors.secondary, bg: '#0A2D33' };
      default:
        return { label: 'W', color: THEME.colors.primary, bg: '#2B210B' };
    }
  };

  const classBadge = getClassificationBadge();

  return (
    <View style={[styles.row, set.isCompleted && styles.completedRow]}>
      {/* Set Number & Classification Toggle */}
      <View style={styles.colIndex}>
        <TouchableOpacity
          style={[styles.classButton, { backgroundColor: classBadge.bg, borderColor: classBadge.color }]}
          onPress={toggleClassification}
          activeOpacity={0.7}
        >
          <Text style={[styles.classText, { color: classBadge.color }]}>
            {classBadge.label}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.indexText, set.isCompleted && styles.completedText]}>
          #{index + 1}
        </Text>
      </View>

      {/* Weight Input & Unit Toggle */}
      <View style={styles.colWeight}>
        <TextInput
          style={[styles.input, set.isCompleted && styles.completedInput]}
          keyboardType="numeric"
          placeholder="BW"
          placeholderTextColor={THEME.colors.textDisabled}
          value={set.weight === 0 ? '' : set.weight.toString()}
          onChangeText={handleWeightChange}
          selectTextOnFocus
        />
        <TouchableOpacity
          style={styles.unitButton}
          onPress={toggleUnit}
          activeOpacity={0.7}
        >
          <Text style={styles.unitText}>{set.unit}</Text>
        </TouchableOpacity>
      </View>

      {/* Reps Input */}
      <View style={styles.colReps}>
        <TextInput
          style={[styles.input, set.isCompleted && styles.completedInput]}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={THEME.colors.textDisabled}
          value={set.reps === 0 ? '' : set.reps.toString()}
          onChangeText={handleRepsChange}
          selectTextOnFocus
        />
        <Text style={styles.repsLabel}>reps</Text>
      </View>

      {/* Duplicate Set (1-tap clone) */}
      {onDuplicate && (
        <TouchableOpacity
          style={styles.actionIcon}
          onPress={onDuplicate}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="copy-outline" size={15} color={THEME.colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Complete Checkbox */}
      <TouchableOpacity
        style={[styles.checkButton, set.isCompleted && styles.checkButtonActive]}
        onPress={toggleCompleted}
        activeOpacity={0.7}
      >
        <Ionicons
          name={set.isCompleted ? 'checkmark' : 'checkmark-outline'}
          size={18}
          color={set.isCompleted ? '#0A0E17' : THEME.colors.textMuted}
        />
      </TouchableOpacity>

      {/* Delete Set */}
      <TouchableOpacity
        style={styles.actionIcon}
        onPress={onDelete}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="trash-outline" size={16} color={THEME.colors.danger} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  completedRow: {
    borderColor: THEME.colors.successMuted,
    backgroundColor: '#0F1A1B',
  },
  colIndex: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 48,
  },
  classButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    marginRight: 4,
  },
  classText: {
    fontSize: 9,
    fontWeight: '800',
  },
  indexText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  completedText: {
    color: THEME.colors.success,
  },
  colWeight: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  colReps: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  input: {
    backgroundColor: THEME.colors.background,
    color: THEME.colors.textBright,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: THEME.borderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 46,
  },
  completedInput: {
    borderColor: THEME.colors.success,
    color: THEME.colors.textBright,
  },
  unitButton: {
    marginLeft: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: THEME.colors.surfaceHighlight,
    borderRadius: 4,
  },
  unitText: {
    color: THEME.colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  repsLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginLeft: 4,
  },
  actionIcon: {
    padding: 5,
    marginLeft: 2,
  },
  checkButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    backgroundColor: THEME.colors.background,
  },
  checkButtonActive: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
  },
});
