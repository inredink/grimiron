import { EquipmentSlot, FactionSlotConfig } from '../../types/equipment';

export const ALL_STANDARD_SLOTS: EquipmentSlot[] = [
  'primary_weapon',
  'secondary_weapon',
  'armor',
  'helmet',
  'insignia',
  'tactical',
  'platform',
];

export const FACTION_SLOT_CONFIGS: Record<string, FactionSlotConfig> = {
  'tau-empire': {
    factionId: 'tau-empire',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'BATTLESUIT FRAME',
    defaultArchetype: 'Fire Warrior',
  },
  'adeptus-astartes': {
    factionId: 'adeptus-astartes',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'TERMINATOR / DREADNOUGHT',
    defaultArchetype: 'Space Marine',
  },
  'astra-militarum': {
    factionId: 'astra-militarum',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'SENTINEL / BULWARK HARNESS',
    defaultArchetype: 'Guardsman',
  },
  'adeptus-mechanicus': {
    factionId: 'adeptus-mechanicus',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'CYBERNETICA CHASSIS',
    defaultArchetype: 'Skitarii',
  },
  'adeptus-custodes': {
    factionId: 'adeptus-custodes',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'ALLARUS TERMINATOR SUIT',
    defaultArchetype: 'Custodian Guard',
  },
  'adepta-sororitas': {
    factionId: 'adepta-sororitas',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'PARAGON WARSUIT',
    defaultArchetype: 'Battle Sister',
  },
  'grey-knights': {
    factionId: 'grey-knights',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'NEMESIS DREADKNIGHT',
    defaultArchetype: 'Grey Knight',
  },
  'imperial-knights': {
    factionId: 'imperial-knights',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'QUESTURIS CHASSIS',
    defaultArchetype: 'Knight Scion',
  },
  'heretic-astartes': {
    factionId: 'heretic-astartes',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'WARP-FORGED TERMINATOR',
    defaultArchetype: 'Legionary',
  },
  'chaos-space-marines': {
    factionId: 'chaos-space-marines',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'WARP-FORGED TERMINATOR',
    defaultArchetype: 'Legionary',
  },
  'death-guard': {
    factionId: 'death-guard',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'BLIGHTLORD EXOSUIT',
    defaultArchetype: 'Plague Marine',
  },
  'thousand-sons': {
    factionId: 'thousand-sons',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'SCARAB OCCULT CARAPACE',
    defaultArchetype: 'Rubric Marine',
  },
  'world-eaters': {
    factionId: 'world-eaters',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'RED BUTCHERS HARNESS',
    defaultArchetype: 'Khorne Berzerker',
  },
  'chaos-daemons': {
    factionId: 'chaos-daemons',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'GREATER DAEMONIC FORM',
    defaultArchetype: 'Lesser Daemon',
  },
  'aeldari': {
    factionId: 'aeldari',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'WRAITHGUARD FRAME',
    defaultArchetype: 'Aspect Warrior',
  },
  'drukhari': {
    factionId: 'drukhari',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'GROTESQUE / ENGINE',
    defaultArchetype: 'Kabalite Warrior',
  },
  'necrons': {
    factionId: 'necrons',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'DESTROYER BODY',
    defaultArchetype: 'Necron Warrior',
  },
  'orks': {
    factionId: 'orks',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'MEGA-ARMOR RIG',
    defaultArchetype: 'Ork Boy',
  },
  'tyranids': {
    factionId: 'tyranids',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'CARNIFEX BIOMORPH',
    defaultArchetype: 'Tyranid Warrior',
  },
  'genestealer-cults': {
    factionId: 'genestealer-cults',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'MINING EXOSUIT',
    defaultArchetype: 'Neophyte Hybrid',
  },
  'leagues-of-votann': {
    factionId: 'leagues-of-votann',
    allowedSlots: ALL_STANDARD_SLOTS,
    platformSlotLabel: 'EINHYR EXO-ARMOR',
    defaultArchetype: 'Hearthkyn Warrior',
  },
};

export function getFactionSlotConfig(factionId: string): FactionSlotConfig {
  return (
    FACTION_SLOT_CONFIGS[factionId] || {
      factionId,
      allowedSlots: ALL_STANDARD_SLOTS,
      platformSlotLabel: 'HEAVY EXOSUIT / PLATFORM',
      defaultArchetype: 'Crusader',
    }
  );
}
