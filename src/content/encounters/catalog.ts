import { EncounterTemplate, EncounterCategory } from '../../types/warfront';
import { reconEncounters } from './recon';
import { assaultEncounters } from './assault';
import { defenseEncounters } from './defense';
import { sabotageEncounters } from './sabotage';
import { huntingEncounters } from './hunting';
import { specialOpsEncounters } from './specialOps';
import { escalatingEncounters } from './escalating';
import { coopEncounters } from './coop';
import { CombatMission, EnemyDefinition } from '../../types/combat';

export const allEncounterTemplates: EncounterTemplate[] = [
  ...reconEncounters,
  ...assaultEncounters,
  ...defenseEncounters,
  ...sabotageEncounters,
  ...huntingEncounters,
  ...specialOpsEncounters,
  ...escalatingEncounters,
  ...coopEncounters,
];

export function getAllEncounterTemplates(): EncounterTemplate[] {
  return allEncounterTemplates;
}

export function getEncounterById(id: string): EncounterTemplate | undefined {
  return allEncounterTemplates.find((enc) => enc.id === id);
}

export function getEncountersByCategory(
  category: EncounterCategory | 'all'
): EncounterTemplate[] {
  if (category === 'all') return allEncounterTemplates;
  return allEncounterTemplates.filter((enc) => enc.category === category);
}

export function getEncountersByFaction(factionId: string): EncounterTemplate[] {
  return allEncounterTemplates.filter((enc) => enc.enemyFactionId === factionId);
}

export function getEncountersByDifficulty(difficulty: string): EncounterTemplate[] {
  return allEncounterTemplates.filter((enc) => enc.difficulty === difficulty);
}

/**
 * Converts an EncounterTemplate into a runtime CombatMission
 * so the player can seamlessly deploy into normal workout logging.
 */
export function convertToCombatMission(encounter: EncounterTemplate): CombatMission {
  return {
    id: `mission_${encounter.id}`,
    title: encounter.title,
    briefing: encounter.briefing,
    difficulty: encounter.difficulty,
    enemyId: encounter.id,
    recommendedSets: encounter.recommendedSets,
    gloryBonusXp: encounter.baseXpBonus,
  };
}

/**
 * Converts an EncounterTemplate into a runtime EnemyDefinition
 * compatible with the existing combatEngine damage derivation.
 */
export function convertToEnemyDefinition(encounter: EncounterTemplate): EnemyDefinition {
  return {
    id: encounter.id,
    name: encounter.enemyName,
    title: encounter.enemyTitle,
    faction: encounter.enemyFactionId,
    loreDescription: encounter.enemyLore,
    baseHealth: encounter.baseHealth,
    difficulty: encounter.difficulty,
    visual: {
      iconName: encounter.iconName,
      primaryColor: encounter.primaryColor,
      accentColor: encounter.accentColor,
      badgeText: encounter.category.toUpperCase().replace('_', ' '),
    },
    tauntQuote: encounter.tauntQuote || 'Victory belongs to the steadfast!',
    defeatQuote: encounter.defeatQuote || 'The line holds!',
  };
}
