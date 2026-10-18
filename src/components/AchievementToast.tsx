import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { TIER_COLORS } from './AchievementCard';

interface AchievementToastProps {
  notification: {
    id: string;
    title: string;
    subtitle: string;
    details?: any;
  } | null;
  onDismiss: (id: string) => void;
  onPress?: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  notification,
  onDismiss,
  onPress,
}) => {
  if (!notification) return null;

  const tier = notification.details?.tier || 'bronze';
  const tierColor = TIER_COLORS[tier as keyof typeof TIER_COLORS] || THEME.colors.primary;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[styles.toastBox, { borderColor: tierColor }]}
      >
        <View style={[styles.iconBox, { backgroundColor: `${tierColor}25` }]}>
          <Ionicons name="trophy" size={24} color={tierColor} />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.bannerTag}>CRUSADE HONOR UNLOCKED</Text>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {notification.subtitle}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onDismiss(notification.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={20} color={THEME.colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  bannerTag: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textBright,
  },
  subtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
