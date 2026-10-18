import { CharacterProgression } from '../../types/character';
import { Faction } from '../../content/types';
import { getFactionById, getRankForXp } from '../../content/warhammer40k';

/**
 * Returns the cumulative total XP required to reach a specific character level.
 * Formula: 200 * (Level - 1)^1.5 + 100 * (Level - 1)
 */
export function getCumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(200 * Math.pow(level - 1, 1.5) + 100 * (level - 1));
}

/**
 * Calculates current level from total accumulated XP.
 */
export function getLevelFromTotalXp(totalXp: number): number {
  if (totalXp <= 0) return 1;
  let level = 1;
  while (getCumulativeXpForLevel(level + 1) <= totalXp) {
    level++;
    if (level >= 100) break; // sanity cap
  }
  return level;
}

/**
 * Computes full progression details (level, rank, percentage to next level, percentage to next rank).
 */
export function calculateProgression(
  totalXp: number,
  faction: Faction
): CharacterProgression {
  const safeXp = Math.max(0, Math.floor(totalXp));
  const currentLevel = getLevelFromTotalXp(safeXp);

  const currentLevelBaseXp = getCumulativeXpForLevel(currentLevel);
  const nextLevelXp = getCumulativeXpForLevel(currentLevel + 1);

  const xpInCurrentLevel = safeXp - currentLevelBaseXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelBaseXp;

  const progressPercent = xpNeededForNextLevel > 0
    ? Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)))
    : 100;

  // Rank progression
  const { currentRank, nextRank } = getRankForXp(faction, safeXp);

  let rankProgressPercent = 100;
  let xpNeededForNextRank: number | undefined = undefined;

  if (nextRank) {
    const rankTierBaseXp = currentRank.minXp;
    const rankSpan = nextRank.minXp - rankTierBaseXp;
    const progressInRank = safeXp - rankTierBaseXp;
    rankProgressPercent = rankSpan > 0
      ? Math.min(100, Math.max(0, Math.round((progressInRank / rankSpan) * 100)))
      : 100;
    xpNeededForNextRank = Math.max(0, nextRank.minXp - safeXp);
  }

  return {
    level: currentLevel,
    totalXp: safeXp,
    currentLevelBaseXp,
    nextLevelXp,
    xpInCurrentLevel,
    xpNeededForNextLevel: Math.max(0, nextLevelXp - safeXp),
    progressPercent,
    currentRankTitle: currentRank.title,
    currentRankTier: currentRank.tier,
    nextRankTitle: nextRank?.title,
    nextRankTier: nextRank?.tier,
    xpNeededForNextRank,
    rankProgressPercent,
  };
}
