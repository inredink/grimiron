import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { getSafeIoniconsName } from '../utils/iconHelper';
import {
  ActiveMissionRecord,
  FactionMissionDefinition,
  MissionStatus,
} from '../types/mission';

interface MissionCardProps {
  mission: FactionMissionDefinition;
  status: MissionStatus;
  record?: ActiveMissionRecord;
  lockReason?: string;
  onPress: () => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  status,
  record,
  lockReason,
  onPress,
}) => {
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

  const getDifficultyBadge = () => {
    const diff = mission.difficulty;
    const variant =
      diff === 'boss' || diff === 'crusade'
        ? 'danger'
        : diff === 'incursion' || diff === 'skirmish'
        ? 'primary'
        : 'neutral';
    return <Badge label={diff.toUpperCase()} variant={variant} style={{ marginLeft: 6 }} />;
  };

  const xpReward = mission.rewards.find((r) => r.type === 'xp')?.amount || 0;
  const isLocked = status === 'locked';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.cardContainer,
        status === 'active' && styles.cardContainerActive,
        status === 'completed' && styles.cardContainerCompleted,
        isLocked && styles.cardContainerLocked,
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View
            style={[
              styles.iconBox,
              status === 'active' && { borderColor: THEME.colors.secondary },
              status === 'completed' && { borderColor: THEME.colors.success },
            ]}
          >
            <Ionicons
              name={getSafeIoniconsName(mission.iconName, 'flag-outline')}
              size={20}
              color={
                status === 'completed'
                  ? THEME.colors.success
                  : status === 'active'
                  ? THEME.colors.secondary
                  : isLocked
                  ? THEME.colors.textMuted
                  : THEME.colors.primary
              }
            />
          </View>
          <View style={styles.titleTextWrap}>
            <Text
              style={[
                styles.title,
                status === 'active' && { color: THEME.colors.textBright },
                isLocked && { color: THEME.colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {mission.title}
            </Text>
            <Text style={styles.categoryText}>
              {mission.category.toUpperCase()} // {mission.factionId.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.badgesRow}>
          {getStatusBadge()}
          {getDifficultyBadge()}
        </View>
      </View>

      {/* Short Description */}
      <Text style={styles.description} numberOfLines={2}>
        {mission.shortDescription}
      </Text>

      {/* Objectives Progress (if active or completed) */}
      {record && record.objectives.length > 0 && (
        <View style={styles.objectivesSection}>
          {mission.objectives.map((obj) => {
            const prog = record.objectives.find((o) => o.objectiveId === obj.id);
            const cur = prog?.currentValue || 0;
            const target = obj.targetValue;
            const percent = Math.min(100, Math.round((cur / target) * 100));

            return (
              <View key={obj.id} style={styles.objRow}>
                <View style={styles.objTextRow}>
                  <Text style={styles.objDesc} numberOfLines={1}>
                    {obj.description}
                  </Text>
                  <Text style={styles.objNumbers}>
                    {cur.toLocaleString()} / {target.toLocaleString()}
                  </Text>
                </View>
                <ProgressBar
                  progress={percent}
                  color={
                    prog?.isCompleted
                      ? THEME.colors.success
                      : THEME.colors.secondary
                  }
                  height={5}
                  style={{ marginTop: 3 }}
                />
              </View>
            );
          })}
        </View>
      )}

      {/* Lock Reason */}
      {isLocked && lockReason && (
        <View style={styles.lockRow}>
          <Ionicons name="lock-closed" size={12} color={THEME.colors.warning} />
          <Text style={styles.lockText}>{lockReason}</Text>
        </View>
      )}

      {/* Card Footer */}
      <View style={styles.footerRow}>
        <View style={styles.rewardsRow}>
          <Ionicons name="gift-outline" size={14} color={THEME.colors.primary} />
          <Text style={styles.rewardText}>+{xpReward} XP</Text>
          {mission.rewards.some((r) => r.type === 'title') && (
            <Badge
              label="TITLE"
              variant="neutral"
              style={{ marginLeft: 6, paddingVertical: 1, paddingHorizontal: 4 }}
            />
          )}
          {mission.rewards.some((r) => r.type === 'equipment_ref') && (
            <Badge
              label="WARGEAR"
              variant="primary"
              style={{ marginLeft: 6, paddingVertical: 1, paddingHorizontal: 4 }}
            />
          )}
        </View>

        <View style={styles.inspectBtn}>
          <Text style={styles.inspectText}>
            {status === 'available' ? 'BRIEFING' : 'DETAILS'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={THEME.colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  cardContainerActive: {
    borderColor: THEME.colors.secondary,
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
  },
  cardContainerCompleted: {
    borderColor: 'rgba(0, 230, 118, 0.4)',
    backgroundColor: 'rgba(0, 230, 118, 0.03)',
  },
  cardContainerLocked: {
    opacity: 0.7,
    borderColor: THEME.colors.surfaceBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  titleTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 0.3,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    fontSize: 12,
    color: THEME.colors.textMain,
    lineHeight: 16,
    marginBottom: 10,
  },
  objectivesSection: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  objRow: {
    marginBottom: 6,
  },
  objTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  objDesc: {
    fontSize: 11,
    color: THEME.colors.textMain,
    flex: 1,
    marginRight: 8,
  },
  objNumbers: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 171, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 171, 0, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  lockText: {
    fontSize: 11,
    color: THEME.colors.warning,
    fontWeight: '600',
    marginLeft: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    paddingTop: 8,
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    marginLeft: 4,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inspectText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginRight: 2,
  },
});
