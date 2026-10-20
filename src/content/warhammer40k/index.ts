import { UniverseCatalog, Faction, Subfaction, RankTier } from '../types';
import { warhammer40kFactions } from './factions';
import { CustomSubfactionRecord, toSubfactionView } from '../../types/customSubfaction';

export const warhammer40kUniverse: UniverseCatalog = {
  id: 'warhammer40k',
  name: 'Warhammer 40,000',
  description: 'In the grim darkness of the far future, there is only war. Choose your allegiance and forge your glory in iron and sweat.',
  defaultFactionId: 'adeptus-astartes',
  defaultSubfactionId: 'ultramarines',
  factions: warhammer40kFactions,
};

export function getFactionById(factionId: string): Faction | undefined {
  return warhammer40kFactions.find((f) => f.id === factionId);
}

export function getSubfactionById(
  factionId: string,
  subfactionId?: string,
  customSubfactions?: CustomSubfactionRecord[]
): Subfaction | undefined {
  if (subfactionId && customSubfactions) {
    const custom = customSubfactions.find((c) => c.id === subfactionId);
    if (custom) {
      return toSubfactionView(custom);
    }
  }

  const faction = getFactionById(factionId);
  if (!faction) return undefined;
  if (!subfactionId) return faction.subfactions[0];
  return faction.subfactions.find((s) => s.id === subfactionId) || faction.subfactions[0];
}

export function getRankForXp(faction: Faction, xp: number): { currentRank: RankTier; nextRank?: RankTier } {
  const sortedRanks = [...faction.ranks].sort((a, b) => a.minXp - b.minXp);
  let currentRank = sortedRanks[0];
  let nextRank: RankTier | undefined = undefined;

  for (let i = 0; i < sortedRanks.length; i++) {
    if (xp >= sortedRanks[i].minXp) {
      currentRank = sortedRanks[i];
      nextRank = sortedRanks[i + 1];
    } else {
      break;
    }
  }

  return { currentRank, nextRank };
}
