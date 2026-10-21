import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { TerminalButton } from './TerminalButton';
import { getSafeIoniconsName } from '../utils/iconHelper';
import { getObjectiveGuidance } from '../content/missions/objectiveHelper';
import {
  ActiveMissionRecord,
  FactionMissionDefinition,
  MissionStatus,
  MissionObjectiveDefinition,
} from '../types/mission';

interface MissionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  mission: FactionMissionDefinition | null;
  status: MissionStatus;
  record?: ActiveMissionRecord;
  lockReason?: string;
  onAcceptMission: (mission: FactionMissionDefinition) => void;
  onClaimReward: (missionId: string) => void;
}

export const MissionDetailModal: React.FC<MissionDetailModalProps> = ({
  visible,
  onClose,
  mission,
  status,
  record,
  lockReason,
  onAcceptMission,
  onClaimReward,
}) => {
  const [expandedObjectiveId, setExpandedObjectiveId] = useState<string | null>(null);

  if (!mission) return null;

  const isCompleted = status === 'completed';
  const isActive = status === 'active';
  const isAvailable = status === 'available';
  const isLocked = status === 'locked';

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge label="ACCOMPLISHED" variant="success" />;
      case 'active':
        return <Badge label="IN PROGRESS" variant="secondary" />;
      case 'available':
        return <Badge label="AVAILABLE" variant="primary" />;
      case 'locked':
      default:
        return <Badge label="LOCKED" variant="neutral" />;
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
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color={THEME.colors.textBright} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerSubtitle}>TACTICAL MISSION BRIEFING</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {mission.title.toUpperCase()}
            </Text>
          </View>
          {getStatusBadge()}
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mission Tag Banner */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerRow}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={getSafeIoniconsName(mission.iconName, 'flag')}
                  size={32}
                  color={THEME.colors.primary}
                />
              </View>
              <View style={styles.bannerMeta}>
                <Text style={styles.bannerTitle}>{mission.title}</Text>
                <View style={styles.tagRow}>
                  <Badge
                    label={mission.factionId.toUpperCase()}
                    variant="neutral"
                    style={{ marginRight: 6 }}
                  />
                  {mission.subfactionId && (
                    <Badge
                      label={mission.subfactionId.toUpperCase()}
                      variant="primary"
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Badge
                    label={mission.difficulty.toUpperCase()}
                    variant={
                      mission.difficulty === 'boss' || mission.difficulty === 'crusade'
                        ? 'danger'
                        : 'primary'
                    }
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Narrative Briefing */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={16} color={THEME.colors.primary} />
              <Text style={styles.sectionTitle}>COMMAND BRIEFING</Text>
            </View>
            <Text style={styles.briefingText}>{mission.briefing}</Text>
            {mission.sourceNote && (
              <Text style={styles.sourceText}>
                Lore Reference: {mission.sourceNote}
              </Text>
            )}
          </View>

          {/* Objectives Breakdown */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkbox-outline" size={16} color={THEME.colors.primary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.sectionTitle}>
                  OPERATION OBJECTIVES ({mission.objectives.length})
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Tap any objective to see full explanation and how to complete it
                </Text>
              </View>
            </View>

            {mission.objectives.map((obj, idx) => {
              const prog = record?.objectives.find((o) => o.objectiveId === obj.id);
              const cur = prog?.currentValue || 0;
              const target = obj.targetValue;
              const percent = Math.min(100, Math.round((cur / target) * 100));
              const isObjDone = Boolean(prog?.isCompleted || cur >= target);
              const isExpanded = expandedObjectiveId === obj.id;
              const guidance = getObjectiveGuidance(obj);

              return (
                <TouchableOpacity
                  key={obj.id}
                  style={[styles.objectiveItem, isExpanded && styles.objectiveItemExpanded]}
                  onPress={() => setExpandedObjectiveId(isExpanded ? null : obj.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.objTopRow}>
                    <Ionicons
                      name={isObjDone ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={isObjDone ? THEME.colors.success : THEME.colors.primary}
                    />
                    <Text style={[styles.objDescription, isObjDone && styles.objDescriptionDone]}>
                      {idx + 1}. {obj.description}
                    </Text>
                    <Text style={styles.objValues}>
                      {cur.toLocaleString()} / {target.toLocaleString()}
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={THEME.colors.primary}
                      style={{ marginLeft: 6 }}
                    />
                  </View>

                  <ProgressBar
                    progress={percent}
                    color={isObjDone ? THEME.colors.success : THEME.colors.primary}
                    height={6}
                    style={{ marginTop: 6 }}
                  />

                  {/* Expanded Tactical Briefing & Explanation */}
                  {isExpanded && (
                    <View style={styles.objGuidanceBox}>
                      <View style={styles.guidanceHeader}>
                        <View style={styles.guidanceBadge}>
                          <Text style={styles.guidanceBadgeText}>{guidance.badge}</Text>
                        </View>
                        <Text style={styles.guidanceTitle}>{guidance.title}</Text>
                      </View>

                      <Text style={styles.guidanceExplanation}>{guidance.explanation}</Text>

                      <View style={styles.howToCompleteBox}>
                        <Ionicons name="information-circle-outline" size={16} color={THEME.colors.primary} />
                        <Text style={styles.howToCompleteText}>
                          <Text style={{ fontWeight: '800', color: THEME.colors.textBright }}>HOW TO COMPLETE: </Text>
                          {guidance.howToComplete}
                        </Text>
                      </View>

                      <View style={styles.guidanceMetricsRow}>
                        <Text style={styles.guidanceMetricLabel}>Progress Metric:</Text>
                        <Text style={styles.guidanceMetricValue}>
                          {cur.toLocaleString()} of {target.toLocaleString()} ({Math.max(0, target - cur).toLocaleString()} remaining)
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Rewards Dossier */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy-outline" size={16} color={THEME.colors.primary} />
              <Text style={styles.sectionTitle}>OPERATION REWARDS</Text>
            </View>

            {mission.rewards.map((r, idx) => (
              <View key={idx} style={styles.rewardItem}>
                <Ionicons
                  name={
                    r.type === 'xp'
                      ? 'star'
                      : r.type === 'title'
                      ? 'ribbon'
                      : r.type === 'equipment_ref'
                      ? 'shield'
                      : 'flag'
                  }
                  size={18}
                  color={THEME.colors.primary}
                />
                <View style={styles.rewardTextWrap}>
                  <Text style={styles.rewardDesc}>{r.description}</Text>
                  <Text style={styles.rewardSub}>
                    {r.type === 'xp'
                      ? `Glory Experience Points`
                      : r.type === 'title'
                      ? `Permanent Character Title`
                      : `Crusade Honorific`}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Locked Explanation */}
          {isLocked && lockReason && (
            <View style={styles.lockNoticeCard}>
              <Ionicons name="lock-closed" size={20} color={THEME.colors.warning} />
              <View style={styles.lockNoticeTextWrap}>
                <Text style={styles.lockNoticeTitle}>PREREQUISITE UNFULFILLED</Text>
                <Text style={styles.lockNoticeBody}>{lockReason}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Action Footer */}
        <View style={styles.actionFooter}>
          {isAvailable && (
            <TerminalButton
              title="ACCEPT & DEPLOY ON MISSION"
              onPress={() => onAcceptMission(mission)}
              variant="primary"
              size="lg"
            />
          )}

          {isActive && (
            <TerminalButton
              title="DEPLOYMENT ACTIVE // LOG WORKOUT TO PROGRESS"
              onPress={onClose}
              variant="secondary"
              size="md"
            />
          )}

          {isCompleted && !record?.isClaimed && (
            <TerminalButton
              title="CLAIM OPERATION REWARDS"
              onPress={() => onClaimReward(mission.id)}
              variant="success"
              size="lg"
            />
          )}

          {isCompleted && record?.isClaimed && (
            <TerminalButton
              title="MISSION COMPLETED & ARCHIVED"
              onPress={onClose}
              variant="outline"
              size="md"
            />
          )}

          {isLocked && (
            <TerminalButton
              title="MISSION CURRENTLY LOCKED"
              onPress={onClose}
              variant="outline"
              size="md"
            />
          )}
        </View>
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
    backgroundColor: THEME.colors.surface,
  },
  closeBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.textBright,
    letterSpacing: 0.5,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.colors.background,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bannerMeta: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.colors.textBright,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionCard: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: THEME.colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  briefingText: {
    fontSize: 13,
    color: THEME.colors.textMain,
    lineHeight: 20,
  },
  sourceText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  objectiveItem: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  objectiveItemExpanded: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#0A121E',
  },
  objGuidanceBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 240, 255, 0.2)',
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  guidanceBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 6,
  },
  guidanceBadgeText: {
    color: THEME.colors.primary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  guidanceTitle: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  guidanceExplanation: {
    color: THEME.colors.textMain,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  howToCompleteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.primary,
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
    gap: 6,
  },
  howToCompleteText: {
    flex: 1,
    color: THEME.colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  guidanceMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  guidanceMetricLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  guidanceMetricValue: {
    fontSize: 10,
    color: THEME.colors.primary,
    fontWeight: '800',
  },
  objTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  objDescription: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textBright,
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  objDescriptionDone: {
    color: THEME.colors.success,
  },
  objValues: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rewardTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  rewardDesc: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textBright,
  },
  rewardSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  lockNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 171, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 171, 0, 0.4)',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  lockNoticeTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  lockNoticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.warning,
    letterSpacing: 0.5,
  },
  lockNoticeBody: {
    fontSize: 12,
    color: THEME.colors.textMain,
    marginTop: 2,
  },
  actionFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surface,
  },
});
