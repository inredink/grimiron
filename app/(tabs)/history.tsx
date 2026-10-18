import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { THEME } from '../../src/constants/theme';
import { SciFiCard } from '../../src/components/SciFiCard';
import { Badge } from '../../src/components/Badge';
import { TerminalButton } from '../../src/components/TerminalButton';
import { deleteWorkout } from '../../src/services/database/workoutRepository';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutSession } from '../../src/types/workout';

export default function HistoryScreen() {
  const router = useRouter();
  const { workoutHistory, refreshData, startNewWorkout, repeatWorkout } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRepeat = (session: WorkoutSession) => {
    Alert.alert(
      'Repeat Mission',
      `Deploy "${session.title}" as your active workout with the same exercises and sets?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deploy Mission',
          onPress: () => {
            repeatWorkout(session.id);
            router.push('/(tabs)/workout');
          },
        },
      ]
    );
  };

  const handleDelete = (session: WorkoutSession) => {
    Alert.alert(
      'Delete Mission Record',
      `Are you sure you want to delete "${session.title}"? This will subtract ${session.totalXpEarned} XP from your career total.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteWorkout(session.id);
            refreshData();
          },
        },
      ]
    );
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Terminal Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MISSION ARCHIVES</Text>
          <Text style={styles.headerSubtitle}>
            HISTORICAL COMBAT & TRAINING LOGS
          </Text>
        </View>

        {workoutHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="journal-outline"
              size={64}
              color={THEME.colors.surfaceBorder}
            />
            <Text style={styles.emptyTitle}>NO ARCHIVED MISSIONS</Text>
            <Text style={styles.emptySubtitle}>
              You have not recorded any workouts yet. Launch your first training session to begin logging combat records.
            </Text>
            <TerminalButton
              title="START FIRST MISSION"
              onPress={() => {
                startNewWorkout('Initiate Crusade');
                router.push('/(tabs)/workout');
              }}
              variant="primary"
              size="md"
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          workoutHistory.map((workout) => {
            const isExpanded = expandedId === workout.id;
            const totalSets = workout.exercises.reduce(
              (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
              0
            );

            return (
              <SciFiCard
                key={workout.id}
                title={workout.title}
                subtitle={formatDate(workout.startedAt)}
                rightAction={
                  <View style={styles.cardHeaderRight}>
                    <Badge
                      label={`+${workout.totalXpEarned} XP`}
                      variant="success"
                      style={{ marginRight: 8 }}
                    />
                    <TouchableOpacity
                      onPress={() => handleRepeat(workout)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ marginRight: 8 }}
                    >
                      <Ionicons
                        name="repeat"
                        size={17}
                        color={THEME.colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(workout)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={THEME.colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                }
              >
                {/* Summary Chips */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(workout.id)}
                  style={styles.summaryRow}
                >
                  <View style={styles.metricItem}>
                    <Ionicons
                      name="fitness-outline"
                      size={15}
                      color={THEME.colors.primary}
                    />
                    <Text style={styles.metricText}>
                      {workout.exercises.length} Exercises
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={15}
                      color={THEME.colors.secondary}
                    />
                    <Text style={styles.metricText}>{totalSets} Sets Done</Text>
                  </View>

                  <View style={styles.expandChevron}>
                    <Text style={styles.viewDetailsText}>
                      {isExpanded ? 'COLLAPSE' : 'INSPECT'}
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={THEME.colors.textMuted}
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded Details Breakdown */}
                {isExpanded && (
                  <View style={styles.detailsContainer}>
                    <View style={styles.detailsDivider} />
                    {workout.exercises.map((exercise, exIdx) => (
                      <View key={exercise.id || exIdx} style={styles.exerciseDetailBox}>
                        <Text style={styles.exerciseDetailTitle}>
                          {exercise.name}
                        </Text>
                        <View style={styles.setsGrid}>
                          {exercise.sets.map((set, setIdx) => (
                            <View
                              key={set.id || setIdx}
                              style={[
                                styles.setDetailPill,
                                set.isCompleted && styles.completedPill,
                              ]}
                            >
                              <Text style={styles.setPillText}>
                                Set {setIdx + 1}:{' '}
                                <Text style={styles.setPillBold}>
                                  {set.weight > 0 ? `${set.weight} ${set.unit} × ` : ''}
                                  {set.reps} reps
                                </Text>
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}

                    <TerminalButton
                      title="REPEAT THIS MISSION"
                      onPress={() => handleRepeat(workout)}
                      variant="outline"
                      size="sm"
                      icon={<Ionicons name="repeat" size={15} color={THEME.colors.primary} />}
                      style={{ marginTop: 8 }}
                    />
                  </View>
                )}
              </SciFiCard>
            );
          })
        )}
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
    marginBottom: THEME.spacing.md,
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
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    color: THEME.colors.textMain,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  expandChevron: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginRight: 4,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: THEME.colors.surfaceBorder,
    marginBottom: 8,
  },
  exerciseDetailBox: {
    marginBottom: 8,
  },
  exerciseDetailTitle: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  setsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  setDetailPill: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  completedPill: {
    borderColor: THEME.colors.successMuted,
    backgroundColor: '#0F1A1B',
  },
  setPillText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  setPillBold: {
    color: THEME.colors.textBright,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xl,
    marginTop: 40,
  },
  emptyTitle: {
    color: THEME.colors.textMuted,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 16,
  },
  emptySubtitle: {
    color: THEME.colors.textDisabled,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 280,
  },
});
