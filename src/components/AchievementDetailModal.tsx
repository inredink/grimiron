import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import {
  AchievementAward,
  AchievementDefinition,
  AchievementProgress,
} from '../types/achievements';
import { TIER_COLORS } from './AchievementCard';
import { getSafeIoniconsName } from '../utils/iconHelper';

interface AchievementDetailModalProps {
  visible: boolean;
  onClose: () => void;
  definition: AchievementDefinition | null;
  progress?: AchievementProgress;
  award?: AchievementAward;
}

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  visible,
  onClose,
  definition,
  progress,
  award,
}) => {
  if (!definition) return null;

  const isUnlocked = Boolean(award || progress?.isCompleted);
  const tierColor = TIER_COLORS[definition.tier] || THEME.colors.primary;

  const currentVal = progress?.currentValue ?? (isUnlocked ? definition.criterion.targetValue : 0);
  const targetVal = definition.criterion.targetValue;
  const progressPercent = Math.min(
    100,
    progress?.progressPercent ?? (isUnlocked ? 100 : Math.round((currentVal / targetVal) * 100))
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleWrap}>
              <Text style={styles.headerSubtitle}>IMPERIAL CITATION OF HONOR</Text>
              <Text style={styles.headerTitle}>{definition.name.toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={24} color={THEME.colors.textBright} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Medallion Display */}
            <View style={styles.medallionSection}>
              <View
                style={[
                  styles.medallionBox,
                  { borderColor: tierColor },
                  isUnlocked && { backgroundColor: `${tierColor}20` },
                ]}
              >
                <Ionicons
                  name={getSafeIoniconsName(definition.icon, 'trophy')}
                  size={48}
                  color={isUnlocked ? tierColor : THEME.colors.textMuted}
                />
              </View>
              <Badge
                label={`${definition.tier.toUpperCase()} TIER HONOR`}
                variant="neutral"
                style={{
                  borderColor: tierColor,
                  borderWidth: 1,
                  backgroundColor: 'transparent',
                  marginTop: 12,
                }}
              />
            </View>

            {/* Description Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>TACTICAL COMMENDATION</Text>
              <Text style={styles.infoText}>{definition.description}</Text>
            </View>

            {/* Progress Telemetry */}
            <View style={styles.infoCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.infoLabel}>PROGRESS TELEMETRY</Text>
                <Text style={styles.progressNumbers}>
                  {currentVal.toLocaleString()} / {targetVal.toLocaleString()} ({progressPercent}%)
                </Text>
              </View>
              <ProgressBar
                progress={progressPercent}
                color={isUnlocked ? THEME.colors.success : THEME.colors.primary}
                style={{ marginTop: 8 }}
              />
              <Text style={styles.criterionDetail}>
                Requirement: Reach {targetVal.toLocaleString()} {definition.criterion.type.replace(/_/g, ' ')}
              </Text>
            </View>

            {/* Rewards & Attributes */}
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>CRUSADE ATTRIBUTES</Text>
              <View style={styles.attrRow}>
                <Text style={styles.attrKey}>Honor Scope:</Text>
                <Text style={styles.attrVal}>
                  {definition.scope.toUpperCase()} LEVEL CITATION
                </Text>
              </View>
              <View style={styles.attrRow}>
                <Text style={styles.attrKey}>Classification:</Text>
                <Text style={styles.attrVal}>
                  {definition.category.toUpperCase().replace('_', ' ')}
                </Text>
              </View>
              <View style={styles.attrRow}>
                <Text style={styles.attrKey}>XP Commendation:</Text>
                <Text style={[styles.attrVal, { color: THEME.colors.primary, fontWeight: '800' }]}>
                  +{definition.rewardXp} CRUSADE XP
                </Text>
              </View>
              {award?.unlockedAt && (
                <View style={styles.attrRow}>
                  <Text style={styles.attrKey}>Conferred Date:</Text>
                  <Text style={styles.attrVal}>
                    {new Date(award.unlockedAt).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Dismiss Button */}
          <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
            <Text style={styles.confirmBtnText}>ACKNOWLEDGE HONOR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.background,
  },
  titleWrap: {
    flex: 1,
    marginRight: 8,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.textBright,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    maxHeight: 480,
  },
  scrollContent: {
    padding: 16,
  },
  medallionSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  medallionBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: THEME.colors.background,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: THEME.colors.background,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: THEME.colors.textBright,
    lineHeight: 18,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressNumbers: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  criterionDetail: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 6,
  },
  attrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  attrKey: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  attrVal: {
    fontSize: 11,
    color: THEME.colors.textBright,
  },
  confirmBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
  },
});
