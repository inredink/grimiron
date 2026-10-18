import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { CombatEncounterState, AttackEvent } from '../types/combat';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';

interface CombatHudProps {
  encounter: CombatEncounterState;
  lastAttack?: AttackEvent;
  onOpenCombatLog?: () => void;
  onSwitchMission?: () => void;
}

export const CombatHud: React.FC<CombatHudProps> = ({
  encounter,
  lastAttack,
  onOpenCombatLog,
  onSwitchMission,
}) => {
  const { enemy, currentHealth, maxHealth, isDefeated, overkillDamage, attacks } =
    encounter;

  const healthPercent = maxHealth > 0 ? Math.round((currentHealth / maxHealth) * 100) : 0;

  // Flash animation for new incoming attacks
  const attackFlashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lastAttack) {
      attackFlashAnim.setValue(1);
      Animated.timing(attackFlashAnim, {
        toValue: 0,
        duration: 2500,
        useNativeDriver: true,
      }).start();
    }
  }, [lastAttack?.id, attackFlashAnim]);

  // Determine health bar color
  const getHealthBarColor = () => {
    if (isDefeated) return THEME.colors.success;
    if (healthPercent > 50) return THEME.colors.success;
    if (healthPercent > 20) return THEME.colors.warning;
    return THEME.colors.danger;
  };

  return (
    <View style={styles.hudCard}>
      {/* Enemy Bio & Mission Header */}
      <View style={styles.headerRow}>
        <View style={styles.enemyAvatarContainer}>
          <View
            style={[
              styles.enemyAvatar,
              {
                borderColor: enemy.visual.primaryColor,
                backgroundColor: '#121927',
              },
            ]}
          >
            <Ionicons
              name={enemy.visual.iconName as any}
              size={24}
              color={enemy.visual.primaryColor}
            />
          </View>
        </View>

        <View style={styles.enemyInfo}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.enemyFactionText}>{enemy.faction.toUpperCase()}</Text>
            <View
              style={[
                styles.difficultyBadge,
                { borderColor: enemy.visual.accentColor },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  { color: enemy.visual.accentColor },
                ]}
              >
                {enemy.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.enemyName} numberOfLines={1}>
            {enemy.name}
          </Text>
          <Text style={styles.enemyTitle} numberOfLines={1}>
            {enemy.title}
          </Text>
        </View>

        {onSwitchMission && (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={onSwitchMission}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="swap-horizontal" size={16} color={THEME.colors.primary} />
            <Text style={styles.switchText}>TARGET</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Health Gauge & Status */}
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeHeader}>
          <Text style={styles.gaugeLabel}>
            {isDefeated ? 'TARGET NEUTRALIZED' : 'HOSTILE BIOMASS / INTEGRITY'}
          </Text>
          <Text
            style={[
              styles.gaugeValue,
              { color: isDefeated ? THEME.colors.success : THEME.colors.textBright },
            ]}
          >
            {isDefeated ? 'PURGED (0 HP)' : `${currentHealth} / ${maxHealth} HP (${healthPercent}%)`}
          </Text>
        </View>

        <ProgressBar
          progress={healthPercent}
          color={getHealthBarColor()}
          height={8}
        />
      </View>

      {/* Defeat Banner or Live Combat Attack Feedback */}
      {isDefeated ? (
        <View style={styles.victoryBanner}>
          <Ionicons name="skull" size={16} color={THEME.colors.success} />
          <Text style={styles.victoryText}>
            TARGET SLAIN! {overkillDamage > 0 ? `+${overkillDamage} OVERKILL DMG` : 'CLEAN PURGE'}
          </Text>
        </View>
      ) : lastAttack ? (
        <Animated.View
          style={[
            styles.attackBanner,
            {
              borderColor: lastAttack.visualColor,
              opacity: attackFlashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1],
              }),
            },
          ]}
        >
          <Ionicons
            name={lastAttack.visualIcon as any}
            size={18}
            color={lastAttack.visualColor}
          />
          <View style={styles.attackTextGroup}>
            <View style={styles.attackRow}>
              <Text
                style={[styles.attackName, { color: lastAttack.visualColor }]}
                numberOfLines={1}
              >
                {lastAttack.attackName}
              </Text>
              <Text style={styles.damageBadge}>
                -{lastAttack.damage} DMG
              </Text>
            </View>
            <Text style={styles.attackSubtext}>
              {lastAttack.isCrit ? '💥 CRITICAL STRIKE! ' : ''}
              {lastAttack.styleName} • {lastAttack.reps} reps
              {lastAttack.weight > 0 ? ` @ ${lastAttack.weight} ${lastAttack.unit}` : ' (BW)'}
            </Text>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.standbyBanner}>
          <Text style={styles.standbyText}>
            Complete workout sets below to unleash tactical strikes against {enemy.name}.
          </Text>
        </View>
      )}

      {/* Combat Log Summary Bar */}
      {attacks.length > 0 && onOpenCombatLog && (
        <TouchableOpacity
          style={styles.logSummaryRow}
          onPress={onOpenCombatLog}
          activeOpacity={0.7}
        >
          <Text style={styles.logSummaryText}>
            STRIKES LANDED: {attacks.length} • TOTAL DAMAGE: {encounter.totalDamage}
          </Text>
          <View style={styles.logAction}>
            <Text style={styles.logActionText}>VIEW LOG</Text>
            <Ionicons name="chevron-forward" size={12} color={THEME.colors.primary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  hudCard: {
    backgroundColor: '#0A0F1D',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    marginBottom: THEME.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  enemyAvatarContainer: {
    marginRight: 10,
  },
  enemyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyInfo: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  enemyFactionText: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginRight: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  enemyName: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '900',
  },
  enemyTitle: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: THEME.colors.surfaceHighlight,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginLeft: 6,
  },
  switchText: {
    color: THEME.colors.primary,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
  },
  gaugeContainer: {
    marginBottom: 8,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gaugeLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  gaugeValue: {
    fontSize: 11,
    fontWeight: '900',
  },
  victoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#092317',
    borderWidth: 1,
    borderColor: THEME.colors.success,
    borderRadius: THEME.borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  victoryText: {
    color: THEME.colors.success,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  attackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101726',
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 4,
  },
  attackTextGroup: {
    flex: 1,
    marginLeft: 8,
  },
  attackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attackName: {
    fontSize: 12,
    fontWeight: '900',
    flex: 1,
    marginRight: 6,
  },
  damageBadge: {
    color: THEME.colors.danger,
    fontSize: 12,
    fontWeight: '900',
  },
  attackSubtext: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  standbyBanner: {
    paddingVertical: 4,
  },
  standbyText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  logSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 6,
    marginTop: 4,
  },
  logSummaryText: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logActionText: {
    color: THEME.colors.primary,
    fontSize: 9,
    fontWeight: '800',
    marginRight: 2,
  },
});
