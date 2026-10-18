import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { AttackEvent } from '../types/combat';
import { Ionicons } from '@expo/vector-icons';
import { TerminalButton } from './TerminalButton';

interface CombatLogModalProps {
  visible: boolean;
  attacks: AttackEvent[];
  totalDamage: number;
  enemyName: string;
  onClose: () => void;
}

export const CombatLogModal: React.FC<CombatLogModalProps> = ({
  visible,
  attacks,
  totalDamage,
  enemyName,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>BATTLE LOG // TACTICAL TELEMETRY</Text>
              <Text style={styles.headerTitle}>COMBAT ENGAGEMENT LOG</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>STRIKES LANDED</Text>
              <Text style={styles.statValue}>{attacks.length}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOTAL DAMAGE</Text>
              <Text style={[styles.statValue, { color: THEME.colors.danger }]}>
                {totalDamage}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TARGET</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {enemyName}
              </Text>
            </View>
          </View>

          {/* Attacks List */}
          <ScrollView style={styles.attackList} showsVerticalScrollIndicator={false}>
            {attacks.length === 0 ? (
              <Text style={styles.emptyText}>No attacks recorded yet. Complete sets to strike the enemy.</Text>
            ) : (
              attacks.map((atk, index) => (
                <View
                  key={atk.id}
                  style={[
                    styles.attackCard,
                    { borderLeftColor: atk.visualColor },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.attackIdentity}>
                      <Ionicons
                        name={atk.visualIcon as any}
                        size={16}
                        color={atk.visualColor}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.attackName, { color: atk.visualColor }]}>
                        #{index + 1} {atk.attackName}
                      </Text>
                    </View>
                    <Text style={styles.damageText}>-{atk.damage} DMG</Text>
                  </View>

                  <View style={styles.cardSub}>
                    <Text style={styles.styleText}>{atk.styleName}</Text>
                    <Text style={styles.metricsText}>
                      {atk.reps} reps {atk.weight > 0 ? `@ ${atk.weight} ${atk.unit}` : '(BW)'}
                      {atk.setClassification !== 'working' ? ` • ${atk.setClassification.toUpperCase()}` : ''}
                      {atk.isCrit ? ' • 💥 CRITICAL' : ''}
                    </Text>
                  </View>
                  {atk.flavorDescription ? (
                    <Text style={styles.flavorText}>"{atk.flavorDescription}"</Text>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>

          <TerminalButton
            title="CLOSE TELEMETRY"
            onPress={onClose}
            variant="outline"
            size="md"
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.88)',
    justifyContent: 'center',
    padding: THEME.spacing.md,
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: THEME.spacing.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLabel: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    color: THEME.colors.textBright,
    fontSize: 16,
    fontWeight: '900',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: THEME.colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValue: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: THEME.colors.surfaceBorder,
    marginHorizontal: 8,
  },
  attackList: {
    maxHeight: 320,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  attackCard: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderLeftWidth: 4,
    padding: 10,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attackIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  attackName: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  damageText: {
    color: THEME.colors.danger,
    fontSize: 13,
    fontWeight: '900',
  },
  cardSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  styleText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  metricsText: {
    color: THEME.colors.textBright,
    fontSize: 10,
    fontWeight: '600',
  },
  flavorText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
});
