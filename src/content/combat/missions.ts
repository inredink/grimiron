import { CombatMission } from '../../types/combat';

export const MISSION_CATALOG: CombatMission[] = [
  {
    id: 'mission_cultist_purge',
    title: 'Purge the Sump Shrine',
    briefing:
      'A cell of heretical cultists has defiled a geothermal generator shrine. Move swiftly, purge the insurgent vanguard, and secure the power conduits.',
    difficulty: 'patrol',
    enemyId: 'enemy_chaos_cultist',
    recommendedSets: 4,
    gloryBonusXp: 75,
  },
  {
    id: 'mission_ork_skirmish',
    title: 'Repel Greenskin Outriders',
    briefing:
      'Ork raiders are probing our defensive perimeter with crude buggies and scrap blades. Teach them respect for imperial discipline and superior iron.',
    difficulty: 'patrol',
    enemyId: 'enemy_ork_boyz',
    recommendedSets: 6,
    gloryBonusXp: 100,
  },
  {
    id: 'mission_tyranid_synapse',
    title: 'Sever the Synapse Node',
    briefing:
      'A Tyranid bio-brood is directing swarms of lesser horrors against our forward barricades. Strike the bio-warriors at the center of the web.',
    difficulty: 'skirmish',
    enemyId: 'enemy_tyranid_warrior',
    recommendedSets: 10,
    gloryBonusXp: 160,
  },
  {
    id: 'mission_necron_tomb',
    title: 'Sautekh Crypt Incursion',
    briefing:
      'Catacomb motion alarms have triggered beneath the surface. Form up ranks and shatter the advance phalanx of Gauss Immortals before they reawaken the monolith.',
    difficulty: 'skirmish',
    enemyId: 'enemy_necron_immortals',
    recommendedSets: 12,
    gloryBonusXp: 200,
  },
  {
    id: 'mission_helbrute_assault',
    title: 'Breach the Iron Sarcophagus',
    briefing:
      'An armored Helbrute has breached Sector 7. Only unrelenting heavy compound volume and crushing power can pierce its reinforced plating.',
    difficulty: 'incursion',
    enemyId: 'enemy_helbrute',
    recommendedSets: 16,
    gloryBonusXp: 300,
  },
  {
    id: 'mission_carnifex_hunt',
    title: 'Apex Bio-Titan Hunt',
    briefing:
      'A rampaging Carnifex is carving through armored bastions. Assemble your battle-brothers and dismantle this living siege engine through sheer training endurance.',
    difficulty: 'boss',
    enemyId: 'enemy_carnifex',
    recommendedSets: 20,
    gloryBonusXp: 450,
  },
  {
    id: 'mission_warboss_duel',
    title: "Crush 'Da Supreme Warboss",
    briefing:
      'Warboss Skullkrakka has challenged your crusade to single combat before his entire horde. Meet him head on, endure his blows, and break his warlord power klaw.',
    difficulty: 'boss',
    enemyId: 'enemy_ork_warboss',
    recommendedSets: 24,
    gloryBonusXp: 600,
  },
  {
    id: 'mission_crusade_daemon',
    title: 'Void Crusade: Prince of Desolation',
    briefing:
      'Azgathor has torn open the veil of reality. Only a supreme, full-scale workout campaign can banish this immortal warlord back into the eternal darkness.',
    difficulty: 'crusade',
    enemyId: 'enemy_daemon_prince',
    recommendedSets: 30,
    gloryBonusXp: 1000,
  },
];

export function getMissionById(id: string): CombatMission {
  const mission = MISSION_CATALOG.find((m) => m.id === id);
  return mission || MISSION_CATALOG[0];
}

export function getDefaultMission(): CombatMission {
  return MISSION_CATALOG[0];
}
