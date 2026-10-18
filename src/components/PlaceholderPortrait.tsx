import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { THEME } from '../constants/theme';
import { Faction, Subfaction, RankTier } from '../content/types';

interface PlaceholderPortraitProps {
  faction: Faction;
  subfaction?: Subfaction;
  currentRank: RankTier;
  level: number;
  imageUrl?: string;
  size?: number;
  style?: ViewStyle;
}

export const PlaceholderPortrait: React.FC<PlaceholderPortraitProps> = ({
  faction,
  subfaction,
  currentRank,
  level,
  imageUrl,
  size = 140,
  style,
}) => {
  const primaryColor = subfaction?.colorScheme.primary || faction.themeColor || THEME.colors.primary;
  const accentColor = subfaction?.colorScheme.accent || THEME.colors.primary;

  return (
    <View style={[styles.outerFrame, { width: size, height: size }, style]}>
      {/* Reticle / Tactical Corners */}
      <View style={[styles.corner, styles.tl, { borderColor: accentColor }]} />
      <View style={[styles.corner, styles.tr, { borderColor: accentColor }]} />
      <View style={[styles.corner, styles.bl, { borderColor: accentColor }]} />
      <View style={[styles.corner, styles.br, { borderColor: accentColor }]} />

      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.innerPlaceholder, { backgroundColor: primaryColor }]}>
          {/* Subtle tactical crosshair lines */}
          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />

          {/* Insignia / Monogram display */}
          <View style={styles.insigniaCircle}>
            <Text style={styles.insigniaText}>
              {subfaction ? subfaction.name.substring(0, 2).toUpperCase() : faction.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>

          {/* Rank Tier Chevrons */}
          <View style={styles.tierContainer}>
            <Text style={styles.tierStars}>
              {'★'.repeat(Math.min(currentRank.tier, 5))}
            </Text>
          </View>
        </View>
      )}

      {/* Level Tag */}
      <View style={[styles.levelTag, { borderColor: accentColor }]}>
        <Text style={styles.levelText}>LVL {level}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerFrame: {
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 2,
    borderColor: THEME.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  innerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    opacity: 0.9,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  crosshairH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  crosshairV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  insigniaCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(11, 14, 20, 0.75)',
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insigniaText: {
    color: THEME.colors.textBright,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tierContainer: {
    position: 'absolute',
    bottom: 22,
    backgroundColor: 'rgba(11, 14, 20, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tierStars: {
    color: THEME.colors.primary,
    fontSize: 10,
    letterSpacing: 2,
  },
  levelTag: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  levelText: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  corner: {
    position: 'absolute',
    width: 10,
    height: 10,
    zIndex: 5,
  },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
});
