import { CharacterProgression } from '../../types/character';
import { Faction, RankTier } from '../../content/types';
import { getFactionById, getRankForXp } from '../../content/warhammer40k';
import { RaidTierId } from '../../types/raidProgression';

export const RANK_TIER_RAID_REQUIREMENTS: Record<number, { tierId: RaidTierId; raidName: string }> = {
  3: { tierId: 'tier_1_initiation', raidName: 'Initiation Raids' },
  4: { tierId: 'tier_2_field_ops', raidName: 'Field Operations' },
  5: { tierId: 'tier_3_veteran', raidName: 'Veteran Raids' },
  6: { tierId: 'tier_4_elite', raidName: 'Elite Raids' },
  7: { tierId: 'tier_5_champion', raidName: 'Champion Raids' },
};

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
 * Computes full progression details (level, rank, percentage to next level, percentage to next rank),
 * factoring in raid trial milestone requirements where applicable.
 */
export function calculateProgression(
  totalXp: number,
  faction: Faction,
  defeatedRaidTiers?: RaidTierId[]
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

  // Baseline rank determined by XP
  const { currentRank: xpRank, nextRank: xpNextRank } = getRankForXp(faction, safeXp);

  let effectiveCurrentRank = xpRank;
  let effectiveNextRank = xpNextRank;
  let isRankTrialPending = false;
  let pendingMilestoneRequirement: string | undefined = undefined;

  // If raid milestones are tracked, verify that milestones for higher ranks have been met
  if (defeatedRaidTiers !== undefined && defeatedRaidTiers !== null) {
    // Check from tier 2 up to xpRank.tier
    const sortedRanks = [...faction.ranks].sort((a, b) => a.tier - b.tier);
    let highestAttestedRank = sortedRanks[0];

    for (const rank of sortedRanks) {
      if (rank.minXp > safeXp) break; // Not enough XP

      const requirement = RANK_TIER_RAID_REQUIREMENTS[rank.tier];
      if (requirement && !defeatedRaidTiers.includes(requirement.tierId)) {
        // Milestone blocked! Cannot advance to this or higher rank
        isRankTrialPending = true;
        pendingMilestoneRequirement = `Promotion Trial: Defeat at least one ${requirement.raidName} boss to advance to ${rank.title}.`;
        break;
      }
      highestAttestedRank = rank;
    }

    effectiveCurrentRank = highestAttestedRank;
    const currentIdx = sortedRanks.findIndex((r) => r.tier === effectiveCurrentRank.tier);
    effectiveNextRank = currentIdx >= 0 && currentIdx < sortedRanks.length - 1
      ? sortedRanks[currentIdx + 1]
      : undefined;
  }

  let rankProgressPercent = 100;
  let xpNeededForNextRank: number | undefined = undefined;

  if (effectiveNextRank) {
    const rankTierBaseXp = effectiveCurrentRank.minXp;
    const rankSpan = effectiveNextRank.minXp - rankTierBaseXp;
    const progressInRank = safeXp - rankTierBaseXp;
    rankProgressPercent = rankSpan > 0
      ? Math.min(100, Math.max(0, Math.round((progressInRank / rankSpan) * 100)))
      : 100;
    xpNeededForNextRank = Math.max(0, effectiveNextRank.minXp - safeXp);
  }

  return {
    level: currentLevel,
    totalXp: safeXp,
    currentLevelBaseXp,
    nextLevelXp,
    xpInCurrentLevel,
    xpNeededForNextLevel: Math.max(0, nextLevelXp - safeXp),
    progressPercent,
    currentRankTitle: effectiveCurrentRank.title,
    currentRankTier: effectiveCurrentRank.tier,
    nextRankTitle: effectiveNextRank?.title,
    nextRankTier: effectiveNextRank?.tier,
    xpNeededForNextRank,
    rankProgressPercent,
    isRankTrialPending,
    pendingMilestoneRequirement,
  };
}
