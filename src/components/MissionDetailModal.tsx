import React from 'react';
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
import {
  ActiveMissionRecord,
  FactionMissionDefinition,
  MissionStatus,
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
                  name={(mission.iconName as any) || 'flag'}
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
              <Text style={styles.sectionTitle}>
                OPERATION OBJECTIVES ({mission.objectives.length})
              </Text>
            </View>

            {mission.objectives.map((obj, idx) => {
              const prog = record?.objectives.find((o) => o.objectiveId === obj.id);
              const cur = prog?.currentValue || 0;
              const target = obj.targetValue;
              const percent = Math.min(100, Math.round((cur / target) * 100));
              const isObjDone = Boolean(prog?.isCompleted || cur >= target);

              return (
                <View key={obj.id} style={styles.objectiveItem}>
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
                  </View>

                  <ProgressBar
                    progress={percent}
                    color={isObjDone ? THEME.colors.success : THEME.colors.primary}
                    height={6}
                    style={{ marginTop: 6 }}
                  />
                </View>
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
    marginLeft: 8,
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
