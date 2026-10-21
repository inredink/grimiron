import { RaidTierDefinition, RaidTierId } from '../types/raidProgression';

export const RAID_TIERS: RaidTierDefinition[] = [
  {
    id: 'tier_1_initiation',
    tierNumber: 1,
    name: 'Initiation Raids',
    codeName: 'PATROL SUPPRESSION',
    description: 'Entry-level strike operations intended for newly created operatives using standard-issue starter wargear.',
    loreBriefing: 'Hostile reconnaissance vanguards have breached sector borders. Neutralize their scout masters to secure the perimeter.',
    minLevel: 1,
    minRankTier: 1,
    minGearPower: 0,
    soloHp: 4500,
    squadHp: 14000,
    gloryXpReward: 300,
    recommendedSets: 12,
    color: '#00E676',
    icon: 'shield-checkmark-outline',
    dropRarityFloor: 'Common',
  },
  {
    id: 'tier_2_field_ops',
    tierNumber: 2,
    name: 'Field Operations',
    codeName: 'TACTICAL BREACH',
    description: 'Frontline skirmishes against organized hostile infantry, awarding the first meaningful wargear upgrades.',
    loreBriefing: 'Enemy infantry detachments have fortified contested ground. Execute coordinated strikes to seize advance tactical positions.',
    minLevel: 5,
    minRankTier: 2,
    minGearPower: 140,
    requiredPreviousTierId: 'tier_1_initiation',
    soloHp: 6500,
    squadHp: 20000,
    gloryXpReward: 450,
    recommendedSets: 14,
    color: '#00E5FF',
    icon: 'locate-outline',
    dropRarityFloor: 'Uncommon',
  },
  {
    id: 'tier_3_veteran',
    tierNumber: 3,
    name: 'Veteran Raids',
    codeName: 'COUNTER-OFFENSIVE',
    description: 'High-intensity operations demanding hardened combat experience, improved armor, and specialized firearms.',
    loreBriefing: 'Hardened hostile warlords are directing concentrated assaults across the front line. Heavy weapons deployment authorized.',
    minLevel: 10,
    minRankTier: 3,
    minGearPower: 270,
    requiredPreviousTierId: 'tier_2_field_ops',
    soloHp: 9000,
    squadHp: 28000,
    gloryXpReward: 600,
    recommendedSets: 16,
    color: '#FFB800',
    icon: 'flash-outline',
    dropRarityFloor: 'Rare',
  },
  {
    id: 'tier_4_elite',
    tierNumber: 4,
    name: 'Elite Raids',
    codeName: 'SPEARHEAD INCURSION',
    description: 'Deep strike operations against fortified command positions requiring advanced wargear platforms and sustained discipline.',
    loreBriefing: 'Enemy command centers are directing planetary siege maneuvers. Infiltrate fortified redoubts and eliminate supreme commanders.',
    minLevel: 15,
    minRankTier: 4,
    minGearPower: 410,
    requiredPreviousTierId: 'tier_3_veteran',
    soloHp: 12500,
    squadHp: 38000,
    gloryXpReward: 800,
    recommendedSets: 18,
    color: '#FF9100',
    icon: 'flame-outline',
    dropRarityFloor: 'Epic',
  },
  {
    id: 'tier_5_champion',
    tierNumber: 5,
    name: 'Champion Raids',
    codeName: 'TITAN CLASH',
    description: 'Climax encounters against colossal bio-monstrosities, daemon engines, and super-heavy walker platforms.',
    loreBriefing: 'Lethal bio-titans and monstrous war machines are decimating entire regiments. Extreme fire superiority and iron willpower required.',
    minLevel: 20,
    minRankTier: 5,
    minGearPower: 550,
    requiredPreviousTierId: 'tier_4_elite',
    soloHp: 16500,
    squadHp: 50000,
    gloryXpReward: 1000,
    recommendedSets: 20,
    color: '#FF334B',
    icon: 'skull-outline',
    dropRarityFloor: 'Epic',
  },
  {
    id: 'tier_6_legendary',
    tierNumber: 6,
    name: 'Legendary Raids',
    codeName: 'SECTOR PURGE',
    description: 'Cataclysmic operations against sector-ending supreme warlords, awarding legendary battlesuit and relic chassis wargear.',
    loreBriefing: 'Ancient daemonic princes and apocalypse warlords threaten entire star systems. Stand firm or watch the sector burn.',
    minLevel: 25,
    minRankTier: 6,
    minGearPower: 690,
    requiredPreviousTierId: 'tier_5_champion',
    soloHp: 22000,
    squadHp: 70000,
    gloryXpReward: 1300,
    recommendedSets: 22,
    color: '#A29BFE',
    icon: 'nuclear-outline',
    dropRarityFloor: 'Relic',
  },
  {
    id: 'tier_7_endgame',
    tierNumber: 7,
    name: 'Endgame Crusade',
    codeName: 'THE APOCALYPSE CRUCIBLE',
    description: 'The pinnacle of tactical endurance. Grueling multi-session trials against god-engines and supreme avatars.',
    loreBriefing: 'The eternal war reaches its zenith. Only those who have forged iron bodies and conquered every previous tier dare enter the crucible.',
    minLevel: 30,
    minRankTier: 7,
    minGearPower: 840,
    requiredPreviousTierId: 'tier_6_legendary',
    soloHp: 28000,
    squadHp: 95000,
    gloryXpReward: 1600,
    recommendedSets: 24,
    color: '#E5A93C',
    icon: 'star-half-outline',
    dropRarityFloor: 'Relic',
  },
];

export const RAID_TIERS_BY_ID: Record<RaidTierId, RaidTierDefinition> = RAID_TIERS.reduce(
  (acc, tier) => {
    acc[tier.id] = tier;
    return acc;
  },
  {} as Record<RaidTierId, RaidTierDefinition>
);

export function getRaidTierById(id: RaidTierId): RaidTierDefinition {
  return RAID_TIERS_BY_ID[id] || RAID_TIERS[0];
}

export function getAllRaidTiers(): RaidTierDefinition[] {
  return RAID_TIERS;
}

export function getNextRaidTier(currentTierId: RaidTierId): RaidTierDefinition | null {
  const currentIndex = RAID_TIERS.findIndex((t) => t.id === currentTierId);
  if (currentIndex >= 0 && currentIndex < RAID_TIERS.length - 1) {
    return RAID_TIERS[currentIndex + 1];
  }
  return null;
}
