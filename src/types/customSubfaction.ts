import { Subfaction } from '../content/types';

export type DoctrineTag =
  | 'aggressive'
  | 'defensive'
  | 'reconnaissance'
  | 'disciplined'
  | 'experimental'
  | 'expeditionary'
  | 'siege_masters'
  | 'stealth_infiltrators'
  | 'zealous_crusaders'
  | 'mechanized_assault';

export const DOCTRINE_TAG_LABELS: Record<DoctrineTag, string> = {
  aggressive: 'Aggressive Shock Assault',
  defensive: 'Stalwart Fortress Defense',
  reconnaissance: 'Rapid Reconnaissance & Scouting',
  disciplined: 'Ironclad Tactical Discipline',
  experimental: 'Experimental Tech & Archeotech',
  expeditionary: 'Deep Void Expeditionary',
  siege_masters: 'Heavy Siege & Attrition',
  stealth_infiltrators: 'Covert Infiltration & Sabotage',
  zealous_crusaders: 'Zealous Faith & Fanaticism',
  mechanized_assault: 'Armored & Mechanized Blitz',
};

export interface CustomSubfactionRecord {
  id: string;
  userId: string;
  parentFactionId: string;
  name: string;
  lore?: string;
  motto?: string;
  homeworld?: string;
  doctrineTags: DoctrineTag[];
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  iconUri?: string;
  iconCropMode: 'contain' | 'cover';
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomSubfactionInput {
  name: string;
  parentFactionId: string;
  lore?: string;
  motto?: string;
  homeworld?: string;
  doctrineTags?: DoctrineTag[];
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  iconUri?: string;
  iconCropMode?: 'contain' | 'cover';
}

/**
 * Converts a CustomSubfactionRecord into a standard Subfaction object
 * so that all existing UI components, portraits, and combat engines can
 * consume it without modifications to existing types.
 */
export function toSubfactionView(record: CustomSubfactionRecord): Subfaction & {
  isCustom: true;
  customIconUri?: string;
  iconCropMode: 'contain' | 'cover';
  homeworld?: string;
  doctrineTags: DoctrineTag[];
} {
  return {
    id: record.id,
    factionId: record.parentFactionId,
    name: record.name,
    lore: record.lore || `A player-founded subfaction under the banner of the parent army.`,
    motto: record.motto,
    colorScheme: {
      primary: record.primaryColor,
      secondary: record.secondaryColor,
      accent: record.accentColor,
    },
    isCustom: true,
    customIconUri: record.iconUri,
    iconCropMode: record.iconCropMode,
    homeworld: record.homeworld,
    doctrineTags: record.doctrineTags,
  };
}
