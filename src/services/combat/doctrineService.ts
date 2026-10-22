export interface CombatDoctrine {
  id: string;
  name: string;
  codename: string;
  icon: string;
  color: string;
  tagline: string;
  description: string;
  tacticalPerk: string;
  trainingStyle: string;
}

export const COMBAT_DOCTRINES: CombatDoctrine[] = [
  {
    id: 'iron_juggernaut',
    name: 'Iron Juggernaut',
    codename: 'DOCTRINE // PROTOCOL TITAN',
    icon: 'shield',
    color: '#FFB800',
    tagline: 'Heavy compound loads & kinetic crushing force',
    description:
      'Engineered for heavy powerlifters and low-rep strength specialists. Transforms raw barbell tonnage into destructive concussive shockwaves.',
    tacticalPerk: '+15% Damage on heavy sets (≤ 6 reps)',
    trainingStyle: 'Heavy Compound 1-6 Reps',
  },
  {
    id: 'serrated_cadence',
    name: 'Serrated Cadence',
    codename: 'DOCTRINE // CADENCE UNRELENTING',
    icon: 'repeat',
    color: '#00F0FF',
    tagline: 'Relentless training volume & German Volume Training',
    description:
      'Engineered for volume hypertrophy and high-set crusaders. Each completed set ratchets up sustained tactical momentum to overwhelm the target.',
    tacticalPerk: '+4% Damage per consecutive set (up to +20%) & +10% Glory XP on 15+ set sessions',
    trainingStyle: 'Volume & GVT (8-12 Reps, 10+ Sets)',
  },
  {
    id: 'scout_recon',
    name: 'Scout Recon',
    codename: 'DOCTRINE // RAPID EXTERMINATION',
    icon: 'flash',
    color: '#00E676',
    tagline: 'High-speed calisthenics & lethal weakpoint strikes',
    description:
      'Engineered for agile bodyweight operatives and high-cadence conditioning. Rapid explosive contractions bypass enemy armor plates.',
    tacticalPerk: '+20% Critical Strike Chance on bodyweight or high-rep (≥ 12 reps) sets',
    trainingStyle: 'Bodyweight & High-Rep Conditioning',
  },
];

export function getCombatDoctrineById(id: string): CombatDoctrine {
  const found = COMBAT_DOCTRINES.find((d) => d.id === id);
  return found || COMBAT_DOCTRINES[0];
}
