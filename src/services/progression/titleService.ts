import { CharacterProfile, CharacterProgression } from '../../types/character';
import { CharacterRaidProgressionRecord } from '../../types/raidProgression';
import { warhammer40kUniverse } from '../../content/warhammer40k';

export interface TitleOption {
  id: string;
  title: string;
  category: 'rank' | 'raid' | 'campaign' | 'achievement' | 'honorary';
  unlocked: boolean;
  sourceDescription: string;
  isEquipped: boolean;
}

/**
 * Aggregates all acquired titles for a player based on:
 * 1. Current and previous faction rank promotions achieved
 * 2. Raid tiers vanquished (T1 through T7)
 * 3. Campaign academy milestone completions
 * 4. Workout / Battle achievements
 */
export function getAcquiredTitles(
  profile: CharacterProfile,
  progression: CharacterProgression,
  raidProgression?: CharacterRaidProgressionRecord,
  completedCampaignChaptersCount: number = 0,
  unlockedAchievementCount: number = 0
): TitleOption[] {
  const titles: TitleOption[] = [];
  const equippedTitle = (profile.preferredTitle || progression.currentRankTitle || '').trim().toLowerCase();

  // 1. Current Faction Rank Titles
  const faction = warhammer40kUniverse.factions.find((f) => f.id === profile.factionId);
  if (faction) {
    for (const rank of faction.ranks) {
      const isUnlocked = progression.currentRankTier >= rank.tier;
      if (isUnlocked) {
        titles.push({
          id: `rank_${faction.id}_tier_${rank.tier}`,
          title: rank.title,
          category: 'rank',
          unlocked: true,
          sourceDescription: `${faction.name} — Tier ${rank.tier}`,
          isEquipped: equippedTitle === rank.title.trim().toLowerCase(),
        });
      }
    }
  }

  // 2. Raid Tier Titles
  const raidTitlesByTier = [
    { tier: 1, title: 'Scourge of the Waaagh!', source: 'Defeated Initiation Raid (Tier 1)' },
    { tier: 2, title: 'Bane of Heretics', source: 'Defeated Field Ops Raid (Tier 2)' },
    { tier: 3, title: 'Slayer of Bio-Titans', source: 'Defeated Strike Mission Raid (Tier 3)' },
    { tier: 4, title: 'Immortal Cleaver', source: 'Defeated Vanguard Incursion Raid (Tier 4)' },
    { tier: 5, title: 'Daemon Banisher', source: 'Defeated Apocalypse Siege Raid (Tier 5)' },
    { tier: 6, title: 'Harvester of Slayers', source: 'Defeated Primarch Trial Raid (Tier 6)' },
    { tier: 7, title: 'God-Slayer of the Void', source: 'Defeated Sector Extinction Raid (Tier 7)' },
  ];

  const totalVictories = raidProgression?.totalRaidVictories || 0;
  for (const rt of raidTitlesByTier) {
    if (totalVictories >= rt.tier) {
      titles.push({
        id: `raid_tier_${rt.tier}`,
        title: rt.title,
        category: 'raid',
        unlocked: true,
        sourceDescription: rt.source,
        isEquipped: equippedTitle === rt.title.trim().toLowerCase(),
      });
    }
  }

  // 3. Campaign Academy Titles
  const campaignTitles = [
    { threshold: 1, title: 'Outpost Breacher', source: 'Completed Academy Chapter 1' },
    { threshold: 2, title: 'Siege Pioneer', source: 'Completed Academy Chapter 2' },
    { threshold: 4, title: 'Vanguard Conqueror', source: 'Completed Academy Chapter 4' },
    { threshold: 6, title: 'Crusade Master', source: 'Conquered 90-Day Campaign Academy' },
  ];

  for (const ct of campaignTitles) {
    if (completedCampaignChaptersCount >= ct.threshold) {
      titles.push({
        id: `campaign_${ct.threshold}`,
        title: ct.title,
        category: 'campaign',
        unlocked: true,
        sourceDescription: ct.source,
        isEquipped: equippedTitle === ct.title.trim().toLowerCase(),
      });
    }
  }

  // 4. Achievement / Honor Titles
  const achievementTitles = [
    { threshold: 1, title: 'Iron Initiate', source: 'Completed First Crusade Mission' },
    { threshold: 5, title: 'Ironclad Veteran', source: 'Achieved 5 Crusade Honors' },
    { threshold: 15, title: 'Centurion of Iron', source: 'Achieved 15 Crusade Honors' },
    { threshold: 30, title: 'Warmaster Supreme', source: 'Achieved 30 Crusade Honors' },
  ];

  for (const at of achievementTitles) {
    if (unlockedAchievementCount >= at.threshold) {
      titles.push({
        id: `ach_${at.threshold}`,
        title: at.title,
        category: 'achievement',
        unlocked: true,
        sourceDescription: at.source,
        isEquipped: equippedTitle === at.title.trim().toLowerCase(),
      });
    }
  }

  // Fallback: If no titles yet, guarantee the baseline initiate title is available
  if (titles.length === 0) {
    const baseTitle = progression.currentRankTitle || 'Initiate';
    titles.push({
      id: 'default_initiate',
      title: baseTitle,
      category: 'rank',
      unlocked: true,
      sourceDescription: 'Starting Rank Honor',
      isEquipped: true,
    });
  }

  return titles;
}
