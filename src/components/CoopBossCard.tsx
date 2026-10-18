import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { ProgressBar } from './ProgressBar';
import { ActiveCoopRaid } from '../types/coop';

interface CoopBossCardProps {
  raid: ActiveCoopRaid;
  pendingSyncCount?: number;
  onOpenRaidModal: () => void;
  onSyncPending?: () => void;
  onLeaveRaid?: () => void;
}

export const CoopBossCard: React.FC<CoopBossCardProps> = ({
  raid,
  pendingSyncCount = 0,
  onOpenRaidModal,
  onSyncPending,
  onLeaveRaid,
}) => {
  const hpPercent = raid.bossMaxHp > 0
    ? Math.round((raid.bossCurrentHp / raid.bossMaxHp) * 100)
    : 0;

  const getHealthBarColor = () => {
    if (raid.isDefeated) return THEME.colors.success;
    if (hpPercent > 50) return THEME.colors.primary;
    if (hpPercent > 20) return THEME.colors.warning;
    return THEME.colors.danger;
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, raid.isDefeated && { backgroundColor: THEME.colors.success }]} />
            <Text style={styles.liveText}>
              {raid.isDefeated ? 'CAMPAIGN VICTORY' : 'CO-OP SQUAD RAID'}
            </Text>
          </View>
          <Text style={styles.squadNameText}>[{raid.groupName}]</Text>
        </View>

        <TouchableOpacity onPress={onOpenRaidModal} style={styles.manageBtn}>
          <Ionicons name="people-outline" size={14} color={THEME.colors.primary} />
          <Text style={styles.manageBtnText}>SQUAD</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bossMainRow}>
        <View style={styles.avatarContainer}>
          <Ionicons
            name={(raid.bossGlyph as any) || 'bonfire-outline'}
            size={28}
            color={raid.isDefeated ? THEME.colors.success : '#FF3838'}
          />
        </View>

        <View style={styles.bossInfo}>
          <Text style={styles.bossFactionText}>{raid.bossFaction.toUpperCase()}</Text>
          <Text style={styles.bossNameText}>{raid.bossName}</Text>
          <Text style={styles.bossLoreText} numberOfLines={1}>{raid.bossLore}</Text>
        </View>
      </View>

      {/* HP Bar */}
      <View style={styles.hpSection}>
        <View style={styles.hpTextRow}>
          <Text style={styles.hpLabel}>SHARED RAID INTEGRITY</Text>
          <Text style={[styles.hpValue, raid.isDefeated && { color: THEME.colors.success }]}>
            {raid.isDefeated ? 'TARGET SLAIN' : `${raid.bossCurrentHp.toLocaleString()} / ${raid.bossMaxHp.toLocaleString()} HP (${hpPercent}%)`}
          </Text>
        </View>
        <ProgressBar
          progress={raid.bossMaxHp > 0 ? raid.bossCurrentHp / raid.bossMaxHp : 0}
          color={getHealthBarColor()}
          height={8}
        />
      </View>

      {/* Pending Sync Bar */}
      {pendingSyncCount > 0 && (
        <TouchableOpacity
          style={styles.syncAlert}
          onPress={onSyncPending}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload-outline" size={14} color={THEME.colors.warning} />
          <Text style={styles.syncAlertText}>
            {pendingSyncCount} strike{pendingSyncCount > 1 ? 's' : ''} buffered locally. Tap to sync now.
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0F1522',
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F0FF',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  squadNameText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  manageBtnText: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bossMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#172033',
    borderColor: 'rgba(255, 56, 56, 0.5)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bossInfo: {
    flex: 1,
  },
  bossFactionText: {
    fontSize: 10,
    color: '#FF4757',
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  bossNameText: {
    fontSize: 16,
    color: THEME.colors.textBright,
    fontWeight: 'bold',
  },
  bossLoreText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  hpSection: {
    marginTop: 4,
  },
  hpTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hpLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  hpValue: {
    fontSize: 11,
    color: THEME.colors.textBright,
    fontWeight: 'bold',
  },
  syncAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderColor: 'rgba(255, 184, 0, 0.4)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  syncAlertText: {
    fontSize: 11,
    color: THEME.colors.warning,
    fontWeight: '600',
  },
});
