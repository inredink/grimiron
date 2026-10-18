import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { SciFiCard } from './SciFiCard';
import { TerminalButton } from './TerminalButton';
import { ProgressBar } from './ProgressBar';
import { Badge } from './Badge';
import {
  TrainingProgramDefinition,
  ProgramCategory,
  UserProgramEnrollment,
  ScheduledProgramSession,
} from '../types/program';
import {
  TRAINING_PROGRAM_CATALOG,
  getProgramById,
} from '../content/programs/catalog';

interface ProgramCenterModalProps {
  visible: boolean;
  onClose: () => void;
  activeEnrollment: UserProgramEnrollment | null;
  onEnrollProgram: (program: TrainingProgramDefinition) => void;
  onPauseProgram: () => void;
  onResumeProgram: () => void;
  onStartScheduledWorkout: (session: ScheduledProgramSession) => void;
}

const CATEGORY_TABS: { id: ProgramCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'ALL PROGRAMS' },
  { id: 'gvt', label: '10×10 GVT' },
  { id: 'ppl', label: 'PPL SPLIT' },
  { id: 'upper_lower', label: 'UPPER/LOWER' },
  { id: 'full_body', label: 'FULL BODY' },
  { id: 'strength_5x5', label: '5×5 STRENGTH' },
  { id: 'hypertrophy', label: 'HYPERTROPHY' },
  { id: 'calisthenics', label: 'CALISTHENICS' },
];

export const ProgramCenterModal: React.FC<ProgramCenterModalProps> = ({
  visible,
  onClose,
  activeEnrollment,
  onEnrollProgram,
  onPauseProgram,
  onResumeProgram,
  onStartScheduledWorkout,
}) => {
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'catalog'>(
    activeEnrollment ? 'dashboard' : 'catalog'
  );
  const [selectedCategory, setSelectedCategory] = useState<ProgramCategory | 'all'>('all');
  const [inspectProgram, setInspectProgram] = useState<TrainingProgramDefinition | null>(null);

  const filteredPrograms = useMemo(() => {
    if (selectedCategory === 'all') return TRAINING_PROGRAM_CATALOG;
    return TRAINING_PROGRAM_CATALOG.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  // Current scheduled session in active program
  const currentScheduledSession: ScheduledProgramSession | null = useMemo(() => {
    if (!activeEnrollment) return null;
    const snap = activeEnrollment.programSnapshot;
    const block = snap.blocks.find(
      (b) => b.blockNumber === activeEnrollment.currentBlockNumber
    ) || snap.blocks[0];
    if (!block || !block.sessions) return null;
    return block.sessions[activeEnrollment.currentSessionIndex] || block.sessions[0];
  }, [activeEnrollment]);

  const handleEnrollClick = (program: TrainingProgramDefinition) => {
    if (activeEnrollment && activeEnrollment.programId !== program.id) {
      Alert.alert(
        'Switch Training Program',
        `You are currently enrolled in "${activeEnrollment.programTitle}". Switching to "${program.title}" will preserve your past workout history while setting this new program as your active schedule. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enroll Now',
            onPress: () => {
              onEnrollProgram(program);
              setSelectedTab('dashboard');
              setInspectProgram(null);
            },
          },
        ]
      );
    } else {
      onEnrollProgram(program);
      setSelectedTab('dashboard');
      setInspectProgram(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header HUD */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="barbell-outline" size={24} color={THEME.colors.primary} />
            <Text style={styles.headerTitle}>TRAINING PROGRAM TERMINAL</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              selectedTab === 'dashboard' && styles.modeTabActive,
            ]}
            onPress={() => setSelectedTab('dashboard')}
          >
            <Ionicons
              name="analytics-outline"
              size={16}
              color={selectedTab === 'dashboard' ? THEME.colors.primary : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.modeTabText,
                selectedTab === 'dashboard' && styles.modeTabTextActive,
              ]}
            >
              ACTIVE DASHBOARD
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              selectedTab === 'catalog' && styles.modeTabActive,
            ]}
            onPress={() => setSelectedTab('catalog')}
          >
            <Ionicons
              name="library-outline"
              size={16}
              color={selectedTab === 'catalog' ? THEME.colors.primary : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.modeTabText,
                selectedTab === 'catalog' && styles.modeTabTextActive,
              ]}
            >
              PROGRAM CATALOG ({TRAINING_PROGRAM_CATALOG.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ========================================================= */}
          {/* TAB 1: ACTIVE DASHBOARD                                   */}
          {/* ========================================================= */}
          {selectedTab === 'dashboard' && (
            <View>
              {activeEnrollment ? (
                <>
                  {/* Hero Program Status */}
                  <SciFiCard
                    title={`ENROLLED // ${activeEnrollment.programTitle.toUpperCase()}`}
                    variant="accent"
                    rightAction={
                      <Badge
                        label={activeEnrollment.status.toUpperCase()}
                        variant={activeEnrollment.status === 'active' ? 'primary' : 'neutral'}
                      />
                    }
                  >
                    <Text style={styles.programDescText}>
                      {activeEnrollment.programSnapshot.shortDescription}
                    </Text>

                    <View style={styles.statsRow}>
                      <View style={styles.statCell}>
                        <Text style={styles.statVal}>
                          Block {activeEnrollment.currentBlockNumber}
                        </Text>
                        <Text style={styles.statLbl}>CURRENT BLOCK</Text>
                      </View>
                      <View style={styles.statCell}>
                        <Text style={styles.statVal}>
                          {activeEnrollment.completedSessionsCount} / {activeEnrollment.totalPlannedSessionsCount}
                        </Text>
                        <Text style={styles.statLbl}>SESSIONS LOGGED</Text>
                      </View>
                      <View style={styles.statCell}>
                        <Text style={styles.statVal}>{activeEnrollment.adherencePercent}%</Text>
                        <Text style={styles.statLbl}>ADHERENCE</Text>
                      </View>
                    </View>

                    <ProgressBar
                      progress={activeEnrollment.adherencePercent}
                      label="Program Completion"
                      valueText={`${activeEnrollment.completedSessionsCount} of ${activeEnrollment.totalPlannedSessionsCount} sessions`}
                      color={THEME.colors.primary}
                      height={8}
                    />

                    {/* Pause / Resume Controls */}
                    <View style={styles.controlRow}>
                      {activeEnrollment.status === 'active' ? (
                        <TerminalButton
                          title="PAUSE PROGRAM"
                          onPress={onPauseProgram}
                          variant="ghost"
                          size="sm"
                          icon={<Ionicons name="pause-outline" size={14} color={THEME.colors.warning} />}
                        />
                      ) : (
                        <TerminalButton
                          title="RESUME PROGRAM"
                          onPress={onResumeProgram}
                          variant="secondary"
                          size="sm"
                          icon={<Ionicons name="play-outline" size={14} color={THEME.colors.primary} />}
                        />
                      )}
                      <TerminalButton
                        title="SWITCH PROGRAM"
                        onPress={() => setSelectedTab('catalog')}
                        variant="outline"
                        size="sm"
                      />
                    </View>
                  </SciFiCard>

                  {/* Next Scheduled Session */}
                  {currentScheduledSession && (
                    <SciFiCard
                      title={
                        currentScheduledSession.isRestDay
                          ? 'SCHEDULED // TACTICAL BIO-RECOVERY'
                          : `NEXT DEPLOYMENT // DAY ${currentScheduledSession.dayNumber}`
                      }
                      style={{ marginTop: 14 }}
                      rightAction={
                        <Badge
                          label={currentScheduledSession.isRestDay ? 'REST DAY' : 'TRAINING DAY'}
                          variant={currentScheduledSession.isRestDay ? 'success' : 'primary'}
                        />
                      }
                    >
                      <Text style={styles.sessionTitle}>{currentScheduledSession.title}</Text>
                      <Text style={styles.sessionFocus}>
                        {currentScheduledSession.focus}
                      </Text>

                      {currentScheduledSession.isRestDay ? (
                        <View style={styles.restDayNotice}>
                          <Ionicons name="leaf-outline" size={24} color={THEME.colors.success} />
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.restTitle}>PLANNED RECOVERY WINDOW</Text>
                            <Text style={styles.restBody}>
                              Rest days are essential for myofibrillar protein synthesis, central nervous system restoration, and injury prevention. Taking your planned rest days never assesses penalties or deductions in GrimIron.
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.prescribedHeading}>PRESCRIBED EXERCISE ROSTER:</Text>
                          {currentScheduledSession.exercises.map((e, idx) => (
                            <View key={e.id} style={styles.exercisePrescriptionRow}>
                              <Text style={styles.exOrder}>{idx + 1}.</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.exName}>{e.exerciseName}</Text>
                                <Text style={styles.exPrescDetails}>
                                  {e.targetSets} sets × {e.targetRepsMin}
                                  {e.targetRepsMax !== e.targetRepsMin ? `-${e.targetRepsMax}` : ''} reps
                                  {e.tempo ? ` | Tempo: ${e.tempo}` : ''}
                                  {e.restIntervalSeconds ? ` | Rest: ${e.restIntervalSeconds}s` : ''}
                                </Text>
                                {e.notes && <Text style={styles.exNoteText}>{e.notes}</Text>}
                              </View>
                            </View>
                          ))}

                          <TerminalButton
                            title="DEPLOY SCHEDULED WORKOUT"
                            onPress={() => {
                              onStartScheduledWorkout(currentScheduledSession);
                              onClose();
                            }}
                            variant="primary"
                            size="lg"
                            icon={<Ionicons name="flash-outline" size={18} color="#0A0E17" />}
                            style={{ marginTop: 16 }}
                          />
                        </>
                      )}
                    </SciFiCard>
                  )}
                </>
              ) : (
                <SciFiCard title="NO ACTIVE PROGRAM ENROLLMENT">
                  <Text style={styles.noActiveText}>
                    You have not enrolled in a structured training program. Selecting a program organizes your training into structured weeks, sets target volume, and links directly with campaign sector progression.
                  </Text>
                  <TerminalButton
                    title="BROWSE PROGRAM CATALOG"
                    onPress={() => setSelectedTab('catalog')}
                    variant="primary"
                    size="md"
                    style={{ marginTop: 14 }}
                  />
                </SciFiCard>
              )}
            </View>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PROGRAM CATALOG                                    */}
          {/* ========================================================= */}
          {selectedTab === 'catalog' && (
            <View>
              {/* Category Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORY_TABS.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catPill,
                      selectedCategory === cat.id && styles.catPillActive,
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.catPillText,
                        selectedCategory === cat.id && styles.catPillTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Program Cards */}
              {filteredPrograms.map((program) => {
                const isCurrent = activeEnrollment?.programId === program.id;
                return (
                  <SciFiCard
                    key={program.id}
                    title={program.title.toUpperCase()}
                    variant={isCurrent ? 'accent' : 'normal'}
                    style={{ marginTop: 12 }}
                    rightAction={
                      isCurrent ? (
                        <Badge label="ACTIVE" variant="primary" />
                      ) : (
                        <Badge label={program.category.toUpperCase()} variant="secondary" />
                      )
                    }
                  >
                    <Text style={styles.cardDesc}>{program.shortDescription}</Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color={THEME.colors.primary} />
                        <Text style={styles.metaText}>{program.durationWeeks} Weeks</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={THEME.colors.secondary} />
                        <Text style={styles.metaText}>{program.frequencyDaysPerWeek} Days/Wk</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="speedometer-outline" size={14} color={THEME.colors.warning} />
                        <Text style={styles.metaText}>{program.difficulty.toUpperCase()}</Text>
                      </View>
                    </View>

                    {/* Scientific / Lore Source Citation */}
                    <View style={styles.sourceBox}>
                      <Ionicons name="book-outline" size={13} color={THEME.colors.textMuted} />
                      <Text style={styles.sourceText} numberOfLines={2}>
                        {program.sourceNote}
                      </Text>
                    </View>

                    <View style={styles.cardActions}>
                      <TerminalButton
                        title={isCurrent ? 'CONTINUE SCHEDULE' : 'ENROLL IN PROGRAM'}
                        onPress={() => handleEnrollClick(program)}
                        variant={isCurrent ? 'secondary' : 'primary'}
                        size="md"
                      />
                    </View>
                  </SciFiCard>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 8,
  },
  closeBtn: {
    padding: 6,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceHighlight,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  modeTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.primary,
    backgroundColor: THEME.colors.surface,
  },
  modeTabText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  modeTabTextActive: {
    color: THEME.colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  programDescText: {
    color: THEME.colors.textMain,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surfaceHighlight,
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  statCell: {
    alignItems: 'center',
  },
  statVal: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '800',
  },
  statLbl: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  sessionTitle: {
    color: THEME.colors.textBright,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sessionFocus: {
    color: THEME.colors.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 12,
  },
  restDayNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(56, 178, 172, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.success,
    padding: 12,
    borderRadius: 4,
    marginTop: 6,
  },
  restTitle: {
    color: THEME.colors.success,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  restBody: {
    color: THEME.colors.textMain,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  prescribedHeading: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  exercisePrescriptionRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  exOrder: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    width: 20,
  },
  exName: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '700',
  },
  exPrescDetails: {
    color: THEME.colors.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  exNoteText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  noActiveText: {
    color: THEME.colors.textMain,
    fontSize: 13,
    lineHeight: 18,
  },
  categoryScroll: {
    paddingBottom: 8,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  catPillActive: {
    backgroundColor: 'rgba(237, 106, 16, 0.15)',
    borderColor: THEME.colors.primary,
  },
  catPillText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  catPillTextActive: {
    color: THEME.colors.primary,
  },
  cardDesc: {
    color: THEME.colors.textMain,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: THEME.colors.textBright,
    fontSize: 11,
    fontWeight: '600',
  },
  sourceBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: THEME.colors.surfaceHighlight,
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  sourceText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  cardActions: {
    marginTop: 4,
  },
});
