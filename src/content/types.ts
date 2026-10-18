export interface RankTier {
  tier: number; // 1, 2, 3, etc.
  title: string;
  minXp: number;
  description: string;
  isCanonicalLore: boolean; // Distinguishes established canonical lore from game-modeled ranks
  loreNote?: string;
  insigniaPlaceholder?: string;
}

export interface Subfaction {
  id: string;
  factionId: string;
  name: string;
  lore: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  motto?: string;
  insigniaName?: string;
}

export interface Faction {
  id: string;
  universeId: string;
  allegiance: 'imperium' | 'chaos' | 'xenos' | string;
  name: string;
  shortDescription: string;
  lore: string;
  iconName: string; // key for vector icons or asset name
  themeColor: string;
  subfactions: Subfaction[];
  ranks: RankTier[];
  loreCriteriaNote?: string; // Documents why certain boundaries or ranks were chosen
}

export interface UniverseCatalog {
  id: string;
  name: string;
  description: string;
  factions: Faction[];
  defaultFactionId: string;
  defaultSubfactionId: string;
}
