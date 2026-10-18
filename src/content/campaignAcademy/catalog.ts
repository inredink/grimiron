import {
  CampaignAcademyTemplate,
  AcademyExperienceLevel,
  AcademyGoalCategory,
  AcademyEquipmentType,
} from '../../types/campaignAcademy';
import { firstMusterCampaign } from './firstMuster';
import { initiatesPathCampaign } from './initiatesPath';
import { forgeFoundationCampaign } from './forgeFoundation';
import { vanguardAscendantCampaign } from './vanguardAscendant';
import { battleRhythmCampaign } from './battleRhythm';
import { tacticalAthleteCampaign } from './tacticalAthlete';
import { ironCrucibleCampaign } from './ironCrucible';
import { spearheadProtocolCampaign } from './spearheadProtocol';

/**
 * Data-Driven Catalog of 90-Day Campaign Academy Templates.
 * Every template includes verified training source metadata,
 * 3-phase / 12-week structured workouts, 6 story chapters,
 * main & optional side quests, and milestone chapter bosses.
 */
export const CAMPAIGN_ACADEMY_CATALOG: CampaignAcademyTemplate[] = [
  firstMusterCampaign,
  initiatesPathCampaign,
  forgeFoundationCampaign,
  vanguardAscendantCampaign,
  battleRhythmCampaign,
  tacticalAthleteCampaign,
  ironCrucibleCampaign,
  spearheadProtocolCampaign,
];

export function getAllAcademyCampaigns(): CampaignAcademyTemplate[] {
  return CAMPAIGN_ACADEMY_CATALOG;
}

export function getAcademyCampaignById(
  id: string
): CampaignAcademyTemplate | undefined {
  return CAMPAIGN_ACADEMY_CATALOG.find((c) => c.id === id);
}

export function getCampaignsByExperience(
  level: AcademyExperienceLevel
): CampaignAcademyTemplate[] {
  return CAMPAIGN_ACADEMY_CATALOG.filter((c) => c.experienceLevel === level);
}

export function getCampaignsByGoal(
  goal: AcademyGoalCategory
): CampaignAcademyTemplate[] {
  return CAMPAIGN_ACADEMY_CATALOG.filter((c) => c.goalCategory === goal);
}

export function getCampaignsByEquipment(
  equipment: AcademyEquipmentType
): CampaignAcademyTemplate[] {
  return CAMPAIGN_ACADEMY_CATALOG.filter((c) => c.equipment === equipment);
}

/**
 * Utility to construct a custom user-defined campaign template.
 */
export function createCustomAcademyCampaign(
  title: string,
  shortDescription: string,
  experienceLevel: AcademyExperienceLevel,
  goalCategory: AcademyGoalCategory,
  equipment: AcademyEquipmentType,
  frequencyDaysPerWeek: number
): CampaignAcademyTemplate {
  const base = firstMusterCampaign;
  const customId = `acad_cust_${Date.now()}`;

  return {
    ...base,
    id: customId,
    title,
    subtitle: 'Custom User Program',
    shortDescription,
    experienceLevel,
    goalCategory,
    equipment,
    frequencyDaysPerWeek,
    trainingMethodSource: {
      methodName: 'Custom User Routine',
      historicalBasis: 'User-defined training split and exercise selection.',
      isOriginalAdaptation: false,
      adaptationNotes: 'Configured by the player.',
    },
    tags: ['custom', experienceLevel, goalCategory],
  };
}
